import type { Metadata } from "next";
import Link from "next/link";
import { PackageIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { getSessionToken, requireLogistics } from "@/features/auth/session";
import { fetchLogisticsOrders } from "@/features/logistics/api";
import { formatFechaHora, formatMoney } from "@/features/logistics/format";
import {
  ESTADO_PAGO_LABEL,
  ESTADO_PEDIDO_LABEL,
  estadoPagoTone,
  estadoPedidoTone
} from "@/features/orders/format";
import { toActionError } from "@/lib/action-state";

export const metadata: Metadata = {
  title: "Pedidos"
};

const FILTROS = [
  { value: "", label: "Todos" },
  { value: "PAGADO", label: "Pagados" },
  { value: "EN_PREPARACION", label: "En preparación" },
  { value: "DESPACHADO", label: "Despachados" },
  { value: "ENTREGADO", label: "Entregados" }
] as const;

type OrdersPageProps = {
  searchParams: Promise<{ estado?: string | string[] | undefined }>;
};

export default async function LogisticsOrdersPage({
  searchParams
}: OrdersPageProps) {
  await requireLogistics("/logistics/orders");
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  const params = await searchParams;
  const rawEstado = Array.isArray(params.estado)
    ? params.estado[0]
    : params.estado;
  const estado = FILTROS.some((filtro) => filtro.value === rawEstado)
    ? rawEstado
    : "";

  let orders: Awaited<ReturnType<typeof fetchLogisticsOrders>>;
  try {
    orders = await fetchLogisticsOrders(token, estado || undefined);
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
          <p className="eyebrow">Operación</p>
          <h1>Pedidos en tu ámbito</h1>
          <p>
            Se muestran pedidos con reservas en tus bodegas asignadas. Desde el
            detalle puedes preparar, despachar y registrar la entrega según el
            estado real del pedido.
          </p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <div className="seller-quick-links" aria-label="Filtrar pedidos">
            {FILTROS.map((filtro) => (
              <Link
                key={filtro.value || "todos"}
                className={
                  estado === filtro.value ? "btn btn-primary btn-sm" : "btn btn-ghost btn-sm"
                }
                href={
                  filtro.value
                    ? `/logistics/orders?estado=${filtro.value}`
                    : "/logistics/orders"
                }
              >
                {filtro.label}
              </Link>
            ))}
          </div>

          {orders.length === 0 ? (
            <EmptyState
              icon={<PackageIcon width={24} height={24} />}
              title="No hay pedidos para este filtro"
              description="Cuando existan pedidos pagados con reservas en tus bodegas, aparecerán aquí."
            />
          ) : (
            <div className="order-list">
              {orders.map((order) => (
                <article className="order-card" key={order.id}>
                  <div className="order-card-head">
                    <div>
                      <p className="order-card-number">{order.numero}</p>
                      <p className="order-card-seller">
                        {order.vendedorNombre} · {formatFechaHora(order.creadoEn)}
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
                    <span>{order.bodegasCount} bodegas</span>
                    <span>{order.enviosCount} envíos</span>
                    <span>{order.reservasActivas} reservas activas</span>
                    <strong>{formatMoney(order.totalCentavos, order.moneda)}</strong>
                  </div>
                  <Link className="text-link" href={`/logistics/orders/${order.id}`}>
                    Ver detalle y operar
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
