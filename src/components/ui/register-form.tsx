"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { SUPPORTED_CURRENCY_CODES, getCurrency } from "@/config/currencies";
import { registerAction, type ActionState } from "@/server/auth/actions";

const initialState: ActionState = { ok: false };

const inputClass =
  "mt-2 w-full rounded-xl border border-veltrix-silver bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-veltrix-blue focus:ring-4 focus:ring-veltrix-blue/10";
const labelClass = "text-sm font-medium text-veltrix-navy";

const countryOptions = [
  ["GB", "United Kingdom"],
  ["US", "United States"],
  ["AU", "Australia"],
  ["CA", "Canada"],
  ["IE", "Ireland"],
  ["NG", "Nigeria"],
  ["GH", "Ghana"],
  ["KE", "Kenya"],
  ["ZA", "South Africa"],
  ["IN", "India"],
  ["DE", "Germany"],
  ["FR", "France"],
  ["ES", "Spain"],
  ["IT", "Italy"],
  ["NL", "Netherlands"],
  ["AE", "United Arab Emirates"],
] as const;

function FieldError({ id, errors }: { id: string; errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p id={id} role="alert" className="mt-2 text-sm text-red-700">
      {errors[0]}
    </p>
  );
}

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <form action={formAction} noValidate className="space-y-6">
      {state.message && !state.ok ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900">
          {state.message}
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className={labelClass}>First name <span aria-hidden="true" className="text-red-700">*</span></label>
          <input id="firstName" name="firstName" type="text" autoComplete="given-name" required className={inputClass} aria-invalid={Boolean(state.fieldErrors?.firstName)} aria-describedby={state.fieldErrors?.firstName ? "firstName-error" : undefined} />
          <FieldError id="firstName-error" errors={state.fieldErrors?.firstName} />
        </div>
        <div>
          <label htmlFor="lastName" className={labelClass}>Last name <span aria-hidden="true" className="text-red-700">*</span></label>
          <input id="lastName" name="lastName" type="text" autoComplete="family-name" required className={inputClass} aria-invalid={Boolean(state.fieldErrors?.lastName)} aria-describedby={state.fieldErrors?.lastName ? "lastName-error" : undefined} />
          <FieldError id="lastName-error" errors={state.fieldErrors?.lastName} />
        </div>

        <div>
          <label htmlFor="email" className={labelClass}>Email address <span aria-hidden="true" className="text-red-700">*</span></label>
          <input id="email" name="email" type="email" autoComplete="email" required className={inputClass} aria-invalid={Boolean(state.fieldErrors?.email)} aria-describedby={state.fieldErrors?.email ? "email-error" : undefined} />
          <FieldError id="email-error" errors={state.fieldErrors?.email} />
        </div>
        <div>
          <label htmlFor="phoneNumber" className={labelClass}>Phone number <span aria-hidden="true" className="text-red-700">*</span></label>
          <input id="phoneNumber" name="phoneNumber" type="tel" autoComplete="tel" required className={inputClass} aria-invalid={Boolean(state.fieldErrors?.phoneNumber)} aria-describedby={state.fieldErrors?.phoneNumber ? "phone-error" : undefined} placeholder="e.g. +44 20 0000 0000" />
          <FieldError id="phone-error" errors={state.fieldErrors?.phoneNumber} />
        </div>

        <div>
          <label htmlFor="country" className={labelClass}>Country <span aria-hidden="true" className="text-red-700">*</span></label>
          <select id="country" name="country" required defaultValue="" className={inputClass} aria-invalid={Boolean(state.fieldErrors?.country)} aria-describedby={state.fieldErrors?.country ? "country-error" : undefined}>
            <option value="" disabled>Select country</option>
            {countryOptions.map(([code, name]) => (
              <option key={code} value={code}>{name} ({code})</option>
            ))}
          </select>
          <FieldError id="country-error" errors={state.fieldErrors?.country} />
        </div>
        <div>
          <label htmlFor="preferredCurrency" className={labelClass}>Account currency <span aria-hidden="true" className="text-red-700">*</span></label>
          <select id="preferredCurrency" name="preferredCurrency" required defaultValue="GBP" className={inputClass} aria-invalid={Boolean(state.fieldErrors?.preferredCurrency)}>
            {SUPPORTED_CURRENCY_CODES.map((code) => {
              const currency = getCurrency(code);
              return <option key={code} value={code}>{currency.code} — {currency.name} ({currency.symbol})</option>;
            })}
          </select>
          <p className="mt-2 text-xs leading-5 text-slate-500">Supported currencies: GBP, USD, AUD. No currency conversion is performed.</p>
          <FieldError id="currency-error" errors={state.fieldErrors?.preferredCurrency} />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="residentialAddress" className={labelClass}>Residential address <span aria-hidden="true" className="text-red-700">*</span></label>
          <textarea id="residentialAddress" name="residentialAddress" rows={3} required autoComplete="street-address" className={inputClass} aria-invalid={Boolean(state.fieldErrors?.residentialAddress)} aria-describedby={state.fieldErrors?.residentialAddress ? "address-error" : undefined} />
          <FieldError id="address-error" errors={state.fieldErrors?.residentialAddress} />
        </div>

        <div>
          <label htmlFor="accountType" className={labelClass}>Initial account type <span aria-hidden="true" className="text-red-700">*</span></label>
          <select id="accountType" name="accountType" required defaultValue="CURRENT" className={inputClass}>
            <option value="CURRENT">Current account (personal)</option>
            <option value="SAVINGS">Savings account (personal)</option>
            <option value="BUSINESS">Business account</option>
          </select>
          <p className="mt-2 text-xs leading-5 text-slate-500">An initial simulated account is created with a zero balance after successful registration.</p>
        </div>
        <div className="hidden sm:block" />

        <div>
          <label htmlFor="password" className={labelClass}>Password <span aria-hidden="true" className="text-red-700">*</span></label>
          <div className="relative">
            <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={12} className={`${inputClass} pr-16`} aria-invalid={Boolean(state.fieldErrors?.password)} aria-describedby={state.fieldErrors?.password ? "password-error" : "password-hint"} />
            <button type="button" onClick={() => setShowPassword((v) => !v)} aria-controls="password" aria-pressed={showPassword} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-veltrix-blue hover:bg-veltrix-surface">{showPassword ? "Hide" : "Show"}</button>
          </div>
          <p id="password-hint" className="mt-2 text-xs leading-5 text-slate-500">At least 12 characters with uppercase, lowercase, number, and symbol.</p>
          <FieldError id="password-error" errors={state.fieldErrors?.password} />
        </div>

        <div>
          <label htmlFor="confirmPassword" className={labelClass}>Confirm password <span aria-hidden="true" className="text-red-700">*</span></label>
          <div className="relative">
            <input id="confirmPassword" name="confirmPassword" type={showConfirm ? "text" : "password"} autoComplete="new-password" required minLength={12} className={`${inputClass} pr-16`} aria-invalid={Boolean(state.fieldErrors?.confirmPassword)} aria-describedby={state.fieldErrors?.confirmPassword ? "confirmPassword-error" : undefined} />
            <button type="button" onClick={() => setShowConfirm((v) => !v)} aria-controls="confirmPassword" aria-pressed={showConfirm} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-veltrix-blue hover:bg-veltrix-surface">{showConfirm ? "Hide" : "Show"}</button>
          </div>
          <FieldError id="confirmPassword-error" errors={state.fieldErrors?.confirmPassword} />
        </div>
      </div>

      <div className="rounded-xl border border-veltrix-silver bg-veltrix-surface p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input type="checkbox" name="termsAccepted" value="true" required className="mt-1 size-4 rounded border-slate-300 text-veltrix-blue focus:ring-veltrix-blue" aria-invalid={Boolean(state.fieldErrors?.termsAccepted)} aria-describedby={state.fieldErrors?.termsAccepted ? "terms-error" : "terms-hint"} />
          <span className="text-sm leading-6 text-slate-700">
            I accept the{" "}
            <Link href="/terms-and-conditions" className="font-medium text-veltrix-blue underline decoration-veltrix-blue/30 underline-offset-4">Terms and Conditions</Link>{" "}
            and{" "}
            <Link href="/privacy-policy" className="font-medium text-veltrix-blue underline decoration-veltrix-blue/30 underline-offset-4">Privacy Policy</Link>{" "}
            and understand Veltrix Bank is a simulated demonstration platform. <span aria-hidden="true" className="text-red-700">*</span>
          </span>
        </label>
        <FieldError id="terms-error" errors={state.fieldErrors?.termsAccepted} />
        {!state.fieldErrors?.termsAccepted ? <p id="terms-hint" className="mt-3 text-xs leading-5 text-slate-500">Required to complete registration.</p> : null}
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        <strong className="font-semibold">Simulation notice:</strong> Registration creates a simulated customer account and an initial account with zero balance. No real banking services, payments, or money movement are provided.
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-veltrix-blue underline decoration-veltrix-blue/30 underline-offset-4">Sign in</Link>
        </p>
        <button type="submit" disabled={pending} className="inline-flex items-center justify-center rounded-full bg-veltrix-blue px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#10498a] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-veltrix-gold disabled:cursor-not-allowed disabled:opacity-60">
          {pending ? "Creating account..." : "Create account"}
        </button>
      </div>
    </form>
  );
}
