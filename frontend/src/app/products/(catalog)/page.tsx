import type { Metadata } from "next";
import Link from "next/link";
import { SearchIcon } from "@/components/icons";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Pagination } from "@/components/ui/pagination";
import { fetchProducts } from "@/features/catalog/api";
import { CatalogFilters } from "@/features/catalog/components/catalog-filters";
import { ProductGrid } from "@/features/catalog/components/product-grid";
import { CATEGORIA_LABEL } from "@/features/catalog/format";
import {
  CATEGORIAS,
  ORDENES_CATALOGO,
  type CategoriaProducto,
  type OrdenCatalogo
} from "@/features/catalog/types";
import { ApiError } from "@/lib/api/client";

export const metadata: Metadata = {
  title: "Catálogo"
};

const PAGE_SIZE = 6;

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ProductsPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const search = first(params.search)?.trim() ?? "";
  const categoria = asCategoria(first(params.categoria));
  const orden = asOrden(first(params.orden)) ?? "recientes";
  const parsedPage = Number.parseInt(first(params.page) ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage >= 1 ? parsedPage : 1;

  let catalogError: unknown = null;
  let result: Awaited<ReturnType<typeof fetchProducts>> | null = null;

  try {
    result = await fetchProducts({
      search,
      categoria,
      orden,
      page,
      pageSize: PAGE_SIZE
    });
  } catch (error) {
    catalogError = error;
  }

  const heading = search
    ? `Resultados para “${search}”`
    : categoria
      ? CATEGORIA_LABEL[categoria]
      : "Catálogo completo";

  return (
    <>
      <section className="page-head">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Ruta de navegación">
            <Link href="/">Inicio</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Catálogo</span>
          </nav>
          <h1>{heading}</h1>
          <p>
            {search
              ? "Búsqueda sobre el nombre y la descripción de cada producto publicado."
              : categoria
                ? "Productos publicados por vendedores activos en esta categoría."
                : "Explora todos los productos publicados por vendedores activos de NexusMarket."}
          </p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <CatalogFilters
            search={search}
            categoria={categoria}
            orden={orden}
          />

          {result ? (
            <>
              <div className="results-bar">
                <span>
                  <strong>{result.pagination.total}</strong>{" "}
                  {result.pagination.total === 1
                    ? "producto encontrado"
                    : "productos encontrados"}
                  {search ? ` para “${search}”` : ""}
                </span>
                <span>
                  Página {result.pagination.page} de{" "}
                  {Math.max(result.pagination.totalPages, 1)}
                </span>
              </div>

              {result.items.length > 0 ? (
                <>
                  <ProductGrid products={result.items} />
                  <Pagination
                    page={result.pagination.page}
                    totalPages={result.pagination.totalPages}
                    basePath="/products"
                    query={{
                      search: search || undefined,
                      categoria,
                      orden: orden === "recientes" ? undefined : orden
                    }}
                  />
                </>
              ) : (
                <EmptyState
                  icon={<SearchIcon width={24} height={24} />}
                  title="No encontramos productos"
                  description="Prueba con otra palabra, cambia de categoría o limpia los filtros para ver todo el catálogo."
                  action={{ href: "/products", label: "Limpiar filtros" }}
                />
              )}
            </>
          ) : (
            <div style={{ marginTop: 24 }}>
              <ErrorState
                description={
                  catalogError instanceof Error
                    ? catalogError.message
                    : "No fue posible consultar el catálogo."
                }
                correlationId={
                  catalogError instanceof ApiError
                    ? catalogError.correlationId
                    : undefined
                }
              >
                <Link className="btn btn-primary" href="/products">
                  Reintentar
                </Link>
              </ErrorState>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function asCategoria(value: string | undefined): CategoriaProducto | undefined {
  return CATEGORIAS.find((categoria) => categoria === value);
}

function asOrden(value: string | undefined): OrdenCatalogo | undefined {
  return ORDENES_CATALOGO.find((orden) => orden === value);
}
