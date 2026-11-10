import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRightIcon, StoreIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";
import { getSessionToken, requireAdmin } from "@/features/auth/session";
import { fetchAdminSellerApplication } from "@/features/seller-applications/api";
import { AdminSellerApplicationActions } from "@/features/seller-applications/components/admin-seller-application-actions";
import {
  ESTADO_SOLICITUD_LABEL,
  estadoSolicitudTone
} from "@/features/seller-applications/format";
import { isAdminResourceId } from "@/features/admin/ids";
import {
  ESTADO_USUARIO_LABEL,
  ROL_LABEL,
  estadoUsuarioTone,
  formatFechaHora
} from "@/features/admin/format";
import { toActionError } from "@/lib/action-state";

type ApplicationPageProps = {
  params: Promise<{ applicationId: string }>;
};

export async function generateMetadata({
  params
}: ApplicationPageProps): Promise<Metadata> {
  const { applicationId } = await params;
  if (!isAdminResourceId(applicationId)) {
    notFound();
  }
  return { title: "Detalle de la solicitud" };
}

export default async function AdminSellerApplicationDetailPage({
  params
}: ApplicationPageProps) {
  const { applicationId } = await params;
  if (!isAdminResourceId(applicationId)) {
    notFound();
  }

  const admin = await requireAdmin(
    `/admin/seller-applications/${applicationId}`
  );
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  let solicitud: Awaited<ReturnType<typeof fetchAdminSellerApplication>>;
  try {
    solicitud = await fetchAdminSellerApplication(token, applicationId);
  } catch (error) {
    const state = toActionError(error, "No pudimos cargar la solicitud.");
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

  if (!solicitud) {
    notFound();
  }

  const esPropia = solicitud.usuarioId === admin.usuarioId;

  return (
    <>
      <section className="page-head">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Ruta de navegación">
            <Link href="/admin/seller-applications">Solicitudes</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{solicitud.nombreComercial}</span>
          </nav>
          <p className="eyebrow">Revisión administrativa</p>
          <h1>{solicitud.nombreComercial}</h1>
          <div className="order-detail-badges">
            <Badge tone={estadoSolicitudTone(solicitud.estado)}>
              {ESTADO_SOLICITUD_LABEL[solicitud.estado]}
            </Badge>
            <Badge tone={estadoUsuarioTone(solicitud.usuarioEstado)}>
              Cuenta:{" "}
              {ESTADO_USUARIO_LABEL[solicitud.usuarioEstado] ??
                solicitud.usuarioEstado}
            </Badge>
            <span className="order-detail-date">
              Presentada el {formatFechaHora(solicitud.creadaEn)}
            </span>
          </div>
        </div>
      </section>

      <section className="section-tight">
        <div className="container seller-detail-layout">
          <div className="seller-detail-main">
            <section className="checkout-block">
              <h2>Solicitante</h2>
              <ul className="order-items">
                <li>
                  <span>Nombre completo</span>
                  <strong>{solicitud.nombreCompleto}</strong>
                </li>
                <li>
                  <span>Correo electrónico</span>
                  <strong>{solicitud.correoElectronico}</strong>
                </li>
                <li>
                  <span>Rol principal</span>
                  <strong>{ROL_LABEL[solicitud.usuarioRol] ?? solicitud.usuarioRol}</strong>
                </li>
                <li>
                  <span>Estado de acceso</span>
                  <strong>
                    {ESTADO_USUARIO_LABEL[solicitud.usuarioEstado] ??
                      solicitud.usuarioEstado}
                  </strong>
                </li>
                <li>
                  <span>Usuario</span>
                  <Link
                    className="text-link"
                    href={`/admin/users/${solicitud.usuarioId}`}
                  >
                    Ver cuenta
                  </Link>
                </li>
              </ul>
            </section>

            <section className="checkout-block">
              <h2>Datos comerciales y primera bodega</h2>
              <ul className="order-items">
                <li>
                  <span>Nombre comercial</span>
                  <strong>{solicitud.nombreComercial}</strong>
                </li>
                <li>
                  <span>Bodega solicitada</span>
                  <strong>{solicitud.nombreBodega}</strong>
                </li>
                <li>
                  <span>Ubicación</span>
                  <strong>{solicitud.ubicacionBodega}</strong>
                </li>
                <li>
                  <span>Presentada</span>
                  <strong>{formatFechaHora(solicitud.creadaEn)}</strong>
                </li>
                <li>
                  <span>Última actualización</span>
                  <strong>{formatFechaHora(solicitud.actualizadaEn)}</strong>
                </li>
              </ul>
            </section>

            {solicitud.estado === "APROBADA" ? (
              <section className="checkout-block">
                <h2>Resultado de la aprobación</h2>
                <ul className="order-items">
                  <li>
                    <span>Vendedor</span>
                    {solicitud.sellerId ? (
                      <Link
                        className="text-link"
                        href={`/admin/sellers/${solicitud.sellerId}`}
                      >
                        Ver vendedor
                      </Link>
                    ) : (
                      <strong>—</strong>
                    )}
                  </li>
                  <li>
                    <span>Primera bodega</span>
                    {solicitud.warehouseId ? (
                      <Link
                        className="text-link"
                        href={`/admin/warehouses/${solicitud.warehouseId}`}
                      >
                        Ver bodega
                      </Link>
                    ) : (
                      <strong>—</strong>
                    )}
                  </li>
                  {solicitud.revisadoEn ? (
                    <li>
                      <span>Revisada</span>
                      <strong>{formatFechaHora(solicitud.revisadoEn)}</strong>
                    </li>
                  ) : null}
                  {solicitud.revisadoPor ? (
                    <li>
                      <span>Administrador</span>
                      <strong>{solicitud.revisadoPor}</strong>
                    </li>
                  ) : null}
                </ul>
              </section>
            ) : null}

            {solicitud.estado === "RECHAZADA" ? (
              <section className="checkout-block">
                <h2>Resultado del rechazo</h2>
                <ul className="order-items">
                  <li>
                    <span>Motivo</span>
                    <strong>{solicitud.motivoRechazo ?? "—"}</strong>
                  </li>
                  {solicitud.revisadoEn ? (
                    <li>
                      <span>Revisada</span>
                      <strong>{formatFechaHora(solicitud.revisadoEn)}</strong>
                    </li>
                  ) : null}
                  {solicitud.revisadoPor ? (
                    <li>
                      <span>Administrador</span>
                      <strong>{solicitud.revisadoPor}</strong>
                    </li>
                  ) : null}
                </ul>
                <p className="form-hint">
                  El rechazo no creó vendedor ni bodega y no cambió el estado de
                  acceso ni el estado comercial del comprador.
                </p>
              </section>
            ) : null}
          </div>

          <aside className="seller-detail-aside">
            {solicitud.estado === "PENDIENTE" && !esPropia ? (
              <AdminSellerApplicationActions applicationId={solicitud.id} />
            ) : null}

            {solicitud.estado === "PENDIENTE" && esPropia ? (
              <section className="checkout-block">
                <h2>Revisión bloqueada</h2>
                <p className="form-hint">
                  No puedes aprobar ni rechazar tu propia solicitud. Otro
                  administrador debe tomar la decisión.
                </p>
              </section>
            ) : null}

            {solicitud.estado !== "PENDIENTE" ? (
              <section className="checkout-block">
                <h2>Solicitud resuelta</h2>
                <p className="form-hint">
                  Esta solicitud ya fue {ESTADO_SOLICITUD_LABEL[solicitud.estado].toLowerCase()} y no
                  admite una nueva decisión.
                </p>
              </section>
            ) : null}

            <section className="checkout-block">
              <h2>Atomicidad</h2>
              <p className="form-hint">
                <StoreIcon width={16} height={16} /> La aprobación crea el vendedor,
                su primera bodega, el cambio de rol, la auditoría y el evento en
                una sola transacción PostgreSQL. Un reintento devuelve los mismos
                identificadores sin duplicar filas.
              </p>
            </section>

            <Link className="text-link" href="/admin/seller-applications">
              <ArrowRightIcon
                width={16}
                height={16}
                style={{ transform: "rotate(180deg)" }}
              />
              Volver a solicitudes
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}
