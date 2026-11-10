"use client";

import { useActionState } from "react";
import { CheckIcon } from "@/components/icons";
import {
  submitSellerApplicationAction,
  type SubmitSellerApplicationState
} from "../actions";

const initialState: SubmitSellerApplicationState = { status: "idle" };

export function SellerApplicationForm() {
  const [state, action, pending] = useActionState(
    submitSellerApplicationAction,
    initialState
  );

  return (
    <form action={action} className="seller-form">
      <fieldset>
        <legend>Datos comerciales</legend>

        <div className="field">
          <label htmlFor="nombreComercial">Nombre comercial</label>
          <input
            id="nombreComercial"
            name="nombreComercial"
            type="text"
            maxLength={120}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="nombreBodega">Nombre de la primera bodega</label>
          <input
            id="nombreBodega"
            name="nombreBodega"
            type="text"
            maxLength={120}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="ubicacionBodega">Ubicación de la bodega</label>
          <input
            id="ubicacionBodega"
            name="ubicacionBodega"
            type="text"
            maxLength={200}
            placeholder="Ciudad, país o dirección operativa"
            required
          />
        </div>
      </fieldset>

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
        <div className="form-success" role="status">
          <p>
            <CheckIcon width={18} height={18} /> {state.message}
          </p>
        </div>
      ) : null}

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Enviando solicitud…" : "Enviar solicitud"}
      </button>

      <p className="form-hint">
        La solicitud no cambia tu rol ni crea un vendedor. Solo un administrador
        puede aprobarla; en ese momento se crean el perfil de vendedor y su
        primera bodega en una sola transacción.
      </p>
    </form>
  );
}
