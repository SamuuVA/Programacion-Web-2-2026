import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRightIcon, InfoIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { getSession } from "@/features/auth/session";
import { fetchProduct } from "@/features/catalog/api";
import { AddToCartForm } from "@/features/cart/components/add-to-cart-form";
import { ProductGallery } from "@/features/catalog/components/product-gallery";
import { isProductId } from "@/features/catalog/ids";
import {
  CATEGORIA_LABEL,
  disponibilidadTexto,
  formatFecha,
  formatPrecio
} from "@/features/catalog/format";

type ProductPageProps = {
  params: Promise<{ productId: string }>;
};

export async function generateMetadata({
  params
}: ProductPageProps): Promise<Metadata> {
  const { productId } = await params;

  if (!isProductId(productId)) {
    notFound();
  }

  let product: Awaited<ReturnType<typeof fetchProduct>>;
  try {
    product = await fetchProduct(productId);
  } catch {
    return { title: "Producto" };
  }

  if (!product) {
    notFound();
  }

  return {
    title: product.nombre,
    description:
      product.descripcion.length > 160
        ? `${product.descripcion.slice(0, 157)}…`
        : product.descripcion
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { productId } = await params;

  if (!isProductId(productId)) {
    notFound();
  }

  const [product, session] = await Promise.all([
    fetchProduct(productId),
    getSession()
  ]);

  if (!product) {
    notFound();
  }

  const isBuyer = session?.rol === "COMPRADOR" && session.compradorId !== null;

  const disponibilidad = disponibilidadTexto(
    product.disponible,
    product.tipoEntrega
  );
  const entrega =
    product.tipoEntrega === "FISICA" ? "Envío físico" : "Entrega digital";

  return (
    <>
      <section className="page-head">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Ruta de navegación">
            <Link href="/">Inicio</Link>
            <span aria-hidden="true">/</span>
            <Link href="/products">Catálogo</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{product.nombre}</span>
          </nav>
        </div>
      </section>

      <div className="container">
        <div className="detail-layout">
          <ProductGallery
            images={product.imagenes}
            productName={product.nombre}
          />

          <div className="detail-info">
            <p className="detail-category">
              {CATEGORIA_LABEL[product.categoria]}
            </p>
            <h1>{product.nombre}</h1>
            <p className="detail-seller">
              Vendido por <strong>{product.vendedor.nombreComercial}</strong>
            </p>

            <div className="detail-price-row">
              <Price value={formatPrecio(product.precio)} size="lg" />
              <Badge tone={disponibilidad.tone}>{disponibilidad.label}</Badge>
            </div>

            <p className="detail-description">{product.descripcion}</p>

            <dl className="detail-specs">
              <div className="spec">
                <dt>SKU</dt>
                <dd>{product.sku}</dd>
              </div>
              <div className="spec">
                <dt>Categoría</dt>
                <dd>{CATEGORIA_LABEL[product.categoria]}</dd>
              </div>
              <div className="spec">
                <dt>Tipo de entrega</dt>
                <dd>{entrega}</dd>
              </div>
              <div className="spec">
                <dt>Vendedor</dt>
                <dd>{product.vendedor.nombreComercial}</dd>
              </div>
              <div className="spec">
                <dt>Publicado</dt>
                <dd>{formatFecha(product.creadoEn)}</dd>
              </div>
              <div className="spec">
                <dt>Disponibilidad</dt>
                <dd>{disponibilidad.label}</dd>
              </div>
            </dl>

            {isBuyer ? (
              <AddToCartForm
                productoId={product.id}
                disponible={product.disponible}
                tipoEntrega={product.tipoEntrega}
              />
            ) : (
              <div className="detail-note" role="note">
                <InfoIcon />
                <span>
                  {session ? (
                    <>
                      El carrito está disponible solo para compradores. Esta
                      sesión tiene el rol <strong>{session.rol}</strong>.
                    </>
                  ) : (
                    <>
                      <Link className="text-link" href={`/login?redirect=/products/${product.id}`}>
                        Ingresa como comprador
                      </Link>{" "}
                      para agregar este producto al carrito y completar una compra
                      con pago simulado.
                    </>
                  )}
                </span>
              </div>
            )}

            <div className="detail-back">
              <Link className="text-link" href="/products">
                <ArrowRightIcon
                  width={16}
                  height={16}
                  style={{ transform: "rotate(180deg)" }}
                />
                Volver al catálogo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
