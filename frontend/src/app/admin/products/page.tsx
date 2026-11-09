import type { Metadata } from "next";
import Link from "next/link";
import { StoreIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Pagination } from "@/components/ui/pagination";
import { getSessionToken, requireAdmin } from "@/features/auth/session";
import { fetchAdminProducts } from "@/features/admin/api";
import {
  CATEGORIA_LABEL,
  ESTADO_PRODUCTO_LABEL,
  estadoProductoTone,
  formatFechaHora,
  formatMoney
} from "@/features/admin/format";
import { isAdminResourceId } from "@/features/admin/ids";
import type {
  CategoriaProducto,
  EstadoProductoVendedor,
  TipoEntrega
} from "@/features/admin/types";
import { toActionError } from "@/lib/action-state";

export const metadata: Metadata = {
  title: "Productos"
};

const PAGE_SIZE = 20;

const ESTADOS: readonly EstadoProductoVendedor[] = [
  "BORRADOR",
  "PUBLICADO",
  "SUSPENDIDO",
  "DESCONTINUADO"
];

const CATEGORIAS: readonly CategoriaProducto[] = [
  "ELECTRONICA",
  "ROPA",
  "HOGAR",
  "DIGITAL"
];

const TIPOS_ENTREGA: readonly TipoEntrega[] = ["FISICA", "DIGITAL"];

type ProductsPageProps = {
  searchParams: Promise<{
    estado?: string | string[] | undefined;
    categoria?: string | string[] | undefined;
    tipoEntrega?: string | string[] | undefined;
    vendedorId?: string | string[] | undefined;
    search?: string | string[] | undefined;
    page?: string | string[] | undefined;
  }>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminProductsPage({
  searchParams
}: ProductsPageProps) {
  await requireAdmin("/admin/products");
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  const params = await searchParams;
  const rawEstado = first(params.estado);
  const estado = ESTADOS.includes(rawEstado as EstadoProductoVendedor)
    ? (rawEstado as EstadoProductoVendedor)
    : undefined;
  const rawCategoria = first(params.categoria);
  const categoria = CATEGORIAS.includes(rawCategoria as CategoriaProducto)
    ? (rawCategoria as CategoriaProducto)
    : undefined;
  const rawTipo = first(params.tipoEntrega);
  const tipoEntrega = TIPOS_ENTREGA.includes(rawTipo as TipoEntrega)
    ? (rawTipo as TipoEntrega)
    : undefined;
  const rawVendedorId = first(params.vendedorId);
  const vendedorId =
    rawVendedorId && isAdminResourceId(rawVendedorId) ? rawVendedorId : undefined;
  const search = first(params.search)?.trim() || undefined;
  const rawPage = Number.parseInt(first(params.page) ?? "1", 10);
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;

  let result: Awaited<ReturnType<typeof fetchAdminProducts>>;
  try {
    result = await fetchAdminProducts(token, {
      ...(estado ? { estado } : {}),
      ...(categoria ? { categoria } : {}),
      ...(tipoEntrega ? { tipoEntrega } : {}),
      ...(vendedorId ? { vendedorId } : {}),
      ...(search ? { search } : {}),
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
          <p className="eyebrow">Administración</p>
          <h1>Catálogo de productos</h1>
          <p>
            Consulta del catálogo completo con su vendedor propietario, estado y
            disponibilidad. No existen variantes comerciales en V1: cada
            combinación vendible es un producto independiente.
          </p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <form className="filters-row" method="get" action="/admin/products">
            <label htmlFor="search">Buscar</label>
            <input
              id="search"
              name="search"
              type="search"
              defaultValue={search ?? ""}
              placeholder="Nombre o SKU"
              maxLength={120}
            />
            <label htmlFor="estado">Estado</label>
            <select id="estado" name="estado" defaultValue={estado ?? ""}>
              <option value="">Todos los estados</option>
              {ESTADOS.map((value) => (
                <option key={value} value={value}>
                  {ESTADO_PRODUCTO_LABEL[value]}
                </option>
              ))}
            </select>
            <label htmlFor="categoria">Categoría</label>
            <select id="categoria" name="categoria" defaultValue={categoria ?? ""}>
              <option value="">Todas las categorías</option>
              {CATEGORIAS.map((value) => (
                <option key={value} value={value}>
                  {CATEGORIA_LABEL[value]}
                </option>
              ))}
            </select>
            <label htmlFor="tipoEntrega">Tipo de entrega</label>
            <select
              id="tipoEntrega"
              name="tipoEntrega"
              defaultValue={tipoEntrega ?? ""}
            >
              <option value="">Todos los tipos</option>
              {TIPOS_ENTREGA.map((value) => (
                <option key={value} value={value}>
                  {value === "FISICA" ? "Física" : "Digital"}
                </option>
              ))}
            </select>
            <button className="btn btn-secondary btn-sm" type="submit">
              Filtrar
            </button>
          </form>

          <p className="form-hint">
            {result.total} {result.total === 1 ? "producto" : "productos"} en total.
          </p>

          {result.items.length === 0 ? (
            <EmptyState
              icon={<StoreIcon width={24} height={24} />}
              title="No hay productos para este filtro"
              description="Cuando existan productos que coincidan con la búsqueda, aparecerán aquí."
            />
          ) : (
            <div className="seller-table-wrap">
              <table className="seller-table">
                <caption className="sr-only">Productos del catálogo</caption>
                <thead>
                  <tr>
                    <th scope="col">Producto</th>
                    <th scope="col">Vendedor</th>
                    <th scope="col">Categoría</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Precio</th>
                    <th scope="col">Imágenes</th>
                    <th scope="col">Disponible</th>
                    <th scope="col">Actualizado</th>
                    <th scope="col">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <strong>{product.nombre}</strong>
                        <span className="seller-product-meta">
                          SKU {product.sku} ·{" "}
                          {product.tipoEntrega === "FISICA" ? "Física" : "Digital"}
                        </span>
                      </td>
                      <td>{product.vendedorNombre}</td>
                      <td>{CATEGORIA_LABEL[product.categoria]}</td>
                      <td>
                        <Badge tone={estadoProductoTone(product.estado)}>
                          {ESTADO_PRODUCTO_LABEL[product.estado]}
                        </Badge>
                      </td>
                      <td>
                        {formatMoney(product.precioCentavos, product.moneda)}
                      </td>
                      <td>{product.imagenesCount}</td>
                      <td>
                        {product.inventarioDisponible === null
                          ? "Digital"
                          : product.inventarioDisponible}
                      </td>
                      <td>{formatFechaHora(product.actualizadoEn)}</td>
                      <td>
                        <Link
                          className="text-link"
                          href={`/admin/products/${product.id}`}
                        >
                          Ver detalle
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Pagination
            page={result.page}
            totalPages={totalPages}
            basePath="/admin/products"
            query={{ estado, categoria, tipoEntrega, vendedorId, search }}
          />
        </div>
      </section>
    </>
  );
}
