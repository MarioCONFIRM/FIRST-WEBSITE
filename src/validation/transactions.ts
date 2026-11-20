import { z } from "zod";

export const TRANSACTION_TYPE_FILTERS = [
  "ALL",
  "DEPOSIT",
  "WITHDRAWAL",
  "TRANSFER",
  "CURRENCY_CONVERSION",
  "FEE",
  "REVERSAL",
] as const;

export const TRANSACTION_STATUS_FILTERS = [
  "ALL",
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "REVERSED",
] as const;

export const CURRENCY_FILTERS = ["ALL", "GBP", "USD", "AUD"] as const;

export const transactionListSearchSchema = z.object({
  type: z.enum(TRANSACTION_TYPE_FILTERS).catch("ALL"),
  status: z.enum(TRANSACTION_STATUS_FILTERS).catch("ALL"),
  currency: z.enum(CURRENCY_FILTERS).catch("ALL"),
  from: z
    .string()
    .optional()
    .transform((v) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined)),
  to: z
    .string()
    .optional()
    .transform((v) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined)),
  page: z
    .string()
    .optional()
    .transform((v) => {
      const n = Number(v);
      if (!Number.isInteger(n) || n < 1) return 1;
      return Math.min(n, 10000);
    }),
});

export type TransactionListFilters = z.infer<typeof transactionListSearchSchema>;

export const TRANSACTIONS_PAGE_SIZE = 10;
