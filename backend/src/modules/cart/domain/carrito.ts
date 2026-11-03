import { ValidationError } from "../../../shared/domain/errors.js";
import type { CarritoId, CompradorId } from "../../../shared/domain/ids.js";
import type { Instant } from "../../../shared/domain/value-objects.js";

/**
 * Carrito V1: una línea por producto, sin variantes comerciales.
 *
 * `precioReferencialCentavos` conserva el precio que el comprador vio al
 * agregar la línea. El checkout lo compara con el precio actual (CAR-07) y no
 * cobra silenciosamente un importe distinto.
 */
export interface ItemCarrito {
  readonly productoId: string;
  readonly cantidad: number;
  readonly precioReferencialCentavos: number;
  readonly monedaReferencial: string;
  readonly agregadoEn: Instant;
  readonly actualizadoEn: Instant;
}

export interface CarritoProps {
  id: CarritoId;
  compradorId: CompradorId;
  items: readonly ItemCarrito[];
  actualizadoEn: Instant;
  version: number;
}

export class Carrito {
  private constructor(private readonly props: CarritoProps) {}

  static createEmpty(input: {
    id: CarritoId;
    compradorId: CompradorId;
    actualizadoEn: Instant;
  }): Carrito {
    return new Carrito({
      ...input,
      items: [],
      version: 1
    });
  }

  static create(input: CarritoProps): Carrito {
    if (!Number.isInteger(input.version) || input.version < 1) {
      throw new ValidationError("La versión del carrito debe ser un entero positivo.");
    }
    for (const item of input.items) {
      if (!Number.isInteger(item.cantidad) || item.cantidad <= 0) {
        throw new ValidationError("La cantidad del carrito debe ser un entero positivo.");
      }
    }
    return new Carrito({ ...input, items: [...input.items] });
  }

  get id(): CarritoId {
    return this.props.id;
  }

  get compradorId(): CompradorId {
    return this.props.compradorId;
  }

  get items(): readonly ItemCarrito[] {
    return this.props.items;
  }

  get actualizadoEn(): Instant {
    return this.props.actualizadoEn;
  }

  get version(): number {
    return this.props.version;
  }
}
