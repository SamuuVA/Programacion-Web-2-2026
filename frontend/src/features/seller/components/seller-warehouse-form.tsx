"use client";

import { useActionState } from "react";
import { CheckIcon } from "@/components/icons";
import { IDLE_ACTION_STATE } from "@/lib/action-state";
import {
  createSellerWarehouseAction,
  updateSellerWarehouseAction
} from "../actions";
import type { SellerWarehouse } from "../types";

export function SellerWarehouseForm({
  mode,
  warehouse
}: {
  mode: "create" | "edit";
  warehouse?: SellerWarehouse;
}) {
  const [state, action, pending] = useActionState(
    mode === "create" ? createSellerWarehouseAction : updateSellerWarehouseAction,
    IDLE_ACTION_STATE
  );

  return (
    <form action={action} className="seller-form">
      {mode === "edit" && warehouse ? (
        <input type="hidden" name="warehouseId" value={warehouse.id} />
      ) : null}

      <div className="field">
        <label htmlFor={`warehouse-nombre-${warehouse?.id ?? "new"}`}>
          Nombre de la bodega
        </label>
        <input
          id={`warehouse-nombre-${warehouse?.id ?? "new"}`}
          name="nombre"
          type="text"
          defaultValue={warehouse?.nombre ?? ""}
          maxLength={120}
          required
        />
      </div>

      <div className="field">
        <label htmlFor={`warehouse-ubicacion-${warehouse?.id ?? "new"}`}>
          Ubicación
        </label>
        <input
          id={`warehouse-ubicacion-${warehouse?.id ?? "new"}`}
          name="ubicacion"
          type="text"
          defaultValue={warehouse?.ubicacion ?? ""}
          maxLength={200}
          required
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
        {pending
          ? "Guardando…"
          : mode === "create"
            ? "Crear bodega"
            : "Guardar cambios"}
      </button>
    </form>
  );
}
