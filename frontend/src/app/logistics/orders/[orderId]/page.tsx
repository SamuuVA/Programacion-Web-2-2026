import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRightIcon, BoxesIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";
import { getSessionToken, requireLogistics } from "@/features/auth/session";
import { fetchLogisticsOrder } from "@/features/logistics/api";
import { LogisticsDeliveryForm } from "@/features/logistics/components/logistics-delivery-form";
import { LogisticsDispatchForm } from "@/features/logistics/components/logistics-dispatch-form";
import { LogisticsPrepareForm } from "@/features/logistics/components/logistics-prepare-form";
import {
  ESTADO_ENVIO_LABEL,
  estadoEnvioTone,
  formatFechaHora,
  formatMoney
} from "@/features/logistics/format";
import {
  ESTADO_PAGO_LABEL,
  ESTADO_PEDIDO_LABEL,
  estadoPagoTone,
  estadoPedidoTone
} from "@/features/orders/format";
import { isOrderId } from "@/features/orders/ids";
import { toActionError } from "@/lib/action-state";

type LogisticsOrderPageProps = {
  params: Promise<{ orderId: string }>;
};

export async function generateMetadata({
  params
}: LogisticsOrderPageProps): Promise<Metadata> {
  const { orderId } = await params;
  if (!isOrderId(orderId)) {
    notFound();
  }
  return { title: "Detalle del pedido" };
}

export default async function LogisticsOrderDetailPage({
  params
}: LogisticsOrderPageProps) {
  const { orderId } = await params;
  if (!isOrderId(orderId)) {
    notFound();
  }

  await requireLogistics(`/logistics/orders/${orderId}`);
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  let order: Awaited<ReturnType<typeof fetchLogisticsOrder>>;
  try {
    order = await fetchLogisticsOrder(token, orderId);
  } catch (error) {
    const state = toActionError(error, "No pudimos cargar el pedido.");
    return (
      <section className="section-tight">
        <div className="container">
          <ErrorState
            description={state.message ?? "Intenta de nuevo más tarde."}
            correlationId={state.correlationId}
          />
        </div>
      </section>
    );
  }

  if (!order) {
    notFound();
  }

  const finalizado =
    order.estado === "ENTREGADO" ||
    order.estado === "CERRADO" ||
    order.estado === "CANCELADO";

  const prepareBodegas = uniqueBodegas(
    order.reservas.filter((reserva) => reserva.estado === "ACTIVA")
  );
  const preparables = order.envios.filter(
    (envio) => envio.estado === "PREPARACION" || envio.estado === "EMPACADO"
  );
  const entregables = order.envios.filter(
    (envio) => envio.estado === "DESPACHADO" || envio.estado === "EN_TRANSITO"
  );
  const canPrepare =
    !finalizado &&
    (order.estado === "PAGADO" || order.estado === "EN_PREPARACION") &&
    prepareBodegas.length > 0;

  return (
    <>
      <section className="page-head">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Ruta de navegación">
            <Link href="/logistics/orders">Pedidos</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{order.numero}</span>
          </nav>
          <p className="eyebrow">Pedido en tu ámbito logístico</p>
          <h1>{order.numero}</h1>
          <div className="order-detail-badges">
            <Badge tone={estadoPedidoTone(order.estado)}>
              {ESTADO_PEDIDO_LABEL[order.estado]}
            </Badge>
            <Badge tone={estadoPagoTone(order.estadoPago)}>
              {ESTADO_PAGO_LABEL[order.estadoPago]}
            </Badge>
            <span className="order-detail-date">
              Creado el {formatFechaHora(order.creadoEn)}
            </span>
          </div>
        </div>
      </section>

      <section className="section-tight">
        <div className="container seller-detail-layout">
          <div className="seller-detail-main">
            <section className="checkout-block">
              <h2>Productos del pedido</h2>
              <ul className="order-items">
                {order.items.map((item) => (
                  <li key={item.id}>
                    <div>
                      <strong>{item.nombreProducto}</strong>
                      <span>
                        SKU {item.sku} · {item.cantidad} ×{" "}
                        {formatMoney(item.precioUnitarioCentavos, item.moneda)}
                      </span>
                    </div>
                    <strong>{formatMoney(item.subtotalCentavos, item.moneda)}</strong>
                  </li>
                ))}
              </ul>
              <div className="summary-row summary-total">
                <span>Total del pedido</span>
                <strong>{formatMoney(order.totalCentavos, order.moneda)}</strong>
              </div>
            </section>

            <section className="checkout-block">
              <h2>Reservas en tus bodegas</h2>
              {order.reservas.length === 0 ? (
                <p className="form-hint">
                  No hay reservas de inventario en tus bodegas para este pedido.
                </p>
              ) : (
                <ul className="order-items">
                  {order.reservas.map((reserva) => (
                    <li key={reserva.id}>
                      <div>
                        <strong>{reserva.productoNombre}</strong>
                        <span>
                          SKU {reserva.sku} · {reserva.bodegaNombre}
                        </span>
                      </div>
                      <span>
                        {reserva.cantidad} unidades · {reserva.estado}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="checkout-block">
              <h2>Envíos</h2>
              {order.envios.length === 0 ? (
                <p className="form-hint">
                  Todavía no hay envíos preparados para este pedido en tu ámbito.
                </p>
              ) : (
                <div className="order-list">
                  {order.envios.map((envio) => {
                    const puedeDespachar =
                      !finalizado &&
                      (envio.estado === "PREPARACION" || envio.estado === "EMPACADO");
                    const puedeEntregar =
                      !finalizado &&
                      (envio.estado === "DESPACHADO" ||
                        envio.estado === "EN_TRANSITO");
                    return (
                      <article className="order-card" key={envio.id}>
                        <div className="order-card-head">
                          <div>
                            <p className="order-card-number">
                              {envio.bodegaNombre}
                            </p>
                            <p className="order-card-seller">
                              Preparado el {formatFechaHora(envio.creadoEn)}
                              {envio.despachadoEn
                                ? ` · Despachado el ${formatFechaHora(envio.despachadoEn)}`
                                : ""}
                              {envio.entregadoEn
                                ? ` · Entregado el ${formatFechaHora(envio.entregadoEn)}`
                                : ""}
                            </p>
                          </div>
                          <Badge tone={estadoEnvioTone(envio.estado)}>
                            {ESTADO_ENVIO_LABEL[envio.estado]}
                          </Badge>
                        </div>

                        <ul className="order-items">
                          {envio.items.map((item) => (
                            <li key={`${envio.id}-${item.productoId}`}>
                              <div>
                                <strong>{item.nombreProducto}</strong>
                                <span>SKU {item.sku}</span>
                              </div>
                              <span>{item.cantidad} unidades</span>
                            </li>
                          ))}
                        </ul>

                        {envio.transportista || envio.trackingNumber ? (
                          <p className="form-hint">
                            {envio.transportista
                              ? `Transportista: ${envio.transportista}. `
                              : ""}
                            {envio.trackingNumber
                              ? `Seguimiento: ${envio.trackingNumber}.`
                              : ""}
                          </p>
                        ) : null}

                        {envio.evidencia ? (
                          <p className="form-hint">
                            Evidencia {envio.evidencia.tipo}:{" "}
                            {envio.evidencia.referencia}
                            {envio.evidencia.nota
                              ? ` · ${envio.evidencia.nota}`
                              : ""}{" "}
                            · {formatFechaHora(envio.evidencia.registradaEn)}
                          </p>
                        ) : null}

                        {puedeDespachar ? (
                          <details className="address-edit">
                            <summary>Despachar este envío</summary>
                            <LogisticsDispatchForm shipmentId={envio.id} />
                          </details>
                        ) : null}

                        {puedeEntregar ? (
                          <details className="address-edit">
                            <summary>Registrar entrega o fallo</summary>
                            <LogisticsDeliveryForm shipmentId={envio.id} />
                          </details>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="checkout-block">
              <h2>Historial de estados</h2>
              {order.historial.length === 0 ? (
                <p className="form-hint">
                  El historial se completa con las transiciones registradas por
                  los roles autorizados.
                </p>
              ) : (
                <ul className="order-items">
                  {order.historial.map((entry, index) => (
                    <li key={`${entry.ocurridoEn}-${index}`}>
                      <div>
                        <strong>
                          {entry.estadoPrevio
                            ? `${ESTADO_PEDIDO_LABEL[entry.estadoPrevio]} → ${ESTADO_PEDIDO_LABEL[entry.estadoNuevo]}`
                            : ESTADO_PEDIDO_LABEL[entry.estadoNuevo]}
                        </strong>
                        <span>
                          {entry.actorRol ?? "Sistema"} ·{" "}
                          {entry.referenciaTipo} {entry.referenciaId}
                        </span>
                      </div>
                      <span>{formatFechaHora(entry.ocurridoEn)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <aside className="seller-detail-aside">
            <section className="checkout-block">
              <h2>Preparar envío</h2>
              {finalizado ? (
                <p className="form-hint">
                  El pedido está en un estado final y no admite nuevas
                  operaciones logísticas.
                </p>
              ) : canPrepare ? (
                <LogisticsPrepareForm orderId={order.id} bodegas={prepareBodegas} />
              ) : (
                <p className="form-hint">
                  La preparación requiere un pedido pagado y reservas activas en
                  tus bodegas. Estado actual:{" "}
                  {ESTADO_PEDIDO_LABEL[order.estado]}.
                </p>
              )}
            </section>

            <section className="checkout-block">
              <h2>Entrega</h2>
              <p className="form-hint">
                {preparables.length > 0
                  ? `${preparables.length} ${preparables.length === 1 ? "envío está" : "envíos están"} pendiente(s) de despacho.`
                  : entregables.length > 0
                    ? `${entregables.length} ${entregables.length === 1 ? "envío está" : "envíos están"} en tránsito y admite(n) confirmación de entrega.`
                    : "No hay envíos pendientes de despacho ni de entrega en este momento."}
              </p>
              {order.direccionEntrega ? (
                <address className="order-address">
                  <strong>{order.direccionEntrega.destinatario}</strong>
                  <span>{order.direccionEntrega.linea1}</span>
                  {order.direccionEntrega.linea2 ? (
                    <span>{order.direccionEntrega.linea2}</span>
                  ) : null}
                  <span>
                    {order.direccionEntrega.ciudad},{" "}
                    {order.direccionEntrega.region}
                  </span>
                  <span>{order.direccionEntrega.pais}</span>
                  <small>
                    La dirección se muestra solo para la operación de entrega.
                  </small>
                </address>
              ) : null}
            </section>

            <Link className="text-link" href="/logistics/orders">
              <ArrowRightIcon
                width={16}
                height={16}
                style={{ transform: "rotate(180deg)" }}
              />
              Volver a pedidos
            </Link>
            <Link className="text-link" href="/logistics/inventory">
              <BoxesIcon width={16} height={16} /> Consultar inventario
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}

function uniqueBodegas(
  reservas: readonly { bodegaId: string; bodegaNombre: string }[]
): { id: string; nombre: string }[] {
  const map = new Map<string, string>();
  for (const reserva of reservas) {
    map.set(reserva.bodegaId, reserva.bodegaNombre);
  }
  return [...map.entries()].map(([id, nombre]) => ({ id, nombre }));
}
