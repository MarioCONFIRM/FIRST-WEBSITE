import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { recordFinancialAuditEvent } from "./audit";
import { requirePrivilegedFinancialActor } from "./authorization";
import {
  MONEY_DECIMAL_SCALE,
  SUPPORTED_FINANCIAL_CURRENCIES,
  type EntryTypeValue,
} from "./constants";
import { isPositiveAmount, toDecimalString, ZERO } from "./decimal";
import {
  FinancialServiceError,
  isPrismaUniqueConstraintError,
} from "./errors";
import { validateAccountOwnershipAndCurrencyCompatibility } from "./ownership";
import type {
  AddLedgerEntryInput,
  CreateDraftJournalInput,
  JournalBalanceValidation,
  PostJournalInput,
} from "./types";

function ensureSupportedCurrency(currencyCode: string): void {
  if (!SUPPORTED_FINANCIAL_CURRENCIES.includes(currencyCode as (typeof SUPPORTED_FINANCIAL_CURRENCIES)[number])) {
    throw new FinancialServiceError("VALIDATION_ERROR", "Unsupported currency code.", {
      currencyCode,
    });
  }
}

function parseAmount(input: Prisma.Decimal | string): Prisma.Decimal {
  let value: Prisma.Decimal;
  try {
    value = input instanceof Prisma.Decimal ? input : new Prisma.Decimal(input);
  } catch {
    throw new FinancialServiceError("INVALID_AMOUNT", "Amount must be a valid decimal value.");
  }
  if (!value.isFinite() || value.isNaN()) {
    throw new FinancialServiceError("INVALID_AMOUNT", "Amount must be a finite decimal value.");
  }
  if (!isPositiveAmount(value)) {
    throw new FinancialServiceError(
      "INVALID_AMOUNT",
      "Amount must be greater than zero.",
      { amount: toDecimalString(value) },
    );
  }
  // Enforce scale representable at DECIMAL(19,4): no more than 4 fractional digits.
  const decimalPlaces = value.decimalPlaces();
  if (decimalPlaces > MONEY_DECIMAL_SCALE) {
    throw new FinancialServiceError(
      "INVALID_AMOUNT",
      `Amount scale must not exceed ${MONEY_DECIMAL_SCALE} decimal places.`,
      { amount: value.toString(), decimalPlaces },
    );
  }
  return value;
}

async function assertCurrencyExists(tx: Prisma.TransactionClient, currencyCode: string) {
  const currency = await tx.currency.findUnique({
    where: { code: currencyCode },
    select: { code: true, isActive: true },
  });
  if (!currency) {
    throw new FinancialServiceError("VALIDATION_ERROR", "Currency not found.", { currencyCode });
  }
}

async function lockDraftJournal(tx: Prisma.TransactionClient, journalId: string) {
  const rows = await tx.$queryRaw<Array<{
    id: string;
    status: "DRAFT" | "POSTED" | "REVERSED";
    currencyCode: string;
    journalReference: string;
  }>>`SELECT id, status, currencyCode, journalReference FROM financial_journals WHERE id = ${journalId} FOR UPDATE`;

  const journal = rows[0];
  if (!journal) {
    throw new FinancialServiceError("NOT_FOUND", "Financial journal not found.", { journalId });
  }
  if (journal.status !== "DRAFT") {
    throw new FinancialServiceError(
      "INVALID_STATE",
      "Only DRAFT journals can be modified in this way.",
      { journalId, status: journal.status },
    );
  }
  return journal;
}

async function recomputeDraftTotals(tx: Prisma.TransactionClient, journalId: string) {
  const entries = await tx.financialLedgerEntry.findMany({
    where: { journalId },
    select: { entryType: true, amount: true },
  });
  let debit = ZERO;
  let credit = ZERO;
  for (const e of entries) {
    if (e.entryType === "DEBIT") debit = debit.add(e.amount);
    else credit = credit.add(e.amount);
  }
  await tx.financialJournal.update({
    where: { id: journalId },
    data: { totalDebit: debit, totalCredit: credit },
  });
  return { totalDebit: debit, totalCredit: credit, entryCount: entries.length };
}

export async function createDraftJournal(input: CreateDraftJournalInput) {
  requirePrivilegedFinancialActor(input.actor);
  if (input.createdByUserId !== input.actor.actorUserId) {
    throw new FinancialServiceError(
      "FORBIDDEN",
      "createdByUserId must match the authorized actor.",
    );
  }
  const journalReference = input.journalReference.trim();
  if (!journalReference) {
    throw new FinancialServiceError("VALIDATION_ERROR", "Journal reference is required.");
  }
  const description = input.description.trim();
  if (!description) {
    throw new FinancialServiceError("VALIDATION_ERROR", "Journal description is required.");
  }
  ensureSupportedCurrency(input.currencyCode);

  try {
    return await prisma.$transaction(async (tx) => {
      await assertCurrencyExists(tx, input.currencyCode);
      const journal = await tx.financialJournal.create({
        data: {
          journalReference,
          transactionType: input.transactionType,
          status: "DRAFT",
          description,
          currencyCode: input.currencyCode,
          totalDebit: ZERO,
          totalCredit: ZERO,
          createdByUserId: input.actor.actorUserId,
          auditMetadata: input.auditMetadata ?? undefined,
        },
      });

      await recordFinancialAuditEvent(tx, {
        actor: input.actor,
        action: "financial_journal.created",
        affectedEntity: "FinancialJournal",
        entityReference: journal.id,
        metadata: {
          journalReference: journal.journalReference,
          transactionType: journal.transactionType,
          currencyCode: journal.currencyCode,
          status: journal.status,
        },
      });

      return journal;
    });
  } catch (err) {
    if (isPrismaUniqueConstraintError(err)) {
      throw new FinancialServiceError(
        "DUPLICATE_REFERENCE",
        "A financial journal with this reference already exists.",
        { journalReference },
      );
    }
    throw err;
  }
}

async function addEntry(
  input: AddLedgerEntryInput,
  entryType: EntryTypeValue,
) {
  requirePrivilegedFinancialActor(input.actor);
  const amount = parseAmount(input.amount);
  ensureSupportedCurrency(input.currencyCode);

  return prisma.$transaction(async (tx) => {
    const journal = await lockDraftJournal(tx, input.journalId);

    if (journal.currencyCode !== input.currencyCode) {
      throw new FinancialServiceError(
        "CROSS_CURRENCY_JOURNAL",
        "Entry currency must match the journal currency.",
        {
          journalId: input.journalId,
          journalCurrencyCode: journal.currencyCode,
          entryCurrencyCode: input.currencyCode,
        },
      );
    }

    await validateAccountOwnershipAndCurrencyCompatibility(tx, {
      accountId: input.accountId,
      currencyCode: input.currencyCode,
      actor: input.actor,
    });

    const entry = await tx.financialLedgerEntry.create({
      data: {
        journalId: input.journalId,
        accountId: input.accountId,
        entryType,
        amount,
        currencyCode: input.currencyCode,
      },
    });

    const totals = await recomputeDraftTotals(tx, input.journalId);

    await recordFinancialAuditEvent(tx, {
      actor: input.actor,
      action: entryType === "DEBIT" ? "financial_journal.entry_debit_added" : "financial_journal.entry_credit_added",
      affectedEntity: "FinancialLedgerEntry",
      entityReference: entry.id,
      metadata: {
        journalId: input.journalId,
        journalReference: journal.journalReference,
        accountId: input.accountId,
        entryType,
        amount: toDecimalString(amount),
        currencyCode: input.currencyCode,
        totalDebit: toDecimalString(totals.totalDebit),
        totalCredit: toDecimalString(totals.totalCredit),
        entryCount: totals.entryCount,
      },
    });

    return { entry, totals };
  });
}

export async function addDebitEntry(input: AddLedgerEntryInput) {
  return addEntry(input, "DEBIT");
}

export async function addCreditEntry(input: AddLedgerEntryInput) {
  return addEntry(input, "CREDIT");
}

export async function validateJournalBalance(journalId: string): Promise<JournalBalanceValidation> {
  const journal = await prisma.financialJournal.findUnique({
    where: { id: journalId },
    select: {
      id: true,
      status: true,
      currencyCode: true,
      totalDebit: true,
      totalCredit: true,
      entries: {
        select: {
          id: true,
          entryType: true,
          amount: true,
          currencyCode: true,
          accountId: true,
          account: { select: { id: true, currencyCode: true } },
        },
      },
    },
  });

  if (!journal) {
    throw new FinancialServiceError("NOT_FOUND", "Financial journal not found.", { journalId });
  }

  const issues: string[] = [];
  const entries = journal.entries;

  if (entries.length < 2) {
    issues.push("A posted financial journal must contain at least two ledger entries.");
  }

  let debit = ZERO;
  let credit = ZERO;
  for (const e of entries) {
    if (!isPositiveAmount(e.amount)) {
      issues.push(`Entry ${e.id} has a non-positive amount.`);
    }
    if (e.currencyCode !== journal.currencyCode) {
      issues.push(`Entry ${e.id} currency does not match journal currency.`);
    }
    if (!e.account) {
      issues.push(`Entry ${e.id} is missing account relationship.`);
    } else if (e.account.currencyCode !== e.currencyCode) {
      issues.push(`Entry ${e.id} account currency does not match entry currency.`);
    }
    if (e.entryType === "DEBIT") debit = debit.add(e.amount);
    else credit = credit.add(e.amount);
  }

  if (!debit.eq(credit)) {
    issues.push("Total debits must equal total credits.");
  }
  if (debit.eq(ZERO) || credit.eq(ZERO)) {
    issues.push("Balanced journal totals must be greater than zero.");
  }

  return {
    valid: issues.length === 0,
    journalId: journal.id,
    status: journal.status,
    currencyCode: journal.currencyCode,
    totalDebit: debit,
    totalCredit: credit,
    entryCount: entries.length,
    issues,
  };
}

export async function calculateJournalTotals(journalId: string) {
  const journal = await prisma.financialJournal.findUnique({
    where: { id: journalId },
    select: {
      id: true,
      currencyCode: true,
      status: true,
      entries: { select: { entryType: true, amount: true, currencyCode: true } },
    },
  });
  if (!journal) {
    throw new FinancialServiceError("NOT_FOUND", "Financial journal not found.", { journalId });
  }
  let totalDebit = ZERO;
  let totalCredit = ZERO;
  for (const e of journal.entries) {
    if (e.entryType === "DEBIT") totalDebit = totalDebit.add(e.amount);
    else totalCredit = totalCredit.add(e.amount);
  }
  return {
    journalId: journal.id,
    status: journal.status,
    currencyCode: journal.currencyCode,
    totalDebit,
    totalCredit,
    balanced: totalDebit.eq(totalCredit),
    entryCount: journal.entries.length,
  };
}

export async function postBalancedJournal(input: PostJournalInput) {
  requirePrivilegedFinancialActor(input.actor);

  return prisma.$transaction(
    async (tx) => {
      const locked = await tx.$queryRaw<Array<{
        id: string;
        status: "DRAFT" | "POSTED" | "REVERSED";
        currencyCode: string;
        journalReference: string;
      }>>`SELECT id, status, currencyCode, journalReference FROM financial_journals WHERE id = ${input.journalId} FOR UPDATE`;

      const journal = locked[0];
      if (!journal) {
        throw new FinancialServiceError("NOT_FOUND", "Financial journal not found.", {
          journalId: input.journalId,
        });
      }
      if (journal.status !== "DRAFT") {
        throw new FinancialServiceError(
          "INVALID_STATE",
          "Only DRAFT journals can be posted.",
          { journalId: input.journalId, status: journal.status },
        );
      }

      const entries = await tx.financialLedgerEntry.findMany({
        where: { journalId: input.journalId },
        select: {
          id: true,
          accountId: true,
          entryType: true,
          amount: true,
          currencyCode: true,
          account: { select: { id: true, currencyCode: true } },
        },
      });

      if (entries.length < 2) {
        throw new FinancialServiceError(
          "UNBALANCED_JOURNAL",
          "A posted financial journal must contain at least two ledger entries.",
          { journalId: input.journalId, entryCount: entries.length },
        );
      }

      let totalDebit = ZERO;
      let totalCredit = ZERO;
      for (const e of entries) {
        if (!isPositiveAmount(e.amount)) {
          throw new FinancialServiceError(
            "INVALID_AMOUNT",
            "Journal contains a non-positive ledger entry amount.",
            { journalId: input.journalId, entryId: e.id },
          );
        }
        if (e.currencyCode !== journal.currencyCode) {
          throw new FinancialServiceError(
            "CROSS_CURRENCY_JOURNAL",
            "All ledger entries must match the journal currency.",
            { journalId: input.journalId, entryId: e.id, entryCurrencyCode: e.currencyCode, journalCurrencyCode: journal.currencyCode },
          );
        }
        if (!e.account || e.account.currencyCode !== e.currencyCode) {
          throw new FinancialServiceError(
            "CURRENCY_MISMATCH",
            "Ledger entry account currency is missing or incompatible.",
            { journalId: input.journalId, entryId: e.id, accountId: e.accountId },
          );
        }
        if (e.entryType === "DEBIT") totalDebit = totalDebit.add(e.amount);
        else totalCredit = totalCredit.add(e.amount);
      }

      if (totalDebit.eq(ZERO) || totalCredit.eq(ZERO) || !totalDebit.eq(totalCredit)) {
        throw new FinancialServiceError(
          "UNBALANCED_JOURNAL",
          "Journal debits and credits must be equal and greater than zero before posting.",
          {
            journalId: input.journalId,
            totalDebit: toDecimalString(totalDebit),
            totalCredit: toDecimalString(totalCredit),
          },
        );
      }

      const postedAt = new Date();
      const updated = await tx.financialJournal.update({
        where: { id: input.journalId },
        data: {
          status: "POSTED",
          postedAt,
          totalDebit,
          totalCredit,
        },
      });

      await recordFinancialAuditEvent(tx, {
        actor: input.actor,
        action: "financial_journal.posted",
        affectedEntity: "FinancialJournal",
        entityReference: updated.id,
        metadata: {
          journalReference: journal.journalReference,
          currencyCode: journal.currencyCode,
          totalDebit: toDecimalString(totalDebit),
          totalCredit: toDecimalString(totalCredit),
          entryCount: entries.length,
          postingMetadata: input.postingMetadata ?? null,
        },
      });

      return updated;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}