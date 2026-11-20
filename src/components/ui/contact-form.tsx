"use client";

import { useState, type FormEvent } from "react";

type FormValues = {
  fullName: string;
  email: string;
  subject: string;
  message: string;
};

type Errors = Partial<Record<keyof FormValues, string>>;

const initialValues: FormValues = {
  fullName: "",
  email: "",
  subject: "",
  message: "",
};

function validate(values: FormValues): Errors {
  const errors: Errors = {};
  if (!values.fullName.trim()) errors.fullName = "Full name is required.";
  else if (values.fullName.trim().length < 2)
    errors.fullName = "Please enter your full name.";

  if (!values.email.trim()) errors.email = "Email address is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
    errors.email = "Please enter a valid email address.";

  if (!values.subject.trim()) errors.subject = "Subject is required.";
  else if (values.subject.trim().length < 3)
    errors.subject = "Subject must be at least 3 characters.";

  if (!values.message.trim()) errors.message = "Message is required.";
  else if (values.message.trim().length < 10)
    errors.message = "Message must be at least 10 characters.";

  return errors;
}

const inputClass =
  "mt-2 w-full rounded-xl border border-veltrix-silver bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-veltrix-blue focus:ring-4 focus:ring-veltrix-blue/10";

export function ContactForm() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "error">("idle");

  function onChange(
    field: keyof FormValues,
    value: string,
  ) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setStatus("error");
      return;
    }
    // No backend/email service is configured in this phase.
    setStatus("error");
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="fullName" className="text-sm font-medium text-veltrix-navy">
            Full name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            value={values.fullName}
            onChange={(e) => onChange("fullName", e.target.value)}
            className={inputClass}
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? "fullName-error" : undefined}
          />
          {errors.fullName ? (
            <p id="fullName-error" className="mt-2 text-sm text-red-700">{errors.fullName}</p>
          ) : null}
        </div>
        <div>
          <label htmlFor="email" className="text-sm font-medium text-veltrix-navy">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(e) => onChange("email", e.target.value)}
            className={inputClass}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email ? (
            <p id="email-error" className="mt-2 text-sm text-red-700">{errors.email}</p>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="text-sm font-medium text-veltrix-navy">
          Subject
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          value={values.subject}
          onChange={(e) => onChange("subject", e.target.value)}
          className={inputClass}
          aria-invalid={Boolean(errors.subject)}
          aria-describedby={errors.subject ? "subject-error" : undefined}
        />
        {errors.subject ? (
          <p id="subject-error" className="mt-2 text-sm text-red-700">{errors.subject}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="message" className="text-sm font-medium text-veltrix-navy">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          value={values.message}
          onChange={(e) => onChange("message", e.target.value)}
          className={inputClass}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "message-error" : undefined}
        />
        {errors.message ? (
          <p id="message-error" className="mt-2 text-sm text-red-700">{errors.message}</p>
        ) : null}
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        <strong className="font-semibold">Form status:</strong> No email or
        support service is configured yet, so this form cannot send messages in
        this phase. Client-side validation is active, and the form is prepared
        for future backend integration.
      </div>

      {status === "error" && Object.keys(errors).length === 0 ? (
        <div role="status" className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
          Your message was not sent because message delivery is not configured.
          Please use the configured support contact details when they become
          available.
        </div>
      ) : null}

      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-full bg-veltrix-blue px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#10498a] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-veltrix-gold"
      >
        Submit message
      </button>
    </form>
  );
}