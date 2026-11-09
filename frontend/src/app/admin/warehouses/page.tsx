import type { Metadata } from "next";
import Link from "next/link";
import { BoxesIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Pagination } from "@/components/ui/pagination";
import { getSessionToken, requireAdmin } from "@/features/auth/session";
import { fetchAdminWarehouses } from "@/features/admin/api";
import {
  ESTADO_BODEGA_LABEL,
  TIPO_BODEGA_LABEL,
  estadoBodegaTone,
  formatFechaHora
} from "@/features/admin/format";
import { isAdminResourceId } from "@/features/admin/ids";
import type { EstadoBodega } from "@/features/admin/types";
import { toActionError } from "@/lib/action-state";

export const metadata: Metadata = {
  title: "Almacenes"
};

const PAGE_SIZE = 20;

const ESTADOS: readonly EstadoBodega[] = ["ACTIVA", "INACTIVA"];

type WarehousesPageProps = {
  searchParams: Promise<{
    estado?: string | string[] | undefined;
    vendedorId?: string | string[] | undefined;
    search?: string | string[] | undefined;
    page?: string | string[] | undefined;
  }>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminWarehousesPage({
  searchParams
}: WarehousesPageProps) {
  await requireAdmin("/admin/warehouses");
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  const params = await searchParams;
  const rawEstado = first(params.estado);
  const estado = ESTADOS.includes(rawEstado as EstadoBodega)
    ? (rawEstado as EstadoBodega)
    : undefined;
  const rawVendedorId = first(params.vendedorId);
  const vendedorId =
    rawVendedorId && isAdminResourceId(rawVendedorId) ? rawVendedorId : undefined;
  const search = first(params.search)?.trim() || undefined;
  const rawPage = Number.parseInt(first(params.page) ?? "1", 10);
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;

  let result: Awaited<ReturnType<typeof fetchAdminWarehouses>>;
  try {
    result = await fetchAdminWarehouses(token, {
      ...(estado ? { estado } : {}),
      ...(vendedorId ? { vendedorId } : {}),
      ...(search ? { search } : {}),
      page,
      pageSize: PAGE_SIZE
    });
  } catch (error) {
    const state = toActionError(error, "No pudimos cargar los almacenes.");
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
          <h1>Almacenes</h1>
          <p>
            Consulta de las bodegas registradas, su vendedor asociado, su ubicación
            y sus conteos de productos e inventario. No se cambian propietarios ni
            se eliminan almacenes desde esta pantalla.
          </p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <form className="filters-row" method="get" action="/admin/warehouses">
            <label htmlFor="search">Buscar</label>
            <input
              id="search"
              name="search"
              type="search"
              defaultValue={search ?? ""}
              placeholder="Nombre o ubicación"
              maxLength={120}
            />
            <label htmlFor="estado">Estado</label>
            <select id="estado" name="estado" defaultValue={estado ?? ""}>
              <option value="">Todos los estados</option>
              {ESTADOS.map((value) => (
                <option key={value} value={value}>
                  {ESTADO_BODEGA_LABEL[value]}
                </option>
              ))}
            </select>
            <button className="btn btn-secondary btn-sm" type="submit">
              Filtrar
            </button>
          </form>

          <p className="form-hint">
            {result.total} {result.total === 1 ? "almacén" : "almacenes"} en total.
          </p>

          {result.items.length === 0 ? (
            <EmptyState
              icon={<BoxesIcon width={24} height={24} />}
              title="No hay almacenes para este filtro"
              description="Cuando existan bodegas que coincidan con la búsqueda, aparecerán aquí."
            />
          ) : (
            <div className="seller-table-wrap">
              <table className="seller-table">
                <caption className="sr-only">Almacenes registrados</caption>
                <thead>
                  <tr>
                    <th scope="col">Almacén</th>
                    <th scope="col">Tipo</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Vendedor</th>
                    <th scope="col">Productos</th>
                    <th scope="col">Disponible</th>
                    <th scope="col">Registro</th>
                    <th scope="col">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((warehouse) => (
                    <tr key={warehouse.id}>
                      <td>
                        <strong>{warehouse.nombre}</strong>
                        <span className="seller-product-meta">
                          {warehouse.ubicacion}
                        </span>
                      </td>
                      <td>{TIPO_BODEGA_LABEL[warehouse.tipo]}</td>
                      <td>
                        <Badge tone={estadoBodegaTone(warehouse.estado)}>
                          {ESTADO_BODEGA_LABEL[warehouse.estado]}
                        </Badge>
                      </td>
                      <td>
                        {warehouse.vendedorNombre ?? "Marketplace"}
                        {warehouse.vendedorCorreo ? (
                          <span className="seller-product-meta">
                            {warehouse.vendedorCorreo}
                          </span>
                        ) : null}
                      </td>
                      <td>{warehouse.productosCount}</td>
                      <td>{warehouse.inventarioDisponible}</td>
                      <td>{formatFechaHora(warehouse.creadaEn)}</td>
                      <td>
                        <Link
                          className="text-link"
                          href={`/admin/warehouses/${warehouse.id}`}
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
            basePath="/admin/warehouses"
            query={{ estado, vendedorId, search }}
          />
        </div>
      </section>
    </>
  );
}
