import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { RegisterForm } from "@/components/ui/register-form";
import { getOptionalSession } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Open an Account",
  description:
    "Register for a Veltrix Bank customer account. Secure server-side registration creates a simulated account with zero balance.",
};

export const instant = false;

export default async function RegisterPage() {
  const session = await getOptionalSession();
  if (session) {
    redirect(session.user.role === "CUSTOMER" ? "/dashboard" : "/admin");
  }

  return (
    <>
      <PageHeader
        eyebrow="Account access"
        title="Open an Account"
        description="Create your Veltrix Bank customer account. Registration is securely processed on the server and creates an initial simulated account with zero balance."
      />

      <section className="py-16 sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div className="rounded-2xl border border-veltrix-silver bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-semibold text-veltrix-navy">Registration details</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Provide accurate information to create your customer profile and initial account. Email verification is required as a separate step and is not completed automatically.
            </p>
            <div className="mt-8">
              <RegisterForm />
            </div>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-28">
            <div className="rounded-2xl border border-veltrix-silver bg-veltrix-surface p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-veltrix-navy">What happens next</h2>
              <ul className="mt-5 space-y-4 text-sm leading-7 text-slate-700">
                <li className="flex gap-3"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-veltrix-gold" /><span>Your customer profile is created securely with a hashed password.</span></li>
                <li className="flex gap-3"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-veltrix-gold" /><span>An initial simulated bank account (GBP, USD, or AUD) is created with a zero balance.</span></li>
                <li className="flex gap-3"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-veltrix-gold" /><span>Verify your email using the link sent when email delivery is configured.</span></li>
              </ul>
            </div>
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 text-sm leading-7 text-blue-950">
              <h3 className="font-semibold text-blue-950">Important</h3>
              <p className="mt-2">Administrator accounts cannot be created through public registration. Customers can access only their own permitted data after signing in.</p>
            </div>
          </aside>
        </Container>
      </section>
    </>
  );
}
