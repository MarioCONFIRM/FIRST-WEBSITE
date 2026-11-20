import "server-only";

import { headers } from "next/headers";

export async function getRequestIp(): Promise<string | null> {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for");
    const ip = (forwarded?.split(",")[0] || h.get("x-real-ip") || "").trim();
    return ip || null;
  } catch {
    return null;
  }
}

export async function getRequestUserAgent(): Promise<string | null> {
  try {
    const h = await headers();
    return h.get("user-agent")?.slice(0, 512) || null;
  } catch {
    return null;
  }
}
