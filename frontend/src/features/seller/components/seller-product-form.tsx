"use client";

import { useActionState } from "react";
import { CheckIcon } from "@/components/icons";
import { CATEGORIAS } from "@/features/catalog/types";
import { CATEGORIA_LABEL } from "@/features/catalog/format";
import { IDLE_ACTION_STATE } from "@/lib/action-state";
import {
  createSellerProductAction,
  updateSellerProductAction
} from "../actions";
import type { SellerProduct } from "../types";

export function SellerProductForm({
  mode,
  product
}: {
  mode: "create" | "edit";
  product?: SellerProduct;
}) {
  const [state, action, pending] = useActionState(
    mode === "create" ? createSellerProductAction : updateSellerProductAction,
    IDLE_ACTION_STATE
  );

  const price =
    product === undefined ? "" : (product.precioCentavos / 100).toFixed(2);

  return (
    <form action={action} className="seller-form">
      {mode === "edit" && product ? (
        <input type="hidden" name="productId" value={product.id} />
      ) : null}

      <div className="field">
        <label htmlFor="nombre">Nombre del producto</label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          defaultValue={product?.nombre ?? ""}
          maxLength={160}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="descripcion">Descripción</label>
        <textarea
          id="descripcion"
          name="descripcion"
          defaultValue={product?.descripcion ?? ""}
          rows={4}
          maxLength={2000}
          required
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="categoria">Categoría</label>
          <select
            id="categoria"
            name="categoria"
            defaultValue={product?.categoria ?? "HOGAR"}
            required
          >
            {CATEGORIAS.map((categoria) => (
              <option key={categoria} value={categoria}>
                {CATEGORIA_LABEL[categoria]}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="tipoEntrega">Tipo de entrega</label>
          <select
            id="tipoEntrega"
            name="tipoEntrega"
            defaultValue={product?.tipoEntrega ?? "FISICA"}
            required
          >
            <option value="FISICA">Física</option>
            <option value="DIGITAL">Digital</option>
          </select>
        </div>
      </div>

      <div className="field-row field-row-3">
        <div className="field">
          <label htmlFor="sku">SKU</label>
          <input
            id="sku"
            name="sku"
            type="text"
            defaultValue={product?.sku ?? ""}
            maxLength={80}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="precio">Precio</label>
          <input
            id="precio"
            name="precio"
            type="number"
            min="0.01"
            step="0.01"
            defaultValue={price}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="moneda">Moneda</label>
          <input
            id="moneda"
            name="moneda"
            type="text"
            defaultValue={product?.moneda ?? "COP"}
            minLength={3}
            maxLength={3}
            pattern="[A-Za-z]{3}"
            required
          />
        </div>
      </div>

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

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending
          ? "Guardando…"
          : mode === "create"
            ? "Crear producto en borrador"
            : "Guardar cambios"}
      </button>

      <p className="form-hint">
        El producto se crea en borrador. Para publicarlo necesita SKU, precio,
        moneda y al menos una imagen. En V1 no existen variantes: cada
        combinación vendible es un producto independiente.
      </p>
    </form>
  );
}
