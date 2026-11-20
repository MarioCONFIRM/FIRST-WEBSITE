import { NextResponse } from "next/server";

import { appConfig } from "@/config/app";

/**
 * Lightweight liveness endpoint. It intentionally does not query the database,
 * so it can be verified without a configured PostgreSQL instance.
 */
export function GET() {
  return NextResponse.json({
    status: "ok",
    application: appConfig.name,
    phase: appConfig.phase,
    mode: "simulation",
  });
}
