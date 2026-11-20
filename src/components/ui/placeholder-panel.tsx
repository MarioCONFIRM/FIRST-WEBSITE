import type { ApplicationArea } from "@/types";

interface PlaceholderPanelProps {
  title: string;
  description: string;
  area: ApplicationArea;
}

const areaLabels: Record<ApplicationArea, string> = {
  public: "Public website",
  customer: "Customer banking",
  admin: "Administration",
};

export function PlaceholderPanel({
  title,
  description,
  area,
}: PlaceholderPanelProps) {
  return (
    <section
      className="rounded-2xl border border-veltrix-silver bg-white p-8 shadow-sm"
      aria-label={`${title} status`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-900 ring-1 ring-amber-200">
          Planned — not yet implemented
        </span>
        <span className="text-xs font-medium text-slate-500">
          {areaLabels[area]}
        </span>
      </div>
      <h2 className="mt-6 text-xl font-semibold text-veltrix-navy">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
        {description}
      </p>
      <p className="mt-6 text-xs leading-6 text-slate-500">
        This area is a placeholder for a later phase. No account creation,
        authentication, transactions or administration are available in this
        simulation yet.
      </p>
    </section>
  );
}
