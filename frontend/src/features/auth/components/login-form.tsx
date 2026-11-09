"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "../actions";

const initialState: LoginState = {};

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="form-card">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <div className="field">
        <label htmlFor="correoElectronico">Correo electrónico</label>
        <input
          id="correoElectronico"
          name="correoElectronico"
          type="email"
          autoComplete="email"
          required
          placeholder="comprador@nexusmarket.demo"
        />
      </div>

      <div className="field">
        <label htmlFor="credencial">Contraseña</label>
        <input
          id="credencial"
          name="credencial"
          type="password"
          autoComplete="current-password"
          required
          minLength={1}
          maxLength={128}
          placeholder="Tu contraseña"
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
        {pending ? "Ingresando…" : "Ingresar"}
      </button>

      <p className="form-hint">
        Demostración local: <code>comprador@nexusmarket.demo</code> o{" "}
        <code>admin@nexusmarket.demo</code> con la contraseña{" "}
        <code>NexusMarketDemo2026!</code>.
      </p>
    </form>
  );
}
