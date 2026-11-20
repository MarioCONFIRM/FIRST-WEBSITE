import "server-only";

import { redirect } from "next/navigation";

import { getActiveSession, type SessionWithUser } from "./session";

export async function requireSession(): Promise<SessionWithUser> {
  const session = await getActiveSession();
  if (!session || session.user.accountStatus !== "ACTIVE") {
    redirect("/login");
  }
  return session;
}

export async function requireRole(
  roles: Array<"CUSTOMER" | "ADMIN" | "SUPER_ADMIN">,
): Promise<SessionWithUser> {
  const session = await requireSession();
  if (!roles.includes(session.user.role)) {
    if (session.user.role === "CUSTOMER") {
      redirect("/dashboard");
    }
    redirect("/login");
  }
  return session;
}

export async function requireCustomer(): Promise<SessionWithUser> {
  return requireRole(["CUSTOMER"]);
}

export async function requireAdmin(): Promise<SessionWithUser> {
  return requireRole(["ADMIN", "SUPER_ADMIN"]);
}

export async function getOptionalSession(): Promise<SessionWithUser | null> {
  const session = await getActiveSession();
  if (!session || session.user.accountStatus !== "ACTIVE") return null;
  return session;
}
