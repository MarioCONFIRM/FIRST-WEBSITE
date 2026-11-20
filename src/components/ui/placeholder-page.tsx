import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { PlaceholderPanel } from "@/components/ui/placeholder-panel";
import type { ApplicationArea } from "@/types";

interface PlaceholderPageProps {
  area: ApplicationArea;
  eyebrow?: string;
  title: string;
  description: string;
  detail: string;
}

/** Shared shell for routes whose features are scheduled for later phases. */
export function PlaceholderPage({
  area,
  eyebrow,
  title,
  description,
  detail,
}: PlaceholderPageProps) {
  return (
    <>
      <PageHeader eyebrow={eyebrow ?? area} title={title} description={description} />
      <Container className="py-12 sm:py-16">
        <PlaceholderPanel area={area} title={title} description={detail} />
      </Container>
    </>
  );
}
