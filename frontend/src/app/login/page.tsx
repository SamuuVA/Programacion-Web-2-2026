import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheckIcon } from "@/components/icons";
import { LoginForm } from "@/features/auth/components/login-form";
import { getSession, safeRedirect } from "@/features/auth/session";

export const metadata: Metadata = {
  title: "Ingresar"
};

type LoginPageProps = {
  searchParams: Promise<{ redirect?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getSession();
  if (session) {
    redirect("/");
  }

  const params = await searchParams;
  const redirectTo = safeRedirect(params.redirect ?? "/");

  return (
    <>
      <section className="page-head">
        <div className="container">
          <p className="eyebrow">Cuenta NexusMarket</p>
          <h1>Ingresa a NexusMarket</h1>
          <p>
            Compra, revisa tus pedidos o administra tu tienda desde una cuenta
            verificada. La sesión se valida en el backend en cada petición.
          </p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container auth-layout">
          <LoginForm redirectTo={redirectTo} />

          <aside className="auth-aside">
            <span className="auth-aside-icon">
              <ShieldCheckIcon width={24} height={24} />
            </span>
            <h2>Acceso seguro y local</h2>
            <p>
              La contraseña se verifica con Argon2id y la sesión se guarda como un
              token opaco en una cookie HttpOnly. Ningún precio, cantidad o rol se
              toma del navegador: el backend vuelve a validarlos.
            </p>
            <p>
              ¿Todavía no tienes cuenta?{" "}
              <Link className="text-link" href="/products">
                Explora el catálogo
              </Link>{" "}
              mientras habilitamos el registro público.
            </p>
          </aside>
        </div>
      </section>
    </>
  );
}
