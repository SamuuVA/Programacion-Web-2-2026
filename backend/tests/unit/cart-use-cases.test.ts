import { describe, expect, it } from "vitest";
import {
  AddCartItem,
  MAX_CART_QUANTITY,
  RemoveCartItem,
  UpdateCartItem
} from "../../src/modules/cart/application/cart-use-cases.js";
import type { SellableProduct } from "../../src/modules/cart/application/ports.js";
import { FixedClock } from "../support/doubles.js";
import { FakeCartStore } from "../support/fakes.js";

const BUYER_ID = "00000000-0000-4000-8001-000000000001";
const SELLER_ID = "00000000-0000-4000-8006-000000000001";

function product(overrides: Partial<SellableProduct> = {}): SellableProduct {
  return {
    productoId: "40000000-0000-4000-8000-000000000001",
    nombre: "Audífonos Aurora",
    sku: "AUR-AUD-001",
    categoria: "ELECTRONICA",
    tipoEntrega: "FISICA",
    precioCentavos: 42990000,
    moneda: "COP",
    estadoProducto: "PUBLICADO",
    vendedorId: SELLER_ID,
    vendedorNombre: "Estudio Aurora",
    estadoVendedor: "ACTIVO",
    disponible: 5,
    ...overrides
  };
}

function harness(products: readonly SellableProduct[] = [product()]) {
  const store = new FakeCartStore(products);
  const clock = new FixedClock();
  return {
    store,
    add: new AddCartItem(store, clock),
    update: new UpdateCartItem(store, clock),
    remove: new RemoveCartItem(store, clock)
  };
}

describe("Carrito: validación de cantidades y disponibilidad", () => {
  it("suma cantidades sucesivas de un producto vendible", async () => {
    const { add } = harness();

    await add.execute(BUYER_ID, {
      productoId: product().productoId,
      cantidad: 2
    });
    const cart = await add.execute(BUYER_ID, {
      productoId: product().productoId,
      cantidad: 3
    });

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]).toMatchObject({
      productoId: product().productoId,
      cantidad: 5,
      subtotalCentavos: 42990000 * 5,
      vendible: true,
      motivoNoVendible: null
    });
    expect(cart.totalCentavos).toBe(42990000 * 5);
    expect(cart.requiereConfirmacionPrecio).toBe(false);
  });

  it("rechaza cantidades no enteras, no positivas o fuera del máximo", async () => {
    const { add } = harness();
    const productoId = product().productoId;

    for (const cantidad of [0, -1, 1.5, MAX_CART_QUANTITY + 1]) {
      await expect(
        add.execute(BUYER_ID, { productoId, cantidad })
      ).rejects.toMatchObject({ code: "VALIDACION_INVALIDA" });
    }
  });

  it("rechaza un producto inexistente", async () => {
    const { add } = harness();

    await expect(
      add.execute(BUYER_ID, {
        productoId: "99999999-9999-4999-8999-999999999999",
        cantidad: 1
      })
    ).rejects.toMatchObject({
      code: "RECURSO_NO_ENCONTRADO",
      message: "El producto no existe."
    });
  });

  it("rechaza productos no publicados y vendedores no activos", async () => {
    const suspended = product({ estadoProducto: "SUSPENDIDO" });
    const inactiveSeller = product({
      productoId: "40000000-0000-4000-8000-000000000002",
      estadoVendedor: "SUSPENDIDO"
    });

    await expect(
      harness([suspended]).add.execute(BUYER_ID, {
        productoId: suspended.productoId,
        cantidad: 1
      })
    ).rejects.toMatchObject({
      code: "REGLA_NEGOCIO_INCUMPLIDA",
      details: { motivo: "PRODUCTO_NO_PUBLICADO" }
    });

    await expect(
      harness([inactiveSeller]).add.execute(BUYER_ID, {
        productoId: inactiveSeller.productoId,
        cantidad: 1
      })
    ).rejects.toMatchObject({
      code: "REGLA_NEGOCIO_INCUMPLIDA",
      details: { motivo: "VENDEDOR_NO_ACTIVO" }
    });
  });

  it("rechaza una cantidad superior al stock disponible", async () => {
    const { add } = harness();

    await expect(
      add.execute(BUYER_ID, {
        productoId: product().productoId,
        cantidad: 6
      })
    ).rejects.toMatchObject({
      code: "REGLA_NEGOCIO_INCUMPLIDA",
      details: {
        motivo: "STOCK_INSUFICIENTE",
        solicitado: 6,
        disponible: 5
      }
    });
  });

  it("no permite superar el stock acumulando líneas", async () => {
    const { add } = harness();

    await add.execute(BUYER_ID, {
      productoId: product().productoId,
      cantidad: 4
    });

    await expect(
      add.execute(BUYER_ID, {
        productoId: product().productoId,
        cantidad: 2
      })
    ).rejects.toMatchObject({ code: "REGLA_NEGOCIO_INCUMPLIDA" });
  });

  it("permite productos digitales sin stock físico", async () => {
    const digital = product({
      productoId: "40000000-0000-4000-8000-000000000003",
      tipoEntrega: "DIGITAL",
      categoria: "DIGITAL",
      disponible: null
    });
    const { add } = harness([digital]);

    const cart = await add.execute(BUYER_ID, {
      productoId: digital.productoId,
      cantidad: MAX_CART_QUANTITY
    });

    expect(cart.items[0]).toMatchObject({
      cantidad: MAX_CART_QUANTITY,
      disponible: null,
      vendible: true
    });
  });

  it("reemplaza la cantidad al actualizar y valida el stock", async () => {
    const { add, update } = harness();
    await add.execute(BUYER_ID, {
      productoId: product().productoId,
      cantidad: 2
    });

    const cart = await update.execute(BUYER_ID, {
      productoId: product().productoId,
      cantidad: 5
    });
    expect(cart.items[0]?.cantidad).toBe(5);

    await expect(
      update.execute(BUYER_ID, {
        productoId: product().productoId,
        cantidad: 6
      })
    ).rejects.toMatchObject({ code: "REGLA_NEGOCIO_INCUMPLIDA" });
  });

  it("rechaza actualizar o quitar un producto que no está en el carrito", async () => {
    const { update, remove } = harness();

    await expect(
      update.execute(BUYER_ID, {
        productoId: product().productoId,
        cantidad: 1
      })
    ).rejects.toMatchObject({ code: "RECURSO_NO_ENCONTRADO" });

    await expect(
      remove.execute(BUYER_ID, product().productoId)
    ).rejects.toMatchObject({ code: "RECURSO_NO_ENCONTRADO" });
  });

  it("quita una línea existente y deja el carrito vacío", async () => {
    const { add, remove } = harness();
    await add.execute(BUYER_ID, {
      productoId: product().productoId,
      cantidad: 1
    });

    const cart = await remove.execute(BUYER_ID, product().productoId);

    expect(cart.items).toEqual([]);
    expect(cart.totalCentavos).toBe(0);
    expect(cart.moneda).toBeNull();
  });
});
