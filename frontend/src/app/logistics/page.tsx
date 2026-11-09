import type { Metadata } from "next";
import Link from "next/link";
import { BoxesIcon, PackageIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { getSessionToken, requireLogistics } from "@/features/auth/session";
import {
  fetchLogisticsOrders,
  fetchLogisticsProfile,
  fetchLogisticsSummary
} from "@/features/logistics/api";
import {
  ESTADO_OPERADOR_LABEL,
  estadoOperadorTone,
  formatFechaHora,
  formatMoney
} from "@/features/logistics/format";
import {
  ESTADO_PAGO_LABEL,
  ESTADO_PEDIDO_LABEL,
  estadoPagoTone,
  estadoPedidoTone
} from "@/features/orders/format";
import { toActionError } from "@/lib/action-state";

export const metadata: Metadata = {
  title: "Resumen"
};

export default async function LogisticsDashboardPage() {
  await requireLogistics("/logistics");
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  let data: Awaited<ReturnType<typeof loadDashboard>>;
  try {
    data = await loadDashboard(token);
  } catch (error) {
    const state = toActionError(
      error,
      "No pudimos cargar el resumen logístico."
    );
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

  const { profile, summary, orders } = data;
  const recentOrders = orders.slice(0, 5);

  return (
    <>
      <section className="page-head">
        <div className="container">
          <p className="eyebrow">Espacio del operador logístico</p>
          <h1>{profile.nombreOperador}</h1>
          <div className="seller-head-meta">
            <Badge tone={estadoOperadorTone(profile.estado)}>
              {ESTADO_OPERADOR_LABEL[profile.estado]}
            </Badge>
            <span>{profile.correoElectronico}</span>
          </div>
          <p>
            Prepara, despacha y registra entregas de los pedidos con reservas en
            tus bodegas asignadas. Las operaciones se validan en el backend y no
            modifican pagos, productos ni usuarios.
          </p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <div className="seller-stats">
            <article className="seller-stat">
              <span className="seller-stat-label">Pedidos en preparación</span>
              <strong>{summary.pedidosEnPreparacion}</strong>
              <span className="seller-stat-hint">con reservas en tu ámbito</span>
            </article>
            <article className="seller-stat">
              <span className="seller-stat-label">Envíos por preparar</span>
              <strong>{summary.enviosPorPreparar}</strong>
              <span className="seller-stat-hint">en preparación o empacados</span>
            </article>
            <article className="seller-stat">
              <span className="seller-stat-label">Envíos en tránsito</span>
              <strong>{summary.enviosDespachados}</strong>
              <span className="seller-stat-hint">despachados o en tránsito</span>
            </article>
            <article className="seller-stat">
              <span className="seller-stat-label">Bodegas asignadas</span>
              <strong>{summary.bodegasAsignadas}</strong>
              <span className="seller-stat-hint">
                {summary.enviosEntregados} envíos entregados
              </span>
            </article>
          </div>

          {summary.enviosConFallo > 0 ? (
            <p className="form-error" role="status">
              {summary.enviosConFallo}{" "}
              {summary.enviosConFallo === 1 ? "envío requiere" : "envíos requieren"}{" "}
              atención por fallo o devolución.
            </p>
          ) : null}

          <div className="seller-quick-links">
            <Link className="btn btn-primary" href="/logistics/orders">
              <PackageIcon width={18} height={18} /> Ver pedidos
            </Link>
            <Link className="btn btn-secondary" href="/logistics/warehouses">
              <BoxesIcon width={18} height={18} /> Mis bodegas
            </Link>
            <Link className="btn btn-ghost" href="/logistics/inventory">
              Consultar inventario
            </Link>
          </div>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <div className="section-head">
            <div>
              <h2 className="section-title">Pedidos recientes</h2>
              <p className="section-subtitle">
                Solo pedidos con reservas en tus bodegas asignadas.
              </p>
            </div>
            <Link className="text-link" href="/logistics/orders">
              Ver todos
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <EmptyState
              icon={<PackageIcon width={24} height={24} />}
              title="Todavía no hay pedidos en tu ámbito"
              description="Cuando un comprador pague un pedido con productos de tus bodegas, aparecerá aquí para prepararlo."
            />
          ) : (
            <div className="order-list">
              {recentOrders.map((order) => (
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
                    <span>{order.enviosCount} envíos</span>
                    <span>{order.reservasActivas} reservas activas</span>
                    <strong>{formatMoney(order.totalCentavos, order.moneda)}</strong>
                  </div>
                  <Link className="text-link" href={`/logistics/orders/${order.id}`}>
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

async function loadDashboard(token: string) {
  const [profile, summary, orders] = await Promise.all([
    fetchLogisticsProfile(token),
    fetchLogisticsSummary(token),
    fetchLogisticsOrders(token)
  ]);
  return { profile, summary, orders };
}
