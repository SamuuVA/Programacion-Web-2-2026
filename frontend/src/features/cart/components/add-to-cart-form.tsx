"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CartIcon } from "@/components/icons";
import { IDLE_ACTION_STATE } from "@/lib/action-state";
import { addToCartAction } from "../actions";

export function AddToCartForm({
  productoId,
  disponible,
  tipoEntrega
}: {
  productoId: string;
  disponible: number | null;
  tipoEntrega: "FISICA" | "DIGITAL";
}) {
  const [state, action, pending] = useActionState(
    addToCartAction,
    IDLE_ACTION_STATE
  );
  const max = tipoEntrega === "DIGITAL" ? 999 : Math.max(1, disponible ?? 0);
  const soldOut = tipoEntrega === "FISICA" && (disponible ?? 0) === 0;

  return (
    <div className="add-to-cart">
      <form action={action} className="add-to-cart-form">
        <input type="hidden" name="productoId" value={productoId} />
        <div className="field">
          <label htmlFor="cantidad">Cantidad</label>
          <input
            id="cantidad"
            name="cantidad"
            type="number"
            min={1}
            max={max}
            defaultValue={1}
            required
            disabled={soldOut}
          />
        </div>
        <button
          className="btn btn-primary"
          type="submit"
          disabled={pending || soldOut}
        >
          <CartIcon width={18} height={18} />
          {pending ? "Agregando…" : soldOut ? "Sin unidades" : "Agregar al carrito"}
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
          {state.message}{" "}
          <Link className="text-link" href="/cart">
            Ver carrito
          </Link>
        </p>
      ) : null}
    </div>
  );
}
