import "server-only";

/**
 * Phase 006A — Financial ledger foundation constants and accounting convention.
 *
 * ACCOUNTING CONVENTION (documented):
 * - Customer bank accounts (`bank_accounts`) are treated as liability accounts
 *   from the institution's perspective.
 * - For POSTED ledger entries recorded against a customer account in a given
 *   currency: CREDIT entries increase the account's posted ledger balance and
 *   DEBIT entries decrease it.
 * - Posted ledger balance for (accountId, currencyCode) is computed as:
 *     postedBalance = sum(CREDIT amounts) - sum(DEBIT amounts)
 *   including only entries whose parent journal has been posted (status POSTED or
 *   REVERSED). DRAFT journals are excluded.
 * - Journals are single-currency records. A journal balances when
 *   totalDebit === totalCredit for that same currency (never cross-currency).
 * - This ledger is the authoritative accounting record for future simulated
 *   financial operations. Existing snapshot fields on `bank_accounts` are not
 *   modified by Phase 006A and must not be treated as mutable by clients.
 *
 * DECIMAL PRECISION AND SCALE (documented):
 * - Monetary amounts (journal totals, ledger entry amounts, financial
 *   transaction amounts) use MySQL DECIMAL(19,4).
 * - Prisma Decimal (arbitrary-precision decimal) is used for all arithmetic;
 *   JavaScript floating-point arithmetic must never be used for money.
 * - Exactly 4 fractional digits are stored; validation requires values to be
 *   positive (> 0) and representable at this scale for entries/transactions.
 */

export const MONEY_DECIMAL_PRECISION = 19;
export const MONEY_DECIMAL_SCALE = 4;

export const SUPPORTED_FINANCIAL_CURRENCIES = ["GBP", "USD", "AUD"] as const;
export type SupportedFinancialCurrency = (typeof SUPPORTED_FINANCIAL_CURRENCIES)[number];

export const FINANCIAL_JOURNAL_STATUSES = ["DRAFT", "POSTED", "REVERSED"] as const;
export type FinancialJournalStatusValue = (typeof FINANCIAL_JOURNAL_STATUSES)[number];

export const FINANCIAL_TRANSACTION_STATUSES = [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "REJECTED",
  "CANCELLED",
] as const;
export type FinancialTransactionStatusValue =
  (typeof FINANCIAL_TRANSACTION_STATUSES)[number];

export const ENTRY_TYPES = ["DEBIT", "CREDIT"] as const;
export type EntryTypeValue = (typeof ENTRY_TYPES)[number];

export const FINANCIAL_ACTOR_ROLES = ["CUSTOMER", "ADMIN", "SUPER_ADMIN"] as const;
export type FinancialActorRole = (typeof FINANCIAL_ACTOR_ROLES)[number];