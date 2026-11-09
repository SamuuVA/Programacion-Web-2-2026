import type { Metadata } from "next";
import Link from "next/link";
import { BoxesIcon } from "@/components/icons";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Pagination } from "@/components/ui/pagination";
import { getSessionToken, requireAdmin } from "@/features/auth/session";
import { fetchAdminMovements } from "@/features/admin/api";
import { MOVIMIENTO_LABEL, formatFechaHora } from "@/features/admin/format";
import { isAdminResourceId } from "@/features/admin/ids";
import { toActionError } from "@/lib/action-state";

export const metadata: Metadata = {
  title: "Movimientos de inventario"
};

const PAGE_SIZE = 30;

type MovementsPageProps = {
  searchParams: Promise<{
    bodegaId?: string | string[] | undefined;
    productoId?: string | string[] | undefined;
    page?: string | string[] | undefined;
  }>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminMovementsPage({
  searchParams
}: MovementsPageProps) {
  await requireAdmin("/admin/inventory/movements");
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  const params = await searchParams;
  const rawBodegaId = first(params.bodegaId);
  const bodegaId =
    rawBodegaId && isAdminResourceId(rawBodegaId) ? rawBodegaId : undefined;
  const rawProductoId = first(params.productoId);
  const productoId =
    rawProductoId && isAdminResourceId(rawProductoId) ? rawProductoId : undefined;
  const rawPage = Number.parseInt(first(params.page) ?? "1", 10);
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;

  let result: Awaited<ReturnType<typeof fetchAdminMovements>>;
  try {
    result = await fetchAdminMovements(token, {
      ...(bodegaId ? { bodegaId } : {}),
      ...(productoId ? { productoId } : {}),
      page,
      pageSize: PAGE_SIZE
    });
  } catch (error) {
    const state = toActionError(error, "No pudimos cargar los movimientos.");
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
          <nav className="breadcrumbs" aria-label="Ruta de navegación">
            <Link href="/admin/inventory">Inventario</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Movimientos</span>
          </nav>
          <p className="eyebrow">Administración</p>
          <h1>Movimientos de inventario</h1>
          <p>
            Registro de solo lectura de los movimientos de stock. La vista omite el
            actor del movimiento y no permite registrar ajustes.
          </p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <form
            className="filters-row"
            method="get"
            action="/admin/inventory/movements"
          >
            <label htmlFor="bodegaId">Bodega</label>
            <input
              id="bodegaId"
              name="bodegaId"
              type="text"
              defaultValue={bodegaId ?? ""}
              placeholder="UUID de la bodega"
            />
            <label htmlFor="productoId">Producto</label>
            <input
              id="productoId"
              name="productoId"
              type="text"
              defaultValue={productoId ?? ""}
              placeholder="UUID del producto"
            />
            <button className="btn btn-secondary btn-sm" type="submit">
              Filtrar
            </button>
          </form>

          <p className="form-hint">
            {result.total}{" "}
            {result.total === 1 ? "movimiento registrado" : "movimientos registrados"}.
          </p>

          {result.items.length === 0 ? (
            <EmptyState
              icon={<BoxesIcon width={24} height={24} />}
              title="Sin movimientos de inventario"
              description="Cuando se registren ingresos, reservas o salidas, aparecerán aquí."
            />
          ) : (
            <div className="seller-table-wrap">
              <table className="seller-table">
                <caption className="sr-only">Movimientos de inventario</caption>
                <thead>
                  <tr>
                    <th scope="col">Producto</th>
                    <th scope="col">Bodega</th>
                    <th scope="col">Vendedor</th>
                    <th scope="col">Tipo</th>
                    <th scope="col">Cantidad</th>
                    <th scope="col">Referencia</th>
                    <th scope="col">Motivo</th>
                    <th scope="col">Ocurrido</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((movement) => (
                    <tr key={movement.id}>
                      <td>
                        <strong>
                          <Link href={`/admin/products/${movement.productoId}`}>
                            {movement.productoNombre}
                          </Link>
                        </strong>
                        <span className="seller-product-meta">
                          SKU {movement.sku}
                        </span>
                      </td>
                      <td>
                        <Link
                          className="text-link"
                          href={`/admin/warehouses/${movement.bodegaId}`}
                        >
                          {movement.bodegaNombre}
                        </Link>
                      </td>
                      <td>{movement.vendedorNombre}</td>
                      <td>{MOVIMIENTO_LABEL[movement.tipo] ?? movement.tipo}</td>
                      <td>{movement.cantidad}</td>
                      <td>
                        {movement.referenciaTipo} {movement.referenciaId}
                      </td>
                      <td>{movement.motivo ?? "—"}</td>
                      <td>{formatFechaHora(movement.ocurridoEn)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Pagination
            page={result.page}
            totalPages={totalPages}
            basePath="/admin/inventory/movements"
            query={{ bodegaId, productoId }}
          />
        </div>
      </section>
    </>
  );
}
