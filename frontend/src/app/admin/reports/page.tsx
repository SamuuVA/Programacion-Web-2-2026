import type { Metadata } from "next";
import { ErrorState } from "@/components/ui/error-state";
import { getSessionToken, requireAdmin } from "@/features/auth/session";
import { fetchAdminReports } from "@/features/admin/api";
import {
  CATEGORIA_LABEL,
  ESTADO_BODEGA_LABEL,
  ESTADO_COMPRADOR_LABEL,
  ESTADO_ENVIO_LABEL,
  ESTADO_PAGO_LABEL,
  ESTADO_PEDIDO_LABEL,
  ESTADO_PRODUCTO_LABEL,
  ESTADO_USUARIO_LABEL,
  ESTADO_VENDEDOR_LABEL,
  ROL_LABEL
} from "@/features/admin/format";
import type {
  CategoriaProducto,
  EstadoComprador,
  EstadoEnvio,
  EstadoPago,
  EstadoPedido,
  EstadoProductoVendedor,
  EstadoUsuario,
  EstadoVendedor,
  RolSistema
} from "@/features/admin/types";
import { toActionError } from "@/lib/action-state";

export const metadata: Metadata = {
  title: "Reportes"
};

const ROLES: readonly RolSistema[] = [
  "COMPRADOR",
  "VENDEDOR",
  "OPERADOR_LOGISTICO",
  "ADMINISTRADOR",
  "SUPERVISOR"
];

const ESTADOS_USUARIO: readonly EstadoUsuario[] = [
  "ACTIVO",
  "INACTIVO",
  "BLOQUEADO"
];

const ESTADOS_COMPRADOR: readonly EstadoComprador[] = ["HABILITADO", "RESTRINGIDO"];

const ESTADOS_VENDEDOR: readonly EstadoVendedor[] = [
  "EN_REVISION",
  "ACTIVO",
  "SUSPENDIDO",
  "INACTIVO"
];

const ESTADOS_PRODUCTO: readonly EstadoProductoVendedor[] = [
  "BORRADOR",
  "PUBLICADO",
  "SUSPENDIDO",
  "DESCONTINUADO"
];

const CATEGORIAS: readonly CategoriaProducto[] = [
  "ELECTRONICA",
  "ROPA",
  "HOGAR",
  "DIGITAL"
];

const ESTADOS_PEDIDO: readonly EstadoPedido[] = [
  "PENDIENTE_DE_PAGO",
  "PAGADO",
  "EN_PREPARACION",
  "DESPACHADO",
  "ENTREGADO",
  "CANCELADO",
  "CERRADO"
];

const ESTADOS_PAGO: readonly EstadoPago[] = [
  "PENDIENTE",
  "AUTORIZADO",
  "CAPTURADO",
  "RECHAZADO",
  "CANCELADO",
  "REEMBOLSO_PARCIAL",
  "REEMBOLSADO"
];

const ESTADOS_ENVIO: readonly EstadoEnvio[] = [
  "PREPARACION",
  "EMPACADO",
  "DESPACHADO",
  "EN_TRANSITO",
  "ENTREGADO",
  "FALLIDO",
  "DEVUELTO"
];

export default async function AdminReportsPage() {
  await requireAdmin("/admin/reports");
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  let reports: Awaited<ReturnType<typeof fetchAdminReports>>;
  try {
    reports = await fetchAdminReports(token);
  } catch (error) {
    const state = toActionError(error, "No pudimos cargar los reportes.");
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
          <p className="eyebrow">Administración</p>
          <h1>Reportes</h1>
          <p>
            Agregados directos sobre los datos persistidos. No se calculan
            porcentajes, metas, SLA, rankings, proyecciones ni comisiones, y no
            existen exportaciones PDF, Excel o CSV en esta fase.
          </p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container seller-detail-layout">
          <div className="seller-detail-main">
            <section className="checkout-block">
              <h2>Usuarios</h2>
              <ReportTable
                title="Por rol"
                rows={ROLES.map((rol) => ({
                  label: ROL_LABEL[rol] ?? rol,
                  value: reports.usuarios.porRol[rol]
                }))}
                total={reports.usuarios.total}
              />
              <ReportTable
                title="Por estado"
                rows={ESTADOS_USUARIO.map((estado) => ({
                  label: ESTADO_USUARIO_LABEL[estado] ?? estado,
                  value: reports.usuarios.porEstado[estado]
                }))}
                total={reports.usuarios.total}
              />
            </section>

            <section className="checkout-block">
              <h2>Pedidos</h2>
              <ReportTable
                title="Por estado"
                rows={ESTADOS_PEDIDO.map((estado) => ({
                  label: ESTADO_PEDIDO_LABEL[estado],
                  value: reports.pedidos.porEstado[estado]
                }))}
                total={reports.pedidos.total}
              />
            </section>

            <section className="checkout-block">
              <h2>Pagos</h2>
              <ReportTable
                title="Por estado"
                rows={ESTADOS_PAGO.map((estado) => ({
                  label: ESTADO_PAGO_LABEL[estado],
                  value: reports.pagos.porEstado[estado]
                }))}
                total={reports.pagos.total}
              />
            </section>

            <section className="checkout-block">
              <h2>Envíos</h2>
              <ReportTable
                title="Por estado"
                rows={ESTADOS_ENVIO.map((estado) => ({
                  label: ESTADO_ENVIO_LABEL[estado],
                  value: reports.envios.porEstado[estado]
                }))}
                total={reports.envios.total}
              />
            </section>

            <section className="checkout-block">
              <h2>Catálogo</h2>
              <ReportTable
                title="Por estado"
                rows={ESTADOS_PRODUCTO.map((estado) => ({
                  label: ESTADO_PRODUCTO_LABEL[estado],
                  value: reports.catalogo.porEstado[estado]
                }))}
                total={reports.catalogo.total}
              />
              <ReportTable
                title="Por categoría"
                rows={CATEGORIAS.map((categoria) => ({
                  label: CATEGORIA_LABEL[categoria],
                  value: reports.catalogo.porCategoria[categoria]
                }))}
                total={reports.catalogo.total}
              />
              <ReportTable
                title="Por tipo de entrega"
                rows={[
                  {
                    label: "Física",
                    value: reports.catalogo.porTipoEntrega.FISICA
                  },
                  {
                    label: "Digital",
                    value: reports.catalogo.porTipoEntrega.DIGITAL
                  }
                ]}
                total={reports.catalogo.total}
              />
            </section>
          </div>

          <aside className="seller-detail-aside">
            <section className="checkout-block">
              <h2>Inventario</h2>
              <ul className="order-items">
                <li>
                  <span>Posiciones</span>
                  <strong>{reports.inventario.posiciones}</strong>
                </li>
                <li>
                  <span>En mano</span>
                  <strong>{reports.inventario.onHand}</strong>
                </li>
                <li>
                  <span>Reservado</span>
                  <strong>{reports.inventario.reserved}</strong>
                </li>
                <li>
                  <span>No disponible</span>
                  <strong>{reports.inventario.unavailable}</strong>
                </li>
                <li>
                  <span>Disponible</span>
                  <strong>{reports.inventario.disponible}</strong>
                </li>
              </ul>
            </section>

            <section className="checkout-block">
              <h2>Compradores</h2>
              <ReportTable
                title="Por estado"
                rows={ESTADOS_COMPRADOR.map((estado) => ({
                  label: ESTADO_COMPRADOR_LABEL[estado],
                  value: reports.compradores.porEstado[estado]
                }))}
                total={reports.compradores.total}
              />
            </section>

            <section className="checkout-block">
              <h2>Vendedores</h2>
              <ReportTable
                title="Por estado"
                rows={ESTADOS_VENDEDOR.map((estado) => ({
                  label: ESTADO_VENDEDOR_LABEL[estado],
                  value: reports.vendedores.porEstado[estado]
                }))}
                total={reports.vendedores.total}
              />
            </section>

            <section className="checkout-block">
              <h2>Operadores logísticos</h2>
              <ReportTable
                title="Por estado"
                rows={[
                  {
                    label: "Activos",
                    value: reports.operadoresLogisticos.porEstado.ACTIVO
                  },
                  {
                    label: "Inactivos",
                    value: reports.operadoresLogisticos.porEstado.INACTIVO
                  }
                ]}
                total={reports.operadoresLogisticos.total}
              />
            </section>

            <section className="checkout-block">
              <h2>Almacenes</h2>
              <ReportTable
                title="Por estado"
                rows={[
                  { label: "Activos", value: reports.bodegas.porEstado.ACTIVA },
                  { label: "Inactivos", value: reports.bodegas.porEstado.INACTIVA }
                ]}
                total={reports.bodegas.total}
              />
              <ReportTable
                title="Por tipo"
                rows={[
                  {
                    label: "Marketplace",
                    value: reports.bodegas.porTipo.MARKETPLACE
                  },
                  { label: "Vendedor", value: reports.bodegas.porTipo.VENDEDOR }
                ]}
                total={reports.bodegas.total}
              />
            </section>

            <section className="checkout-block">
              <h2>Secciones no disponibles</h2>
              <p className="form-hint">
                Facturación, devoluciones y reembolsos no tienen tablas ni
                contratos en esta fase, por lo que no se muestran cifras. El
                catálogo formal de reportes, sus fórmulas, filtros y límites
                (`L-19`) tampoco están definidos. No se inventan indicadores ni
                exportaciones.
              </p>
            </section>
          </aside>
        </div>
      </section>
    </>
  );
}

function ReportTable({
  title,
  rows,
  total
}: {
  title: string;
  rows: readonly { readonly label: string; readonly value: number }[];
  total: number;
}) {
  return (
    <div className="report-block">
      <h3>{title}</h3>
      <table className="seller-table">
        <caption className="sr-only">{title}</caption>
        <thead>
          <tr>
            <th scope="col">Categoría</th>
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
          <tr>
            <td>Total</td>
            <td>
              <strong>{total}</strong>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
