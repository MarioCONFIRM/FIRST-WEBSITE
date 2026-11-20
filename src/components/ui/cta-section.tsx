import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";

interface CTASectionProps {
  title: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}

export function CTASection({
  title,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
}: CTASectionProps) {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-veltrix-navy px-6 py-12 text-white sm:px-10 lg:px-14">
          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            aria-hidden="true"
          >
            <div className="absolute -right-20 -top-20 size-72 rounded-full bg-veltrix-blue/40 blur-3xl" />
            <div className="absolute bottom-0 left-10 size-56 rounded-full bg-veltrix-gold/15 blur-3xl" />
          </div>
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {title}
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-300 sm:text-lg">
                {description}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href={primaryHref} className="bg-veltrix-gold text-veltrix-navy hover:bg-[#d4b46b]">
                {primaryLabel}
              </ButtonLink>
              {secondaryLabel && secondaryHref ? (
                <ButtonLink href={secondaryHref} variant="light">
                  {secondaryLabel}
                </ButtonLink>
              ) : null}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}