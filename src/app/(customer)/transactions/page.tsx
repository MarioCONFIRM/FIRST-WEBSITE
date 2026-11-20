import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireCustomer } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Transactions" };
export const instant = false;

export default async function TransactionsPage() {
  await requireCustomer();
  redirect("/dashboard/transactions");
}
