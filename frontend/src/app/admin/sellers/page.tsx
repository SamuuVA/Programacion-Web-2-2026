import type { Metadata } from "next";
import Link from "next/link";
import { StoreIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Pagination } from "@/components/ui/pagination";
import { getSessionToken, requireAdmin } from "@/features/auth/session";
import { fetchAdminSellers } from "@/features/admin/api";
import {
  ESTADO_USUARIO_LABEL,
  ESTADO_VENDEDOR_LABEL,
  estadoUsuarioTone,
  estadoVendedorTone,
  formatFechaHora
} from "@/features/admin/format";
import type { EstadoVendedor } from "@/features/admin/types";
import { toActionError } from "@/lib/action-state";

export const metadata: Metadata = {
  title: "Vendedores"
};

const PAGE_SIZE = 20;

const ESTADOS: readonly EstadoVendedor[] = [
  "EN_REVISION",
  "ACTIVO",
  "SUSPENDIDO",
  "INACTIVO"
];

type SellersPageProps = {
  searchParams: Promise<{
    estado?: string | string[] | undefined;
    search?: string | string[] | undefined;
    page?: string | string[] | undefined;
  }>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminSellersPage({ searchParams }: SellersPageProps) {
  await requireAdmin("/admin/sellers");
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  const params = await searchParams;
  const rawEstado = first(params.estado);
  const estado = ESTADOS.includes(rawEstado as EstadoVendedor)
    ? (rawEstado as EstadoVendedor)
    : undefined;
  const search = first(params.search)?.trim() || undefined;
  const rawPage = Number.parseInt(first(params.page) ?? "1", 10);
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;

  let result: Awaited<ReturnType<typeof fetchAdminSellers>>;
  try {
    result = await fetchAdminSellers(token, {
      ...(estado ? { estado } : {}),
      ...(search ? { search } : {}),
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
          <p className="eyebrow">Administración</p>
          <h1>Vendedores</h1>
          <p>
            Consulta de los vendedores registrados y sus conteos operativos. El
            alta de un vendedor crea también su primera bodega en una sola
            transacción.
          </p>
          <div className="seller-head-meta">
            <StoreIcon width={18} height={18} />
            <span>El registro sigue disponible desde el alta administrativa.</span>
          </div>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <div className="seller-quick-links">
            <Link className="btn btn-primary" href="/admin/sellers/new">
              <StoreIcon width={18} height={18} /> Registrar vendedor
            </Link>
          </div>

          <form className="filters-row" method="get" action="/admin/sellers">
            <label htmlFor="search">Buscar</label>
            <input
              id="search"
              name="search"
              type="search"
              defaultValue={search ?? ""}
              placeholder="Nombre comercial o correo"
              maxLength={120}
            />
            <label htmlFor="estado">Estado</label>
            <select id="estado" name="estado" defaultValue={estado ?? ""}>
              <option value="">Todos los estados</option>
              {ESTADOS.map((value) => (
                <option key={value} value={value}>
                  {ESTADO_VENDEDOR_LABEL[value]}
                </option>
              ))}
            </select>
            <button className="btn btn-secondary btn-sm" type="submit">
              Filtrar
            </button>
          </form>

          <p className="form-hint">
            {result.total} {result.total === 1 ? "vendedor" : "vendedores"} en total.
          </p>

          {result.items.length === 0 ? (
            <EmptyState
              icon={<StoreIcon width={24} height={24} />}
              title="No hay vendedores para este filtro"
              description="Cuando existan vendedores que coincidan con la búsqueda, aparecerán aquí."
            />
          ) : (
            <div className="seller-table-wrap">
              <table className="seller-table">
                <caption className="sr-only">Vendedores registrados</caption>
                <thead>
                  <tr>
                    <th scope="col">Vendedor</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Cuenta</th>
                    <th scope="col">Productos</th>
                    <th scope="col">Bodegas</th>
                    <th scope="col">Disponible</th>
                    <th scope="col">Registro</th>
                    <th scope="col">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((seller) => (
                    <tr key={seller.id}>
                      <td>
                        <strong>{seller.nombreComercial}</strong>
                        <span className="seller-product-meta">
                          {seller.correoElectronico}
                        </span>
                      </td>
                      <td>
                        <Badge tone={estadoVendedorTone(seller.estado)}>
                          {ESTADO_VENDEDOR_LABEL[seller.estado]}
                        </Badge>
                      </td>
                      <td>
                        <Badge tone={estadoUsuarioTone(seller.usuarioEstado)}>
                          {ESTADO_USUARIO_LABEL[seller.usuarioEstado] ??
                            seller.usuarioEstado}
                        </Badge>
                      </td>
                      <td>
                        <strong>{seller.productosCount}</strong>
                        <span className="seller-product-meta">
                          {seller.productosPublicadosCount} publicados
                        </span>
                      </td>
                      <td>{seller.bodegasCount}</td>
                      <td>{seller.inventarioDisponible}</td>
                      <td>{formatFechaHora(seller.creadoEn)}</td>
                      <td>
                        <Link
                          className="text-link"
                          href={`/admin/sellers/${seller.id}`}
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
            basePath="/admin/sellers"
            query={{ estado, search }}
          />
        </div>
      </section>
    </>
  );
}
