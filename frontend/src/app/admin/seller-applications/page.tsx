import type { Metadata } from "next";
import Link from "next/link";
import { StoreIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Pagination } from "@/components/ui/pagination";
import { getSessionToken, requireAdmin } from "@/features/auth/session";
import { fetchAdminSellerApplications } from "@/features/seller-applications/api";
import {
  ESTADO_SOLICITUD_LABEL,
  estadoSolicitudTone
} from "@/features/seller-applications/format";
import type { EstadoSolicitudVendedor } from "@/features/seller-applications/types";
import { formatFechaHora } from "@/features/admin/format";
import { toActionError } from "@/lib/action-state";

export const metadata: Metadata = {
  title: "Solicitudes de vendedor"
};

const PAGE_SIZE = 20;

const ESTADOS: readonly EstadoSolicitudVendedor[] = [
  "PENDIENTE",
  "APROBADA",
  "RECHAZADA"
];

type ApplicationsPageProps = {
  searchParams: Promise<{
    estado?: string | string[] | undefined;
    search?: string | string[] | undefined;
    page?: string | string[] | undefined;
  }>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminSellerApplicationsPage({
  searchParams
}: ApplicationsPageProps) {
  await requireAdmin("/admin/seller-applications");
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  const params = await searchParams;
  const rawEstado = first(params.estado);
  const estado = ESTADOS.includes(rawEstado as EstadoSolicitudVendedor)
    ? (rawEstado as EstadoSolicitudVendedor)
    : undefined;
  const search = first(params.search)?.trim() || undefined;
  const rawPage = Number.parseInt(first(params.page) ?? "1", 10);
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;

  let result: Awaited<ReturnType<typeof fetchAdminSellerApplications>>;
  try {
    result = await fetchAdminSellerApplications(token, {
      ...(estado ? { estado } : {}),
      ...(search ? { search } : {}),
      page,
      pageSize: PAGE_SIZE
    });
  } catch (error) {
    const state = toActionError(error, "No pudimos cargar las solicitudes.");
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
          <h1>Solicitudes de vendedor</h1>
          <p>
            Revisa las solicitudes presentadas por compradores. Aprobar crea el
            vendedor y su primera bodega en una sola transacción; rechazar no crea
            ninguno de los dos.
          </p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <form
            className="filters-row"
            method="get"
            action="/admin/seller-applications"
          >
            <label htmlFor="search">Buscar</label>
            <input
              id="search"
              name="search"
              type="search"
              defaultValue={search ?? ""}
              placeholder="Solicitante, comercio o correo"
              maxLength={120}
            />
            <label htmlFor="estado">Estado</label>
            <select id="estado" name="estado" defaultValue={estado ?? ""}>
              <option value="">Todos los estados</option>
              {ESTADOS.map((value) => (
                <option key={value} value={value}>
                  {ESTADO_SOLICITUD_LABEL[value]}
                </option>
              ))}
            </select>
            <button className="btn btn-secondary btn-sm" type="submit">
              Filtrar
            </button>
          </form>

          <p className="form-hint">
            {result.total}{" "}
            {result.total === 1 ? "solicitud" : "solicitudes"} en total.
          </p>

          {result.items.length === 0 ? (
            <EmptyState
              icon={<StoreIcon width={24} height={24} />}
              title="No hay solicitudes para este filtro"
              description="Cuando un comprador presente una solicitud, aparecerá aquí para revisión."
            />
          ) : (
            <div className="seller-table-wrap">
              <table className="seller-table">
                <caption className="sr-only">Solicitudes de vendedor</caption>
                <thead>
                  <tr>
                    <th scope="col">Solicitante</th>
                    <th scope="col">Comercio</th>
                    <th scope="col">Bodega</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Presentada</th>
                    <th scope="col">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((solicitud) => (
                    <tr key={solicitud.id}>
                      <td>
                        <strong>{solicitud.nombreCompleto}</strong>
                        <span className="seller-product-meta">
                          {solicitud.correoElectronico}
                        </span>
                      </td>
                      <td>{solicitud.nombreComercial}</td>
                      <td>{solicitud.nombreBodega}</td>
                      <td>
                        <Badge tone={estadoSolicitudTone(solicitud.estado)}>
                          {ESTADO_SOLICITUD_LABEL[solicitud.estado]}
                        </Badge>
                      </td>
                      <td>{formatFechaHora(solicitud.creadaEn)}</td>
                      <td>
                        <Link
                          className="text-link"
                          href={`/admin/seller-applications/${solicitud.id}`}
                        >
                          Ver detalle
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Pagination
            page={result.page}
            totalPages={totalPages}
            basePath="/admin/seller-applications"
            query={{ estado, search }}
          />
        </div>
      </section>
    </>
  );
}
