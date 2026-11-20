"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { ButtonLink } from "@/components/ui/button-link";
import { publicNavigation } from "@/config/navigation";
import { cx } from "@/lib/utils";

export function MobileNavigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [lastPathname, setLastPathname] = useState(pathname);
  const panelId = useId();

  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    if (open) setOpen(false);
    if (openGroup !== null) setOpenGroup(null);
  }

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex size-11 items-center justify-center rounded-xl border border-veltrix-silver bg-white text-veltrix-navy transition-colors hover:border-veltrix-blue hover:text-veltrix-blue"
      >
        <span className="relative block h-4 w-5" aria-hidden="true">
          <span
            className={cx(
              "absolute left-0 top-0 h-0.5 w-5 rounded bg-current transition-transform duration-200",
              open && "translate-y-[7px] rotate-45",
            )}
          />
          <span
            className={cx(
              "absolute left-0 top-[7px] h-0.5 w-5 rounded bg-current transition-opacity duration-200",
              open && "opacity-0",
            )}
          />
          <span
            className={cx(
              "absolute left-0 top-[14px] h-0.5 w-5 rounded bg-current transition-transform duration-200",
              open && "-translate-y-[7px] -rotate-45",
            )}
          />
        </span>
      </button>

      <div
        className={cx(
          "fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[1px] transition-opacity duration-200",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden="true"
        onClick={() => setOpen(false)}
      />

      <div
        id={panelId}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        className={cx(
          "fixed inset-x-0 top-[73px] z-50 mx-4 max-h-[calc(100dvh-89px)] overflow-y-auto rounded-2xl border border-veltrix-silver bg-white p-4 shadow-xl transition-all duration-200 sm:mx-6",
          open
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-3 opacity-0",
        )}
      >
        <nav aria-label="Mobile primary">
          <ul className="space-y-1">
            {publicNavigation.map((item) => {
              const isActive =
                pathname === item.href ||
                item.children?.some((child) => pathname === child.href);
              const hasChildren = Boolean(item.children?.length);
              const expanded = openGroup === item.label;

              if (!hasChildren) {
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cx(
                        "flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-colors",
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
                <li key={item.label} className="rounded-xl">
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() =>
                      setOpenGroup(expanded ? null : item.label)
                    }
                    className={cx(
                      "flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors",
                      isActive
                        ? "bg-veltrix-surface text-veltrix-blue"
                        : "text-slate-700 hover:bg-veltrix-surface hover:text-veltrix-blue",
                    )}
                  >
                    <span>{item.label}</span>
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 20 20"
                      className={cx(
                        "size-4 transition-transform duration-200",
                        expanded && "rotate-180",
                      )}
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <div
                    className={cx(
                      "grid transition-all duration-200",
                      expanded
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0",
                    )}
                  >
                    <ul className="overflow-hidden pl-2">
                      {item.children?.map((child) => (
                        <li key={child.href} className="mt-1">
                          <Link
                            href={child.href}
                            className={cx(
                              "block rounded-lg px-4 py-2.5 text-sm transition-colors",
                              pathname === child.href
                                ? "bg-white font-medium text-veltrix-blue"
                                : "text-slate-600 hover:bg-white hover:text-veltrix-blue",
                            )}
                          >
                            {child.label}
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

        <div className="mt-4 grid gap-2 border-t border-veltrix-silver pt-4 sm:grid-cols-2">
          <ButtonLink href="/login" variant="secondary" className="w-full">
            Login
          </ButtonLink>
          <ButtonLink href="/register" className="w-full">
            Open an Account
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}