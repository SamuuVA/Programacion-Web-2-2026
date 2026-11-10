import type { Clock } from "../../../shared/application/ports.js";
import { ValidationError } from "../../../shared/domain/errors.js";
import { isUuid } from "../../../shared/domain/value-objects.js";
import type {
  CheckoutResult,
  CheckoutStore,
  OrderDetail,
  OrderSummary,
  ResultadoPagoSimulado
} from "./ports.js";
import { RESULTADOS_PAGO_SIMULADO } from "./ports.js";

const IDEMPOTENCY_KEY_MAX = 100;

export interface CheckoutCommandInput {
  readonly idempotencyKey: string;
  readonly direccionEntregaId?: string | null | undefined;
  readonly confirmarPrecio?: boolean | undefined;
  readonly resultadoPagoSimulado?: ResultadoPagoSimulado | undefined;
  readonly correlationId: string;
}

/**
 * PI-12 Checkout.
 *
 * El backend es la autoridad de precios, cantidades, stock y direcciones. El
 * resultado del pago simulado se declara explícitamente para poder demostrar
 * los tres desenlaces: confirmado, rechazado y desconocido.
 */
export class Checkout {
  constructor(
    private readonly store: CheckoutStore,
    private readonly clock: Clock
  ) {}

  execute(
    compradorId: string,
    input: CheckoutCommandInput
  ): Promise<CheckoutResult> {
    const idempotencyKey =
      typeof input.idempotencyKey === "string"
        ? input.idempotencyKey.trim()
        : "";
    if (
      idempotencyKey.length === 0 ||
      idempotencyKey.length > IDEMPOTENCY_KEY_MAX
    ) {
      throw new ValidationError(
        `La clave de idempotencia debe tener entre 1 y ${IDEMPOTENCY_KEY_MAX} caracteres.`
      );
    }
    if (
      input.direccionEntregaId !== undefined &&
      input.direccionEntregaId !== null
    ) {
      if (!isUuid(input.direccionEntregaId)) {
        throw new ValidationError("La dirección de entrega no es válida.");
      }
    }
    const outcome = input.resultadoPagoSimulado ?? "CONFIRMADO";
    if (!RESULTADOS_PAGO_SIMULADO.includes(outcome)) {
      throw new ValidationError("El resultado de pago simulado no es válido.");
    }

    return this.store.executeCheckout({
      compradorId,
      idempotencyKey,
      direccionEntregaId: input.direccionEntregaId ?? null,
      confirmarPrecio: input.confirmarPrecio === true,
      resultadoPagoSimulado: outcome,
      correlationId: input.correlationId,
      now: this.clock.now().value
    });
  }
}

export class ListOrders {
  constructor(private readonly store: CheckoutStore) {}

  execute(compradorId: string): Promise<OrderSummary[]> {
    return this.store.listOrders(compradorId);
  }
}

export class GetOrder {
  constructor(private readonly store: CheckoutStore) {}

  execute(compradorId: string, orderId: string): Promise<OrderDetail | null> {
    return this.store.findOrder(compradorId, orderId);
  }
}
