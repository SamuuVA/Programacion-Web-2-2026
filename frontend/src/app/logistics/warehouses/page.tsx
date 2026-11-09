import type { Metadata } from "next";
import { BoxesIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { getSessionToken, requireLogistics } from "@/features/auth/session";
import { fetchLogisticsWarehouses } from "@/features/logistics/api";
import { toActionError } from "@/lib/action-state";

export const metadata: Metadata = {
  title: "Bodegas"
};

export default async function LogisticsWarehousesPage() {
  await requireLogistics("/logistics/warehouses");
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  let warehouses: Awaited<ReturnType<typeof fetchLogisticsWarehouses>>;
  try {
    warehouses = await fetchLogisticsWarehouses(token);
  } catch (error) {
    const state = toActionError(error, "No pudimos cargar las bodegas.");
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
          <p className="eyebrow">Ámbito autorizado</p>
          <h1>Bodegas asignadas</h1>
          <p>
            Solo puedes operar envíos y reservas de estas bodegas. La asignación
            la realiza un administrador; el operador logístico no crea ni edita
            bodegas.
          </p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          {warehouses.length === 0 ? (
            <EmptyState
              icon={<BoxesIcon width={24} height={24} />}
              title="Sin bodegas asignadas"
              description="Solicita a un administrador que asigne al menos una bodega activa a tu perfil logístico."
            />
          ) : (
            <div className="order-list">
              {warehouses.map((warehouse) => (
                <article className="order-card" key={warehouse.id}>
                  <div className="order-card-head">
                    <div>
                      <p className="order-card-number">{warehouse.nombre}</p>
                      <p className="order-card-seller">{warehouse.ubicacion}</p>
                    </div>
                    <div className="order-card-badges">
                      <Badge tone={warehouse.estado === "ACTIVA" ? "success" : "danger"}>
                        {warehouse.estado === "ACTIVA" ? "Activa" : "Inactiva"}
                      </Badge>
                      <Badge tone="neutral">
                        {warehouse.tipo === "VENDEDOR" ? "Vendedor" : "Marketplace"}
                      </Badge>
                    </div>
                  </div>
                  <div className="order-card-meta">
                    <span>
                      {warehouse.vendedorNombre
                        ? `Vendedor: ${warehouse.vendedorNombre}`
                        : "Bodega del marketplace"}
                    </span>
                    <span className="seller-product-meta">
                      ID {warehouse.id}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
