"use server";

import { redirect } from "next/navigation";

import type { Prisma } from "@/generated/prisma/client";
import { writeAuditLog } from "@/lib/audit";
import { generateUniqueAccountNumber } from "@/lib/auth/account-number";
import {
  EMAIL_VERIFICATION_TTL_MS,
  PASSWORD_RESET_TTL_MS,
} from "@/lib/auth/constants";
import { generateToken, hashToken, normalizeEmail } from "@/lib/auth/crypto";
import { requireCustomer, requireSession } from "@/lib/auth/guards";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { getRequestIp, getRequestUserAgent } from "@/lib/auth/request";
import { createSession, logoutCurrentSession } from "@/lib/auth/session";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import {
  forgotPasswordSchema,
  loginSchema,
  profileUpdateSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
} from "@/validation/auth";

export type ActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

function fieldErrorsFromZod(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }) {
  const flat = error.flatten().fieldErrors;
  const out: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(flat)) {
    if (v && v.length) out[k] = v;
  }
  return out;
}

function isRedirectError(err: unknown): boolean {
  return Boolean(
    err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as { digest?: unknown }).digest === "string" &&
      (err as { digest: string }).digest.startsWith("NEXT_REDIRECT"),
  );
}

function isPrismaUniqueError(err: unknown): boolean {
  return Boolean(
    err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: unknown }).code === "P2002",
  );
}

async function logAuthEvent(params: {
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  previousValues?: Prisma.InputJsonValue | null;
  newValues?: Prisma.InputJsonValue | null;
}) {
  const [ipAddress, userAgent] = await Promise.all([getRequestIp(), getRequestUserAgent()]);
  try {
    await writeAuditLog(prisma, {
      ...params,
      ipAddress,
      userAgent,
    });
  } catch {
    // Audit logging must not leak sensitive data or break user flows if non-critical.
  }
}

export async function registerAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phoneNumber: formData.get("phoneNumber"),
    country: formData.get("country"),
    residentialAddress: formData.get("residentialAddress"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    termsAccepted: formData.get("termsAccepted") === "on" || formData.get("termsAccepted") === "true",
    preferredCurrency: formData.get("preferredCurrency") || "GBP",
    accountType: formData.get("accountType") || "CURRENT",
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Please correct the highlighted fields.", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const data = parsed.data;
  const email = normalizeEmail(data.email);
  const ip = await getRequestIp();

  const rl = await checkRateLimit({
    key: `register:ip:${ip ?? "unknown"}`,
    windowMs: 10 * 60 * 1000,
    max: 10,
    blockMs: 15 * 60 * 1000,
  });
  if (!rl.allowed) {
    return { ok: false, message: "Too many registration attempts. Please try again later." };
  }

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return {
      ok: false,
      message: "A customer account with this email address already exists.",
      fieldErrors: { email: ["A customer account with this email address already exists."] },
    };
  }

  // Ensure selected currency exists and is active.
  const currency = await prisma.currency.findUnique({
    where: { code: data.preferredCurrency },
    select: { code: true, isActive: true },
  });
  if (!currency || !currency.isActive) {
    return { ok: false, message: "The selected currency is not available.", fieldErrors: { preferredCurrency: ["Select a supported currency."] } };
  }

  // Prevent public creation of privileged roles (customers only).
  const role = "CUSTOMER" as const;
  const accountType = data.accountType;
  const accountName =
    accountType === "BUSINESS"
      ? "Business Current Account"
      : accountType === "SAVINGS"
        ? "Personal Savings Account"
        : "Personal Current Account";

  try {
    const passwordHash = await hashPassword(data.password);
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email,
          phoneNumber: data.phoneNumber,
          country: data.country,
          residentialAddress: data.residentialAddress,
          passwordHash,
          role,
          emailVerified: false,
          emailVerifiedAt: null,
          termsAcceptedAt: now,
          accountStatus: "ACTIVE",
          kycStatus: "NOT_STARTED",
        },
        select: { id: true, email: true, firstName: true },
      });

      // Generate unique account number with DB uniqueness enforcement and retry on collision.
      let accountNumber: string | null = null;
      for (let i = 0; i < 10; i += 1) {
        const candidate = await generateUniqueAccountNumber();
        try {
          await tx.bankAccount.create({
            data: {
              userId: user.id,
              accountNumber: candidate,
              accountName,
              accountType,
              currencyCode: currency.code,
              availableBalance: 0,
              ledgerBalance: 0,
              status: "ACTIVE",
            },
          });
          accountNumber = candidate;
          break;
        } catch (err: unknown) {
          // Prisma unique constraint violation
          if (isPrismaUniqueError(err)) continue;
          throw err;
        }
      }
      if (!accountNumber) {
        throw new Error("ACCOUNT_NUMBER_COLLISION");
      }

      // Create email verification token (hashed, single-use, expiry). Do not auto-verify.
      const verificationToken = generateToken(32);
      const verificationHash = hashToken(verificationToken);
      await tx.emailVerificationToken.create({
        data: {
          userId: user.id,
          tokenHash: verificationHash,
          expiresAt: new Date(now.getTime() + EMAIL_VERIFICATION_TTL_MS),
        },
      });

      await writeAuditLog(tx, {
        actorUserId: user.id,
        action: "auth.register",
        entityType: "User",
        entityId: user.id,
        newValues: {
          email: user.email,
          role,
          accountType,
          currencyCode: currency.code,
          emailVerified: false,
        },
        ipAddress: ip,
        userAgent: await getRequestUserAgent(),
      });

      return { user, verificationToken };
    });

    // Attempt to send verification email (configurable SMTP). Tokens never exposed in response.
    // Registration/account creation is already committed; delivery issues must be handled honestly.
    let deliveryStatus: "sent" | "not_configured" | "failed" = "not_configured";
    try {
      const delivery = await sendVerificationEmail({
        to: result.user.email,
        firstName: result.user.firstName,
        token: result.verificationToken,
      });

      if (!delivery.configured) {
        deliveryStatus = "not_configured";
        await logAuthEvent({
          actorUserId: result.user.id,
          action: "auth.email_verification.delivery_not_configured",
          entityType: "User",
          entityId: result.user.id,
        });
      } else {
        deliveryStatus = delivery.sent ? "sent" : "failed";
      }
    } catch {
      deliveryStatus = "failed";
      await logAuthEvent({
        actorUserId: result.user.id,
        action: "auth.email_verification.delivery_failed",
        entityType: "User",
        entityId: result.user.id,
      });
    }

    if (deliveryStatus === "sent") {
      redirect("/login?registered=1&verify=sent");
    }
    if (deliveryStatus === "failed") {
      redirect("/login?registered=1&verify=email_failed");
    }
    redirect("/login?registered=1&verify=not_configured");
  } catch (err: unknown) {
    if (isRedirectError(err)) throw err;
    if (err instanceof Error && err.message === "ACCOUNT_NUMBER_COLLISION") {
      return { ok: false, message: "Unable to create your account at this time. Please try again." };
    }
    return { ok: false, message: "Registration could not be completed. Please try again." };
  }
}

export async function loginAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Please check your email and password and try again.", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const email = normalizeEmail(parsed.data.email);
  const password = parsed.data.password;
  const ip = await getRequestIp();
  const genericError = "Invalid email or password.";

  const [ipLimit, emailLimit] = await Promise.all([
    checkRateLimit({ key: `login:ip:${ip ?? "unknown"}`, windowMs: 15 * 60 * 1000, max: 20, blockMs: 15 * 60 * 1000 }),
    checkRateLimit({ key: `login:email:${email}`, windowMs: 15 * 60 * 1000, max: 10, blockMs: 15 * 60 * 1000 }),
  ]);
  if (!ipLimit.allowed || !emailLimit.allowed) {
    return { ok: false, message: "Too many sign-in attempts. Please try again later." };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      role: true,
      accountStatus: true,
      emailVerified: true,
      emailVerifiedAt: true,
      firstName: true,
      lastName: true,
    },
  });

  // Constant behavior to avoid account enumeration.
  const validPassword = user ? await verifyPassword(user.passwordHash, password) : await verifyPassword("$argon2id$v=19$m=19456,t=2,p=1$invalidsaltvalue$invalidhashvalue", password);
  if (!user || !validPassword || user.accountStatus !== "ACTIVE") {
    await logAuthEvent({
      actorUserId: user?.id ?? null,
      action: "auth.login.failed",
      entityType: "User",
      entityId: user?.id ?? "unknown",
    });
    return { ok: false, message: genericError };
  }

  await createSession(user.id);
  await logAuthEvent({ actorUserId: user.id, action: "auth.login.success", entityType: "User", entityId: user.id });

  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
    redirect("/admin");
  }
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  const session = await requireSession().catch(() => null);
  if (session) {
    await logAuthEvent({ actorUserId: session.user.id, action: "auth.logout", entityType: "Session", entityId: session.id });
  }
  await logoutCurrentSession();
  redirect("/login?loggedOut=1");
}

export async function resendVerificationAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = resendVerificationSchema.safeParse({ email: formData.get("email") });
  const generic: ActionState = {
    ok: true,
    message:
      "If an account exists for that email address, a verification message will be processed according to system configuration.",
  };
  if (!parsed.success) return generic;

  const email = normalizeEmail(parsed.data.email);
  const ip = await getRequestIp();
  const rl = await checkRateLimit({
    key: `verify-resend:${ip ?? "unknown"}:${email}`,
    windowMs: 15 * 60 * 1000,
    max: 3,
    blockMs: 30 * 60 * 1000,
  });
  if (!rl.allowed) return generic;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, firstName: true, emailVerified: true, accountStatus: true },
  });
  if (!user || user.emailVerified || user.accountStatus !== "ACTIVE") return generic;

  const token = generateToken(32);
  const tokenHash = hashToken(token);
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.emailVerificationToken.updateMany({
      where: { userId: user.id, consumedAt: null },
      data: { consumedAt: now },
    });
    await tx.emailVerificationToken.create({
      data: { userId: user.id, tokenHash, expiresAt: new Date(now.getTime() + EMAIL_VERIFICATION_TTL_MS) },
    });
  });

  await sendVerificationEmail({ to: user.email, firstName: user.firstName, token });
  await logAuthEvent({ actorUserId: user.id, action: "auth.email_verification.resend_requested", entityType: "User", entityId: user.id });
  return generic;
}

export async function verifyEmailToken(token: string): Promise<{ ok: boolean; message: string }> {
  if (!token) return { ok: false, message: "This verification link is invalid or has expired." };
  const tokenHash = hashToken(token);
  const now = new Date();

  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, expiresAt: true, consumedAt: true },
  });

  if (!record || record.consumedAt || record.expiresAt <= now) {
    return { ok: false, message: "This verification link is invalid, expired, or has already been used." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const fresh = await tx.emailVerificationToken.findUnique({ where: { id: record.id }, select: { consumedAt: true, expiresAt: true } });
      if (!fresh || fresh.consumedAt || fresh.expiresAt <= now) {
        throw new Error("INVALID_TOKEN");
      }
      await tx.emailVerificationToken.update({ where: { id: record.id }, data: { consumedAt: now } });
      await tx.user.update({
        where: { id: record.userId },
        data: { emailVerified: true, emailVerifiedAt: now },
      });
      await writeAuditLog(tx, {
        actorUserId: record.userId,
        action: "auth.email_verified",
        entityType: "User",
        entityId: record.userId,
        newValues: { emailVerified: true },
      });
    });
  } catch {
    return { ok: false, message: "This verification link is invalid, expired, or has already been used." };
  }

  return { ok: true, message: "Your email address has been verified." };
}

export async function verifyEmailAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = String(formData.get("token") ?? "");
  const result = await verifyEmailToken(token);
  if (result.ok) {
    redirect("/login?verified=1");
  }
  return { ok: false, message: result.message };
}


export async function forgotPasswordAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  const generic: ActionState = {
    ok: true,
    message:
      "If an account exists for that email address, password reset instructions will be processed according to system configuration.",
  };
  if (!parsed.success) return generic;

  const email = normalizeEmail(parsed.data.email);
  const ip = await getRequestIp();
  const rl = await checkRateLimit({
    key: `password-reset:${ip ?? "unknown"}:${email}`,
    windowMs: 15 * 60 * 1000,
    max: 3,
    blockMs: 30 * 60 * 1000,
  });
  if (!rl.allowed) return generic;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, firstName: true, accountStatus: true },
  });
  if (!user || user.accountStatus !== "ACTIVE") return generic;

  const token = generateToken(32);
  const tokenHash = hashToken(token);
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.passwordResetToken.updateMany({
      where: { userId: user.id, consumedAt: null },
      data: { consumedAt: now },
    });
    await tx.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt: new Date(now.getTime() + PASSWORD_RESET_TTL_MS) },
    });
  });

  await sendPasswordResetEmail({ to: user.email, firstName: user.firstName, token });
  await logAuthEvent({ actorUserId: user.id, action: "auth.password_reset.requested", entityType: "User", entityId: user.id });
  return generic;
}

export async function resetPasswordAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = {
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };
  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Please correct the highlighted fields.", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const tokenHash = hashToken(parsed.data.token);
  const now = new Date();
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, expiresAt: true, consumedAt: true },
  });

  if (!record || record.consumedAt || record.expiresAt <= now) {
    return { ok: false, message: "This password reset link is invalid, expired, or has already been used." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  try {
    await prisma.$transaction(async (tx) => {
      const fresh = await tx.passwordResetToken.findUnique({ where: { id: record.id }, select: { consumedAt: true, expiresAt: true } });
      if (!fresh || fresh.consumedAt || fresh.expiresAt <= now) throw new Error("INVALID");
      await tx.passwordResetToken.update({ where: { id: record.id }, data: { consumedAt: now } });
      await tx.user.update({ where: { id: record.userId }, data: { passwordHash } });
      await tx.session.updateMany({ where: { userId: record.userId, revokedAt: null }, data: { revokedAt: now } });
      await tx.passwordResetToken.updateMany({ where: { userId: record.userId, consumedAt: null }, data: { consumedAt: now } });
      await writeAuditLog(tx, {
        actorUserId: record.userId,
        action: "auth.password_reset.completed",
        entityType: "User",
        entityId: record.userId,
      });
    });
  } catch {
    return { ok: false, message: "This password reset link is invalid, expired, or has already been used." };
  }

  redirect("/login?reset=1");
}

export async function updateProfileAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireCustomer();
  const raw = {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phoneNumber: formData.get("phoneNumber") ?? "",
    country: formData.get("country"),
    residentialAddress: formData.get("residentialAddress"),
  };
  const parsed = profileUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Please correct the highlighted fields.", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const data = parsed.data;
  const current = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { firstName: true, lastName: true, phoneNumber: true, country: true, residentialAddress: true },
  });
  if (!current) return { ok: false, message: "Unable to update your profile." };

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: session.userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber ?? null,
        country: data.country,
        residentialAddress: data.residentialAddress,
      },
    });
    await writeAuditLog(tx, {
      actorUserId: session.userId,
      action: "profile.updated",
      entityType: "User",
      entityId: session.userId,
      previousValues: current as unknown as Prisma.InputJsonValue,
      newValues: {
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber ?? null,
        country: data.country,
        residentialAddress: data.residentialAddress,
      } as Prisma.InputJsonValue,
      ipAddress: await getRequestIp(),
      userAgent: await getRequestUserAgent(),
    });
  });

  return { ok: true, message: "Your profile has been updated." };
}
