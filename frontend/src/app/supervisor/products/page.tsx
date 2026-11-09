import type { Metadata } from "next";
import Link from "next/link";
import { StoreIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Pagination } from "@/components/ui/pagination";
import { getSessionToken, requireSupervisor } from "@/features/auth/session";
import { CATEGORIAS } from "@/features/catalog/types";
import type { CategoriaProducto } from "@/features/catalog/types";
import { fetchSupervisorProducts } from "@/features/supervisor/api";
import {
  CATEGORIA_LABEL,
  ESTADO_PRODUCTO_LABEL,
  estadoProductoTone,
  formatFechaHora,
  formatMoney
} from "@/features/supervisor/format";
import type { EstadoProductoSupervisor } from "@/features/supervisor/types";
import { isSupervisorResourceId } from "@/features/supervisor/ids";
import { toActionError } from "@/lib/action-state";

export const metadata: Metadata = {
  title: "Productos"
};

const PAGE_SIZE = 20;

const ESTADOS: readonly { value: "" | EstadoProductoSupervisor; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "BORRADOR", label: "Borradores" },
  { value: "PUBLICADO", label: "Publicados" },
  { value: "SUSPENDIDO", label: "Suspendidos" },
  { value: "DESCONTINUADO", label: "Descontinuados" }
];

type ProductsPageProps = {
  searchParams: Promise<{
    estado?: string | string[] | undefined;
    categoria?: string | string[] | undefined;
    vendedorId?: string | string[] | undefined;
    page?: string | string[] | undefined;
  }>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function buildHref(params: {
  estado?: string;
  categoria?: string;
  vendedorId?: string;
}): string {
  const search = new URLSearchParams();
  if (params.estado) {
    search.set("estado", params.estado);
  }
  if (params.categoria) {
    search.set("categoria", params.categoria);
  }
  if (params.vendedorId) {
    search.set("vendedorId", params.vendedorId);
  }
  const suffix = search.toString();
  return suffix ? `/supervisor/products?${suffix}` : "/supervisor/products";
}

export default async function SupervisorProductsPage({
  searchParams
}: ProductsPageProps) {
  await requireSupervisor("/supervisor/products");
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  const params = await searchParams;
  const rawEstado = first(params.estado);
  const estado = ESTADOS.some((item) => item.value === rawEstado)
    ? (rawEstado as EstadoProductoSupervisor | "")
    : "";
  const rawCategoria = first(params.categoria);
  const categoria = CATEGORIAS.some((item) => item === rawCategoria)
    ? (rawCategoria as CategoriaProducto)
    : undefined;
  const rawVendedorId = first(params.vendedorId);
  const vendedorId =
    rawVendedorId && isSupervisorResourceId(rawVendedorId)
      ? rawVendedorId
      : undefined;
  const rawPage = Number.parseInt(first(params.page) ?? "1", 10);
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;

  let result: Awaited<ReturnType<typeof fetchSupervisorProducts>>;
  try {
    result = await fetchSupervisorProducts(token, {
      ...(estado ? { estado } : {}),
      ...(categoria ? { categoria } : {}),
      ...(vendedorId ? { vendedorId } : {}),
      page,
      pageSize: PAGE_SIZE
    });
  } catch (error) {
    const state = toActionError(error, "No pudimos cargar los productos.");
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

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <>
      <section className="page-head">
        <div className="container">
          <p className="eyebrow">Supervisión</p>
          <h1>Productos</h1>
          <p>
            Consulta del catálogo completo, incluidos los borradores y productos
            suspendidos. No permite editar precio, estado, imágenes ni stock.
          </p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <div className="seller-quick-links" aria-label="Filtrar productos por estado">
            {ESTADOS.map((item) => (
              <Link
                key={item.value || "todos"}
                className={
                  estado === item.value
                    ? "btn btn-primary btn-sm"
                    : "btn btn-ghost btn-sm"
                }
                href={buildHref({
                  ...(item.value ? { estado: item.value } : {}),
                  ...(categoria ? { categoria } : {}),
                  ...(vendedorId ? { vendedorId } : {})
                })}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div
            className="seller-quick-links"
            aria-label="Filtrar productos por categoría"
          >
            <Link
              className={categoria ? "btn btn-ghost btn-sm" : "btn btn-primary btn-sm"}
              href={buildHref({
                ...(estado ? { estado } : {}),
                ...(vendedorId ? { vendedorId } : {})
              })}
            >
              Todas las categorías
            </Link>
            {CATEGORIAS.map((item) => (
              <Link
                key={item}
                className={
                  categoria === item ? "btn btn-primary btn-sm" : "btn btn-ghost btn-sm"
                }
                href={buildHref({
                  ...(estado ? { estado } : {}),
                  categoria: item,
                  ...(vendedorId ? { vendedorId } : {})
                })}
              >
                {CATEGORIA_LABEL[item]}
              </Link>
            ))}
          </div>

          <p className="form-hint">
            {result.total} {result.total === 1 ? "producto" : "productos"} en total.
          </p>

          {result.items.length === 0 ? (
            <EmptyState
              icon={<StoreIcon width={24} height={24} />}
              title="No hay productos para este filtro"
              description="Cuando existan productos en el estado o categoría seleccionados, aparecerán aquí."
            />
          ) : (
            <div className="seller-product-list">
              {result.items.map((product) => (
                <article className="seller-product-row" key={product.id}>
                  <div className="seller-product-main">
                    <Link
                      className="seller-product-name"
                      href={`/supervisor/products/${product.id}`}
                    >
                      {product.nombre}
                    </Link>
                    <span className="seller-product-meta">
                      SKU {product.sku} · {product.vendedorNombre} ·{" "}
                      {CATEGORIA_LABEL[product.categoria]}
                    </span>
                    <span className="seller-product-meta">
                      {formatMoney(product.precioCentavos, product.moneda)} ·{" "}
                      {product.inventarioDisponible === null
                        ? "sin inventario físico"
                        : `${product.inventarioDisponible} disponibles`}{" "}
                      · {product.imagenesCount}{" "}
                      {product.imagenesCount === 1 ? "imagen" : "imágenes"}
                    </span>
                    <span className="seller-product-meta">
                      Creado el {formatFechaHora(product.creadoEn)}
                    </span>
                  </div>
                  <div className="seller-product-side">
                    <Badge tone={estadoProductoTone(product.estado)}>
                      {ESTADO_PRODUCTO_LABEL[product.estado]}
                    </Badge>
                    <Link
                      className="text-link"
                      href={`/supervisor/products/${product.id}`}
                    >
                      Ver detalle
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}

          <Pagination
            page={result.page}
            totalPages={totalPages}
            basePath="/supervisor/products"
            query={{
              estado: estado || undefined,
              categoria,
              vendedorId
            }}
          />
        </div>
      </section>
    </>
  );
}
