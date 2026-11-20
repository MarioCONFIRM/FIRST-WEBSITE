"use client";

import { useActionState } from "react";

import { resendVerificationAction, verifyEmailAction, type ActionState } from "@/server/auth/actions";

const initialVerifyState: ActionState = { ok: false };
const initialResendState: ActionState = { ok: false };
const inputClass =
  "mt-2 w-full rounded-xl border border-veltrix-silver bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-veltrix-blue focus:ring-4 focus:ring-veltrix-blue/10";

export function VerifyEmailForm({ token }: { token: string }) {
  const [verifyState, verifyFormAction, verifyPending] = useActionState(verifyEmailAction, initialVerifyState);
  const [resendState, resendFormAction, resendPending] = useActionState(resendVerificationAction, initialResendState);

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-veltrix-silver bg-veltrix-surface p-5">
        <h2 className="text-lg font-semibold text-veltrix-navy">Confirm verification</h2>
        {token ? (
          <>
            <p className="mt-2 text-sm leading-7 text-slate-700">
              Click the button below to verify your email address. This uses a secure server-side check and consumes the link once.
            </p>
            <form action={verifyFormAction} className="mt-4 space-y-4">
              <input type="hidden" name="token" value={token} />
              {verifyState.message && !verifyState.ok ? (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900">
                  {verifyState.message}
                </div>
              ) : null}
              <button
                type="submit"
                disabled={verifyPending}
                className="inline-flex items-center justify-center rounded-full bg-veltrix-blue px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#10498a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {verifyPending ? "Verifying..." : "Verify email address"}
              </button>
            </form>
          </>
        ) : (
          <p className="mt-2 text-sm leading-7 text-slate-700">
            No verification token was provided. If you received a verification email, open the full link from that message. You can also request a new verification email below.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-veltrix-silver p-5">
        <h2 className="text-lg font-semibold text-veltrix-navy">Resend verification email</h2>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          Enter your account email address to request another verification message. For security, the response does not confirm whether an account exists or its verification status.
        </p>
        <form action={resendFormAction} noValidate className="mt-4 space-y-4">
          {resendState.message ? (
            <div role="status" className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
              {resendState.message}
            </div>
          ) : null}
          <div>
            <label htmlFor="resend-email" className="text-sm font-medium text-veltrix-navy">Email address <span aria-hidden="true" className="text-red-700">*</span></label>
            <input id="resend-email" name="email" type="email" autoComplete="email" required className={inputClass} placeholder="name@example.com" />
          </div>
          <button
            type="submit"
            disabled={resendPending}
            className="inline-flex items-center justify-center rounded-full border border-veltrix-blue bg-white px-6 py-3 text-sm font-semibold text-veltrix-blue transition-all hover:bg-veltrix-surface disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resendPending ? "Submitting..." : "Resend verification"}
          </button>
        </form>
      </section>
    </div>
  );
}
