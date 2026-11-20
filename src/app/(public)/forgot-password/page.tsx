import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/ui/container";
import { ForgotPasswordForm } from "@/components/ui/forgot-password-form";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Request secure password reset instructions for your Veltrix Bank account.",
};

export default function ForgotPasswordPage() {
  return (
    <>
      <PageHeader
        eyebrow="Account access"
        title="Forgot password"
        description="Enter your email address to request password reset instructions. For security, the response does not confirm whether an account exists."
      />
      <section className="py-16 sm:py-20">
        <Container className="max-w-2xl">
          <div className="rounded-2xl border border-veltrix-silver bg-white p-6 shadow-sm sm:p-8">
            <ForgotPasswordForm />
            <p className="mt-6 text-sm text-slate-600">
              Remembered your password?{" "}
              <Link href="/login" className="font-semibold text-veltrix-blue underline decoration-veltrix-blue/30 underline-offset-4">
                Back to login
              </Link>
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
