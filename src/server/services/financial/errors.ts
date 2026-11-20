import "server-only";

export type FinancialErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "IMMUTABLE_RECORD"
  | "UNBALANCED_JOURNAL"
  | "INVALID_AMOUNT"
  | "CURRENCY_MISMATCH"
  | "CROSS_CURRENCY_JOURNAL"
  | "INVALID_STATE"
  | "ACCOUNT_OWNERSHIP"
  | "DUPLICATE_REFERENCE"
  | "DUPLICATE_IDEMPOTENCY_KEY";

export class FinancialServiceError extends Error {
  readonly code: FinancialErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(
    code: FinancialErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "FinancialServiceError";
    this.code = code;
    this.details = details;
  }
}

export function isPrismaUniqueConstraintError(err: unknown): boolean {
  return Boolean(
    err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: unknown }).code === "P2002",
  );
}

export function isPrismaNotFoundError(err: unknown): boolean {
  return Boolean(
    err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: unknown }).code === "P2025",
  );
}