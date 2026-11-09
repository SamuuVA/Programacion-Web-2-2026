import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";
import { getSessionToken, requireSeller } from "@/features/auth/session";
import { fetchSellerProfile } from "@/features/seller/api";
import { SellerProfileForm } from "@/features/seller/components/seller-profile-form";
import {
  ESTADO_VENDEDOR_LABEL,
  estadoVendedorTone,
  formatFechaHora
} from "@/features/seller/format";
import { toActionError } from "@/lib/action-state";

export const metadata: Metadata = {
  title: "Perfil de la tienda"
};

export default async function SellerProfilePage() {
  await requireSeller("/seller/profile");
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  let profile: Awaited<ReturnType<typeof fetchSellerProfile>>;
  try {
    profile = await fetchSellerProfile(token);
  } catch (error) {
    const state = toActionError(error, "No pudimos cargar el perfil de la tienda.");
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
          <p className="eyebrow">Mi tienda</p>
          <h1>Perfil</h1>
          <div className="seller-head-meta">
            <Badge tone={estadoVendedorTone(profile.estado)}>
              {ESTADO_VENDEDOR_LABEL[profile.estado]}
            </Badge>
            <span>Alta el {formatFechaHora(profile.creadoEn)}</span>
          </div>
          <p>
            La identidad del vendedor la administra la plataforma. Solo puedes
            editar tu nombre comercial; los demás atributos no están aprobados
            para edición en este alcance.
          </p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container seller-detail-layout">
          <div className="seller-detail-main">
            <section className="checkout-block">
              <h2>Datos de la cuenta</h2>
              <dl className="seller-data">
                <div>
                  <dt>Nombre completo</dt>
                  <dd>{profile.nombreCompleto}</dd>
                </div>
                <div>
                  <dt>Correo electrónico</dt>
                  <dd>{profile.correoElectronico}</dd>
                </div>
                <div>
                  <dt>Identificador del vendedor</dt>
                  <dd className="mono">{profile.id}</dd>
                </div>
                <div>
                  <dt>Estado del perfil</dt>
                  <dd>{ESTADO_VENDEDOR_LABEL[profile.estado]}</dd>
                </div>
              </dl>
            </section>

            <section className="checkout-block">
              <h2>Nombre comercial</h2>
              <SellerProfileForm nombreComercial={profile.nombreComercial} />
            </section>
          </div>

          <aside className="seller-detail-aside">
            <section className="checkout-block">
              <h2>Alcance del perfil</h2>
              <p className="form-hint">
                El vendedor puede consultar su perfil en cualquier estado y
                modificarlo solo cuando está activo. Los datos comerciales
                adicionales no están definidos en la arquitectura aprobada, por
                lo que no se inventan campos.
              </p>
            </section>
          </aside>
        </div>
      </section>
    </>
  );
}
