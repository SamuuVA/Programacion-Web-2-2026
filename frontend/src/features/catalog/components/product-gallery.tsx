"use client";

import { useState } from "react";
import type { ImagenProducto } from "../types";

export function ProductGallery({
  images,
  productName
}: {
  images: readonly ImagenProducto[];
  productName: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex] ?? images[0];

  if (!active) {
    return (
      <div className="gallery-main">
        <span className="product-card-placeholder" aria-hidden="true">
          NM
        </span>
      </div>
    );
  }

  return (
    <div className="gallery">
      <div className="gallery-main">
        <img
          src={active.url}
          alt={active.alt || productName}
          width={800}
          height={680}
          decoding="async"
        />
      </div>

      {images.length > 1 ? (
        <div className="gallery-thumbs">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              className="gallery-thumb"
              aria-label={`Ver imagen ${index + 1} de ${productName}`}
              aria-pressed={index === activeIndex}
              onClick={() => setActiveIndex(index)}
            >
              <img
                src={image.url}
                alt=""
                width={200}
                height={200}
                loading="lazy"
                decoding="async"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
