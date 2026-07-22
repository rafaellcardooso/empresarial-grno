"use client";

import { useEffect } from "react";
import { ErrorPageShell } from "@/components/ui/ErrorPageShell";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/** Página de erro genérica com opção de tentar novamente. */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorPageShell
      title="Algo deu errado"
      description="Não foi possível carregar esta página. Tente novamente em instantes."
      onRetry={reset}
    />
  );
}
