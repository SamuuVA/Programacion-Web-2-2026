import type { Metadata } from "next";
import { BoxesIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { getSessionToken, requireSeller } from "@/features/auth/session";
import { fetchSellerWarehouses } from "@/features/seller/api";
import { SellerWarehouseForm } from "@/features/seller/components/seller-warehouse-form";
import { toActionError } from "@/lib/action-state";

export const metadata: Metadata = {
  title: "Mis bodegas"
};

export default async function SellerWarehousesPage() {
  await requireSeller("/seller/warehouses");
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  let warehouses: Awaited<ReturnType<typeof fetchSellerWarehouses>>;
  try {
    warehouses = await fetchSellerWarehouses(token);
  } catch (error) {
    const state = toActionError(error, "No pudimos cargar tus bodegas.");
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
          <h1>Mis bodegas</h1>
          <p>
            Cada posición de inventario pertenece a una bodega propia. Solo las
            bodegas activas admiten ingresos de stock.
          </p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container seller-detail-layout">
          <div className="seller-detail-main">
            {warehouses.length === 0 ? (
              <EmptyState
                icon={<BoxesIcon width={24} height={24} />}
                title="Aún no tienes bodegas"
                description="Crea una bodega para poder registrar inventario de tus productos físicos."
              />
            ) : (
              <div className="seller-card-list">
                {warehouses.map((warehouse) => (
                  <article className="seller-card" key={warehouse.id}>
                    <div className="seller-card-head">
                      <div>
                        <h2>{warehouse.nombre}</h2>
                        <p className="seller-product-meta">
                          {warehouse.ubicacion}
                        </p>
                      </div>
                      <Badge
                        tone={
                          warehouse.estado === "ACTIVA" ? "success" : "neutral"
                        }
                      >
                        {warehouse.estado === "ACTIVA" ? "Activa" : "Inactiva"}
                      </Badge>
                    </div>
                    <details className="seller-disclosure">
                      <summary>Editar bodega</summary>
                      <SellerWarehouseForm mode="edit" warehouse={warehouse} />
                    </details>
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside className="seller-detail-aside">
            <section className="checkout-block">
              <h2>Nueva bodega</h2>
              <SellerWarehouseForm mode="create" />
            </section>
          </aside>
        </div>
      </section>
    </>
  );
}
