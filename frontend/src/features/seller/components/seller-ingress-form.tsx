"use client";

import { useActionState, useEffect, useState } from "react";
import { CheckIcon, PlusIcon } from "@/components/icons";
import { IDLE_ACTION_STATE } from "@/lib/action-state";
import { registerSellerIngressAction } from "../actions";
import type { SellerProduct, SellerWarehouse } from "../types";

export function SellerIngressForm({
  products,
  warehouses
}: {
  products: readonly SellerProduct[];
  warehouses: readonly SellerWarehouse[];
}) {
  const [sequence, setSequence] = useState(0);

  const physicalProducts = products.filter(
    (product) =>
      product.tipoEntrega === "FISICA" && product.estado !== "DESCONTINUADO"
  );
  const activeWarehouses = warehouses.filter(
    (warehouse) => warehouse.estado === "ACTIVA"
  );

  if (physicalProducts.length === 0) {
    return (
      <p className="form-hint">
        Necesitas al menos un producto físico no descontinuado para registrar
        inventario.
      </p>
    );
  }

  if (activeWarehouses.length === 0) {
    return (
      <p className="form-hint">
        Necesitas una bodega activa para registrar inventario.
      </p>
    );
  }

  return (
    <IngressFormBody
      key={sequence}
      products={physicalProducts}
      warehouses={activeWarehouses}
      onNew={() => setSequence((current) => current + 1)}
    />
  );
}

function IngressFormBody({
  products,
  warehouses,
  onNew
}: {
  products: readonly SellerProduct[];
  warehouses: readonly SellerWarehouse[];
  onNew: () => void;
}) {
  const [state, action, pending] = useActionState(
    registerSellerIngressAction,
    IDLE_ACTION_STATE
  );
  // La clave debe ser única por intento, no estable entre cargas: el backend
  // deduplica por (vendedor, idempotencyKey). Se genera en el cliente tras el
  // montaje para evitar desajustes de hidratación.
  const [idempotencyKey, setIdempotencyKey] = useState("");

  useEffect(() => {
    // Se genera tras el montaje para evitar desajustes de hidratación: la clave
    // debe ser única por intento y no puede coincidir entre servidor y cliente.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIdempotencyKey(crypto.randomUUID());
  }, []);

  return (
    <form action={action} className="seller-form">
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />

      <div className="field">
        <label htmlFor="ingreso-producto">Producto físico</label>
        <select id="ingreso-producto" name="productoId" required>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.nombre} · {product.sku}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="ingreso-bodega">Bodega activa</label>
        <select id="ingreso-bodega" name="bodegaId" required>
          {warehouses.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>
              {warehouse.nombre} · {warehouse.ubicacion}
            </option>
          ))}
        </select>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="ingreso-cantidad">Cantidad</label>
          <input
            id="ingreso-cantidad"
            name="cantidad"
            type="number"
            min={1}
            step={1}
            defaultValue={1}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="ingreso-motivo">Motivo (opcional)</label>
          <input
            id="ingreso-motivo"
            name="motivo"
            type="text"
            maxLength={200}
            placeholder="Carga inicial"
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

      <div className="seller-state-actions">
        <button
          className="btn btn-primary"
          type="submit"
          disabled={pending || idempotencyKey === ""}
        >
          <PlusIcon width={16} height={16} />
          {pending ? "Registrando…" : "Registrar ingreso"}
        </button>
        {state.status === "success" ? (
          <button
            className="btn btn-secondary"
            type="button"
            onClick={onNew}
          >
            Registrar otro ingreso
          </button>
        ) : null}
      </div>

      <p className="form-hint">
        Solo se registran ingresos. Los ajustes negativos y los movimientos
        logísticos no están autorizados para el vendedor. La clave de
        idempotencia evita sumar dos veces el mismo envío.
      </p>
    </form>
  );
}
