"use client";

import { useActionState, useState } from "react";
import { CheckIcon } from "@/components/icons";
import { IDLE_ACTION_STATE } from "@/lib/action-state";
import { prepareShipmentAction } from "../actions";

export interface PrepareWarehouseOption {
  readonly id: string;
  readonly nombre: string;
}

export function LogisticsPrepareForm({
  orderId,
  bodegas
}: {
  orderId: string;
  bodegas: readonly PrepareWarehouseOption[];
}) {
  const [state, action, pending] = useActionState(
    prepareShipmentAction,
    IDLE_ACTION_STATE
  );
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  if (bodegas.length === 0) {
    return (
      <p className="form-hint">
        No hay reservas activas en tus bodegas asignadas para este pedido. La
        preparación requiere reservas de inventario vigentes.
      </p>
    );
  }

  return (
    <form action={action} className="seller-form">
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />

      <div className="field">
        <label htmlFor={`bodega-${orderId}`}>Bodega de origen</label>
        <select id={`bodega-${orderId}`} name="bodegaId" required>
          {bodegas.map((bodega) => (
            <option key={bodega.id} value={bodega.id}>
              {bodega.nombre}
            </option>
          ))}
        </select>
        <p className="form-hint">
          Solo se muestran bodegas de tu ámbito con reservas activas del pedido.
        </p>
      </div>

      <div className="field">
        <label htmlFor={`transportista-${orderId}`}>Transportista (opcional)</label>
        <input
          id={`transportista-${orderId}`}
          name="transportista"
          type="text"
          maxLength={120}
          placeholder="Dato operativo opcional"
        />
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
        {pending ? "Preparando…" : "Preparar envío"}
      </button>
    </form>
  );
}
