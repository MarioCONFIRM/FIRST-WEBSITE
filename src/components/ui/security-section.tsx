import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { FeatureCard } from "@/components/ui/feature-card";
import { SectionHeading } from "@/components/ui/section-heading";

const items = [
  {
    title: "Account protection",
    description:
      "Clear account structures and status controls are designed to support responsible account management in later phases.",
  },
  {
    title: "Secure authentication architecture",
    description:
      "The platform architecture is prepared for secure sign-in and role-based access. Authentication is planned for a later phase.",
  },
  {
    title: "Privacy-conscious account management",
    description:
      "Information is handled with a privacy-aware approach, separating public pages from future protected account areas.",
  },
  {
    title: "Transaction monitoring architecture",
    description:
      "Audit and transaction records are part of the database foundation to support traceable activity in future phases.",
  },
  {
    title: "Security awareness",
    description:
      "Practical guidance helps customers recognise suspicious activity and understand safe banking practices.",
  },
];

export function SecuritySection() {
  return (
    <section className="bg-veltrix-surface py-16 sm:py-20">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-start">
          <div>
            <SectionHeading
              eyebrow="Security"
              title="A security-conscious digital banking experience"
              description="Veltrix Bank is being designed with protection, privacy and clear information at its core. This section describes the security approach and architecture being prepared."
            />
            <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-950">
              <strong className="font-semibold">Important:</strong> Features such
              as two-factor authentication, fraud monitoring and regulatory
              certifications are not claimed as active unless they are
              implemented and verified in a future phase.
            </div>
            <div className="mt-8">
              <ButtonLink href="/security">Visit the Security page</ButtonLink>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((item) => (
              <FeatureCard
                key={item.title}
                title={item.title}
                description={item.description}
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}