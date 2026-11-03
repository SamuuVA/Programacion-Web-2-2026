import type { Metadata } from "next";
import Link from "next/link";
import { PackageIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { getSessionToken, requireBuyer } from "@/features/auth/session";
import { fetchOrders } from "@/features/orders/api";
import {
  ESTADO_PAGO_LABEL,
  ESTADO_PEDIDO_LABEL,
  estadoPagoTone,
  estadoPedidoTone,
  formatFechaHora,
  formatMoney
} from "@/features/orders/format";

export const metadata: Metadata = {
  title: "Mis pedidos"
};

export default async function OrdersPage() {
  await requireBuyer("/orders");
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  const orders = await fetchOrders(token);

  return (
    <>
      <section className="page-head">
        <div className="container">
          <p className="eyebrow">Historial</p>
          <h1>Mis pedidos</h1>
          <p>
            Cada pedido conserva los precios, el pago y la dirección capturados al
            confirmar la compra.
          </p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          {orders.length === 0 ? (
            <EmptyState
              icon={<PackageIcon width={24} height={24} />}
              title="Todavía no tienes pedidos"
              description="Cuando confirmes una compra, aquí verás el estado del pedido y del pago."
              action={{ href: "/products", label: "Explorar productos" }}
            />
          ) : (
            <div className="order-list">
              {orders.map((order) => (
                <article className="order-card" key={order.id}>
                  <div className="order-card-head">
                    <div>
                      <p className="order-card-number">{order.numero}</p>
                      <p className="order-card-seller">{order.vendedorNombre}</p>
                    </div>
                    <div className="order-card-badges">
                      <Badge tone={estadoPedidoTone(order.estado)}>
                        {ESTADO_PEDIDO_LABEL[order.estado]}
                      </Badge>
                      <Badge tone={estadoPagoTone(order.estadoPago)}>
                        {ESTADO_PAGO_LABEL[order.estadoPago]}
                      </Badge>
                    </div>
                  </div>

                  <div className="order-card-meta">
                    <span>{formatFechaHora(order.creadoEn)}</span>
                    <span>
                      {order.itemsCount}{" "}
                      {order.itemsCount === 1 ? "producto" : "productos"}
                    </span>
                    <strong>{formatMoney(order.totalCentavos, order.moneda)}</strong>
                  </div>

                  <Link className="text-link" href={`/orders/${order.id}`}>
                    Ver detalle
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
