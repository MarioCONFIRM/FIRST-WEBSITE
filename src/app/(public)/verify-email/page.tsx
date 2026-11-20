import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { VerifyEmailForm } from "@/components/ui/verify-email-form";

export const metadata: Metadata = {
  title: "Verify Email",
  description: "Verify your Veltrix Bank email address using a secure, single-use verification link.",
};

export const instant = false;

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";

  return (
    <>
      <PageHeader
        eyebrow="Account access"
        title="Verify your email"
        description="Confirm your email address to complete this verification step. Verification links are time-limited, single-use, and validated on the server."
      />
      <section className="py-16 sm:py-20">
        <Container className="max-w-2xl">
          <div className="rounded-2xl border border-veltrix-silver bg-white p-6 shadow-sm sm:p-8">
            <VerifyEmailForm token={token} />
            <p className="mt-6 text-xs leading-5 text-slate-500">
              If email delivery is not configured in this environment, verification messages cannot be sent. Use the configured development server logs (non-production) or configure SMTP to test delivery.
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
