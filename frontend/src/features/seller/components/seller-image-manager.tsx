"use client";

import { useActionState } from "react";
import { CheckIcon, TrashIcon } from "@/components/icons";
import { IDLE_ACTION_STATE } from "@/lib/action-state";
import {
  addSellerImageAction,
  removeSellerImageAction
} from "../actions";
import type { SellerImage } from "../types";

export function SellerImageManager({
  productId,
  images
}: {
  productId: string;
  images: readonly SellerImage[];
}) {
  const [state, action, pending] = useActionState(
    addSellerImageAction,
    IDLE_ACTION_STATE
  );

  return (
    <section className="checkout-block">
      <h2>Imágenes</h2>
      <p className="form-hint">
        Se guardan como URL. La arquitectura no aprueba un proveedor de archivos
        ni límites de tamaño/formato, por lo que la carga binaria no está
        disponible.
      </p>

      {images.length === 0 ? (
        <p className="form-hint">
          Sin imágenes. Un producto necesita al menos una para publicarse.
        </p>
      ) : (
        <ul className="seller-image-list">
          {images.map((image) => (
            <li key={image.id}>
              <div>
                <strong>{image.alt || "Imagen sin texto alternativo"}</strong>
                <span className="seller-image-url">{image.url}</span>
              </div>
              <RemoveImageForm
                productId={productId}
                imageId={image.id}
                label={image.alt || image.url}
              />
            </li>
          ))}
        </ul>
      )}

      <form action={action} className="seller-inline-form">
        <input type="hidden" name="productId" value={productId} />
        <div className="field">
          <label htmlFor="image-url">URL de la imagen</label>
          <input
            id="image-url"
            name="url"
            type="text"
            placeholder="/products/mi-producto.svg"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="image-alt">Texto alternativo</label>
          <input id="image-alt" name="alt" type="text" maxLength={160} />
        </div>
        <button className="btn btn-secondary btn-sm" type="submit" disabled={pending}>
          {pending ? "Agregando…" : "Agregar imagen"}
        </button>
      </form>

      {state.status === "error" ? (
        <p className="form-error" role="alert">
          {state.message}
          {state.correlationId ? (
            <span className="state-correlation">
              Código de seguimiento: {state.correlationId}
            </span>
          ) : null}
        </p>
      ) : null}

      {state.status === "success" ? (
        <p className="form-success" role="status">
          <CheckIcon width={18} height={18} /> {state.message}
        </p>
      ) : null}
    </section>
  );
}

function RemoveImageForm({
  productId,
  imageId,
  label
}: {
  productId: string;
  imageId: string;
  label: string;
}) {
  const [state, action, pending] = useActionState(
    removeSellerImageAction,
    IDLE_ACTION_STATE
  );

  return (
    <form
      action={action}
      className="seller-image-remove"
      onSubmit={(event) => {
        if (!window.confirm(`¿Quitar la imagen «${label}»?`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="imageId" value={imageId} />
      <button
        className="btn btn-ghost btn-sm"
        type="submit"
        disabled={pending}
        aria-label={`Quitar imagen ${label}`}
      >
        <TrashIcon width={16} height={16} />
        {pending ? "Quitando…" : "Quitar"}
      </button>
      {state.status === "error" ? (
        <span className="form-error" role="alert">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
