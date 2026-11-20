import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/ui/container";
import { LoginForm } from "@/components/ui/login-form";
import { PageHeader } from "@/components/ui/page-header";
import { getOptionalSession } from "@/lib/auth/guards";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Login",
  description:
    "Sign in to your Veltrix Bank customer account. Secure, server-verified authentication for this simulated banking platform.",
};

export const instant = false;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getOptionalSession();
  if (session) {
    redirect(session.user.role === "CUSTOMER" ? "/dashboard" : "/admin");
  }

  const params = await searchParams;
  const registered = params.registered === "1";
  const verify = typeof params.verify === "string" ? params.verify : "";
  const reset = params.reset === "1";
  const loggedOut = params.loggedOut === "1";
  const verified = params.verified === "1";

  let notice: string | undefined;
  if (registered) {
    if (verify === "sent") {
      notice =
        "Your account was created successfully. A verification email has been sent. Please verify your email address using the link provided.";
    } else if (verify === "not_configured") {
      notice =
        "Your account was created successfully. Email delivery is not configured in this environment, so a verification email could not be sent automatically. You can request verification from the verification page when delivery is available, or use configured development server logs for testing.";
    } else if (verify === "email_failed") {
      notice =
        "Your account was created successfully, but the verification email could not be sent due to a delivery issue. Please try resending verification later or contact support if the issue persists.";
    } else {
      notice =
        "Your account was created successfully. If email delivery is configured, a verification message will be sent. Please verify your email address before relying on account communications.";
    }
  } else if (reset) {
    notice = "Your password has been reset. You can now sign in with your new password.";
  } else if (loggedOut) {
    notice = "You have been signed out securely.";
  } else if (verified) {
    notice = "Email verification completed. You can sign in to your account.";
  }

  return (
    <>
      <PageHeader
        eyebrow="Account access"
        title="Login"
        description="Sign in securely to access your Veltrix Bank customer dashboard. This is a simulated banking platform."
      />

      <section className="py-16 sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div className="rounded-2xl border border-veltrix-silver bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-semibold text-veltrix-navy">Sign in to your account</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Enter your registered email address and password. Credentials are verified on the server.
            </p>
            <div className="mt-8">
              <LoginForm notice={notice} />
            </div>
            <div className="mt-6 rounded-xl border border-veltrix-silver bg-veltrix-surface p-4 text-sm text-slate-700">
              Need to verify your email?{" "}
              <Link href="/verify-email" className="font-semibold text-veltrix-blue underline decoration-veltrix-blue/30 underline-offset-4">
                Go to verification
              </Link>
            </div>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-28">
            <div className="rounded-2xl border border-veltrix-silver bg-veltrix-surface p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-veltrix-navy">Security reminders</h2>
              <ul className="mt-5 space-y-4 text-sm leading-7 text-slate-700">
                <li className="flex gap-3"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-veltrix-gold" /><span>Use a strong, unique password and keep your sign-in details private.</span></li>
                <li className="flex gap-3"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-veltrix-gold" /><span>Sign out when using a shared or public device.</span></li>
                <li className="flex gap-3"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-veltrix-gold" /><span>If you forget your password, use the secure reset flow to regain access.</span></li>
              </ul>
            </div>
            <div className="rounded-2xl border border-veltrix-silver bg-white p-6 text-sm leading-7 text-slate-600 shadow-sm">
              <strong className="font-semibold text-veltrix-navy">Simulation notice:</strong> Veltrix Bank is a demonstration platform. No real banking services, real payments, or live money movement are provided.
            </div>
          </aside>
        </Container>
      </section>
    </>
  );
}
