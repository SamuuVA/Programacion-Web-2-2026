import type { Metadata } from "next";
import Link from "next/link";
import { requireSeller } from "@/features/auth/session";
import { SellerProductForm } from "@/features/seller/components/seller-product-form";

export const metadata: Metadata = {
  title: "Crear producto"
};

export default async function NewSellerProductPage() {
  await requireSeller("/seller/products/new");

  return (
    <>
      <section className="page-head">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Ruta de navegación">
            <Link href="/seller/products">Mis productos</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Nuevo producto</span>
          </nav>
          <p className="eyebrow">Catálogo propio</p>
          <h1>Crear producto</h1>
          <p>
            El producto se guarda como borrador. Podrás agregar imágenes y
            publicarlo cuando cumpla las condiciones de la política.
          </p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container seller-narrow">
          <SellerProductForm mode="create" />
        </div>
      </section>
    </>
  );
}
