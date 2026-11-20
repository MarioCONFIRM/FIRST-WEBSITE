"use client";

import { useBalanceVisibility } from "@/components/dashboard/balance-visibility";
import { formatMoney, maskMoney } from "@/lib/money";

type DecimalLike = { toFixed: (digits: number) => string };

export function BalanceVisibilityToggle({ className = "" }: { className?: string }) {
  const { visible, toggle } = useBalanceVisibility();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={visible}
      aria-label={visible ? "Hide balances" : "Show balances"}
      className={
        className ||
        "inline-flex items-center gap-2 rounded-full border border-veltrix-silver bg-white px-3 py-2 text-sm font-medium text-veltrix-navy transition hover:border-veltrix-blue hover:text-veltrix-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-veltrix-blue"
      }
    >
      <span aria-hidden="true">{visible ? "🙈" : "👁"}</span>
      <span>{visible ? "Hide balances" : "Show balances"}</span>
    </button>
  );
}

export function MoneyAmount({
  value,
  currencyCode,
  className,
}: {
  value: DecimalLike | string;
  currencyCode: string;
  className?: string;
}) {
  const { visible } = useBalanceVisibility();
  const text = visible ? formatMoney(value, currencyCode) : maskMoney(currencyCode);
  return (
    <span className={className} aria-label={visible ? undefined : `${currencyCode} balance hidden`}>
      {text}
    </span>
  );
}
