import type { Metadata } from "next";
import Link from "next/link";
import { PackageIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Pagination } from "@/components/ui/pagination";
import { getSessionToken, requireSupervisor } from "@/features/auth/session";
import { fetchSupervisorShipments } from "@/features/supervisor/api";
import {
  ESTADO_ENVIO_LABEL,
  estadoEnvioTone,
  formatFechaHora
} from "@/features/supervisor/format";
import type { EstadoEnvio } from "@/features/supervisor/types";
import { toActionError } from "@/lib/action-state";

export const metadata: Metadata = {
  title: "Envíos"
};

const PAGE_SIZE = 20;

const FILTROS: readonly { value: "" | EstadoEnvio; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "PREPARACION", label: "En preparación" },
  { value: "EMPACADO", label: "Empacados" },
  { value: "DESPACHADO", label: "Despachados" },
  { value: "EN_TRANSITO", label: "En tránsito" },
  { value: "ENTREGADO", label: "Entregados" },
  { value: "FALLIDO", label: "Fallidos" },
  { value: "DEVUELTO", label: "Devueltos" }
];

type ShipmentsPageProps = {
  searchParams: Promise<{
    estado?: string | string[] | undefined;
    page?: string | string[] | undefined;
  }>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SupervisorShipmentsPage({
  searchParams
}: ShipmentsPageProps) {
  await requireSupervisor("/supervisor/shipments");
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  const params = await searchParams;
  const rawEstado = first(params.estado);
  const estado = FILTROS.some((filtro) => filtro.value === rawEstado)
    ? (rawEstado as EstadoEnvio | "")
    : "";
  const rawPage = Number.parseInt(first(params.page) ?? "1", 10);
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;

  let result: Awaited<ReturnType<typeof fetchSupervisorShipments>>;
  try {
    result = await fetchSupervisorShipments(token, {
      ...(estado ? { estado } : {}),
      page,
      pageSize: PAGE_SIZE
    });
  } catch (error) {
    const state = toActionError(error, "No pudimos cargar los envíos.");
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
          <h1>Envíos</h1>
          <p>
            Consulta de los envíos registrados por la operación logística. No
            permite preparar, despachar, entregar ni modificar el transportista o
            el seguimiento.
          </p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <div className="seller-quick-links" aria-label="Filtrar envíos">
            {FILTROS.map((filtro) => (
              <Link
                key={filtro.value || "todos"}
                className={
                  estado === filtro.value ? "btn btn-primary btn-sm" : "btn btn-ghost btn-sm"
                }
                href={
                  filtro.value
                    ? `/supervisor/shipments?estado=${filtro.value}`
                    : "/supervisor/shipments"
                }
              >
                {filtro.label}
              </Link>
            ))}
          </div>

          <p className="form-hint">
            {result.total} {result.total === 1 ? "envío" : "envíos"} en total.
          </p>

          {result.items.length === 0 ? (
            <EmptyState
              icon={<PackageIcon width={24} height={24} />}
              title="No hay envíos para este filtro"
              description="Cuando existan envíos en el estado seleccionado, aparecerán aquí."
            />
          ) : (
            <div className="order-list">
              {result.items.map((shipment) => (
                <article className="order-card" key={shipment.id}>
                  <div className="order-card-head">
                    <div>
                      <p className="order-card-number">{shipment.pedidoNumero}</p>
                      <p className="order-card-seller">
                        {shipment.bodegaNombre} ·{" "}
                        {formatFechaHora(shipment.creadoEn)}
                      </p>
                    </div>
                    <Badge tone={estadoEnvioTone(shipment.estado)}>
                      {ESTADO_ENVIO_LABEL[shipment.estado]}
                    </Badge>
                  </div>
                  <div className="order-card-meta">
                    <span>
                      {shipment.transportista
                        ? `Transportista: ${shipment.transportista}`
                        : "Sin transportista registrado"}
                    </span>
                    <span>
                      {shipment.trackingNumber
                        ? `Seguimiento: ${shipment.trackingNumber}`
                        : "Sin número de seguimiento"}
                    </span>
                    {shipment.despachadoEn ? (
                      <span>Despachado el {formatFechaHora(shipment.despachadoEn)}</span>
                    ) : null}
                    {shipment.entregadoEn ? (
                      <span>Entregado el {formatFechaHora(shipment.entregadoEn)}</span>
                    ) : null}
                  </div>
                  <Link
                    className="text-link"
                    href={`/supervisor/orders/${shipment.pedidoId}`}
                  >
                    Ver pedido
                  </Link>
                </article>
              ))}
            </div>
          )}

          <Pagination
            page={result.page}
            totalPages={totalPages}
            basePath="/supervisor/shipments"
            query={{ estado: estado || undefined }}
          />
        </div>
      </section>
    </>
  );
}
