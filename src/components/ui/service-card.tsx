import type { ReactNode } from "react";

interface ServiceCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  status?: "Available in demo" | "Planned";
}

export function ServiceCard({
  title,
  description,
  icon,
  status,
}: ServiceCardProps) {
  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-veltrix-silver bg-white p-7 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-veltrix-blue/30 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <span className="grid size-12 place-items-center rounded-xl bg-veltrix-surface text-veltrix-blue ring-1 ring-veltrix-silver transition-colors group-hover:bg-[#eaf1fb]">
          {icon}
        </span>
        {status ? (
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
              status === "Planned"
                ? "bg-amber-50 text-amber-900 ring-1 ring-amber-200"
                : "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200"
            }`}
          >
            {status}
          </span>
        ) : null}
      </div>
      <h3 className="mt-6 text-lg font-semibold text-veltrix-navy">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
      <div className="mt-6 h-1 w-10 rounded-full bg-veltrix-gold/80 transition-all duration-200 group-hover:w-16" />
    </article>
  );
}