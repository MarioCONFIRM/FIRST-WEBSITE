"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/brand/logo";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { publicNavigation } from "@/config/navigation";
import { cx } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-veltrix-silver/70 bg-white/90 backdrop-blur-md">
      <Container className="flex min-h-[73px] items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Logo />

          <nav aria-label="Primary navigation" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {publicNavigation.map((item) => {
                const hasChildren = Boolean(item.children?.length);
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`) ||
                  item.children?.some((child) => pathname === child.href);

                if (!hasChildren) {
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        className={cx(
                          "rounded-full px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-veltrix-blue",
                          isActive
                            ? "bg-veltrix-surface text-veltrix-blue"
                            : "text-slate-700 hover:bg-veltrix-surface hover:text-veltrix-blue",
                        )}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                }

                return (
                  <li key={item.label} className="group relative">
                    <Link
                      href={item.href}
                      aria-haspopup="menu"
                      className={cx(
                        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-veltrix-blue",
                        isActive
                          ? "bg-veltrix-surface text-veltrix-blue"
                          : "text-slate-700 hover:bg-veltrix-surface hover:text-veltrix-blue",
                      )}
                    >
                      {item.label}
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 20 20"
                        className="size-4 transition-transform duration-200 group-hover:rotate-180 group-focus-within:rotate-180"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </Link>
                    <div className="invisible absolute left-0 top-full z-50 pt-3 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                      <ul
                        role="menu"
                        className="w-72 rounded-2xl border border-veltrix-silver bg-white p-2 shadow-xl"
                      >
                        {item.children?.map((child) => (
                          <li key={child.href} role="none">
                            <Link
                              href={child.href}
                              role="menuitem"
                              className={cx(
                                "block rounded-xl px-4 py-3 transition-colors hover:bg-veltrix-surface focus-visible:bg-veltrix-surface focus-visible:outline-none",
                                pathname === child.href
                                  ? "bg-veltrix-surface"
                                  : "",
                              )}
                            >
                              <span className="block text-sm font-semibold text-veltrix-navy">
                                {child.label}
                              </span>
                              {child.description ? (
                                <span className="mt-1 block text-xs leading-5 text-slate-600">
                                  {child.description}
                                </span>
                              ) : null}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <ButtonLink href="/login" variant="ghost" className="px-4 py-2">
            Login
          </ButtonLink>
          <ButtonLink href="/register" className="px-5 py-2.5">
            Open an Account
          </ButtonLink>
        </div>

        <MobileNavigation />
      </Container>
    </header>
  );
}
