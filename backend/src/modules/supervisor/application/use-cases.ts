import {
  AuthorizationError,
  ResourceNotFoundError,
  ValidationError
} from "../../../shared/domain/errors.js";
import type { CategoriaProducto } from "../../catalog/domain/producto.js";
import type { EstadoEnvio } from "../../logistics/domain/envio.js";
import type { EstadoPedido } from "../../orders/application/ports.js";
import type { AuthenticatedUser } from "../../identity/application/ports.js";
import type { EstadoProductoVendedor } from "../../seller-workspace/domain/producto-vendedor.js";
import type { EstadoVendedor } from "../../seller-workspace/application/ports.js";
import {
  PAGE_SIZE_MAX,
  type SupervisorOrderDetail,
  type SupervisorProductDetail,
  type SupervisorStore
} from "./ports.js";

/**
 * `SUP-01`: el Supervisor solo consulta. La comprobación se repite en la capa
 * de aplicación además de la guarda HTTP para que una futura interfaz de
 * entrada no pueda omitirla.
 */
function assertSupervisor(actor: AuthenticatedUser): void {
  if (actor.rol !== "SUPERVISOR") {
    throw new AuthorizationError(
      "Solo un supervisor puede consultar el espacio de supervisión."
    );
  }
  if (actor.estado !== "ACTIVO") {
    throw new AuthorizationError("La cuenta del supervisor no está activa.");
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

export interface SupervisorOrdersInput extends PageInput {
  readonly estado: EstadoPedido | null;
}

export class ListSupervisorOrders {
  constructor(private readonly store: SupervisorStore) {}

  async execute(actor: AuthenticatedUser, input: SupervisorOrdersInput) {
    assertSupervisor(actor);
    const page = normalizePage(input);
    return this.store.listOrders({
      estado: input.estado,
      page: page.page,
      pageSize: page.pageSize
    });
  }
}

export class GetSupervisorOrder {
  constructor(private readonly store: SupervisorStore) {}

  async execute(
    actor: AuthenticatedUser,
    orderId: string
  ): Promise<SupervisorOrderDetail> {
    assertSupervisor(actor);
    const order = await this.store.findOrder(orderId);
    if (order === null) {
      throw new ResourceNotFoundError("El pedido no existe.");
    }
    return order;
  }
}

export interface SupervisorProductsInput extends PageInput {
  readonly estado: EstadoProductoVendedor | null;
  readonly categoria: CategoriaProducto | null;
  readonly vendedorId: string | null;
}

export class ListSupervisorProducts {
  constructor(private readonly store: SupervisorStore) {}

  async execute(actor: AuthenticatedUser, input: SupervisorProductsInput) {
    assertSupervisor(actor);
    const page = normalizePage(input);
    return this.store.listProducts({
      estado: input.estado,
      categoria: input.categoria,
      vendedorId: input.vendedorId,
      page: page.page,
      pageSize: page.pageSize
    });
  }
}

export class GetSupervisorProduct {
  constructor(private readonly store: SupervisorStore) {}

  async execute(
    actor: AuthenticatedUser,
    productId: string
  ): Promise<SupervisorProductDetail> {
    assertSupervisor(actor);
    const product = await this.store.findProduct(productId);
    if (product === null) {
      throw new ResourceNotFoundError("El producto no existe.");
    }
    return product;
  }
}

export class ListSupervisorWarehouses {
  constructor(private readonly store: SupervisorStore) {}

  async execute(actor: AuthenticatedUser) {
    assertSupervisor(actor);
    return this.store.listWarehouses();
  }
}

export interface SupervisorInventoryInput extends PageInput {
  readonly bodegaId: string | null;
  readonly productoId: string | null;
}

export class ListSupervisorInventory {
  constructor(private readonly store: SupervisorStore) {}

  async execute(actor: AuthenticatedUser, input: SupervisorInventoryInput) {
    assertSupervisor(actor);
    const page = normalizePage(input);
    return this.store.listInventory({
      bodegaId: input.bodegaId,
      productoId: input.productoId,
      page: page.page,
      pageSize: page.pageSize
    });
  }
}

export interface SupervisorShipmentsInput extends PageInput {
  readonly estado: EstadoEnvio | null;
  readonly pedidoId: string | null;
}

export class ListSupervisorShipments {
  constructor(private readonly store: SupervisorStore) {}

  async execute(actor: AuthenticatedUser, input: SupervisorShipmentsInput) {
    assertSupervisor(actor);
    const page = normalizePage(input);
    return this.store.listShipments({
      estado: input.estado,
      pedidoId: input.pedidoId,
      page: page.page,
      pageSize: page.pageSize
    });
  }
}

export interface SupervisorSellersInput extends PageInput {
  readonly estado: EstadoVendedor | null;
}

export class ListSupervisorSellers {
  constructor(private readonly store: SupervisorStore) {}

  async execute(actor: AuthenticatedUser, input: SupervisorSellersInput) {
    assertSupervisor(actor);
    const page = normalizePage(input);
    return this.store.listSellers({
      estado: input.estado,
      page: page.page,
      pageSize: page.pageSize
    });
  }
}

export class GetSupervisorDashboard {
  constructor(private readonly store: SupervisorStore) {}

  async execute(actor: AuthenticatedUser) {
    assertSupervisor(actor);
    return this.store.dashboard();
  }
}
