import type { Metadata } from "next";
import Link from "next/link";
import { UserIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Pagination } from "@/components/ui/pagination";
import { getSessionToken, requireAdmin } from "@/features/auth/session";
import { fetchAdminUsers } from "@/features/admin/api";
import {
  ESTADO_USUARIO_LABEL,
  ROL_LABEL,
  estadoUsuarioTone,
  formatFechaHora
} from "@/features/admin/format";
import type { EstadoUsuario, RolSistema } from "@/features/admin/types";
import { toActionError } from "@/lib/action-state";

export const metadata: Metadata = {
  title: "Usuarios"
};

const PAGE_SIZE = 20;

const ROLES: readonly RolSistema[] = [
  "COMPRADOR",
  "VENDEDOR",
  "OPERADOR_LOGISTICO",
  "ADMINISTRADOR",
  "SUPERVISOR"
];

const ESTADOS: readonly EstadoUsuario[] = ["ACTIVO", "INACTIVO", "BLOQUEADO"];

type UsersPageProps = {
  searchParams: Promise<{
    rol?: string | string[] | undefined;
    estado?: string | string[] | undefined;
    search?: string | string[] | undefined;
    page?: string | string[] | undefined;
  }>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminUsersPage({ searchParams }: UsersPageProps) {
  await requireAdmin("/admin/users");
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  const params = await searchParams;
  const rawRol = first(params.rol);
  const rol = ROLES.includes(rawRol as RolSistema)
    ? (rawRol as RolSistema)
    : undefined;
  const rawEstado = first(params.estado);
  const estado = ESTADOS.includes(rawEstado as EstadoUsuario)
    ? (rawEstado as EstadoUsuario)
    : undefined;
  const search = first(params.search)?.trim() || undefined;
  const rawPage = Number.parseInt(first(params.page) ?? "1", 10);
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;

  let result: Awaited<ReturnType<typeof fetchAdminUsers>>;
  try {
    result = await fetchAdminUsers(token, {
      ...(rol ? { rol } : {}),
      ...(estado ? { estado } : {}),
      ...(search ? { search } : {}),
      page,
      pageSize: PAGE_SIZE
    });
  } catch (error) {
    const state = toActionError(error, "No pudimos cargar los usuarios.");
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
          <h1>Usuarios</h1>
          <p>
            Consulta de las cuentas registradas y su rol principal. No se expone
            contraseña, hash, token, documento ni información de sesión. El rol no
            se modifica desde esta pantalla.
          </p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <form className="filters-row" method="get" action="/admin/users">
            <label htmlFor="search">Buscar</label>
            <input
              id="search"
              name="search"
              type="search"
              defaultValue={search ?? ""}
              placeholder="Nombre o correo"
              maxLength={120}
            />
            <label htmlFor="rol">Rol</label>
            <select id="rol" name="rol" defaultValue={rol ?? ""}>
              <option value="">Todos los roles</option>
              {ROLES.map((value) => (
                <option key={value} value={value}>
                  {ROL_LABEL[value] ?? value}
                </option>
              ))}
            </select>
            <label htmlFor="estado">Estado</label>
            <select id="estado" name="estado" defaultValue={estado ?? ""}>
              <option value="">Todos los estados</option>
              {ESTADOS.map((value) => (
                <option key={value} value={value}>
                  {ESTADO_USUARIO_LABEL[value] ?? value}
                </option>
              ))}
            </select>
            <button className="btn btn-secondary btn-sm" type="submit">
              Filtrar
            </button>
          </form>

          <p className="form-hint">
            {result.total} {result.total === 1 ? "usuario" : "usuarios"} en total.
          </p>

          {result.items.length === 0 ? (
            <EmptyState
              icon={<UserIcon width={24} height={24} />}
              title="No hay usuarios para este filtro"
              description="Cuando existan cuentas que coincidan con la búsqueda, aparecerán aquí."
            />
          ) : (
            <div className="seller-table-wrap">
              <table className="seller-table">
                <caption className="sr-only">Usuarios registrados</caption>
                <thead>
                  <tr>
                    <th scope="col">Usuario</th>
                    <th scope="col">Rol</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Registro</th>
                    <th scope="col">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <strong>{user.nombreCompleto}</strong>
                        <span className="seller-product-meta">
                          {user.correoElectronico}
                        </span>
                      </td>
                      <td>{ROL_LABEL[user.rol] ?? user.rol}</td>
                      <td>
                        <Badge tone={estadoUsuarioTone(user.estado)}>
                          {ESTADO_USUARIO_LABEL[user.estado] ?? user.estado}
                        </Badge>
                      </td>
                      <td>{formatFechaHora(user.creadoEn)}</td>
                      <td>
                        <Link className="text-link" href={`/admin/users/${user.id}`}>
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
            basePath="/admin/users"
            query={{
              rol,
              estado,
              search
            }}
          />
        </div>
      </section>
    </>
  );
}
