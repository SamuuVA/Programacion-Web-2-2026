import type { Metadata } from "next";
import Link from "next/link";
import { BoxesIcon, PackageIcon, StoreIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { getSessionToken, requireSeller } from "@/features/auth/session";
import {
  fetchSellerInventory,
  fetchSellerOrders,
  fetchSellerProducts,
  fetchSellerProfile,
  fetchSellerWarehouses
} from "@/features/seller/api";
import {
  ESTADO_PRODUCTO_LABEL,
  ESTADO_VENDEDOR_LABEL,
  estadoProductoTone,
  estadoVendedorTone,
  formatFechaHora,
  formatMoney
} from "@/features/seller/format";
import { ESTADO_PEDIDO_LABEL, estadoPedidoTone } from "@/features/orders/format";
import { toActionError } from "@/lib/action-state";

export const metadata: Metadata = {
  title: "Resumen"
};

export default async function SellerDashboardPage() {
  await requireSeller("/seller");
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
      "No pudimos cargar el resumen de tu tienda."
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

  const { profile, products, warehouses, inventory, orders } = data;
  const published = products.filter(
    (product) => product.estado === "PUBLICADO"
  ).length;
  const activeWarehouses = warehouses.filter(
    (warehouse) => warehouse.estado === "ACTIVA"
  ).length;
  const availableUnits = inventory.reduce(
    (total, position) => total + position.disponible,
    0
  );

  return (
    <>
      <section className="page-head">
        <div className="container">
          <p className="eyebrow">Espacio del vendedor</p>
          <h1>{profile.nombreComercial}</h1>
          <div className="seller-head-meta">
            <Badge tone={estadoVendedorTone(profile.estado)}>
              {ESTADO_VENDEDOR_LABEL[profile.estado]}
            </Badge>
            <span>{profile.correoElectronico}</span>
          </div>
          <p>
            Administra tus productos, bodegas, inventario y consulta los pedidos
            que contienen tus productos. Las operaciones logísticas y de pago
            pertenecen a otros roles.
          </p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <div className="seller-stats">
            <article className="seller-stat">
              <span className="seller-stat-label">Productos</span>
              <strong>{products.length}</strong>
              <span className="seller-stat-hint">{published} publicados</span>
            </article>
            <article className="seller-stat">
              <span className="seller-stat-label">Bodegas activas</span>
              <strong>{activeWarehouses}</strong>
              <span className="seller-stat-hint">
                {warehouses.length} en total
              </span>
            </article>
            <article className="seller-stat">
              <span className="seller-stat-label">Unidades disponibles</span>
              <strong>{availableUnits}</strong>
              <span className="seller-stat-hint">
                {inventory.length} posiciones de inventario
              </span>
            </article>
            <article className="seller-stat">
              <span className="seller-stat-label">Pedidos</span>
              <strong>{orders.length}</strong>
              <span className="seller-stat-hint">con tus productos</span>
            </article>
          </div>

          <div className="seller-quick-links">
            <Link className="btn btn-primary" href="/seller/products/new">
              <StoreIcon width={18} height={18} /> Crear producto
            </Link>
            <Link className="btn btn-secondary" href="/seller/inventory">
              <BoxesIcon width={18} height={18} /> Registrar inventario
            </Link>
            <Link className="btn btn-ghost" href="/seller/orders">
              <PackageIcon width={18} height={18} /> Ver pedidos
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
                Solo pedidos que contienen productos de tu catálogo.
              </p>
            </div>
            <Link className="text-link" href="/seller/orders">
              Ver todos
            </Link>
          </div>

          {orders.length === 0 ? (
            <EmptyState
              icon={<PackageIcon width={24} height={24} />}
              title="Todavía no hay pedidos"
              description="Cuando un comprador incluya tus productos en una compra, aparecerán aquí."
            />
          ) : (
            <div className="order-list">
              {orders.slice(0, 5).map((order) => (
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

      <section className="section-tight">
        <div className="container">
          <div className="section-head">
            <div>
              <h2 className="section-title">Productos recientes</h2>
              <p className="section-subtitle">
                Los productos nuevos nacen en borrador hasta que los publiques.
              </p>
            </div>
            <Link className="text-link" href="/seller/products">
              Administrar productos
            </Link>
          </div>

          {products.length === 0 ? (
            <EmptyState
              icon={<StoreIcon width={24} height={24} />}
              title="Aún no tienes productos"
              description="Crea tu primer producto; quedará en borrador hasta cumplir las condiciones de publicación."
              action={{ href: "/seller/products/new", label: "Crear producto" }}
            />
          ) : (
            <div className="seller-product-list">
              {products.slice(0, 5).map((product) => (
                <article className="seller-product-row" key={product.id}>
                  <div>
                    <Link
                      className="seller-product-name"
                      href={`/seller/products/${product.id}`}
                    >
                      {product.nombre}
                    </Link>
                    <span className="seller-product-meta">
                      SKU {product.sku} · {formatMoney(product.precioCentavos, product.moneda)}
                    </span>
                  </div>
                  <Badge tone={estadoProductoTone(product.estado)}>
                    {ESTADO_PRODUCTO_LABEL[product.estado]}
                  </Badge>
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
  const [profile, products, warehouses, inventory, orders] = await Promise.all([
    fetchSellerProfile(token),
    fetchSellerProducts(token),
    fetchSellerWarehouses(token),
    fetchSellerInventory(token),
    fetchSellerOrders(token)
  ]);
  return { profile, products, warehouses, inventory, orders };
}
