import { describe, expect, it } from "vitest";

import {
  SUPPORTED_CURRENCIES,
  SUPPORTED_CURRENCY_CODES,
  getCurrency,
  isSupportedCurrency,
} from "@/config/currencies";

describe("currency configuration", () => {
  it("supports exactly GBP, USD and AUD", () => {
    expect(SUPPORTED_CURRENCY_CODES).toEqual(["GBP", "USD", "AUD"]);
  });

  it("defines ISO codes and names for every supported currency", () => {
    for (const code of SUPPORTED_CURRENCY_CODES) {
      const currency = getCurrency(code);
      expect(currency.code).toBe(code);
      expect(currency.name.length).toBeGreaterThan(0);
      expect(currency.symbol.length).toBeGreaterThan(0);
    }

    const names = SUPPORTED_CURRENCY_CODES.map((code) => getCurrency(code).name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("rejects unsupported currency codes", () => {
    expect(isSupportedCurrency("EUR")).toBe(false);
    expect(isSupportedCurrency("gbp")).toBe(false);
  });

  it("does not assume shared exchange rates", () => {
    for (const currency of Object.values(SUPPORTED_CURRENCIES)) {
      expect(currency).not.toHaveProperty("rate");
      expect(currency).not.toHaveProperty("exchangeRate");
    }
  });
});
