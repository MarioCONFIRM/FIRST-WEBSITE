import type { Metadata } from "next";

import { CTASection } from "@/components/ui/cta-section";
import { Container } from "@/components/ui/container";
import { CurrencyCard } from "@/components/ui/currency-card";
import { FeatureCard } from "@/components/ui/feature-card";
import { HeroSection } from "@/components/ui/hero-section";
import { SectionHeading } from "@/components/ui/section-heading";
import { SecuritySection } from "@/components/ui/security-section";
import { ServiceCard } from "@/components/ui/service-card";
import { SUPPORTED_CURRENCIES } from "@/config/currencies";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Experience a smarter way to manage your money with Veltrix Bank's modern digital banking experience, transparent account information and multi-currency support.",
};

const serviceIcon = (path: string) => (
  <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

const services = [
  {
    title: "Personal Banking",
    description: "Banking solutions for everyday financial needs.",
    icon: serviceIcon("M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.1a7.5 7.5 0 0 1 15 0"),
  },
  {
    title: "Business Banking",
    description: "Financial tools and account services for businesses.",
    icon: serviceIcon("M3.75 21h16.5M4.5 3h15v4.5h-15V3Zm1.5 4.5V21m12-13.5V21M9 11.25h1.5m3 0H15M9 15h1.5m3 0H15"),
  },
  {
    title: "International Currency Support",
    description: "Support for GBP, USD and AUD account currencies.",
    icon: serviceIcon("M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0c2.5 0 4.5-4.03 4.5-9S14.5 3 12 3m0 18c-2.5 0-4.5-4.03-4.5-9S9.5 3 12 3M3.5 9h17M3.5 15h17"),
  },
  {
    title: "Secure Account Management",
    description: "Manage account information through a secure digital experience.",
    icon: serviceIcon("M12 3 4.5 6v5.25c0 4.66 3.2 8.98 7.5 9.75 4.3-.77 7.5-5.09 7.5-9.75V6L12 3Zm0 6v4.5m0 3h.008"),
  },
  {
    title: "Digital Banking",
    description: "Access your banking dashboard online.",
    icon: serviceIcon("M10.5 1.5h3m-6.75 3h10.5A2.25 2.25 0 0 1 19.5 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 17.25V6.75A2.25 2.25 0 0 1 6.75 4.5Zm2.25 5.25h6m-6 3h6m-6 3h3"),
  },
  {
    title: "Transaction Management",
    description: "View and manage your banking transaction records.",
    icon: serviceIcon("M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-9L21 12m0 0-4.5 4.5M21 12H7.5"),
  },
];

const advantages = [
  { title: "Convenient digital access", description: "A clear online experience designed to make banking information easier to reach and understand." },
  { title: "Modern banking experience", description: "A clean, responsive interface built for desktops, tablets and mobile devices." },
  { title: "Transparent account information", description: "Straightforward layouts and clear labels help present account details without confusion." },
  { title: "Multiple currency support", description: "Designed to support GBP, USD and AUD as independent account currencies." },
  { title: "Customer-focused services", description: "Pages and features are organized around the needs of personal and business customers." },
  { title: "Security-conscious architecture", description: "A foundation prepared for secure access, privacy-aware design and auditable records in future phases." },
];

export default function HomePage() {
  return (
    <>
      <HeroSection />

      <section className="py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Our services"
            title="Banking services designed for clarity and convenience"
            description="Explore the core areas of the Veltrix Bank experience. Features marked as planned are part of future development phases and are not yet operational."
            align="center"
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceCard key={service.title} {...service} status="Planned" />
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-veltrix-surface py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Why choose Veltrix Bank"
            title="Advantages built around a modern digital experience"
            description="We focus on practical benefits: accessible design, transparent information and a platform prepared for secure growth."
            align="center"
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {advantages.map((item) => (
              <FeatureCard key={item.title} title={item.title} description={item.description} />
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-6 text-slate-500">
            Veltrix Bank makes no unverified claims of guaranteed returns, government insurance or regulatory approval.
          </p>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-end">
            <SectionHeading
              eyebrow="Supported currencies"
              title="Designed for GBP, USD and AUD"
              description="Veltrix Bank is designed to support British Pound, United States Dollar and Australian Dollar account currencies as independent currencies."
            />
            <div className="rounded-2xl border border-veltrix-silver bg-veltrix-surface p-5 text-sm leading-7 text-slate-700">
              Live exchange rates are not displayed and currency conversion is not implemented in this phase. Each currency is treated separately to keep account information clear.
            </div>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {Object.values(SUPPORTED_CURRENCIES).map((currency) => (
              <CurrencyCard
                key={currency.code}
                code={currency.code}
                name={currency.name}
                symbol={currency.symbol}
                note={`Account currency support planned for ${currency.name} (${currency.symbol}).`}
              />
            ))}
          </div>
        </Container>
      </section>

      <SecuritySection />

      <CTASection
        title="Start exploring the Veltrix Bank experience"
        description="Review our services, learn about our security approach, or visit the account registration placeholder prepared for a future phase."
        primaryLabel="Open an Account"
        primaryHref="/register"
        secondaryLabel="Contact Us"
        secondaryHref="/contact"
      />
    </>
  );
}