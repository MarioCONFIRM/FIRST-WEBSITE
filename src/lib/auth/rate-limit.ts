import "server-only";

import { prisma } from "@/lib/prisma";

type RateLimitOptions = {
  key: string;
  windowMs: number;
  max: number;
  blockMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  retryAfterMs?: number;
};

/**
 * Simple DB-backed fixed-window throttling/rate limiting.
 * Keys should include action and identifier (e.g. ip/email) and be non-sensitive where possible.
 */
export async function checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(Math.floor(now.getTime() / options.windowMs) * options.windowMs);

  const record = await prisma.authThrottle.upsert({
    where: { key_windowStart: { key: options.key, windowStart } },
    create: { key: options.key, windowStart, count: 0 },
    update: {},
    select: { id: true, count: true, blockedUntil: true },
  });

  if (record.blockedUntil && record.blockedUntil > now) {
    return { allowed: false, retryAfterMs: record.blockedUntil.getTime() - now.getTime() };
  }

  const nextCount = record.count + 1;
  if (nextCount > options.max) {
    const blockedUntil = new Date(now.getTime() + options.blockMs);
    await prisma.authThrottle.update({
      where: { id: record.id },
      data: { count: nextCount, blockedUntil },
    });
    return { allowed: false, retryAfterMs: options.blockMs };
  }

  await prisma.authThrottle.update({
    where: { id: record.id },
    data: { count: nextCount },
  });
  return { allowed: true };
}
