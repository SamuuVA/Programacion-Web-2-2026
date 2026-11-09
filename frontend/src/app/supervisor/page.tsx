import type { Metadata } from "next";
import Link from "next/link";
import { BoxesIcon, PackageIcon, ShieldCheckIcon, StoreIcon } from "@/components/icons";
import { ErrorState } from "@/components/ui/error-state";
import { getSessionToken, requireSupervisor } from "@/features/auth/session";
import { fetchSupervisorDashboard } from "@/features/supervisor/api";
import {
  ESTADO_ENVIO_LABEL,
  ESTADO_PAGO_LABEL,
  ESTADO_PEDIDO_LABEL,
  ESTADO_PRODUCTO_LABEL,
  ESTADO_VENDEDOR_LABEL
} from "@/features/supervisor/format";
import type {
  EstadoEnvio,
  EstadoPago,
  EstadoPedido,
  EstadoProductoSupervisor,
  EstadoVendedor
} from "@/features/supervisor/types";
import { toActionError } from "@/lib/action-state";

export const metadata: Metadata = {
  title: "Resumen"
};

const PEDIDOS: readonly EstadoPedido[] = [
  "PENDIENTE_DE_PAGO",
  "PAGADO",
  "EN_PREPARACION",
  "DESPACHADO",
  "ENTREGADO",
  "CANCELADO",
  "CERRADO"
];

const PAGOS: readonly EstadoPago[] = [
  "PENDIENTE",
  "AUTORIZADO",
  "CAPTURADO",
  "RECHAZADO",
  "CANCELADO",
  "REEMBOLSO_PARCIAL",
  "REEMBOLSADO"
];

const PRODUCTOS: readonly EstadoProductoSupervisor[] = [
  "BORRADOR",
  "PUBLICADO",
  "SUSPENDIDO",
  "DESCONTINUADO"
];

const ENVIOS: readonly EstadoEnvio[] = [
  "PREPARACION",
  "EMPACADO",
  "DESPACHADO",
  "EN_TRANSITO",
  "ENTREGADO",
  "FALLIDO",
  "DEVUELTO"
];

const VENDEDORES: readonly EstadoVendedor[] = [
  "EN_REVISION",
  "ACTIVO",
  "SUSPENDIDO",
  "INACTIVO"
];

export default async function SupervisorDashboardPage() {
  await requireSupervisor("/supervisor");
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  let dashboard: Awaited<ReturnType<typeof fetchSupervisorDashboard>>;
  try {
    dashboard = await fetchSupervisorDashboard(token);
  } catch (error) {
    const state = toActionError(
      error,
      "No pudimos cargar el resumen de supervisión."
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

  return (
    <>
      <section className="page-head">
        <div className="container">
          <p className="eyebrow">Espacio de supervisión</p>
          <h1>Resumen operativo</h1>
          <p>
            Consulta de solo lectura sobre pedidos, pagos, productos, inventario,
            almacenes, envíos, vendedores y operadores logísticos. El perfil de
            supervisión no modifica precios, stock, pedidos, pagos, roles ni
            operaciones logísticas.
          </p>
          <div className="seller-head-meta">
            <ShieldCheckIcon width={18} height={18} />
            <span>Permisos de consulta verificados por el backend en cada solicitud.</span>
          </div>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <div className="seller-stats">
            <article className="seller-stat">
              <span className="seller-stat-label">Pedidos</span>
              <strong>{dashboard.pedidosTotal}</strong>
              <span className="seller-stat-hint">registrados en el sistema</span>
            </article>
            <article className="seller-stat">
              <span className="seller-stat-label">Envíos</span>
              <strong>{dashboard.enviosTotal}</strong>
              <span className="seller-stat-hint">preparados y registrados</span>
            </article>
            <article className="seller-stat">
              <span className="seller-stat-label">Productos</span>
              <strong>{dashboard.productosTotal}</strong>
              <span className="seller-stat-hint">
                {dashboard.productosPorEstado.PUBLICADO} publicados
              </span>
            </article>
            <article className="seller-stat">
              <span className="seller-stat-label">Unidades disponibles</span>
              <strong>{dashboard.inventario.disponible}</strong>
              <span className="seller-stat-hint">
                suma de `on_hand - reserved - unavailable`
              </span>
            </article>
          </div>

          <div className="seller-quick-links">
            <Link className="btn btn-primary" href="/supervisor/orders">
              <PackageIcon width={18} height={18} /> Consultar pedidos
            </Link>
            <Link className="btn btn-secondary" href="/supervisor/products">
              <StoreIcon width={18} height={18} /> Consultar productos
            </Link>
            <Link className="btn btn-ghost" href="/supervisor/inventory">
              <BoxesIcon width={18} height={18} /> Consultar inventario
            </Link>
          </div>
        </div>
      </section>

      <section className="section-tight">
        <div className="container seller-detail-layout">
          <div className="seller-detail-main">
            <section className="checkout-block">
              <h2>Pedidos por estado</h2>
              <CountTable
                rows={PEDIDOS.map((estado) => ({
                  label: ESTADO_PEDIDO_LABEL[estado],
                  value: dashboard.pedidosPorEstado[estado]
                }))}
              />
            </section>

            <section className="checkout-block">
              <h2>Pagos por estado</h2>
              <CountTable
                rows={PAGOS.map((estado) => ({
                  label: ESTADO_PAGO_LABEL[estado],
                  value: dashboard.pagosPorEstado[estado]
                }))}
              />
            </section>

            <section className="checkout-block">
              <h2>Envíos por estado</h2>
              <CountTable
                rows={ENVIOS.map((estado) => ({
                  label: ESTADO_ENVIO_LABEL[estado],
                  value: dashboard.enviosPorEstado[estado]
                }))}
              />
            </section>

            <section className="checkout-block">
              <h2>Productos por estado</h2>
              <CountTable
                rows={PRODUCTOS.map((estado) => ({
                  label: ESTADO_PRODUCTO_LABEL[estado],
                  value: dashboard.productosPorEstado[estado]
                }))}
              />
            </section>
          </div>

          <aside className="seller-detail-aside">
            <section className="checkout-block">
              <h2>Inventario</h2>
              <p className="form-hint">
                Posiciones registradas por producto y bodega. El disponible usa la
                fórmula definida en `INV-03`.
              </p>
              <ul className="order-items">
                <li>
                  <span>Posiciones</span>
                  <strong>{dashboard.inventario.posiciones}</strong>
                </li>
                <li>
                  <span>En mano</span>
                  <strong>{dashboard.inventario.onHand}</strong>
                </li>
                <li>
                  <span>Reservado</span>
                  <strong>{dashboard.inventario.reserved}</strong>
                </li>
                <li>
                  <span>No disponible</span>
                  <strong>{dashboard.inventario.unavailable}</strong>
                </li>
                <li>
                  <span>Disponible</span>
                  <strong>{dashboard.inventario.disponible}</strong>
                </li>
              </ul>
            </section>

            <section className="checkout-block">
              <h2>Almacenes</h2>
              <CountTable
                rows={[
                  { label: "Activos", value: dashboard.almacenesPorEstado.ACTIVA },
                  { label: "Inactivos", value: dashboard.almacenesPorEstado.INACTIVA }
                ]}
                total={dashboard.almacenesTotal}
              />
            </section>

            <section className="checkout-block">
              <h2>Vendedores</h2>
              <CountTable
                rows={VENDEDORES.map((estado) => ({
                  label: ESTADO_VENDEDOR_LABEL[estado],
                  value: dashboard.vendedoresPorEstado[estado]
                }))}
                total={dashboard.vendedoresTotal}
              />
            </section>

            <section className="checkout-block">
              <h2>Operadores logísticos</h2>
              <CountTable
                rows={[
                  {
                    label: "Activos",
                    value: dashboard.operadoresLogisticosPorEstado.ACTIVO
                  },
                  {
                    label: "Inactivos",
                    value: dashboard.operadoresLogisticosPorEstado.INACTIVO
                  }
                ]}
                total={dashboard.operadoresLogisticosTotal}
              />
            </section>

            <section className="checkout-block">
              <h2>Compradores</h2>
              <CountTable
                rows={[
                  {
                    label: "Habilitados",
                    value: dashboard.compradoresPorEstado.HABILITADO
                  },
                  {
                    label: "Restringidos",
                    value: dashboard.compradoresPorEstado.RESTRINGIDO
                  }
                ]}
                total={dashboard.compradoresTotal}
              />
            </section>

            <section className="checkout-block">
              <h2>Reportes administrativos</h2>
              <p className="form-hint">
                No disponibles. El catálogo, las fórmulas, los filtros y los
                límites de reportes (`L-19`) todavía no están definidos; esta
                pantalla no inventa indicadores ni exportaciones.
              </p>
            </section>
          </aside>
        </div>
      </section>
    </>
  );
}

function CountTable({
  rows,
  total
}: {
  rows: readonly { readonly label: string; readonly value: number }[];
  total?: number;
}) {
  return (
    <table className="seller-table">
      <caption className="sr-only">Conteos por estado definido</caption>
      <thead>
        <tr>
          <th scope="col">Estado</th>
          <th scope="col">Conteo</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label}>
            <td>{row.label}</td>
            <td>
              <strong>{row.value}</strong>
            </td>
          </tr>
        ))}
        {total !== undefined ? (
          <tr>
            <td>Total</td>
            <td>
              <strong>{total}</strong>
            </td>
          </tr>
        ) : null}
      </tbody>
    </table>
  );
}
