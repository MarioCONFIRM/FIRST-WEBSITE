import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "System Settings" };
export const instant = false;

export default async function AdminSettingsPage() {
  await requireAdmin();
  return (
    <PlaceholderPage
      area="admin"
      title="System Settings"
      description="A future area for platform configuration."
      detail="System settings are not implemented in this phase."
    />
  );
}
