import type {
  SupervisorDashboardView,
  SupervisorInventoryFilter,
  SupervisorInventoryView,
  SupervisorOrderDetail,
  SupervisorOrderFilter,
  SupervisorOrderSummary,
  SupervisorPage,
  SupervisorProductDetail,
  SupervisorProductFilter,
  SupervisorProductSummary,
  SupervisorSellerFilter,
  SupervisorSellerView,
  SupervisorShipmentFilter,
  SupervisorShipmentSummary,
  SupervisorStore,
  SupervisorWarehouseView
} from "../../src/modules/supervisor/application/ports.js";

/**
 * Doble en memoria del puerto de supervisión. No implementa escrituras porque
 * el puerto no las declara: así una prueba no puede "aprobar" una operación que
 * el adaptador real no permite.
 */
export class FakeSupervisorStore implements SupervisorStore {
  private readonly orders = new Map<string, SupervisorOrderDetail>();
  private readonly products = new Map<string, SupervisorProductDetail>();
  private readonly warehouses = new Map<string, SupervisorWarehouseView>();
  private inventory: SupervisorInventoryView[] = [];
  private shipments: SupervisorShipmentSummary[] = [];
  private sellers: SupervisorSellerView[] = [];
  private operators = { activo: 0, inactivo: 0 };
  private buyers = { habilitado: 0, restringido: 0 };

  seedOrder(order: SupervisorOrderDetail): void {
    this.orders.set(order.id, order);
  }

  seedProduct(product: SupervisorProductDetail): void {
    this.products.set(product.id, product);
  }

  seedWarehouse(warehouse: SupervisorWarehouseView): void {
    this.warehouses.set(warehouse.id, warehouse);
  }

  seedInventory(positions: readonly SupervisorInventoryView[]): void {
    this.inventory = [...positions];
  }

  seedShipments(shipments: readonly SupervisorShipmentSummary[]): void {
    this.shipments = [...shipments];
  }

  seedSellers(sellers: readonly SupervisorSellerView[]): void {
    this.sellers = [...sellers];
  }

  seedOperators(activo: number, inactivo: number): void {
    this.operators = { activo, inactivo };
  }

  seedBuyers(habilitado: number, restringido: number): void {
    this.buyers = { habilitado, restringido };
  }

  async dashboard(): Promise<SupervisorDashboardView> {
    const orders = [...this.orders.values()];
    const products = [...this.products.values()];
    return {
      pedidosTotal: orders.length,
      pedidosPorEstado: {
        PENDIENTE_DE_PAGO: orders.filter((o) => o.estado === "PENDIENTE_DE_PAGO").length,
        PAGADO: orders.filter((o) => o.estado === "PAGADO").length,
        EN_PREPARACION: orders.filter((o) => o.estado === "EN_PREPARACION").length,
        DESPACHADO: orders.filter((o) => o.estado === "DESPACHADO").length,
        ENTREGADO: orders.filter((o) => o.estado === "ENTREGADO").length,
        CANCELADO: orders.filter((o) => o.estado === "CANCELADO").length,
        CERRADO: orders.filter((o) => o.estado === "CERRADO").length
      },
      pagosPorEstado: {
        PENDIENTE: orders.filter((o) => o.pago?.estado === "PENDIENTE").length,
        AUTORIZADO: orders.filter((o) => o.pago?.estado === "AUTORIZADO").length,
        CAPTURADO: orders.filter((o) => o.pago?.estado === "CAPTURADO").length,
        RECHAZADO: orders.filter((o) => o.pago?.estado === "RECHAZADO").length,
        CANCELADO: orders.filter((o) => o.pago?.estado === "CANCELADO").length,
        REEMBOLSO_PARCIAL: orders.filter((o) => o.pago?.estado === "REEMBOLSO_PARCIAL")
          .length,
        REEMBOLSADO: orders.filter((o) => o.pago?.estado === "REEMBOLSADO").length
      },
      productosTotal: products.length,
      productosPorEstado: {
        BORRADOR: products.filter((p) => p.estado === "BORRADOR").length,
        PUBLICADO: products.filter((p) => p.estado === "PUBLICADO").length,
        SUSPENDIDO: products.filter((p) => p.estado === "SUSPENDIDO").length,
        DESCONTINUADO: products.filter((p) => p.estado === "DESCONTINUADO").length
      },
      inventario: {
        posiciones: this.inventory.length,
        onHand: sum(this.inventory, (p) => p.onHand),
        reserved: sum(this.inventory, (p) => p.reserved),
        unavailable: sum(this.inventory, (p) => p.unavailable),
        disponible: sum(this.inventory, (p) => p.disponible)
      },
      almacenesTotal: this.warehouses.size,
      almacenesPorEstado: {
        ACTIVA: [...this.warehouses.values()].filter((w) => w.estado === "ACTIVA").length,
        INACTIVA: [...this.warehouses.values()].filter((w) => w.estado === "INACTIVA")
          .length
      },
      enviosTotal: this.shipments.length,
      enviosPorEstado: {
        PREPARACION: this.shipments.filter((s) => s.estado === "PREPARACION").length,
        EMPACADO: this.shipments.filter((s) => s.estado === "EMPACADO").length,
        DESPACHADO: this.shipments.filter((s) => s.estado === "DESPACHADO").length,
        EN_TRANSITO: this.shipments.filter((s) => s.estado === "EN_TRANSITO").length,
        ENTREGADO: this.shipments.filter((s) => s.estado === "ENTREGADO").length,
        FALLIDO: this.shipments.filter((s) => s.estado === "FALLIDO").length,
        DEVUELTO: this.shipments.filter((s) => s.estado === "DEVUELTO").length
      },
      vendedoresTotal: this.sellers.length,
      vendedoresPorEstado: {
        EN_REVISION: this.sellers.filter((s) => s.estado === "EN_REVISION").length,
        ACTIVO: this.sellers.filter((s) => s.estado === "ACTIVO").length,
        SUSPENDIDO: this.sellers.filter((s) => s.estado === "SUSPENDIDO").length,
        INACTIVO: this.sellers.filter((s) => s.estado === "INACTIVO").length
      },
      operadoresLogisticosTotal: this.operators.activo + this.operators.inactivo,
      operadoresLogisticosPorEstado: {
        ACTIVO: this.operators.activo,
        INACTIVO: this.operators.inactivo
      },
      compradoresTotal: this.buyers.habilitado + this.buyers.restringido,
      compradoresPorEstado: {
        HABILITADO: this.buyers.habilitado,
        RESTRINGIDO: this.buyers.restringido
      }
    };
  }

  async listOrders(
    filter: SupervisorOrderFilter
  ): Promise<SupervisorPage<SupervisorOrderSummary>> {
    const items = [...this.orders.values()]
      .filter((order) => (filter.estado === null ? true : order.estado === filter.estado))
      .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
    return paginate(items, filter);
  }

  async findOrder(orderId: string): Promise<SupervisorOrderDetail | null> {
    return this.orders.get(orderId) ?? null;
  }

  async listProducts(
    filter: SupervisorProductFilter
  ): Promise<SupervisorPage<SupervisorProductSummary>> {
    const items = [...this.products.values()]
      .filter((product) => (filter.estado === null ? true : product.estado === filter.estado))
      .filter((product) =>
        filter.categoria === null ? true : product.categoria === filter.categoria
      )
      .filter((product) =>
        filter.vendedorId === null ? true : product.vendedorId === filter.vendedorId
      );
    return paginate(items, filter);
  }

  async findProduct(productId: string): Promise<SupervisorProductDetail | null> {
    return this.products.get(productId) ?? null;
  }

  async listWarehouses(): Promise<SupervisorWarehouseView[]> {
    return [...this.warehouses.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  async listInventory(
    filter: SupervisorInventoryFilter
  ): Promise<SupervisorPage<SupervisorInventoryView>> {
    const items = this.inventory
      .filter((position) =>
        filter.bodegaId === null ? true : position.bodegaId === filter.bodegaId
      )
      .filter((position) =>
        filter.productoId === null ? true : position.productoId === filter.productoId
      );
    return paginate(items, filter);
  }

  async listShipments(
    filter: SupervisorShipmentFilter
  ): Promise<SupervisorPage<SupervisorShipmentSummary>> {
    const items = this.shipments
      .filter((shipment) =>
        filter.estado === null ? true : shipment.estado === filter.estado
      )
      .filter((shipment) =>
        filter.pedidoId === null ? true : shipment.pedidoId === filter.pedidoId
      );
    return paginate(items, filter);
  }

  async listSellers(
    filter: SupervisorSellerFilter
  ): Promise<SupervisorPage<SupervisorSellerView>> {
    const items = this.sellers.filter((seller) =>
      filter.estado === null ? true : seller.estado === filter.estado
    );
    return paginate(items, filter);
  }

  async healthCheck(): Promise<void> {
    return;
  }

  async close(): Promise<void> {
    return;
  }
}

function sum<T>(items: readonly T[], pick: (item: T) => number): number {
  return items.reduce((total, item) => total + pick(item), 0);
}

function paginate<T>(
  items: readonly T[],
  filter: { readonly page: number; readonly pageSize: number }
): SupervisorPage<T> {
  const start = (filter.page - 1) * filter.pageSize;
  return {
    items: items.slice(start, start + filter.pageSize),
    total: items.length,
    page: filter.page,
    pageSize: filter.pageSize
  };
}
