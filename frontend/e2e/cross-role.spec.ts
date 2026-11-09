import { expect, test, type Page } from "@playwright/test";

const PASSWORD = process.env.NEXUS_DEMO_PASSWORD ?? "NexusMarketDemo2026!";
const ADMIN_EMAIL = "admin@nexusmarket.demo";
const BUYER_EMAIL = "comprador@nexusmarket.demo";

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

/** Vacía el carrito persistente del comprador antes de la compra cruzada. */
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
 * Flujo cruzado completo del marketplace:
 * administrador registra vendedor + bodega → vendedor publica producto con stock
 * → comprador compra con pago simulado → vendedor ve el pedido en su ámbito.
 */
test("administrador registra al vendedor y el comprador compra su producto", async ({
  browser
}) => {
  test.setTimeout(240_000);

  const stamp = Date.now().toString(36).toUpperCase();
  const sellerEmail = `e2e.${stamp.toLowerCase()}@nexusmarket.demo`;
  const sellerName = `Vendedor E2E ${stamp}`;
  const documentNumber = `E2E${stamp}`;
  const warehouseName = `Bodega ${stamp}`;
  const sku = `XR-${stamp}`;
  const productName = `Producto cruzado ${stamp}`;

  // 1. El administrador registra el vendedor y su primera bodega (transacción).
  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  admin.on("dialog", (dialog) => void dialog.accept());
  await login(admin, ADMIN_EMAIL, "/admin/sellers/new");
  await expect(
    admin.getByRole("heading", { name: "Registrar vendedor" })
  ).toBeVisible();

  await admin.getByLabel("Nombre completo").fill(sellerName);
  await admin.getByLabel("Correo electrónico").fill(sellerEmail);
  await admin.getByLabel("Número", { exact: true }).fill(documentNumber);
  await admin.getByLabel("Contraseña inicial").fill(PASSWORD);
  await admin.getByLabel("Nombre comercial").fill(sellerName);
  await admin.getByLabel("Nombre de la bodega").fill(warehouseName);
  await admin
    .getByLabel("Ubicación de la bodega")
    .fill(`Calle 100 #20-30, Bogotá ${stamp}`);
  await admin.getByRole("button", { name: "Registrar vendedor" }).click();

  await expect(
    admin.getByText(
      `Vendedor ${sellerEmail} creado con su primera bodega.`
    )
  ).toBeVisible();
  await expect(admin.locator(".result-ids")).toContainText("Bodega");
  await adminContext.close();

  // 2. El vendedor recién creado inicia sesión y publica un producto físico.
  const sellerContext = await browser.newContext();
  const seller = await sellerContext.newPage();
  seller.on("dialog", (dialog) => void dialog.accept());
  await login(seller, sellerEmail, "/seller");
  await expect(seller).toHaveURL(/\/seller$/);
  await expect(
    seller.getByRole("heading", { name: sellerName })
  ).toBeVisible();

  await seller.goto("/seller/products/new");
  await seller.getByLabel("Nombre del producto").fill(productName);
  await seller
    .getByLabel("Descripción")
    .fill("Producto físico creado por el flujo cruzado E2E.");
  await seller.getByLabel("Categoría").selectOption("HOGAR");
  await seller.getByLabel("Tipo de entrega").selectOption("FISICA");
  await seller.getByLabel("SKU").fill(sku);
  await seller.getByLabel("Precio").fill("45900");
  await seller.getByLabel("Moneda").fill("COP");
  await seller.getByRole("button", { name: "Crear producto en borrador" }).click();

  await expect(seller).toHaveURL(/\/seller\/products\/[0-9a-f-]+$/);
  await expect(
    seller.getByRole("heading", { name: productName })
  ).toBeVisible();
  const productId = seller.url().split("/").pop();
  expect(productId).toBeTruthy();

  await seller.getByLabel("URL de la imagen").fill("/products/lampara-nido.svg");
  await seller.getByLabel("Texto alternativo").fill("Producto cruzado E2E");
  await seller.getByRole("button", { name: "Agregar imagen" }).click();
  await expect(seller.getByText("Imagen agregada.")).toBeVisible();

  await submitAction(seller, "Publicar");
  await expect(seller.getByText("Publicado", { exact: true })).toBeVisible();

  // Stock suficiente para que el comprador pueda adquirirlo.
  await seller.goto("/seller/inventory");
  await expect(
    seller.getByRole("heading", { name: "Inventario", exact: true })
  ).toBeVisible();
  await seller
    .getByLabel("Producto físico")
    .selectOption({ label: `${productName} · ${sku}` });
  await seller.getByLabel("Cantidad").fill("4");
  await seller.getByLabel("Motivo (opcional)").fill("Stock inicial E2E");
  await submitAction(seller, "Registrar ingreso");
  const inventoryRow = seller.getByRole("row", { name: new RegExp(sku) });
  await expect(inventoryRow).toBeVisible();
  await expect(inventoryRow).toContainText("4");

  // 3. El comprador encuentra el producto publicado y completa la compra.
  const buyerContext = await browser.newContext();
  const buyer = await buyerContext.newPage();
  buyer.on("dialog", (dialog) => void dialog.accept());
  await login(buyer, BUYER_EMAIL);
  await expect(buyer).toHaveURL(/\/$/);

  await emptyCart(buyer);

  await buyer.goto(`/products/${productId}`);
  await expect(
    buyer.getByRole("heading", { name: productName })
  ).toBeVisible();
  await expect(
    buyer.getByText(sellerName, { exact: false }).first()
  ).toBeVisible();
  await buyer.getByLabel("Cantidad").fill("2");
  await buyer.getByRole("button", { name: "Agregar al carrito" }).click();
  await expect(buyer.getByText("Ver carrito")).toBeVisible();

  // La dirección es obligatoria para productos físicos.
  await buyer.goto("/addresses");
  if ((await buyer.getByText("Aún no tienes direcciones").count()) > 0) {
    await buyer.getByLabel("Destinatario").fill("Comprador E2E");
    await buyer.getByLabel("Teléfono").fill("3001234567");
    await buyer.getByLabel("Dirección", { exact: true }).fill("Calle 45 #10-20");
    await buyer.getByLabel("Ciudad").fill("Bogotá");
    await buyer.getByLabel("Departamento / región").fill("Cundinamarca");
    await buyer.getByLabel("País (ISO 3166-1 alfa-2)").fill("CO");
    await submitAction(buyer, "Agregar dirección");
    await expect(buyer.getByText("Dirección guardada.")).toBeVisible();
  }

  await buyer.goto("/cart");
  await expect(buyer.getByRole("heading", { name: productName })).toBeVisible();
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

  await orderLink.click();
  await expect(buyer.getByRole("heading", { name: orderNumber! })).toBeVisible();
  await expect(buyer.getByText(productName).first()).toBeVisible();
  await buyerContext.close();

  // 4. El vendedor ve el pedido creado por el comprador y su detalle.
  await seller.goto("/seller/orders");
  await expect(
    seller.getByRole("heading", { name: "Pedidos con mis productos" })
  ).toBeVisible();
  const orderCard = seller
    .locator(".order-card")
    .filter({ hasText: orderNumber! });
  await expect(orderCard).toBeVisible();
  await orderCard.getByRole("link", { name: "Ver detalle" }).click();

  await expect(
    seller.getByRole("heading", { name: orderNumber! })
  ).toBeVisible();
  await expect(seller.getByText(productName).first()).toBeVisible();
  await expect(seller.getByText(`SKU ${sku}`, { exact: false })).toBeVisible();
  await expect(
    seller.getByRole("heading", { name: "Alcance de solo lectura" })
  ).toBeVisible();
  await expect(
    seller.getByRole("button", { name: /confirmar pago|despachar|entregar/i })
  ).toHaveCount(0);

  await sellerContext.close();
});
