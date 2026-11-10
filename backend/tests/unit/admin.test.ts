import { describe, expect, it } from "vitest";
import {
  AuthorizationError,
  ResourceNotFoundError,
  ValidationError
} from "../../src/shared/domain/errors.js";
import type { AuthenticatedUser } from "../../src/modules/identity/application/ports.js";
import {
  GetAdminBuyer,
  GetAdminDashboard,
  GetAdminOrder,
  GetAdminProduct,
  GetAdminReports,
  GetAdminSeller,
  GetAdminUser,
  GetAdminWarehouse,
  ListAdminBuyers,
  ListAdminInventory,
  ListAdminMovements,
  ListAdminOrders,
  ListAdminPayments,
  ListAdminProducts,
  ListAdminSellers,
  ListAdminUsers,
  ListAdminWarehouses
} from "../../src/modules/admin/application/use-cases.js";
import { FakeAdminStore } from "../support/fake-admin-store.js";

const ADMIN: AuthenticatedUser = {
  usuarioId: "90000000-0000-4000-8000-0000000000ad",
  nombreCompleto: "Administradora",
  correoElectronico: "admin@nexusmarket.demo",
  rol: "ADMINISTRADOR",
  estado: "ACTIVO",
  compradorId: null,
  sellerId: null
};

const SUPERVISOR: AuthenticatedUser = {
  ...ADMIN,
  rol: "SUPERVISOR"
};

const INACTIVE_ADMIN: AuthenticatedUser = {
  ...ADMIN,
  estado: "INACTIVO"
};

function store(): FakeAdminStore {
  return new FakeAdminStore();
}

describe("Casos de uso del Administrador", () => {
  it("rechaza roles distintos de ADMINISTRADOR y administradores inactivos", async () => {
    const dashboard = new GetAdminDashboard(store());
    await expect(dashboard.execute(SUPERVISOR)).rejects.toBeInstanceOf(
      AuthorizationError
    );
    await expect(dashboard.execute(INACTIVE_ADMIN)).rejects.toBeInstanceOf(
      AuthorizationError
    );
    await expect(dashboard.execute(ADMIN)).resolves.toBeDefined();
  });

  it("valida la paginación antes de consultar", async () => {
    const users = new ListAdminUsers(store());
    await expect(
      users.execute(ADMIN, {
        rol: null,
        estado: null,
        search: null,
        page: 0,
        pageSize: 20
      })
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      users.execute(ADMIN, {
        rol: null,
        estado: null,
        search: null,
        page: 1,
        pageSize: 101
      })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("propaga los filtros permitidos sin inventar valores", async () => {
    const fake = store();
    const products = new ListAdminProducts(fake);
    const result = await products.execute(ADMIN, {
      estado: "PUBLICADO",
      categoria: "ELECTRONICA",
      tipoEntrega: "FISICA",
      vendedorId: null,
      search: "  aurora  ",
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
    const id = "00000000-0000-4000-8000-000000000000";
    await expect(
      new GetAdminUser(store()).execute(ADMIN, id)
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
    await expect(
      new GetAdminBuyer(store()).execute(ADMIN, id)
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
    await expect(
      new GetAdminSeller(store()).execute(ADMIN, id)
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
    await expect(
      new GetAdminWarehouse(store()).execute(ADMIN, id)
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
    await expect(
      new GetAdminProduct(store()).execute(ADMIN, id)
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
    await expect(
      new GetAdminOrder(store()).execute(ADMIN, id)
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it("expone todas las consultas administrativas", async () => {
    const fake = store();
    await expect(
      new ListAdminUsers(fake).execute(ADMIN, {
        rol: null,
        estado: null,
        search: null,
        page: 1,
        pageSize: 20
      })
    ).resolves.toMatchObject({ total: 0 });
    await expect(
      new ListAdminBuyers(fake).execute(ADMIN, {
        estadoComercial: null,
        search: null,
        page: 1,
        pageSize: 20
      })
    ).resolves.toMatchObject({ total: 0 });
    await expect(
      new ListAdminSellers(fake).execute(ADMIN, {
        estado: null,
        search: null,
        page: 1,
        pageSize: 20
      })
    ).resolves.toMatchObject({ total: 0 });
    await expect(
      new ListAdminWarehouses(fake).execute(ADMIN, {
        estado: null,
        vendedorId: null,
        search: null,
        page: 1,
        pageSize: 20
      })
    ).resolves.toMatchObject({ total: 0 });
    await expect(
      new ListAdminProducts(fake).execute(ADMIN, {
        estado: null,
        categoria: null,
        tipoEntrega: null,
        vendedorId: null,
        search: null,
        page: 1,
        pageSize: 20
      })
    ).resolves.toMatchObject({ total: 0 });
    await expect(
      new ListAdminInventory(fake).execute(ADMIN, {
        bodegaId: null,
        productoId: null,
        vendedorId: null,
        search: null,
        page: 1,
        pageSize: 20
      })
    ).resolves.toMatchObject({ total: 0 });
    await expect(
      new ListAdminMovements(fake).execute(ADMIN, {
        bodegaId: null,
        productoId: null,
        page: 1,
        pageSize: 20
      })
    ).resolves.toMatchObject({ total: 0 });
    await expect(
      new ListAdminOrders(fake).execute(ADMIN, {
        estado: null,
        search: null,
        page: 1,
        pageSize: 20
      })
    ).resolves.toMatchObject({ total: 0 });
    await expect(
      new ListAdminPayments(fake).execute(ADMIN, {
        estado: null,
        search: null,
        page: 1,
        pageSize: 20
      })
    ).resolves.toMatchObject({ total: 0 });
    await expect(
      new GetAdminReports(fake).execute(ADMIN)
    ).resolves.toMatchObject({
      usuarios: { total: 0 },
      inventario: { disponible: 0 }
    });
  });
});
