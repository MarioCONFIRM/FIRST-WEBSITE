import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";

export default function NotFound() {
  return (
    <Container className="py-24 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-800">
        404
      </p>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
        Page not found
      </h1>
      <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-slate-600">
        The page you requested does not exist or has not been created yet.
      </p>
      <div className="mt-8">
        <ButtonLink href="/">Return home</ButtonLink>
      </div>
    </Container>
  );
}
