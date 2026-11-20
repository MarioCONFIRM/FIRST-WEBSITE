import { redirect } from "next/navigation";

import { requireCustomer } from "@/lib/auth/guards";

export const instant = false;

export default async function SettingsRedirectPage() {
  await requireCustomer();
  redirect("/dashboard/security");
}
