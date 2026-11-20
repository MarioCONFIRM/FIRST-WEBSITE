import type { ReactNode } from "react";

interface FeatureCardProps {
  title: string;
  description: string;
  icon?: ReactNode;
}

export function FeatureCard({ title, description, icon }: FeatureCardProps) {
  return (
    <article className="h-full rounded-2xl border border-veltrix-silver/80 bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-md">
      {icon ? (
        <span className="mb-4 inline-grid size-11 place-items-center rounded-xl bg-veltrix-navy text-veltrix-gold">
          {icon}
        </span>
      ) : (
        <span className="mb-4 block h-1.5 w-10 rounded-full bg-veltrix-gold" />
      )}
      <h3 className="text-lg font-semibold text-veltrix-navy">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
    </article>
  );
}