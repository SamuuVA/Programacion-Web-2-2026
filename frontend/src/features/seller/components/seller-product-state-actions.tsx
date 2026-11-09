"use client";

import { useActionState } from "react";
import { CheckIcon } from "@/components/icons";
import { IDLE_ACTION_STATE } from "@/lib/action-state";
import { changeSellerProductStateAction } from "../actions";
import type { EstadoProductoVendedor } from "../types";

const CONFIRMATION: Readonly<Record<"publish" | "suspend" | "discontinue", string>> =
  {
    publish: "¿Publicar este producto en el catálogo?",
    suspend: "¿Suspender este producto? Dejará de mostrarse en el catálogo.",
    discontinue:
      "¿Descontinuar este producto? Es una acción terminal: no podrá volver a publicarse ni editarse."
  };

export function SellerProductStateActions({
  productId,
  estado
}: {
  productId: string;
  estado: EstadoProductoVendedor;
}) {
  if (estado === "DESCONTINUADO") {
    return (
      <p className="form-hint">
        El producto está descontinuado. No admite nuevas ediciones ni
        publicaciones; crea una oferta nueva si necesitas venderlo otra vez.
      </p>
    );
  }

  return (
    <div className="seller-state-actions">
      {(estado === "BORRADOR" || estado === "SUSPENDIDO") ? (
        <StateActionForm
          productId={productId}
          accion="publish"
          label={estado === "SUSPENDIDO" ? "Reanudar publicación" : "Publicar"}
          className="btn btn-primary"
        />
      ) : null}
      {estado === "PUBLICADO" ? (
        <StateActionForm
          productId={productId}
          accion="suspend"
          label="Suspender"
          className="btn btn-secondary"
        />
      ) : null}
      <StateActionForm
        productId={productId}
        accion="discontinue"
        label="Descontinuar"
        className="btn btn-ghost"
      />
    </div>
  );
}

function StateActionForm({
  productId,
  accion,
  label,
  className
}: {
  productId: string;
  accion: "publish" | "suspend" | "discontinue";
  label: string;
  className: string;
}) {
  const [state, action, pending] = useActionState(
    changeSellerProductStateAction,
    IDLE_ACTION_STATE
  );

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(CONFIRMATION[accion])) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="accion" value={accion} />
      <button className={className} type="submit" disabled={pending}>
        {pending ? "Procesando…" : label}
      </button>
      {state.status === "error" ? (
        <span className="form-error" role="alert">
          {state.message}
        </span>
      ) : null}
      {state.status === "success" ? (
        <span className="form-success" role="status">
          <CheckIcon width={16} height={16} /> {state.message}
        </span>
      ) : null}
    </form>
  );
}
