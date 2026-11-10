import { expect, test, type Browser, type Page } from "@playwright/test";

const PASSWORD = process.env.NEXUS_DEMO_PASSWORD ?? "NexusMarketDemo2026!";
const API_URL = process.env.API_URL ?? "http://127.0.0.1:3000";

const ADMIN_EMAIL = "admin@nexusmarket.demo";
const BUYER_EMAIL = "comprador@nexusmarket.demo";
const SELLER_EMAIL = "aurora@nexusmarket.demo";
const LOGISTICS_EMAIL = "logistica@nexusmarket.demo";
const SUPERVISOR_EMAIL = "supervisor@nexusmarket.demo";

const ADMIN_USER_ID = "70000000-0000-4000-8000-000000000001";
const BUYER_ID = "71000000-0000-4000-8000-000000000002";
const BUYER_ADDRESS_ID = "73000000-0000-4000-8000-000000000002";
const SELLER_ID = "20000000-0000-4000-8000-000000000001";
const WAREHOUSE_ID = "30000000-0000-4000-8000-000000000001";
const PRODUCT_ID = "40000000-0000-4000-8000-000000000001";
const PRODUCT_NAME = "Audífonos Aurora";
const SELLER_NAME = "Estudio Aurora";
const BUYER_NAME = "Compradora Demo";
const ADMIN_NAME = "Administrador Nexus";

test.describe.configure({ mode: "serial" });

async function login(page: Page, email: string, redirectTo?: string): Promise<void> {
  await page.goto(redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill(PASSWORD);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).not.toHaveURL(/\/login(\?|$)/);
}

/**
 * Crea un pedido real con el comprador demo para que el listado y el detalle
 * administrativos tengan datos en una base recién sembrada. El seed de
 * demostración no incluye pedidos, así que no se inventan datos: se usa el
 * mismo checkout que usa la aplicación.
 */
async function createOrderForAdminRead(browser: Browser): Promise<void> {
  const context = await browser.newContext();
  const request = context.request;

  const loginResponse = await request.post(`${API_URL}/api/v1/auth/login`, {
    data: { correoElectronico: BUYER_EMAIL, credencial: PASSWORD }
  });
  expect(loginResponse.status()).toBe(200);

  // Vaciar el carrito persistente para que el pedido sea determinista.
  const cartResponse = await request.get(`${API_URL}/api/v1/cart`);
  expect(cartResponse.status()).toBe(200);
  const cart = (await cartResponse.json()) as {
    data: { items: ReadonlyArray<{ productoId: string }> };
  };
  for (const item of cart.data.items) {
    const removed = await request.delete(
      `${API_URL}/api/v1/cart/items/${encodeURIComponent(item.productoId)}`
    );
    expect(removed.status()).toBe(200);
  }

  const addResponse = await request.post(`${API_URL}/api/v1/cart/items`, {
    data: { productoId: PRODUCT_ID, cantidad: 1 }
  });
  expect(addResponse.status()).toBe(200);

  const checkoutResponse = await request.post(`${API_URL}/api/v1/checkout`, {
    data: {
      idempotencyKey: `e2e-admin-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      direccionEntregaId: BUYER_ADDRESS_ID,
      resultadoPagoSimulado: "CONFIRMADO"
    }
  });
  expect(checkoutResponse.status()).toBe(201);

  await context.close();
}

test("el administrador consulta el sistema y conserva el alta de vendedores", async ({
  browser
}) => {
  test.setTimeout(240_000);

  // 0. Pedido real para que el listado administrativo tenga datos también en
  // una base recién sembrada.
  await createOrderForAdminRead(browser);

  // 1. Sin sesión, el espacio administrativo redirige al login.
  const anonymousContext = await browser.newContext();
  const anonymous = await anonymousContext.newPage();
  await anonymous.goto("/admin");
  await expect(anonymous).toHaveURL(/\/login\?redirect=/);
  await anonymousContext.close();

  // 2. Aislamiento de rol: ningún otro perfil entra al espacio administrativo.
  for (const email of [
    BUYER_EMAIL,
    SELLER_EMAIL,
    LOGISTICS_EMAIL,
    SUPERVISOR_EMAIL
  ]) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, email);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole("heading", { name: "Resumen general" })
    ).toHaveCount(0);
    await context.close();
  }

  // 3. El administrador accede al dashboard con datos reales.
  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  admin.on("dialog", (dialog) => void dialog.accept());
  await login(admin, ADMIN_EMAIL, "/admin");
  await expect(admin).toHaveURL(/\/admin$/);
  await expect(
    admin.getByRole("heading", { name: "Resumen general" })
  ).toBeVisible();
  await expect(
    admin.getByRole("heading", { name: "Usuarios por rol" })
  ).toBeVisible();
  await expect(
    admin.getByRole("heading", { name: "Pedidos por estado" })
  ).toBeVisible();
  await expect(
    admin.locator(".site-header").getByRole("link", { name: "Administración" })
  ).toBeVisible();

  // 4. Usuarios: listado y detalle de una cuenta real.
  await admin.goto("/admin/users");
  await expect(
    admin.getByRole("heading", { name: "Usuarios", exact: true })
  ).toBeVisible();
  await admin.goto(`/admin/users?search=${encodeURIComponent(ADMIN_EMAIL)}`);
  await expect(
    admin.getByRole("row", { name: new RegExp(ADMIN_EMAIL) })
  ).toBeVisible();
  await admin.goto(`/admin/users/${ADMIN_USER_ID}`);
  await expect(
    admin.getByRole("heading", { name: ADMIN_NAME })
  ).toBeVisible();
  await expect(
    admin.getByRole("heading", { name: "Datos de la cuenta" })
  ).toBeVisible();

  // 5. Vendedores: listado, detalle y acceso al alta administrativa.
  await admin.goto("/admin/sellers");
  await expect(
    admin.getByRole("heading", { name: "Vendedores", exact: true })
  ).toBeVisible();
  await admin.goto(`/admin/sellers?search=${encodeURIComponent(SELLER_NAME)}`);
  await expect(
    admin.getByRole("row", { name: new RegExp(SELLER_NAME) })
  ).toBeVisible();
  await admin.goto(`/admin/sellers/${SELLER_ID}`);
  await expect(admin.getByRole("heading", { name: SELLER_NAME })).toBeVisible();
  await expect(
    admin.getByRole("heading", { name: "Bodegas" })
  ).toBeVisible();

  await admin.goto("/admin/sellers/new");
  await expect(
    admin.getByRole("heading", { name: "Registrar vendedor" })
  ).toBeVisible();
  await expect(admin.getByLabel("Nombre completo")).toBeVisible();

  // 6. Compradores y almacenes.
  await admin.goto("/admin/buyers");
  await expect(
    admin.getByRole("heading", { name: "Compradores", exact: true })
  ).toBeVisible();
  await admin.goto(`/admin/buyers/${BUYER_ID}`);
  await expect(admin.getByRole("heading", { name: BUYER_NAME })).toBeVisible();

  await admin.goto("/admin/warehouses");
  await expect(
    admin.getByRole("heading", { name: "Almacenes", exact: true })
  ).toBeVisible();
  await admin.goto(`/admin/warehouses/${WAREHOUSE_ID}`);
  await expect(
    admin.getByRole("heading", { name: /Bodega Aurora/ })
  ).toBeVisible();
  await expect(
    admin.getByRole("heading", { name: "Inventario del almacén" })
  ).toBeVisible();

  // 7. Catálogo e inventario.
  await admin.goto("/admin/products");
  await expect(
    admin.getByRole("heading", { name: "Catálogo de productos" })
  ).toBeVisible();
  await admin.goto(`/admin/products?search=${encodeURIComponent(PRODUCT_NAME)}`);
  await expect(
    admin.getByRole("row", { name: new RegExp(PRODUCT_NAME) })
  ).toBeVisible();
  await admin.goto(`/admin/products/${PRODUCT_ID}`);
  await expect(
    admin.getByRole("heading", { name: PRODUCT_NAME })
  ).toBeVisible();
  await expect(
    admin.getByRole("heading", { name: "Inventario por almacén" })
  ).toBeVisible();

  await admin.goto("/admin/inventory");
  await expect(
    admin.getByRole("heading", { name: "Inventario", exact: true })
  ).toBeVisible();
  await admin.goto(`/admin/inventory?search=${encodeURIComponent(PRODUCT_NAME)}`);
  await expect(
    admin.getByRole("row", { name: new RegExp(PRODUCT_NAME) }).first()
  ).toBeVisible();
  await admin.goto("/admin/inventory/movements");
  await expect(
    admin.getByRole("heading", {
      name: "Movimientos de inventario",
      exact: true
    })
  ).toBeVisible();

  // 8. Pedidos: listado y detalle de solo lectura.
  await admin.goto("/admin/orders");
  await expect(
    admin.getByRole("heading", { name: "Pedidos", exact: true })
  ).toBeVisible();
  const orderRow = admin.locator("tbody tr").first();
  await expect(orderRow).toBeVisible();
  await orderRow.getByRole("link", { name: "Ver detalle" }).click();
  await expect(
    admin.getByRole("heading", { name: "Productos del pedido" })
  ).toBeVisible();
  await expect(
    admin.getByRole("heading", { name: "Historial de estados" })
  ).toBeVisible();
  await expect(
    admin.getByRole("heading", { name: "Consulta de solo lectura" })
  ).toBeVisible();
  await expect(
    admin.getByRole("button", {
      name: /publicar|suspender|descontinuar|despachar|entregar|confirmar pago|reembolsar|editar|eliminar/i
    })
  ).toHaveCount(0);
  await expect(admin.locator("main form")).toHaveCount(0);

  // 9. Pagos y reportes.
  await admin.goto("/admin/payments");
  await expect(
    admin.getByRole("heading", { name: "Pagos", exact: true })
  ).toBeVisible();
  await admin.goto("/admin/reports");
  await expect(
    admin.getByRole("heading", { name: "Reportes", exact: true })
  ).toBeVisible();
  await expect(
    admin.getByRole("heading", { name: "Secciones no disponibles" })
  ).toBeVisible();

  // 10. El backend rechaza escrituras administrativas no definidas.
  const writeResponse = await admin.request.post(
    `${API_URL}/api/v1/admin/orders`,
    { data: {} }
  );
  expect([401, 405]).toContain(writeResponse.status());

  await adminContext.close();
});
