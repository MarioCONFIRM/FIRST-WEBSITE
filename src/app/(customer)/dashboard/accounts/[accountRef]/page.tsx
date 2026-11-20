import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BalanceVisibilityToggle, MoneyAmount } from "@/components/dashboard/money-display";
import { TransactionList } from "@/components/dashboard/transaction-list";
import { requireCustomer } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Account Details" };
export const instant = false;

export default async function DashboardAccountDetailPage({
  params,
}: {
  params: Promise<{ accountRef: string }>;
}) {
  const session = await requireCustomer();
  const { accountRef } = await params;
  const accountNumber = decodeURIComponent(accountRef);

  // Ownership enforced server-side: account must belong to authenticated customer.
  const account = await prisma.bankAccount.findFirst({
    where: {
      accountNumber,
      userId: session.userId,
    },
    select: {
      accountNumber: true,
      accountName: true,
      accountType: true,
      currencyCode: true,
      status: true,
      availableBalance: true,
      ledgerBalance: true,
      createdAt: true,
    },
  });

  if (!account) {
    notFound();
  }

  const recentTransactions = await prisma.transaction.findMany({
    where: {
      OR: [
        { sourceAccount: { accountNumber: account.accountNumber, userId: session.userId } },
        { destinationAccount: { accountNumber: account.accountNumber, userId: session.userId } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 10,
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
        where: { account: { userId: session.userId, accountNumber: account.accountNumber } },
        select: {
          entryType: true,
          amount: true,
          currencyCode: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-veltrix-blue">Account details</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-veltrix-navy sm:text-3xl">{account.accountName}</h1>
          <p className="mt-2 text-sm text-slate-600">Read-only details for your selected account.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <BalanceVisibilityToggle />
          <Link href="/dashboard/accounts" className="inline-flex items-center justify-center rounded-full border border-veltrix-silver bg-white px-4 py-2 text-sm font-semibold text-veltrix-navy hover:border-veltrix-blue hover:text-veltrix-blue">
            Back to accounts
          </Link>
        </div>
      </div>

      <section className="rounded-2xl border border-veltrix-silver bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Account number</p>
            <p className="mt-1 break-all text-xl font-semibold text-veltrix-navy">{account.accountNumber}</p>
          </div>
          <span className="inline-flex rounded-full bg-veltrix-surface px-3 py-1 text-xs font-semibold text-veltrix-navy ring-1 ring-inset ring-veltrix-silver">{account.status}</span>
        </div>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl bg-veltrix-surface/40 p-4">
            <dt className="text-sm text-slate-500">Account type</dt>
            <dd className="mt-1 font-semibold text-slate-900">{account.accountType}</dd>
          </div>
          <div className="rounded-xl bg-veltrix-surface/40 p-4">
            <dt className="text-sm text-slate-500">Currency</dt>
            <dd className="mt-1 font-semibold text-slate-900">{account.currencyCode}</dd>
          </div>
          <div className="rounded-xl bg-veltrix-surface/40 p-4">
            <dt className="text-sm text-slate-500">Created</dt>
            <dd className="mt-1 font-semibold text-slate-900">
              <time dateTime={account.createdAt.toISOString()}>{account.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</time>
            </dd>
          </div>
          <div className="rounded-xl border border-veltrix-silver p-4 sm:col-span-1">
            <dt className="text-sm text-slate-500">Available balance</dt>
            <dd className="mt-2 text-xl font-bold text-veltrix-navy"><MoneyAmount value={account.availableBalance.toString()} currencyCode={account.currencyCode} /></dd>
          </div>
          <div className="rounded-xl border border-veltrix-silver p-4 sm:col-span-1">
            <dt className="text-sm text-slate-500">Ledger balance</dt>
            <dd className="mt-2 text-xl font-bold text-veltrix-navy"><MoneyAmount value={account.ledgerBalance.toString()} currencyCode={account.currencyCode} /></dd>
          </div>
        </dl>
        <p className="mt-5 text-xs leading-5 text-slate-500">Balances and account attributes are read-only in this phase. No deposits, withdrawals, transfers, or currency conversion are available.</p>
      </section>

      <section className="rounded-2xl border border-veltrix-silver bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-veltrix-navy">Recent account activity</h2>
            <p className="mt-1 text-sm text-slate-600">Latest transactions involving this account (read-only).</p>
          </div>
          <Link href="/dashboard/transactions" className="text-sm font-semibold text-veltrix-blue hover:underline">View all transactions</Link>
        </div>
        {recentTransactions.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-veltrix-silver bg-veltrix-surface/30 p-5">
            <p className="font-medium text-veltrix-navy">You don&apos;t have any transactions yet.</p>
            <p className="mt-1 text-sm text-slate-600">Transactions will appear here when available.</p>
          </div>
        ) : (
          <div className="mt-4">
            <TransactionList transactions={recentTransactions} />
          </div>
        )}
      </section>
    </div>
  );
}
