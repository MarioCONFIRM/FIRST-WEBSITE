/** Currency symbol requirements for Veltrix Bank display. */
export const CURRENCY_SYMBOL: Record<string, string> = {
  GBP: "£",
  USD: "$",
  AUD: "A$",
};

export const CURRENCY_LOCALE: Record<string, string> = {
  GBP: "en-GB",
  USD: "en-US",
  AUD: "en-AU",
};

type DecimalLike = { toFixed: (digits: number) => string };

/**
 * Format a monetary value for display without performing floating-point
 * arithmetic in application logic. Uses fixed decimal string representation.
 */
export function formatMoney(
  value: DecimalLike | string,
  currencyCode: string,
  options?: { minimumFractionDigits?: number; maximumFractionDigits?: number },
): string {
  const min = options?.minimumFractionDigits ?? 2;
  const max = options?.maximumFractionDigits ?? 2;
  const str = typeof value === "string" ? value : value.toFixed(4);
  const negative = str.startsWith("-");
  const abs = negative ? str.slice(1) : str;
  const [intPartRaw, fracRaw = ""] = abs.split(".");
  const intPart = intPartRaw.replace(/^0+(?=\d)/, "") || "0";
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  let frac = fracRaw.padEnd(max, "0").slice(0, max);
  if (max > min) {
    while (frac.length > min && frac.endsWith("0")) frac = frac.slice(0, -1);
  }
  if (min > frac.length) frac = frac.padEnd(min, "0");

  const symbol = CURRENCY_SYMBOL[currencyCode] ?? currencyCode;
  const numberText = frac.length > 0 ? `${grouped}.${frac}` : grouped;
  return `${negative ? "-" : ""}${symbol}${numberText}`;
}

/** Mask a formatted balance for privacy display. */
export function maskMoney(currencyCode: string): string {
  const symbol = CURRENCY_SYMBOL[currencyCode] ?? currencyCode;
  return `${symbol}••••••`;
}
