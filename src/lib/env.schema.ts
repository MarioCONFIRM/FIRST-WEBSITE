import { z } from "zod";

/**
 * Pure environment schemas. Kept separate from `env.ts` so they can be unit
 * tested without the `server-only` guard.
 */
const mysqlConnectionString = z
  .string({ error: "must be a string" })
  .trim()
  .min(1, "must not be empty")
  .refine(
    (value) => value.startsWith("mysql://") || value.startsWith("mariadb://"),
    "must be a MySQL or MariaDB connection string",
  );

const optionalTrimmedString = z
  .string()
  .transform((value) => value.trim())
  .transform((value) => (value === "" ? undefined : value))
  .optional();

const optionalPort = z
  .string()
  .optional()
  .transform((value) => {
    const trimmed = value?.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    return Number.isInteger(parsed) ? parsed : NaN;
  })
  .refine(
    (value) => value === undefined || (value >= 1 && value <= 65535),
    "must be a valid port number",
  );

export const serverEnvSchema = z.object({
  DATABASE_URL: mysqlConnectionString,
  // Required by prisma7.config.ts for Prisma Migrate shadow diffing.
  SHADOW_DATABASE_URL: mysqlConnectionString,
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  SMTP_HOST: optionalTrimmedString,
  SMTP_PORT: optionalPort,
  SMTP_SECURE: z
    .string()
    .optional()
    .transform((value) => {
      const trimmed = value?.trim().toLowerCase();
      if (!trimmed) return undefined;
      if (["1", "true", "yes", "on"].includes(trimmed)) return true;
      if (["0", "false", "no", "off"].includes(trimmed)) return false;
      return undefined;
    }),
  SMTP_USER: optionalTrimmedString,
  SMTP_PASSWORD: optionalTrimmedString,
  SMTP_FROM: optionalTrimmedString,
  // Optional base URL for verification/reset links; falls back to NEXT_PUBLIC_APP_URL.
  APP_BASE_URL: optionalTrimmedString,
  // Bootstrap-only inputs (never committed). Used by the protected CLI bootstrap script.
  ADMIN_BOOTSTRAP_EMAIL: optionalTrimmedString,
  ADMIN_BOOTSTRAP_PASSWORD: optionalTrimmedString,
  ADMIN_BOOTSTRAP_FIRST_NAME: optionalTrimmedString,
  ADMIN_BOOTSTRAP_LAST_NAME: optionalTrimmedString,
});

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().trim().min(1).default("Veltrix Bank"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type PublicEnv = z.infer<typeof publicEnvSchema>;

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
    .join("; ");
}

export function parseServerEnv(
  source: Record<string, string | undefined>,
): ServerEnv {
  const result = serverEnvSchema.safeParse(source);
  if (!result.success) {
    throw new Error(`Invalid server environment: ${formatIssues(result.error)}`);
  }
  return result.data;
}

export function parsePublicEnv(
  source: Record<string, string | undefined>,
): PublicEnv {
  const result = publicEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: source.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: source.NEXT_PUBLIC_APP_NAME,
  });
  if (!result.success) {
    throw new Error(`Invalid public environment: ${formatIssues(result.error)}`);
  }
  return result.data;
}
