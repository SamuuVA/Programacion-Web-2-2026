import type { Metadata } from "next";
import { BoxesIcon } from "@/components/icons";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { getSessionToken, requireLogistics } from "@/features/auth/session";
import { fetchLogisticsInventory } from "@/features/logistics/api";
import { formatFechaHora } from "@/features/logistics/format";
import { toActionError } from "@/lib/action-state";

export const metadata: Metadata = {
  title: "Inventario"
};

export default async function LogisticsInventoryPage() {
  await requireLogistics("/logistics/inventory");
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  let positions: Awaited<ReturnType<typeof fetchLogisticsInventory>>;
  try {
    positions = await fetchLogisticsInventory(token);
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

  return (
    <>
      <section className="page-head">
        <div className="container">
          <p className="eyebrow">Operación</p>
          <h1>Inventario de tus bodegas</h1>
          <p>
            Consulta de solo lectura. El operador logístico no registra ingresos
            ni ajusta cantidades; el despacho descuenta existencias y consume
            reservas a través de su caso de uso.
          </p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          {positions.length === 0 ? (
            <EmptyState
              icon={<BoxesIcon width={24} height={24} />}
              title="Sin inventario en tu ámbito"
              description="Cuando los vendedores registren stock en tus bodegas asignadas, aparecerá aquí."
            />
          ) : (
            <div className="seller-table-wrap">
              <table className="seller-table">
                <caption className="sr-only">
                  Inventario por producto y bodega asignada
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Producto</th>
                    <th scope="col">Bodega</th>
                    <th scope="col">En mano</th>
                    <th scope="col">Reservado</th>
                    <th scope="col">No disponible</th>
                    <th scope="col">Disponible</th>
                    <th scope="col">Actualizado</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((position) => (
                    <tr key={`${position.productoId}-${position.bodegaId}`}>
                      <td>
                        <strong>{position.productoNombre}</strong>
                        <span className="seller-product-meta">
                          SKU {position.sku}
                        </span>
                      </td>
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
        </div>
      </section>
    </>
  );
}
