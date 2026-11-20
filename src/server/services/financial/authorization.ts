import "server-only";

import { FinancialServiceError } from "./errors";
import type { FinancialActorContext } from "./types";

export function requirePrivilegedFinancialActor(
  actor: FinancialActorContext,
): asserts actor is FinancialActorContext & { actorRole: "ADMIN" | "SUPER_ADMIN" } {
  if (actor.actorRole !== "ADMIN" && actor.actorRole !== "SUPER_ADMIN") {
    throw new FinancialServiceError(
      "FORBIDDEN",
      "Privileged financial operation requires ADMIN or SUPER_ADMIN authorization.",
    );
  }
}

export function assertActorMatches(
  actor: FinancialActorContext,
  expectedUserId: string,
): void {
  if (actor.actorUserId !== expectedUserId) {
    throw new FinancialServiceError(
      "FORBIDDEN",
      "Actor identity does not match the authorized user context.",
    );
  }
}