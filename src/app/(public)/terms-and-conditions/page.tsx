import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description:
    "Draft terms and conditions for Veltrix Bank. Requires legal review before production use.",
};

const sections = [
  { title: "1. About these terms", body: "These draft Terms and Conditions govern use of the Veltrix Bank website and any future services made available through it. They are provided for demonstration and planning purposes and require legal review before production use." },
  { title: "2. Simulation notice", body: "Veltrix Bank is a simulated digital banking platform. No real money, accounts, transfers, cards, loans or payments are processed. No banking products or services are currently offered through this public website phase." },
  { title: "3. Use of the website", body: "You agree to use this website lawfully and not to attempt to disrupt, misuse or gain unauthorised access to the platform or related systems." },
  { title: "4. Information accuracy", body: "We aim to present clear and accurate information, but content on this demonstration site may describe planned features. Feature availability will be stated clearly and only claimed when implemented and verified." },
  { title: "5. Accounts and services", body: "Customer registration, authentication, account creation and transaction services are not implemented in this phase. Any future services will be subject to separate terms, eligibility requirements and verification." },
  { title: "6. Intellectual property", body: "The Veltrix Bank name, branding elements and website content are provided for this project unless otherwise stated. Unauthorised use may be restricted by applicable law." },
  { title: "7. Limitation and disclaimers", body: "This draft is not legal advice and does not create regulatory, insurance or compliance assurances. Final terms, limitations and disclaimers must be prepared and approved through legal review." },
  { title: "8. Changes and contact", body: "These draft terms may change as the platform evolves. Contact details for terms enquiries will be published when configured; until then, use the Contact page for general enquiries." },
];

export default function TermsPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Terms and Conditions" description="Draft terms and conditions for the Veltrix Bank platform." />
      <section className="py-16 sm:py-20">
        <Container className="max-w-4xl">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-950">
            <strong className="font-semibold">Legal review required:</strong> This document is a draft and requires legal review before production use. It does not claim regulatory approval or legal compliance.
          </div>
          <div className="mt-8 space-y-6">
            {sections.map((section) => (
              <article key={section.title} className="rounded-2xl border border-veltrix-silver bg-white p-7 shadow-sm">
                <h2 className="text-xl font-semibold text-veltrix-navy">{section.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{section.body}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}