import { z } from "zod";

/** ISO 4217 currency codes accepted by the application. */
export const currencyCodeSchema = z.enum(["GBP", "USD", "AUD"]);

export const emailSchema = z.email().max(191);

export const slugSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase URL slug");

export type CurrencyCodeInput = z.infer<typeof currencyCodeSchema>;
