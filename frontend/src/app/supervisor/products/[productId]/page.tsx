import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRightIcon, ShieldCheckIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";
import { getSessionToken, requireSupervisor } from "@/features/auth/session";
import { ProductImage } from "@/features/catalog/components/product-image";
import { fetchSupervisorProduct } from "@/features/supervisor/api";
import {
  CATEGORIA_LABEL,
  ESTADO_PRODUCTO_LABEL,
  estadoProductoTone,
  formatFechaHora,
  formatMoney
} from "@/features/supervisor/format";
import { isSupervisorResourceId } from "@/features/supervisor/ids";
import { toActionError } from "@/lib/action-state";

type ProductPageProps = {
  params: Promise<{ productId: string }>;
};

export async function generateMetadata({
  params
}: ProductPageProps): Promise<Metadata> {
  const { productId } = await params;
  if (!isSupervisorResourceId(productId)) {
    notFound();
  }
  return { title: "Detalle del producto" };
}

export default async function SupervisorProductDetailPage({
  params
}: ProductPageProps) {
  const { productId } = await params;
  if (!isSupervisorResourceId(productId)) {
    notFound();
  }

  await requireSupervisor(`/supervisor/products/${productId}`);
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  let product: Awaited<ReturnType<typeof fetchSupervisorProduct>>;
  try {
    product = await fetchSupervisorProduct(token, productId);
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

  return (
    <>
      <section className="page-head">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Ruta de navegación">
            <Link href="/supervisor/products">Productos</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{product.nombre}</span>
          </nav>
          <p className="eyebrow">Producto en supervisión</p>
          <h1>{product.nombre}</h1>
          <div className="order-detail-badges">
            <Badge tone={estadoProductoTone(product.estado)}>
              {ESTADO_PRODUCTO_LABEL[product.estado]}
            </Badge>
            <span className="order-detail-date">
              {product.vendedorNombre} · {CATEGORIA_LABEL[product.categoria]}
            </span>
          </div>
        </div>
      </section>

      <section className="section-tight">
        <div className="container seller-detail-layout">
          <div className="seller-detail-main">
            <section className="checkout-block">
              <h2>Descripción</h2>
              <p>{product.descripcion}</p>
              <div className="summary-row">
                <span>SKU</span>
                <strong>{product.sku}</strong>
              </div>
              <div className="summary-row">
                <span>Precio</span>
                <strong>{formatMoney(product.precioCentavos, product.moneda)}</strong>
              </div>
              <div className="summary-row">
                <span>Tipo de entrega</span>
                <strong>{product.tipoEntrega === "FISICA" ? "Física" : "Digital"}</strong>
              </div>
              <div className="summary-row">
                <span>Unidades disponibles</span>
                <strong>
                  {product.inventarioDisponible === null
                    ? "No aplica (producto digital)"
                    : product.inventarioDisponible}
                </strong>
              </div>
              <div className="summary-row">
                <span>Última actualización</span>
                <strong>{formatFechaHora(product.actualizadoEn)}</strong>
              </div>
            </section>

            <section className="checkout-block">
              <h2>Imágenes</h2>
              {product.imagenes.length === 0 ? (
                <p className="form-hint">El producto no tiene imágenes registradas.</p>
              ) : (
                <div className="product-gallery">
                  {product.imagenes.map((imagen) => (
                    <ProductImage
                      key={imagen.id}
                      src={imagen.url}
                      alt={imagen.alt}
                      width={480}
                      height={480}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="checkout-block">
              <h2>Inventario por bodega</h2>
              {product.inventario.length === 0 ? (
                <p className="form-hint">
                  El producto no tiene posiciones de inventario físico.
                </p>
              ) : (
                <div className="seller-table-wrap">
                  <table className="seller-table">
                    <caption className="sr-only">
                      Inventario del producto por bodega
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Bodega</th>
                        <th scope="col">En mano</th>
                        <th scope="col">Reservado</th>
                        <th scope="col">No disponible</th>
                        <th scope="col">Disponible</th>
                        <th scope="col">Actualizado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.inventario.map((position) => (
                        <tr key={position.bodegaId}>
                          <td>{position.bodegaNombre}</td>
                          <td>{position.onHand}</td>
                          <td>{position.reserved}</td>
                          <td>{position.unavailable}</td>
                          <td>
                            <strong>{position.disponible}</strong>
                          </td>
                          <td>{formatFechaHora(position.actualizadoEn)}</td>
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
                <ShieldCheckIcon width={16} height={16} /> El perfil de supervisión
                no puede publicar, suspender, descontinuar ni editar este producto,
                sus imágenes o su inventario.
              </p>
            </section>

            <section className="checkout-block">
              <h2>Vendedor</h2>
              <p className="form-hint">
                {product.vendedorNombre}. No se publican correo, documento ni datos
                personales del vendedor.
              </p>
            </section>

            <Link className="text-link" href="/supervisor/products">
              <ArrowRightIcon
                width={16}
                height={16}
                style={{ transform: "rotate(180deg)" }}
              />
              Volver a productos
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}
