import "server-only";

import { parsePublicEnv, parseServerEnv } from "@/lib/env.schema";

let cachedServerEnv: ReturnType<typeof parseServerEnv> | undefined;
let cachedPublicEnv: ReturnType<typeof parsePublicEnv> | undefined;

/**
 * Server-only environment access. Never call from a Client Component.
 * Secrets validated here are not exposed to the browser.
 */
export function getServerEnv() {
  cachedServerEnv ??= parseServerEnv(process.env);
  return cachedServerEnv;
}

/** Public values are safe for browser use and must use the NEXT_PUBLIC_ prefix. */
export function getPublicEnv() {
  cachedPublicEnv ??= parsePublicEnv(process.env);
  return cachedPublicEnv;
}
