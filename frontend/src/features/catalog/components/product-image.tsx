"use client";

import { useState, type ImgHTMLAttributes } from "react";

type ProductImageProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src" | "alt"
> & {
  readonly src: string;
  readonly alt: string;
  readonly fallbackClassName?: string;
};

/**
 * Imagen de producto con placeholder cuando la URL no carga.
 *
 * La URL de la imagen es un dato persistido por el vendedor; si el archivo
 * referenciado no existe o deja de estar disponible, la interfaz muestra el
 * mismo placeholder que usa un producto sin imágenes en lugar de un icono roto.
 */
export function ProductImage({
  src,
  alt,
  fallbackClassName = "product-card-placeholder",
  ...imageProps
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className={fallbackClassName} aria-hidden="true">
        NM
      </span>
    );
  }

  return (
    <img
      {...imageProps}
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
    />
  );
}
