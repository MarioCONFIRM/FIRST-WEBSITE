import { describe, expect, it } from "vitest";

import {
  currencyCodeSchema,
  emailSchema,
  slugSchema,
} from "@/validation/common";

describe("shared validation schemas", () => {
  it("accepts only supported ISO currency codes", () => {
    expect(currencyCodeSchema.parse("GBP")).toBe("GBP");
    expect(currencyCodeSchema.parse("USD")).toBe("USD");
    expect(currencyCodeSchema.parse("AUD")).toBe("AUD");
    expect(currencyCodeSchema.safeParse("EUR").success).toBe(false);
  });

  it("validates email addresses", () => {
    expect(emailSchema.safeParse("customer@example.com").success).toBe(true);
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
  });

  it("validates URL slugs", () => {
    expect(slugSchema.parse("my-account")).toBe("my-account");
    expect(slugSchema.safeParse("My Account").success).toBe(false);
  });
});
