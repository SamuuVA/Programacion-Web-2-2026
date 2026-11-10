"use client";

import { useActionState } from "react";
import { AlertTriangleIcon, CheckIcon } from "@/components/icons";
import {
  approveSellerApplicationAction,
  rejectSellerApplicationAction,
  type ApproveSellerApplicationState,
  type RejectSellerApplicationState
} from "../actions";

const initialApprove: ApproveSellerApplicationState = { status: "idle" };
const initialReject: RejectSellerApplicationState = { status: "idle" };

export function AdminSellerApplicationActions({
  applicationId
}: {
  applicationId: string;
}) {
  const [approveState, approveAction, approving] = useActionState(
    approveSellerApplicationAction,
    initialApprove
  );
  const [rejectState, rejectAction, rejecting] = useActionState(
    rejectSellerApplicationAction,
    initialReject
  );

  return (
    <div className="seller-detail-aside-stack">
      <section className="checkout-block">
        <h2>Aprobar solicitud</h2>
        <p className="form-hint">
          Crea el perfil de vendedor y su primera bodega en una única transacción
          y cambia el rol principal a VENDEDOR. Un reintento no duplica registros.
        </p>
        <form
          action={approveAction}
          onSubmit={(event) => {
            if (
              !window.confirm(
                "¿Aprobar esta solicitud y crear el vendedor con su primera bodega?"
              )
            ) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="applicationId" value={applicationId} />
          <button className="btn btn-primary" type="submit" disabled={approving}>
            {approving ? "Aprobando…" : "Aprobar solicitud"}
          </button>
        </form>

        {approveState.status === "error" ? (
          <p className="form-error" role="alert">
            <AlertTriangleIcon width={16} height={16} /> {approveState.message}
            {approveState.correlationId ? (
              <span className="state-correlation">
                Código de seguimiento: {approveState.correlationId}
              </span>
            ) : null}
          </p>
        ) : null}

        {approveState.status === "success" && approveState.result ? (
          <div className="form-success" role="status">
            <p>
              <CheckIcon width={18} height={18} /> {approveState.message}
            </p>
            <dl className="result-ids">
              <div>
                <dt>Vendedor</dt>
                <dd>{approveState.result.sellerId}</dd>
              </div>
              <div>
                <dt>Primera bodega</dt>
                <dd>{approveState.result.warehouseId}</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </section>

      <section className="checkout-block">
        <h2>Rechazar solicitud</h2>
        <p className="form-hint">
          El rechazo exige motivo y no crea vendedor ni bodega. Tampoco cambia el
          estado de acceso del comprador.
        </p>
        <form
          action={rejectAction}
          onSubmit={(event) => {
            if (!window.confirm("¿Rechazar esta solicitud?")) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="applicationId" value={applicationId} />
          <div className="field">
            <label htmlFor="motivo">Motivo del rechazo</label>
            <textarea
              id="motivo"
              name="motivo"
              rows={3}
              minLength={3}
              maxLength={500}
              required
            />
          </div>
          <button className="btn btn-secondary" type="submit" disabled={rejecting}>
            {rejecting ? "Rechazando…" : "Rechazar solicitud"}
          </button>
        </form>

        {rejectState.status === "error" ? (
          <p className="form-error" role="alert">
            <AlertTriangleIcon width={16} height={16} /> {rejectState.message}
            {rejectState.correlationId ? (
              <span className="state-correlation">
                Código de seguimiento: {rejectState.correlationId}
              </span>
            ) : null}
          </p>
        ) : null}

        {rejectState.status === "success" ? (
          <p className="form-success" role="status">
            <CheckIcon width={18} height={18} /> {rejectState.message}
          </p>
        ) : null}
      </section>
    </div>
  );
}
