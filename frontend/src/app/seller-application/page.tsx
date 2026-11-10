import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { StoreIcon } from "@/components/icons";
import { ErrorState } from "@/components/ui/error-state";
import { getSession, getSessionToken } from "@/features/auth/session";
import { fetchOwnSellerApplication } from "@/features/seller-applications/api";
import { SellerApplicationForm } from "@/features/seller-applications/components/seller-application-form";
import { SellerApplicationStatus } from "@/features/seller-applications/components/seller-application-status";
import { toActionError } from "@/lib/action-state";

export const metadata: Metadata = {
  title: "Solicitud de vendedor"
};

export default async function SellerApplicationPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?redirect=%2Fseller-application");
  }
  if (session.rol !== "COMPRADOR" && session.rol !== "VENDEDOR") {
    redirect("/");
  }

  const token = await getSessionToken();
  if (!token) {
    redirect("/login?redirect=%2Fseller-application");
  }

  let solicitud: Awaited<ReturnType<typeof fetchOwnSellerApplication>>;
  try {
    solicitud = await fetchOwnSellerApplication(token);
  } catch (error) {
    const state = toActionError(error, "No pudimos cargar tu solicitud.");
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

  const esVendedor = session.rol === "VENDEDOR";
  const puedeEnviar =
    session.rol === "COMPRADOR" && solicitud === null;

  return (
    <>
      <section className="page-head">
        <div className="container">
          <p className="eyebrow">Cuenta de comprador</p>
          <h1>Quiero vender en NexusMarket</h1>
          <p>
            Presenta tu solicitud de incorporación. La decisión es exclusivamente
            administrativa: la aprobación crea el perfil de vendedor y su primera
            bodega; el rechazo no crea ninguno de los dos.
          </p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container seller-detail-layout">
          <div className="seller-detail-main">
            {solicitud ? <SellerApplicationStatus solicitud={solicitud} /> : null}

            {puedeEnviar ? (
              <section className="checkout-block">
                <div className="seller-head-meta">
                  <StoreIcon width={18} height={18} />
                  <h2>Nueva solicitud</h2>
                </div>
                <SellerApplicationForm />
              </section>
            ) : null}

            {!solicitud && esVendedor ? (
              <section className="checkout-block">
                <h2>Cuenta de vendedor</h2>
                <p className="form-hint">
                  Esta cuenta ya opera como vendedor. No tiene una solicitud
                  registrada en este flujo.
                </p>
                <p>
                  <Link className="text-link" href="/seller">
                    Ir a mi espacio de vendedor
                  </Link>
                </p>
              </section>
            ) : null}

            {solicitud?.estado === "RECHAZADA" ? (
              <section className="checkout-block">
                <h2>¿Puedo volver a solicitar?</h2>
                <p className="form-hint">
                  La política de reenvío después de un rechazo todavía no está
                  definida. Por ahora no se habilita un nuevo formulario desde
                  esta pantalla; un administrador puede orientarte.
                </p>
              </section>
            ) : null}
          </div>

          <aside className="seller-detail-aside">
            <section className="checkout-block">
              <h2>Cómo funciona</h2>
              <ol className="order-items">
                <li>
                  <div>
                    <strong>1. Presentas la solicitud</strong>
                    <span>Queda en estado PENDIENTE y no cambia tu rol.</span>
                  </div>
                </li>
                <li>
                  <div>
                    <strong>2. Un administrador la revisa</strong>
                    <span>Consulta tus datos comerciales y de bodega.</span>
                  </div>
                </li>
                <li>
                  <div>
                    <strong>3. Aprueba o rechaza</strong>
                    <span>
                      La aprobación es atómica; el rechazo no crea vendedor ni
                      bodega.
                    </span>
                  </div>
                </li>
              </ol>
            </section>

            <section className="checkout-block">
              <h2>Misma identidad</h2>
              <p className="form-hint">
                No se crea una segunda cuenta. Si la solicitud se aprueba, tu
                usuario conserva su historial y pasa a tener el rol principal
                VENDEDOR.
              </p>
            </section>
          </aside>
        </div>
      </section>
    </>
  );
}
