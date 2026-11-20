import type { Metadata } from "next";

import { LogoutButton } from "@/components/auth/logout-button";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Customer Management" };
export const instant = false;

export default async function AdminCustomersPage() {
  await requireAdmin();

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Customer Management"
        description="Authorized administrative area. Customer management operations are not implemented in Phase 004 and no customer records are displayed."
      />
      <section className="py-12 sm:py-16">
        <Container className="space-y-6">
          <div className="flex justify-end"><LogoutButton /></div>
          <div className="rounded-2xl border border-veltrix-silver bg-white p-6 shadow-sm text-sm leading-7 text-slate-600">
            This protected route is available to authorized administrators only. Detailed customer management features will be implemented in a later phase with appropriate authorization and auditing controls.
          </div>
        </Container>
      </section>
    </>
  );
}
