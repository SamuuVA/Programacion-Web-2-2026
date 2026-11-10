"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerBuyerAction, type RegisterBuyerState } from "../actions";

const initialState: RegisterBuyerState = {};

const DOCUMENTO_TIPOS = [
  { value: "CC", label: "Cédula de ciudadanía" },
  { value: "CE", label: "Cédula de extranjería" },
  { value: "NIT", label: "NIT" },
  { value: "PASAPORTE", label: "Pasaporte" },
  { value: "TI", label: "Tarjeta de identidad" },
  { value: "OTRO", label: "Otro" }
] as const;

export function RegisterForm() {
  const [state, action, pending] = useActionState(
    registerBuyerAction,
    initialState
  );

  return (
    <form action={action} className="form-card">
      <div className="field">
        <label htmlFor="nombreCompleto">Nombre completo</label>
        <input
          id="nombreCompleto"
          name="nombreCompleto"
          type="text"
          autoComplete="name"
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
          autoComplete="email"
          required
        />
      </div>

      <div className="field-row field-row-3">
        <div className="field">
          <label htmlFor="tipoDocumento">Tipo de documento</label>
          <select id="tipoDocumento" name="tipoDocumento" defaultValue="CC" required>
            {DOCUMENTO_TIPOS.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="paisDocumento">País del documento</label>
          <input
            id="paisDocumento"
            name="paisDocumento"
            type="text"
            defaultValue="CO"
            maxLength={2}
            autoComplete="country"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="numeroDocumento">Número de documento</label>
          <input
            id="numeroDocumento"
            name="numeroDocumento"
            type="text"
            maxLength={40}
            required
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="credencial">Contraseña</label>
        <input
          id="credencial"
          name="credencial"
          type="password"
          autoComplete="new-password"
          minLength={12}
          maxLength={128}
          required
        />
        <span className="form-hint">
          Entre 12 y 128 caracteres. Se almacena con Argon2id.
        </span>
      </div>

      <div className="field">
        <label htmlFor="confirmarCredencial">Confirmar contraseña</label>
        <input
          id="confirmarCredencial"
          name="confirmarCredencial"
          type="password"
          autoComplete="new-password"
          minLength={12}
          maxLength={128}
          required
        />
      </div>

      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
          {state.correlationId ? (
            <span className="state-correlation">
              Código de seguimiento: {state.correlationId}
            </span>
          ) : null}
        </p>
      ) : null}

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Creando cuenta…" : "Crear cuenta de comprador"}
      </button>

      <p className="form-hint">
        ¿Ya tienes cuenta?{" "}
        <Link className="text-link" href="/login">
          Inicia sesión
        </Link>
        . El registro público solo crea cuentas de comprador; la incorporación
        como vendedor requiere una solicitud y aprobación administrativa.
      </p>
    </form>
  );
}
