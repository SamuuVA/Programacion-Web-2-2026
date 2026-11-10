import { randomUUID } from "node:crypto";
import Fastify, { type FastifyInstance } from "fastify";
import type { AppConfig } from "./config.js";
import { ApplicationError, type ErrorCode } from "./shared/domain/errors.js";
import { isValidCorrelationId } from "./shared/domain/value-objects.js";
import type {
  Clock,
  IdGenerator,
  PasswordHasher,
  SessionTokenGenerator
} from "./shared/application/ports.js";
import type { BuyerRegistrationStore } from "./modules/buyers/application/ports.js";
import { RegisterBuyer } from "./modules/buyers/application/register-buyer.js";
import { registerBuyerRoutes } from "./modules/buyers/interfaces/http/register-buyer-route.js";
import type { AddressStore } from "./modules/buyers/application/address-ports.js";
import {
  CreateAddress,
  DeleteAddress,
  ListAddresses,
  SetPrincipalAddress,
  UpdateAddress
} from "./modules/buyers/application/address-use-cases.js";
import { registerAddressRoutes } from "./modules/buyers/interfaces/http/address-routes.js";
import type { CatalogQueryRepository } from "./modules/catalog/application/ports.js";
import { QueryCatalog } from "./modules/catalog/application/query-catalog.js";
import { registerCatalogRoutes } from "./modules/catalog/interfaces/http/catalog-routes.js";
import type { IdentityStore } from "./modules/identity/application/ports.js";
import { GetSession } from "./modules/identity/application/get-session.js";
import { LoginUser } from "./modules/identity/application/login-user.js";
import { LogoutUser } from "./modules/identity/application/logout-user.js";
import { registerAuthRoutes } from "./modules/identity/interfaces/http/auth-routes.js";
import { SessionAuthenticator } from "./modules/identity/interfaces/http/session.js";
import type { SellerRegistrationStore } from "./modules/sellers/application/ports.js";
import { RegisterSeller } from "./modules/sellers/application/register-seller.js";
import { registerSellerRoutes } from "./modules/sellers/interfaces/http/seller-routes.js";
import type { CartStore } from "./modules/cart/application/ports.js";
import {
  AddCartItem,
  GetCart,
  RemoveCartItem,
  UpdateCartItem
} from "./modules/cart/application/cart-use-cases.js";
import { registerCartRoutes } from "./modules/cart/interfaces/http/cart-routes.js";
import type { CheckoutStore } from "./modules/orders/application/ports.js";
import {
  Checkout,
  GetOrder,
  ListOrders
} from "./modules/orders/application/checkout.js";
import { registerOrderRoutes } from "./modules/orders/interfaces/http/order-routes.js";
import type { SellerWorkspaceStore } from "./modules/seller-workspace/application/ports.js";
import {
  AddSellerProductImage,
  CreateSellerProduct,
  CreateSellerWarehouse,
  DiscontinueSellerProduct,
  GetSellerOrder,
  GetSellerProduct,
  GetSellerProfile,
  ListSellerInventory,
  ListSellerOrders,
  ListSellerProducts,
  ListSellerWarehouses,
  PublishSellerProduct,
  RegisterInventoryIngress,
  RemoveSellerProductImage,
  SuspendSellerProduct,
  UpdateSellerProduct,
  UpdateSellerProfile,
  UpdateSellerWarehouse
} from "./modules/seller-workspace/application/use-cases.js";
import { registerSellerWorkspaceRoutes } from "./modules/seller-workspace/interfaces/http/seller-workspace-routes.js";
import type { LogisticsStore } from "./modules/logistics/application/ports.js";
import {
  ConfirmDelivery,
  DispatchOrder,
  GetLogisticsOrder,
  GetLogisticsProfile,
  GetLogisticsSummary,
  ListLogisticsInventory,
  ListLogisticsOrders,
  ListLogisticsWarehouses,
  PrepareShipment,
  RegisterLogisticsOperator
} from "./modules/logistics/application/use-cases.js";
import { registerLogisticsRoutes } from "./modules/logistics/interfaces/http/logistics-routes.js";
import type { SupervisorStore } from "./modules/supervisor/application/ports.js";
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
} from "./modules/supervisor/application/use-cases.js";
import { registerSupervisorRoutes } from "./modules/supervisor/interfaces/http/supervisor-routes.js";
import type { SellerApplicationStore } from "./modules/seller-applications/application/ports.js";
import {
  ApproveSellerApplication,
  GetAdminSellerApplication,
  GetOwnSellerApplication,
  ListAdminSellerApplications,
  RejectSellerApplication,
  SubmitSellerApplication
} from "./modules/seller-applications/application/use-cases.js";
import { registerSellerApplicationRoutes } from "./modules/seller-applications/interfaces/http/seller-application-routes.js";
import {
  UpdateUserAccessStatus,
  type UserAccessStore
} from "./modules/identity/application/update-user-access-status.js";
import type { AdminStore } from "./modules/admin/application/ports.js";
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
} from "./modules/admin/application/use-cases.js";
import { registerAdminRoutes } from "./modules/admin/interfaces/http/admin-routes.js";

export interface AppDependencies {
  readonly store: BuyerRegistrationStore;
  readonly catalog: CatalogQueryRepository;
  readonly hasher: PasswordHasher;
  readonly clock: Clock;
  readonly ids: IdGenerator;
  /** Módulos nuevos. En producción siempre están presentes; las pruebas
   * existentes de catálogo/registro pueden omitirlos. */
  readonly identity?: IdentityStore;
  readonly sessionTokens?: SessionTokenGenerator;
  readonly addresses?: AddressStore;
  readonly sellers?: SellerRegistrationStore;
  readonly cart?: CartStore;
  readonly checkout?: CheckoutStore;
  readonly sellerWorkspace?: SellerWorkspaceStore;
  readonly logistics?: LogisticsStore;
  readonly supervisor?: SupervisorStore;
  readonly admin?: AdminStore;
  readonly sellerApplications?: SellerApplicationStore;
  readonly userAccess?: UserAccessStore;
}

export async function buildApp(
  config: AppConfig,
  dependencies: AppDependencies
): Promise<FastifyInstance> {
  const app = Fastify({
    logger:
      config.NODE_ENV === "test"
        ? false
        : {
            level: config.LOG_LEVEL
          },
    bodyLimit: 64 * 1024,
    genReqId: (request) => {
      const header = request.headers["x-correlation-id"];
      if (typeof header === "string") {
        const value = header.trim();
        if (isValidCorrelationId(value)) {
          return value;
        }
      }
      return randomUUID();
    }
  });

  const routeMethods = new Map<string, readonly string[]>([
    ["/api/v1/buyers", ["POST"]],
    ["/api/v1/products", ["GET", "HEAD"]],
    ["/api/v1/categories", ["GET", "HEAD"]],
    ["/health", ["GET", "HEAD"]],
    ["/ready", ["GET", "HEAD"]]
  ]);

  app.addHook("onRequest", async (request, reply) => {
    reply.header("x-correlation-id", request.id);
  });

  registerCors(app, config.CORS_ORIGINS);

  app.addHook("onClose", async () => {
    await Promise.all(
      [
        dependencies.store.close(),
        dependencies.catalog.close(),
        dependencies.identity?.close(),
        dependencies.addresses?.close(),
        dependencies.sellers?.close(),
        dependencies.cart?.close(),
        dependencies.checkout?.close(),
        dependencies.sellerWorkspace?.close(),
        dependencies.logistics?.close(),
        dependencies.supervisor?.close(),
        dependencies.admin?.close(),
        dependencies.sellerApplications?.close(),
        dependencies.userAccess?.close()
      ].filter(
        (operation): operation is Promise<void> => operation !== undefined
      )
    );
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ApplicationError) {
      const status = statusFor(error.code);
      if (status >= 500) {
        // Un fallo de dependencia no expone su causa al cliente, pero debe
        // quedar trazado en el servidor para poder diagnosticarlo.
        request.log.error(
          { err: error, codigo: error.code },
          "Error de aplicación con estado 5xx"
        );
      }
      const body: {
        error: {
          codigo: string;
          mensaje: string;
          correlationId: string;
          detalles?: Record<string, unknown>;
        };
      } = {
        error: {
          codigo: error.code,
          mensaje: error.message,
          correlationId: request.id
        }
      };
      if (
        error.details !== undefined &&
        error.code !== "DEPENDENCIA_NO_DISPONIBLE"
      ) {
        body.error.detalles = error.details;
      }
      return reply.code(status).send(body);
    }

    const frameworkStatus = frameworkErrorStatus(error);
    if (frameworkStatus !== undefined) {
      const message =
        frameworkStatus === 413
          ? "La solicitud excede el tamaño permitido."
          : "La solicitud no es válida.";
      return reply.code(frameworkStatus).send({
        error: {
          codigo: "VALIDACION_INVALIDA",
          mensaje: message,
          correlationId: request.id
        }
      });
    }

    request.log.error({ err: error }, "Error no controlado");
    return reply.code(500).send({
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Ocurrió un error interno.",
        correlationId: request.id
      }
    });
  });

  app.get("/health", async () => ({
    status: "ok",
    service: "nexusmarket-backend",
    version: "0.1.0"
  }));

  app.get("/ready", async (_request, reply) => {
    try {
      await Promise.all(
        [
          dependencies.store.healthCheck(),
          dependencies.identity?.healthCheck(),
          dependencies.sellers?.healthCheck(),
          dependencies.sellerWorkspace?.healthCheck(),
          dependencies.logistics?.healthCheck(),
          dependencies.supervisor?.healthCheck(),
          dependencies.admin?.healthCheck(),
          dependencies.sellerApplications?.healthCheck(),
          dependencies.userAccess?.healthCheck()
        ].filter(
          (operation): operation is Promise<void> => operation !== undefined
        )
      );
      return { status: "ready" };
    } catch {
      return reply.code(503).send({ status: "not_ready" });
    }
  });

  const useCase = new RegisterBuyer(
    dependencies.store,
    dependencies.hasher,
    dependencies.clock,
    dependencies.ids
  );
  registerBuyerRoutes(app, useCase);
  registerCatalogRoutes(app, new QueryCatalog(dependencies.catalog));

  if (dependencies.identity && dependencies.sessionTokens) {
    const authenticator = new SessionAuthenticator(
      new GetSession(dependencies.identity, dependencies.clock)
    );
    registerAuthRoutes(
      app,
      config,
      authenticator,
      new LoginUser(
        dependencies.identity,
        dependencies.hasher,
        dependencies.sessionTokens,
        dependencies.clock,
        dependencies.ids
      ),
      new LogoutUser(dependencies.identity, dependencies.clock)
    );
    routeMethods.set("/api/v1/auth/login", ["POST"]);
    routeMethods.set("/api/v1/auth/logout", ["POST"]);
    routeMethods.set("/api/v1/auth/session", ["GET", "HEAD"]);

    if (dependencies.addresses) {
      registerAddressRoutes(app, {
        authenticator,
        list: new ListAddresses(dependencies.addresses),
        create: new CreateAddress(
          dependencies.addresses,
          dependencies.clock,
          dependencies.ids
        ),
        update: new UpdateAddress(dependencies.addresses, dependencies.clock),
        remove: new DeleteAddress(dependencies.addresses),
        setPrincipal: new SetPrincipalAddress(
          dependencies.addresses,
          dependencies.clock
        )
      });
      routeMethods.set("/api/v1/buyers/me/addresses", ["GET", "HEAD", "POST"]);
    }

    if (dependencies.sellers) {
      registerSellerRoutes(
        app,
        authenticator,
        new RegisterSeller(
          dependencies.sellers,
          dependencies.hasher,
          dependencies.clock,
          dependencies.ids
        )
      );
      routeMethods.set("/api/v1/admin/sellers", ["GET", "HEAD", "POST"]);
    }

    if (dependencies.sellerApplications) {
      registerSellerApplicationRoutes(app, {
        authenticator,
        submit: new SubmitSellerApplication(
          dependencies.sellerApplications,
          dependencies.clock,
          dependencies.ids
        ),
        getOwn: new GetOwnSellerApplication(dependencies.sellerApplications),
        listAdmin: new ListAdminSellerApplications(
          dependencies.sellerApplications
        ),
        getAdmin: new GetAdminSellerApplication(
          dependencies.sellerApplications
        ),
        approve: new ApproveSellerApplication(
          dependencies.sellerApplications,
          dependencies.clock,
          dependencies.ids
        ),
        reject: new RejectSellerApplication(
          dependencies.sellerApplications,
          dependencies.clock,
          dependencies.ids
        )
      });
      routeMethods.set("/api/v1/buyer/seller-application", [
        "GET",
        "HEAD",
        "POST"
      ]);
    }

    if (dependencies.cart) {
      registerCartRoutes(app, {
        authenticator,
        getCart: new GetCart(dependencies.cart),
        addItem: new AddCartItem(dependencies.cart, dependencies.clock),
        updateItem: new UpdateCartItem(dependencies.cart, dependencies.clock),
        removeItem: new RemoveCartItem(dependencies.cart, dependencies.clock)
      });
      routeMethods.set("/api/v1/cart", ["GET", "HEAD"]);
      routeMethods.set("/api/v1/cart/items", ["POST"]);
    }

    if (dependencies.checkout) {
      registerOrderRoutes(app, {
        authenticator,
        checkout: new Checkout(dependencies.checkout, dependencies.clock),
        listOrders: new ListOrders(dependencies.checkout),
        getOrder: new GetOrder(dependencies.checkout)
      });
      routeMethods.set("/api/v1/checkout", ["POST"]);
      routeMethods.set("/api/v1/orders", ["GET", "HEAD"]);
    }

    if (dependencies.sellerWorkspace) {
      registerSellerWorkspaceRoutes(app, {
        authenticator,
        getProfile: new GetSellerProfile(dependencies.sellerWorkspace),
        updateProfile: new UpdateSellerProfile(
          dependencies.sellerWorkspace,
          dependencies.clock
        ),
        listProducts: new ListSellerProducts(dependencies.sellerWorkspace),
        getProduct: new GetSellerProduct(dependencies.sellerWorkspace),
        createProduct: new CreateSellerProduct(
          dependencies.sellerWorkspace,
          dependencies.clock,
          dependencies.ids
        ),
        updateProduct: new UpdateSellerProduct(
          dependencies.sellerWorkspace,
          dependencies.clock
        ),
        addImage: new AddSellerProductImage(
          dependencies.sellerWorkspace,
          dependencies.clock,
          dependencies.ids
        ),
        removeImage: new RemoveSellerProductImage(dependencies.sellerWorkspace),
        publishProduct: new PublishSellerProduct(
          dependencies.sellerWorkspace,
          dependencies.clock
        ),
        suspendProduct: new SuspendSellerProduct(
          dependencies.sellerWorkspace,
          dependencies.clock
        ),
        discontinueProduct: new DiscontinueSellerProduct(
          dependencies.sellerWorkspace,
          dependencies.clock
        ),
        listWarehouses: new ListSellerWarehouses(dependencies.sellerWorkspace),
        createWarehouse: new CreateSellerWarehouse(
          dependencies.sellerWorkspace,
          dependencies.clock,
          dependencies.ids
        ),
        updateWarehouse: new UpdateSellerWarehouse(
          dependencies.sellerWorkspace
        ),
        listInventory: new ListSellerInventory(dependencies.sellerWorkspace),
        registerIngress: new RegisterInventoryIngress(
          dependencies.sellerWorkspace,
          dependencies.clock,
          dependencies.ids
        ),
        listOrders: new ListSellerOrders(dependencies.sellerWorkspace),
        getOrder: new GetSellerOrder(dependencies.sellerWorkspace)
      });
      routeMethods.set("/api/v1/seller/profile", ["GET", "HEAD", "PATCH"]);
      routeMethods.set("/api/v1/seller/products", ["GET", "HEAD", "POST"]);
      routeMethods.set("/api/v1/seller/warehouses", ["GET", "HEAD", "POST"]);
      routeMethods.set("/api/v1/seller/inventory", ["GET", "HEAD"]);
      routeMethods.set("/api/v1/seller/inventory/ingresos", ["POST"]);
      routeMethods.set("/api/v1/seller/orders", ["GET", "HEAD"]);
    }

    if (dependencies.logistics) {
      registerLogisticsRoutes(app, {
        authenticator,
        getProfile: new GetLogisticsProfile(dependencies.logistics),
        listWarehouses: new ListLogisticsWarehouses(dependencies.logistics),
        listInventory: new ListLogisticsInventory(dependencies.logistics),
        getSummary: new GetLogisticsSummary(dependencies.logistics),
        listOrders: new ListLogisticsOrders(dependencies.logistics),
        getOrder: new GetLogisticsOrder(dependencies.logistics),
        prepare: new PrepareShipment(
          dependencies.logistics,
          dependencies.clock
        ),
        dispatch: new DispatchOrder(dependencies.logistics, dependencies.clock),
        deliver: new ConfirmDelivery(
          dependencies.logistics,
          dependencies.clock
        ),
        registerOperator: new RegisterLogisticsOperator(
          dependencies.logistics,
          dependencies.hasher,
          dependencies.clock,
          dependencies.ids
        )
      });
      routeMethods.set("/api/v1/logistics/profile", ["GET", "HEAD"]);
      routeMethods.set("/api/v1/logistics/warehouses", ["GET", "HEAD"]);
      routeMethods.set("/api/v1/logistics/inventory", ["GET", "HEAD"]);
      routeMethods.set("/api/v1/logistics/summary", ["GET", "HEAD"]);
      routeMethods.set("/api/v1/logistics/orders", ["GET", "HEAD"]);
      routeMethods.set("/api/v1/admin/logistics-operators", ["POST"]);
    }

    if (dependencies.supervisor) {
      registerSupervisorRoutes(app, {
        authenticator,
        getDashboard: new GetSupervisorDashboard(dependencies.supervisor),
        listOrders: new ListSupervisorOrders(dependencies.supervisor),
        getOrder: new GetSupervisorOrder(dependencies.supervisor),
        listProducts: new ListSupervisorProducts(dependencies.supervisor),
        getProduct: new GetSupervisorProduct(dependencies.supervisor),
        listWarehouses: new ListSupervisorWarehouses(dependencies.supervisor),
        listInventory: new ListSupervisorInventory(dependencies.supervisor),
        listShipments: new ListSupervisorShipments(dependencies.supervisor),
        listSellers: new ListSupervisorSellers(dependencies.supervisor)
      });
      routeMethods.set("/api/v1/supervisor/dashboard", ["GET", "HEAD"]);
      routeMethods.set("/api/v1/supervisor/orders", ["GET", "HEAD"]);
      routeMethods.set("/api/v1/supervisor/products", ["GET", "HEAD"]);
      routeMethods.set("/api/v1/supervisor/warehouses", ["GET", "HEAD"]);
      routeMethods.set("/api/v1/supervisor/inventory", ["GET", "HEAD"]);
      routeMethods.set("/api/v1/supervisor/shipments", ["GET", "HEAD"]);
      routeMethods.set("/api/v1/supervisor/sellers", ["GET", "HEAD"]);
    }

    if (dependencies.admin) {
      registerAdminRoutes(app, {
        authenticator,
        getDashboard: new GetAdminDashboard(dependencies.admin),
        getReports: new GetAdminReports(dependencies.admin),
        listUsers: new ListAdminUsers(dependencies.admin),
        getUser: new GetAdminUser(dependencies.admin),
        listBuyers: new ListAdminBuyers(dependencies.admin),
        getBuyer: new GetAdminBuyer(dependencies.admin),
        listSellers: new ListAdminSellers(dependencies.admin),
        getSeller: new GetAdminSeller(dependencies.admin),
        listWarehouses: new ListAdminWarehouses(dependencies.admin),
        getWarehouse: new GetAdminWarehouse(dependencies.admin),
        listProducts: new ListAdminProducts(dependencies.admin),
        getProduct: new GetAdminProduct(dependencies.admin),
        listInventory: new ListAdminInventory(dependencies.admin),
        listMovements: new ListAdminMovements(dependencies.admin),
        listOrders: new ListAdminOrders(dependencies.admin),
        getOrder: new GetAdminOrder(dependencies.admin),
        listPayments: new ListAdminPayments(dependencies.admin),
        ...(dependencies.userAccess
          ? {
              updateUserAccessStatus: new UpdateUserAccessStatus(
                dependencies.userAccess,
                dependencies.clock,
                dependencies.ids
              )
            }
          : {})
      });
      routeMethods.set("/api/v1/admin/dashboard", ["GET", "HEAD"]);
      routeMethods.set("/api/v1/admin/reports", ["GET", "HEAD"]);
      routeMethods.set("/api/v1/admin/users", ["GET", "HEAD"]);
      routeMethods.set("/api/v1/admin/buyers", ["GET", "HEAD"]);
      routeMethods.set("/api/v1/admin/warehouses", ["GET", "HEAD"]);
      routeMethods.set("/api/v1/admin/products", ["GET", "HEAD"]);
      routeMethods.set("/api/v1/admin/inventory", ["GET", "HEAD"]);
      routeMethods.set("/api/v1/admin/inventory/movements", ["GET", "HEAD"]);
      routeMethods.set("/api/v1/admin/orders", ["GET", "HEAD"]);
      routeMethods.set("/api/v1/admin/payments", ["GET", "HEAD"]);
    }
  }

  app.setNotFoundHandler((request, reply) => {
    const path = request.url.split("?")[0] ?? "/";
    const declaredMethods = routeMethods.get(path);
    if (
      declaredMethods !== undefined &&
      !declaredMethods.includes(request.method)
    ) {
      const allowed = [...declaredMethods];
      if (config.CORS_ORIGINS.length > 0) {
        allowed.push("OPTIONS");
      }
      reply.header("allow", allowed.join(", "));
      return reply.code(405).send({
        error: {
          codigo: "METODO_NO_PERMITIDO",
          mensaje: "El método HTTP no está permitido para esta ruta.",
          correlationId: request.id
        }
      });
    }

    return reply.code(404).send({
      error: {
        codigo: "RUTA_NO_ENCONTRADA",
        mensaje: "La ruta solicitada no existe.",
        correlationId: request.id
      }
    });
  });

  return app;
}

function registerCors(app: FastifyInstance, origins: readonly string[]): void {
  if (origins.length === 0) {
    return;
  }

  app.addHook("onRequest", async (request, reply) => {
    const origin = request.headers.origin;
    if (typeof origin !== "string" || !origins.includes(origin)) {
      return;
    }

    reply.header("access-control-allow-origin", origin);
    reply.header("vary", "Origin");
    reply.header("access-control-allow-credentials", "true");
    reply.header("access-control-expose-headers", "x-correlation-id");

    if (request.method === "OPTIONS") {
      reply.header(
        "access-control-allow-methods",
        "GET, POST, PATCH, DELETE, OPTIONS"
      );
      reply.header(
        "access-control-allow-headers",
        "content-type, x-correlation-id, authorization"
      );
      reply.header("access-control-max-age", "600");
      return reply.code(204).send();
    }
  });
}

function statusFor(code: ErrorCode): number {
  switch (code) {
    case "VALIDACION_INVALIDA":
      return 400;
    case "NO_AUTENTICADO":
      return 401;
    case "CONFLICTO_UNICIDAD":
      return 409;
    case "REGLA_NEGOCIO_INCUMPLIDA":
      return 422;
    case "NO_AUTORIZADO":
      return 403;
    case "DEPENDENCIA_NO_DISPONIBLE":
      return 503;
    case "RUTA_NO_ENCONTRADA":
    case "RECURSO_NO_ENCONTRADO":
      return 404;
    case "METODO_NO_PERMITIDO":
      return 405;
  }
}

function frameworkErrorStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("statusCode" in error)) {
    return undefined;
  }
  const statusCode = (error as { statusCode?: unknown }).statusCode;
  if (statusCode === 400 || statusCode === 413 || statusCode === 415) {
    return statusCode;
  }
  return undefined;
}
