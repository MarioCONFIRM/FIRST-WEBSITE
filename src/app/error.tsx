"use client";

import { useEffect } from "react";

import { Container } from "@/components/ui/container";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="py-24 text-center">
      <h1 className="text-3xl font-bold tracking-tight text-slate-950">
        Something went wrong
      </h1>
      <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-slate-600">
        We could not complete this request. Please try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 inline-flex items-center justify-center rounded-full bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
      >
        Try again
      </button>
    </Container>
  );
}
