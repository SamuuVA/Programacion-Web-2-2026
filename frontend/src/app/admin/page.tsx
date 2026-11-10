import type { Metadata } from "next";
import Link from "next/link";
import {
  BoxesIcon,
  PackageIcon,
  ShieldCheckIcon,
  StoreIcon,
  UserIcon
} from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";
import { getSessionToken, requireAdmin } from "@/features/auth/session";
import { fetchAdminDashboard } from "@/features/admin/api";
import {
  CATEGORIA_LABEL,
  ESTADO_COMPRADOR_LABEL,
  ESTADO_PAGO_LABEL,
  ESTADO_PEDIDO_LABEL,
  ESTADO_PRODUCTO_LABEL,
  ESTADO_USUARIO_LABEL,
  ESTADO_VENDEDOR_LABEL,
  ROL_LABEL,
  estadoCompradorTone,
  estadoPedidoTone,
  estadoUsuarioTone,
  estadoVendedorTone,
  formatFechaHora,
  formatMoney
} from "@/features/admin/format";
import type {
  CategoriaProducto,
  EstadoComprador,
  EstadoPago,
  EstadoPedido,
  EstadoProductoVendedor,
  EstadoUsuario,
  EstadoVendedor,
  RolSistema
} from "@/features/admin/types";
import { toActionError } from "@/lib/action-state";

export const metadata: Metadata = {
  title: "Resumen"
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

const CATEGORIAS: readonly CategoriaProducto[] = [
  "ELECTRONICA",
  "ROPA",
  "HOGAR",
  "DIGITAL"
];

const ESTADOS_COMPRADOR: readonly EstadoComprador[] = ["HABILITADO", "RESTRINGIDO"];

export default async function AdminDashboardPage() {
  await requireAdmin("/admin");
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  let dashboard: Awaited<ReturnType<typeof fetchAdminDashboard>>;
  try {
    dashboard = await fetchAdminDashboard(token);
  } catch (error) {
    const state = toActionError(error, "No pudimos cargar el resumen administrativo.");
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
          <p className="eyebrow">Espacio administrativo</p>
          <h1>Resumen general</h1>
          <p>
            Consulta de información real del sistema. El Administrador conserva
            las altas de vendedores y operadores logísticos; las demás áreas son
            de lectura y las escrituras no definidas son rechazadas por el
            backend con `405 METODO_NO_PERMITIDO`.
          </p>
          <div className="seller-head-meta">
            <ShieldCheckIcon width={18} height={18} />
            <span>Autorización verificada por el backend en cada solicitud.</span>
          </div>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <div className="seller-stats">
            <article className="seller-stat">
              <span className="seller-stat-label">Usuarios</span>
              <strong>{dashboard.usuarios.total}</strong>
              <span className="seller-stat-hint">cuentas registradas</span>
            </article>
            <article className="seller-stat">
              <span className="seller-stat-label">Vendedores</span>
              <strong>{dashboard.vendedores.total}</strong>
              <span className="seller-stat-hint">
                {dashboard.vendedores.porEstado.ACTIVO} activos
              </span>
            </article>
            <article className="seller-stat">
              <span className="seller-stat-label">Compradores</span>
              <strong>{dashboard.compradores.total}</strong>
              <span className="seller-stat-hint">
                {dashboard.compradores.porEstado.HABILITADO} habilitados
              </span>
            </article>
            <article className="seller-stat">
              <span className="seller-stat-label">Pedidos</span>
              <strong>{dashboard.pedidos.total}</strong>
              <span className="seller-stat-hint">registrados en el sistema</span>
            </article>
            <article className="seller-stat">
              <span className="seller-stat-label">Productos</span>
              <strong>{dashboard.catalogo.total}</strong>
              <span className="seller-stat-hint">
                {dashboard.catalogo.porEstado.PUBLICADO} publicados
              </span>
            </article>
            <article className="seller-stat">
              <span className="seller-stat-label">Almacenes</span>
              <strong>{dashboard.bodegas.total}</strong>
              <span className="seller-stat-hint">
                {dashboard.bodegas.porEstado.ACTIVA} activos
              </span>
            </article>
            <article className="seller-stat">
              <span className="seller-stat-label">Unidades disponibles</span>
              <strong>{dashboard.inventario.disponible}</strong>
              <span className="seller-stat-hint">
                suma de `on_hand - reserved - unavailable`
              </span>
            </article>
            <article className="seller-stat">
              <span className="seller-stat-label">Pagos</span>
              <strong>{dashboard.pagos.total}</strong>
              <span className="seller-stat-hint">registros de pago</span>
            </article>
            <article className="seller-stat">
              <span className="seller-stat-label">Envíos</span>
              <strong>{dashboard.envios.total}</strong>
              <span className="seller-stat-hint">preparados y registrados</span>
            </article>
          </div>

          <div className="seller-quick-links">
            <Link className="btn btn-primary" href="/admin/sellers">
              <StoreIcon width={18} height={18} /> Vendedores
            </Link>
            <Link className="btn btn-secondary" href="/admin/orders">
              <PackageIcon width={18} height={18} /> Pedidos
            </Link>
            <Link className="btn btn-secondary" href="/admin/products">
              <StoreIcon width={18} height={18} /> Catálogo
            </Link>
            <Link className="btn btn-ghost" href="/admin/inventory">
              <BoxesIcon width={18} height={18} /> Inventario
            </Link>
            <Link className="btn btn-ghost" href="/admin/users">
              <UserIcon width={18} height={18} /> Usuarios
            </Link>
          </div>
        </div>
      </section>

      <section className="section-tight">
        <div className="container seller-detail-layout">
          <div className="seller-detail-main">
            <section className="checkout-block">
              <h2>Usuarios por rol</h2>
              <CountTable
                rows={ROLES.map((rol) => ({
                  label: ROL_LABEL[rol] ?? rol,
                  value: dashboard.usuarios.porRol[rol]
                }))}
                total={dashboard.usuarios.total}
              />
            </section>

            <section className="checkout-block">
              <h2>Usuarios por estado</h2>
              <CountTable
                rows={ESTADOS_USUARIO.map((estado) => ({
                  label: ESTADO_USUARIO_LABEL[estado] ?? estado,
                  value: dashboard.usuarios.porEstado[estado]
                }))}
                total={dashboard.usuarios.total}
              />
            </section>

            <section className="checkout-block">
              <h2>Pedidos por estado</h2>
              <CountTable
                rows={ESTADOS_PEDIDO.map((estado) => ({
                  label: ESTADO_PEDIDO_LABEL[estado],
                  value: dashboard.pedidos.porEstado[estado]
                }))}
                total={dashboard.pedidos.total}
              />
            </section>

            <section className="checkout-block">
              <h2>Pagos por estado</h2>
              <CountTable
                rows={ESTADOS_PAGO.map((estado) => ({
                  label: ESTADO_PAGO_LABEL[estado],
                  value: dashboard.pagos.porEstado[estado]
                }))}
                total={dashboard.pagos.total}
              />
            </section>

            <section className="checkout-block">
              <h2>Productos por estado</h2>
              <CountTable
                rows={ESTADOS_PRODUCTO.map((estado) => ({
                  label: ESTADO_PRODUCTO_LABEL[estado],
                  value: dashboard.catalogo.porEstado[estado]
                }))}
                total={dashboard.catalogo.total}
              />
            </section>
          </div>

          <aside className="seller-detail-aside">
            <section className="checkout-block">
              <h2>Inventario</h2>
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
              <h2>Catálogo por categoría</h2>
              <CountTable
                rows={CATEGORIAS.map((categoria) => ({
                  label: CATEGORIA_LABEL[categoria],
                  value: dashboard.catalogo.porCategoria[categoria]
                }))}
                total={dashboard.catalogo.total}
              />
            </section>

            <section className="checkout-block">
              <h2>Compradores</h2>
              <CountTable
                rows={ESTADOS_COMPRADOR.map((estado) => ({
                  label: ESTADO_COMPRADOR_LABEL[estado],
                  value: dashboard.compradores.porEstado[estado]
                }))}
                total={dashboard.compradores.total}
              />
            </section>

            <section className="checkout-block">
              <h2>Almacenes</h2>
              <CountTable
                rows={[
                  { label: "Activos", value: dashboard.bodegas.porEstado.ACTIVA },
                  { label: "Inactivos", value: dashboard.bodegas.porEstado.INACTIVA }
                ]}
                total={dashboard.bodegas.total}
              />
              <p className="form-hint">
                {dashboard.bodegas.porTipo.MARKETPLACE} de marketplace ·{" "}
                {dashboard.bodegas.porTipo.VENDEDOR} de vendedores.
              </p>
            </section>

            <section className="checkout-block">
              <h2>Vendedores por estado</h2>
              <CountTable
                rows={ESTADOS_VENDEDOR.map((estado) => ({
                  label: ESTADO_VENDEDOR_LABEL[estado],
                  value: dashboard.vendedores.porEstado[estado]
                }))}
                total={dashboard.vendedores.total}
              />
            </section>

            <section className="checkout-block">
              <h2>Alcance de esta fase</h2>
              <p className="form-hint">
                No se muestran porcentajes, metas, SLA, rankings, proyecciones ni
                comisiones porque no están definidos. Tampoco existen tablas de
                facturación, devoluciones o reembolsos que puedan consultarse.
              </p>
            </section>
          </aside>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <h2>Actividad reciente</h2>
          <div className="seller-detail-layout">
            <div className="seller-detail-main">
              <section className="checkout-block">
                <h2>Últimos usuarios</h2>
                <RecentUsers users={dashboard.recientes.usuarios} />
              </section>

              <section className="checkout-block">
                <h2>Últimos pedidos</h2>
                {dashboard.recientes.pedidos.length === 0 ? (
                  <p className="form-hint">Todavía no hay pedidos registrados.</p>
                ) : (
                  <div className="order-list">
                    {dashboard.recientes.pedidos.map((pedido) => (
                      <article className="order-card" key={pedido.id}>
                        <div className="order-card-head">
                          <div>
                            <p className="order-card-number">
                              <Link href={`/admin/orders/${pedido.id}`}>
                                {pedido.numero}
                              </Link>
                            </p>
                            <p className="order-card-seller">
                              {pedido.compradorNombre} · {pedido.vendedorNombre} ·{" "}
                              {formatFechaHora(pedido.creadoEn)}
                            </p>
                          </div>
                          <Badge tone={estadoPedidoTone(pedido.estado)}>
                            {ESTADO_PEDIDO_LABEL[pedido.estado]}
                          </Badge>
                        </div>
                        <div className="order-card-meta">
                          <span>
                            {pedido.itemsCount}{" "}
                            {pedido.itemsCount === 1 ? "artículo" : "artículos"}
                          </span>
                          <strong>
                            {formatMoney(pedido.totalCentavos, pedido.moneda)}
                          </strong>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <aside className="seller-detail-aside">
              <section className="checkout-block">
                <h2>Últimos compradores</h2>
                {dashboard.recientes.compradores.length === 0 ? (
                  <p className="form-hint">Todavía no hay compradores registrados.</p>
                ) : (
                  <ul className="order-items">
                    {dashboard.recientes.compradores.map((comprador) => (
                      <li key={comprador.id}>
                        <div>
                          <strong>{comprador.nombreCompleto}</strong>
                          <span>
                            {comprador.correoElectronico} ·{" "}
                            {comprador.pedidosCount}{" "}
                            {comprador.pedidosCount === 1 ? "pedido" : "pedidos"}
                          </span>
                        </div>
                        <Badge tone={estadoCompradorTone(comprador.estadoComercial)}>
                          {ESTADO_COMPRADOR_LABEL[comprador.estadoComercial]}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="checkout-block">
                <h2>Últimos vendedores</h2>
                {dashboard.recientes.vendedores.length === 0 ? (
                  <p className="form-hint">Todavía no hay vendedores registrados.</p>
                ) : (
                  <ul className="order-items">
                    {dashboard.recientes.vendedores.map((vendedor) => (
                      <li key={vendedor.id}>
                        <div>
                          <strong>{vendedor.nombreComercial}</strong>
                          <span>
                            {vendedor.productosCount}{" "}
                            {vendedor.productosCount === 1 ? "producto" : "productos"}{" "}
                            · {vendedor.bodegasCount}{" "}
                            {vendedor.bodegasCount === 1 ? "bodega" : "bodegas"}
                          </span>
                        </div>
                        <Badge tone={estadoVendedorTone(vendedor.estado)}>
                          {ESTADO_VENDEDOR_LABEL[vendedor.estado]}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </aside>
          </div>
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

function RecentUsers({
  users
}: {
  users: readonly {
    readonly id: string;
    readonly nombreCompleto: string;
    readonly correoElectronico: string;
    readonly rol: RolSistema;
    readonly estado: EstadoUsuario;
    readonly creadoEn: string;
  }[];
}) {
  if (users.length === 0) {
    return <p className="form-hint">Todavía no hay usuarios registrados.</p>;
  }

  return (
    <ul className="order-items">
      {users.map((user) => (
        <li key={user.id}>
          <div>
            <strong>
              <Link href={`/admin/users/${user.id}`}>{user.nombreCompleto}</Link>
            </strong>
            <span>
              {user.correoElectronico} · {ROL_LABEL[user.rol] ?? user.rol} ·{" "}
              {formatFechaHora(user.creadoEn)}
            </span>
          </div>
          <Badge tone={estadoUsuarioTone(user.estado)}>
            {ESTADO_USUARIO_LABEL[user.estado] ?? user.estado}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
