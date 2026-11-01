import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import {
  CATEGORIA_LABEL,
  disponibilidadTexto,
  formatPrecio
} from "@/features/catalog/format";
import type { ProductoResumen } from "@/features/catalog/types";

export function ProductCard({ product }: { product: ProductoResumen }) {
  const disponibilidad = disponibilidadTexto(
    product.disponible,
    product.tipoEntrega
  );
  const productHref = `/products/${product.id}`;

  return (
    <article className="product-card">
      <Link
        className="product-card-media"
        href={productHref}
        aria-label={`Ver ${product.nombre}`}
      >
        {product.imagenPrincipal ? (
          <img
            src={product.imagenPrincipal.url}
            alt={product.imagenPrincipal.alt}
            width={800}
            height={660}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="product-card-placeholder" aria-hidden="true">
            NM
          </span>
        )}
        <span className="product-card-category">
          {CATEGORIA_LABEL[product.categoria]}
        </span>
      </Link>

      <div className="product-card-body">
        <p className="product-card-seller">{product.vendedor.nombreComercial}</p>
        <h3>
          <Link href={productHref}>{product.nombre}</Link>
        </h3>
        <p className="product-card-description">{product.descripcion}</p>
        <div className="product-card-footer">
          <Price value={formatPrecio(product.precio)} />
          <Badge tone={disponibilidad.tone}>{disponibilidad.label}</Badge>
        </div>
      </div>
    </article>
  );
}
