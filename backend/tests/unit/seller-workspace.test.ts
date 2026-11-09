import { describe, expect, it } from "vitest";
import {
  AddSellerProductImage,
  CreateSellerProduct,
  DiscontinueSellerProduct,
  GetSellerOrder,
  ListSellerOrders,
  PublishSellerProduct,
  RegisterInventoryIngress,
  SuspendSellerProduct,
  UpdateSellerProduct
} from "../../src/modules/seller-workspace/application/use-cases.js";
import type {
  SellerOrderDetail,
  SellerProductView,
  SellerProfileView,
  SellerWarehouseView
} from "../../src/modules/seller-workspace/application/ports.js";
import {
  assertTransicionPermitida,
  evaluarPublicacion,
  TRANSICIONES_PRODUCTO
} from "../../src/modules/seller-workspace/domain/producto-vendedor.js";
import { FixedClock, SequentialIds } from "../support/doubles.js";
import { FakeSellerWorkspaceStore } from "../support/fake-seller-workspace-store.js";

const SELLER_A = "seller-a";
const SELLER_B = "seller-b";
const WAREHOUSE_A = "warehouse-a";
const WAREHOUSE_B = "warehouse-b";
const PRODUCT_A = "product-a";
const PRODUCT_B = "product-b";
const NOW = "2026-11-03T12:00:00.000Z";

const actorA = { usuarioId: "user-a", sellerId: SELLER_A };
const actorB = { usuarioId: "user-b", sellerId: SELLER_B };

function profile(sellerId: string, estado: SellerProfileView["estado"] = "ACTIVO"): SellerProfileView {
  return {
    id: sellerId,
    usuarioId: `user-${sellerId}`,
    nombreComercial: `Vendedor ${sellerId}`,
    estado,
    creadoEn: NOW,
    nombreCompleto: "Vendedor Demo",
    correoElectronico: `${sellerId}@example.test`
  };
}

function warehouse(id: string, sellerId: string): SellerWarehouseView {
  return {
    id,
    vendedorId: sellerId,
    nombre: "Bodega principal",
    ubicacion: "Bogotá",
    estado: "ACTIVA",
    creadaEn: NOW
  };
}

function product(
  id: string,
  sellerId: string,
  overrides: Partial<SellerProductView> = {}
): SellerProductView {
  return {
    id,
    vendedorId: sellerId,
    nombre: "Producto de prueba",
    descripcion: "Descripción válida",
    categoria: "HOGAR",
    tipoEntrega: "FISICA",
    sku: `SKU-${id}`,
    precioCentavos: 10000,
    moneda: "COP",
    estado: "BORRADOR",
    creadoEn: NOW,
    actualizadoEn: NOW,
    imagenes: [],
    inventario: { onHand: 0, reserved: 0, unavailable: 0, disponible: 0 },
    ...overrides
  };
}

function harness(): {
  store: FakeSellerWorkspaceStore;
  ids: SequentialIds;
  clock: FixedClock;
} {
  const store = new FakeSellerWorkspaceStore();
  store.seedProfile(profile(SELLER_A));
  store.seedProfile(profile(SELLER_B));
  store.seedWarehouse(warehouse(WAREHOUSE_A, SELLER_A));
  store.seedWarehouse(warehouse(WAREHOUSE_B, SELLER_B));
  store.seedProduct(product(PRODUCT_A, SELLER_A));
  store.seedProduct(product(PRODUCT_B, SELLER_B));
  return { store, ids: new SequentialIds(), clock: new FixedClock(NOW) };
}

function errorOf(operation: () => void): unknown {
  try {
    operation();
  } catch (error) {
    return error;
  }
  throw new Error("Se esperaba que la operación fallara.");
}

describe("ciclo de vida del producto del vendedor", () => {
  it("solo permite las transiciones aprobadas y bloquea la reactivación", () => {
    expect(TRANSICIONES_PRODUCTO.BORRADOR).toEqual(["PUBLICADO"]);
    expect(TRANSICIONES_PRODUCTO.PUBLICADO).toEqual([
      "SUSPENDIDO",
      "DESCONTINUADO"
    ]);
    expect(TRANSICIONES_PRODUCTO.SUSPENDIDO).toEqual([
      "PUBLICADO",
      "DESCONTINUADO"
    ]);
    expect(TRANSICIONES_PRODUCTO.DESCONTINUADO).toEqual([]);

    expect(() => assertTransicionPermitida("BORRADOR", "PUBLICADO")).not.toThrow();
    expect(() => assertTransicionPermitida("PUBLICADO", "SUSPENDIDO")).not.toThrow();
    expect(() => assertTransicionPermitida("SUSPENDIDO", "PUBLICADO")).not.toThrow();
    expect(() => assertTransicionPermitida("DESCONTINUADO", "PUBLICADO")).toThrow(
      /no se puede pasar/i
    );
  });

  it("exige al menos una imagen para publicar", () => {
    const candidate = product(PRODUCT_A, SELLER_A);
    expect(errorOf(() => evaluarPublicacion(candidate, true))).toMatchObject({
      code: "REGLA_NEGOCIO_INCUMPLIDA",
      details: expect.objectContaining({ motivo: "PRODUCTO_NO_PUBLICABLE" })
    });

    expect(() =>
      evaluarPublicacion(
        {
          ...candidate,
          imagenes: [{ id: "img", url: "/products/x.svg", alt: "", orden: 0 }]
        },
        true
      )
    ).not.toThrow();
  });

  it("no publica con vendedor inactivo ni producto descontinuado", () => {
    const candidate = {
      ...product(PRODUCT_A, SELLER_A),
      imagenes: [{ id: "img", url: "/products/x.svg", alt: "", orden: 0 }]
    };
    expect(errorOf(() => evaluarPublicacion(candidate, false))).toMatchObject({
      details: expect.objectContaining({ motivo: "VENDEDOR_NO_ACTIVO" })
    });
    expect(
      errorOf(() =>
        evaluarPublicacion({ ...candidate, estado: "DESCONTINUADO" }, true)
      )
    ).toMatchObject({
      details: expect.objectContaining({ motivo: "PRODUCTO_DESCONTINUADO" })
    });
  });
});

describe("casos de uso del espacio del vendedor", () => {
  it("crea el producto en BORRADOR con el propietario de la sesión", async () => {
    const { store, ids, clock } = harness();
    const useCase = new CreateSellerProduct(store, clock, ids);

    const created = await useCase.execute(actorA, {
      datos: {
        nombre: "Lámpara",
        descripcion: "Lámpara de mesa",
        categoria: "HOGAR",
        tipoEntrega: "FISICA",
        sku: "LAMP-001",
        precioCentavos: 55000,
        moneda: "cop"
      }
    });

    expect(created.estado).toBe("BORRADOR");
    expect(created.vendedorId).toBe(SELLER_A);
    expect(created.moneda).toBe("COP");
    expect(created.imagenes).toEqual([]);
  });

  it("no permite editar un producto de otro vendedor", async () => {
    const { store, clock } = harness();
    const useCase = new UpdateSellerProduct(store, clock);

    await expect(
      useCase.execute(actorA, PRODUCT_B, { nombre: "Intrusión" })
    ).rejects.toMatchObject({ code: "RECURSO_NO_ENCONTRADO" });
  });

  it("publica solo después de agregar una imagen y permite suspender y reanudar", async () => {
    const { store, ids, clock } = harness();
    const publish = new PublishSellerProduct(store, clock);
    const addImage = new AddSellerProductImage(store, clock, ids);

    await expect(publish.execute(actorA, PRODUCT_A)).rejects.toMatchObject({
      code: "REGLA_NEGOCIO_INCUMPLIDA",
      details: expect.objectContaining({ motivo: "PRODUCTO_NO_PUBLICABLE" })
    });

    await addImage.execute(actorA, PRODUCT_A, {
      url: "/products/lampara.svg",
      alt: "Lámpara"
    });
    const published = await publish.execute(actorA, PRODUCT_A);
    expect(published.estado).toBe("PUBLICADO");

    const suspended = await new SuspendSellerProduct(store, clock).execute(
      actorA,
      PRODUCT_A
    );
    expect(suspended.estado).toBe("SUSPENDIDO");

    const resumed = await publish.execute(actorA, PRODUCT_A);
    expect(resumed.estado).toBe("PUBLICADO");
  });

  it("no reactiva un producto descontinuado", async () => {
    const { store, clock } = harness();
    store.seedProduct(
      product(PRODUCT_A, SELLER_A, {
        estado: "PUBLICADO",
        imagenes: [{ id: "img", url: "/products/x.svg", alt: "", orden: 0 }]
      })
    );
    const discontinue = new DiscontinueSellerProduct(store, clock);
    const publish = new PublishSellerProduct(store, clock);

    const discontinued = await discontinue.execute(actorA, PRODUCT_A);
    expect(discontinued.estado).toBe("DESCONTINUADO");

    await expect(publish.execute(actorA, PRODUCT_A)).rejects.toMatchObject({
      code: "REGLA_NEGOCIO_INCUMPLIDA",
      details: expect.objectContaining({ motivo: "PRODUCTO_DESCONTINUADO" })
    });
  });

  it("registra ingresos de inventario de forma idempotente y sin doble suma", async () => {
    const { store, ids, clock } = harness();
    const ingress = new RegisterInventoryIngress(store, clock, ids);

    const first = await ingress.execute(actorA, {
      productoId: PRODUCT_A,
      bodegaId: WAREHOUSE_A,
      cantidad: 5,
      idempotencyKey: "ingreso-1"
    });
    expect(first.duplicado).toBe(false);
    expect(first.posicion.onHand).toBe(5);

    const second = await ingress.execute(actorA, {
      productoId: PRODUCT_A,
      bodegaId: WAREHOUSE_A,
      cantidad: 5,
      idempotencyKey: "ingreso-1"
    });
    expect(second.duplicado).toBe(true);
    expect(second.movimientoId).toBe(first.movimientoId);
    expect(second.posicion.onHand).toBe(5);
  });

  it("rechaza inventario sobre producto o bodega de otro vendedor", async () => {
    const { store, ids, clock } = harness();
    const ingress = new RegisterInventoryIngress(store, clock, ids);

    await expect(
      ingress.execute(actorA, {
        productoId: PRODUCT_B,
        bodegaId: WAREHOUSE_A,
        cantidad: 1,
        idempotencyKey: "cruzado-1"
      })
    ).rejects.toMatchObject({ code: "RECURSO_NO_ENCONTRADO" });

    await expect(
      ingress.execute(actorA, {
        productoId: PRODUCT_A,
        bodegaId: WAREHOUSE_B,
        cantidad: 1,
        idempotencyKey: "cruzado-2"
      })
    ).rejects.toMatchObject({ code: "RECURSO_NO_ENCONTRADO" });
  });

  it("no inventaría productos digitales", async () => {
    const { store, ids, clock } = harness();
    store.seedProduct(product(PRODUCT_A, SELLER_A, { tipoEntrega: "DIGITAL" }));
    const ingress = new RegisterInventoryIngress(store, clock, ids);

    await expect(
      ingress.execute(actorA, {
        productoId: PRODUCT_A,
        bodegaId: WAREHOUSE_A,
        cantidad: 1,
        idempotencyKey: "digital-1"
      })
    ).rejects.toMatchObject({
      code: "REGLA_NEGOCIO_INCUMPLIDA",
      details: expect.objectContaining({ motivo: "PRODUCTO_DIGITAL_SIN_INVENTARIO" })
    });
  });

  it("solo consulta los pedidos del vendedor autenticado", async () => {
    const { store } = harness();
    const order: SellerOrderDetail = {
      id: "order-b",
      numero: "NM-2026-0001",
      estado: "PAGADO",
      estadoPago: "CAPTURADO",
      moneda: "COP",
      totalCentavos: 10000,
      itemsCount: 1,
      creadoEn: NOW,
      items: []
    };
    store.seedOrder(SELLER_B, order);

    const list = new ListSellerOrders(store);
    const get = new GetSellerOrder(store);

    expect(await list.execute(actorA)).toEqual([]);
    await expect(get.execute(actorA, "order-b")).rejects.toMatchObject({
      code: "RECURSO_NO_ENCONTRADO"
    });
    expect(await get.execute(actorB, "order-b")).toMatchObject({ id: "order-b" });
  });
});
