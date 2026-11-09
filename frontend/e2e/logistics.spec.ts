import { expect, test, type Page } from "@playwright/test";

const PASSWORD = process.env.NEXUS_DEMO_PASSWORD ?? "NexusMarketDemo2026!";
const BUYER_EMAIL = "comprador@nexusmarket.demo";
const LOGISTICS_EMAIL = "logistica@nexusmarket.demo";

/**
 * Producto físico del seed demo cuya bodega (Aurora) está asignada al operador
 * logístico demo. Se usa un producto existente para no depender de otra suite.
 */
const DEMO_PRODUCT_ID = "40000000-0000-4000-8000-000000000001";
const DEMO_PRODUCT_NAME = "Audífonos Aurora";

test.describe.configure({ mode: "serial" });

async function login(page: Page, email: string, redirectTo?: string): Promise<void> {
  await page.goto(redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill(PASSWORD);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).not.toHaveURL(/\/login(\?|$)/);
}

/** Envía una Server Action de la ruta actual y espera su respuesta. */
async function submitAction(page: Page, buttonName: string): Promise<void> {
  const origin = new URL(page.url()).origin;
  const response = page.waitForResponse(
    (candidate) =>
      candidate.request().method() === "POST" &&
      new URL(candidate.url()).origin === origin
  );
  await page.getByRole("button", { name: buttonName }).click();
  await response;
  await page.reload();
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
 * Flujo logístico completo:
 * comprador paga un producto de una bodega asignada → el operador lo ve en su
 * ámbito → prepara el envío → despacha (consume reservas y descuenta stock) →
 * registra la entrega con evidencia → el pedido queda ENTREGADO.
 */
test("el operador logístico prepara, despacha y entrega un pedido de su ámbito", async ({
  browser
}) => {
  test.setTimeout(240_000);
  const stamp = Date.now().toString(36).toUpperCase();

  // 1. El comprador compra un producto de una bodega del operador.
  const buyerContext = await browser.newContext();
  const buyer = await buyerContext.newPage();
  buyer.on("dialog", (dialog) => void dialog.accept());
  await login(buyer, BUYER_EMAIL);
  await expect(buyer).toHaveURL(/\/$/);
  await emptyCart(buyer);

  await buyer.goto(`/products/${DEMO_PRODUCT_ID}`);
  await expect(
    buyer.getByRole("heading", { name: DEMO_PRODUCT_NAME })
  ).toBeVisible();
  await buyer.getByLabel("Cantidad").fill("2");
  await buyer.getByRole("button", { name: "Agregar al carrito" }).click();
  await expect(buyer.getByText("Ver carrito")).toBeVisible();

  await buyer.goto("/cart");
  await expect(
    buyer.getByRole("heading", { name: DEMO_PRODUCT_NAME })
  ).toBeVisible();
  await buyer.getByRole("link", { name: "Continuar al checkout" }).click();
  await expect(
    buyer.getByRole("heading", { name: "Confirmar compra" })
  ).toBeVisible();
  await buyer.getByLabel("Resultado del pago").selectOption("CONFIRMADO");
  await buyer.getByRole("button", { name: "Confirmar compra" }).click();
  await expect(buyer.getByRole("heading", { name: "Pago confirmado" })).toBeVisible();

  const orderLink = buyer.locator(".checkout-order-list a").first();
  await expect(orderLink).toBeVisible();
  const orderText = (await orderLink.textContent()) ?? "";
  const orderNumber = orderText.split("·")[0]?.trim();
  expect(orderNumber).toBeTruthy();
  await buyerContext.close();

  // 2. Un comprador no puede entrar al espacio logístico.
  const forbiddenContext = await browser.newContext();
  const forbidden = await forbiddenContext.newPage();
  await login(forbidden, BUYER_EMAIL);
  await forbidden.goto("/logistics");
  await expect(forbidden).toHaveURL(/\/$/);
  await forbiddenContext.close();

  // 3. El operador ve el pedido dentro de su ámbito y opera el envío.
  const operatorContext = await browser.newContext();
  const operator = await operatorContext.newPage();
  operator.on("dialog", (dialog) => void dialog.accept());
  await login(operator, LOGISTICS_EMAIL, "/logistics");
  await expect(operator).toHaveURL(/\/logistics$/);
  await expect(
    operator.getByRole("heading", { name: "Centro Logístico Nexus" })
  ).toBeVisible();

  await operator.goto("/logistics/orders");
  await expect(
    operator.getByRole("heading", { name: "Pedidos en tu ámbito" })
  ).toBeVisible();
  const orderCard = operator
    .locator(".order-card")
    .filter({ hasText: orderNumber! });
  await expect(orderCard).toBeVisible();
  await orderCard.getByRole("link", { name: "Ver detalle y operar" }).click();

  await expect(
    operator.getByRole("heading", { name: orderNumber! })
  ).toBeVisible();
  await expect(operator.getByText(DEMO_PRODUCT_NAME).first()).toBeVisible();

  // Preparación: usa la bodega asignada con reservas activas.
  await operator.getByLabel("Bodega de origen").selectOption({ index: 0 });
  await operator
    .getByLabel("Transportista (opcional)")
    .fill("Transportes E2E");
  await submitAction(operator, "Preparar envío");
  await expect(
    operator.getByText("Despachar este envío", { exact: true })
  ).toBeVisible();

  // Despacho: consume las reservas y registra la salida de inventario.
  const dispatchDetails = operator
    .locator("details")
    .filter({ hasText: "Despachar este envío" });
  await dispatchDetails.locator("summary").click();
  await dispatchDetails
    .getByLabel("Número de seguimiento (opcional)")
    .fill(`E2E-${stamp}`);
  await submitAction(operator, "Despachar envío");
  await expect(
    operator.getByText("Registrar entrega o fallo", { exact: true })
  ).toBeVisible();

  // Entrega con evidencia: cierra la operación del pedido como ENTREGADO.
  const deliveryDetails = operator
    .locator("details")
    .filter({ hasText: "Registrar entrega o fallo" });
  await deliveryDetails.locator("summary").click();
  await deliveryDetails.getByLabel("Tipo de evidencia").fill("RECIBO");
  await deliveryDetails
    .getByLabel("Referencia")
    .fill(`REC-E2E-${stamp}`);
  await deliveryDetails
    .getByLabel("Nota (opcional)")
    .fill("Entrega confirmada en la prueba E2E.");
  await submitAction(operator, "Registrar entrega");

  await expect(
    operator
      .locator(".order-detail-badges")
      .getByText("Entregado", { exact: true })
  ).toBeVisible();
  await expect(
    operator.getByText("Despachado → Entregado", { exact: false })
  ).toBeVisible();
  await expect(
    operator.getByText(`REC-E2E-${stamp}`, { exact: false })
  ).toBeVisible();

  // 4. El inventario de la bodega quedó consultable sin reservas activas.
  await operator.goto("/logistics/inventory");
  await expect(
    operator.getByRole("heading", { name: "Inventario de tus bodegas" })
  ).toBeVisible();
  const inventoryRow = operator
    .getByRole("row", { name: new RegExp(DEMO_PRODUCT_NAME) })
    .first();
  await expect(inventoryRow).toBeVisible();

  await operatorContext.close();
});
