import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { ResetPasswordForm } from "@/components/ui/reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your Veltrix Bank account using a secure, single-use reset link.",
};

export const instant = false;

export default async function ResetPasswordPage({
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
        title="Reset password"
        description="Choose a new password for your account. Reset links are single-use, time-limited, and verified on the server."
      />
      <section className="py-16 sm:py-20">
        <Container className="max-w-2xl">
          <div className="rounded-2xl border border-veltrix-silver bg-white p-6 shadow-sm sm:p-8">
            <ResetPasswordForm token={token} />
          </div>
        </Container>
      </section>
    </>
  );
}
