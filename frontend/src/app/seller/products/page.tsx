import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon, StoreIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { getSessionToken, requireSeller } from "@/features/auth/session";
import { fetchSellerProducts } from "@/features/seller/api";
import {
  ESTADO_PRODUCTO_LABEL,
  estadoProductoTone,
  formatMoney
} from "@/features/seller/format";
import { toActionError } from "@/lib/action-state";

export const metadata: Metadata = {
  title: "Mis productos"
};

export default async function SellerProductsPage() {
  await requireSeller("/seller/products");
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  let products: Awaited<ReturnType<typeof fetchSellerProducts>>;
  try {
    products = await fetchSellerProducts(token);
  } catch (error) {
    const state = toActionError(error, "No pudimos cargar tus productos.");
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
          <div className="seller-head-row">
            <div>
              <p className="eyebrow">Catálogo propio</p>
              <h1>Mis productos</h1>
              <p>
                Cada producto es una combinación vendible independiente. En V1
                no existen variantes comerciales.
              </p>
            </div>
            <Link className="btn btn-primary" href="/seller/products/new">
              <PlusIcon width={18} height={18} /> Crear producto
            </Link>
          </div>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          {products.length === 0 ? (
            <EmptyState
              icon={<StoreIcon width={24} height={24} />}
              title="Aún no tienes productos"
              description="Crea tu primer producto. Nacerá en borrador y solo se mostrará en el catálogo cuando lo publiques con imagen y SKU."
              action={{ href: "/seller/products/new", label: "Crear producto" }}
            />
          ) : (
            <div className="seller-product-list">
              {products.map((product) => (
                <article className="seller-product-row" key={product.id}>
                  <div className="seller-product-main">
                    <Link
                      className="seller-product-name"
                      href={`/seller/products/${product.id}`}
                    >
                      {product.nombre}
                    </Link>
                    <span className="seller-product-meta">
                      SKU {product.sku} ·{" "}
                      {formatMoney(product.precioCentavos, product.moneda)}
                    </span>
                    <span className="seller-product-meta">
                      {product.imagenes.length}{" "}
                      {product.imagenes.length === 1 ? "imagen" : "imágenes"}
                      {product.inventario
                        ? ` · ${product.inventario.disponible} disponibles`
                        : " · sin inventario"}
                    </span>
                  </div>
                  <div className="seller-product-side">
                    <Badge tone={estadoProductoTone(product.estado)}>
                      {ESTADO_PRODUCTO_LABEL[product.estado]}
                    </Badge>
                    <Link
                      className="text-link"
                      href={`/seller/products/${product.id}`}
                    >
                      Administrar
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
