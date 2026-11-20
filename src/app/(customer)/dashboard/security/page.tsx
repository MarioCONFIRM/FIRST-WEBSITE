import type { Metadata } from "next";
import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";
import { requireCustomer } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Security Settings" };
export const instant = false;

export default async function DashboardSecurityPage() {
  const session = await requireCustomer();
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true, emailVerified: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-veltrix-blue">Security</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-veltrix-navy sm:text-3xl">Security settings</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
          Manage key security actions for your Veltrix Bank account. Session and password changes are processed securely on the server.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-veltrix-silver bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-veltrix-navy">Session</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            You are signed in as <strong className="text-slate-900 break-all">{user?.email}</strong>. Sign out to revoke the current session on this device.
          </p>
          <div className="mt-4"><LogoutButton /></div>
        </section>

        <section className="rounded-2xl border border-veltrix-silver bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-veltrix-navy">Password</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Use the secure password reset flow to change your password. For your protection, a successful password reset invalidates existing sessions.
          </p>
          <Link href="/forgot-password" className="mt-4 inline-flex items-center justify-center rounded-full bg-veltrix-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#10498a]">
            Reset password
          </Link>
        </section>

        <section className="rounded-2xl border border-veltrix-silver bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-veltrix-navy">Email verification</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Status: <strong className="text-slate-900">{user?.emailVerified ? "Verified" : "Pending verification"}</strong>. You can verify your email or request a new verification message if needed.
          </p>
          <Link href="/verify-email" className="mt-4 inline-flex items-center justify-center rounded-full border border-veltrix-blue bg-white px-5 py-2.5 text-sm font-semibold text-veltrix-blue hover:bg-veltrix-surface">
            Verification page
          </Link>
        </section>

        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm leading-7 text-amber-950">
          <h2 className="text-lg font-semibold">Security notes</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Authentication is verified server-side; do not share your credentials.</li>
            <li>Sign out on shared devices.</li>
            <li>Session tokens are stored in HTTP-only cookies and never exposed to client-side scripts or browser storage.</li>
            <li>Veltrix Bank is a simulated platform with no real money movement.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
