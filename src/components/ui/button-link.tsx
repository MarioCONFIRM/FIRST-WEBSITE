import Link from "next/link";
import type { ReactNode } from "react";

import { cx } from "@/lib/utils";

interface ButtonLinkProps {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "light";
  className?: string;
}

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-veltrix-gold";

const variantClasses = {
  primary:
    "bg-veltrix-blue text-white shadow-sm hover:-translate-y-0.5 hover:bg-[#10498a] hover:shadow-md",
  secondary:
    "border border-veltrix-silver bg-white text-veltrix-navy hover:-translate-y-0.5 hover:border-veltrix-blue hover:text-veltrix-blue hover:shadow-sm",
  ghost:
    "text-veltrix-navy hover:bg-veltrix-surface hover:text-veltrix-blue",
  light:
    "border border-white/30 bg-white/10 text-white backdrop-blur-sm hover:-translate-y-0.5 hover:bg-white hover:text-veltrix-navy",
} as const;

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className,
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cx(baseClasses, variantClasses[variant], className)}
    >
      {children}
    </Link>
  );
}
