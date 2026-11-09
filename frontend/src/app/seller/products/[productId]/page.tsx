import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRightIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";
import { getSessionToken, requireSeller } from "@/features/auth/session";
import { isProductId } from "@/features/catalog/ids";
import { CATEGORIA_LABEL } from "@/features/catalog/format";
import { fetchSellerProduct } from "@/features/seller/api";
import { SellerImageManager } from "@/features/seller/components/seller-image-manager";
import { SellerProductForm } from "@/features/seller/components/seller-product-form";
import { SellerProductStateActions } from "@/features/seller/components/seller-product-state-actions";
import {
  ESTADO_PRODUCTO_LABEL,
  estadoProductoTone,
  formatFechaHora,
  formatMoney
} from "@/features/seller/format";
import { toActionError } from "@/lib/action-state";

type SellerProductPageProps = {
  params: Promise<{ productId: string }>;
};

export async function generateMetadata({
  params
}: SellerProductPageProps): Promise<Metadata> {
  const { productId } = await params;
  if (!isProductId(productId)) {
    notFound();
  }
  return { title: "Administrar producto" };
}

export default async function SellerProductDetailPage({
  params
}: SellerProductPageProps) {
  const { productId } = await params;
  if (!isProductId(productId)) {
    notFound();
  }

  await requireSeller(`/seller/products/${productId}`);
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  let product: Awaited<ReturnType<typeof fetchSellerProduct>>;
  try {
    product = await fetchSellerProduct(token, productId);
  } catch (error) {
    const state = toActionError(error, "No pudimos cargar el producto.");
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

  if (!product) {
    notFound();
  }

  const editable = product.estado !== "DESCONTINUADO";

  return (
    <>
      <section className="page-head">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Ruta de navegación">
            <Link href="/seller/products">Mis productos</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{product.nombre}</span>
          </nav>
          <p className="eyebrow">Catálogo propio</p>
          <h1>{product.nombre}</h1>
          <div className="seller-head-meta">
            <Badge tone={estadoProductoTone(product.estado)}>
              {ESTADO_PRODUCTO_LABEL[product.estado]}
            </Badge>
            <span>SKU {product.sku}</span>
            <span>
              Actualizado el {formatFechaHora(product.actualizadoEn)}
            </span>
          </div>
        </div>
      </section>

      <section className="section-tight">
        <div className="container seller-detail-layout">
          <div className="seller-detail-main">
            <section className="checkout-block">
              <h2>Resumen</h2>
              <dl className="seller-data">
                <div>
                  <dt>Categoría</dt>
                  <dd>{CATEGORIA_LABEL[product.categoria]}</dd>
                </div>
                <div>
                  <dt>Tipo de entrega</dt>
                  <dd>
                    {product.tipoEntrega === "FISICA" ? "Física" : "Digital"}
                  </dd>
                </div>
                <div>
                  <dt>Precio</dt>
                  <dd>{formatMoney(product.precioCentavos, product.moneda)}</dd>
                </div>
                <div>
                  <dt>Inventario disponible</dt>
                  <dd>
                    {product.inventario
                      ? `${product.inventario.disponible} de ${product.inventario.onHand} en mano`
                      : "No aplica o sin registro"}
                  </dd>
                </div>
                <div>
                  <dt>Descripción</dt>
                  <dd>{product.descripcion}</dd>
                </div>
              </dl>
            </section>

            <SellerImageManager
              productId={product.id}
              images={product.imagenes}
            />

            {editable ? (
              <section className="checkout-block">
                <h2>Editar producto</h2>
                <SellerProductForm mode="edit" product={product} />
              </section>
            ) : (
              <section className="checkout-block">
                <h2>Producto descontinuado</h2>
                <p className="form-hint">
                  Este producto es terminal: no se edita ni se vuelve a
                  publicar. Si necesitas venderlo otra vez, crea una oferta
                  nueva.
                </p>
              </section>
            )}
          </div>

          <aside className="seller-detail-aside">
            <section className="checkout-block">
              <h2>Estado de publicación</h2>
              <SellerProductStateActions
                productId={product.id}
                estado={product.estado}
              />
              <p className="form-hint">
                Para publicar se requiere al menos una imagen y que el perfil del
                vendedor esté activo. Suspender no republica automáticamente y
                descontinuar es irreversible.
              </p>
            </section>

            <Link className="text-link" href="/seller/products">
              <ArrowRightIcon
                width={16}
                height={16}
                style={{ transform: "rotate(180deg)" }}
              />
              Volver a mis productos
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}
