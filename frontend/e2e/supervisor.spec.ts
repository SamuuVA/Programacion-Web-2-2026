import { expect, test, type Page } from "@playwright/test";
import {
  DEMO_PRODUCT_ID,
  DEMO_PRODUCT_NAME,
  ensureDemoProductStock
} from "./support/demo-stock";

const PASSWORD = process.env.NEXUS_DEMO_PASSWORD ?? "NexusMarketDemo2026!";
const SUPERVISOR_EMAIL = "supervisor@nexusmarket.demo";
const ADMIN_EMAIL = "admin@nexusmarket.demo";
const BUYER_EMAIL = "comprador@nexusmarket.demo";
const SELLER_EMAIL = "aurora@nexusmarket.demo";
const LOGISTICS_EMAIL = "logistica@nexusmarket.demo";

const DEMO_SELLER_NAME = "Estudio Aurora";

test.describe.configure({ mode: "serial" });

async function login(page: Page, email: string, redirectTo?: string): Promise<void> {
  await page.goto(redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill(PASSWORD);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).not.toHaveURL(/\/login(\?|$)/);
}

/** Vacía el carrito persistente del comprador antes de la compra. */
async function emptyCart(page: Page): Promise<void> {
  await page.goto("/cart");
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const remove = page.getByRole("button", { name: "Quitar" });
    if ((await remove.count()) === 0) {
      return;
    }
    const origin = new URL(page.url()).origin;
    const response = page.waitForResponse(
      (candidate) =>
        candidate.request().method() === "POST" &&
        new URL(candidate.url()).origin === origin
    );
    await remove.first().click();
    await response;
    await page.reload();
  }
  throw new Error("No se pudo vaciar el carrito del comprador en 30 intentos.");
}

/**
 * Crea un pedido real con el comprador demo para que la supervisión tenga datos
 * verificables sin depender del orden de otras suites E2E.
 */
async function createOrder(page: Page): Promise<string> {
  await login(page, BUYER_EMAIL);
  await expect(page).toHaveURL(/\/$/);
  await emptyCart(page);

  await page.goto(`/products/${DEMO_PRODUCT_ID}`);
  await expect(
    page.getByRole("heading", { name: DEMO_PRODUCT_NAME })
  ).toBeVisible();
  await page.getByLabel("Cantidad").fill("1");
  await page.getByRole("button", { name: "Agregar al carrito" }).click();
  await expect(page.getByText("Ver carrito")).toBeVisible();

  await page.goto("/cart");
  await expect(page.getByRole("heading", { name: DEMO_PRODUCT_NAME })).toBeVisible();
  await page.getByRole("link", { name: "Continuar al checkout" }).click();
  await expect(page.getByRole("heading", { name: "Confirmar compra" })).toBeVisible();
  await page.getByLabel("Resultado del pago").selectOption("CONFIRMADO");
  await page.getByRole("button", { name: "Confirmar compra" }).click();
  await expect(page.getByRole("heading", { name: "Pago confirmado" })).toBeVisible();

  const orderLink = page.locator(".checkout-order-list a").first();
  await expect(orderLink).toBeVisible();
  const orderText = (await orderLink.textContent()) ?? "";
  const orderNumber = orderText.split("·")[0]?.trim();
  expect(orderNumber).toBeTruthy();
  return orderNumber!;
}

test("el supervisor consulta datos reales sin poder modificar nada", async ({
  browser,
  request
}) => {
  test.setTimeout(240_000);

  // 0. Stock real suficiente para que la compra sea determinista aunque la
  // base ya haya sido usada por ejecuciones anteriores.
  await ensureDemoProductStock(request);

  // 1. Datos reales: el comprador crea un pedido antes de la consulta.
  const buyerContext = await browser.newContext();
  const buyer = await buyerContext.newPage();
  buyer.on("dialog", (dialog) => void dialog.accept());
  const orderNumber = await createOrder(buyer);
  await buyerContext.close();

  // 2. Sin sesión, el espacio de supervisión redirige al login.
  const anonymousContext = await browser.newContext();
  const anonymous = await anonymousContext.newPage();
  await anonymous.goto("/supervisor");
  await expect(anonymous).toHaveURL(/\/login\?redirect=/);
  await anonymousContext.close();

  // 3. Aislamiento de rol: ningún otro perfil entra al espacio de supervisión.
  for (const email of [ADMIN_EMAIL, BUYER_EMAIL, SELLER_EMAIL, LOGISTICS_EMAIL]) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, email);
    await page.goto("/supervisor");
    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole("heading", { name: "Resumen operativo" })
    ).toHaveCount(0);
    await context.close();
  }

  // 4. El supervisor accede y ve conteos construidos con datos reales.
  const supervisorContext = await browser.newContext();
  const supervisor = await supervisorContext.newPage();
  supervisor.on("dialog", (dialog) => void dialog.accept());
  await login(supervisor, SUPERVISOR_EMAIL, "/supervisor");
  await expect(supervisor).toHaveURL(/\/supervisor$/);
  await expect(
    supervisor.getByRole("heading", { name: "Resumen operativo" })
  ).toBeVisible();
  await expect(
    supervisor.getByRole("heading", { name: "Pedidos por estado" })
  ).toBeVisible();
  await expect(
    supervisor.getByRole("heading", { name: "Reportes administrativos" })
  ).toBeVisible();
  await expect(
    supervisor.getByText("No disponibles.", { exact: false })
  ).toBeVisible();

  // El encabezado ofrece el acceso de supervisión y no el de administración.
  await expect(
    supervisor.locator(".site-header").getByRole("link", { name: "Supervisión" })
  ).toBeVisible();
  await expect(
    supervisor.locator(".site-header").getByRole("link", { name: "Vendedores" })
  ).toHaveCount(0);

  // 5. Pedidos: el pedido real aparece y su detalle es de solo lectura.
  await supervisor.goto("/supervisor/orders");
  await expect(supervisor.getByRole("heading", { name: "Pedidos" })).toBeVisible();
  const orderCard = supervisor
    .locator(".order-card")
    .filter({ hasText: orderNumber });
  await expect(orderCard).toBeVisible();
  await orderCard.getByRole("link", { name: "Ver detalle" }).click();

  await expect(
    supervisor.getByRole("heading", { name: orderNumber })
  ).toBeVisible();
  await expect(supervisor.getByText(DEMO_PRODUCT_NAME).first()).toBeVisible();
  await expect(
    supervisor.getByRole("heading", { name: "Consulta de solo lectura" })
  ).toBeVisible();
  await expect(
    supervisor.getByRole("button", {
      name: /publicar|suspender|descontinuar|despachar|entregar|confirmar pago|editar|eliminar/i
    })
  ).toHaveCount(0);
  await expect(supervisor.locator("main form")).toHaveCount(0);

  // 6. Productos, inventario, almacenes, envíos y vendedores son consultables.
  await supervisor.goto("/supervisor/products");
  await expect(supervisor.getByRole("heading", { name: "Productos" })).toBeVisible();
  await expect(supervisor.locator(".seller-product-row").first()).toBeVisible();

  await supervisor.goto(`/supervisor/products/${DEMO_PRODUCT_ID}`);
  await expect(
    supervisor.getByRole("heading", { name: DEMO_PRODUCT_NAME })
  ).toBeVisible();
  await expect(
    supervisor.getByRole("heading", { name: "Inventario por bodega" })
  ).toBeVisible();

  await supervisor.goto(
    "/supervisor/inventory?bodegaId=30000000-0000-4000-8000-000000000001"
  );
  await expect(supervisor.getByRole("heading", { name: "Inventario" })).toBeVisible();
  await expect(
    supervisor.getByRole("row", { name: new RegExp(DEMO_PRODUCT_NAME) }).first()
  ).toBeVisible();

  await supervisor.goto("/supervisor/warehouses");
  await expect(supervisor.getByRole("heading", { name: "Almacenes" })).toBeVisible();
  await expect(
    supervisor.getByText("Bodega Aurora · Bogotá", { exact: false }).first()
  ).toBeVisible();

  await supervisor.goto("/supervisor/shipments");
  await expect(supervisor.getByRole("heading", { name: "Envíos" })).toBeVisible();

  await supervisor.goto("/supervisor/sellers");
  await expect(supervisor.getByRole("heading", { name: "Vendedores" })).toBeVisible();
  await expect(
    supervisor.getByText(DEMO_SELLER_NAME, { exact: false }).first()
  ).toBeVisible();

  // 7. El backend rechaza métodos de escritura bajo /api/v1/supervisor.
  const writeResponse = await supervisor.request.post(
    "http://127.0.0.1:3000/api/v1/supervisor/orders",
    { data: {} }
  );
  expect([401, 405]).toContain(writeResponse.status());

  await supervisorContext.close();
});
