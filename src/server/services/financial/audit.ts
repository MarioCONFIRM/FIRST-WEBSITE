import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { FinancialActorContext } from "./types";

type DbClient = typeof prisma | Prisma.TransactionClient;

export async function recordFinancialAuditEvent(
  db: DbClient,
  params: {
    actor: FinancialActorContext | { actorUserId: string | null; actorRole?: string | null };
    action: string;
    affectedEntity: string;
    entityReference: string;
    metadata?: Prisma.InputJsonValue | null;
  },
): Promise<void> {
  const actorUserId =
    "actorUserId" in params.actor ? params.actor.actorUserId : null;
  await db.financialAuditLog.create({
    data: {
      actorUserId: actorUserId ?? null,
      action: params.action,
      affectedEntity: params.affectedEntity,
      entityReference: params.entityReference,
      metadata: params.metadata ?? undefined,
    },
  });
}