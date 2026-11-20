import type { Metadata } from "next";

import { BalanceVisibilityToggle } from "@/components/dashboard/money-display";
import { TransactionFilters, TransactionPagination } from "@/components/dashboard/transaction-filters";
import { TransactionList } from "@/components/dashboard/transaction-list";
import { requireCustomer } from "@/lib/auth/guards";
import { getCustomerTransactionsPage } from "@/lib/dashboard/transactions";
import { transactionListSearchSchema } from "@/validation/transactions";

export const metadata: Metadata = { title: "Transaction History" };
export const instant = false;

export default async function DashboardTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireCustomer();
  const raw = await searchParams;
  const normalized = {
    type: typeof raw.type === "string" ? raw.type : undefined,
    status: typeof raw.status === "string" ? raw.status : undefined,
    currency: typeof raw.currency === "string" ? raw.currency : undefined,
    from: typeof raw.from === "string" ? raw.from : undefined,
    to: typeof raw.to === "string" ? raw.to : undefined,
    page: typeof raw.page === "string" ? raw.page : undefined,
  };

  const filters = transactionListSearchSchema.parse(normalized);
  const result = await getCustomerTransactionsPage(session.userId, filters);

  const hasActiveFilters =
    filters.type !== "ALL" ||
    filters.status !== "ALL" ||
    filters.currency !== "ALL" ||
    Boolean(filters.from) ||
    Boolean(filters.to);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-veltrix-blue">Transactions</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-veltrix-navy sm:text-3xl">Transaction history</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Read-only history of activity for your simulated accounts. Only transactions associated with your accounts are shown.
          </p>
        </div>
        <BalanceVisibilityToggle />
      </div>

      <TransactionFilters />

      <section className="rounded-2xl border border-veltrix-silver bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-veltrix-navy">Results</h2>
            <p className="text-sm text-slate-600">
              {result.total} transaction{result.total === 1 ? "" : "s"} found
              {hasActiveFilters ? " for the selected filters" : ""}.
            </p>
          </div>
        </div>

        {result.total === 0 ? (
          <div className="rounded-xl border border-dashed border-veltrix-silver bg-veltrix-surface/30 p-8 text-center">
            {hasActiveFilters ? (
              <>
                <p className="text-lg font-semibold text-veltrix-navy">No transactions match your filters</p>
                <p className="mt-2 text-sm text-slate-600">Try adjusting or clearing filters to see more activity.</p>
              </>
            ) : (
              <>
                <p className="text-lg font-semibold text-veltrix-navy">You don&apos;t have any transactions yet.</p>
                <p className="mt-2 text-sm text-slate-600">Transactions will appear here when available.</p>
              </>
            )}
          </div>
        ) : result.items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-veltrix-silver bg-veltrix-surface/30 p-8 text-center">
            <p className="text-lg font-semibold text-veltrix-navy">No transactions on this page</p>
            <p className="mt-2 text-sm text-slate-600">Use pagination controls to navigate to available results.</p>
          </div>
        ) : (
          <div className="space-y-5">
            <TransactionList transactions={result.items} />
            <TransactionPagination page={result.page} totalPages={result.totalPages} />
          </div>
        )}
      </section>

      <p className="text-xs leading-5 text-slate-500">
        Transaction history is read-only. No transaction records, statuses, ledger entries, or account balances can be modified from this page.
      </p>
    </div>
  );
}
