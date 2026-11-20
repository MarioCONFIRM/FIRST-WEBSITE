import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { FinancialServiceError } from "./errors";
import type { FinancialActorContext } from "./types";

type DbClient = typeof prisma | Prisma.TransactionClient;

export async function validateAccountOwnershipAndCurrencyCompatibility(
  db: DbClient,
  params: {
    accountId: string;
    currencyCode: string;
    actor: FinancialActorContext;
    /** When provided, CUSTOMER actors must own this account (and it must match). */
    requireCustomerOwnership?: boolean;
  },
): Promise<{ accountId: string; userId: string; currencyCode: string }> {
  const account = await db.bankAccount.findUnique({
    where: { id: params.accountId },
    select: { id: true, userId: true, currencyCode: true, status: true },
  });

  if (!account) {
    throw new FinancialServiceError("NOT_FOUND", "Bank account not found.", {
      accountId: params.accountId,
    });
  }

  if (account.currencyCode !== params.currencyCode) {
    throw new FinancialServiceError(
      "CURRENCY_MISMATCH",
      "Account currency does not match the specified currency.",
      {
        accountId: params.accountId,
        accountCurrencyCode: account.currencyCode,
        currencyCode: params.currencyCode,
      },
    );
  }

  if (params.requireCustomerOwnership || params.actor.actorRole === "CUSTOMER") {
    if (params.actor.actorRole === "CUSTOMER" && account.userId !== params.actor.actorUserId) {
      throw new FinancialServiceError(
        "ACCOUNT_OWNERSHIP",
        "Unauthorized access to another customer's account.",
        { accountId: params.accountId },
      );
    }
    if (params.requireCustomerOwnership && account.userId !== params.actor.actorUserId) {
      throw new FinancialServiceError(
        "ACCOUNT_OWNERSHIP",
        "Account does not belong to the authorized customer context.",
        { accountId: params.accountId },
      );
    }
  }

  return { accountId: account.id, userId: account.userId, currencyCode: account.currencyCode };
}