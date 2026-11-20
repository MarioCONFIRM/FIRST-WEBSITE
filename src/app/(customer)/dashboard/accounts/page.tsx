import type { Metadata } from "next";
import Link from "next/link";

import { BalanceVisibilityToggle, MoneyAmount } from "@/components/dashboard/money-display";
import { requireCustomer } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "My Accounts" };
export const instant = false;

export default async function DashboardAccountsPage() {
  const session = await requireCustomer();
  const accounts = await prisma.bankAccount.findMany({
    where: { userId: session.userId },
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
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-veltrix-blue">My Accounts</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-veltrix-navy sm:text-3xl">Your accounts</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Read-only view of your simulated Veltrix Bank accounts. All information shown belongs to your authenticated profile.
          </p>
        </div>
        <BalanceVisibilityToggle />
      </div>

      {accounts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-veltrix-silver bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-veltrix-navy">No account records found</p>
          <p className="mt-2 text-sm text-slate-600">Your account information will appear here when available.</p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {accounts.map((a) => (
            <article key={a.accountNumber} className="rounded-2xl border border-veltrix-silver bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm text-slate-500">{a.accountName}</p>
                  <h2 className="mt-1 break-all text-lg font-semibold text-veltrix-navy">{a.accountNumber}</h2>
                  <p className="mt-1 text-sm text-slate-600">{a.accountType} · {a.currencyCode}</p>
                </div>
                <span className="inline-flex rounded-full bg-veltrix-surface px-3 py-1 text-xs font-semibold text-veltrix-navy ring-1 ring-inset ring-veltrix-silver">{a.status}</span>
              </div>

              <dl className="mt-5 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div className="rounded-xl bg-veltrix-surface/40 p-3">
                  <dt className="text-slate-500">Available balance</dt>
                  <dd className="mt-1 text-base font-semibold text-slate-900"><MoneyAmount value={a.availableBalance.toString()} currencyCode={a.currencyCode} /></dd>
                </div>
                <div className="rounded-xl bg-veltrix-surface/40 p-3">
                  <dt className="text-slate-500">Ledger balance</dt>
                  <dd className="mt-1 text-base font-semibold text-slate-900"><MoneyAmount value={a.ledgerBalance.toString()} currencyCode={a.currencyCode} /></dd>
                </div>
                <div>
                  <dt className="text-slate-500">Currency</dt>
                  <dd className="mt-1 font-medium text-slate-900">{a.currencyCode}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Created</dt>
                  <dd className="mt-1 font-medium text-slate-900">
                    <time dateTime={a.createdAt.toISOString()}>{a.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</time>
                  </dd>
                </div>
              </dl>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-veltrix-silver pt-4">
                <p className="text-xs text-slate-500">Read-only simulated account. No balance changes or financial operations.</p>
                <Link href={`/dashboard/accounts/${encodeURIComponent(a.accountNumber)}`} className="inline-flex items-center justify-center rounded-full border border-veltrix-blue bg-white px-4 py-2 text-sm font-semibold text-veltrix-blue transition hover:bg-veltrix-surface">
                  View details
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
