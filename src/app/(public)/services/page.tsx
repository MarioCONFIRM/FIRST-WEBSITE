import type { Metadata } from "next";

import { CTASection } from "@/components/ui/cta-section";
import { Container } from "@/components/ui/container";
import { FeatureCard } from "@/components/ui/feature-card";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeading } from "@/components/ui/section-heading";
import { ServiceCard } from "@/components/ui/service-card";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Overview of Veltrix Bank services, including personal banking, business banking, multi-currency accounts, account management, transaction records and digital banking.",
};

const icon = (d: string) => (
  <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d={d} /></svg>
);

export default function ServicesPage() {
  return (
    <>
      <PageHeader eyebrow="Banking services" title="Services for personal and business banking" description="This page outlines available information and planned services. Services are labelled clearly so you can distinguish what is informational today from what is planned for future phases." />

      <section className="py-16 sm:py-20">
        <Container>
          <SectionHeading eyebrow="Core services" title="Available information and planned capabilities" align="center" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <ServiceCard title="Personal Banking" description="Banking solutions for everyday financial needs." icon={icon("M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.1a7.5 7.5 0 0 1 15 0")} status="Planned" />
            <ServiceCard title="Business Banking" description="Financial tools and account services for businesses." icon={icon("M3.75 21h16.5M4.5 3h15v4.5h-15V3Zm1.5 4.5V21m12-13.5V21M9 11.25h1.5m3 0H15")} status="Planned" />
            <ServiceCard title="Multi-currency accounts" description="Support for GBP, USD and AUD account currencies as independent currencies." icon={icon("M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm3.5-9c0 4.97-1.57 9-3.5 9s-3.5-4.03-3.5-9 1.57-9 3.5-9 3.5 4.03 3.5 9ZM3.5 12h17")} status="Planned" />
            <ServiceCard title="Account management" description="Manage account information through a secure digital experience." icon={icon("M12 3 4.5 6v5.25c0 4.66 3.2 8.98 7.5 9.75 4.3-.77 7.5-5.09 7.5-9.75V6L12 3Z")} status="Planned" />
            <ServiceCard title="Transaction records" description="View and manage banking transaction records in future phases." icon={icon("M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-9L21 12m0 0-4.5 4.5M21 12H7.5")} status="Planned" />
            <ServiceCard title="Digital banking" description="Access your banking dashboard online through a responsive web experience." icon={icon("M10.5 1.5h3m-6.75 3h10.5A2.25 2.25 0 0 1 19.5 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 17.25V6.75A2.25 2.25 0 0 1 6.75 4.5Z")} status="Planned" />
          </div>
        </Container>
      </section>

      <section className="bg-veltrix-surface py-16 sm:py-20">
        <Container>
          <SectionHeading eyebrow="Service details" title="How our services are organised" description="Personal and business pages provide more detail. Operational features such as payments, transfers and live currency conversion are not yet available." />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <FeatureCard title="Personal Banking" description="Everyday account information, savings and current account introductions, and planned digital banking benefits. See the Personal Banking page for details." />
            <FeatureCard title="Business Banking" description="Business account introduction, financial management information and multi-currency support. See the Business Banking page for details." />
            <FeatureCard title="Account and transaction records" description="The database foundation is prepared for accounts and records, but customer access and transaction operations are future-phase work." />
            <FeatureCard title="Security and privacy" description="Security principles and awareness are published now; active controls will only be claimed when implemented and verified." />
          </div>
          <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm leading-7 text-blue-950">
            <strong className="font-semibold">Note:</strong> We do not claim that unsupported payment or transfer services are already operational. All banking functionality in Veltrix Bank remains simulated demonstration functionality.
          </div>
        </Container>
      </section>

      <CTASection title="Explore the right banking page for you" description="Learn more about personal or business banking, or contact us with your questions." primaryLabel="Personal Banking" primaryHref="/personal-banking" secondaryLabel="Business Banking" secondaryHref="/business-banking" />
    </>
  );
}