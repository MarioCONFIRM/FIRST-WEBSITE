import type { Metadata } from "next";
import Link from "next/link";

import { BalanceVisibilityToggle, MoneyAmount } from "@/components/dashboard/money-display";
import { TransactionList } from "@/components/dashboard/transaction-list";
import { requireCustomer } from "@/lib/auth/guards";
import { getCustomerRecentTransactions } from "@/lib/dashboard/transactions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Customer Dashboard" };
export const instant = false;

function formatDateLong(date: Date) {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function CustomerDashboardPage() {
  const session = await requireCustomer();
  const today = new Date();

  const [user, accounts, notifications, recentTransactions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        emailVerified: true,
        accountStatus: true,
      },
    }),
    prisma.bankAccount.findMany({
      where: { userId: session.userId },
      select: {
        id: true,
        accountNumber: true,
        accountType: true,
        currencyCode: true,
        status: true,
        availableBalance: true,
        ledgerBalance: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.notification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        message: true,
        notificationType: true,
        isRead: true,
        createdAt: true,
      },
    }),
    getCustomerRecentTransactions(session.userId, 5),
  ]);

  const activeAccounts = accounts.filter((a) => a.status === "ACTIVE");
  const unreadNotifications = notifications.filter((n) => !n.isRead).length;

  const currencySummaries = (["GBP", "USD", "AUD"] as const)
    .map((code) => {
      const inCurrency = accounts.filter((a) => a.currencyCode === code);
      if (inCurrency.length === 0) return null;
      let available = inCurrency[0].availableBalance;
      let ledger = inCurrency[0].ledgerBalance;
      for (let i = 1; i < inCurrency.length; i++) {
        available = available.add(inCurrency[i].availableBalance);
        ledger = ledger.add(inCurrency[i].ledgerBalance);
      }
      return {
        code,
        count: inCurrency.length,
        available: available.toString(),
        ledger: ledger.toString(),
        statuses: Array.from(new Set(inCurrency.map((a) => a.status))),
        types: Array.from(new Set(inCurrency.map((a) => a.accountType))),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const accountTypes = Array.from(new Set(accounts.map((a) => a.accountType)));
  const accountStatuses = Array.from(new Set(accounts.map((a) => a.status)));
  const accountCurrencies = Array.from(new Set(accounts.map((a) => a.currencyCode)));

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="rounded-2xl border border-veltrix-silver bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-veltrix-blue">Overview</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-veltrix-navy sm:text-3xl">
              Welcome{user?.firstName ? `, ${user.firstName}` : ""}
            </h1>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">{formatDateLong(today)}</p>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-700 sm:text-base">
              Here&apos;s a secure overview of your simulated Veltrix Bank accounts and recent activity.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <span className={`inline-flex items-center rounded-full px-3 py-1 font-medium ring-1 ring-inset ${user?.emailVerified ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-amber-50 text-amber-900 ring-amber-200"}`}>
                Email verification: {user?.emailVerified ? "Verified" : "Pending verification"}
              </span>
              <span className="inline-flex items-center rounded-full bg-veltrix-surface px-3 py-1 font-medium text-veltrix-navy ring-1 ring-inset ring-veltrix-silver">
                Account status: {user?.accountStatus ?? "—"}
              </span>
              {unreadNotifications > 0 ? (
                <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-800 ring-1 ring-inset ring-blue-200">
                  {unreadNotifications} unread notification{unreadNotifications === 1 ? "" : "s"}
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <BalanceVisibilityToggle />
            <p className="max-w-xs text-xs leading-5 text-slate-500 lg:text-right">
              Balance visibility is privacy-oriented by default and only affects what is shown on screen.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-veltrix-silver bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Active accounts</p>
          <p className="mt-2 text-3xl font-bold text-veltrix-navy">{activeAccounts.length}</p>
          <p className="mt-1 text-xs text-slate-500">of {accounts.length} total account{accounts.length === 1 ? "" : "s"}</p>
        </div>
        <div className="rounded-2xl border border-veltrix-silver bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Currencies</p>
          <p className="mt-2 text-lg font-semibold text-veltrix-navy">{accountCurrencies.length ? accountCurrencies.join(", ") : "—"}</p>
          <p className="mt-1 text-xs text-slate-500">Supported: GBP, USD, AUD (kept separate)</p>
        </div>
        <div className="rounded-2xl border border-veltrix-silver bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Account types</p>
          <p className="mt-2 text-lg font-semibold text-veltrix-navy">{accountTypes.length ? accountTypes.join(", ") : "—"}</p>
          <p className="mt-1 text-xs text-slate-500">As recorded for your accounts</p>
        </div>
        <div className="rounded-2xl border border-veltrix-silver bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Account statuses</p>
          <p className="mt-2 text-lg font-semibold text-veltrix-navy">{accountStatuses.length ? accountStatuses.join(", ") : "—"}</p>
          <p className="mt-1 text-xs text-slate-500">Current status values</p>
        </div>
      </section>

      <section className="rounded-2xl border border-veltrix-silver bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-veltrix-navy">Account summary by currency</h2>
            <p className="mt-1 text-sm text-slate-600">Balances are shown separately for each currency. Different currencies are never combined into one total.</p>
          </div>
        </div>
        {currencySummaries.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">No account records found.</p>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {currencySummaries.map((summary) => (
              <article key={summary.code} className="rounded-xl border border-veltrix-silver bg-veltrix-surface/40 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-veltrix-navy">{summary.code}</h3>
                  <span className="text-xs font-medium text-slate-500">{summary.count} account{summary.count === 1 ? "" : "s"}</span>
                </div>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-slate-600">Available balance</dt>
                    <dd className="font-semibold text-slate-900"><MoneyAmount value={summary.available} currencyCode={summary.code} /></dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-slate-600">Ledger balance</dt>
                    <dd className="font-semibold text-slate-900"><MoneyAmount value={summary.ledger} currencyCode={summary.code} /></dd>
                  </div>
                  <div>
                    <dt className="text-slate-600">Types</dt>
                    <dd className="mt-1 font-medium text-slate-900">{summary.types.join(", ")}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-600">Statuses</dt>
                    <dd className="mt-1 font-medium text-slate-900">{summary.statuses.join(", ")}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-veltrix-silver bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-veltrix-navy">Recent activity</h2>
                <p className="mt-1 text-sm text-slate-600">Latest transactions for your accounts (actual records only).</p>
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
                <TransactionList transactions={recentTransactions} compact />
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-veltrix-silver bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-veltrix-navy">Quick navigation</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link href="/dashboard/accounts" className="rounded-xl border border-veltrix-silver p-4 transition hover:border-veltrix-blue hover:bg-veltrix-surface/40">
                <p className="font-semibold text-veltrix-navy">My Accounts</p>
                <p className="mt-1 text-sm text-slate-600">View account details, balances, currencies, and statuses.</p>
              </Link>
              <Link href="/dashboard/transactions" className="rounded-xl border border-veltrix-silver p-4 transition hover:border-veltrix-blue hover:bg-veltrix-surface/40">
                <p className="font-semibold text-veltrix-navy">Transaction History</p>
                <p className="mt-1 text-sm text-slate-600">Review read-only activity with filters and pagination.</p>
              </Link>
              <Link href="/dashboard/profile" className="rounded-xl border border-veltrix-silver p-4 transition hover:border-veltrix-blue hover:bg-veltrix-surface/40">
                <p className="font-semibold text-veltrix-navy">Profile</p>
                <p className="mt-1 text-sm text-slate-600">View and update permitted personal information.</p>
              </Link>
              <Link href="/dashboard/security" className="rounded-xl border border-veltrix-silver p-4 transition hover:border-veltrix-blue hover:bg-veltrix-surface/40">
                <p className="font-semibold text-veltrix-navy">Security Settings</p>
                <p className="mt-1 text-sm text-slate-600">Manage sign-in, password reset, and verification actions.</p>
              </Link>
            </div>

            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-950">Financial operations unavailable in this phase</p>
              <p className="mt-1 text-sm leading-6 text-amber-900">Transfers, deposits, withdrawals, currency conversion, and payments are not implemented and cannot be executed from this dashboard. These features may appear in future phases as simulated functionality only.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["Transfers", "Deposits", "Withdrawals", "Currency conversion", "Payments"].map((label) => (
                  <span key={label} className="inline-flex items-center rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-900" aria-disabled="true">
                    {label} · Coming soon
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-veltrix-silver bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-veltrix-navy">Notifications</h2>
              {unreadNotifications > 0 ? (
                <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-veltrix-blue px-2 py-0.5 text-xs font-semibold text-white" aria-label={`${unreadNotifications} unread notifications`}>
                  {unreadNotifications}
                </span>
              ) : (
                <span className="text-xs font-medium text-slate-500">No unread</span>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-veltrix-silver bg-veltrix-surface/30 p-4 text-sm text-slate-600">
                No notifications yet. Account notifications will appear here when available.
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {notifications.map((n) => (
                  <li key={n.id} className={`rounded-xl border p-4 ${n.isRead ? "border-veltrix-silver bg-white" : "border-blue-200 bg-blue-50/40"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{n.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{n.notificationType} · <time dateTime={n.createdAt.toISOString()}>{n.createdAt.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</time></p>
                      </div>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${n.isRead ? "bg-slate-100 text-slate-600 ring-slate-200" : "bg-blue-100 text-blue-800 ring-blue-200"}`}>
                        {n.isRead ? "Read" : "Unread"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{n.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-veltrix-silver bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-veltrix-navy">Accounts at a glance</h2>
            {accounts.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">No account records found.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {accounts.map((a) => (
                  <li key={a.id} className="rounded-xl border border-veltrix-silver p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-veltrix-navy">{a.accountNumber}</p>
                        <p className="mt-1 text-xs text-slate-500">{a.accountType} · {a.currencyCode} · {a.status}</p>
                      </div>
                      <Link href={`/dashboard/accounts/${encodeURIComponent(a.accountNumber)}`} className="text-xs font-semibold text-veltrix-blue hover:underline">Details</Link>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-slate-600">Ledger balance</span>
                      <span className="font-semibold text-slate-900"><MoneyAmount value={a.ledgerBalance.toString()} currencyCode={a.currencyCode} /></span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-xs leading-5 text-slate-500">Balances shown are read-only values from your account records. No financial operations are available in this phase.</p>
          </div>
        </aside>
      </section>
    </div>
  );
}
