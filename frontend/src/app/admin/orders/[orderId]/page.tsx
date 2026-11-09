import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRightIcon, ShieldCheckIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";
import { getSessionToken, requireAdmin } from "@/features/auth/session";
import { fetchAdminOrder } from "@/features/admin/api";
import {
  ESTADO_ENVIO_LABEL,
  ESTADO_PAGO_LABEL,
  ESTADO_PEDIDO_LABEL,
  ESTADO_RESERVA_LABEL,
  estadoEnvioTone,
  estadoPagoTone,
  estadoPedidoTone,
  formatFechaHora,
  formatMoney
} from "@/features/admin/format";
import { isAdminResourceId } from "@/features/admin/ids";
import { toActionError } from "@/lib/action-state";

type OrderPageProps = {
  params: Promise<{ orderId: string }>;
};

export async function generateMetadata({
  params
}: OrderPageProps): Promise<Metadata> {
  const { orderId } = await params;
  if (!isAdminResourceId(orderId)) {
    notFound();
  }
  return { title: "Detalle del pedido" };
}

export default async function AdminOrderDetailPage({ params }: OrderPageProps) {
  const { orderId } = await params;
  if (!isAdminResourceId(orderId)) {
    notFound();
  }

  await requireAdmin(`/admin/orders/${orderId}`);
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  let order: Awaited<ReturnType<typeof fetchAdminOrder>>;
  try {
    order = await fetchAdminOrder(token, orderId);
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

  return (
    <>
      <section className="page-head">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Ruta de navegación">
            <Link href="/admin/orders">Pedidos</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{order.numero}</span>
          </nav>
          <p className="eyebrow">Pedido</p>
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
                      <strong>
                        <Link href={`/admin/products/${item.productoId}`}>
                          {item.nombreProducto}
                        </Link>
                      </strong>
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
              <h2>Pago</h2>
              {order.pago ? (
                <ul className="order-items">
                  <li>
                    <div>
                      <strong>{ESTADO_PAGO_LABEL[order.pago.estado]}</strong>
                      <span>
                        Proveedor {order.pago.proveedor} ·{" "}
                        {formatFechaHora(order.pago.actualizadoEn)}
                      </span>
                    </div>
                    <strong>
                      {formatMoney(order.pago.montoCentavos, order.pago.moneda)}
                    </strong>
                  </li>
                </ul>
              ) : (
                <p className="form-hint">El pedido no tiene un pago registrado.</p>
              )}
            </section>

            <section className="checkout-block">
              <h2>Reservas de inventario</h2>
              {order.reservas.length === 0 ? (
                <p className="form-hint">
                  No hay reservas de inventario asociadas a este pedido.
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
                        {reserva.cantidad} unidades ·{" "}
                        {ESTADO_RESERVA_LABEL[reserva.estado]}
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
                  Todavía no hay envíos preparados para este pedido.
                </p>
              ) : (
                <div className="order-list">
                  {order.envios.map((envio) => (
                    <article className="order-card" key={envio.id}>
                      <div className="order-card-head">
                        <div>
                          <p className="order-card-number">{envio.bodegaNombre}</p>
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
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="checkout-block">
              <h2>Historial de estados</h2>
              {order.historial.length === 0 ? (
                <p className="form-hint">
                  El historial se completa con las transiciones registradas por los
                  roles autorizados.
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
                          {entry.actorRol ?? "Sistema"} · {entry.referenciaTipo}{" "}
                          {entry.referenciaId}
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
              <h2>Partes del pedido</h2>
              <ul className="order-items">
                <li>
                  <span>Comprador</span>
                  <strong>
                    <Link
                      className="text-link"
                      href={`/admin/buyers/${order.compradorId}`}
                    >
                      {order.compradorNombre}
                    </Link>
                  </strong>
                </li>
                <li>
                  <span>Vendedor</span>
                  <strong>
                    <Link
                      className="text-link"
                      href={`/admin/sellers/${order.vendedorId}`}
                    >
                      {order.vendedorNombre}
                    </Link>
                  </strong>
                </li>
              </ul>
            </section>

            <section className="checkout-block">
              <h2>Entrega</h2>
              {order.entrega ? (
                <ul className="order-items">
                  <li>
                    <span>Ciudad</span>
                    <strong>{order.entrega.ciudad}</strong>
                  </li>
                  <li>
                    <span>Región</span>
                    <strong>{order.entrega.region}</strong>
                  </li>
                  <li>
                    <span>País</span>
                    <strong>{order.entrega.pais}</strong>
                  </li>
                  <li>
                    <span>Capturada</span>
                    <strong>{formatFechaHora(order.entrega.capturadaEn)}</strong>
                  </li>
                </ul>
              ) : (
                <p className="form-hint">
                  El pedido no tiene datos de entrega registrados.
                </p>
              )}
              <p className="form-hint">
                La vista administrativa omite destinatario, teléfono y dirección
                completa.
              </p>
            </section>

            <section className="checkout-block">
              <h2>Consulta de solo lectura</h2>
              <p className="form-hint">
                <ShieldCheckIcon width={16} height={16} /> El Administrador no
                modifica el pedido, el pago, las reservas ni los envíos. Esas
                operaciones pertenecen a otros roles.
              </p>
            </section>

            <Link className="text-link" href="/admin/orders">
              <ArrowRightIcon
                width={16}
                height={16}
                style={{ transform: "rotate(180deg)" }}
              />
              Volver a pedidos
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}
