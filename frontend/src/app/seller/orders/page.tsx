import type { Metadata } from "next";
import Link from "next/link";
import { PackageIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { getSessionToken, requireSeller } from "@/features/auth/session";
import { fetchSellerOrders } from "@/features/seller/api";
import { formatFechaHora, formatMoney } from "@/features/seller/format";
import {
  ESTADO_PAGO_LABEL,
  ESTADO_PEDIDO_LABEL,
  estadoPagoTone,
  estadoPedidoTone
} from "@/features/orders/format";
import { toActionError } from "@/lib/action-state";

export const metadata: Metadata = {
  title: "Pedidos con mis productos"
};

export default async function SellerOrdersPage() {
  await requireSeller("/seller/orders");
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  let orders: Awaited<ReturnType<typeof fetchSellerOrders>>;
  try {
    orders = await fetchSellerOrders(token);
  } catch (error) {
    const state = toActionError(error, "No pudimos cargar los pedidos.");
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

  return (
    <>
      <section className="page-head">
        <div className="container">
          <p className="eyebrow">Ventas</p>
          <h1>Pedidos con mis productos</h1>
          <p>
            Solo se muestran pedidos de tu ámbito. La preparación, el despacho y
            el pago los gestionan otros roles; aquí la consulta es de solo
            lectura.
          </p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          {orders.length === 0 ? (
            <EmptyState
              icon={<PackageIcon width={24} height={24} />}
              title="Todavía no hay pedidos"
              description="Cuando un comprador incluya tus productos en una compra, el pedido aparecerá aquí."
            />
          ) : (
            <div className="order-list">
              {orders.map((order) => (
                <article className="order-card" key={order.id}>
                  <div className="order-card-head">
                    <div>
                      <p className="order-card-number">{order.numero}</p>
                      <p className="order-card-seller">
                        {formatFechaHora(order.creadoEn)}
                      </p>
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
                    <span>
                      {order.itemsCount}{" "}
                      {order.itemsCount === 1 ? "producto" : "productos"}
                    </span>
                    <strong>{formatMoney(order.totalCentavos, order.moneda)}</strong>
                  </div>
                  <Link className="text-link" href={`/seller/orders/${order.id}`}>
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
