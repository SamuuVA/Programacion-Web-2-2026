import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatFechaHora } from "@/features/orders/format";
import {
  ESTADO_SOLICITUD_LABEL,
  estadoSolicitudTone
} from "../format";
import type { SellerApplicationDetail } from "../types";

export function SellerApplicationStatus({
  solicitud
}: {
  solicitud: SellerApplicationDetail;
}) {
  return (
    <section className="checkout-block">
      <div className="seller-head-meta">
        <h2>Tu solicitud</h2>
        <Badge tone={estadoSolicitudTone(solicitud.estado)}>
          {ESTADO_SOLICITUD_LABEL[solicitud.estado]}
        </Badge>
      </div>

      <ul className="order-items">
        <li>
          <span>Nombre comercial</span>
          <strong>{solicitud.nombreComercial}</strong>
        </li>
        <li>
          <span>Primera bodega</span>
          <strong>{solicitud.nombreBodega}</strong>
        </li>
        <li>
          <span>Ubicación</span>
          <strong>{solicitud.ubicacionBodega}</strong>
        </li>
        <li>
          <span>Presentada</span>
          <strong>{formatFechaHora(solicitud.creadaEn)}</strong>
        </li>
        <li>
          <span>Última actualización</span>
          <strong>{formatFechaHora(solicitud.actualizadaEn)}</strong>
        </li>
        {solicitud.revisadoEn ? (
          <li>
            <span>Revisada</span>
            <strong>{formatFechaHora(solicitud.revisadoEn)}</strong>
          </li>
        ) : null}
      </ul>

      {solicitud.estado === "PENDIENTE" ? (
        <p className="form-hint">
          Tu solicitud está en revisión. No necesitas enviar otra mientras siga
          pendiente. El resultado aparecerá en esta misma página.
        </p>
      ) : null}

      {solicitud.estado === "APROBADA" ? (
        <div className="form-success" role="status">
          <p>
            Tu solicitud fue aprobada. La misma cuenta ahora tiene el rol
            principal de vendedor.
          </p>
          <p>
            <Link className="text-link" href="/seller">
              Ir a mi espacio de vendedor
            </Link>
          </p>
          {solicitud.sellerId ? (
            <p className="form-hint">Vendedor: {solicitud.sellerId}</p>
          ) : null}
          {solicitud.warehouseId ? (
            <p className="form-hint">Primera bodega: {solicitud.warehouseId}</p>
          ) : null}
        </div>
      ) : null}

      {solicitud.estado === "RECHAZADA" ? (
        <div className="form-error" role="alert">
          <p>Tu solicitud fue rechazada.</p>
          {solicitud.motivoRechazo ? (
            <p>Motivo: {solicitud.motivoRechazo}</p>
          ) : null}
          <p className="form-hint">
            El rechazo no cambia tu estado de acceso ni elimina tu perfil de
            comprador. La política de reenvío aún no está definida.
          </p>
        </div>
      ) : null}
    </section>
  );
}
