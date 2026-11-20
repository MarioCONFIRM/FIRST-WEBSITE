import { redirect } from "next/navigation";

import { requireCustomer } from "@/lib/auth/guards";

export const instant = false;

export default async function AccountsRedirectPage() {
  await requireCustomer();
  redirect("/dashboard/accounts");
}
