import type { Metadata } from "next";

import { LogoutButton } from "@/components/auth/logout-button";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Admin Dashboard" };
export const instant = false;

export default async function AdminDashboardPage() {
  const session = await requireAdmin();

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Admin Dashboard"
        description="Authorized administrative access for Veltrix Bank. This phase provides protected access control and placeholders only; no privileged data operations are implemented."
      />
      <section className="py-12 sm:py-16">
        <Container className="space-y-6">
          <div className="flex flex-col gap-4 rounded-2xl border border-veltrix-silver bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-500">Signed in as</p>
              <p className="mt-1 font-semibold text-veltrix-navy">{session.user.email}</p>
              <p className="mt-1 text-sm text-slate-600">Role: {session.user.role}</p>
            </div>
            <LogoutButton />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <a href="/admin/customers" className="rounded-2xl border border-veltrix-silver bg-white p-6 shadow-sm hover:border-veltrix-blue">
              <h2 className="text-lg font-semibold text-veltrix-navy">Customers</h2>
              <p className="mt-2 text-sm text-slate-600">Protected placeholder for authorized customer management features (not implemented in Phase 004).</p>
            </a>
            <a href="/admin/accounts" className="rounded-2xl border border-veltrix-silver bg-white p-6 shadow-sm hover:border-veltrix-blue">
              <h2 className="text-lg font-semibold text-veltrix-navy">Accounts</h2>
              <p className="mt-2 text-sm text-slate-600">Protected placeholder for authorized account management features (not implemented in Phase 004).</p>
            </a>
          </div>
        </Container>
      </section>
    </>
  );
}
