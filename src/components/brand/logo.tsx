import Link from "next/link";

import { cx } from "@/lib/utils";

interface LogoProps {
  variant?: "dark" | "light";
  className?: string;
}

export function Logo({ variant = "dark", className }: LogoProps) {
  const textPrimary = variant === "light" ? "text-white" : "text-veltrix-navy";
  const textSecondary =
    variant === "light" ? "text-slate-300" : "text-veltrix-blue";

  return (
    <Link
      href="/"
      className={cx("group inline-flex items-center gap-3", className)}
      aria-label="Veltrix Bank home"
    >
      <span
        aria-hidden="true"
        className="relative grid size-11 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-[#1456a0] via-[#0b3768] to-[#071b33] text-lg font-bold text-white shadow-sm ring-1 ring-white/20 transition-transform duration-200 group-hover:scale-[1.02]"
      >
        <span className="absolute inset-x-0 top-0 h-1/2 bg-white/10" />
        V
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cx(
            "text-sm font-bold tracking-[0.22em] sm:text-[0.95rem]",
            textPrimary,
          )}
        >
          VELTRIX
        </span>
        <span
          className={cx(
            "mt-1 text-[0.62rem] font-semibold tracking-[0.45em]",
            textSecondary,
          )}
        >
          BANK
        </span>
      </span>
    </Link>
  );
}
