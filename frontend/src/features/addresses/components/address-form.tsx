"use client";

import { useActionState } from "react";
import { IDLE_ACTION_STATE } from "@/lib/action-state";
import {
  createAddressAction,
  updateAddressAction
} from "../actions";
import type { Address } from "../types";

export function AddressForm({ address }: { address?: Address }) {
  const action = address ? updateAddressAction : createAddressAction;
  const [state, formAction, pending] = useActionState(action, IDLE_ACTION_STATE);
  const prefix = address ? `edit-${address.id}` : "new";

  return (
    <form action={formAction} className="address-form">
      {address ? (
        <input type="hidden" name="direccionId" value={address.id} />
      ) : null}

      <div className="field">
        <label htmlFor={`${prefix}-destinatario`}>Destinatario</label>
        <input
          id={`${prefix}-destinatario`}
          name="destinatario"
          type="text"
          defaultValue={address?.destinatario ?? ""}
          maxLength={120}
          required
        />
      </div>

      <div className="field">
        <label htmlFor={`${prefix}-telefono`}>Teléfono</label>
        <input
          id={`${prefix}-telefono`}
          name="telefono"
          type="tel"
          defaultValue={address?.telefono ?? ""}
          maxLength={30}
          required
        />
      </div>

      <div className="field">
        <label htmlFor={`${prefix}-linea1`}>Dirección</label>
        <input
          id={`${prefix}-linea1`}
          name="linea1"
          type="text"
          defaultValue={address?.linea1 ?? ""}
          maxLength={160}
          required
        />
      </div>

      <div className="field">
        <label htmlFor={`${prefix}-linea2`}>Complemento (opcional)</label>
        <input
          id={`${prefix}-linea2`}
          name="linea2"
          type="text"
          defaultValue={address?.linea2 ?? ""}
          maxLength={160}
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor={`${prefix}-ciudad`}>Ciudad</label>
          <input
            id={`${prefix}-ciudad`}
            name="ciudad"
            type="text"
            defaultValue={address?.ciudad ?? ""}
            maxLength={80}
            required
          />
        </div>
        <div className="field">
          <label htmlFor={`${prefix}-region`}>Departamento / región</label>
          <input
            id={`${prefix}-region`}
            name="region"
            type="text"
            defaultValue={address?.region ?? ""}
            maxLength={80}
            required
          />
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor={`${prefix}-codigoPostal`}>Código postal (opcional)</label>
          <input
            id={`${prefix}-codigoPostal`}
            name="codigoPostal"
            type="text"
            defaultValue={address?.codigoPostal ?? ""}
            maxLength={20}
          />
        </div>
        <div className="field">
          <label htmlFor={`${prefix}-pais`}>País (ISO 3166-1 alfa-2)</label>
          <input
            id={`${prefix}-pais`}
            name="pais"
            type="text"
            defaultValue={address?.pais ?? "CO"}
            minLength={2}
            maxLength={2}
            pattern="[A-Za-z]{2}"
            required
          />
        </div>
      </div>

      {state.status === "error" ? (
        <p className="form-error" role="alert">
          {state.message}
        </p>
      ) : null}
      {state.status === "success" ? (
        <p className="form-success" role="status">
          {state.message}
        </p>
      ) : null}

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending
          ? "Guardando…"
          : address
            ? "Guardar cambios"
            : "Agregar dirección"}
      </button>
    </form>
  );
}
