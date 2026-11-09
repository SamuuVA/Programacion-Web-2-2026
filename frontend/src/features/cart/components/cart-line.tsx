"use client";

import { useActionState } from "react";
import { IDLE_ACTION_STATE } from "@/lib/action-state";
import {
  removeCartItemAction,
  updateCartItemAction
} from "../actions";
import { formatMoney } from "@/features/orders/format";
import type { CartItem } from "../types";

const MOTIVO_LABEL: Readonly<Record<string, string>> = {
  PRODUCTO_NO_PUBLICADO: "El producto ya no está publicado.",
  VENDEDOR_NO_ACTIVO: "El vendedor ya no está activo.",
  STOCK_INSUFICIENTE: "No hay unidades suficientes para esta cantidad."
};

export function CartLine({ item }: { item: CartItem }) {
  const [updateState, updateAction, updatePending] = useActionState(
    updateCartItemAction,
    IDLE_ACTION_STATE
  );
  const [removeState, removeAction, removePending] = useActionState(
    removeCartItemAction,
    IDLE_ACTION_STATE
  );

  return (
    <article className="cart-line">
      <div className="cart-line-media" aria-hidden="true">
        {item.nombre.slice(0, 1).toUpperCase()}
      </div>

      <div className="cart-line-body">
        <p className="cart-line-seller">{item.vendedorNombre}</p>
        <h2>{item.nombre}</h2>
        <p className="cart-line-meta">
          SKU {item.sku} · {item.tipoEntrega === "FISICA" ? "Envío físico" : "Entrega digital"}
        </p>

        {!item.vendible ? (
          <p className="cart-line-warning" role="alert">
            {item.motivoNoVendible
              ? MOTIVO_LABEL[item.motivoNoVendible]
              : "Este producto no está disponible para comprar."}
          </p>
        ) : null}

        <div className="cart-line-actions">
          <form action={updateAction} className="cart-qty-form">
            <input type="hidden" name="productoId" value={item.productoId} />
            <label htmlFor={`cantidad-${item.productoId}`}>Cantidad</label>
            <input
              id={`cantidad-${item.productoId}`}
              name="cantidad"
              type="number"
              min={1}
              max={999}
              defaultValue={item.cantidad}
              required
            />
            <button className="btn btn-secondary btn-sm" type="submit" disabled={updatePending}>
              {updatePending ? "Guardando…" : "Actualizar"}
            </button>
          </form>

          <form action={removeAction}>
            <input type="hidden" name="productoId" value={item.productoId} />
            <button className="link-button link-button-danger" type="submit" disabled={removePending}>
              {removePending ? "Quitando…" : "Quitar"}
            </button>
          </form>
        </div>

        {updateState.status === "error" ? (
          <p className="form-error" role="alert">
            {updateState.message}
          </p>
        ) : null}
        {removeState.status === "error" ? (
          <p className="form-error" role="alert">
            {removeState.message}
          </p>
        ) : null}
      </div>

      <div className="cart-line-price">
        <span>{formatMoney(item.precioCentavos, item.moneda)}</span>
        <strong>{formatMoney(item.subtotalCentavos, item.moneda)}</strong>
        <small>Subtotal</small>
      </div>
    </article>
  );
}
