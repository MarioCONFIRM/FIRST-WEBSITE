"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

const typeOptions = [
  { value: "ALL", label: "All transactions" },
  { value: "DEPOSIT", label: "Deposits" },
  { value: "WITHDRAWAL", label: "Withdrawals" },
  { value: "TRANSFER", label: "Transfers" },
  { value: "CURRENCY_CONVERSION", label: "Currency conversions" },
  { value: "FEE", label: "Fees" },
  { value: "REVERSAL", label: "Reversals" },
] as const;

const statusOptions = [
  { value: "ALL", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "COMPLETED", label: "Completed" },
  { value: "FAILED", label: "Failed" },
  { value: "REVERSED", label: "Reversed" },
] as const;

const currencyOptions = [
  { value: "ALL", label: "All currencies" },
  { value: "GBP", label: "GBP (£)" },
  { value: "USD", label: "USD ($)" },
  { value: "AUD", label: "AUD (A$)" },
] as const;

export function TransactionFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "ALL") params.delete(key);
    else params.set(key, value);
    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function setDateRange(key: "from" | "to", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value) params.delete(key);
    else params.set(key, value);
    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  const currentType = searchParams.get("type") || "ALL";
  const currentStatus = searchParams.get("status") || "ALL";
  const currentCurrency = searchParams.get("currency") || "ALL";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";

  return (
    <div className="rounded-2xl border border-veltrix-silver bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4">
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Transaction type</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by transaction type">
            {typeOptions.map((opt) => {
              const active = currentType === opt.value || (opt.value === "ALL" && currentType === "ALL");
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateParam("type", opt.value)}
                  className={
                    "rounded-full px-3 py-1.5 text-sm font-medium transition " +
                    (active
                      ? "bg-veltrix-blue text-white"
                      : "border border-veltrix-silver bg-white text-slate-700 hover:border-veltrix-blue hover:text-veltrix-blue")
                  }
                  aria-pressed={active}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Status</span>
            <select
              value={currentStatus}
              onChange={(e) => updateParam("status", e.target.value)}
              className="w-full rounded-xl border border-veltrix-silver bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-veltrix-blue focus:outline-none focus:ring-2 focus:ring-veltrix-blue/20"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Currency</span>
            <select
              value={currentCurrency}
              onChange={(e) => updateParam("currency", e.target.value)}
              className="w-full rounded-xl border border-veltrix-silver bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-veltrix-blue focus:outline-none focus:ring-2 focus:ring-veltrix-blue/20"
            >
              {currencyOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">From date</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setDateRange("from", e.target.value)}
              className="w-full rounded-xl border border-veltrix-silver bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-veltrix-blue focus:outline-none focus:ring-2 focus:ring-veltrix-blue/20"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">To date</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setDateRange("to", e.target.value)}
              className="w-full rounded-xl border border-veltrix-silver bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-veltrix-blue focus:outline-none focus:ring-2 focus:ring-veltrix-blue/20"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-veltrix-silver pt-3 text-sm">
          <p className="text-slate-500" aria-live="polite">{isPending ? "Updating results…" : "Filters apply to your account activity only."}</p>
          <Link href="/dashboard/transactions" className="font-medium text-veltrix-blue hover:underline">Clear filters</Link>
        </div>
      </div>
    </div>
  );
}

export function TransactionPagination({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function hrefFor(targetPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (targetPage <= 1) params.delete("page");
    else params.set("page", String(targetPage));
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  if (totalPages <= 1) return null;

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3" aria-label="Transaction pagination">
      <p className="text-sm text-slate-600">Page <span className="font-semibold text-slate-900">{page}</span> of <span className="font-semibold text-slate-900">{totalPages}</span></p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link href={hrefFor(page - 1)} className="rounded-full border border-veltrix-silver bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-veltrix-blue hover:text-veltrix-blue">Previous</Link>
        ) : (
          <span className="rounded-full border border-veltrix-silver bg-slate-50 px-4 py-2 text-sm font-medium text-slate-400">Previous</span>
        )}
        {page < totalPages ? (
          <Link href={hrefFor(page + 1)} className="rounded-full border border-veltrix-silver bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-veltrix-blue hover:text-veltrix-blue">Next</Link>
        ) : (
          <span className="rounded-full border border-veltrix-silver bg-slate-50 px-4 py-2 text-sm font-medium text-slate-400">Next</span>
        )}
      </div>
    </nav>
  );
}
