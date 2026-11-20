import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-veltrix-navy text-white">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-veltrix-blue/35 blur-3xl" />
        <div className="absolute right-0 top-0 h-[28rem] w-[28rem] rounded-full bg-[#0f3e73]/60 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-veltrix-gold/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:72px_72px] opacity-20" />
      </div>

      <Container className="relative grid gap-12 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-28">
        <div className="animate-[fade-up_0.6s_ease-out]">
          <p className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-veltrix-gold">
            Premium digital banking experience
          </p>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Banking Designed Around Your Future.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
            Experience a smarter way to manage your money. Enjoy convenient
            digital banking, transparent account management and a banking
            experience designed around your needs.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <ButtonLink
              href="/register"
              className="bg-veltrix-gold text-veltrix-navy hover:bg-[#d4b46b]"
            >
              Open an Account
            </ButtonLink>
            <ButtonLink href="/services" variant="light">
              Explore Our Services
            </ButtonLink>
          </div>

          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-white/10 pt-8">
            {[
              { label: "Supported currencies", value: "GBP · USD · AUD" },
              { label: "Account focus", value: "Personal & Business" },
              { label: "Platform status", value: "Simulation" },
            ].map((item) => (
              <div key={item.label}>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  {item.label}
                </dt>
                <dd className="mt-2 text-sm font-semibold leading-6 text-white">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative animate-[fade-up_0.75s_ease-out]">
          <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-white/10 to-transparent blur-2xl" aria-hidden="true" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                  Digital overview
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  Transparent, multi-currency by design
                </p>
              </div>
              <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-300/30">
                Demo interface
              </span>
            </div>

            <div className="mt-6 space-y-4">
              {[
                {
                  title: "Personal & Business Banking",
                  text: "Clear pathways for individual and business account information.",
                },
                {
                  title: "GBP, USD and AUD",
                  text: "Independent currency support with no invented exchange rates.",
                },
                {
                  title: "Security-conscious architecture",
                  text: "Prepared for secure authentication and protected account areas in future phases.",
                },
              ].map((item, index) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-[#0b2543]/70 p-4"
                >
                  <div className="flex items-start gap-4">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-veltrix-gold/15 text-sm font-bold text-veltrix-gold">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-white">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-300">
                        {item.text}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-veltrix-gold/25 bg-veltrix-gold/10 p-4 text-sm leading-6 text-slate-200">
              This is a visual demonstration. Actual account access, balances,
              transfers and payments are planned for later phases.
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}