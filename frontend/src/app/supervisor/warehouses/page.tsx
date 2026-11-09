import type { Metadata } from "next";
import { BoxesIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { getSessionToken, requireSupervisor } from "@/features/auth/session";
import { fetchSupervisorWarehouses } from "@/features/supervisor/api";
import { formatFechaHora } from "@/features/supervisor/format";
import { toActionError } from "@/lib/action-state";

export const metadata: Metadata = {
  title: "Almacenes"
};

export default async function SupervisorWarehousesPage() {
  await requireSupervisor("/supervisor/warehouses");
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  let warehouses: Awaited<ReturnType<typeof fetchSupervisorWarehouses>>;
  try {
    warehouses = await fetchSupervisorWarehouses(token);
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

  return (
    <>
      <section className="page-head">
        <div className="container">
          <p className="eyebrow">Supervisión</p>
          <h1>Almacenes</h1>
          <p>
            Vista de solo lectura de las bodegas del marketplace y de los
            vendedores. No permite crear, editar, activar ni desactivar almacenes.
          </p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          {warehouses.length === 0 ? (
            <EmptyState
              icon={<BoxesIcon width={24} height={24} />}
              title="Sin almacenes registrados"
              description="Cuando existan bodegas de marketplace o de vendedores, aparecerán aquí."
            />
          ) : (
            <div className="order-list">
              {warehouses.map((warehouse) => (
                <article className="order-card" key={warehouse.id}>
                  <div className="order-card-head">
                    <div>
                      <p className="order-card-number">{warehouse.nombre}</p>
                      <p className="order-card-seller">
                        {warehouse.ubicacion} · creada el{" "}
                        {formatFechaHora(warehouse.creadaEn)}
                      </p>
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
                    <span className="seller-product-meta">ID {warehouse.id}</span>
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
