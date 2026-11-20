import type { Metadata } from "next";

import { LogoutButton } from "@/components/auth/logout-button";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Account Management" };
export const instant = false;

export default async function AdminAccountsPage() {
  await requireAdmin();

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Account Management"
        description="Authorized administrative area. Account management operations are not implemented in Phase 004 and no account records are displayed."
      />
      <section className="py-12 sm:py-16">
        <Container className="space-y-6">
          <div className="flex justify-end"><LogoutButton /></div>
          <div className="rounded-2xl border border-veltrix-silver bg-white p-6 shadow-sm text-sm leading-7 text-slate-600">
            This protected route is available to authorized administrators only. Account administration features will be implemented in a later phase with appropriate authorization, financial controls, and auditing.
          </div>
        </Container>
      </section>
    </>
  );
}
