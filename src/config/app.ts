const publicAppName =
  process.env.NEXT_PUBLIC_APP_NAME?.trim() || "Veltrix Bank";
const publicAppUrl =
  process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";

export const appConfig = {
  name: publicAppName,
  shortName: "Veltrix",
  tagline: "Banking designed around your future.",
  description:
    "Veltrix Bank is a simulated premium digital banking platform for transparent, convenient multi-currency account experiences in GBP, USD and AUD.",
  baseUrl: publicAppUrl,
  locale: "en-GB",
  // Public website frontend phase; Phase 001/002 foundation and database remain intact.
  phase: "003",
  copyrightYear: 2026,
  support: {
    email: "To be configured",
    phone: "To be configured",
    address: "To be configured",
  },
  socialLinks: [
    { label: "LinkedIn", href: "" },
    { label: "X", href: "" },
    { label: "Facebook", href: "" },
  ],
} as const;

export type AppConfig = typeof appConfig;
