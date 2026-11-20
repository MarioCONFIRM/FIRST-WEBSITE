import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  TRANSACTIONS_PAGE_SIZE,
  type TransactionListFilters,
} from "@/validation/transactions";

export type CustomerTransactionRow = {
  id: string;
  reference: string;
  transactionType: "DEPOSIT" | "WITHDRAWAL" | "TRANSFER" | "CURRENCY_CONVERSION" | "FEE" | "REVERSAL";
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REVERSED";
  description: string;
  amount: Prisma.Decimal;
  currencyCode: string;
  createdAt: Date;
  completedAt: Date | null;
  ledgerEntries: Array<{
    entryType: "DEBIT" | "CREDIT";
    amount: Prisma.Decimal;
    currencyCode: string;
  }>;
};

function ownedByCustomer(userId: string): Prisma.TransactionWhereInput {
  return {
    OR: [
      { sourceAccount: { userId } },
      { destinationAccount: { userId } },
    ],
  };
}

export async function getCustomerRecentTransactions(userId: string, take = 5) {
  return prisma.transaction.findMany({
    where: ownedByCustomer(userId),
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      reference: true,
      transactionType: true,
      status: true,
      description: true,
      amount: true,
      currencyCode: true,
      createdAt: true,
      completedAt: true,
      ledgerEntries: {
        where: { account: { userId } },
        select: {
          entryType: true,
          amount: true,
          currencyCode: true,
        },
      },
    },
  });
}

export async function getCustomerTransactionsPage(
  userId: string,
  filters: TransactionListFilters,
) {
  const ownership = ownedByCustomer(userId);
  const and: Prisma.TransactionWhereInput[] = [ownership];

  if (filters.type !== "ALL") {
    and.push({ transactionType: filters.type });
  }
  if (filters.status !== "ALL") {
    and.push({ status: filters.status });
  }
  if (filters.currency !== "ALL") {
    and.push({ currencyCode: filters.currency });
  }
  if (filters.from || filters.to) {
    const createdAt: Prisma.DateTimeFilter = {};
    if (filters.from) {
      createdAt.gte = new Date(`${filters.from}T00:00:00.000Z`);
    }
    if (filters.to) {
      createdAt.lte = new Date(`${filters.to}T23:59:59.999Z`);
    }
    and.push({ createdAt });
  }

  const where: Prisma.TransactionWhereInput = { AND: and };
  const page = filters.page;
  const skip = (page - 1) * TRANSACTIONS_PAGE_SIZE;

  const [total, items] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: TRANSACTIONS_PAGE_SIZE,
      select: {
        id: true,
        reference: true,
        transactionType: true,
        status: true,
        description: true,
        amount: true,
        currencyCode: true,
        createdAt: true,
        completedAt: true,
        ledgerEntries: {
          where: { account: { userId } },
          select: {
            entryType: true,
            amount: true,
            currencyCode: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / TRANSACTIONS_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  return {
    items: safePage !== page ? [] : items,
    total,
    page: safePage,
    totalPages,
    pageSize: TRANSACTIONS_PAGE_SIZE,
  };
}

/** Derive display direction from customer's own ledger entries on a transaction. */
export function deriveDirection(
  entries: Array<{ entryType: "DEBIT" | "CREDIT" }>,
): "DEBIT" | "CREDIT" | "MIXED" | null {
  if (entries.length === 0) return null;
  const hasDebit = entries.some((e) => e.entryType === "DEBIT");
  const hasCredit = entries.some((e) => e.entryType === "CREDIT");
  if (hasDebit && hasCredit) return "MIXED";
  if (hasDebit) return "DEBIT";
  if (hasCredit) return "CREDIT";
  return null;
}
