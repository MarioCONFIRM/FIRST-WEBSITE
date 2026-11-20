import { z } from "zod";

import { currencyCodeSchema } from "@/validation/common";

const nameSchema = z
  .string()
  .trim()
  .min(1, "This field is required.")
  .max(100, "Must be 100 characters or fewer.");

export const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters.")
  .max(128, "Password must be 128 characters or fewer.")
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/[0-9]/, "Password must include a number.")
  .regex(/[^A-Za-z0-9]/, "Password must include a symbol.");

export const registerSchema = z
  .object({
    firstName: nameSchema,
    lastName: nameSchema,
    email: z.string().trim().min(1, "Email is required.").email("Enter a valid email address.").max(191),
    phoneNumber: z
      .string()
      .trim()
      .min(7, "Enter a valid phone number.")
      .max(32, "Phone number is too long.")
      .regex(/^[0-9+()\-\s]+$/, "Enter a valid phone number."),
    country: z
      .string()
      .trim()
      .length(2, "Select a valid country code.")
      .transform((v) => v.toUpperCase()),
    residentialAddress: z
      .string()
      .trim()
      .min(5, "Residential address is required.")
      .max(500, "Address is too long."),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password."),
    termsAccepted: z.literal(true, {
      error: "You must accept the terms and conditions to continue.",
    }),
    preferredCurrency: currencyCodeSchema.default("GBP"),
    accountType: z.enum(["SAVINGS", "CURRENT", "BUSINESS"]).default("CURRENT"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required.").email("Enter a valid email address.").max(191),
  password: z.string().min(1, "Password is required.").max(128),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, "Email is required.").email("Enter a valid email address.").max(191),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required."),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const resendVerificationSchema = z.object({
  email: z.string().trim().min(1, "Email is required.").email("Enter a valid email address.").max(191),
});

export const profileUpdateSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  phoneNumber: z
    .string()
    .trim()
    .max(32, "Phone number is too long.")
    .refine(
      (v) => v === "" || (/^[0-9+()\-\s]+$/.test(v) && v.replace(/\D/g, "").length >= 7),
      "Enter a valid phone number or leave blank.",
    )
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  country: z
    .string()
    .trim()
    .length(2, "Select a valid country code.")
    .transform((v) => v.toUpperCase()),
  residentialAddress: z
    .string()
    .trim()
    .min(5, "Residential address is required.")
    .max(500, "Address is too long."),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
