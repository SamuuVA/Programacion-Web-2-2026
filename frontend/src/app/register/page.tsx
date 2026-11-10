import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheckIcon } from "@/components/icons";
import { RegisterForm } from "@/features/registration/components/register-form";
import { getSession } from "@/features/auth/session";

export const metadata: Metadata = {
  title: "Crear cuenta"
};

export default async function RegisterPage() {
  const session = await getSession();
  if (session) {
    redirect("/");
  }

  return (
    <>
      <section className="page-head">
        <div className="container">
          <p className="eyebrow">Cuenta NexusMarket</p>
          <h1>Crea tu cuenta de comprador</h1>
          <p>
            Regístrate para comprar, guardar direcciones y seguir tus pedidos. El
            rol de comprador se asigna en el backend y no puede modificarse desde
            el navegador.
          </p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container auth-layout">
          <RegisterForm />

          <aside className="auth-aside">
            <span className="auth-aside-icon">
              <ShieldCheckIcon width={24} height={24} />
            </span>
            <h2>Una identidad, un rol principal</h2>
            <p>
              La cuenta se crea de forma transaccional junto con el perfil de
              comprador y el carrito. La contraseña se protege con Argon2id y
              nunca se devuelve al navegador.
            </p>
            <p>
              Si más adelante quieres vender, podrás presentar una solicitud desde
              tu cuenta. Solo un administrador puede aprobarla y convertir la
              misma identidad en vendedor.
            </p>
            <p>
              ¿Ya tienes cuenta?{" "}
              <Link className="text-link" href="/login">
                Inicia sesión
              </Link>
              .
            </p>
          </aside>
        </div>
      </section>
    </>
  );
}
