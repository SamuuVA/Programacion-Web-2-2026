import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRightIcon, UserIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";
import { getSessionToken, requireAdmin } from "@/features/auth/session";
import { fetchAdminUser } from "@/features/admin/api";
import {
  ESTADO_COMPRADOR_LABEL,
  ESTADO_OPERADOR_LABEL,
  ESTADO_USUARIO_LABEL,
  ESTADO_VENDEDOR_LABEL,
  ROL_LABEL,
  estadoCompradorTone,
  estadoOperadorAdminTone,
  estadoUsuarioTone,
  estadoVendedorTone,
  formatFechaHora
} from "@/features/admin/format";
import { isAdminResourceId } from "@/features/admin/ids";
import { toActionError } from "@/lib/action-state";

type UserPageProps = {
  params: Promise<{ userId: string }>;
};

export async function generateMetadata({
  params
}: UserPageProps): Promise<Metadata> {
  const { userId } = await params;
  if (!isAdminResourceId(userId)) {
    notFound();
  }
  return { title: "Detalle del usuario" };
}

export default async function AdminUserDetailPage({ params }: UserPageProps) {
  const { userId } = await params;
  if (!isAdminResourceId(userId)) {
    notFound();
  }

  await requireAdmin(`/admin/users/${userId}`);
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  let user: Awaited<ReturnType<typeof fetchAdminUser>>;
  try {
    user = await fetchAdminUser(token, userId);
  } catch (error) {
    const state = toActionError(error, "No pudimos cargar el usuario.");
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

  if (!user) {
    notFound();
  }

  return (
    <>
      <section className="page-head">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Ruta de navegación">
            <Link href="/admin/users">Usuarios</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{user.nombreCompleto}</span>
          </nav>
          <p className="eyebrow">Cuenta registrada</p>
          <h1>{user.nombreCompleto}</h1>
          <div className="order-detail-badges">
            <Badge tone="neutral">{ROL_LABEL[user.rol] ?? user.rol}</Badge>
            <Badge tone={estadoUsuarioTone(user.estado)}>
              {ESTADO_USUARIO_LABEL[user.estado] ?? user.estado}
            </Badge>
            <span className="order-detail-date">
              Creado el {formatFechaHora(user.creadoEn)}
            </span>
          </div>
        </div>
      </section>

      <section className="section-tight">
        <div className="container seller-detail-layout">
          <div className="seller-detail-main">
            <section className="checkout-block">
              <h2>Datos de la cuenta</h2>
              <ul className="order-items">
                <li>
                  <span>Nombre completo</span>
                  <strong>{user.nombreCompleto}</strong>
                </li>
                <li>
                  <span>Correo electrónico</span>
                  <strong>{user.correoElectronico}</strong>
                </li>
                <li>
                  <span>Rol principal</span>
                  <strong>{ROL_LABEL[user.rol] ?? user.rol}</strong>
                </li>
                <li>
                  <span>Estado</span>
                  <strong>{ESTADO_USUARIO_LABEL[user.estado] ?? user.estado}</strong>
                </li>
                <li>
                  <span>Actualizado</span>
                  <strong>{formatFechaHora(user.actualizadoEn)}</strong>
                </li>
              </ul>
            </section>

            <section className="checkout-block">
              <h2>Perfil de dominio</h2>
              {user.perfil === null ? (
                <p className="form-hint">
                  Este rol no tiene un perfil de negocio asociado en el modelo
                  actual.
                </p>
              ) : user.perfil.tipo === "COMPRADOR" ? (
                <ul className="order-items">
                  <li>
                    <div>
                      <strong>Comprador</strong>
                      <span>
                        {user.perfil.pedidosCount}{" "}
                        {user.perfil.pedidosCount === 1 ? "pedido" : "pedidos"} ·{" "}
                        Registrado el {formatFechaHora(user.perfil.creadoEn)}
                      </span>
                    </div>
                    <Badge tone={estadoCompradorTone(user.perfil.estadoComercial)}>
                      {ESTADO_COMPRADOR_LABEL[user.perfil.estadoComercial]}
                    </Badge>
                  </li>
                </ul>
              ) : user.perfil.tipo === "VENDEDOR" ? (
                <ul className="order-items">
                  <li>
                    <div>
                      <strong>{user.perfil.nombreComercial}</strong>
                      <span>
                        {user.perfil.productosCount}{" "}
                        {user.perfil.productosCount === 1 ? "producto" : "productos"}{" "}
                        · {user.perfil.bodegasCount}{" "}
                        {user.perfil.bodegasCount === 1 ? "bodega" : "bodegas"} ·{" "}
                        Registrado el {formatFechaHora(user.perfil.creadoEn)}
                      </span>
                    </div>
                    <Badge tone={estadoVendedorTone(user.perfil.estado)}>
                      {ESTADO_VENDEDOR_LABEL[user.perfil.estado]}
                    </Badge>
                  </li>
                </ul>
              ) : (
                <ul className="order-items">
                  <li>
                    <div>
                      <strong>{user.perfil.nombreOperador}</strong>
                      <span>
                        {user.perfil.bodegasCount}{" "}
                        {user.perfil.bodegasCount === 1
                          ? "bodega asignada"
                          : "bodegas asignadas"}{" "}
                        · Registrado el {formatFechaHora(user.perfil.creadoEn)}
                      </span>
                    </div>
                    <Badge tone={estadoOperadorAdminTone(user.perfil.estado)}>
                      {ESTADO_OPERADOR_LABEL[user.perfil.estado]}
                    </Badge>
                  </li>
                </ul>
              )}
            </section>
          </div>

          <aside className="seller-detail-aside">
            <section className="checkout-block">
              <h2>Consulta de solo lectura</h2>
              <p className="form-hint">
                <UserIcon width={16} height={16} /> Esta vista no permite cambiar
                el rol, el estado ni eliminar la cuenta. Esas operaciones no están
                definidas ni autorizadas en esta fase.
              </p>
            </section>

            <section className="checkout-block">
              <h2>Datos minimizados</h2>
              <p className="form-hint">
                La consulta omite credenciales, hashes, tokens, documentos de
                identidad y direcciones de entrega.
              </p>
            </section>

            <Link className="text-link" href="/admin/users">
              <ArrowRightIcon
                width={16}
                height={16}
                style={{ transform: "rotate(180deg)" }}
              />
              Volver a usuarios
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}
