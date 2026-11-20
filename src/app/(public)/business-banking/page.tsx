import type { Metadata } from "next";

import { CTASection } from "@/components/ui/cta-section";
import { Container } from "@/components/ui/container";
import { CurrencyCard } from "@/components/ui/currency-card";
import { FeatureCard } from "@/components/ui/feature-card";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeading } from "@/components/ui/section-heading";
import { SUPPORTED_CURRENCIES } from "@/config/currencies";

export const metadata: Metadata = {
  title: "Business Banking",
  description:
    "Business banking information for Veltrix Bank, including account introduction, financial management, multi-currency support and business banking benefits.",
};

export default function BusinessBankingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Business Banking"
        title="Business banking with a clear, modern foundation"
        description="Information for businesses exploring future Veltrix Bank account and financial management services. Business account features described here are planned unless stated otherwise."
      />

      <section className="py-16 sm:py-20">
        <Container className="grid gap-6 lg:grid-cols-3">
          <FeatureCard title="Business account introduction" description="A future business account experience is planned to help organisations manage account information through a clear digital interface." />
          <FeatureCard title="Business financial management" description="Transparent records and organised account views are intended to support everyday financial oversight once operational features are released." />
          <FeatureCard title="Account management" description="Business users will be able to access relevant account information and settings in a secure environment in a later phase." />
        </Container>
      </section>

      <section className="bg-veltrix-surface py-16 sm:py-20">
        <Container>
          <SectionHeading eyebrow="Business benefits" title="Designed to support growing organisations" description="These benefits reflect the intended direction of the platform. No unsupported loan products, credit facilities or business payment integrations are offered or implied." />
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {[
              "Clear digital account information for business decision-making.",
              "Multi-currency account support planned for GBP, USD and AUD.",
              "A professional, responsive experience across devices.",
              "Security-conscious architecture prepared for future protected access.",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-veltrix-silver bg-white p-6 shadow-sm">
                <p className="text-sm leading-7 text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <SectionHeading eyebrow="Multi-currency support" title="Business accounts planned in GBP, USD and AUD" description="Currency conversion is not implemented in this phase and no exchange rates are displayed." />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {Object.values(SUPPORTED_CURRENCIES).map((currency) => (
              <CurrencyCard key={currency.code} code={currency.code} name={currency.name} symbol={currency.symbol} note="Planned business account currency support." />
            ))}
          </div>
        </Container>
      </section>

      <CTASection title="Talk to us about business banking" description="Contact details will be configured as support channels become available. You can also view the registration placeholder prepared for future onboarding." primaryLabel="Contact us" primaryHref="/contact" secondaryLabel="Registration placeholder" secondaryHref="/register" />
    </>
  );
}