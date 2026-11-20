import type { CurrencyCode } from "@/types";

export interface CurrencyDefinition {
  code: CurrencyCode;
  name: string;
  symbol: string;
  locale: string;
}

/**
 * Supported ISO 4217 currencies.
 *
 * Exchange rates and conversion are deliberately absent: each currency is an
 * independent unit and conversion will be designed in a later phase.
 */
export const SUPPORTED_CURRENCIES = {
  GBP: {
    code: "GBP",
    name: "British Pound",
    symbol: "£",
    locale: "en-GB",
  },
  USD: {
    code: "USD",
    name: "United States Dollar",
    symbol: "$",
    locale: "en-US",
  },
  AUD: {
    code: "AUD",
    name: "Australian Dollar",
    symbol: "A$",
    locale: "en-AU",
  },
} as const satisfies Record<CurrencyCode, CurrencyDefinition>;

export const SUPPORTED_CURRENCY_CODES = Object.keys(
  SUPPORTED_CURRENCIES,
) as CurrencyCode[];

export function getCurrency(code: CurrencyCode): CurrencyDefinition {
  return SUPPORTED_CURRENCIES[code];
}

export function isSupportedCurrency(code: string): code is CurrencyCode {
  return Object.hasOwn(SUPPORTED_CURRENCIES, code);
}
