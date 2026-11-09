import type { Metadata } from "next";
import { BoxesIcon } from "@/components/icons";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Pagination } from "@/components/ui/pagination";
import { getSessionToken, requireSupervisor } from "@/features/auth/session";
import {
  fetchSupervisorInventory,
  fetchSupervisorWarehouses
} from "@/features/supervisor/api";
import { formatFechaHora } from "@/features/supervisor/format";
import { isSupervisorResourceId } from "@/features/supervisor/ids";
import { toActionError } from "@/lib/action-state";

export const metadata: Metadata = {
  title: "Inventario"
};

const PAGE_SIZE = 20;

type InventoryPageProps = {
  searchParams: Promise<{
    bodegaId?: string | string[] | undefined;
    page?: string | string[] | undefined;
  }>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SupervisorInventoryPage({
  searchParams
}: InventoryPageProps) {
  await requireSupervisor("/supervisor/inventory");
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  const params = await searchParams;
  const rawBodegaId = first(params.bodegaId);
  const bodegaId =
    rawBodegaId && isSupervisorResourceId(rawBodegaId) ? rawBodegaId : undefined;
  const rawPage = Number.parseInt(first(params.page) ?? "1", 10);
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;

  let warehouses: Awaited<ReturnType<typeof fetchSupervisorWarehouses>>;
  let result: Awaited<ReturnType<typeof fetchSupervisorInventory>>;
  try {
    [warehouses, result] = await Promise.all([
      fetchSupervisorWarehouses(token),
      fetchSupervisorInventory(token, {
        ...(bodegaId ? { bodegaId } : {}),
        page,
        pageSize: PAGE_SIZE
      })
    ]);
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
          <p className="eyebrow">Supervisión</p>
          <h1>Inventario</h1>
          <p>
            Consulta de solo lectura de las posiciones por producto y bodega. El
            disponible se calcula con la fórmula definida en `INV-03`: `on_hand -
            reserved - unavailable`. No permite ingresar, ajustar ni dar de baja
            existencias.
          </p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <form className="filters-row" method="get" action="/supervisor/inventory">
            <label htmlFor="bodegaId">Bodega</label>
            <select id="bodegaId" name="bodegaId" defaultValue={bodegaId ?? ""}>
              <option value="">Todas las bodegas</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.nombre}
                  {warehouse.vendedorNombre
                    ? ` · ${warehouse.vendedorNombre}`
                    : " · Marketplace"}
                </option>
              ))}
            </select>
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
                  Inventario por producto y bodega en supervisión
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
                        <strong>{position.productoNombre}</strong>
                        <span className="seller-product-meta">
                          SKU {position.sku}
                        </span>
                      </td>
                      <td>{position.bodegaNombre}</td>
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
            basePath="/supervisor/inventory"
            query={{ bodegaId }}
          />
        </div>
      </section>
    </>
  );
}
