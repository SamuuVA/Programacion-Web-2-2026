import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  BoxesIcon,
  CheckIcon,
  CompassIcon,
  ShieldCheckIcon,
  SparklesIcon
} from "@/components/icons";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Price } from "@/components/ui/price";
import { fetchCategories, fetchProducts } from "@/features/catalog/api";
import { CategoryIcon } from "@/features/catalog/components/category-icon";
import { ProductGrid } from "@/features/catalog/components/product-grid";
import {
  CATEGORIA_DESCRIPCION,
  CATEGORIA_LABEL,
  disponibilidadTexto,
  formatPrecio
} from "@/features/catalog/format";
import {
  CATEGORIAS,
  type Categoria,
  type ProductoResumen
} from "@/features/catalog/types";
import { ApiError } from "@/lib/api/client";

export const metadata: Metadata = {
  title: "NexusMarket · Productos de vendedores reales"
};

export default async function HomePage() {
  const [productsResult, categoriesResult] = await Promise.allSettled([
    fetchProducts({ pageSize: 8, orden: "recientes" }),
    fetchCategories()
  ]);

  const catalog =
    productsResult.status === "fulfilled" ? productsResult.value : null;
  const categories: readonly Categoria[] =
    categoriesResult.status === "fulfilled"
      ? categoriesResult.value
      : CATEGORIAS.map((codigo) => ({
          codigo,
          nombre: CATEGORIA_LABEL[codigo]
        }));

  const catalogError =
    productsResult.status === "rejected" ? productsResult.reason : null;
  const errorMessage =
    catalogError instanceof Error
      ? catalogError.message
      : "No fue posible conectar con la API de NexusMarket.";
  const correlationId =
    catalogError instanceof ApiError ? catalogError.correlationId : undefined;

  const heroProduct: ProductoResumen | undefined = catalog?.items[0];

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <p className="eyebrow">Marketplace de vendedores activos</p>
            <h1>
              Productos con historia,
              <br />
              <em>listos para descubrir.</em>
            </h1>
            <p className="hero-copy">
              Explora un catálogo conectado al inventario real de cada vendedor.
              Encuentra tecnología, prendas, objetos para el hogar y contenido
              digital en un solo lugar.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" href="/products">
                Explorar catálogo
                <ArrowRightIcon />
              </Link>
              <Link className="btn btn-secondary" href="/products?orden=recientes">
                Ver recientes
              </Link>
            </div>
            <div className="hero-meta">
              <span>
                <ShieldCheckIcon /> Vendedores activos
              </span>
              <span>
                <BoxesIcon /> Inventario por bodega
              </span>
              <span>
                <SparklesIcon /> Catálogo en vivo
              </span>
            </div>
          </div>

          <div className="hero-visual">
            {heroProduct ? (
              <div className="hero-card">
                <div className="hero-card-media">
                  {heroProduct.imagenPrincipal ? (
                    <img
                      src={heroProduct.imagenPrincipal.url}
                      alt={heroProduct.imagenPrincipal.alt}
                      width={800}
                      height={680}
                      decoding="async"
                    />
                  ) : (
                    <span className="product-card-placeholder" aria-hidden="true">
                      NM
                    </span>
                  )}
                </div>
                <div className="hero-card-body">
                  <div>
                    <p>{CATEGORIA_LABEL[heroProduct.categoria]}</p>
                    <h2>{heroProduct.nombre}</h2>
                  </div>
                  <Price value={formatPrecio(heroProduct.precio)} />
                </div>
                <div className="hero-float">
                  <span className="hero-float-icon" aria-hidden="true">
                    <BoxesIcon />
                  </span>
                  <span>
                    {heroProduct.vendedor.nombreComercial}
                    <small>
                      {
                        disponibilidadTexto(
                          heroProduct.disponible,
                          heroProduct.tipoEntrega
                        ).label
                      }
                    </small>
                  </span>
                </div>
              </div>
            ) : (
              <div className="hero-card">
                <div
                  className="hero-card-media"
                  style={{ display: "grid", placeItems: "center" }}
                >
                  <span className="brand-mark" aria-hidden="true">
                    N
                  </span>
                </div>
                <div className="hero-card-body">
                  <div>
                    <p>NexusMarket</p>
                    <h2>El catálogo está tomando forma</h2>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="trust-strip" aria-label="Características del catálogo">
        <div className="container trust-grid">
          <div className="trust-item">
            <span className="trust-icon" aria-hidden="true">
              <ShieldCheckIcon />
            </span>
            <span>
              Solo vendedores activos
              <small>Las publicaciones provienen de tiendas habilitadas.</small>
            </span>
          </div>
          <div className="trust-item">
            <span className="trust-icon" aria-hidden="true">
              <BoxesIcon />
            </span>
            <span>
              Inventario real
              <small>Cada unidad refleja el stock disponible por bodega.</small>
            </span>
          </div>
          <div className="trust-item">
            <span className="trust-icon" aria-hidden="true">
              <CompassIcon />
            </span>
            <span>
              Búsqueda clara
              <small>Filtra por categoría y ordena según lo que buscas.</small>
            </span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">Categorías</p>
              <h2 className="section-title">Encuentra lo que necesitas</h2>
              <p className="section-subtitle">
                Cuatro categorías para recorrer el catálogo desde el primer
                vistazo.
              </p>
            </div>
            <Link className="text-link" href="/products">
              Ver todo
              <ArrowRightIcon />
            </Link>
          </div>

          <div className="category-grid">
            {categories.map((category) => (
              <Link
                key={category.codigo}
                className="category-card"
                href={`/products?categoria=${category.codigo}`}
              >
                <span className="category-card-icon" aria-hidden="true">
                  <CategoryIcon categoria={category.codigo} />
                </span>
                <div>
                  <h3>{category.nombre}</h3>
                  <p>{CATEGORIA_DESCRIPCION[category.codigo]}</p>
                  <span>Explorar categoría</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-sage">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">Catálogo</p>
              <h2 className="section-title">Recién llegados</h2>
              <p className="section-subtitle">
                Productos publicados por vendedores activos, con su precio y
                disponibilidad actuales.
              </p>
            </div>
            <Link className="text-link" href="/products">
              Ver todo el catálogo
              <ArrowRightIcon />
            </Link>
          </div>

          {catalog ? (
            catalog.items.length > 0 ? (
              <ProductGrid products={catalog.items} />
            ) : (
              <EmptyState
                icon={<CompassIcon width={24} height={24} />}
                title="Aún no hay productos publicados"
                description="Cuando un vendedor publique su primer producto, aparecerá aquí."
                action={{ href: "/products", label: "Revisar el catálogo" }}
              />
            )
          ) : (
            <ErrorState
              description={errorMessage}
              correlationId={correlationId}
            >
              <Link className="btn btn-primary" href="/">
                Reintentar
              </Link>
            </ErrorState>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="seller-band">
            <div>
              <h2>Un catálogo con reglas claras</h2>
              <p>
                Cada producto pertenece a un vendedor activo y muestra su
                disponibilidad real. Esta primera entrega se concentra en
                explorar el catálogo; el carrito, el pago simulado y la
                inscripción de vendedores llegarán en las siguientes
                iteraciones.
              </p>
            </div>
            <ul className="seller-band-points">
              <li>
                <CheckIcon /> Solo productos publicados
              </li>
              <li>
                <CheckIcon /> Stock calculado por bodega
              </li>
              <li>
                <CheckIcon /> Precios definidos por el vendedor
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
