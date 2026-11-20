import type { Metadata } from "next";

import { CTASection } from "@/components/ui/cta-section";
import { Container } from "@/components/ui/container";
import { CurrencyCard } from "@/components/ui/currency-card";
import { FeatureCard } from "@/components/ui/feature-card";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeading } from "@/components/ui/section-heading";
import { SUPPORTED_CURRENCIES } from "@/config/currencies";

export const metadata: Metadata = {
  title: "Personal Banking",
  description:
    "Personal banking information for Veltrix Bank, including account overview, savings and current account information, supported currencies and digital banking benefits.",
};

export default function PersonalBankingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Personal Banking"
        title="Personal banking for everyday financial needs"
        description="A clear, convenient digital banking experience designed for individuals. This page explains planned personal account features; operational account access is scheduled for a later phase."
      />

      <section className="py-16 sm:py-20">
        <Container className="grid gap-6 lg:grid-cols-3">
          <FeatureCard title="Personal account overview" description="A future personal dashboard is planned to present account information, balances and activity in a clear, easy-to-read layout." />
          <FeatureCard title="Account management introduction" description="Customers will be able to review account details and settings through a secure digital experience once authentication is implemented." />
          <FeatureCard title="Digital banking benefits" description="Convenient online access, transparent information and responsive design help make everyday banking easier to manage." />
        </Container>
      </section>

      <section className="bg-veltrix-surface py-16 sm:py-20">
        <Container>
          <SectionHeading eyebrow="Account types" title="Savings and current account information" description="Veltrix Bank is planned to support personal savings and current account types. These account products are informational at this stage and are not yet operational." />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <article className="rounded-2xl border border-veltrix-silver bg-white p-8 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-veltrix-blue">Planned</p>
              <h3 className="mt-3 text-2xl font-semibold text-veltrix-navy">Savings account</h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">Designed for setting money aside with clear visibility of account information. Specific rates, terms and features will be defined and verified before being offered.</p>
            </article>
            <article className="rounded-2xl border border-veltrix-silver bg-white p-8 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-veltrix-blue">Planned</p>
              <h3 className="mt-3 text-2xl font-semibold text-veltrix-navy">Current account</h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">Intended for everyday account management and transaction records. Available services and access details will be published once implemented.</p>
            </article>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <SectionHeading eyebrow="Supported currencies" title="Personal banking in GBP, USD and AUD" description="Personal accounts are planned to support these independent currencies. Currency conversion is not implemented in this phase." />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {Object.values(SUPPORTED_CURRENCIES).map((currency) => (
              <CurrencyCard key={currency.code} code={currency.code} name={currency.name} symbol={currency.symbol} note="Planned personal account currency support." />
            ))}
          </div>
        </Container>
      </section>

      <CTASection title="Interested in a personal account?" description="Registration and secure login are planned for a future phase. You can visit the account registration placeholder to see where the journey will begin." primaryLabel="Account registration" primaryHref="/register" secondaryLabel="View services" secondaryHref="/services" />
    </>
  );
}