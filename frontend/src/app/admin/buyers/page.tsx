import type { Metadata } from "next";
import Link from "next/link";
import { UserIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Pagination } from "@/components/ui/pagination";
import { getSessionToken, requireAdmin } from "@/features/auth/session";
import { fetchAdminBuyers } from "@/features/admin/api";
import {
  ESTADO_COMPRADOR_LABEL,
  ESTADO_USUARIO_LABEL,
  estadoCompradorTone,
  estadoUsuarioTone,
  formatFechaHora
} from "@/features/admin/format";
import type { EstadoComprador } from "@/features/admin/types";
import { toActionError } from "@/lib/action-state";

export const metadata: Metadata = {
  title: "Compradores"
};

const PAGE_SIZE = 20;

const ESTADOS: readonly EstadoComprador[] = ["HABILITADO", "RESTRINGIDO"];

type BuyersPageProps = {
  searchParams: Promise<{
    estadoComercial?: string | string[] | undefined;
    search?: string | string[] | undefined;
    page?: string | string[] | undefined;
  }>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminBuyersPage({ searchParams }: BuyersPageProps) {
  await requireAdmin("/admin/buyers");
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  const params = await searchParams;
  const rawEstado = first(params.estadoComercial);
  const estadoComercial = ESTADOS.includes(rawEstado as EstadoComprador)
    ? (rawEstado as EstadoComprador)
    : undefined;
  const search = first(params.search)?.trim() || undefined;
  const rawPage = Number.parseInt(first(params.page) ?? "1", 10);
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;

  let result: Awaited<ReturnType<typeof fetchAdminBuyers>>;
  try {
    result = await fetchAdminBuyers(token, {
      ...(estadoComercial ? { estadoComercial } : {}),
      ...(search ? { search } : {}),
      page,
      pageSize: PAGE_SIZE
    });
  } catch (error) {
    const state = toActionError(error, "No pudimos cargar los compradores.");
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
          <h1>Compradores</h1>
          <p>
            Consulta de los compradores existentes y su estado comercial. El
            registro público de compradores y la solicitud para convertirse en
            vendedor pertenecen a una fase posterior y no están disponibles.
          </p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <form className="filters-row" method="get" action="/admin/buyers">
            <label htmlFor="search">Buscar</label>
            <input
              id="search"
              name="search"
              type="search"
              defaultValue={search ?? ""}
              placeholder="Nombre o correo"
              maxLength={120}
            />
            <label htmlFor="estadoComercial">Estado comercial</label>
            <select
              id="estadoComercial"
              name="estadoComercial"
              defaultValue={estadoComercial ?? ""}
            >
              <option value="">Todos los estados</option>
              {ESTADOS.map((value) => (
                <option key={value} value={value}>
                  {ESTADO_COMPRADOR_LABEL[value]}
                </option>
              ))}
            </select>
            <button className="btn btn-secondary btn-sm" type="submit">
              Filtrar
            </button>
          </form>

          <p className="form-hint">
            {result.total}{" "}
            {result.total === 1 ? "comprador registrado" : "compradores registrados"}.
          </p>

          {result.items.length === 0 ? (
            <EmptyState
              icon={<UserIcon width={24} height={24} />}
              title="No hay compradores para este filtro"
              description="Cuando existan compradores que coincidan con la búsqueda, aparecerán aquí."
            />
          ) : (
            <div className="seller-table-wrap">
              <table className="seller-table">
                <caption className="sr-only">Compradores registrados</caption>
                <thead>
                  <tr>
                    <th scope="col">Comprador</th>
                    <th scope="col">Estado comercial</th>
                    <th scope="col">Cuenta</th>
                    <th scope="col">Pedidos</th>
                    <th scope="col">Registro</th>
                    <th scope="col">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((buyer) => (
                    <tr key={buyer.id}>
                      <td>
                        <strong>{buyer.nombreCompleto}</strong>
                        <span className="seller-product-meta">
                          {buyer.correoElectronico}
                        </span>
                      </td>
                      <td>
                        <Badge tone={estadoCompradorTone(buyer.estadoComercial)}>
                          {ESTADO_COMPRADOR_LABEL[buyer.estadoComercial]}
                        </Badge>
                      </td>
                      <td>
                        <Badge tone={estadoUsuarioTone(buyer.usuarioEstado)}>
                          {ESTADO_USUARIO_LABEL[buyer.usuarioEstado] ??
                            buyer.usuarioEstado}
                        </Badge>
                      </td>
                      <td>
                        <strong>{buyer.pedidosCount}</strong>
                      </td>
                      <td>{formatFechaHora(buyer.creadoEn)}</td>
                      <td>
                        <Link
                          className="text-link"
                          href={`/admin/buyers/${buyer.id}`}
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
            basePath="/admin/buyers"
            query={{ estadoComercial, search }}
          />
        </div>
      </section>
    </>
  );
}
