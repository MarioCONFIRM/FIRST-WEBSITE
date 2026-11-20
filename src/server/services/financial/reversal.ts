import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { recordFinancialAuditEvent } from "./audit";
import { requirePrivilegedFinancialActor } from "./authorization";
import { ZERO, toDecimalString } from "./decimal";
import { FinancialServiceError, isPrismaUniqueConstraintError } from "./errors";
import type { ReverseJournalInput } from "./types";

/**
 * Creates and posts a compensating reversal journal for a POSTED journal, then
 * marks the original journal as REVERSED. This is the only supported reversal
 * path: authorized (ADMIN/SUPER_ADMIN), audited, and non-destructive.
 */
export async function reverseFinancialJournal(input: ReverseJournalInput) {
  requirePrivilegedFinancialActor(input.actor);

  const reversalJournalReference = input.reversalJournalReference.trim();
  if (!reversalJournalReference) {
    throw new FinancialServiceError("VALIDATION_ERROR", "Reversal journal reference is required.");
  }
  const reversalTxRef = input.reversalTransactionReference?.trim();
  const reason = input.reason?.trim() || "Authorized reversal";

  return prisma.$transaction(
    async (tx) => {
      // Lock original journal
      const locked = await tx.$queryRaw<Array<{
        id: string;
        journalReference: string;
        status: "DRAFT" | "POSTED" | "REVERSED";
        transactionType: "DEPOSIT" | "WITHDRAWAL" | "TRANSFER" | "CURRENCY_CONVERSION" | "FEE" | "REVERSAL";
        description: string;
        currencyCode: string;
        totalDebit: Prisma.Decimal;
        totalCredit: Prisma.Decimal;
      }>>`SELECT id, journalReference, status, transactionType, description, currencyCode, totalDebit, totalCredit FROM financial_journals WHERE id = ${input.journalId} FOR UPDATE`;

      const original = locked[0];
      if (!original) {
        throw new FinancialServiceError("NOT_FOUND", "Financial journal not found.", {
          journalId: input.journalId,
        });
      }
      if (original.status !== "POSTED") {
        throw new FinancialServiceError(
          "INVALID_STATE",
          "Only POSTED journals can be reversed.",
          { journalId: input.journalId, status: original.status },
        );
      }

      const entries = await tx.financialLedgerEntry.findMany({
        where: { journalId: original.id },
        select: { accountId: true, entryType: true, amount: true, currencyCode: true },
      });
      if (entries.length < 2) {
        throw new FinancialServiceError(
          "INVALID_STATE",
          "Original posted journal does not have valid entries to reverse.",
          { journalId: original.id },
        );
      }

      // Build compensating journal (swap DEBIT <-> CREDIT)
      let totalDebit = ZERO;
      let totalCredit = ZERO;
      const compensatingEntries = entries.map((e) => {
        const entryType = e.entryType === "DEBIT" ? ("CREDIT" as const) : ("DEBIT" as const);
        if (entryType === "DEBIT") totalDebit = totalDebit.add(e.amount);
        else totalCredit = totalCredit.add(e.amount);
        return {
          accountId: e.accountId,
          entryType,
          amount: e.amount,
          currencyCode: e.currencyCode,
        };
      });

      if (!totalDebit.eq(totalCredit) || totalDebit.eq(ZERO)) {
        throw new FinancialServiceError(
          "UNBALANCED_JOURNAL",
          "Compensating reversal journal would not be balanced.",
        );
      }

      const description =
        (input.description?.trim() ||
          `Reversal of journal ${original.journalReference}: ${original.description}`).slice(0, 5000);

      let reversalJournal;
      try {
        reversalJournal = await tx.financialJournal.create({
          data: {
            journalReference: reversalJournalReference,
            transactionType: "REVERSAL",
            status: "DRAFT",
            description,
            currencyCode: original.currencyCode,
            totalDebit,
            totalCredit,
            createdByUserId: input.actor.actorUserId,
            auditMetadata: {
              reversalOfJournalId: original.id,
              reversalOfJournalReference: original.journalReference,
              reason,
            } as Prisma.InputJsonValue,
            entries: {
              create: compensatingEntries,
            },
          },
        });
      } catch (err) {
        if (isPrismaUniqueConstraintError(err)) {
          throw new FinancialServiceError(
            "DUPLICATE_REFERENCE",
            "A financial journal with the reversal reference already exists.",
            { journalReference: reversalJournalReference },
          );
        }
        throw err;
      }

      const postedAt = new Date();
      const postedReversal = await tx.financialJournal.update({
        where: { id: reversalJournal.id },
        data: { status: "POSTED", postedAt },
      });

      // Mark original as REVERSED (only allowed posted->reversed transition by trigger)
      await tx.financialJournal.update({
        where: { id: original.id },
        data: { status: "REVERSED" },
      });

      // Optional financial transaction record linking reversal (if reference provided)
      let reversalTransactionId: string | null = null;
      if (reversalTxRef) {
        try {
          const txRecord = await tx.financialTransaction.create({
            data: {
              transactionReference: reversalTxRef,
              transactionType: "REVERSAL",
              transactionStatus: "COMPLETED",
              currencyCode: original.currencyCode,
              amount: original.totalDebit, // journal amount magnitude (balanced)
              journalId: postedReversal.id,
            },
          });
          reversalTransactionId = txRecord.id;
        } catch (err) {
          if (isPrismaUniqueConstraintError(err)) {
            throw new FinancialServiceError(
              "DUPLICATE_REFERENCE",
              "A financial transaction with the reversal transaction reference already exists.",
              { transactionReference: reversalTxRef },
            );
          }
          throw err;
        }
      }

      await recordFinancialAuditEvent(tx, {
        actor: input.actor,
        action: "financial_journal.reversed",
        affectedEntity: "FinancialJournal",
        entityReference: original.id,
        metadata: {
          originalJournalId: original.id,
          originalJournalReference: original.journalReference,
          reversalJournalId: postedReversal.id,
          reversalJournalReference: postedReversal.journalReference,
          reversalTransactionId,
          reason,
          currencyCode: original.currencyCode,
          amount: toDecimalString(original.totalDebit),
        },
      });

      await recordFinancialAuditEvent(tx, {
        actor: input.actor,
        action: "financial_journal.reversal_posted",
        affectedEntity: "FinancialJournal",
        entityReference: postedReversal.id,
        metadata: {
          reversalOfJournalId: original.id,
          reversalOfJournalReference: original.journalReference,
          currencyCode: original.currencyCode,
          totalDebit: toDecimalString(totalDebit),
          totalCredit: toDecimalString(totalCredit),
          entryCount: compensatingEntries.length,
        },
      });

      return {
        originalJournalId: original.id,
        originalStatus: "REVERSED" as const,
        reversalJournalId: postedReversal.id,
        reversalJournalReference: postedReversal.journalReference,
        reversalTransactionId,
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}