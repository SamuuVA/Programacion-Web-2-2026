"use client";

import { useActionState } from "react";
import { CheckIcon } from "@/components/icons";
import {
  registerSellerAction,
  type RegisterSellerState
} from "../actions";

const initialState: RegisterSellerState = { status: "idle" };

export function SellerForm() {
  const [state, action, pending] = useActionState(
    registerSellerAction,
    initialState
  );

  return (
    <form action={action} className="seller-form">
      <fieldset>
        <legend>Datos del usuario vendedor</legend>

        <div className="field">
          <label htmlFor="nombreCompleto">Nombre completo</label>
          <input
            id="nombreCompleto"
            name="nombreCompleto"
            type="text"
            maxLength={120}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="correoElectronico">Correo electrónico</label>
          <input
            id="correoElectronico"
            name="correoElectronico"
            type="email"
            autoComplete="off"
            required
          />
        </div>

        <div className="field-row field-row-3">
          <div className="field">
            <label htmlFor="documentoTipo">Tipo de documento</label>
            <input
              id="documentoTipo"
              name="documentoTipo"
              type="text"
              defaultValue="CC"
              maxLength={20}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="documentoPais">País del documento</label>
            <input
              id="documentoPais"
              name="documentoPais"
              type="text"
              defaultValue="CO"
              minLength={2}
              maxLength={2}
              pattern="[A-Za-z]{2}"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="documentoNumero">Número</label>
            <input
              id="documentoNumero"
              name="documentoNumero"
              type="text"
              maxLength={40}
              required
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="credencial">Contraseña inicial</label>
          <input
            id="credencial"
            name="credencial"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            required
          />
          <p className="form-hint">Mínimo 12 caracteres.</p>
        </div>
      </fieldset>

      <fieldset>
        <legend>Datos comerciales y primera bodega</legend>

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
          <label htmlFor="bodegaNombre">Nombre de la bodega</label>
          <input
            id="bodegaNombre"
            name="bodegaNombre"
            type="text"
            maxLength={120}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="bodegaUbicacion">Ubicación de la bodega</label>
          <input
            id="bodegaUbicacion"
            name="bodegaUbicacion"
            type="text"
            maxLength={200}
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

      {state.status === "success" && state.result ? (
        <div className="form-success" role="status">
          <p>
            <CheckIcon width={18} height={18} /> {state.message}
          </p>
          <dl className="result-ids">
            <div>
              <dt>Usuario</dt>
              <dd>{state.result.usuarioId}</dd>
            </div>
            <div>
              <dt>Vendedor</dt>
              <dd>{state.result.sellerId}</dd>
            </div>
            <div>
              <dt>Bodega</dt>
              <dd>{state.result.warehouseId}</dd>
            </div>
          </dl>
        </div>
      ) : null}

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Creando vendedor y bodega…" : "Registrar vendedor"}
      </button>

      <p className="form-hint">
        El usuario, el vendedor y la primera bodega se crean en una sola
        transacción. Si falla la bodega, no queda ningún registro parcial.
      </p>
    </form>
  );
}
