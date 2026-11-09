import type { Metadata } from "next";
import Link from "next/link";
import { BoxesIcon } from "@/components/icons";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { getSessionToken, requireSeller } from "@/features/auth/session";
import {
  fetchSellerInventory,
  fetchSellerProducts,
  fetchSellerWarehouses
} from "@/features/seller/api";
import { SellerIngressForm } from "@/features/seller/components/seller-ingress-form";
import { formatFechaHora } from "@/features/seller/format";
import { toActionError } from "@/lib/action-state";

export const metadata: Metadata = {
  title: "Inventario"
};

export default async function SellerInventoryPage() {
  await requireSeller("/seller/inventory");
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  let data: Awaited<ReturnType<typeof loadInventory>>;
  try {
    data = await loadInventory(token);
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

  const { positions, products, warehouses } = data;

  return (
    <>
      <section className="page-head">
        <div className="container">
          <p className="eyebrow">Operación</p>
          <h1>Inventario</h1>
          <p>
            El stock se registra por producto y bodega. Solo puedes registrar
            ingresos; los ajustes negativos y los movimientos logísticos
            pertenecen a otros roles.
          </p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container seller-detail-layout">
          <div className="seller-detail-main">
            {positions.length === 0 ? (
              <EmptyState
                icon={<BoxesIcon width={24} height={24} />}
                title="Sin posiciones de inventario"
                description="Registra un ingreso de stock para tus productos físicos en una bodega activa."
              />
            ) : (
              <div className="seller-table-wrap">
                <table className="seller-table">
                  <caption className="sr-only">
                    Inventario por producto y bodega
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
                      <tr
                        key={`${position.productoId}-${position.bodegaId}`}
                      >
                        <td>
                          <Link
                            className="text-link"
                            href={`/seller/products/${position.productoId}`}
                          >
                            {position.productoNombre}
                          </Link>
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

          <aside className="seller-detail-aside">
            <section className="checkout-block">
              <h2>Registrar ingreso</h2>
              <SellerIngressForm products={products} warehouses={warehouses} />
            </section>
          </aside>
        </div>
      </section>
    </>
  );
}

async function loadInventory(token: string) {
  const [positions, products, warehouses] = await Promise.all([
    fetchSellerInventory(token),
    fetchSellerProducts(token),
    fetchSellerWarehouses(token)
  ]);
  return { positions, products, warehouses };
}
