import type { Clock } from "../../../shared/application/ports.js";
import {
  BusinessRuleError,
  ResourceNotFoundError,
  ValidationError
} from "../../../shared/domain/errors.js";
import type {
  CartItemState,
  CartStore,
  CartView,
  SellableProduct
} from "./ports.js";

export const MAX_CART_QUANTITY = 999;

export class GetCart {
  constructor(private readonly store: CartStore) {}

  execute(compradorId: string): Promise<CartView> {
    return this.store.getCart(compradorId);
  }
}

/**
 * Agregar al carrito valida que el producto sea vendible, pero no reserva stock
 * (CAR-06). La disponibilidad se vuelve a validar en el checkout.
 */
export class AddCartItem {
  constructor(
    private readonly store: CartStore,
    private readonly clock: Clock
  ) {}

  async execute(
    compradorId: string,
    command: { productoId: string; cantidad: number }
  ): Promise<CartView> {
    const cantidad = positiveQuantity(command.cantidad);
    const product = await this.store.findProduct(command.productoId);
    if (product === null) {
      throw new ResourceNotFoundError("El producto no existe.");
    }
    assertSellable(product);

    const current = await this.store.getItem(compradorId, command.productoId);
    const total = (current?.cantidad ?? 0) + cantidad;
    if (total > MAX_CART_QUANTITY) {
      throw new ValidationError(`La cantidad máxima por producto es ${MAX_CART_QUANTITY}.`);
    }
    assertAvailability(product, total);

    await this.store.upsertItem({
      compradorId,
      productoId: product.productoId,
      cantidad: total,
      precioCentavos: product.precioCentavos,
      moneda: product.moneda,
      now: this.clock.now().value
    });
    return this.store.getCart(compradorId);
  }
}

export class UpdateCartItem {
  constructor(
    private readonly store: CartStore,
    private readonly clock: Clock
  ) {}

  async execute(
    compradorId: string,
    command: { productoId: string; cantidad: number }
  ): Promise<CartView> {
    const cantidad = positiveQuantity(command.cantidad);
    const existing: CartItemState | null = await this.store.getItem(
      compradorId,
      command.productoId
    );
    if (existing === null) {
      throw new ResourceNotFoundError("El producto no está en el carrito.");
    }
    const product = await this.store.findProduct(command.productoId);
    if (product === null) {
      throw new ResourceNotFoundError("El producto no existe.");
    }
    assertSellable(product);
    assertAvailability(product, cantidad);

    await this.store.upsertItem({
      compradorId,
      productoId: product.productoId,
      cantidad,
      precioCentavos: product.precioCentavos,
      moneda: product.moneda,
      now: this.clock.now().value
    });
    return this.store.getCart(compradorId);
  }
}

export class RemoveCartItem {
  constructor(
    private readonly store: CartStore,
    private readonly clock: Clock
  ) {}

  async execute(compradorId: string, productoId: string): Promise<CartView> {
    const removed = await this.store.removeItem(
      compradorId,
      productoId,
      this.clock.now().value
    );
    if (!removed) {
      throw new ResourceNotFoundError("El producto no está en el carrito.");
    }
    return this.store.getCart(compradorId);
  }
}

function positiveQuantity(value: number): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new ValidationError("La cantidad debe ser un entero positivo.");
  }
  if (value > MAX_CART_QUANTITY) {
    throw new ValidationError(`La cantidad máxima por producto es ${MAX_CART_QUANTITY}.`);
  }
  return value;
}

function assertSellable(product: SellableProduct): void {
  if (product.estadoProducto !== "PUBLICADO") {
    throw new BusinessRuleError("El producto no está disponible para la venta.", {
      motivo: "PRODUCTO_NO_PUBLICADO",
      productoId: product.productoId
    });
  }
  if (product.estadoVendedor !== "ACTIVO") {
    throw new BusinessRuleError("El vendedor del producto no está activo.", {
      motivo: "VENDEDOR_NO_ACTIVO",
      productoId: product.productoId
    });
  }
}

function assertAvailability(product: SellableProduct, cantidad: number): void {
  if (product.tipoEntrega === "DIGITAL") {
    return;
  }
  const disponible = product.disponible ?? 0;
  if (cantidad > disponible) {
    throw new BusinessRuleError("No hay unidades suficientes disponibles.", {
      motivo: "STOCK_INSUFICIENTE",
      productoId: product.productoId,
      solicitado: cantidad,
      disponible
    });
  }
}
