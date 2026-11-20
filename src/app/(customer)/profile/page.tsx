import { redirect } from "next/navigation";

import { requireCustomer } from "@/lib/auth/guards";

export const instant = false;

export default async function ProfileRedirectPage() {
  await requireCustomer();
  redirect("/dashboard/profile");
}
