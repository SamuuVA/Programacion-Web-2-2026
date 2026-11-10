import { expect, test, type Page } from "@playwright/test";

const PASSWORD = process.env.NEXUS_DEMO_PASSWORD ?? "NexusMarketDemo2026!";
const ADMIN_EMAIL = "admin@nexusmarket.demo";
const ADMIN_USER_ID = "70000000-0000-4000-8000-000000000001";

test.describe.configure({ mode: "serial" });

interface OnboardedBuyer {
  readonly email: string;
  readonly name: string;
  readonly documentNumber: string;
}

async function login(page: Page, email: string, redirectTo?: string): Promise<void> {
  await page.goto(
    redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login"
  );
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill(PASSWORD);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).not.toHaveURL(/\/login(\?|$)/);
}

async function registerBuyer(page: Page, stamp: string): Promise<OnboardedBuyer> {
  const email = `e2e.onboard.${stamp.toLowerCase()}@nexusmarket.demo`;
  const name = `Comprador Onboarding ${stamp}`;
  const documentNumber = `ONB${stamp}`;

  await page.goto("/register");
  await expect(
    page.getByRole("heading", { name: "Crea tu cuenta de comprador" })
  ).toBeVisible();
  await page.getByLabel("Nombre completo").fill(name);
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("País del documento").fill("CO");
  await page.getByLabel("Número de documento").fill(documentNumber);
  await page.getByLabel("Contraseña", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Confirmar contraseña").fill(PASSWORD);
  await page.getByRole("button", { name: "Crear cuenta de comprador" }).click();

  await expect(page).toHaveURL(/\/login\?registrado=1/);
  await expect(page.getByRole("status")).toContainText(
    "Tu cuenta de comprador fue creada"
  );

  return { email, name, documentNumber };
}

async function submitApplication(
  page: Page,
  stamp: string
): Promise<{ commercialName: string; warehouseName: string }> {
  const commercialName = `Comercio E2E ${stamp}`;
  const warehouseName = `Bodega E2E ${stamp}`;

  await page.goto("/seller-application");
  await expect(
    page.getByRole("heading", { name: "Quiero vender en NexusMarket" })
  ).toBeVisible();
  await page.getByLabel("Nombre comercial").fill(commercialName);
  await page.getByLabel("Nombre de la primera bodega").fill(warehouseName);
  await page
    .getByLabel("Ubicación de la bodega")
    .fill("Bogotá, Colombia");
  await page.getByRole("button", { name: "Enviar solicitud" }).click();

  await expect(page.getByRole("heading", { name: "Tu solicitud" })).toBeVisible();
  await expect(page.locator(".badge", { hasText: "Pendiente" })).toBeVisible();
  return { commercialName, warehouseName };
}

async function openApplicationAsAdmin(
  page: Page,
  email: string
): Promise<void> {
  await login(page, ADMIN_EMAIL, "/admin/seller-applications");
  await page.goto(
    `/admin/seller-applications?search=${encodeURIComponent(email)}`
  );
  const row = page.locator("tbody tr", { hasText: email });
  await expect(row).toHaveCount(1);
  await row.getByRole("link", { name: "Ver detalle" }).click();
  await expect(page.getByText("Revisión administrativa")).toBeVisible();
}

test("registro público, solicitud, aprobación y acceso al espacio de vendedor", async ({
  browser
}) => {
  test.setTimeout(240_000);
  const stamp = `${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 6)}`.toUpperCase();

  // 1-4. Registro público y creación de la cuenta de comprador.
  const buyerContext = await browser.newContext();
  const buyer = await buyerContext.newPage();
  buyer.on("dialog", (dialog) => void dialog.accept());
  const account = await registerBuyer(buyer, stamp);

  // 5-6. Inicio de sesión y acceso al espacio de comprador.
  await login(buyer, account.email);
  await expect(buyer).toHaveURL(/\/$/);
  await expect(
    buyer.locator(".site-header").getByRole("link", { name: "Vender" })
  ).toBeVisible();

  // 7-8. Presenta la solicitud y consulta que está pendiente.
  await submitApplication(buyer, stamp);

  // 9-11. El administrador consulta, revisa y aprueba.
  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  admin.on("dialog", (dialog) => void dialog.accept());
  await openApplicationAsAdmin(admin, account.email);

  await expect(
    admin.getByText(account.name, { exact: true }).first()
  ).toBeVisible();
  await admin.getByRole("button", { name: "Aprobar solicitud" }).click();

  // 12. La aprobación crea vendedor y primera bodega en una transacción.
  await expect(admin.getByText("Resultado de la aprobación")).toBeVisible();
  await expect(admin.locator(".badge", { hasText: "Aprobada" })).toBeVisible();
  const sellerHref = await admin
    .getByRole("link", { name: "Ver vendedor" })
    .getAttribute("href");
  expect(sellerHref).toMatch(/\/admin\/sellers\//);

  // 13-14. La misma identidad ve el resultado y entra a su espacio de vendedor.
  await buyer.goto("/seller-application");
  await expect(buyer.locator(".badge", { hasText: "Aprobada" })).toBeVisible();
  await buyer.getByRole("link", { name: "Ir a mi espacio de vendedor" }).click();
  await expect(buyer).toHaveURL(/\/seller$/);
  await expect(
    buyer.getByRole("navigation", { name: "Espacio del vendedor" })
  ).toBeVisible();

  // 15. No existe una segunda cuenta ni una segunda incorporación.
  await admin.goto(`/admin/sellers?search=${encodeURIComponent(account.email)}`);
  await expect(admin.locator("tbody tr", { hasText: account.email })).toHaveCount(1);

  await buyerContext.close();
  await adminContext.close();
});

test("el rechazo no crea vendedor ni bodega y conserva al comprador", async ({
  browser
}) => {
  test.setTimeout(240_000);
  const stamp = `${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 6)}`.toUpperCase();

  const buyerContext = await browser.newContext();
  const buyer = await buyerContext.newPage();
  buyer.on("dialog", (dialog) => void dialog.accept());
  const account = await registerBuyer(buyer, stamp);
  await login(buyer, account.email);
  await submitApplication(buyer, stamp);

  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  admin.on("dialog", (dialog) => void dialog.accept());
  await openApplicationAsAdmin(admin, account.email);

  await admin
    .getByLabel("Motivo del rechazo")
    .fill("Información comercial incompleta");
  await admin.getByRole("button", { name: "Rechazar solicitud" }).click();

  await expect(admin.getByText("Resultado del rechazo")).toBeVisible();
  await expect(admin.locator(".badge", { hasText: "Rechazada" })).toBeVisible();
  await expect(
    admin.getByText("Información comercial incompleta")
  ).toBeVisible();

  await admin.goto(`/admin/sellers?search=${encodeURIComponent(account.email)}`);
  await expect(
    admin.getByText("No hay vendedores para este filtro")
  ).toBeVisible();

  await buyer.goto("/seller-application");
  await expect(buyer.locator(".badge", { hasText: "Rechazada" })).toBeVisible();
  await expect(buyer.getByText("Información comercial incompleta")).toBeVisible();
  await expect(
    buyer.getByRole("link", { name: "Ir a mi espacio de vendedor" })
  ).toHaveCount(0);

  // El rechazo no cambia el estado de acceso: el comprador sigue operando.
  await buyer.goto("/orders");
  await expect(buyer).toHaveURL(/\/orders/);

  await buyerContext.close();
  await adminContext.close();
});

test("el administrador cambia el estado de acceso y revoca la sesión vigente", async ({
  browser
}) => {
  test.setTimeout(240_000);
  const stamp = `${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 6)}`.toUpperCase();

  const buyerContext = await browser.newContext();
  const buyer = await buyerContext.newPage();
  const account = await registerBuyer(buyer, stamp);
  await login(buyer, account.email);
  await expect(buyer).toHaveURL(/\/$/);

  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  admin.on("dialog", (dialog) => void dialog.accept());
  await login(admin, ADMIN_EMAIL, "/admin/users");
  await admin.goto(`/admin/users?search=${encodeURIComponent(account.email)}`);
  const row = admin.locator("tbody tr", { hasText: account.email });
  await expect(row).toHaveCount(1);
  await row.getByRole("link", { name: "Ver detalle" }).click();
  await expect(
    admin.getByRole("heading", { name: account.name })
  ).toBeVisible();

  // Desactivar exige motivo y revoca las sesiones vigentes.
  await admin.getByLabel("Acción").selectOption({ label: "Desactivar" });
  await admin.getByLabel("Motivo").fill("Prueba E2E de estado de acceso");
  await admin.getByRole("button", { name: "Cambiar estado" }).click();
  await expect(
    admin.locator(".order-detail-badges .badge", { hasText: "Inactivo" })
  ).toBeVisible();

  // La sesión del comprador ya no sirve para operaciones protegidas.
  await buyer.goto("/orders");
  await expect(buyer).toHaveURL(/\/login\?redirect=/);

  // Reactivar permite iniciar sesión de nuevo.
  await admin.getByLabel("Acción").selectOption({ label: "Activar" });
  await admin.getByRole("button", { name: "Cambiar estado" }).click();
  await expect(
    admin.locator(".order-detail-badges .badge", { hasText: "Activo" })
  ).toBeVisible();

  await login(buyer, account.email);
  await expect(buyer).toHaveURL(/\/$/);
  await buyer.goto("/orders");
  await expect(buyer).toHaveURL(/\/orders/);

  // El administrador no puede cambiar su propio estado desde la interfaz.
  await admin.goto(`/admin/users/${ADMIN_USER_ID}`);
  await expect(
    admin.getByText("No puedes cambiar tu propio estado de acceso.")
  ).toBeVisible();
  await expect(
    admin.getByRole("button", { name: "Cambiar estado" })
  ).toHaveCount(0);

  await buyerContext.close();
  await adminContext.close();
});
