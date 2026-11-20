import { cx } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  dark?: boolean;
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  dark = false,
  className,
}: SectionHeadingProps) {
  const centered = align === "center";

  return (
    <div className={cx(centered && "mx-auto max-w-3xl text-center", className)}>
      {eyebrow ? (
        <p
          className={cx(
            "text-xs font-semibold uppercase tracking-[0.22em]",
            dark ? "text-veltrix-gold" : "text-veltrix-blue",
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cx(
          "mt-3 text-3xl font-bold tracking-tight sm:text-4xl",
          dark ? "text-white" : "text-veltrix-navy",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cx(
            "mt-4 text-base leading-7 sm:text-lg",
            centered && "mx-auto max-w-2xl",
            dark ? "text-slate-300" : "text-slate-600",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}