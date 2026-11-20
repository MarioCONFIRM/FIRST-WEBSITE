import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Transaction Management" };
export const instant = false;

export default async function AdminTransactionsPage() {
  await requireAdmin();
  return (
    <PlaceholderPage
      area="admin"
      title="Transaction Management"
      description="A future area for reviewing transaction records."
      detail="Transaction management is not implemented in this phase. No financial transaction operations are available."
    />
  );
}
