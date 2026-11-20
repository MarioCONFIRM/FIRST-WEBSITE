import type { Metadata } from "next";

import { ContactForm } from "@/components/ui/contact-form";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { appConfig } from "@/config/app";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Veltrix Bank. Send a message using the contact form (prepared for future integration) and view configurable support information.",
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Contact Veltrix Bank"
        description="Use the form below to prepare a message. Delivery is not yet configured, so messages cannot be sent in this phase."
      />

      <section className="py-16 sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-2xl border border-veltrix-silver bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-semibold text-veltrix-navy">Send a message</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">All fields are required. Client-side validation will highlight any issues before submission.</p>
            <div className="mt-6">
              <ContactForm />
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-veltrix-silver bg-veltrix-surface p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-veltrix-navy">Customer support information</h2>
              <dl className="mt-5 space-y-4 text-sm">
                <div>
                  <dt className="font-medium text-slate-500">Email address</dt>
                  <dd className="mt-1 text-slate-800">{appConfig.support.email}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500">Phone number</dt>
                  <dd className="mt-1 text-slate-800">{appConfig.support.phone}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500">Office address</dt>
                  <dd className="mt-1 text-slate-800">{appConfig.support.address}</dd>
                </div>
              </dl>
              <p className="mt-6 text-sm leading-7 text-slate-600">These are configurable placeholders. No phone numbers, office addresses or email addresses are invented.</p>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 text-sm leading-7 text-blue-950">
              <strong className="font-semibold">Need help with security concerns?</strong> Visit the <a href="/security" className="font-semibold underline decoration-blue-300 underline-offset-4">Security page</a> for guidance and reporting information.
            </div>
          </aside>
        </Container>
      </section>
    </>
  );
}