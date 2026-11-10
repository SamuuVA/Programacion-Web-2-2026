"use client";

import { useActionState } from "react";
import { AlertTriangleIcon, CheckIcon } from "@/components/icons";
import type { EstadoUsuario } from "@/features/auth/types";
import {
  updateUserAccessStatusAction,
  type UpdateUserAccessStatusState
} from "../actions";
import { ACCION_ESTADO_LABEL, accionesDisponibles } from "../format";
import type { AccionEstadoUsuario } from "../types";

const initialState: UpdateUserAccessStatusState = { status: "idle" };

export function AccessStatusForm({
  usuarioId,
  estadoActual,
  isSelf
}: {
  usuarioId: string;
  estadoActual: EstadoUsuario;
  isSelf: boolean;
}) {
  const [state, action, pending] = useActionState(
    updateUserAccessStatusAction,
    initialState
  );
  const acciones = accionesDisponibles(estadoActual);

  if (isSelf) {
    return (
      <section className="checkout-block">
        <h2>Estado de acceso</h2>
        <p className="form-hint">
          No puedes cambiar tu propio estado de acceso. Otro administrador debe
          realizar la operación.
        </p>
      </section>
    );
  }

  if (acciones.length === 0) {
    return (
      <section className="checkout-block">
        <h2>Estado de acceso</h2>
        <p className="form-hint">
          No hay transiciones definidas para el estado actual.
        </p>
      </section>
    );
  }

  return (
    <section className="checkout-block">
      <h2>Estado de acceso</h2>
      <p className="form-hint">
        Estado actual: <strong>{estadoActual}</strong>. La transición se valida
        de nuevo en el backend. Desactivar o bloquear revoca las sesiones vigentes
        de la cuenta en la misma transacción.
      </p>

      <form
        action={action}
        className="seller-form"
        onSubmit={(event) => {
          const selected = String(
            new FormData(event.currentTarget).get("accion") ?? ""
          );
          const label =
            ACCION_ESTADO_LABEL[selected as AccionEstadoUsuario] ?? selected;
          if (
            !window.confirm(
              `¿Aplicar la acción "${label}" a esta cuenta?`
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="usuarioId" value={usuarioId} />

        <div className="field">
          <label htmlFor="accion">Acción</label>
          <select id="accion" name="accion" defaultValue={acciones[0]} required>
            {acciones.map((accion: AccionEstadoUsuario) => (
              <option key={accion} value={accion}>
                {ACCION_ESTADO_LABEL[accion]}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="motivo">Motivo</label>
          <textarea
            id="motivo"
            name="motivo"
            rows={3}
            maxLength={500}
            placeholder="Obligatorio para desactivar o bloquear"
          />
          <span className="form-hint">
            El motivo es obligatorio para DESACTIVAR y BLOQUEAR. En las demás
            acciones es opcional.
          </span>
        </div>

        {state.status === "error" ? (
          <p className="form-error" role="alert">
            <AlertTriangleIcon width={16} height={16} /> {state.message}
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
            {state.result ? (
              <p className="form-hint">
                Sesiones revocadas: {state.result.sesionesRevocadas}. Actualizado:{" "}
                {state.result.actualizadoEn}
              </p>
            ) : null}
          </div>
        ) : null}

        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? "Aplicando cambio…" : "Cambiar estado"}
        </button>
      </form>

      <p className="form-hint">
        Transiciones permitidas: ACTIVO→INACTIVO, ACTIVO→BLOQUEADO,
        INACTIVO→ACTIVO, BLOQUEADO→ACTIVO e INACTIVO→BLOQUEADO. BLOQUEADO→INACTIVO
        no está permitida.
      </p>
    </section>
  );
}
