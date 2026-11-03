"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useState } from "react";
import { AlertTriangleIcon, CartIcon, CheckIcon, CreditCardIcon, InfoIcon } from "@/components/icons";
import { checkoutAction, type CheckoutState } from "../actions";
import {
  ESTADO_PAGO_LABEL,
  ESTADO_PEDIDO_LABEL,
  formatMoney
} from "../format";
import type { Address } from "@/features/addresses/types";
import type { Cart } from "@/features/cart/types";

const initialState: CheckoutState = { status: "idle" };

function cambioLabel(cambio: Record<string, unknown>): string {
  const nombre = typeof cambio.nombre === "string" ? cambio.nombre : "Producto";
  const anterior =
    typeof cambio.precioAnteriorCentavos === "number"
      ? cambio.precioAnteriorCentavos
      : null;
  const actual =
    typeof cambio.precioActualCentavos === "number"
      ? cambio.precioActualCentavos
      : null;
  const moneda = typeof cambio.monedaActual === "string" ? cambio.monedaActual : "COP";

  if (anterior === null || actual === null) {
    return nombre;
  }
  return `${nombre}: ${formatMoney(anterior, moneda)} → ${formatMoney(actual, moneda)}`;
}

export function CheckoutForm({
  cart,
  addresses
}: {
  cart: Cart;
  addresses: readonly Address[];
}) {
  const [state, action, pending] = useActionState(checkoutAction, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState("");
  useEffect(() => {
    setIdempotencyKey(crypto.randomUUID());
  }, []);
  const paymentId = useId();
  const hasPhysical = cart.items.some((item) => item.tipoEntrega === "FISICA");
  const hasNonSellable = cart.items.some((item) => !item.vendible);
  const principal = addresses.find((address) => address.esPrincipal) ?? addresses[0];
  const canSubmit =
    cart.items.length > 0 && !hasNonSellable && (!hasPhysical || addresses.length > 0);

  const result = state.result;
  const confirmed = result?.estado === "CONFIRMADO";
  const rejected = result?.estado === "RECHAZADO";
  const unknown = result?.estado === "DESCONOCIDO";

  if (confirmed) {
    return (
      <div className="checkout-result checkout-result-success" role="status">
        <span className="state-icon">
          <CheckIcon width={24} height={24} />
        </span>
        <h2>Pago confirmado</h2>
        <p>{result.mensaje}</p>
        <ul className="checkout-order-list">
          {result.pedidos.map((order) => (
            <li key={order.id}>
              <Link className="text-link" href={`/orders/${order.id}`}>
                {order.numero} · {ESTADO_PEDIDO_LABEL[order.estado]} ·{" "}
                {formatMoney(order.totalCentavos, order.moneda)}
              </Link>
            </li>
          ))}
        </ul>
        <div className="checkout-result-actions">
          <Link className="btn btn-primary" href="/orders">
            Ver mis pedidos
          </Link>
          <Link className="btn btn-secondary" href="/products">
            Seguir comprando
          </Link>
        </div>
      </div>
    );
  }

  if (rejected) {
    return (
      <div className="checkout-result checkout-result-danger" role="alert">
        <span className="state-icon">
          <AlertTriangleIcon width={24} height={24} />
        </span>
        <h2>Pago rechazado</h2>
        <p>{result.mensaje}</p>
        <p>
          El pedido quedó cancelado y la reserva de inventario se liberó. Tu
          carrito sigue disponible para un nuevo intento.
        </p>
        <div className="checkout-result-actions">
          <Link className="btn btn-primary" href="/cart">
            Volver al carrito
          </Link>
        </div>
      </div>
    );
  }

  if (unknown) {
    return (
      <div className="checkout-result checkout-result-warning" role="status">
        <span className="state-icon">
          <InfoIcon width={24} height={24} />
        </span>
        <h2>Resultado de pago desconocido</h2>
        <p>{result.mensaje}</p>
        <p>
          El pedido queda pendiente de pago. No lo tratamos como confirmado ni
          como rechazado: puedes reintentar la misma operación sin duplicar
          pedidos ni reservas.
        </p>
        <ul className="checkout-order-list">
          {result.pedidos.map((order) => (
            <li key={order.id}>
              <Link className="text-link" href={`/orders/${order.id}`}>
                {order.numero} · {ESTADO_PEDIDO_LABEL[order.estado]} ·{" "}
                {ESTADO_PAGO_LABEL[order.estadoPago]}
              </Link>
            </li>
          ))}
        </ul>
        <div className="checkout-result-actions">
          <form action={action}>
            <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
            <input
              type="hidden"
              name="direccionEntregaId"
              value={principal?.id ?? ""}
            />
            <input type="hidden" name="resultadoPagoSimulado" value="DESCONOCIDO" />
            <input type="hidden" name="confirmarPrecio" value="false" />
            <button className="btn btn-primary" type="submit" disabled={pending}>
              {pending ? "Consultando…" : "Reintentar la misma operación"}
            </button>
          </form>
          <Link className="btn btn-secondary" href="/orders">
            Ver mis pedidos
          </Link>
        </div>
      </div>
    );
  }

  const priceChanged = state.motivo === "PRECIO_CAMBIADO";

  if (cart.items.length === 0) {
    return (
      <div className="checkout-result" role="status">
        <span className="state-icon">
          <CartIcon width={24} height={24} />
        </span>
        <h2>Tu carrito está vacío</h2>
        <p>
          Agrega productos al carrito para iniciar una compra con pago simulado.
        </p>
        <Link className="btn btn-primary" href="/products">
          Ver catálogo
        </Link>
      </div>
    );
  }

  return (
    <>
      {state.status === "error" && !priceChanged ? (
        <p className="form-error" role="alert">
          {state.message}
          {state.correlationId ? (
            <span className="state-correlation">
              Código de seguimiento: {state.correlationId}
            </span>
          ) : null}
        </p>
      ) : null}

      {priceChanged ? (
        <div className="price-change-panel" role="alert">
          <h2>El precio cambió</h2>
          <p>{state.message}</p>
          <ul>
            {(state.cambios ?? []).map((cambio, index) => (
              <li key={index}>{cambioLabel(cambio)}</li>
            ))}
          </ul>
          <form action={action}>
            <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
            <input
              type="hidden"
              name="direccionEntregaId"
              value={principal?.id ?? ""}
            />
            <input type="hidden" name="resultadoPagoSimulado" value="CONFIRMADO" />
            <input type="hidden" name="confirmarPrecio" value="true" />
            <button className="btn btn-primary" type="submit" disabled={pending}>
              {pending ? "Confirmando…" : "Confirmar precio actual y comprar"}
            </button>
          </form>
        </div>
      ) : null}

      <form action={action} className="checkout-form">
        <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
        <input type="hidden" name="confirmarPrecio" value="false" />

        <section className="checkout-block">
          <h2>Dirección de entrega</h2>
          {hasPhysical ? (
            addresses.length > 0 ? (
              <>
                <p className="form-hint">
                  El pedido guardará una copia inmutable de la dirección elegida.
                </p>
                <div className="field">
                  <label htmlFor="direccionEntregaId">Dirección</label>
                  <select
                    id="direccionEntregaId"
                    name="direccionEntregaId"
                    defaultValue={principal?.id ?? ""}
                    required
                  >
                    {addresses.map((address) => (
                      <option key={address.id} value={address.id}>
                        {address.esPrincipal ? "Principal · " : ""}
                        {address.destinatario} · {address.linea1}, {address.ciudad}
                      </option>
                    ))}
                  </select>
                </div>
                <Link className="text-link" href="/addresses">
                  Administrar direcciones
                </Link>
              </>
            ) : (
              <div className="checkout-missing">
                <p>
                  Tu carrito tiene productos físicos y necesitas una dirección de
                  entrega.
                </p>
                <Link className="btn btn-primary" href="/addresses">
                  Agregar dirección
                </Link>
              </div>
            )
          ) : (
            <>
              <input type="hidden" name="direccionEntregaId" value="" />
              <p className="form-hint">
                Tu carrito solo contiene productos digitales; no se requiere
                dirección física.
              </p>
            </>
          )}
        </section>

        <section className="checkout-block">
          <h2>Pago simulado</h2>
          <p className="form-hint">
            Elige el desenlace que quieres demostrar. El backend aplica el
            resultado y conserva la idempotencia de la operación.
          </p>
          <div className="field">
            <label htmlFor={paymentId}>Resultado del pago</label>
            <select
              id={paymentId}
              name="resultadoPagoSimulado"
              defaultValue="CONFIRMADO"
            >
              <option value="CONFIRMADO">Confirmado</option>
              <option value="RECHAZADO">Rechazado</option>
              <option value="DESCONOCIDO">Desconocido / sin respuesta</option>
            </select>
          </div>
        </section>

        <section className="checkout-block">
          <h2>Resumen del carrito</h2>
          <ul className="checkout-items">
            {cart.items.map((item) => (
              <li key={item.productoId}>
                <span>
                  {item.cantidad} × {item.nombre}
                </span>
                <strong>{formatMoney(item.subtotalCentavos, item.moneda)}</strong>
              </li>
            ))}
          </ul>
          <div className="summary-row summary-total">
            <span>Total</span>
            <strong>
              {cart.moneda
                ? formatMoney(cart.totalCentavos, cart.moneda)
                : formatMoney(0, "COP")}
            </strong>
          </div>
        </section>

        {hasNonSellable ? (
          <p className="form-error" role="alert">
            Corrige las líneas no disponibles del carrito antes de comprar.
          </p>
        ) : null}

        <button
          className="btn btn-primary checkout-submit"
          type="submit"
          disabled={pending || !canSubmit || idempotencyKey.length === 0}
        >
          <CreditCardIcon width={18} height={18} />
          {pending ? "Procesando pago simulado…" : "Confirmar compra"}
        </button>

        <p className="form-hint">
          El backend valida precios, stock y dirección. Si el resultado es
          desconocido, el pedido queda pendiente y puedes reintentar sin duplicar
          la operación.
        </p>
      </form>
    </>
  );
}
