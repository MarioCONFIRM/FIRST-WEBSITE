import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type DbClient = typeof prisma | Prisma.TransactionClient;

export async function writeAuditLog(
  db: DbClient,
  entry: {
    actorUserId?: string | null;
    action: string;
    entityType: string;
    entityId: string;
    previousValues?: Prisma.InputJsonValue | null;
    newValues?: Prisma.InputJsonValue | null;
    ipAddress?: string | null;
    userAgent?: string | null;
  },
): Promise<void> {
  await db.auditLog.create({
    data: {
      actorUserId: entry.actorUserId ?? null,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      previousValues: entry.previousValues ?? undefined,
      newValues: entry.newValues ?? undefined,
      ipAddress: entry.ipAddress ?? null,
      userAgent: entry.userAgent ?? null,
    },
  });
}
