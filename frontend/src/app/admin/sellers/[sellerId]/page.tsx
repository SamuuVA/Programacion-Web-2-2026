import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRightIcon, StoreIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";
import { getSessionToken, requireAdmin } from "@/features/auth/session";
import { fetchAdminSeller } from "@/features/admin/api";
import {
  CATEGORIA_LABEL,
  ESTADO_BODEGA_LABEL,
  ESTADO_PRODUCTO_LABEL,
  ESTADO_USUARIO_LABEL,
  ESTADO_VENDEDOR_LABEL,
  TIPO_BODEGA_LABEL,
  estadoBodegaTone,
  estadoProductoTone,
  estadoUsuarioTone,
  estadoVendedorTone,
  formatFechaHora,
  formatMoney
} from "@/features/admin/format";
import { isAdminResourceId } from "@/features/admin/ids";
import { toActionError } from "@/lib/action-state";

type SellerPageProps = {
  params: Promise<{ sellerId: string }>;
};

export async function generateMetadata({
  params
}: SellerPageProps): Promise<Metadata> {
  const { sellerId } = await params;
  if (!isAdminResourceId(sellerId)) {
    notFound();
  }
  return { title: "Detalle del vendedor" };
}

export default async function AdminSellerDetailPage({ params }: SellerPageProps) {
  const { sellerId } = await params;
  if (!isAdminResourceId(sellerId)) {
    notFound();
  }

  await requireAdmin(`/admin/sellers/${sellerId}`);
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  let seller: Awaited<ReturnType<typeof fetchAdminSeller>>;
  try {
    seller = await fetchAdminSeller(token, sellerId);
  } catch (error) {
    const state = toActionError(error, "No pudimos cargar el vendedor.");
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

  if (!seller) {
    notFound();
  }

  return (
    <>
      <section className="page-head">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Ruta de navegación">
            <Link href="/admin/sellers">Vendedores</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{seller.nombreComercial}</span>
          </nav>
          <p className="eyebrow">Vendedor</p>
          <h1>{seller.nombreComercial}</h1>
          <div className="order-detail-badges">
            <Badge tone={estadoVendedorTone(seller.estado)}>
              {ESTADO_VENDEDOR_LABEL[seller.estado]}
            </Badge>
            <Badge tone={estadoUsuarioTone(seller.usuarioEstado)}>
              {ESTADO_USUARIO_LABEL[seller.usuarioEstado] ?? seller.usuarioEstado}
            </Badge>
            <span className="order-detail-date">
              Registrado el {formatFechaHora(seller.creadoEn)}
            </span>
          </div>
        </div>
      </section>

      <section className="section-tight">
        <div className="container seller-detail-layout">
          <div className="seller-detail-main">
            <section className="checkout-block">
              <h2>Resumen operativo</h2>
              <ul className="order-items">
                <li>
                  <span>Correo electrónico</span>
                  <strong>{seller.correoElectronico}</strong>
                </li>
                <li>
                  <span>Productos</span>
                  <strong>
                    {seller.productosCount} ({seller.productosPublicadosCount}{" "}
                    publicados)
                  </strong>
                </li>
                <li>
                  <span>Bodegas</span>
                  <strong>{seller.bodegasCount}</strong>
                </li>
                <li>
                  <span>Unidades disponibles</span>
                  <strong>{seller.inventarioDisponible}</strong>
                </li>
                <li>
                  <span>Pedidos con sus productos</span>
                  <strong>{seller.pedidosCount}</strong>
                </li>
              </ul>
            </section>

            <section className="checkout-block">
              <h2>Inventario del vendedor</h2>
              <ul className="order-items">
                <li>
                  <span>Posiciones</span>
                  <strong>{seller.inventario.posiciones}</strong>
                </li>
                <li>
                  <span>En mano</span>
                  <strong>{seller.inventario.onHand}</strong>
                </li>
                <li>
                  <span>Reservado</span>
                  <strong>{seller.inventario.reserved}</strong>
                </li>
                <li>
                  <span>No disponible</span>
                  <strong>{seller.inventario.unavailable}</strong>
                </li>
                <li>
                  <span>Disponible</span>
                  <strong>{seller.inventario.disponible}</strong>
                </li>
              </ul>
            </section>

            <section className="checkout-block">
              <h2>Bodegas</h2>
              {seller.bodegas.length === 0 ? (
                <p className="form-hint">El vendedor no tiene bodegas registradas.</p>
              ) : (
                <div className="order-list">
                  {seller.bodegas.map((bodega) => (
                    <article className="order-card" key={bodega.id}>
                      <div className="order-card-head">
                        <div>
                          <p className="order-card-number">
                            <Link href={`/admin/warehouses/${bodega.id}`}>
                              {bodega.nombre}
                            </Link>
                          </p>
                          <p className="order-card-seller">
                            {bodega.ubicacion} · {TIPO_BODEGA_LABEL[bodega.tipo]} ·{" "}
                            {formatFechaHora(bodega.creadaEn)}
                          </p>
                        </div>
                        <Badge tone={estadoBodegaTone(bodega.estado)}>
                          {ESTADO_BODEGA_LABEL[bodega.estado]}
                        </Badge>
                      </div>
                      <div className="order-card-meta">
                        <span>
                          {bodega.productosCount}{" "}
                          {bodega.productosCount === 1 ? "producto" : "productos"}
                        </span>
                        <strong>
                          {bodega.inventarioDisponible} unidades disponibles
                        </strong>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="checkout-block">
              <h2>Productos</h2>
              {seller.productos.length === 0 ? (
                <p className="form-hint">
                  El vendedor todavía no tiene productos registrados.
                </p>
              ) : (
                <div className="seller-table-wrap">
                  <table className="seller-table">
                    <caption className="sr-only">Productos del vendedor</caption>
                    <thead>
                      <tr>
                        <th scope="col">Producto</th>
                        <th scope="col">Categoría</th>
                        <th scope="col">Estado</th>
                        <th scope="col">Precio</th>
                        <th scope="col">Disponible</th>
                      </tr>
                    </thead>
                    <tbody>
                      {seller.productos.map((producto) => (
                        <tr key={producto.id}>
                          <td>
                            <strong>
                              <Link href={`/admin/products/${producto.id}`}>
                                {producto.nombre}
                              </Link>
                            </strong>
                            <span className="seller-product-meta">
                              SKU {producto.sku}
                            </span>
                          </td>
                          <td>{CATEGORIA_LABEL[producto.categoria]}</td>
                          <td>
                            <Badge tone={estadoProductoTone(producto.estado)}>
                              {ESTADO_PRODUCTO_LABEL[producto.estado]}
                            </Badge>
                          </td>
                          <td>
                            {formatMoney(producto.precioCentavos, producto.moneda)}
                          </td>
                          <td>
                            {producto.inventarioDisponible === null
                              ? "Digital"
                              : producto.inventarioDisponible}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          <aside className="seller-detail-aside">
            <section className="checkout-block">
              <h2>Consulta de solo lectura</h2>
              <p className="form-hint">
                <StoreIcon width={16} height={16} /> El Administrador no edita el
                catálogo ni el inventario del vendedor. Las operaciones comerciales
                pertenecen al vendedor y las logísticas al operador logístico.
              </p>
            </section>

            <section className="checkout-block">
              <h2>Accesos relacionados</h2>
              <ul className="order-items">
                <li>
                  <Link
                    className="text-link"
                    href={`/admin/products?vendedorId=${seller.id}`}
                  >
                    Productos del vendedor
                  </Link>
                </li>
                <li>
                  <Link
                    className="text-link"
                    href={`/admin/warehouses?vendedorId=${seller.id}`}
                  >
                    Bodegas del vendedor
                  </Link>
                </li>
                <li>
                  <Link
                    className="text-link"
                    href={`/admin/inventory?vendedorId=${seller.id}`}
                  >
                    Inventario del vendedor
                  </Link>
                </li>
              </ul>
            </section>

            <Link className="text-link" href="/admin/sellers">
              <ArrowRightIcon
                width={16}
                height={16}
                style={{ transform: "rotate(180deg)" }}
              />
              Volver a vendedores
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}
