import type { ReactNode } from "react";

import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { BalanceVisibilityProvider } from "@/components/dashboard/balance-visibility";
import { requireCustomer } from "@/lib/auth/guards";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireCustomer();
  const customerName = `${session.user.firstName} ${session.user.lastName}`.trim() || session.user.email;

  return (
    <BalanceVisibilityProvider>
      <div className="min-h-[60vh] bg-veltrix-surface/40">
        <DashboardNav customerName={customerName} />
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </div>
      </div>
    </BalanceVisibilityProvider>
  );
}
