import "server-only";

import { prisma } from "@/lib/prisma";
import { requirePrivilegedFinancialActor } from "./authorization";
import { SUPPORTED_FINANCIAL_CURRENCIES } from "./constants";
import { ZERO, toDecimalString } from "./decimal";
import { FinancialServiceError } from "./errors";
import type { FinancialActorContext, PostedBalanceResult } from "./types";

/**
 * Calculates posted ledger balance for a specific account and currency.
 *
 * Convention (customer liability accounts): postedBalance = sum(CREDIT) - sum(DEBIT)
 * including only entries belonging to journals that have been posted (status POSTED or
 * REVERSED). DRAFT journals are excluded. Reversals are represented by marking the
 * original journal REVERSED and posting a separate compensating POSTED journal, so both
 * are included and net to zero. No cross-currency aggregation.
 */
export async function calculatePostedLedgerBalance(params: {
  accountId: string;
  currencyCode: string;
  actor: FinancialActorContext;
}): Promise<PostedBalanceResult> {
  const { accountId, currencyCode, actor } = params;

  if (!SUPPORTED_FINANCIAL_CURRENCIES.includes(currencyCode as (typeof SUPPORTED_FINANCIAL_CURRENCIES)[number])) {
    throw new FinancialServiceError("VALIDATION_ERROR", "Unsupported currency code.", {
      currencyCode,
    });
  }

  const account = await prisma.bankAccount.findUnique({
    where: { id: accountId },
    select: { id: true, userId: true, currencyCode: true },
  });
  if (!account) {
    throw new FinancialServiceError("NOT_FOUND", "Bank account not found.", { accountId });
  }
  if (account.currencyCode !== currencyCode) {
    throw new FinancialServiceError(
      "CURRENCY_MISMATCH",
      "Requested currency does not match the account currency.",
      { accountId, accountCurrencyCode: account.currencyCode, currencyCode },
    );
  }

  // Authorization: customers may only access their own account ledger.
  if (actor.actorRole === "CUSTOMER" && account.userId !== actor.actorUserId) {
    throw new FinancialServiceError(
      "ACCOUNT_OWNERSHIP",
      "Unauthorized access to another customer's ledger.",
      { accountId },
    );
  }
  // Privileged actors (ADMIN/SUPER_ADMIN) may access for authorized operations.

  const entries = await prisma.financialLedgerEntry.findMany({
    where: {
      accountId,
      currencyCode,
      journal: { status: { in: ["POSTED", "REVERSED"] } },
    },
    select: { entryType: true, amount: true },
  });

  let debitTotal = ZERO;
  let creditTotal = ZERO;
  for (const e of entries) {
    if (e.entryType === "DEBIT") debitTotal = debitTotal.add(e.amount);
    else creditTotal = creditTotal.add(e.amount);
  }

  const postedBalance = creditTotal.sub(debitTotal);

  return {
    accountId,
    currencyCode,
    postedBalance,
    debitTotal,
    creditTotal,
    postedEntryCount: entries.length,
  };
}

/** Convenience helper: returns posted balance as fixed decimal string (4dp). */
export async function calculatePostedLedgerBalanceString(params: {
  accountId: string;
  currencyCode: string;
  actor: FinancialActorContext;
}): Promise<{ accountId: string; currencyCode: string; postedBalance: string }> {
  const result = await calculatePostedLedgerBalance(params);
  return {
    accountId: result.accountId,
    currencyCode: result.currencyCode,
    postedBalance: toDecimalString(result.postedBalance),
  };
}

/** Privileged ledger total calculation wrapper for administrative/internal use. */
export async function calculateLedgerTotalsForAccount(params: {
  accountId: string;
  currencyCode: string;
  actor: FinancialActorContext;
}): Promise<PostedBalanceResult> {
  // Explicitly require privileged role for "ledger totals" administrative access;
  // customer-scoped balance access should use calculatePostedLedgerBalance with ownership checks.
  if (params.actor.actorRole === "CUSTOMER") {
    // Still allowed only for own account via ownership enforcement below in main function.
    return calculatePostedLedgerBalance(params);
  }
  requirePrivilegedFinancialActor(params.actor);
  return calculatePostedLedgerBalance(params);
}