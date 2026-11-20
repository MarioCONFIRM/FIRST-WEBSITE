import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Draft privacy policy for Veltrix Bank. Requires legal review before production use.",
};

const sections = [
  { title: "1. Introduction", body: "This draft Privacy Policy explains how Veltrix Bank may collect, use and protect information in connection with this platform. It is provided for demonstration and planning purposes and must be reviewed by qualified legal professionals before production use." },
  { title: "2. Information we may collect", body: "Depending on future features, information may include contact details, account identifiers, usage information and support communications. This public website phase does not implement customer account registration or collect personal banking data." },
  { title: "3. How information may be used", body: "Information may be used to provide services, respond to enquiries, maintain security, improve the platform and meet applicable obligations. Actual data-handling practices will be documented accurately once implemented." },
  { title: "4. Sharing and disclosure", body: "Information should only be shared where necessary to operate services, comply with lawful requests or protect the platform, subject to appropriate safeguards and review. No specific third-party sharing arrangements are claimed at this stage." },
  { title: "5. Data retention and security", body: "Information should be retained only as long as necessary for legitimate purposes and protected using appropriate technical and organisational measures. Specific retention periods and controls will be defined before production use." },
  { title: "6. Your choices and rights", body: "Depending on applicable law, individuals may have rights to access, correct or request deletion of certain information. Applicable rights and procedures will be confirmed during legal review." },
  { title: "7. Contact", body: "Privacy contact details are not yet configured. Please use the Contact page for general enquiries until verified privacy contact information is published." },
];

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Privacy Policy" description="Draft privacy policy for the Veltrix Bank platform." />
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