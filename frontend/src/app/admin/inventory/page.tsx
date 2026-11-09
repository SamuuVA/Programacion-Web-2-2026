import type { Metadata } from "next";
import Link from "next/link";
import { BoxesIcon } from "@/components/icons";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Pagination } from "@/components/ui/pagination";
import { getSessionToken, requireAdmin } from "@/features/auth/session";
import { fetchAdminInventory } from "@/features/admin/api";
import { formatFechaHora } from "@/features/admin/format";
import { isAdminResourceId } from "@/features/admin/ids";
import { toActionError } from "@/lib/action-state";

export const metadata: Metadata = {
  title: "Inventario"
};

const PAGE_SIZE = 20;

type InventoryPageProps = {
  searchParams: Promise<{
    bodegaId?: string | string[] | undefined;
    vendedorId?: string | string[] | undefined;
    search?: string | string[] | undefined;
    page?: string | string[] | undefined;
  }>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminInventoryPage({
  searchParams
}: InventoryPageProps) {
  await requireAdmin("/admin/inventory");
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  const params = await searchParams;
  const rawBodegaId = first(params.bodegaId);
  const bodegaId =
    rawBodegaId && isAdminResourceId(rawBodegaId) ? rawBodegaId : undefined;
  const rawVendedorId = first(params.vendedorId);
  const vendedorId =
    rawVendedorId && isAdminResourceId(rawVendedorId) ? rawVendedorId : undefined;
  const search = first(params.search)?.trim() || undefined;
  const rawPage = Number.parseInt(first(params.page) ?? "1", 10);
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;

  let result: Awaited<ReturnType<typeof fetchAdminInventory>>;
  try {
    result = await fetchAdminInventory(token, {
      ...(bodegaId ? { bodegaId } : {}),
      ...(vendedorId ? { vendedorId } : {}),
      ...(search ? { search } : {}),
      page,
      pageSize: PAGE_SIZE
    });
  } catch (error) {
    const state = toActionError(error, "No pudimos cargar el inventario.");
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
          <h1>Inventario</h1>
          <p>
            Consulta de las posiciones por producto y almacén. El disponible usa la
            fórmula definida en `INV-03`: `on_hand - reserved - unavailable`. No se
            ingresan, ajustan ni dan de baja existencias desde esta pantalla.
          </p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <div className="seller-quick-links">
            <Link className="btn btn-secondary" href="/admin/inventory/movements">
              <BoxesIcon width={18} height={18} /> Ver movimientos
            </Link>
          </div>

          <form className="filters-row" method="get" action="/admin/inventory">
            <label htmlFor="search">Buscar</label>
            <input
              id="search"
              name="search"
              type="search"
              defaultValue={search ?? ""}
              placeholder="Producto o SKU"
              maxLength={120}
            />
            <label htmlFor="bodegaId">Bodega</label>
            <input
              id="bodegaId"
              name="bodegaId"
              type="text"
              defaultValue={bodegaId ?? ""}
              placeholder="UUID de la bodega"
            />
            <button className="btn btn-secondary btn-sm" type="submit">
              Filtrar
            </button>
          </form>

          <p className="form-hint">
            {result.total}{" "}
            {result.total === 1 ? "posición registrada" : "posiciones registradas"}.
          </p>

          {result.items.length === 0 ? (
            <EmptyState
              icon={<BoxesIcon width={24} height={24} />}
              title="Sin posiciones de inventario"
              description="Cuando los vendedores registren stock en sus bodegas, aparecerá aquí."
            />
          ) : (
            <div className="seller-table-wrap">
              <table className="seller-table">
                <caption className="sr-only">
                  Inventario por producto y almacén
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Producto</th>
                    <th scope="col">Bodega</th>
                    <th scope="col">Vendedor</th>
                    <th scope="col">En mano</th>
                    <th scope="col">Reservado</th>
                    <th scope="col">No disponible</th>
                    <th scope="col">Disponible</th>
                    <th scope="col">Actualizado</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((position) => (
                    <tr key={`${position.productoId}-${position.bodegaId}`}>
                      <td>
                        <strong>
                          <Link href={`/admin/products/${position.productoId}`}>
                            {position.productoNombre}
                          </Link>
                        </strong>
                        <span className="seller-product-meta">
                          SKU {position.sku}
                        </span>
                      </td>
                      <td>
                        <Link
                          className="text-link"
                          href={`/admin/warehouses/${position.bodegaId}`}
                        >
                          {position.bodegaNombre}
                        </Link>
                      </td>
                      <td>{position.vendedorNombre ?? "Marketplace"}</td>
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

          <Pagination
            page={result.page}
            totalPages={totalPages}
            basePath="/admin/inventory"
            query={{ bodegaId, vendedorId, search }}
          />
        </div>
      </section>
    </>
  );
}
