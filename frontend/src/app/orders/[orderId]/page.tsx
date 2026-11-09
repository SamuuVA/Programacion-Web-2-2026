import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRightIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { getSessionToken, requireBuyer } from "@/features/auth/session";
import { fetchOrder } from "@/features/orders/api";
import {
  ESTADO_PAGO_LABEL,
  ESTADO_PEDIDO_LABEL,
  estadoPagoTone,
  estadoPedidoTone,
  formatFechaHora,
  formatMoney
} from "@/features/orders/format";
import { isOrderId } from "@/features/orders/ids";

type OrderPageProps = {
  params: Promise<{ orderId: string }>;
};

export async function generateMetadata({
  params
}: OrderPageProps): Promise<Metadata> {
  const { orderId } = await params;
  if (!isOrderId(orderId)) {
    notFound();
  }
  return { title: "Detalle del pedido" };
}

export default async function OrderDetailPage({ params }: OrderPageProps) {
  const { orderId } = await params;
  if (!isOrderId(orderId)) {
    notFound();
  }

  await requireBuyer(`/orders/${orderId}`);
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  const order = await fetchOrder(token, orderId);
  if (!order) {
    notFound();
  }

  const address = order.direccionEntrega;

  return (
    <>
      <section className="page-head">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Ruta de navegación">
            <Link href="/orders">Mis pedidos</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{order.numero}</span>
          </nav>
          <p className="eyebrow">{order.vendedorNombre}</p>
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
        <div className="container order-detail-layout">
          <div className="order-detail-main">
            <section className="checkout-block">
              <h2>Productos</h2>
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
                <span>Total</span>
                <strong>{formatMoney(order.totalCentavos, order.moneda)}</strong>
              </div>
            </section>

            <section className="checkout-block">
              <h2>Dirección de entrega</h2>
              {address ? (
                <address className="order-address">
                  <strong>{address.destinatario}</strong>
                  <span>{address.linea1}</span>
                  {address.linea2 ? <span>{address.linea2}</span> : null}
                  <span>
                    {address.ciudad}, {address.region}
                    {address.codigoPostal ? ` · ${address.codigoPostal}` : ""}
                  </span>
                  <span>{address.pais}</span>
                  <span>Tel. {address.telefono}</span>
                  <small>
                    Copia capturada el {formatFechaHora(address.capturadaEn)}
                  </small>
                </address>
              ) : (
                <p className="form-hint">
                  Este pedido no requiere dirección física (productos digitales).
                </p>
              )}
            </section>
          </div>

          <aside className="order-detail-aside">
            <section className="checkout-block">
              <h2>Pago</h2>
              {order.pago ? (
                <dl className="order-payment">
                  <div>
                    <dt>Estado</dt>
                    <dd>{ESTADO_PAGO_LABEL[order.pago.estado]}</dd>
                  </div>
                  <div>
                    <dt>Proveedor</dt>
                    <dd>{order.pago.proveedor}</dd>
                  </div>
                  <div>
                    <dt>Referencia</dt>
                    <dd>{order.pago.referencia ?? "Sin referencia"}</dd>
                  </div>
                  <div>
                    <dt>Monto</dt>
                    <dd>{formatMoney(order.pago.montoCentavos, order.pago.moneda)}</dd>
                  </div>
                </dl>
              ) : (
                <p className="form-hint">El pedido aún no tiene un pago asociado.</p>
              )}
            </section>

            <Link className="text-link" href="/orders">
              <ArrowRightIcon
                width={16}
                height={16}
                style={{ transform: "rotate(180deg)" }}
              />
              Volver a mis pedidos
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}
