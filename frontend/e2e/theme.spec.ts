import { expect, test, type Page } from "@playwright/test";
import {
  DEMO_PRODUCT_NAME,
  ensureDemoProductStock
} from "./support/demo-stock";

const PASSWORD = process.env.NEXUS_DEMO_PASSWORD ?? "NexusMarketDemo2026!";
const BUYER_EMAIL = "comprador@nexusmarket.demo";
const STORAGE_KEY = "nexusmarket-theme";

const LIGHT_BG = "rgb(244, 247, 243)";
const DARK_BG = "rgb(13, 32, 24)";

test.describe.configure({ mode: "serial" });

async function themeState(page: Page) {
  return page.evaluate((storageKey) => {
    const body = getComputedStyle(document.body);
    const header = document.querySelector(".site-header");
    const card = document.querySelector(".product-card");
    return {
      theme: document.documentElement.getAttribute("data-theme"),
      stored: (() => {
        try {
          return localStorage.getItem(storageKey);
        } catch {
          return "ERROR";
        }
      })(),
      bodyBg: body.backgroundColor,
      bodyColor: body.color,
      headerBg: header ? getComputedStyle(header).backgroundColor : null,
      cardBg: card ? getComputedStyle(card).backgroundColor : null,
      cards: document.querySelectorAll(".product-card").length
    };
  }, STORAGE_KEY);
}

/**
 * `body` anima background-color durante 0.2 s. Se espera al valor final para no
 * leer un color intermedio de la transición.
 */
async function expectBodyBackground(
  page: Page,
  expected: string
): Promise<void> {
  await expect
    .poll(async () => (await themeState(page)).bodyBg)
    .toBe(expected);
}

async function login(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(BUYER_EMAIL);
  await page.getByLabel("Contraseña").fill(PASSWORD);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).not.toHaveURL(/\/login(\?|$)/);
}

test("el tema se aplica, persiste entre rutas y recargas y no rompe el catálogo", async ({
  page
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(String(error)));

  await page.goto("/", { waitUntil: "networkidle" });
  await expect(
    page.getByRole("button", { name: "Usar tema oscuro" })
  ).toBeVisible();
  const light = await themeState(page);
  expect(light.theme).toBe("light");
  expect(light.bodyBg).toBe(LIGHT_BG);

  // El cambio no es solo un icono: cambian las superficies reales.
  await page.getByRole("button", { name: "Usar tema oscuro" }).click();
  await expect
    .poll(async () => (await themeState(page)).theme)
    .toBe("dark");
  await expectBodyBackground(page, DARK_BG);
  const dark = await themeState(page);
  expect(dark.stored).toBe("dark");
  expect(dark.bodyColor).not.toBe(light.bodyColor);
  expect(dark.headerBg).not.toBe(light.headerBg);

  // Persiste al navegar a otra ruta.
  await page.goto("/products", { waitUntil: "networkidle" });
  await expectBodyBackground(page, DARK_BG);
  const darkCatalog = await themeState(page);
  expect(darkCatalog.theme).toBe("dark");
  expect(darkCatalog.cards).toBeGreaterThan(0);
  expect(darkCatalog.cardBg).not.toBe("rgb(255, 255, 255)");

  // Persiste al recargar.
  await page.reload({ waitUntil: "networkidle" });
  expect((await themeState(page)).theme).toBe("dark");

  // Vuelve a claro y también persiste.
  await page.getByRole("button", { name: "Usar tema claro" }).click();
  await expect
    .poll(async () => (await themeState(page)).theme)
    .toBe("light");
  await page.reload({ waitUntil: "networkidle" });
  await expectBodyBackground(page, LIGHT_BG);
  const restored = await themeState(page);
  expect(restored.theme).toBe("light");
  expect(restored.stored).toBe("light");

  expect(errors).toEqual([]);
});

test("la preferencia del sistema se respeta en la primera visita", async ({
  browser
}) => {
  const context = await browser.newContext({ colorScheme: "dark" });
  const page = await context.newPage();
  await page.goto("/", { waitUntil: "networkidle" });

  await expectBodyBackground(page, DARK_BG);
  const initial = await themeState(page);
  expect(initial.theme).toBe("dark");
  expect(initial.stored).toBeNull();

  // Una elección explícita gana sobre la preferencia del sistema.
  await page.getByRole("button", { name: "Usar tema claro" }).click();
  await expect
    .poll(async () => (await themeState(page)).theme)
    .toBe("light");
  await page.reload({ waitUntil: "networkidle" });
  const explicit = await themeState(page);
  expect(explicit.theme).toBe("light");
  expect(explicit.stored).toBe("light");

  await context.close();
});

test("el catálogo, la búsqueda, el detalle y el carrito funcionan en ambos temas", async ({
  page,
  request
}) => {
  test.setTimeout(240_000);
  await ensureDemoProductStock(request);

  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(String(error)));

  await login(page);

  for (const theme of ["light", "dark"] as const) {
    const toggleName =
      theme === "light" ? "Usar tema claro" : "Usar tema oscuro";
    const expectedBg = theme === "light" ? LIGHT_BG : DARK_BG;

    await page.goto("/products", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: toggleName }).click();
    await expect
      .poll(async () => (await themeState(page)).theme)
      .toBe(theme);
    await expectBodyBackground(page, expectedBg);

    // Productos reales del backend, no datos estáticos.
    await expect(page.locator(".product-card").first()).toBeVisible();
    await expect(
      page.getByText(/productos? encontrados?/)
    ).toBeVisible();

    // Búsqueda.
    await page
      .getByLabel("Buscar productos por nombre o descripción")
      .fill("Audífonos");
    await page.getByRole("button", { name: "Aplicar filtros" }).click();
    await expect(page).toHaveURL(/search=Aud/);
    const searched = page
      .locator(".product-card")
      .filter({ hasText: DEMO_PRODUCT_NAME });
    await expect(searched.first()).toBeVisible();
    expect(await searched.count()).toBeGreaterThan(0);

    // Filtro por categoría existente.
    await page.goto("/products", { waitUntil: "networkidle" });
    await page
      .getByRole("group", { name: "Filtrar por categoría" })
      .getByRole("link", { name: "Electrónica" })
      .click();
    await expect(page).toHaveURL(/categoria=ELECTRONICA/);
    await expect(page.locator(".product-card").first()).toBeVisible();

    // Detalle desde la tarjeta: se vuelve a buscar para que el producto demo
    // esté en la página visible y no dependa del orden del catálogo global.
    await page.goto("/products?search=Aud%C3%ADfonos", {
      waitUntil: "networkidle"
    });
    await page
      .locator(".product-card")
      .filter({ hasText: DEMO_PRODUCT_NAME })
      .getByRole("link", { name: `Ver ${DEMO_PRODUCT_NAME}` })
      .click();
    await expect(
      page.getByRole("heading", { name: DEMO_PRODUCT_NAME })
    ).toBeVisible();
    await expect(page.getByText("SKU", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Cantidad")).toBeEnabled();

    // Carrito: agrega y limpia para no acumular estado entre temas.
    await page.getByRole("button", { name: "Agregar al carrito" }).click();
    await expect(page.getByText("Ver carrito")).toBeVisible();
    await page.goto("/cart", { waitUntil: "networkidle" });
    await expect(
      page.getByRole("heading", { name: DEMO_PRODUCT_NAME })
    ).toBeVisible();
    const remove = page.getByRole("button", { name: "Quitar" });
    await expect(remove).toBeVisible();
    const origin = new URL(page.url()).origin;
    const response = page.waitForResponse(
      (candidate) =>
        candidate.request().method() === "POST" &&
        new URL(candidate.url()).origin === origin
    );
    await remove.first().click();
    await response;
    await page.reload({ waitUntil: "networkidle" });
    await expect(
      page.getByRole("heading", { name: DEMO_PRODUCT_NAME })
    ).toHaveCount(0);
  }

  expect(errors).toEqual([]);
});
