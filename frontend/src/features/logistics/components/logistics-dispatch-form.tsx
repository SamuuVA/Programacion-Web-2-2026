"use client";

import { useActionState, useState } from "react";
import { CheckIcon } from "@/components/icons";
import { IDLE_ACTION_STATE } from "@/lib/action-state";
import { dispatchShipmentAction } from "../actions";

export function LogisticsDispatchForm({ shipmentId }: { shipmentId: string }) {
  const [state, action, pending] = useActionState(
    dispatchShipmentAction,
    IDLE_ACTION_STATE
  );
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  return (
    <form action={action} className="seller-form">
      <input type="hidden" name="shipmentId" value={shipmentId} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />

      <div className="field">
        <label htmlFor={`transportista-${shipmentId}`}>
          Transportista (opcional)
        </label>
        <input
          id={`transportista-${shipmentId}`}
          name="transportista"
          type="text"
          maxLength={120}
          placeholder="Dato operativo opcional"
        />
      </div>

      <div className="field">
        <label htmlFor={`tracking-${shipmentId}`}>
          Número de seguimiento (opcional)
        </label>
        <input
          id={`tracking-${shipmentId}`}
          name="trackingNumber"
          type="text"
          maxLength={200}
          placeholder="Sin integración externa"
        />
        <p className="form-hint">
          El despacho consume las reservas activas, descuenta el inventario y
          registra una salida. No se inventan transportistas ni seguimiento.
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
        {pending ? "Despachando…" : "Despachar envío"}
      </button>
    </form>
  );
}
