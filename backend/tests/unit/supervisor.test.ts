import { describe, expect, it } from "vitest";
import {
  AuthorizationError,
  ResourceNotFoundError,
  ValidationError
} from "../../src/shared/domain/errors.js";
import type { AuthenticatedUser } from "../../src/modules/identity/application/ports.js";
import {
  GetSupervisorDashboard,
  GetSupervisorOrder,
  GetSupervisorProduct,
  ListSupervisorInventory,
  ListSupervisorOrders,
  ListSupervisorProducts,
  ListSupervisorSellers,
  ListSupervisorShipments,
  ListSupervisorWarehouses
} from "../../src/modules/supervisor/application/use-cases.js";
import { FakeSupervisorStore } from "../support/fake-supervisor-store.js";

const SUPERVISOR: AuthenticatedUser = {
  usuarioId: "90000000-0000-4000-8000-000000000001",
  nombreCompleto: "Supervisora",
  correoElectronico: "supervisor@nexusmarket.demo",
  rol: "SUPERVISOR",
  estado: "ACTIVO",
  compradorId: null,
  sellerId: null
};

const ADMIN: AuthenticatedUser = {
  ...SUPERVISOR,
  usuarioId: "90000000-0000-4000-8000-0000000000ad",
  rol: "ADMINISTRADOR"
};

const INACTIVE_SUPERVISOR: AuthenticatedUser = {
  ...SUPERVISOR,
  estado: "INACTIVO"
};

function store(): FakeSupervisorStore {
  return new FakeSupervisorStore();
}

describe("Casos de uso de supervisión", () => {
  it("rechaza roles distintos de SUPERVISOR y supervisores inactivos", async () => {
    const dashboard = new GetSupervisorDashboard(store());
    await expect(dashboard.execute(ADMIN)).rejects.toBeInstanceOf(
      AuthorizationError
    );
    await expect(dashboard.execute(INACTIVE_SUPERVISOR)).rejects.toBeInstanceOf(
      AuthorizationError
    );
    await expect(dashboard.execute(SUPERVISOR)).resolves.toBeDefined();
  });

  it("valida la paginación antes de consultar", async () => {
    const orders = new ListSupervisorOrders(store());
    await expect(
      orders.execute(SUPERVISOR, { estado: null, page: 0, pageSize: 20 })
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      orders.execute(SUPERVISOR, { estado: null, page: 1, pageSize: 101 })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("propaga los filtros permitidos sin inventar valores", async () => {
    const fake = store();
    const products = new ListSupervisorProducts(fake);
    const result = await products.execute(SUPERVISOR, {
      estado: "PUBLICADO",
      categoria: "ELECTRONICA",
      vendedorId: null,
      page: 2,
      pageSize: 5
    });
    expect(result).toEqual({
      items: [],
      total: 0,
      page: 2,
      pageSize: 5
    });
  });

  it("convierte un recurso inexistente en 404 de aplicación", async () => {
    const order = new GetSupervisorOrder(store());
    await expect(
      order.execute(SUPERVISOR, "00000000-0000-4000-8000-000000000000")
    ).rejects.toBeInstanceOf(ResourceNotFoundError);

    const product = new GetSupervisorProduct(store());
    await expect(
      product.execute(SUPERVISOR, "00000000-0000-4000-8000-000000000000")
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it("expone consultas de inventario, envíos, vendedores y almacenes", async () => {
    const fake = store();
    await expect(
      new ListSupervisorInventory(fake).execute(SUPERVISOR, {
        bodegaId: null,
        productoId: null,
        page: 1,
        pageSize: 20
      })
    ).resolves.toMatchObject({ total: 0 });
    await expect(
      new ListSupervisorShipments(fake).execute(SUPERVISOR, {
        estado: null,
        pedidoId: null,
        page: 1,
        pageSize: 20
      })
    ).resolves.toMatchObject({ total: 0 });
    await expect(
      new ListSupervisorSellers(fake).execute(SUPERVISOR, {
        estado: null,
        page: 1,
        pageSize: 20
      })
    ).resolves.toMatchObject({ total: 0 });
    await expect(
      new ListSupervisorWarehouses(fake).execute(SUPERVISOR)
    ).resolves.toEqual([]);
  });
});
