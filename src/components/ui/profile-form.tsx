"use client";

import { useActionState } from "react";

import { updateProfileAction, type ActionState } from "@/server/auth/actions";

const initialState: ActionState = { ok: false };
const inputClass =
  "mt-2 w-full rounded-xl border border-veltrix-silver bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-veltrix-blue focus:ring-4 focus:ring-veltrix-blue/10";
const labelClass = "text-sm font-medium text-veltrix-navy";

const countryOptions = [
  ["GB", "United Kingdom"], ["US", "United States"], ["AU", "Australia"], ["CA", "Canada"], ["IE", "Ireland"],
  ["NG", "Nigeria"], ["GH", "Ghana"], ["KE", "Kenya"], ["ZA", "South Africa"], ["IN", "India"],
  ["DE", "Germany"], ["FR", "France"], ["ES", "Spain"], ["IT", "Italy"], ["NL", "Netherlands"], ["AE", "United Arab Emirates"],
] as const;

function FieldError({ id, errors }: { id: string; errors?: string[] }) {
  if (!errors?.length) return null;
  return <p id={id} role="alert" className="mt-2 text-sm text-red-700">{errors[0]}</p>;
}

export function ProfileForm({
  defaults,
}: {
  defaults: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    country: string;
    residentialAddress: string;
  };
}) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);

  return (
    <form action={formAction} noValidate className="space-y-6">
      {state.message ? (
        <div
          role={state.ok ? "status" : "alert"}
          className={`rounded-xl border p-4 text-sm leading-6 ${state.ok ? "border-green-200 bg-green-50 text-green-900" : "border-red-200 bg-red-50 text-red-900"}`}
        >
          {state.message}
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className={labelClass}>First name <span aria-hidden="true" className="text-red-700">*</span></label>
          <input id="firstName" name="firstName" type="text" required defaultValue={defaults.firstName} className={inputClass} aria-invalid={Boolean(state.fieldErrors?.firstName)} aria-describedby={state.fieldErrors?.firstName ? "firstName-error" : undefined} />
          <FieldError id="firstName-error" errors={state.fieldErrors?.firstName} />
        </div>
        <div>
          <label htmlFor="lastName" className={labelClass}>Last name <span aria-hidden="true" className="text-red-700">*</span></label>
          <input id="lastName" name="lastName" type="text" required defaultValue={defaults.lastName} className={inputClass} aria-invalid={Boolean(state.fieldErrors?.lastName)} aria-describedby={state.fieldErrors?.lastName ? "lastName-error" : undefined} />
          <FieldError id="lastName-error" errors={state.fieldErrors?.lastName} />
        </div>
        <div>
          <label htmlFor="phoneNumber" className={labelClass}>Phone number</label>
          <input id="phoneNumber" name="phoneNumber" type="tel" defaultValue={defaults.phoneNumber} className={inputClass} aria-invalid={Boolean(state.fieldErrors?.phoneNumber)} aria-describedby={state.fieldErrors?.phoneNumber ? "phone-error" : undefined} />
          <FieldError id="phone-error" errors={state.fieldErrors?.phoneNumber} />
        </div>
        <div>
          <label htmlFor="country" className={labelClass}>Country <span aria-hidden="true" className="text-red-700">*</span></label>
          <select id="country" name="country" required defaultValue={defaults.country || ""} className={inputClass} aria-invalid={Boolean(state.fieldErrors?.country)}>
            <option value="" disabled>Select country</option>
            {countryOptions.map(([code, name]) => <option key={code} value={code}>{name} ({code})</option>)}
          </select>
          <FieldError id="country-error" errors={state.fieldErrors?.country} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="residentialAddress" className={labelClass}>Residential address <span aria-hidden="true" className="text-red-700">*</span></label>
          <textarea id="residentialAddress" name="residentialAddress" rows={3} required defaultValue={defaults.residentialAddress} className={inputClass} aria-invalid={Boolean(state.fieldErrors?.residentialAddress)} aria-describedby={state.fieldErrors?.residentialAddress ? "address-error" : undefined} />
          <FieldError id="address-error" errors={state.fieldErrors?.residentialAddress} />
        </div>
      </div>

      <p className="text-sm text-slate-600">You can update your personal contact details here. Role, account number, account status, balances, and verification status cannot be changed from this page.</p>

      <button type="submit" disabled={pending} className="inline-flex items-center justify-center rounded-full bg-veltrix-blue px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#10498a] disabled:cursor-not-allowed disabled:opacity-60">
        {pending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
