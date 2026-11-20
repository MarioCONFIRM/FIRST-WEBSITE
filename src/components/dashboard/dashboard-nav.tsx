"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { LogoutButton } from "@/components/auth/logout-button";
import { customerDashboardNavigation } from "@/config/navigation";
import { cx } from "@/lib/utils";

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardNav({ customerName }: { customerName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);
  const panelId = useId();

  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header className="border-b border-veltrix-silver/70 bg-white">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 lg:gap-6">
          <Link href="/dashboard" className="group inline-flex items-center gap-2" aria-label="Veltrix Bank dashboard">
            <span aria-hidden="true" className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-[#1456a0] via-[#0b3768] to-[#071b33] text-sm font-bold text-white">V</span>
            <span className="hidden flex-col leading-none sm:flex">
              <span className="text-xs font-bold tracking-[0.22em] text-veltrix-navy">VELTRIX</span>
              <span className="mt-0.5 text-[0.55rem] font-semibold tracking-[0.4em] text-veltrix-blue">BANK</span>
            </span>
          </Link>

          <nav aria-label="Dashboard navigation" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {customerDashboardNavigation.map((item) => {
                const active = isActivePath(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cx(
                        "rounded-full px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-veltrix-blue",
                        active
                          ? "bg-veltrix-surface text-veltrix-blue"
                          : "text-slate-700 hover:bg-veltrix-surface hover:text-veltrix-blue",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <div className="text-right">
            <p className="text-xs text-slate-500">Signed in as</p>
            <p className="text-sm font-semibold text-veltrix-navy">{customerName}</p>
          </div>
          <LogoutButton />
        </div>

        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-xl border border-veltrix-silver bg-white text-veltrix-navy lg:hidden"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={open ? "Close dashboard menu" : "Open dashboard menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="relative block h-4 w-5" aria-hidden="true">
            <span className={cx("absolute left-0 top-0 h-0.5 w-5 rounded bg-current transition-transform", open && "translate-y-[7px] rotate-45")} />
            <span className={cx("absolute left-0 top-[7px] h-0.5 w-5 rounded bg-current transition-opacity", open && "opacity-0")} />
            <span className={cx("absolute left-0 top-[14px] h-0.5 w-5 rounded bg-current transition-transform", open && "-translate-y-[7px] -rotate-45")} />
          </span>
        </button>
      </div>

      <div
        id={panelId}
        className={cx(
          "border-t border-veltrix-silver bg-white px-4 py-4 sm:px-6 lg:hidden",
          open ? "block" : "hidden",
        )}
      >
        <div className="mb-4 rounded-xl bg-veltrix-surface p-3">
          <p className="text-xs text-slate-500">Signed in as</p>
          <p className="text-sm font-semibold text-veltrix-navy">{customerName}</p>
        </div>
        <nav aria-label="Mobile dashboard navigation">
          <ul className="space-y-1">
            {customerDashboardNavigation.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cx(
                      "block rounded-xl px-4 py-3 text-sm font-medium",
                      active ? "bg-veltrix-surface text-veltrix-blue" : "text-slate-700 hover:bg-veltrix-surface",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="mt-4 border-t border-veltrix-silver pt-4">
          <LogoutButton className="inline-flex w-full items-center justify-center rounded-full border border-veltrix-silver bg-white px-4 py-2.5 text-sm font-semibold text-veltrix-navy transition hover:border-veltrix-blue hover:text-veltrix-blue" />
        </div>
      </div>
    </header>
  );
}
