import type { Metadata } from "next";
import Link from "next/link";

import { CTASection } from "@/components/ui/cta-section";
import { Container } from "@/components/ui/container";
import { FeatureCard } from "@/components/ui/feature-card";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata: Metadata = {
  title: "Security",
  description:
    "Security information for Veltrix Bank, including account protection principles, privacy, secure banking practices and fraud awareness.",
};

export default function SecurityPage() {
  return (
    <>
      <PageHeader
        eyebrow="Security"
        title="Security principles and awareness"
        description="This page explains Veltrix Bank's security-conscious approach and the practices we encourage. It clearly distinguishes planned architecture from features that are already implemented and verified."
      />

      <section className="py-16 sm:py-20">
        <Container>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm leading-7 text-amber-950">
            <strong className="font-semibold">Status notice:</strong> Veltrix Bank does not claim that two-factor authentication, fraud monitoring or regulatory certifications are active unless they are implemented and verified in a future phase. Authentication and protected account features are planned.
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard title="Account security principles" description="We design for clear account separation, controlled access and auditable records as part of the platform foundation." />
            <FeatureCard title="Password protection information" description="When authentication is implemented, customers should use strong, unique passwords and never share login credentials. Password-based login is planned, not active." />
            <FeatureCard title="Customer privacy" description="We take a privacy-conscious approach by limiting exposure of sensitive information and separating public content from future protected areas." />
            <FeatureCard title="Secure banking practices" description="Use trusted devices, keep software updated, sign out on shared devices and verify website addresses before entering information." />
            <FeatureCard title="Fraud awareness" description="Be cautious of unexpected messages asking for personal or account information. Veltrix Bank will communicate clearly about verified support channels once configured." />
            <FeatureCard title="Account protection guidance" description="Review account activity regularly when account access becomes available, and report suspicious activity promptly through official channels." />
          </div>
        </Container>
      </section>

      <section className="bg-veltrix-surface py-16 sm:py-20">
        <Container className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          <div>
            <SectionHeading eyebrow="Architecture" title="Security-conscious architecture (planned and foundational)" description="The database and application foundation include structures intended to support secure, auditable operations in later phases." />
          </div>
          <ul className="space-y-4">
            {[
              "Secure authentication architecture — planned for a future phase.",
              "Transaction monitoring architecture — audit/transaction record foundations exist in the database; monitoring workflows are not yet active.",
              "Account protection controls — planned as part of authenticated account management.",
              "Privacy-aware data handling — no customer account data is collected through this public website phase.",
            ].map((item) => (
              <li key={item} className="rounded-xl border border-veltrix-silver bg-white p-4 text-sm leading-7 text-slate-700">{item}</li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <div className="rounded-3xl border border-veltrix-silver bg-white p-8 shadow-sm sm:p-10">
            <h2 className="text-2xl font-bold text-veltrix-navy">Reporting suspicious activity</h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">If you believe you have encountered suspicious activity related to Veltrix Bank, contact us through the official contact page. Verified support email, phone and address details are not yet configured and will be published once available.</p>
            <p className="mt-4 text-sm leading-7 text-slate-600">Contact page: <Link href="/contact" className="font-semibold text-veltrix-blue underline decoration-veltrix-blue/30 underline-offset-4 hover:decoration-veltrix-blue">/contact</Link></p>
          </div>
        </Container>
      </section>

      <CTASection title="Have a security question?" description="Visit our contact page to send a message. Form delivery is not yet configured; the page will explain the current status." primaryLabel="Contact Us" primaryHref="/contact" secondaryLabel="Privacy Policy" secondaryHref="/privacy-policy" />
    </>
  );
}