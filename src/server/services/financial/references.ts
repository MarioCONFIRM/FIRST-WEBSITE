import "server-only";

import { prisma } from "@/lib/prisma";
import type { FinancialTransactionRefCheck, IdempotencyKeyCheck } from "./types";

export async function checkTransactionReference(
  transactionReference: string,
): Promise<FinancialTransactionRefCheck> {
  const existing = await prisma.financialTransaction.findUnique({
    where: { transactionReference },
    select: { id: true },
  });
  return existing
    ? { transactionReference, exists: true, transactionId: existing.id }
    : { transactionReference, exists: false };
}

export async function checkIdempotencyKey(
  idempotencyKey: string,
): Promise<IdempotencyKeyCheck> {
  const existing = await prisma.financialTransaction.findUnique({
    where: { idempotencyKey },
    select: { id: true },
  });
  return existing
    ? { idempotencyKey, exists: true, transactionId: existing.id }
    : { idempotencyKey, exists: false };
}