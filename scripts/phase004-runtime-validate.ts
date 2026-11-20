import "dotenv/config";

import { createHash, randomBytes, randomInt } from "node:crypto";

import { hash, verify } from "@node-rs/argon2";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { PrismaClient } from "../src/generated/prisma/client";
import { parseServerEnv } from "../src/lib/env.schema";
import {
  forgotPasswordSchema,
  loginSchema,
  profileUpdateSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
} from "../src/validation/auth";

type Check = { name: string; ok: boolean; detail?: string };

function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}
function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
function generateAccountNumberCandidate(): string {
  let candidate = String(randomInt(1, 10));
  for (let i = 1; i < 12; i += 1) candidate += String(randomInt(0, 10));
  return candidate;
}

async function main() {
  const checks: Check[] = [];
  const add = (name: string, ok: boolean, detail?: string) => checks.push({ name, ok, detail });

  // Crypto/password behavior (same libs/params as implementation intent)
  const pw = "Str0ng!Passw0rd#2026";
  const pwHash = await hash(pw, { memoryCost: 19456, timeCost: 2, parallelism: 1, algorithm: 2 });
  add("Argon2id hash generated (not plaintext)", pwHash !== pw && pwHash.startsWith("$argon2id$"), pwHash.slice(0, 24));
  add("Argon2id verify correct password", await verify(pwHash, pw, { memoryCost: 19456, timeCost: 2, parallelism: 1, algorithm: 2 }));
  add("Argon2id verify rejects wrong password", !(await verify(pwHash, "Wrong!Passw0rd#2026", { memoryCost: 19456, timeCost: 2, parallelism: 1, algorithm: 2 })));

  const token = generateToken(32);
  const tokenHashed = hashToken(token);
  add("Token generation non-empty", token.length >= 32);
  add("Token hash is SHA-256 hex and not raw token", /^[a-f0-9]{64}$/.test(tokenHashed) && tokenHashed !== token);
  add("Token hash deterministic", hashToken(token) === tokenHashed);
  add("Email normalization trims/lowercases", normalizeEmail("  User.Name@Example.COM  ") === "user.name@example.com");

  // Validation behavior
  const validReg = registerSchema.safeParse({
    firstName: "Jane",
    lastName: "Doe",
    email: "jane.doe@example.com",
    phoneNumber: "+44 7700 900123",
    country: "gb",
    residentialAddress: "10 Example Street, London, SW1A 1AA",
    password: "Str0ng!Passw0rd",
    confirmPassword: "Str0ng!Passw0rd",
    termsAccepted: true,
    preferredCurrency: "GBP",
    accountType: "CURRENT",
  });
  add("Register schema accepts valid input", validReg.success);
  add("Register schema rejects invalid email", !registerSchema.safeParse({ firstName:"A",lastName:"B",email:"not-an-email",phoneNumber:"+4412345678",country:"GB",residentialAddress:"123 Main St",password:"Str0ng!Passw0rd",confirmPassword:"Str0ng!Passw0rd",termsAccepted:true,preferredCurrency:"GBP",accountType:"CURRENT" }).success);
  add("Register schema rejects weak password", !registerSchema.safeParse({ firstName:"A",lastName:"B",email:"a@example.com",phoneNumber:"+4412345678",country:"GB",residentialAddress:"123 Main St",password:"weakpassword",confirmPassword:"weakpassword",termsAccepted:true,preferredCurrency:"GBP",accountType:"CURRENT" }).success);
  add("Register schema rejects unsupported currency", !registerSchema.safeParse({ firstName:"A",lastName:"B",email:"a@example.com",phoneNumber:"+4412345678",country:"GB",residentialAddress:"123 Main St",password:"Str0ng!Passw0rd",confirmPassword:"Str0ng!Passw0rd",termsAccepted:true,preferredCurrency:"EUR",accountType:"CURRENT" }).success);
  add("Register schema rejects missing terms acceptance", !registerSchema.safeParse({ firstName:"A",lastName:"B",email:"a@example.com",phoneNumber:"+4412345678",country:"GB",residentialAddress:"123 Main St",password:"Str0ng!Passw0rd",confirmPassword:"Str0ng!Passw0rd",termsAccepted:false,preferredCurrency:"GBP",accountType:"CURRENT" }).success);
  add("Login schema accepts email/password shape", loginSchema.safeParse({ email: "a@example.com", password: "some-password" }).success);
  add("Forgot password schema accepts email", forgotPasswordSchema.safeParse({ email: "a@example.com" }).success);
  add("Resend verification schema accepts email", resendVerificationSchema.safeParse({ email: "a@example.com" }).success);
  add("Reset password schema rejects mismatched passwords", !resetPasswordSchema.safeParse({ token: "tok", password: "Str0ng!Passw0rd", confirmPassword: "Different!Passw0rd1" }).success);
  const profileParsed = profileUpdateSchema.safeParse({ firstName:"A", lastName:"B", phoneNumber:"", country:"gb", residentialAddress:"123 Main Street", role:"ADMIN", balance:"999" } as Record<string, unknown>);
  add("Profile schema accepts permitted fields", profileParsed.success);
  if (profileParsed.success) {
    const keys = Object.keys(profileParsed.data).sort();
    add("Profile schema strips/does not expose privileged fields", !keys.includes("role") && !keys.includes("balance"), keys.join(","));
  } else {
    add("Profile schema strips/does not expose privileged fields", false, "parse failed");
  }

  // DB/runtime checks (no app server-only imports)
  const env = parseServerEnv(process.env);
  const prisma = new PrismaClient({ adapter: new PrismaMariaDb(env.DATABASE_URL) });
  try {
    const currencies = await prisma.currency.findMany({
      where: { code: { in: ["GBP", "USD", "AUD"] } },
      select: { code: true, isActive: true },
      orderBy: { code: "asc" },
    });
    add("Supported currencies GBP/USD/AUD exist and active", currencies.length === 3 && currencies.every((c) => c.isActive), currencies.map((c) => c.code).join(","));

    // Account number generation format/uniqueness check (read-only)
    const candidate = generateAccountNumberCandidate();
    add("Account number candidate format (12 digits)", /^\d{12}$/.test(candidate), candidate);
    const existingAcct = await prisma.bankAccount.findUnique({ where: { accountNumber: candidate }, select: { id: true } });
    add("Account number candidate uniqueness check queryable", true, existingAcct ? "collision-found-rare" : "unique-now");

    // Auth tables accessible
    const [sessions, verifs, resets, throttles] = await Promise.all([
      prisma.session.count(),
      prisma.emailVerificationToken.count(),
      prisma.passwordResetToken.count(),
      prisma.authThrottle.count(),
    ]);
    add("Auth tables accessible (Session/EmailVerificationToken/PasswordResetToken/AuthThrottle)", [sessions, verifs, resets, throttles].every((n) => typeof n === "number"), JSON.stringify({ sessions, verifs, resets, throttles }));

    // Rolled-back transactional creation to validate schema/relations/constraints behavior without persisting
    const rollbackMarker = "PHASE004_ROLLBACK_TEST";
    let rolledBack = false;
    try {
      await prisma.$transaction(async (tx) => {
        const now = new Date();
        const email = `phase004-validate-${Date.now()}@example.invalid`;
        const user = await tx.user.create({
          data: {
            firstName: "Phase004",
            lastName: "Validator",
            email,
            phoneNumber: null,
            passwordHash: pwHash,
            country: "GB",
            residentialAddress: "Validation Address",
            role: "CUSTOMER",
            emailVerified: false,
            emailVerifiedAt: null,
            termsAcceptedAt: now,
            accountStatus: "ACTIVE",
            kycStatus: "NOT_STARTED",
          },
          select: { id: true, role: true, emailVerified: true, emailVerifiedAt: true, termsAcceptedAt: true },
        });
        add("Transactional user create (CUSTOMER, unverified)", user.role === "CUSTOMER" && user.emailVerified === false && user.emailVerifiedAt === null && !!user.termsAcceptedAt);

        const acctNumber = `9${String(Date.now()).slice(-11)}`.slice(0, 12).padEnd(12, "0");
        const bankAccount = await tx.bankAccount.create({
          data: {
            userId: user.id,
            accountNumber: acctNumber,
            accountName: "Personal Current Account",
            accountType: "CURRENT",
            currencyCode: "GBP",
            availableBalance: 0,
            ledgerBalance: 0,
            status: "ACTIVE",
          },
          select: { accountNumber: true, accountType: true, currencyCode: true, status: true, availableBalance: true, ledgerBalance: true },
        });
        add("Transactional initial account create (zero balance, ACTIVE, correct type/currency)", bankAccount.accountNumber.length >= 6 && bankAccount.accountType === "CURRENT" && bankAccount.currencyCode === "GBP" && bankAccount.status === "ACTIVE" && String(bankAccount.availableBalance) === "0" && String(bankAccount.ledgerBalance) === "0", JSON.stringify({ accountNumber: bankAccount.accountNumber, type: bankAccount.accountType, currency: bankAccount.currencyCode, status: bankAccount.status }));

        const session = await tx.session.create({
          data: {
            userId: user.id,
            tokenHash: hashToken(generateToken()),
            expiresAt: new Date(Date.now() + 60 * 60 * 1000),
            lastUsedAt: now,
          },
          select: { id: true, revokedAt: true },
        });
        add("Transactional session create", !!session.id && session.revokedAt === null);

        const ev = await tx.emailVerificationToken.create({
          data: {
            userId: user.id,
            tokenHash: hashToken(generateToken()),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
          select: { id: true, consumedAt: true },
        });
        add("Transactional email verification token create (unconsumed)", !!ev.id && ev.consumedAt === null);

        const pr = await tx.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash: hashToken(generateToken()),
            expiresAt: new Date(Date.now() + 30 * 60 * 1000),
          },
          select: { id: true, consumedAt: true },
        });
        add("Transactional password reset token create (unconsumed)", !!pr.id && pr.consumedAt === null);

        const th = await tx.authThrottle.upsert({
          where: { key_windowStart: { key: `validate:${Date.now()}`, windowStart: new Date(0) } },
          create: { key: `validate:${Date.now()}`, windowStart: new Date(0), count: 1 },
          update: { count: { increment: 1 } },
          select: { id: true, count: true },
        });
        add("Transactional auth throttle create/query", !!th.id && th.count >= 1);

        throw new Error(rollbackMarker);
      });
    } catch (e) {
      if (e instanceof Error && e.message === rollbackMarker) rolledBack = true;
      else throw e;
    }
    add("Transactional validation rolled back (no persistent test data)", rolledBack);
  } finally {
    await prisma.$disconnect();
  }

  const passed = checks.filter((c) => c.ok).length;
  const failed = checks.filter((c) => !c.ok);
  console.log(JSON.stringify({ passed, total: checks.length, failedCount: failed.length, checks }, null, 2));
  if (failed.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
