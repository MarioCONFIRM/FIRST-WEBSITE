import type { ApplicationArea } from "@/types";

import { Container } from "@/components/ui/container";

interface PageHeaderProps {
  eyebrow: ApplicationArea | string;
  title: string;
  description: string;
}

const eyebrowLabels: Record<ApplicationArea, string> = {
  public: "Veltrix Bank",
  customer: "Customer banking",
  admin: "Administration",
};

export function PageHeader({
  eyebrow,
  title,
  description,
}: PageHeaderProps) {
  const label =
    eyebrow in eyebrowLabels
      ? eyebrowLabels[eyebrow as ApplicationArea]
      : eyebrow;

  return (
    <header className="border-b border-veltrix-silver/70 bg-gradient-to-b from-veltrix-surface to-white py-14 sm:py-16">
      <Container>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-veltrix-blue">
          {label}
        </p>
        <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-veltrix-navy sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
          {description}
        </p>
      </Container>
    </header>
  );
}
