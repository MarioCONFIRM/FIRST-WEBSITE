import "dotenv/config";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { PrismaClient } from "../src/generated/prisma/client";
import { parseServerEnv } from "../src/lib/env.schema";

const { DATABASE_URL } = parseServerEnv(process.env);
const prisma = new PrismaClient({ adapter: new PrismaMariaDb(DATABASE_URL) });

const supportedCurrencies = [
  { code: "GBP", name: "British Pound", symbol: "£", decimalPlaces: 2 },
  { code: "USD", name: "United States Dollar", symbol: "$", decimalPlaces: 2 },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", decimalPlaces: 2 },
] as const;

async function main(): Promise<void> {
  for (const currency of supportedCurrencies) {
    await prisma.currency.upsert({
      where: { code: currency.code },
      create: { ...currency, isActive: true },
      update: {
        name: currency.name,
        symbol: currency.symbol,
        decimalPlaces: currency.decimalPlaces,
        isActive: true,
      },
    });
  }

  const stored = await prisma.currency.findMany({
    where: { code: { in: supportedCurrencies.map((item) => item.code) } },
    orderBy: { code: "asc" },
    select: { code: true, name: true, symbol: true, decimalPlaces: true },
  });

  console.log(`Seeded ${stored.length} currencies:`);
  for (const currency of stored) {
    console.log(
      `  ${currency.code} — ${currency.name} (${currency.symbol}), ${currency.decimalPlaces} decimals`,
    );
  }
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
