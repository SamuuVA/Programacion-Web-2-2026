import type { Metadata } from "next";
import Link from "next/link";
import { StoreIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Pagination } from "@/components/ui/pagination";
import { getSessionToken, requireSupervisor } from "@/features/auth/session";
import { fetchSupervisorSellers } from "@/features/supervisor/api";
import {
  ESTADO_VENDEDOR_LABEL,
  estadoVendedorTone,
  formatFechaHora
} from "@/features/supervisor/format";
import type { EstadoVendedor } from "@/features/supervisor/types";
import { toActionError } from "@/lib/action-state";

export const metadata: Metadata = {
  title: "Vendedores"
};

const PAGE_SIZE = 20;

const FILTROS: readonly { value: "" | EstadoVendedor; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "EN_REVISION", label: "En revisión" },
  { value: "ACTIVO", label: "Activos" },
  { value: "SUSPENDIDO", label: "Suspendidos" },
  { value: "INACTIVO", label: "Inactivos" }
];

type SellersPageProps = {
  searchParams: Promise<{
    estado?: string | string[] | undefined;
    page?: string | string[] | undefined;
  }>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SupervisorSellersPage({
  searchParams
}: SellersPageProps) {
  await requireSupervisor("/supervisor/sellers");
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  const params = await searchParams;
  const rawEstado = first(params.estado);
  const estado = FILTROS.some((filtro) => filtro.value === rawEstado)
    ? (rawEstado as EstadoVendedor | "")
    : "";
  const rawPage = Number.parseInt(first(params.page) ?? "1", 10);
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;

  let result: Awaited<ReturnType<typeof fetchSupervisorSellers>>;
  try {
    result = await fetchSupervisorSellers(token, {
      ...(estado ? { estado } : {}),
      page,
      pageSize: PAGE_SIZE
    });
  } catch (error) {
    const state = toActionError(error, "No pudimos cargar los vendedores.");
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
          <h1>Vendedores</h1>
          <p>
            Consulta del estado y los conteos operativos de cada vendedor. No se
            publican correo, documento ni datos personales, y esta pantalla no
            permite aprobar, suspender ni modificar cuentas.
          </p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <div className="seller-quick-links" aria-label="Filtrar vendedores">
            {FILTROS.map((filtro) => (
              <Link
                key={filtro.value || "todos"}
                className={
                  estado === filtro.value
                    ? "btn btn-primary btn-sm"
                    : "btn btn-ghost btn-sm"
                }
                href={
                  filtro.value
                    ? `/supervisor/sellers?estado=${filtro.value}`
                    : "/supervisor/sellers"
                }
              >
                {filtro.label}
              </Link>
            ))}
          </div>

          <p className="form-hint">
            {result.total} {result.total === 1 ? "vendedor" : "vendedores"} en total.
          </p>

          {result.items.length === 0 ? (
            <EmptyState
              icon={<StoreIcon width={24} height={24} />}
              title="No hay vendedores para este filtro"
              description="Cuando existan vendedores en el estado seleccionado, aparecerán aquí."
            />
          ) : (
            <div className="order-list">
              {result.items.map((seller) => (
                <article className="order-card" key={seller.id}>
                  <div className="order-card-head">
                    <div>
                      <p className="order-card-number">{seller.nombreComercial}</p>
                      <p className="order-card-seller">
                        Registrado el {formatFechaHora(seller.creadoEn)}
                      </p>
                    </div>
                    <Badge tone={estadoVendedorTone(seller.estado)}>
                      {ESTADO_VENDEDOR_LABEL[seller.estado]}
                    </Badge>
                  </div>
                  <div className="order-card-meta">
                    <span>
                      {seller.productosCount}{" "}
                      {seller.productosCount === 1 ? "producto" : "productos"} ·{" "}
                      {seller.productosPublicadosCount} publicados
                    </span>
                    <span>
                      {seller.bodegasCount}{" "}
                      {seller.bodegasCount === 1 ? "bodega" : "bodegas"}
                    </span>
                    <strong>{seller.inventarioDisponible} unidades disponibles</strong>
                  </div>
                  <Link
                    className="text-link"
                    href={`/supervisor/products?vendedorId=${seller.id}`}
                  >
                    Ver productos
                  </Link>
                </article>
              ))}
            </div>
          )}

          <Pagination
            page={result.page}
            totalPages={totalPages}
            basePath="/supervisor/sellers"
            query={{ estado: estado || undefined }}
          />
        </div>
      </section>
    </>
  );
}
