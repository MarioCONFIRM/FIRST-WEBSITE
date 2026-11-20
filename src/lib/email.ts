import "server-only";

import nodemailer from "nodemailer";

import { getServerEnv } from "@/lib/env";
import { getPublicEnv } from "@/lib/env";

export type EmailDeliveryResult = {
  configured: boolean;
  sent: boolean;
  message: string;
};

function isSmtpConfigured(env: ReturnType<typeof getServerEnv>): boolean {
  return Boolean(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_FROM);
}

export function getAppBaseUrl(): string {
  const server = getServerEnv();
  const pub = getPublicEnv();
  const base = server.APP_BASE_URL || pub.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return base.replace(/\/$/, "");
}

async function sendMail(to: string, subject: string, text: string): Promise<EmailDeliveryResult> {
  const env = getServerEnv();

  if (!isSmtpConfigured(env)) {
    const dev = env.NODE_ENV !== "production";
    if (dev) {
      // Safe development aid: do not expose tokens in production responses or production logs.
      console.info("[email:dev] SMTP not configured. Email not sent.");
      console.info(`[email:dev] To: ${to}`);
      console.info(`[email:dev] Subject: ${subject}`);
      console.info(`[email:dev] Body:\n${text}`);
      return {
        configured: false,
        sent: false,
        message:
          "Email delivery is not configured. Development mode logged the message to the server console for testing.",
      };
    }
    return {
      configured: false,
      sent: false,
      message:
        "Email delivery is not configured. Please contact support or try again later.",
    };
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE ?? env.SMTP_PORT === 465,
    auth:
      env.SMTP_USER && env.SMTP_PASSWORD
        ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
        : undefined,
  });

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    text,
  });

  return { configured: true, sent: true, message: "Email sent." };
}

export async function sendVerificationEmail(params: {
  to: string;
  firstName: string;
  token: string;
}): Promise<EmailDeliveryResult> {
  const url = `${getAppBaseUrl()}/verify-email?token=${encodeURIComponent(params.token)}`;
  const subject = "Verify your Veltrix Bank email address";
  const text = [
    `Hello ${params.firstName},`,
    "",
    "Please verify your Veltrix Bank email address by opening the link below:",
    url,
    "",
    "This link expires in 24 hours and can be used once.",
    "If you did not create this account, you can ignore this message.",
    "",
    "Veltrix Bank (simulation platform)",
  ].join("\n");
  return sendMail(params.to, subject, text);
}

export async function sendPasswordResetEmail(params: {
  to: string;
  firstName: string;
  token: string;
}): Promise<EmailDeliveryResult> {
  const url = `${getAppBaseUrl()}/reset-password?token=${encodeURIComponent(params.token)}`;
  const subject = "Reset your Veltrix Bank password";
  const text = [
    `Hello ${params.firstName},`,
    "",
    "We received a request to reset your Veltrix Bank password. Use the link below:",
    url,
    "",
    "This link expires in 30 minutes and can be used once.",
    "If you did not request a password reset, you can ignore this message.",
    "",
    "Veltrix Bank (simulation platform)",
  ].join("\n");
  return sendMail(params.to, subject, text);
}
