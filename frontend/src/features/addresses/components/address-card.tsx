"use client";

import { useActionState } from "react";
import { IDLE_ACTION_STATE } from "@/lib/action-state";
import { Badge } from "@/components/ui/badge";
import {
  deleteAddressAction,
  setPrincipalAddressAction
} from "../actions";
import type { Address } from "../types";
import { AddressForm } from "./address-form";

export function AddressCard({ address }: { address: Address }) {
  const [principalState, principalAction, principalPending] = useActionState(
    setPrincipalAddressAction,
    IDLE_ACTION_STATE
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteAddressAction,
    IDLE_ACTION_STATE
  );

  return (
    <article className="address-card">
      <div className="address-card-head">
        <div>
          <h2>{address.destinatario}</h2>
          <p className="address-card-location">
            {address.linea1}
            {address.linea2 ? `, ${address.linea2}` : ""} · {address.ciudad},{" "}
            {address.region}
            {address.codigoPostal ? ` · ${address.codigoPostal}` : ""} ·{" "}
            {address.pais}
          </p>
          <p className="address-card-phone">Tel. {address.telefono}</p>
        </div>
        {address.esPrincipal ? <Badge tone="success">Principal</Badge> : null}
      </div>

      <div className="address-card-actions">
        {!address.esPrincipal ? (
          <form action={principalAction}>
            <input type="hidden" name="direccionId" value={address.id} />
            <button
              className="btn btn-secondary btn-sm"
              type="submit"
              disabled={principalPending}
            >
              {principalPending ? "Cambiando…" : "Marcar como principal"}
            </button>
          </form>
        ) : null}

        <form action={deleteAction}>
          <input type="hidden" name="direccionId" value={address.id} />
          <button
            className="link-button link-button-danger"
            type="submit"
            disabled={deletePending}
          >
            {deletePending ? "Eliminando…" : "Eliminar"}
          </button>
        </form>
      </div>

      {principalState.status === "error" ? (
        <p className="form-error" role="alert">
          {principalState.message}
        </p>
      ) : null}
      {deleteState.status === "error" ? (
        <p className="form-error" role="alert">
          {deleteState.message}
        </p>
      ) : null}

      <details className="address-edit">
        <summary>Editar dirección</summary>
        <AddressForm address={address} />
      </details>
    </article>
  );
}
