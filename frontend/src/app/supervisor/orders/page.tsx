import type { Metadata } from "next";
import Link from "next/link";
import { PackageIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Pagination } from "@/components/ui/pagination";
import { getSessionToken, requireSupervisor } from "@/features/auth/session";
import { fetchSupervisorOrders } from "@/features/supervisor/api";
import {
  ESTADO_PAGO_LABEL,
  ESTADO_PEDIDO_LABEL,
  estadoPagoTone,
  estadoPedidoTone,
  formatFechaHora,
  formatMoney
} from "@/features/supervisor/format";
import type { EstadoPedido } from "@/features/supervisor/types";
import { toActionError } from "@/lib/action-state";

export const metadata: Metadata = {
  title: "Pedidos"
};

const PAGE_SIZE = 20;

const FILTROS: readonly { value: "" | EstadoPedido; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "PENDIENTE_DE_PAGO", label: "Pendientes de pago" },
  { value: "PAGADO", label: "Pagados" },
  { value: "EN_PREPARACION", label: "En preparación" },
  { value: "DESPACHADO", label: "Despachados" },
  { value: "ENTREGADO", label: "Entregados" },
  { value: "CANCELADO", label: "Cancelados" },
  { value: "CERRADO", label: "Cerrados" }
];

type OrdersPageProps = {
  searchParams: Promise<{
    estado?: string | string[] | undefined;
    page?: string | string[] | undefined;
  }>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SupervisorOrdersPage({
  searchParams
}: OrdersPageProps) {
  await requireSupervisor("/supervisor/orders");
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  const params = await searchParams;
  const rawEstado = first(params.estado);
  const estado = FILTROS.some((filtro) => filtro.value === rawEstado)
    ? (rawEstado as EstadoPedido | "")
    : "";
  const rawPage = Number.parseInt(first(params.page) ?? "1", 10);
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;

  let result: Awaited<ReturnType<typeof fetchSupervisorOrders>>;
  try {
    result = await fetchSupervisorOrders(token, {
      ...(estado ? { estado } : {}),
      page,
      pageSize: PAGE_SIZE
    });
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

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <>
      <section className="page-head">
        <div className="container">
          <p className="eyebrow">Supervisión</p>
          <h1>Pedidos</h1>
          <p>
            Consulta de todos los pedidos registrados. No se muestra el nombre,
            teléfono ni la dirección del comprador. Esta pantalla no permite
            cambiar estados, importes ni operaciones logísticas.
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
                    ? `/supervisor/orders?estado=${filtro.value}`
                    : "/supervisor/orders"
                }
              >
                {filtro.label}
              </Link>
            ))}
          </div>

          <p className="form-hint">
            {result.total} {result.total === 1 ? "pedido" : "pedidos"} en total.
          </p>

          {result.items.length === 0 ? (
            <EmptyState
              icon={<PackageIcon width={24} height={24} />}
              title="No hay pedidos para este filtro"
              description="Cuando existan pedidos en el estado seleccionado, aparecerán aquí."
            />
          ) : (
            <div className="order-list">
              {result.items.map((order) => (
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
                    <span>Vendedor {order.vendedorNombre}</span>
                    <strong>{formatMoney(order.totalCentavos, order.moneda)}</strong>
                  </div>
                  <Link className="text-link" href={`/supervisor/orders/${order.id}`}>
                    Ver detalle
                  </Link>
                </article>
              ))}
            </div>
          )}

          <Pagination
            page={result.page}
            totalPages={totalPages}
            basePath="/supervisor/orders"
            query={{ estado: estado || undefined }}
          />
        </div>
      </section>
    </>
  );
}
