import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { requireCustomer } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Statements" };
export const instant = false;

export default async function StatementsPage() {
  await requireCustomer();
  return (
    <PlaceholderPage
      area="customer"
      title="Statements"
      description="A future area for account statements and documents."
      detail="Statement generation is not implemented in this phase."
    />
  );
}
