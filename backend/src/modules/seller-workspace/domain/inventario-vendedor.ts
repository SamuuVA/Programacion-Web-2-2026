import { BusinessRuleError, ValidationError } from "../../../shared/domain/errors.js";
import type { TipoEntregaVendedor } from "./producto-vendedor.js";

/**
 * Reglas del inventario del vendedor.
 *
 * En este corte solo se expone `INGRESO`: la matriz de autorización (§19) no
 * concede al vendedor ajustes negativos ni movimientos logísticos. Las reservas
 * y salidas las ejecuta el checkout/logística con sus propias reglas.
 */
export const TIPOS_MOVIMIENTO_VENDEDOR = ["INGRESO"] as const;
export type TipoMovimientoVendedor = (typeof TIPOS_MOVIMIENTO_VENDEDOR)[number];

export interface IngresoInventario {
  readonly productoId: string;
  readonly bodegaId: string;
  readonly cantidad: number;
  readonly idempotencyKey: string;
  readonly motivo: string | null;
}

export function normalizarIngreso(input: {
  readonly productoId: string;
  readonly bodegaId: string;
  readonly cantidad: number;
  readonly idempotencyKey: string;
  readonly motivo?: string | null | undefined;
}): IngresoInventario {
  const idempotencyKey =
    typeof input.idempotencyKey === "string" ? input.idempotencyKey.trim() : "";
  if (idempotencyKey.length === 0) {
    throw new ValidationError("La clave de idempotencia es obligatoria.");
  }
  if (idempotencyKey.length > 100) {
    throw new ValidationError(
      "La clave de idempotencia no puede superar 100 caracteres."
    );
  }
  if (!Number.isInteger(input.cantidad) || input.cantidad <= 0) {
    throw new ValidationError("La cantidad debe ser un entero positivo.");
  }

  return {
    productoId: input.productoId,
    bodegaId: input.bodegaId,
    cantidad: input.cantidad,
    idempotencyKey,
    motivo: typeof input.motivo === "string" && input.motivo.trim().length > 0
      ? input.motivo.trim()
      : null
  };
}

export function assertProductoFisico(tipoEntrega: TipoEntregaVendedor): void {
  if (tipoEntrega !== "FISICA") {
    throw new BusinessRuleError(
      "Los productos digitales no usan inventario físico.",
      { motivo: "PRODUCTO_DIGITAL_SIN_INVENTARIO" }
    );
  }
}

export function assertProductoConInventario(estado: string): void {
  if (estado === "DESCONTINUADO") {
    throw new BusinessRuleError(
      "Un producto descontinuado no admite nuevos ingresos de stock.",
      { motivo: "PRODUCTO_DESCONTINUADO" }
    );
  }
}

export function assertBodegaActiva(estado: string): void {
  if (estado !== "ACTIVA") {
    throw new BusinessRuleError(
      "Una bodega inactiva no admite nuevos ingresos.",
      { motivo: "BODEGA_INACTIVA" }
    );
  }
}
