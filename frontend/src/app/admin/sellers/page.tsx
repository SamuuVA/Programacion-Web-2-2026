import type { Metadata } from "next";
import { StoreIcon } from "@/components/icons";
import { requireAdmin } from "@/features/auth/session";
import { SellerForm } from "@/features/sellers/components/seller-form";

export const metadata: Metadata = {
  title: "Registrar vendedor"
};

export default async function AdminSellersPage() {
  await requireAdmin("/admin/sellers");

  return (
    <>
      <section className="page-head">
        <div className="container">
          <p className="eyebrow">Administración</p>
          <h1>Registrar vendedor</h1>
          <p>
            Solo un administrador activo puede crear vendedores. El alta incluye
            la primera bodega y se ejecuta de forma atómica.
          </p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container admin-layout">
          <div className="admin-main">
            <SellerForm />
          </div>

          <aside className="auth-aside">
            <span className="auth-aside-icon">
              <StoreIcon width={24} height={24} />
            </span>
            <h2>Alta administrativa</h2>
            <p>
              El vendedor no puede autorregistrarse. Esta pantalla usa el endpoint
              administrativo y exige una sesión con rol ADMINISTRADOR.
            </p>
            <p>
              El correo y el documento deben ser únicos. Un duplicado devuelve un
              conflicto sin crear registros parciales.
            </p>
          </aside>
        </div>
      </section>
    </>
  );
}
