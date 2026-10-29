import { ValidationError } from "../../../shared/domain/errors.js";
import type { CarritoId, CompradorId } from "../../../shared/domain/ids.js";
import type { Instant } from "../../../shared/domain/value-objects.js";

export interface ItemCarrito {
  readonly varianteId: string;
  readonly cantidad: number;
  readonly precioReferencial: {
    readonly importe: string;
    readonly moneda: string;
  };
  readonly agregadoEn: Instant;
}

export interface CarritoProps {
  id: CarritoId;
  compradorId: CompradorId;
  items: readonly ItemCarrito[];
  actualizadoEn: Instant;
  version: number;
}

/**
 * Carrito activo del comprador. PI-01 crea una instancia vacía y con versión 1.
 */
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
