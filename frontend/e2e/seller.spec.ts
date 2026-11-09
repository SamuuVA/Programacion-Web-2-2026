import { expect, test, type Page } from "@playwright/test";

const PASSWORD = process.env.NEXUS_DEMO_PASSWORD ?? "NexusMarketDemo2026!";
const SELLER_EMAIL = "aurora@nexusmarket.demo";
const OTHER_SELLER_EMAIL = "nido@nexusmarket.demo";
const BUYER_EMAIL = "comprador@nexusmarket.demo";

test.describe.configure({ mode: "serial" });

async function login(page: Page, email: string, redirectTo?: string): Promise<void> {
  await page.goto(redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill(PASSWORD);
  await page.getByRole("button", { name: "Ingresar" }).click();
  // La Server Action de login redirige; esperar evita navegar antes de que la
  // cookie de sesión esté disponible.
  await expect(page).not.toHaveURL(/\/login(\?|$)/);
}

/**
 * Envía una Server Action de la ruta actual, acepta el diálogo de confirmación
 * y espera la respuesta antes de recargar. Evita leer mensajes transitorios que
 * `revalidatePath` puede desmontar.
 */
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

test("protege el espacio del vendedor para anónimos y compradores", async ({ browser }) => {
  const anonymous = await browser.newContext();
  const anonymousPage = await anonymous.newPage();
  await anonymousPage.goto("/seller");
  await expect(anonymousPage).toHaveURL(/\/login\?redirect=%2Fseller/);
  await expect(
    anonymousPage.getByRole("heading", { name: "Ingresa a NexusMarket" })
  ).toBeVisible();
  await anonymous.close();

  const buyerContext = await browser.newContext();
  const buyerPage = await buyerContext.newPage();
  await login(buyerPage, BUYER_EMAIL);
  await expect(buyerPage).toHaveURL(/\/$/);
  await buyerPage.goto("/seller");
  await expect(buyerPage).toHaveURL(/\/$/);
  await expect(
    buyerPage.getByRole("link", { name: "Mi tienda" })
  ).toHaveCount(0);
  await buyerContext.close();
});

test("recorre el alta, publicación, inventario y estados del vendedor", async ({
  page
}) => {
  page.on("dialog", (dialog) => {
    void dialog.accept();
  });
  await login(page, SELLER_EMAIL, "/seller");
  await expect(page).toHaveURL(/\/seller$/);
  await expect(
    page.getByRole("heading", { name: "Estudio Aurora", exact: false })
  ).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Espacio del vendedor" })).toBeVisible();
  for (const label of [
    "Resumen",
    "Perfil",
    "Productos",
    "Bodegas",
    "Inventario",
    "Pedidos"
  ]) {
    await expect(
      page.getByRole("navigation", { name: "Espacio del vendedor" }).getByRole("link", {
        name: label
      })
    ).toBeVisible();
  }

  // Perfil: edición limitada al nombre comercial.
  await page.getByRole("link", { name: "Perfil" }).click();
  await expect(
    page.getByRole("heading", { name: "Perfil", exact: true })
  ).toBeVisible();
  await expect(page.getByLabel("Nombre comercial")).toHaveValue("Estudio Aurora");
  await expect(
    page.getByText("La razón social y otros datos no están aprobados")
  ).toBeVisible();

  // Bodegas: existe la bodega demo y el formulario de alta.
  await page.getByRole("link", { name: "Bodegas" }).click();
  await expect(page.getByRole("heading", { name: "Mis bodegas" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Nueva bodega" })).toBeVisible();

  // Productos: crear borrador.
  const sku = `E2E-${Date.now().toString(36).toUpperCase()}`;
  const productName = `Producto E2E ${sku}`;
  await page.getByRole("link", { name: "Productos" }).click();
  await expect(page.getByRole("heading", { name: "Mis productos" })).toBeVisible();
  await page.getByRole("link", { name: "Crear producto" }).first().click();
  await expect(page.getByRole("heading", { name: "Crear producto" })).toBeVisible();

  await page.getByLabel("Nombre del producto").fill(productName);
  await page.getByLabel("Descripción").fill("Producto temporal de la prueba E2E.");
  await page.getByLabel("Categoría").selectOption("HOGAR");
  await page.getByLabel("Tipo de entrega").selectOption("FISICA");
  await page.getByLabel("SKU").fill(sku);
  await page.getByLabel("Precio").fill("25900");
  await page.getByLabel("Moneda").fill("COP");
  await page.getByRole("button", { name: "Crear producto en borrador" }).click();

  await expect(page).toHaveURL(/\/seller\/products\/[0-9a-f-]+$/);
  await expect(page.getByRole("heading", { name: productName })).toBeVisible();
  await expect(page.getByText("Borrador", { exact: true })).toBeVisible();

  // Publicar sin imagen debe fallar con un error de negocio.
  await page.getByRole("button", { name: "Publicar" }).click();
  await expect(
    page.getByText("El producto no cumple las condiciones para publicarse", {
      exact: false
    })
  ).toBeVisible();
  // Imagen por URL (no hay carga binaria aprobada).
  await page.getByLabel("URL de la imagen").fill("/products/lampara-nido.svg");
  await page.getByLabel("Texto alternativo").fill("Lámpara E2E");
  await page.getByRole("button", { name: "Agregar imagen" }).click();
  await expect(page.getByText("Imagen agregada.")).toBeVisible();
  await expect(page.getByText("Lámpara E2E")).toBeVisible();

  // Publicar con imagen.
  await submitAction(page, "Publicar");
  await expect(page.getByText("Publicado", { exact: true })).toBeVisible();

  // El catálogo público muestra el producto publicado.
  const productUrl = page.url().replace("/seller", "");
  await page.goto(productUrl);
  await expect(page.getByRole("heading", { name: productName })).toBeVisible();

  // Inventario: ingreso de stock del producto físico.
  await page.goto("/seller/inventory");
  await expect(page.getByRole("heading", { name: "Inventario" })).toBeVisible();
  await page
    .getByLabel("Producto físico")
    .selectOption({ label: `${productName} · ${sku}` });
  await page.getByLabel("Cantidad").fill("3");
  await page.getByLabel("Motivo (opcional)").fill("Carga E2E");
  await submitAction(page, "Registrar ingreso");
  const inventoryRow = page.getByRole("row", { name: new RegExp(sku) });
  await expect(inventoryRow).toBeVisible();
  await expect(inventoryRow).toContainText("3");

  // Pedidos: consulta de solo lectura.
  await page.getByRole("link", { name: "Pedidos" }).click();
  await expect(
    page.getByRole("heading", { name: "Pedidos con mis productos" })
  ).toBeVisible();
  await expect(page.getByText("La preparación, el despacho y el pago", { exact: false })).toBeVisible();

  // Suspender y descontinuar con confirmación.
  await page.getByRole("link", { name: "Productos" }).click();
  await page.getByRole("link", { name: productName }).click();
  await expect(
    page.getByRole("heading", { name: productName, exact: true })
  ).toBeVisible();
  await submitAction(page, "Suspender");
  await expect(page.getByText("Suspendido", { exact: true })).toBeVisible();

  await submitAction(page, "Descontinuar");
  await expect(page.getByText("Descontinuado", { exact: true })).toBeVisible();
  await expect(
    page.getByText("El producto está descontinuado", { exact: false })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Publicar" })).toHaveCount(0);
});

test("no expone recursos de otro vendedor cambiando el identificador", async ({
  page
}) => {
  await login(page, SELLER_EMAIL, "/seller/products");
  await page.getByRole("link", { name: "Productos" }).click();
  const firstProduct = page.locator(".seller-product-name").first();
  await expect(firstProduct).toBeVisible();
  const ownUrl = await firstProduct.getAttribute("href");
  expect(ownUrl).toBeTruthy();

  const otherContext = await page.context().browser()!.newContext();
  const otherPage = await otherContext.newPage();
  await login(otherPage, OTHER_SELLER_EMAIL, "/seller");
  await otherPage.goto(ownUrl!);
  await expect(
    otherPage.getByRole("heading", { name: "No encontramos ese recurso" })
  ).toBeVisible();
  await otherContext.close();
});
