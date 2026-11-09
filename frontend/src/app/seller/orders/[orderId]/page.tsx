import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRightIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";
import { getSessionToken, requireSeller } from "@/features/auth/session";
import { fetchSellerOrder } from "@/features/seller/api";
import { formatFechaHora, formatMoney } from "@/features/seller/format";
import {
  ESTADO_PAGO_LABEL,
  ESTADO_PEDIDO_LABEL,
  estadoPagoTone,
  estadoPedidoTone
} from "@/features/orders/format";
import { isOrderId } from "@/features/orders/ids";
import { toActionError } from "@/lib/action-state";

type SellerOrderPageProps = {
  params: Promise<{ orderId: string }>;
};

export async function generateMetadata({
  params
}: SellerOrderPageProps): Promise<Metadata> {
  const { orderId } = await params;
  if (!isOrderId(orderId)) {
    notFound();
  }
  return { title: "Detalle del pedido" };
}

export default async function SellerOrderDetailPage({
  params
}: SellerOrderPageProps) {
  const { orderId } = await params;
  if (!isOrderId(orderId)) {
    notFound();
  }

  await requireSeller(`/seller/orders/${orderId}`);
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  let order: Awaited<ReturnType<typeof fetchSellerOrder>>;
  try {
    order = await fetchSellerOrder(token, orderId);
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
            <Link href="/seller/orders">Pedidos</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{order.numero}</span>
          </nav>
          <p className="eyebrow">Pedido en tu ámbito</p>
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
                <span>Total del pedido</span>
                <strong>{formatMoney(order.totalCentavos, order.moneda)}</strong>
              </div>
            </section>
          </div>

          <aside className="seller-detail-aside">
            <section className="checkout-block">
              <h2>Alcance de solo lectura</h2>
              <p className="form-hint">
                El vendedor no confirma ni rechaza pagos, no reembolsa y no
                prepara, empaca ni despacha pedidos. Esas acciones pertenecen a
                los roles de pago y logística.
              </p>
            </section>

            <Link className="text-link" href="/seller/orders">
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
