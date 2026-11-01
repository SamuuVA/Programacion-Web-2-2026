"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/error-state";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="section">
      <div className="container">
        <ErrorState
          title="Algo salió mal"
          description="No pudimos completar esta página. Revisa que la API de NexusMarket esté disponible e inténtalo de nuevo."
          correlationId={error.digest}
        >
          <button className="btn btn-primary" type="button" onClick={reset}>
            Reintentar
          </button>
        </ErrorState>
      </div>
    </section>
  );
}
