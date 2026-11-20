import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/ui/container";
import { appConfig } from "@/config/app";
import { footerQuickLinks } from "@/config/navigation";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-slate-800 bg-veltrix-navy text-slate-300">
      <Container className="grid gap-12 py-14 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <Logo variant="light" />
          <p className="mt-5 max-w-md text-sm leading-7 text-slate-300">
            {appConfig.tagline} Veltrix Bank is a simulated premium digital
            banking experience focused on clarity, convenience and a
            security-conscious design.
          </p>
          <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-xs leading-6 text-slate-300">
            <strong className="font-semibold text-white">Simulation notice:</strong>{" "}
            No real money, accounts, transfers or payments are processed.
          </div>
        </div>

        <nav aria-label="Footer quick navigation">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-white">
            Quick navigation
          </h2>
          <ul className="mt-5 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-1">
            {footerQuickLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-slate-300 transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-white">
            Connect
          </h2>
          <ul className="mt-5 space-y-3">
            {appConfig.socialLinks.map((link) => (
              <li key={link.label}>
                {link.href ? (
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-slate-300 transition-colors hover:text-white"
                  >
                    {link.label}
                  </a>
                ) : (
                  <span className="text-sm text-slate-400">
                    {link.label}: To be configured
                  </span>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm leading-6 text-slate-400">
            Support contact details: {appConfig.support.email}
          </p>
        </div>
      </Container>
      <Container className="border-t border-white/10 py-6">
        <p className="text-xs leading-6 text-slate-400">
          © {appConfig.copyrightYear} {appConfig.name}. All rights reserved.
          Simulation only — not a licensed financial institution and no
          regulatory approval is claimed.
        </p>
      </Container>
    </footer>
  );
}
