import { describe, expect, it } from "vitest";

import {
  forgotPasswordSchema,
  loginSchema,
  profileUpdateSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
} from "@/validation/auth";

const validRegistration = {
  firstName: "Jane",
  lastName: "Doe",
  email: "jane.doe@example.com",
  phoneNumber: "+44 7700 900123",
  country: "gb",
  residentialAddress: "10 Example Street, London, SW1A 1AA",
  password: "Str0ng!Passw0rd",
  confirmPassword: "Str0ng!Passw0rd",
  termsAccepted: true as const,
  preferredCurrency: "GBP" as const,
  accountType: "CURRENT" as const,
};

describe("auth validation schemas", () => {
  it("accepts valid registration input and normalizes country", () => {
    const parsed = registerSchema.safeParse(validRegistration);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.country).toBe("GB");
      expect(parsed.data.preferredCurrency).toBe("GBP");
    }
  });

  it("rejects invalid registration email", () => {
    const parsed = registerSchema.safeParse({ ...validRegistration, email: "not-an-email" });
    expect(parsed.success).toBe(false);
  });

  it("rejects weak registration password", () => {
    const parsed = registerSchema.safeParse({
      ...validRegistration,
      password: "weakpassword",
      confirmPassword: "weakpassword",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects mismatched registration passwords", () => {
    const parsed = registerSchema.safeParse({
      ...validRegistration,
      confirmPassword: "Different!Passw0rd1",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects registration without terms acceptance", () => {
    const parsed = registerSchema.safeParse({ ...validRegistration, termsAccepted: false });
    expect(parsed.success).toBe(false);
  });

  it("rejects unsupported registration currency", () => {
    const parsed = registerSchema.safeParse({ ...validRegistration, preferredCurrency: "EUR" });
    expect(parsed.success).toBe(false);
  });

  it("accepts supported registration currencies and schema-supported account types", () => {
    for (const preferredCurrency of ["GBP", "USD", "AUD"] as const) {
      for (const accountType of ["SAVINGS", "CURRENT", "BUSINESS"] as const) {
        const parsed = registerSchema.safeParse({ ...validRegistration, preferredCurrency, accountType });
        expect(parsed.success).toBe(true);
      }
    }
  });

  it("accepts login shape and rejects empty login password", () => {
    expect(loginSchema.safeParse({ email: "user@example.com", password: "any" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "user@example.com", password: "" }).success).toBe(false);
  });

  it("accepts forgot-password and resend-verification email input", () => {
    expect(forgotPasswordSchema.safeParse({ email: "user@example.com" }).success).toBe(true);
    expect(resendVerificationSchema.safeParse({ email: "user@example.com" }).success).toBe(true);
  });

  it("rejects reset password when confirmation does not match", () => {
    const parsed = resetPasswordSchema.safeParse({
      token: "reset-token",
      password: "Str0ng!Passw0rd",
      confirmPassword: "Different!Passw0rd1",
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts permitted profile updates and strips privileged fields", () => {
    const parsed = profileUpdateSchema.safeParse({
      firstName: "A",
      lastName: "B",
      phoneNumber: "",
      country: "gb",
      residentialAddress: "123 Main Street",
      role: "ADMIN",
      balance: "999",
      accountNumber: "123456789012",
      emailVerified: true,
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.country).toBe("GB");
      expect(parsed.data.phoneNumber).toBeNull();
      expect(Object.keys(parsed.data).sort()).toEqual([
        "country",
        "firstName",
        "lastName",
        "phoneNumber",
        "residentialAddress",
      ]);
      expect("role" in (parsed.data as Record<string, unknown>)).toBe(false);
      expect("balance" in (parsed.data as Record<string, unknown>)).toBe(false);
      expect("accountNumber" in (parsed.data as Record<string, unknown>)).toBe(false);
      expect("emailVerified" in (parsed.data as Record<string, unknown>)).toBe(false);
    }
  });
});
