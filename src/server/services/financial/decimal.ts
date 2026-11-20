import "server-only";

import { Prisma } from "@/generated/prisma/client";

export type MoneyDecimal = Prisma.Decimal;

export const ZERO = new Prisma.Decimal(0);

export function decimal(value: Prisma.Decimal | string | number): Prisma.Decimal {
  if (value instanceof Prisma.Decimal) return value;
  // Accept only string/decimal-like inputs in callers; numbers should be avoided
  // for money but we construct from string form when needed.
  return new Prisma.Decimal(String(value));
}

export function isPositiveAmount(value: Prisma.Decimal): boolean {
  return value.gt(ZERO);
}

export function isZero(value: Prisma.Decimal): boolean {
  return value.eq(ZERO);
}

export function sumDecimals(values: Prisma.Decimal[]): Prisma.Decimal {
  return values.reduce((acc, v) => acc.add(v), new Prisma.Decimal(0));
}

export function decimalsEqual(a: Prisma.Decimal, b: Prisma.Decimal): boolean {
  return a.eq(b);
}

export function toDecimalString(value: Prisma.Decimal): string {
  // Fixed 4dp representation aligned with DECIMAL(19,4) storage.
  return value.toFixed(4);
}