import "server-only";

import { connection } from "next/server";
import { headers } from "next/headers";

import { prisma } from "@/lib/prisma";

import { SESSION_ROTATION_MS } from "./constants";
import {
  computeSessionExpiry,
  deleteSessionCookie,
  getSessionCookieToken,
  setSessionCookie,
} from "./cookies";
import { generateToken, hashToken } from "./crypto";

export type SessionWithUser = {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: "CUSTOMER" | "ADMIN" | "SUPER_ADMIN";
    accountStatus: "ACTIVE" | "FROZEN" | "SUSPENDED" | "CLOSED";
    emailVerified: boolean;
    emailVerifiedAt: Date | null;
  };
};

async function getRequestMetadata() {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for");
    const ip = (forwarded?.split(",")[0] || h.get("x-real-ip") || "").trim() || null;
    const ua = h.get("user-agent")?.slice(0, 512) || null;
    return { ipAddress: ip, userAgent: ua };
  } catch {
    return { ipAddress: null, userAgent: null };
  }
}

export async function createSession(
  userId: string,
  options?: { rotateFromSessionId?: string },
): Promise<{ token: string; expiresAt: Date; sessionId: string }> {
  const token = generateToken(32);
  const tokenHash = hashToken(token);
  const expiresAt = computeSessionExpiry();
  const meta = await getRequestMetadata();

  const session = await prisma.$transaction(async (tx) => {
    if (options?.rotateFromSessionId) {
      await tx.session.updateMany({
        where: { id: options.rotateFromSessionId, userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return tx.session.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
        lastUsedAt: new Date(),
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
      select: { id: true },
    });
  });

  await setSessionCookie(token, expiresAt);
  return { token, expiresAt, sessionId: session.id };
}

export async function getActiveSession(): Promise<SessionWithUser | null> {
  await connection();
  const token = await getSessionCookieToken();
  if (!token) return null;
  const tokenHash = hashToken(token);
  const now = new Date();

  const session = await prisma.session.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      revokedAt: true,
      createdAt: true,
      lastUsedAt: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          accountStatus: true,
          emailVerified: true,
          emailVerifiedAt: true,
        },
      },
    },
  });

  if (!session || session.revokedAt || session.expiresAt <= now) {
    // Cookie mutation is not allowed during Server Component rendering.
    // Treat invalid/expired/revoked sessions as unauthenticated; cleanup
    // happens via server actions/route handlers where cookie mutation is allowed.
    if (session) {
      await deleteSessionCookie().catch(() => undefined);
    }
    return null;
  }

  // Best-effort activity/rotation updates. Fail closed on revoked/expired only.
  const shouldRotate =
    now.getTime() - session.createdAt.getTime() > SESSION_ROTATION_MS;

  if (shouldRotate) {
    try {
      const rotated = await createSession(session.userId, { rotateFromSessionId: session.id });
      return {
        id: rotated.sessionId,
        userId: session.userId,
        expiresAt: rotated.expiresAt,
        createdAt: now,
        user: session.user,
      };
    } catch {
      // Cookie mutation can be disallowed during render; keep current valid session.
      // Rotation will be attempted on a subsequent request in a mutable context.
    }
  }

  await prisma.session
    .update({
      where: { id: session.id },
      data: { lastUsedAt: now },
    })
    .catch(() => undefined);

  return {
    id: session.id,
    userId: session.userId,
    expiresAt: session.expiresAt,
    createdAt: session.createdAt,
    user: session.user,
  };
}

export async function revokeSession(sessionId: string): Promise<void> {
  await prisma.session.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function logoutCurrentSession(): Promise<void> {
  const token = await getSessionCookieToken();
  if (token) {
    const tokenHash = hashToken(token);
    await prisma.session.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  await deleteSessionCookie();
}
