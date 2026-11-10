import type {
  AdminBuyerDetail,
  AdminBuyerFilter,
  AdminBuyerSummary,
  AdminDashboardView,
  AdminInventoryFilter,
  AdminInventoryView,
  AdminMovementFilter,
  AdminMovementView,
  AdminOrderDetail,
  AdminOrderFilter,
  AdminOrderSummary,
  AdminPage,
  AdminPaymentFilter,
  AdminPaymentSummary,
  AdminProductDetail,
  AdminProductFilter,
  AdminProductSummary,
  AdminReportsView,
  AdminSellerDetail,
  AdminSellerFilter,
  AdminSellerSummary,
  AdminStore,
  AdminUserDetail,
  AdminUserFilter,
  AdminUserSummary,
  AdminWarehouseDetail,
  AdminWarehouseFilter,
  AdminWarehouseView
} from "../../src/modules/admin/application/ports.js";

/**
 * Doble en memoria del puerto administrativo. No implementa escrituras porque
 * el puerto no las declara.
 */
export class FakeAdminStore implements AdminStore {
  private readonly users = new Map<string, AdminUserDetail>();
  private readonly buyers = new Map<string, AdminBuyerDetail>();
  private readonly sellers = new Map<string, AdminSellerDetail>();
  private readonly warehouses = new Map<string, AdminWarehouseDetail>();
  private readonly products = new Map<string, AdminProductDetail>();
  private inventory: AdminInventoryView[] = [];
  private movements: AdminMovementView[] = [];
  private readonly orders = new Map<string, AdminOrderDetail>();
  private payments: AdminPaymentSummary[] = [];

  seedUser(user: AdminUserDetail): void {
    this.users.set(user.id, user);
  }

  seedBuyer(buyer: AdminBuyerDetail): void {
    this.buyers.set(buyer.id, buyer);
  }

  seedSeller(seller: AdminSellerDetail): void {
    this.sellers.set(seller.id, seller);
  }

  seedWarehouse(warehouse: AdminWarehouseDetail): void {
    this.warehouses.set(warehouse.id, warehouse);
  }

  seedProduct(product: AdminProductDetail): void {
    this.products.set(product.id, product);
  }

  seedInventory(positions: readonly AdminInventoryView[]): void {
    this.inventory = [...positions];
  }

  seedMovements(movements: readonly AdminMovementView[]): void {
    this.movements = [...movements];
  }

  seedOrder(order: AdminOrderDetail): void {
    this.orders.set(order.id, order);
  }

  seedPayments(payments: readonly AdminPaymentSummary[]): void {
    this.payments = [...payments];
  }

  async dashboard(): Promise<AdminDashboardView> {
    return {
      ...(await this.reports()),
      recientes: {
        usuarios: [...this.users.values()].slice(0, 5),
        compradores: [...this.buyers.values()].slice(0, 5),
        vendedores: [...this.sellers.values()].slice(0, 5),
        pedidos: [...this.orders.values()].slice(0, 5)
      }
    };
  }

  async reports(): Promise<AdminReportsView> {
    const users = [...this.users.values()];
    const buyers = [...this.buyers.values()];
    const sellers = [...this.sellers.values()];
    const warehouses = [...this.warehouses.values()];
    const products = [...this.products.values()];
    const orders = [...this.orders.values()];
    const operators = users.filter((user) => user.rol === "OPERADOR_LOGISTICO");

    return {
      usuarios: {
        total: users.length,
        porRol: {
          COMPRADOR: users.filter((u) => u.rol === "COMPRADOR").length,
          VENDEDOR: users.filter((u) => u.rol === "VENDEDOR").length,
          OPERADOR_LOGISTICO: operators.length,
          ADMINISTRADOR: users.filter((u) => u.rol === "ADMINISTRADOR").length,
          SUPERVISOR: users.filter((u) => u.rol === "SUPERVISOR").length
        },
        porEstado: {
          ACTIVO: users.filter((u) => u.estado === "ACTIVO").length,
          INACTIVO: users.filter((u) => u.estado === "INACTIVO").length,
          BLOQUEADO: users.filter((u) => u.estado === "BLOQUEADO").length
        }
      },
      compradores: {
        total: buyers.length,
        porEstado: {
          HABILITADO: buyers.filter((b) => b.estadoComercial === "HABILITADO")
            .length,
          RESTRINGIDO: buyers.filter((b) => b.estadoComercial === "RESTRINGIDO")
            .length
        }
      },
      vendedores: {
        total: sellers.length,
        porEstado: {
          EN_REVISION: sellers.filter((s) => s.estado === "EN_REVISION").length,
          ACTIVO: sellers.filter((s) => s.estado === "ACTIVO").length,
          SUSPENDIDO: sellers.filter((s) => s.estado === "SUSPENDIDO").length,
          INACTIVO: sellers.filter((s) => s.estado === "INACTIVO").length
        }
      },
      operadoresLogisticos: {
        total: operators.length,
        porEstado: {
          ACTIVO: operators.filter((u) => u.estado === "ACTIVO").length,
          INACTIVO: operators.filter((u) => u.estado !== "ACTIVO").length
        }
      },
      bodegas: {
        total: warehouses.length,
        porEstado: {
          ACTIVA: warehouses.filter((w) => w.estado === "ACTIVA").length,
          INACTIVA: warehouses.filter((w) => w.estado === "INACTIVA").length
        },
        porTipo: {
          MARKETPLACE: warehouses.filter((w) => w.tipo === "MARKETPLACE")
            .length,
          VENDEDOR: warehouses.filter((w) => w.tipo === "VENDEDOR").length
        }
      },
      catalogo: {
        total: products.length,
        porEstado: {
          BORRADOR: products.filter((p) => p.estado === "BORRADOR").length,
          PUBLICADO: products.filter((p) => p.estado === "PUBLICADO").length,
          SUSPENDIDO: products.filter((p) => p.estado === "SUSPENDIDO").length,
          DESCONTINUADO: products.filter((p) => p.estado === "DESCONTINUADO")
            .length
        },
        porCategoria: {
          ELECTRONICA: products.filter((p) => p.categoria === "ELECTRONICA")
            .length,
          ROPA: products.filter((p) => p.categoria === "ROPA").length,
          HOGAR: products.filter((p) => p.categoria === "HOGAR").length,
          DIGITAL: products.filter((p) => p.categoria === "DIGITAL").length
        },
        porTipoEntrega: {
          FISICA: products.filter((p) => p.tipoEntrega === "FISICA").length,
          DIGITAL: products.filter((p) => p.tipoEntrega === "DIGITAL").length
        }
      },
      inventario: {
        posiciones: this.inventory.length,
        onHand: sum(this.inventory, (p) => p.onHand),
        reserved: sum(this.inventory, (p) => p.reserved),
        unavailable: sum(this.inventory, (p) => p.unavailable),
        disponible: sum(this.inventory, (p) => p.disponible)
      },
      pedidos: {
        total: orders.length,
        porEstado: {
          PENDIENTE_DE_PAGO: orders.filter(
            (o) => o.estado === "PENDIENTE_DE_PAGO"
          ).length,
          PAGADO: orders.filter((o) => o.estado === "PAGADO").length,
          EN_PREPARACION: orders.filter((o) => o.estado === "EN_PREPARACION")
            .length,
          DESPACHADO: orders.filter((o) => o.estado === "DESPACHADO").length,
          ENTREGADO: orders.filter((o) => o.estado === "ENTREGADO").length,
          CANCELADO: orders.filter((o) => o.estado === "CANCELADO").length,
          CERRADO: orders.filter((o) => o.estado === "CERRADO").length
        }
      },
      pagos: {
        total: this.payments.length,
        porEstado: {
          PENDIENTE: this.payments.filter((p) => p.estado === "PENDIENTE")
            .length,
          AUTORIZADO: this.payments.filter((p) => p.estado === "AUTORIZADO")
            .length,
          CAPTURADO: this.payments.filter((p) => p.estado === "CAPTURADO")
            .length,
          RECHAZADO: this.payments.filter((p) => p.estado === "RECHAZADO")
            .length,
          CANCELADO: this.payments.filter((p) => p.estado === "CANCELADO")
            .length,
          REEMBOLSO_PARCIAL: this.payments.filter(
            (p) => p.estado === "REEMBOLSO_PARCIAL"
          ).length,
          REEMBOLSADO: this.payments.filter((p) => p.estado === "REEMBOLSADO")
            .length
        }
      },
      envios: {
        total: 0,
        porEstado: {
          PREPARACION: 0,
          EMPACADO: 0,
          DESPACHADO: 0,
          EN_TRANSITO: 0,
          ENTREGADO: 0,
          FALLIDO: 0,
          DEVUELTO: 0
        }
      }
    };
  }

  async listUsers(
    filter: AdminUserFilter
  ): Promise<AdminPage<AdminUserSummary>> {
    const items = [...this.users.values()]
      .filter((user) => (filter.rol === null ? true : user.rol === filter.rol))
      .filter((user) =>
        filter.estado === null ? true : user.estado === filter.estado
      )
      .filter((user) =>
        matches(filter.search, user.nombreCompleto, user.correoElectronico)
      );
    return paginate(items, filter);
  }

  async findUser(userId: string): Promise<AdminUserDetail | null> {
    return this.users.get(userId) ?? null;
  }

  async listBuyers(
    filter: AdminBuyerFilter
  ): Promise<AdminPage<AdminBuyerSummary>> {
    const items = [...this.buyers.values()]
      .filter((buyer) =>
        filter.estadoComercial === null
          ? true
          : buyer.estadoComercial === filter.estadoComercial
      )
      .filter((buyer) =>
        matches(filter.search, buyer.nombreCompleto, buyer.correoElectronico)
      );
    return paginate(items, filter);
  }

  async findBuyer(buyerId: string): Promise<AdminBuyerDetail | null> {
    return this.buyers.get(buyerId) ?? null;
  }

  async listSellers(
    filter: AdminSellerFilter
  ): Promise<AdminPage<AdminSellerSummary>> {
    const items = [...this.sellers.values()]
      .filter((seller) =>
        filter.estado === null ? true : seller.estado === filter.estado
      )
      .filter((seller) =>
        matches(filter.search, seller.nombreComercial, seller.correoElectronico)
      );
    return paginate(items, filter);
  }

  async findSeller(sellerId: string): Promise<AdminSellerDetail | null> {
    return this.sellers.get(sellerId) ?? null;
  }

  async listWarehouses(
    filter: AdminWarehouseFilter
  ): Promise<AdminPage<AdminWarehouseView>> {
    const items = [...this.warehouses.values()]
      .filter((warehouse) =>
        filter.estado === null ? true : warehouse.estado === filter.estado
      )
      .filter((warehouse) =>
        filter.vendedorId === null
          ? true
          : warehouse.vendedorId === filter.vendedorId
      )
      .filter((warehouse) =>
        matches(
          filter.search,
          warehouse.nombre,
          warehouse.ubicacion,
          warehouse.vendedorNombre
        )
      );
    return paginate(items, filter);
  }

  async findWarehouse(
    warehouseId: string
  ): Promise<AdminWarehouseDetail | null> {
    return this.warehouses.get(warehouseId) ?? null;
  }

  async listProducts(
    filter: AdminProductFilter
  ): Promise<AdminPage<AdminProductSummary>> {
    const items = [...this.products.values()]
      .filter((product) =>
        filter.estado === null ? true : product.estado === filter.estado
      )
      .filter((product) =>
        filter.categoria === null
          ? true
          : product.categoria === filter.categoria
      )
      .filter((product) =>
        filter.tipoEntrega === null
          ? true
          : product.tipoEntrega === filter.tipoEntrega
      )
      .filter((product) =>
        filter.vendedorId === null
          ? true
          : product.vendedorId === filter.vendedorId
      )
      .filter((product) =>
        matches(
          filter.search,
          product.nombre,
          product.sku,
          product.vendedorNombre
        )
      );
    return paginate(items, filter);
  }

  async findProduct(productId: string): Promise<AdminProductDetail | null> {
    return this.products.get(productId) ?? null;
  }

  async listInventory(
    filter: AdminInventoryFilter
  ): Promise<AdminPage<AdminInventoryView>> {
    const items = this.inventory
      .filter((position) =>
        filter.bodegaId === null ? true : position.bodegaId === filter.bodegaId
      )
      .filter((position) =>
        filter.productoId === null
          ? true
          : position.productoId === filter.productoId
      )
      .filter((position) =>
        filter.vendedorId === null
          ? true
          : position.vendedorId === filter.vendedorId
      )
      .filter((position) =>
        matches(
          filter.search,
          position.productoNombre,
          position.sku,
          position.bodegaNombre,
          position.vendedorNombre
        )
      );
    return paginate(items, filter);
  }

  async listMovements(
    filter: AdminMovementFilter
  ): Promise<AdminPage<AdminMovementView>> {
    const items = this.movements
      .filter((movement) =>
        filter.bodegaId === null ? true : movement.bodegaId === filter.bodegaId
      )
      .filter((movement) =>
        filter.productoId === null
          ? true
          : movement.productoId === filter.productoId
      );
    return paginate(items, filter);
  }

  async listOrders(
    filter: AdminOrderFilter
  ): Promise<AdminPage<AdminOrderSummary>> {
    const items = [...this.orders.values()]
      .filter((order) =>
        filter.estado === null ? true : order.estado === filter.estado
      )
      .filter((order) =>
        matches(
          filter.search,
          order.numero,
          order.compradorNombre,
          order.vendedorNombre
        )
      );
    return paginate(items, filter);
  }

  async findOrder(orderId: string): Promise<AdminOrderDetail | null> {
    return this.orders.get(orderId) ?? null;
  }

  async listPayments(
    filter: AdminPaymentFilter
  ): Promise<AdminPage<AdminPaymentSummary>> {
    const items = this.payments
      .filter((payment) =>
        filter.estado === null ? true : payment.estado === filter.estado
      )
      .filter((payment) =>
        matches(filter.search, payment.pedidoNumero, payment.compradorNombre)
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

function matches(
  search: string | null,
  ...values: readonly (string | null)[]
): boolean {
  if (search === null) {
    return true;
  }
  const needle = search.toLowerCase();
  return values.some(
    (value) => value !== null && value.toLowerCase().includes(needle)
  );
}

function paginate<T>(
  items: readonly T[],
  filter: { readonly page: number; readonly pageSize: number }
): AdminPage<T> {
  const start = (filter.page - 1) * filter.pageSize;
  return {
    items: items.slice(start, start + filter.pageSize),
    total: items.length,
    page: filter.page,
    pageSize: filter.pageSize
  };
}
