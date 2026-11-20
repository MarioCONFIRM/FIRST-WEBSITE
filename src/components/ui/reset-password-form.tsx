"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { resetPasswordAction, type ActionState } from "@/server/auth/actions";

const initialState: ActionState = { ok: false };
const inputClass =
  "mt-2 w-full rounded-xl border border-veltrix-silver bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-veltrix-blue focus:ring-4 focus:ring-veltrix-blue/10";

function FieldError({ id, errors }: { id: string; errors?: string[] }) {
  if (!errors?.length) return null;
  return <p id={id} role="alert" className="mt-2 text-sm text-red-700">{errors[0]}</p>;
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!token) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900">
        This password reset link is invalid. Please request a new one.
        <div className="mt-3"><Link href="/forgot-password" className="font-semibold text-veltrix-blue underline">Request reset</Link></div>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate className="space-y-6">
      <input type="hidden" name="token" value={token} />
      {state.message && !state.ok ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900">
          {state.message}
          <div className="mt-2"><Link href="/forgot-password" className="font-semibold underline">Request a new reset link</Link></div>
        </div>
      ) : null}

      <div>
        <label htmlFor="password" className="text-sm font-medium text-veltrix-navy">New password <span aria-hidden="true" className="text-red-700">*</span></label>
        <div className="relative">
          <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={12} className={`${inputClass} pr-16`} aria-invalid={Boolean(state.fieldErrors?.password)} aria-describedby={state.fieldErrors?.password ? "password-error" : "password-hint"} />
          <button type="button" onClick={() => setShowPassword((v) => !v)} aria-controls="password" aria-pressed={showPassword} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-veltrix-blue hover:bg-veltrix-surface">{showPassword ? "Hide" : "Show"}</button>
        </div>
        <p id="password-hint" className="mt-2 text-xs leading-5 text-slate-500">At least 12 characters with uppercase, lowercase, number, and symbol.</p>
        <FieldError id="password-error" errors={state.fieldErrors?.password} />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="text-sm font-medium text-veltrix-navy">Confirm new password <span aria-hidden="true" className="text-red-700">*</span></label>
        <div className="relative">
          <input id="confirmPassword" name="confirmPassword" type={showConfirm ? "text" : "password"} autoComplete="new-password" required minLength={12} className={`${inputClass} pr-16`} aria-invalid={Boolean(state.fieldErrors?.confirmPassword)} aria-describedby={state.fieldErrors?.confirmPassword ? "confirmPassword-error" : undefined} />
          <button type="button" onClick={() => setShowConfirm((v) => !v)} aria-controls="confirmPassword" aria-pressed={showConfirm} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-veltrix-blue hover:bg-veltrix-surface">{showConfirm ? "Hide" : "Show"}</button>
        </div>
        <FieldError id="confirmPassword-error" errors={state.fieldErrors?.confirmPassword} />
      </div>

      <p className="text-sm text-slate-600">For security, all active sessions will be signed out after your password is reset.</p>

      <button type="submit" disabled={pending} className="inline-flex w-full items-center justify-center rounded-full bg-veltrix-blue px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#10498a] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
        {pending ? "Resetting..." : "Reset password"}
      </button>
    </form>
  );
}
