import type { Metadata } from "next";

import { CTASection } from "@/components/ui/cta-section";
import { Container } from "@/components/ui/container";
import { FeatureCard } from "@/components/ui/feature-card";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Veltrix Bank, our mission, vision, values and approach to modern digital banking.",
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About Veltrix Bank"
        title="A modern approach to digital banking"
        description="Veltrix Bank is being designed as a premium, convenient and transparent digital banking experience for individuals and businesses."
      />

      <section className="py-16 sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <SectionHeading eyebrow="Who we are" title="Who We Are" description="Veltrix Bank is a simulated premium digital banking institution concept focused on accessible financial experiences. The platform is designed to present account information clearly, support multiple currencies and provide a modern online interface." />
          </div>
          <div className="rounded-2xl border border-veltrix-silver bg-veltrix-surface p-8 text-sm leading-7 text-slate-700">
            <p><strong className="font-semibold text-veltrix-navy">Transparency note:</strong> Veltrix Bank does not invent a founding date, physical office, regulatory licence or corporate history. This website represents a demonstration platform and its planned direction.</p>
          </div>
        </Container>
      </section>

      <section className="bg-veltrix-surface py-16 sm:py-20">
        <Container className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-veltrix-silver bg-white p-8 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-veltrix-blue">Our Mission</p>
            <h2 className="mt-3 text-2xl font-bold text-veltrix-navy">Making banking clearer and more convenient</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">&ldquo;To make banking more accessible, convenient and transparent through modern digital financial experiences.&rdquo;</p>
          </article>
          <article className="rounded-2xl border border-veltrix-silver bg-white p-8 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-veltrix-blue">Our Vision</p>
            <h2 className="mt-3 text-2xl font-bold text-veltrix-navy">A trusted digital platform for the future</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">&ldquo;To build a trusted digital banking platform that simplifies how individuals and businesses manage their finances.&rdquo;</p>
          </article>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <SectionHeading eyebrow="Our values" title="Principles that guide our approach" align="center" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard title="Clarity" description="We present information in a straightforward, readable way." />
            <FeatureCard title="Convenience" description="We design experiences that are easy to navigate on any device." />
            <FeatureCard title="Responsibility" description="We avoid unverified claims and communicate feature status honestly." />
            <FeatureCard title="Security awareness" description="We prioritise privacy-conscious and security-conscious design choices." />
          </div>
        </Container>
      </section>

      <section className="bg-veltrix-navy py-16 text-white sm:py-20">
        <Container>
          <SectionHeading eyebrow="Our approach" title="Our Approach to Digital Banking" description="We combine clean design, structured information and a careful technical foundation. As features are implemented and tested in future phases, we will clearly distinguish what is operational from what is planned." dark align="center" />
        </Container>
      </section>

      <CTASection title="Learn more about Veltrix Bank" description="Explore our services, review our security approach, or get in touch through the contact page." primaryLabel="Explore services" primaryHref="/services" secondaryLabel="Security" secondaryHref="/security" />
    </>
  );
}