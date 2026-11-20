"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { loginAction, type ActionState } from "@/server/auth/actions";

const initialState: ActionState = { ok: false };

const inputClass =
  "mt-2 w-full rounded-xl border border-veltrix-silver bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-veltrix-blue focus:ring-4 focus:ring-veltrix-blue/10";
const labelClass = "text-sm font-medium text-veltrix-navy";

export function LoginForm({
  notice,
}: {
  notice?: string;
}) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} noValidate className="space-y-6">
      {notice ? (
        <div
          role="status"
          className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950"
        >
          {notice}
        </div>
      ) : null}

      {state.message && !state.ok ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900"
        >
          {state.message}
        </div>
      ) : null}

      <div>
        <label htmlFor="login-email" className={labelClass}>
          Email address <span aria-hidden="true" className="text-red-700">*</span>
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className={inputClass}
          aria-invalid={Boolean(state.fieldErrors?.email?.length)}
          aria-describedby={state.fieldErrors?.email?.length ? "login-email-error" : undefined}
          placeholder="name@example.com"
        />
        {state.fieldErrors?.email?.length ? (
          <p id="login-email-error" role="alert" className="mt-2 text-sm text-red-700">
            {state.fieldErrors.email[0]}
          </p>
        ) : null}
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="login-password" className={labelClass}>
            Password <span aria-hidden="true" className="text-red-700">*</span>
          </label>
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-veltrix-blue underline decoration-veltrix-blue/30 underline-offset-4 hover:decoration-veltrix-blue"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <input
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className={`${inputClass} pr-16`}
            aria-invalid={Boolean(state.fieldErrors?.password?.length)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-controls="login-password"
            aria-pressed={showPassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-veltrix-blue transition hover:bg-veltrix-surface"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          New to Veltrix Bank?{" "}
          <Link
            href="/register"
            className="font-semibold text-veltrix-blue underline decoration-veltrix-blue/30 underline-offset-4 hover:decoration-veltrix-blue"
          >
            Open an account
          </Link>
        </p>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-full bg-veltrix-blue px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#10498a] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-veltrix-gold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Signing in..." : "Sign in"}
        </button>
      </div>

      <p className="text-xs leading-5 text-slate-500">
        Veltrix Bank is a demonstration platform. Do not use real banking credentials.
      </p>
    </form>
  );
}
