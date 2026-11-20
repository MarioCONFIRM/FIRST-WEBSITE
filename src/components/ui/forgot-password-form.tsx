"use client";

import { useActionState } from "react";

import { forgotPasswordAction, type ActionState } from "@/server/auth/actions";

const initialState: ActionState = { ok: false };
const inputClass =
  "mt-2 w-full rounded-xl border border-veltrix-silver bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-veltrix-blue focus:ring-4 focus:ring-veltrix-blue/10";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, initialState);

  return (
    <form action={formAction} noValidate className="space-y-6">
      {state.message ? (
        <div
          role="status"
          className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950"
        >
          {state.message}
        </div>
      ) : null}
      <div>
        <label htmlFor="email" className="text-sm font-medium text-veltrix-navy">
          Email address <span aria-hidden="true" className="text-red-700">*</span>
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className={inputClass} placeholder="name@example.com" />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-full bg-veltrix-blue px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#10498a] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Submitting..." : "Send reset instructions"}
      </button>
    </form>
  );
}
