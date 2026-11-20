import "server-only";

import { randomInt } from "node:crypto";

import { prisma } from "@/lib/prisma";

import { ACCOUNT_NUMBER_LENGTH, ACCOUNT_NUMBER_MAX_RETRIES } from "./constants";

/**
 * Generates a unique, server-side account number.
 * Uses cryptographic randomness and retries on rare DB uniqueness collisions.
 * Internal database IDs are never used as account numbers.
 */
export async function generateUniqueAccountNumber(): Promise<string> {
  for (let attempt = 0; attempt < ACCOUNT_NUMBER_MAX_RETRIES; attempt += 1) {
    // 12-digit numeric identifier with a non-zero leading digit for readability.
    let candidate = String(randomInt(1, 10));
    for (let i = 1; i < ACCOUNT_NUMBER_LENGTH; i += 1) {
      candidate += String(randomInt(0, 10));
    }

    const existing = await prisma.bankAccount.findUnique({
      where: { accountNumber: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }
  }

  throw new Error("Unable to generate a unique account number. Please try again.");
}
