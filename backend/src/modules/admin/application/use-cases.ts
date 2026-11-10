import {
  AuthorizationError,
  ResourceNotFoundError,
  ValidationError
} from "../../../shared/domain/errors.js";
import type { CategoriaProducto } from "../../catalog/domain/producto.js";
import type { EstadoPedido } from "../../orders/application/ports.js";
import type { EstadoPago } from "../../orders/application/ports.js";
import type { AuthenticatedUser } from "../../identity/application/ports.js";
import type {
  EstadoUsuario,
  RolSistema
} from "../../identity/domain/usuario.js";
import type { EstadoVendedor } from "../../seller-workspace/application/ports.js";
import type {
  EstadoProductoVendedor,
  TipoEntregaVendedor
} from "../../seller-workspace/domain/producto-vendedor.js";
import { PAGE_SIZE_MAX, type AdminStore } from "./ports.js";

/**
 * El Administrador solo puede consultar a través de este módulo. Las dos altas
 * administrativas existentes viven en sus propios módulos y conservan su
 * transacción atómica. La comprobación de rol y estado se repite aquí además de
 * la guarda HTTP para que otra interfaz de entrada no pueda omitirla.
 */
function assertAdmin(actor: AuthenticatedUser): void {
  if (actor.rol !== "ADMINISTRADOR") {
    throw new AuthorizationError(
      "Solo un administrador puede consultar el espacio administrativo."
    );
  }
  if (actor.estado !== "ACTIVO") {
    throw new AuthorizationError("La cuenta del administrador no está activa.");
  }
}

export interface PageInput {
  readonly page: number;
  readonly pageSize: number;
}

function normalizePage(input: PageInput): PageInput {
  const { page, pageSize } = input;
  if (!Number.isInteger(page) || page < 1) {
    throw new ValidationError(
      "La página debe ser un entero mayor o igual a 1."
    );
  }
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > PAGE_SIZE_MAX) {
    throw new ValidationError(
      `El tamaño de página debe estar entre 1 y ${PAGE_SIZE_MAX}.`
    );
  }
  return { page, pageSize };
}

function normalizeSearch(search: string | null): string | null {
  if (search === null) {
    return null;
  }
  const value = search.trim();
  if (value.length === 0) {
    return null;
  }
  return value;
}

export class GetAdminDashboard {
  constructor(private readonly store: AdminStore) {}

  async execute(actor: AuthenticatedUser) {
    assertAdmin(actor);
    return this.store.dashboard();
  }
}

export class GetAdminReports {
  constructor(private readonly store: AdminStore) {}

  async execute(actor: AuthenticatedUser) {
    assertAdmin(actor);
    return this.store.reports();
  }
}

export interface AdminUsersInput extends PageInput {
  readonly rol: RolSistema | null;
  readonly estado: EstadoUsuario | null;
  readonly search: string | null;
}

export class ListAdminUsers {
  constructor(private readonly store: AdminStore) {}

  async execute(actor: AuthenticatedUser, input: AdminUsersInput) {
    assertAdmin(actor);
    const page = normalizePage(input);
    return this.store.listUsers({
      rol: input.rol,
      estado: input.estado,
      search: normalizeSearch(input.search),
      page: page.page,
      pageSize: page.pageSize
    });
  }
}

export class GetAdminUser {
  constructor(private readonly store: AdminStore) {}

  async execute(actor: AuthenticatedUser, userId: string) {
    assertAdmin(actor);
    const user = await this.store.findUser(userId);
    if (user === null) {
      throw new ResourceNotFoundError("El usuario no existe.");
    }
    return user;
  }
}

export interface AdminBuyersInput extends PageInput {
  readonly estadoComercial: "HABILITADO" | "RESTRINGIDO" | null;
  readonly search: string | null;
}

export class ListAdminBuyers {
  constructor(private readonly store: AdminStore) {}

  async execute(actor: AuthenticatedUser, input: AdminBuyersInput) {
    assertAdmin(actor);
    const page = normalizePage(input);
    return this.store.listBuyers({
      estadoComercial: input.estadoComercial,
      search: normalizeSearch(input.search),
      page: page.page,
      pageSize: page.pageSize
    });
  }
}

export class GetAdminBuyer {
  constructor(private readonly store: AdminStore) {}

  async execute(actor: AuthenticatedUser, buyerId: string) {
    assertAdmin(actor);
    const buyer = await this.store.findBuyer(buyerId);
    if (buyer === null) {
      throw new ResourceNotFoundError("El comprador no existe.");
    }
    return buyer;
  }
}

export interface AdminSellersInput extends PageInput {
  readonly estado: EstadoVendedor | null;
  readonly search: string | null;
}

export class ListAdminSellers {
  constructor(private readonly store: AdminStore) {}

  async execute(actor: AuthenticatedUser, input: AdminSellersInput) {
    assertAdmin(actor);
    const page = normalizePage(input);
    return this.store.listSellers({
      estado: input.estado,
      search: normalizeSearch(input.search),
      page: page.page,
      pageSize: page.pageSize
    });
  }
}

export class GetAdminSeller {
  constructor(private readonly store: AdminStore) {}

  async execute(actor: AuthenticatedUser, sellerId: string) {
    assertAdmin(actor);
    const seller = await this.store.findSeller(sellerId);
    if (seller === null) {
      throw new ResourceNotFoundError("El vendedor no existe.");
    }
    return seller;
  }
}

export interface AdminWarehousesInput extends PageInput {
  readonly estado: "ACTIVA" | "INACTIVA" | null;
  readonly vendedorId: string | null;
  readonly search: string | null;
}

export class ListAdminWarehouses {
  constructor(private readonly store: AdminStore) {}

  async execute(actor: AuthenticatedUser, input: AdminWarehousesInput) {
    assertAdmin(actor);
    const page = normalizePage(input);
    return this.store.listWarehouses({
      estado: input.estado,
      vendedorId: input.vendedorId,
      search: normalizeSearch(input.search),
      page: page.page,
      pageSize: page.pageSize
    });
  }
}

export class GetAdminWarehouse {
  constructor(private readonly store: AdminStore) {}

  async execute(actor: AuthenticatedUser, warehouseId: string) {
    assertAdmin(actor);
    const warehouse = await this.store.findWarehouse(warehouseId);
    if (warehouse === null) {
      throw new ResourceNotFoundError("La bodega no existe.");
    }
    return warehouse;
  }
}

export interface AdminProductsInput extends PageInput {
  readonly estado: EstadoProductoVendedor | null;
  readonly categoria: CategoriaProducto | null;
  readonly tipoEntrega: TipoEntregaVendedor | null;
  readonly vendedorId: string | null;
  readonly search: string | null;
}

export class ListAdminProducts {
  constructor(private readonly store: AdminStore) {}

  async execute(actor: AuthenticatedUser, input: AdminProductsInput) {
    assertAdmin(actor);
    const page = normalizePage(input);
    return this.store.listProducts({
      estado: input.estado,
      categoria: input.categoria,
      tipoEntrega: input.tipoEntrega,
      vendedorId: input.vendedorId,
      search: normalizeSearch(input.search),
      page: page.page,
      pageSize: page.pageSize
    });
  }
}

export class GetAdminProduct {
  constructor(private readonly store: AdminStore) {}

  async execute(actor: AuthenticatedUser, productId: string) {
    assertAdmin(actor);
    const product = await this.store.findProduct(productId);
    if (product === null) {
      throw new ResourceNotFoundError("El producto no existe.");
    }
    return product;
  }
}

export interface AdminInventoryInput extends PageInput {
  readonly bodegaId: string | null;
  readonly productoId: string | null;
  readonly vendedorId: string | null;
  readonly search: string | null;
}

export class ListAdminInventory {
  constructor(private readonly store: AdminStore) {}

  async execute(actor: AuthenticatedUser, input: AdminInventoryInput) {
    assertAdmin(actor);
    const page = normalizePage(input);
    return this.store.listInventory({
      bodegaId: input.bodegaId,
      productoId: input.productoId,
      vendedorId: input.vendedorId,
      search: normalizeSearch(input.search),
      page: page.page,
      pageSize: page.pageSize
    });
  }
}

export interface AdminMovementsInput extends PageInput {
  readonly bodegaId: string | null;
  readonly productoId: string | null;
}

export class ListAdminMovements {
  constructor(private readonly store: AdminStore) {}

  async execute(actor: AuthenticatedUser, input: AdminMovementsInput) {
    assertAdmin(actor);
    const page = normalizePage(input);
    return this.store.listMovements({
      bodegaId: input.bodegaId,
      productoId: input.productoId,
      page: page.page,
      pageSize: page.pageSize
    });
  }
}

export interface AdminOrdersInput extends PageInput {
  readonly estado: EstadoPedido | null;
  readonly search: string | null;
}

export class ListAdminOrders {
  constructor(private readonly store: AdminStore) {}

  async execute(actor: AuthenticatedUser, input: AdminOrdersInput) {
    assertAdmin(actor);
    const page = normalizePage(input);
    return this.store.listOrders({
      estado: input.estado,
      search: normalizeSearch(input.search),
      page: page.page,
      pageSize: page.pageSize
    });
  }
}

export class GetAdminOrder {
  constructor(private readonly store: AdminStore) {}

  async execute(actor: AuthenticatedUser, orderId: string) {
    assertAdmin(actor);
    const order = await this.store.findOrder(orderId);
    if (order === null) {
      throw new ResourceNotFoundError("El pedido no existe.");
    }
    return order;
  }
}

export interface AdminPaymentsInput extends PageInput {
  readonly estado: EstadoPago | null;
  readonly search: string | null;
}

export class ListAdminPayments {
  constructor(private readonly store: AdminStore) {}

  async execute(actor: AuthenticatedUser, input: AdminPaymentsInput) {
    assertAdmin(actor);
    const page = normalizePage(input);
    return this.store.listPayments({
      estado: input.estado,
      search: normalizeSearch(input.search),
      page: page.page,
      pageSize: page.pageSize
    });
  }
}
