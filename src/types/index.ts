/** ISO 4217 codes supported by the Veltrix Bank simulation. */
export type CurrencyCode = "GBP" | "USD" | "AUD";

/** Section of the application a page belongs to. */
export type ApplicationArea = "public" | "customer" | "admin";

/** Navigation entry used by the shared header and future area layouts. */
export interface NavigationItem {
  label: string;
  href: string;
  children?: Array<{ label: string; href: string; description?: string }>;
}
