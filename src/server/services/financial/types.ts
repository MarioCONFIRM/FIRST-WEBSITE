import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type {
  EntryTypeValue,
  FinancialActorRole,
  FinancialJournalStatusValue,
  FinancialTransactionStatusValue,
} from "./constants";

export type FinancialActorContext = {
  actorUserId: string;
  actorRole: FinancialActorRole;
};

export type CreateDraftJournalInput = {
  journalReference: string;
  transactionType:
    | "DEPOSIT"
    | "WITHDRAWAL"
    | "TRANSFER"
    | "CURRENCY_CONVERSION"
    | "FEE"
    | "REVERSAL";
  description: string;
  currencyCode: string;
  createdByUserId: string;
  auditMetadata?: Prisma.InputJsonValue | null;
  actor: FinancialActorContext;
};

export type AddLedgerEntryInput = {
  journalId: string;
  accountId: string;
  amount: Prisma.Decimal | string;
  currencyCode: string;
  actor: FinancialActorContext;
};

export type PostJournalInput = {
  journalId: string;
  actor: FinancialActorContext;
  /** Optional audit metadata merged/recorded for the posting event. */
  postingMetadata?: Prisma.InputJsonValue | null;
};

export type ReverseJournalInput = {
  journalId: string;
  actor: FinancialActorContext;
  reversalJournalReference: string;
  reversalTransactionReference?: string;
  description?: string;
  reason?: string;
};

export type JournalBalanceValidation = {
  valid: boolean;
  journalId: string;
  status: FinancialJournalStatusValue;
  currencyCode: string;
  totalDebit: Prisma.Decimal;
  totalCredit: Prisma.Decimal;
  entryCount: number;
  issues: string[];
};

export type PostedBalanceResult = {
  accountId: string;
  currencyCode: string;
  postedBalance: Prisma.Decimal;
  debitTotal: Prisma.Decimal;
  creditTotal: Prisma.Decimal;
  postedEntryCount: number;
};

export type ReconciliationIssue = {
  code: string;
  severity: "ERROR" | "WARNING";
  message: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, unknown>;
};

export type ReconciliationReport = {
  ok: boolean;
  checkedAt: string;
  issues: ReconciliationIssue[];
  summary: {
    unbalancedPostedJournals: number;
    invalidEntryAmounts: number;
    currencyMismatches: number;
    missingAccountRelationships: number;
    duplicateReferences: number;
    invalidTransactionJournalRelationships: number;
  };
};

export type FinancialTransactionRefCheck = {
  transactionReference: string;
  exists: boolean;
  transactionId?: string;
};

export type IdempotencyKeyCheck = {
  idempotencyKey: string;
  exists: boolean;
  transactionId?: string;
};

export type { FinancialJournalStatusValue, FinancialTransactionStatusValue, EntryTypeValue };