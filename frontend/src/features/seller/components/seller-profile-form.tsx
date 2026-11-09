"use client";

import { useActionState } from "react";
import { CheckIcon } from "@/components/icons";
import { IDLE_ACTION_STATE } from "@/lib/action-state";
import { updateSellerProfileAction } from "../actions";

export function SellerProfileForm({
  nombreComercial
}: {
  nombreComercial: string;
}) {
  const [state, action, pending] = useActionState(
    updateSellerProfileAction,
    IDLE_ACTION_STATE
  );

  return (
    <form action={action} className="seller-form">
      <div className="field">
        <label htmlFor="nombreComercial">Nombre comercial</label>
        <input
          id="nombreComercial"
          name="nombreComercial"
          type="text"
          defaultValue={nombreComercial}
          maxLength={120}
          required
        />
        <p className="form-hint">
          Es el único atributo comercial que el vendedor puede editar en este
          alcance. La razón social y otros datos no están aprobados para edición.
        </p>
      </div>

      {state.status === "error" ? (
        <p className="form-error" role="alert">
          {state.message}
          {state.correlationId ? (
            <span className="state-correlation">
              Código de seguimiento: {state.correlationId}
            </span>
          ) : null}
        </p>
      ) : null}

      {state.status === "success" ? (
        <p className="form-success" role="status">
          <CheckIcon width={18} height={18} /> {state.message}
        </p>
      ) : null}

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
