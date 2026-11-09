"use client";

import { useActionState, useState } from "react";
import { CheckIcon } from "@/components/icons";
import { IDLE_ACTION_STATE } from "@/lib/action-state";
import { deliverShipmentAction } from "../actions";

export function LogisticsDeliveryForm({ shipmentId }: { shipmentId: string }) {
  const [state, action, pending] = useActionState(
    deliverShipmentAction,
    IDLE_ACTION_STATE
  );
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  return (
    <form action={action} className="seller-form">
      <input type="hidden" name="shipmentId" value={shipmentId} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />

      <div className="field">
        <label htmlFor={`resultado-${shipmentId}`}>Resultado</label>
        <select
          id={`resultado-${shipmentId}`}
          name="resultado"
          required
          defaultValue="ENTREGADO"
        >
          <option value="ENTREGADO">Entregado</option>
          <option value="FALLIDO">Fallo de entrega</option>
        </select>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor={`tipo-${shipmentId}`}>Tipo de evidencia</label>
          <input
            id={`tipo-${shipmentId}`}
            name="tipo"
            type="text"
            maxLength={200}
            placeholder="Ej. RECIBO"
          />
        </div>
        <div className="field">
          <label htmlFor={`referencia-${shipmentId}`}>Referencia</label>
          <input
            id={`referencia-${shipmentId}`}
            name="referencia"
            type="text"
            maxLength={200}
            placeholder="Ej. REC-2026-001"
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor={`nota-${shipmentId}`}>Nota (opcional)</label>
        <input
          id={`nota-${shipmentId}`}
          name="nota"
          type="text"
          maxLength={500}
          placeholder="Observación de la entrega"
        />
      </div>

      <div className="field">
        <label htmlFor={`motivo-${shipmentId}`}>Motivo del fallo</label>
        <input
          id={`motivo-${shipmentId}`}
          name="motivo"
          type="text"
          maxLength={200}
          placeholder="Obligatorio si el resultado es FALLIDO"
        />
        <p className="form-hint">
          Para confirmar una entrega se exigen tipo y referencia de evidencia.
          Para un fallo se exige el motivo. El pedido no se cierra en esta
          operación.
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
        {pending ? "Registrando…" : "Registrar entrega"}
      </button>
    </form>
  );
}
