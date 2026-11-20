import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { requireCustomer } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Transfers" };
export const instant = false;

export default async function TransfersPage() {
  await requireCustomer();
  return (
    <PlaceholderPage
      area="customer"
      title="Transfers"
      description="A future interface for simulated fund transfers."
      detail="Transfers are not implemented in this phase. No deposits, withdrawals, transfers, or currency conversion are available."
    />
  );
}
