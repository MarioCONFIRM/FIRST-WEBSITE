interface CurrencyCardProps {
  code: string;
  name: string;
  symbol: string;
  note: string;
}

export function CurrencyCard({ code, name, symbol, note }: CurrencyCardProps) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-veltrix-silver bg-white p-7 shadow-sm">
      <div
        className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-veltrix-surface"
        aria-hidden="true"
      />
      <div className="relative">
        <p className="text-sm font-medium text-slate-500">{name}</p>
        <div className="mt-4 flex items-end justify-between gap-4">
          <p className="text-4xl font-bold tracking-tight text-veltrix-navy">
            {symbol}
          </p>
          <span className="rounded-full bg-veltrix-navy px-3 py-1 text-xs font-semibold tracking-[0.18em] text-white">
            {code}
          </span>
        </div>
        <p className="mt-5 text-sm leading-7 text-slate-600">{note}</p>
      </div>
    </article>
  );
}