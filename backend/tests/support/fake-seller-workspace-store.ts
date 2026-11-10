import {
  AuthorizationError,
  BusinessRuleError,
  ResourceNotFoundError
} from "../../src/shared/domain/errors.js";
import type {
  AddImageRecord,
  CreateProductRecord,
  CreateWarehouseRecord,
  IngressCommand,
  IngressResult,
  SellerInventoryView,
  SellerOrderDetail,
  SellerOrderSummary,
  SellerProductView,
  SellerProfileView,
  SellerWarehouseView,
  SellerWorkspaceStore,
  WarehouseChanges
} from "../../src/modules/seller-workspace/application/ports.js";
import type {
  DatosProducto,
  EstadoProductoVendedor
} from "../../src/modules/seller-workspace/domain/producto-vendedor.js";

export interface InventoryPosition {
  productoId: string;
  bodegaId: string;
  onHand: number;
  reserved: number;
  unavailable: number;
  actualizadoEn: string;
}

interface StoredOrder {
  readonly sellerId: string;
  readonly detail: SellerOrderDetail;
}

/**
 * Doble en memoria para pruebas unitarias y HTTP. No se usa en producción:
 * el adaptador real es PostgreSQL.
 */
export class FakeSellerWorkspaceStore implements SellerWorkspaceStore {
  private readonly profiles = new Map<string, SellerProfileView>();
  private readonly products = new Map<string, SellerProductView>();
  private readonly warehouses = new Map<string, SellerWarehouseView>();
  private readonly inventory = new Map<string, InventoryPosition>();
  private readonly movements = new Map<
    string,
    { id: string; position: SellerInventoryView }
  >();
  private readonly orders = new Map<string, StoredOrder>();

  seedProfile(profile: SellerProfileView): void {
    this.profiles.set(profile.id, profile);
  }

  seedWarehouse(warehouse: SellerWarehouseView): void {
    this.warehouses.set(warehouse.id, warehouse);
  }

  seedProduct(product: SellerProductView): void {
    this.products.set(product.id, product);
  }

  seedInventory(position: InventoryPosition): void {
    this.inventory.set(`${position.productoId}:${position.bodegaId}`, position);
  }

  seedOrder(sellerId: string, detail: SellerOrderDetail): void {
    this.orders.set(detail.id, { sellerId, detail });
  }

  async findProfile(sellerId: string): Promise<SellerProfileView | null> {
    return this.profiles.get(sellerId) ?? null;
  }

  async updateProfile(
    sellerId: string,
    nombreComercial: string,
    _now: string
  ): Promise<SellerProfileView | null> {
    const current = this.profiles.get(sellerId);
    if (!current) {
      return null;
    }
    const updated = { ...current, nombreComercial };
    this.profiles.set(sellerId, updated);
    return updated;
  }

  async listProducts(sellerId: string): Promise<SellerProductView[]> {
    return [...this.products.values()]
      .filter((product) => product.vendedorId === sellerId)
      .map((product) => this.withInventory(product));
  }

  async findProduct(
    sellerId: string,
    productoId: string
  ): Promise<SellerProductView | null> {
    const product = this.products.get(productoId);
    if (!product || product.vendedorId !== sellerId) {
      return null;
    }
    return this.withInventory(product);
  }

  async createProduct(record: CreateProductRecord): Promise<SellerProductView> {
    const product: SellerProductView = {
      id: record.id,
      vendedorId: record.vendedorId,
      nombre: record.datos.nombre,
      descripcion: record.datos.descripcion,
      categoria: record.datos.categoria,
      tipoEntrega: record.datos.tipoEntrega,
      sku: record.datos.sku,
      precioCentavos: record.datos.precioCentavos,
      moneda: record.datos.moneda,
      estado: "BORRADOR",
      creadoEn: record.creadoEn,
      actualizadoEn: record.creadoEn,
      imagenes: record.imagenes.map((imagen) => ({ ...imagen })),
      inventario:
        record.datos.tipoEntrega === "FISICA"
          ? { onHand: 0, reserved: 0, unavailable: 0, disponible: 0 }
          : null
    };
    this.products.set(product.id, product);
    return product;
  }

  async updateProduct(
    sellerId: string,
    productoId: string,
    datos: DatosProducto,
    now: string
  ): Promise<SellerProductView | null> {
    const current = this.products.get(productoId);
    if (!current || current.vendedorId !== sellerId) {
      return null;
    }
    const updated: SellerProductView = {
      ...current,
      ...datos,
      actualizadoEn: now
    };
    this.products.set(productoId, updated);
    return this.withInventory(updated);
  }

  async updateProductState(
    sellerId: string,
    productoId: string,
    expected: EstadoProductoVendedor,
    next: EstadoProductoVendedor,
    now: string
  ): Promise<SellerProductView | null> {
    const current = this.products.get(productoId);
    if (!current || current.vendedorId !== sellerId) {
      return null;
    }
    if (current.estado !== expected) {
      throw new BusinessRuleError("El estado del producto cambió.", {
        motivo: "CONFLICTO_ESTADO"
      });
    }
    const updated: SellerProductView = {
      ...current,
      estado: next,
      actualizadoEn: now
    };
    this.products.set(productoId, updated);
    return this.withInventory(updated);
  }

  async addProductImage(
    record: AddImageRecord
  ): Promise<SellerProductView | null> {
    const current = this.products.get(record.productoId);
    if (!current || current.vendedorId !== record.vendedorId) {
      return null;
    }
    const orden = current.imagenes.length;
    const updated: SellerProductView = {
      ...current,
      imagenes: [
        ...current.imagenes,
        { id: record.id, url: record.url, alt: record.alt, orden }
      ]
    };
    this.products.set(record.productoId, updated);
    return this.withInventory(updated);
  }

  async removeProductImage(
    sellerId: string,
    productoId: string,
    imageId: string
  ): Promise<SellerProductView | null> {
    const current = this.products.get(productoId);
    if (!current || current.vendedorId !== sellerId) {
      return null;
    }
    const exists = current.imagenes.some((imagen) => imagen.id === imageId);
    if (!exists) {
      return null;
    }
    const updated: SellerProductView = {
      ...current,
      imagenes: current.imagenes.filter((imagen) => imagen.id !== imageId)
    };
    this.products.set(productoId, updated);
    return this.withInventory(updated);
  }

  async listWarehouses(sellerId: string): Promise<SellerWarehouseView[]> {
    return [...this.warehouses.values()].filter(
      (warehouse) => warehouse.vendedorId === sellerId
    );
  }

  async createWarehouse(
    record: CreateWarehouseRecord
  ): Promise<SellerWarehouseView> {
    const warehouse: SellerWarehouseView = {
      id: record.id,
      vendedorId: record.vendedorId,
      nombre: record.nombre,
      ubicacion: record.ubicacion,
      estado: "ACTIVA",
      creadaEn: record.creadaEn
    };
    this.warehouses.set(warehouse.id, warehouse);
    return warehouse;
  }

  async updateWarehouse(
    sellerId: string,
    warehouseId: string,
    changes: WarehouseChanges
  ): Promise<SellerWarehouseView | null> {
    const current = this.warehouses.get(warehouseId);
    if (!current || current.vendedorId !== sellerId) {
      return null;
    }
    const updated: SellerWarehouseView = {
      ...current,
      nombre: changes.nombre ?? current.nombre,
      ubicacion: changes.ubicacion ?? current.ubicacion
    };
    this.warehouses.set(warehouseId, updated);
    return updated;
  }

  async listInventory(sellerId: string): Promise<SellerInventoryView[]> {
    const result: SellerInventoryView[] = [];
    for (const position of this.inventory.values()) {
      const product = this.products.get(position.productoId);
      const warehouse = this.warehouses.get(position.bodegaId);
      if (
        !product ||
        !warehouse ||
        product.vendedorId !== sellerId ||
        warehouse.vendedorId !== sellerId
      ) {
        continue;
      }
      result.push(this.toInventoryView(position, product, warehouse));
    }
    return result;
  }

  async registerIngress(command: IngressCommand): Promise<IngressResult> {
    const profile = this.profiles.get(command.vendedorId);
    if (!profile) {
      throw new ResourceNotFoundError("El perfil de vendedor no existe.");
    }
    if (profile.estado !== "ACTIVO") {
      throw new AuthorizationError("El perfil de vendedor no está activo.");
    }
    const product = this.products.get(command.productoId);
    if (!product || product.vendedorId !== command.vendedorId) {
      throw new ResourceNotFoundError("El producto no pertenece al vendedor.");
    }
    if (product.tipoEntrega !== "FISICA") {
      throw new BusinessRuleError(
        "Los productos digitales no usan inventario.",
        {
          motivo: "PRODUCTO_DIGITAL_SIN_INVENTARIO"
        }
      );
    }
    if (product.estado === "DESCONTINUADO") {
      throw new BusinessRuleError("El producto está descontinuado.", {
        motivo: "PRODUCTO_DESCONTINUADO"
      });
    }
    const warehouse = this.warehouses.get(command.bodegaId);
    if (!warehouse || warehouse.vendedorId !== command.vendedorId) {
      throw new ResourceNotFoundError("La bodega no pertenece al vendedor.");
    }
    if (warehouse.estado !== "ACTIVA") {
      throw new BusinessRuleError("La bodega está inactiva.", {
        motivo: "BODEGA_INACTIVA"
      });
    }

    const movementKey = `${command.vendedorId}:${command.idempotencyKey}`;
    const existing = this.movements.get(movementKey);
    if (existing) {
      return {
        movimientoId: existing.id,
        duplicado: true,
        posicion: existing.position
      };
    }

    const key = `${command.productoId}:${command.bodegaId}`;
    const current = this.inventory.get(key) ?? {
      productoId: command.productoId,
      bodegaId: command.bodegaId,
      onHand: 0,
      reserved: 0,
      unavailable: 0,
      actualizadoEn: command.now
    };
    const updated: InventoryPosition = {
      ...current,
      onHand: current.onHand + command.cantidad,
      actualizadoEn: command.now
    };
    this.inventory.set(key, updated);
    const view = this.toInventoryView(updated, product, warehouse);
    this.movements.set(movementKey, {
      id: command.movimientoId,
      position: view
    });
    return {
      movimientoId: command.movimientoId,
      duplicado: false,
      posicion: view
    };
  }

  async listOrders(sellerId: string): Promise<SellerOrderSummary[]> {
    return [...this.orders.values()]
      .filter((entry) => entry.sellerId === sellerId)
      .map((entry) => {
        const { items: _items, ...summary } = entry.detail;
        return summary;
      });
  }

  async findOrder(
    sellerId: string,
    orderId: string
  ): Promise<SellerOrderDetail | null> {
    const entry = this.orders.get(orderId);
    return entry && entry.sellerId === sellerId ? entry.detail : null;
  }

  async healthCheck(): Promise<void> {
    return undefined;
  }

  async close(): Promise<void> {
    return undefined;
  }

  private withInventory(product: SellerProductView): SellerProductView {
    if (product.tipoEntrega === "DIGITAL") {
      return { ...product, inventario: null };
    }
    const positions = [...this.inventory.values()].filter(
      (position) => position.productoId === product.id
    );
    const onHand = positions.reduce(
      (total, position) => total + position.onHand,
      0
    );
    const reserved = positions.reduce(
      (total, position) => total + position.reserved,
      0
    );
    const unavailable = positions.reduce(
      (total, position) => total + position.unavailable,
      0
    );
    return {
      ...product,
      inventario: {
        onHand,
        reserved,
        unavailable,
        disponible: onHand - reserved - unavailable
      }
    };
  }

  private toInventoryView(
    position: InventoryPosition,
    product: SellerProductView,
    warehouse: SellerWarehouseView
  ): SellerInventoryView {
    return {
      productoId: position.productoId,
      productoNombre: product.nombre,
      sku: product.sku,
      bodegaId: position.bodegaId,
      bodegaNombre: warehouse.nombre,
      onHand: position.onHand,
      reserved: position.reserved,
      unavailable: position.unavailable,
      disponible: position.onHand - position.reserved - position.unavailable,
      actualizadoEn: position.actualizadoEn
    };
  }
}
