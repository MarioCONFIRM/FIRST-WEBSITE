import "server-only";

import { prisma } from "@/lib/prisma";
import { requirePrivilegedFinancialActor } from "./authorization";
import { ZERO, isPositiveAmount } from "./decimal";
import type { FinancialActorContext, ReconciliationIssue, ReconciliationReport } from "./types";

/**
 * Reconciliation/validation service for the Phase 006A financial ledger foundation.
 * Reports problems without modifying financial records.
 * Requires privileged (ADMIN/SUPER_ADMIN) authorization.
 */
export async function reconcileFinancialLedger(params: {
  actor: FinancialActorContext;
  journalId?: string; // optional scope
  transactionId?: string; // optional scope
}): Promise<ReconciliationReport> {
  requirePrivilegedFinancialActor(params.actor);

  const issues: ReconciliationIssue[] = [];
  const summary = {
    unbalancedPostedJournals: 0,
    invalidEntryAmounts: 0,
    currencyMismatches: 0,
    missingAccountRelationships: 0,
    duplicateReferences: 0,
    invalidTransactionJournalRelationships: 0,
  };

  const journalWhere = params.journalId ? { id: params.journalId } : undefined;
  const journals = await prisma.financialJournal.findMany({
    where: journalWhere,
    select: {
      id: true,
      journalReference: true,
      status: true,
      currencyCode: true,
      totalDebit: true,
      totalCredit: true,
      entries: {
        select: {
          id: true,
          accountId: true,
          entryType: true,
          amount: true,
          currencyCode: true,
          account: { select: { id: true, currencyCode: true } },
        },
      },
    },
  });

  // Duplicate journal references (defensive; DB unique constraint should prevent)
  const refCounts = new Map<string, number>();
  for (const j of journals) {
    refCounts.set(j.journalReference, (refCounts.get(j.journalReference) ?? 0) + 1);
  }
  for (const [ref, count] of refCounts) {
    if (count > 1) {
      summary.duplicateReferences += count - 1;
      issues.push({
        code: "DUPLICATE_JOURNAL_REFERENCE",
        severity: "ERROR",
        message: `Duplicate journal reference detected: ${ref}`,
        entityType: "FinancialJournal",
        entityId: ref,
        details: { reference: ref, count },
      });
    }
  }

  for (const j of journals) {
    let debit = ZERO;
    let credit = ZERO;

    for (const e of j.entries) {
      if (!isPositiveAmount(e.amount)) {
        summary.invalidEntryAmounts += 1;
        issues.push({
          code: "INVALID_ENTRY_AMOUNT",
          severity: "ERROR",
          message: "Ledger entry amount must be greater than zero.",
          entityType: "FinancialLedgerEntry",
          entityId: e.id,
          details: { journalId: j.id, amount: e.amount.toString() },
        });
      }
      if (e.currencyCode !== j.currencyCode) {
        summary.currencyMismatches += 1;
        issues.push({
          code: "CURRENCY_MISMATCH",
          severity: "ERROR",
          message: "Ledger entry currency does not match journal currency.",
          entityType: "FinancialLedgerEntry",
          entityId: e.id,
          details: { journalId: j.id, entryCurrencyCode: e.currencyCode, journalCurrencyCode: j.currencyCode },
        });
      }
      if (!e.account) {
        summary.missingAccountRelationships += 1;
        issues.push({
          code: "MISSING_ACCOUNT_RELATIONSHIP",
          severity: "ERROR",
          message: "Ledger entry is missing a valid account relationship.",
          entityType: "FinancialLedgerEntry",
          entityId: e.id,
          details: { journalId: j.id, accountId: e.accountId },
        });
      } else if (e.account.currencyCode !== e.currencyCode) {
        summary.currencyMismatches += 1;
        issues.push({
          code: "CURRENCY_MISMATCH",
          severity: "ERROR",
          message: "Account currency does not match ledger entry currency.",
          entityType: "FinancialLedgerEntry",
          entityId: e.id,
          details: { journalId: j.id, accountId: e.accountId, accountCurrencyCode: e.account.currencyCode, entryCurrencyCode: e.currencyCode },
        });
      }

      if (e.entryType === "DEBIT") debit = debit.add(e.amount);
      else credit = credit.add(e.amount);
    }

    // Stored totals consistency (informational/error if inconsistent)
    if (!j.totalDebit.eq(debit) || !j.totalCredit.eq(credit)) {
      issues.push({
        code: "JOURNAL_TOTAL_MISMATCH",
        severity: "ERROR",
        message: "Stored journal totals do not match the sum of ledger entries.",
        entityType: "FinancialJournal",
        entityId: j.id,
        details: {
          storedTotalDebit: j.totalDebit.toString(),
          storedTotalCredit: j.totalCredit.toString(),
          computedTotalDebit: debit.toString(),
          computedTotalCredit: credit.toString(),
        },
      });
    }

    // Journals that have been posted (POSTED or REVERSED) must be balanced and valid.
    if (j.status === "POSTED" || j.status === "REVERSED") {
      const unbalanced = !debit.eq(credit) || debit.eq(ZERO) || credit.eq(ZERO) || j.entries.length < 2;
      if (unbalanced) {
        summary.unbalancedPostedJournals += 1;
        issues.push({
          code: "UNBALANCED_POSTED_JOURNAL",
          severity: "ERROR",
          message: "Posted journal is unbalanced, empty, or has fewer than two entries.",
          entityType: "FinancialJournal",
          entityId: j.id,
          details: {
            journalReference: j.journalReference,
            status: j.status,
            entryCount: j.entries.length,
            totalDebit: debit.toString(),
            totalCredit: credit.toString(),
          },
        });
      }
    }
  }

  // Financial transactions and their journal relationships
  const txWhere = params.transactionId ? { id: params.transactionId } : undefined;
  const transactions = await prisma.financialTransaction.findMany({
    where: txWhere,
    select: {
      id: true,
      transactionReference: true,
      currencyCode: true,
      transactionType: true,
      journalId: true,
      accountId: true,
      customerId: true,
      journal: {
        select: { id: true, currencyCode: true, transactionType: true, status: true },
      },
    },
  });

  const txRefCounts = new Map<string, number>();
  for (const t of transactions) {
    txRefCounts.set(t.transactionReference, (txRefCounts.get(t.transactionReference) ?? 0) + 1);
  }
  for (const [ref, count] of txRefCounts) {
    if (count > 1) {
      summary.duplicateReferences += count - 1;
      issues.push({
        code: "DUPLICATE_TRANSACTION_REFERENCE",
        severity: "ERROR",
        message: `Duplicate financial transaction reference detected: ${ref}`,
        entityType: "FinancialTransaction",
        entityId: ref,
        details: { reference: ref, count },
      });
    }
  }

  for (const t of transactions) {
    if (t.journalId) {
      if (!t.journal) {
        summary.invalidTransactionJournalRelationships += 1;
        issues.push({
          code: "INVALID_TRANSACTION_JOURNAL_RELATIONSHIP",
          severity: "ERROR",
          message: "Financial transaction references a missing journal.",
          entityType: "FinancialTransaction",
          entityId: t.id,
          details: { journalId: t.journalId, transactionReference: t.transactionReference },
        });
      } else {
        if (t.journal.currencyCode !== t.currencyCode) {
          summary.invalidTransactionJournalRelationships += 1;
          issues.push({
            code: "INVALID_TRANSACTION_JOURNAL_RELATIONSHIP",
            severity: "ERROR",
            message: "Financial transaction currency does not match linked journal currency.",
            entityType: "FinancialTransaction",
            entityId: t.id,
            details: {
              transactionCurrencyCode: t.currencyCode,
              journalCurrencyCode: t.journal.currencyCode,
              journalId: t.journalId,
            },
          });
        }
        if (t.journal.transactionType !== t.transactionType) {
          summary.invalidTransactionJournalRelationships += 1;
          issues.push({
            code: "INVALID_TRANSACTION_JOURNAL_RELATIONSHIP",
            severity: "ERROR",
            message: "Financial transaction type does not match linked journal transaction type.",
            entityType: "FinancialTransaction",
            entityId: t.id,
            details: {
              transactionType: t.transactionType,
              journalTransactionType: t.journal.transactionType,
              journalId: t.journalId,
            },
          });
        }
      }
    }
  }

  return {
    ok: issues.length === 0,
    checkedAt: new Date().toISOString(),
    issues,
    summary,
  };
}