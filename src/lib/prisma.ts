import "server-only";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { PrismaClient } from "@/generated/prisma/client";
import { getServerEnv } from "@/lib/env";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  const { DATABASE_URL } = getServerEnv();
  // The adapter rewrites mysql:// URLs for the mariadb driver, which supports
  // both MySQL and MariaDB servers. No database query is made here.
  const adapter = new PrismaMariaDb(DATABASE_URL);
  return new PrismaClient({ adapter });
}

/** Shared server-only Prisma client. No database query is made at import time. */
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
