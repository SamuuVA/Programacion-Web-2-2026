import { randomUUID } from "node:crypto";

/**
 * Smoke HTTP del recorrido del vendedor contra una API en ejecución.
 *
 * Uso:
 *   API_URL=http://127.0.0.1:3000 npm run smoke:seller
 *
 * Requiere el seed demo (`npm run db:seed:demo`) y PostgreSQL migrado.
 * No sustituye las pruebas automatizadas: es una verificación de integración
 * real del contrato HTTP y del catálogo público.
 */

const API_URL = (process.env.API_URL ?? "http://127.0.0.1:3000").replace(
  /\/$/,
  ""
);
const PASSWORD = process.env.NEXUS_DEMO_PASSWORD ?? "NexusMarketDemo2026!";

interface ApiResponse<T> {
  readonly status: number;
  readonly body: T;
}

let checks = 0;
let failures = 0;

function assert(condition: unknown, message: string): void {
  checks += 1;
  if (condition) {
    console.log(`  ok  ${message}`);
    return;
  }
  failures += 1;
  console.error(`  FAIL ${message}`);
}

async function request<T>(
  path: string,
  options: {
    readonly method?: string;
    readonly token?: string;
    readonly body?: unknown;
    readonly cookie?: string;
  } = {}
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    accept: "application/json"
  };
  if (options.body !== undefined) {
    headers["content-type"] = "application/json";
  }
  if (options.token) {
    headers.authorization = `Bearer ${options.token}`;
  }
  if (options.cookie) {
    headers.cookie = options.cookie;
  }
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    ...(options.body === undefined
      ? {}
      : { body: JSON.stringify(options.body) })
  });
  const text = await response.text();
  const body = (text.length === 0 ? null : JSON.parse(text)) as T;
  return { status: response.status, body };
}

async function login(correoElectronico: string): Promise<string> {
  const response = await request<{ data: { token: string } }>(
    "/api/v1/auth/login",
    {
      method: "POST",
      body: { correoElectronico, credencial: PASSWORD }
    }
  );
  if (response.status !== 200) {
    throw new Error(
      `Login falló para ${correoElectronico}: ${response.status} ${JSON.stringify(response.body)}`
    );
  }
  return response.body.data.token;
}

async function main(): Promise<void> {
  console.log(`Smoke del vendedor contra ${API_URL}`);

  const sellerToken = await login("aurora@nexusmarket.demo");
  const otherSellerToken = await login("nido@nexusmarket.demo");
  const buyerToken = await login("comprador@nexusmarket.demo");

  const session = await request<{
    data: { usuario: { rol: string; sellerId: string | null } };
  }>("/api/v1/auth/session", { token: sellerToken });
  assert(session.status === 200, "sesión de vendedor disponible");
  assert(
    session.body.data.usuario.rol === "VENDEDOR",
    "la sesión declara rol VENDEDOR"
  );
  assert(
    typeof session.body.data.usuario.sellerId === "string",
    "la sesión expone el sellerId propio"
  );

  const profile = await request<{
    data: { id: string; nombreComercial: string; estado: string };
  }>("/api/v1/seller/profile", { token: sellerToken });
  assert(profile.status === 200, "GET /seller/profile responde 200");
  assert(profile.body.data.estado === "ACTIVO", "el perfil demo está ACTIVO");

  const updatedProfile = await request<{ data: { nombreComercial: string } }>(
    "/api/v1/seller/profile",
    {
      method: "PATCH",
      token: sellerToken,
      body: { nombreComercial: profile.body.data.nombreComercial }
    }
  );
  assert(
    updatedProfile.status === 200,
    "PATCH /seller/profile conserva el nombre comercial"
  );

  const forbidden = await request<{ error: { code: string } }>(
    "/api/v1/seller/products",
    {
      token: buyerToken
    }
  );
  assert(
    forbidden.status === 403,
    "un comprador recibe 403 en /seller/products"
  );

  const warehouses = await request<{
    data: Array<{ id: string; estado: string }>;
  }>("/api/v1/seller/warehouses", { token: sellerToken });
  assert(warehouses.status === 200, "GET /seller/warehouses responde 200");
  const activeWarehouse = warehouses.body.data.find(
    (warehouse) => warehouse.estado === "ACTIVA"
  );
  assert(
    activeWarehouse !== undefined,
    "el vendedor demo tiene una bodega activa"
  );

  const sku = `SMOKE-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
  const created = await request<{
    data: { id: string; estado: string; vendedorId: string; sku: string };
  }>("/api/v1/seller/products", {
    method: "POST",
    token: sellerToken,
    body: {
      nombre: `Producto smoke ${sku}`,
      descripcion: "Producto temporal de verificación HTTP.",
      categoria: "HOGAR",
      tipoEntrega: "FISICA",
      sku,
      precioCentavos: 19900,
      moneda: "COP"
    }
  });
  assert(created.status === 201, "POST /seller/products responde 201");
  assert(
    created.body.data.estado === "BORRADOR",
    "el producto nace en BORRADOR"
  );
  assert(
    created.body.data.vendedorId === profile.body.data.id,
    "el propietario se deriva de la sesión"
  );
  const productId = created.body.data.id;

  const publishWithoutImage = await request<{
    error: { details?: { motivo?: string } };
  }>(`/api/v1/seller/products/${productId}/publish`, {
    method: "POST",
    token: sellerToken
  });
  assert(publishWithoutImage.status === 422, "no se publica sin imagen (422)");

  const image = await request<{ data: { imagenes: Array<{ id: string }> } }>(
    `/api/v1/seller/products/${productId}/images`,
    {
      method: "POST",
      token: sellerToken,
      body: { url: "/products/lampara-nido.svg", alt: "Imagen smoke" }
    }
  );
  assert(image.status === 201, "POST de imagen responde 201");
  assert(
    image.body.data.imagenes.length === 1,
    "el producto conserva una imagen"
  );

  const published = await request<{ data: { estado: string } }>(
    `/api/v1/seller/products/${productId}/publish`,
    { method: "POST", token: sellerToken }
  );
  assert(published.status === 200, "publicar responde 200");
  assert(
    published.body.data.estado === "PUBLICADO",
    "el producto queda PUBLICADO"
  );

  const publicDetail = await request<{ data: { id: string; estado: string } }>(
    `/api/v1/products/${productId}`
  );
  assert(
    publicDetail.status === 200,
    "el catálogo público muestra el producto publicado"
  );

  const crossSeller = await request<{ error: { code: string } }>(
    `/api/v1/seller/products/${productId}`,
    { token: otherSellerToken }
  );
  assert(
    crossSeller.status === 404,
    "otro vendedor recibe 404 (no filtra existencia)"
  );

  const crossSellerIngress = await request<{ error: { code: string } }>(
    "/api/v1/seller/inventory/ingresos",
    {
      method: "POST",
      token: otherSellerToken,
      body: {
        productoId: productId,
        bodegaId: activeWarehouse?.id,
        cantidad: 1,
        idempotencyKey: `smoke-cross-${randomUUID()}`
      }
    }
  );
  assert(
    crossSellerIngress.status === 404,
    "otro vendedor no puede ingresar stock a un producto ajeno"
  );

  const ingressKey = `smoke-ing-${randomUUID()}`;
  const ingressBody = {
    productoId: productId,
    bodegaId: activeWarehouse?.id,
    cantidad: 4,
    idempotencyKey: ingressKey,
    motivo: "Smoke HTTP"
  };
  const ingress = await request<{
    data: { duplicado: boolean; posicion: { disponible: number } };
  }>("/api/v1/seller/inventory/ingresos", {
    method: "POST",
    token: sellerToken,
    body: ingressBody
  });
  assert(ingress.status === 201, "el ingreso responde 201");
  assert(
    ingress.body.data.posicion.disponible === 4,
    "el ingreso suma 4 unidades"
  );

  const repeated = await request<{
    data: { duplicado: boolean; posicion: { disponible: number } };
  }>("/api/v1/seller/inventory/ingresos", {
    method: "POST",
    token: sellerToken,
    body: ingressBody
  });
  assert(repeated.status === 200, "el ingreso repetido responde 200");
  assert(
    repeated.body.data.duplicado === true,
    "el ingreso repetido es idempotente"
  );
  assert(
    repeated.body.data.posicion.disponible === 4,
    "el ingreso repetido no vuelve a sumar stock"
  );

  const inventory = await request<{
    data: Array<{ productoId: string; disponible: number }>;
  }>("/api/v1/seller/inventory", { token: sellerToken });
  assert(
    inventory.body.data.some(
      (position) =>
        position.productoId === productId && position.disponible === 4
    ),
    "el inventario refleja la posición del producto"
  );

  const suspended = await request<{ data: { estado: string } }>(
    `/api/v1/seller/products/${productId}/suspend`,
    { method: "POST", token: sellerToken }
  );
  assert(
    suspended.body.data.estado === "SUSPENDIDO",
    "suspender deja el producto SUSPENDIDO"
  );

  const hidden = await request<{ error: { code: string } }>(
    `/api/v1/products/${productId}`
  );
  assert(hidden.status === 404, "el catálogo oculta un producto suspendido");

  const resumed = await request<{ data: { estado: string } }>(
    `/api/v1/seller/products/${productId}/publish`,
    { method: "POST", token: sellerToken }
  );
  assert(
    resumed.body.data.estado === "PUBLICADO",
    "reanudar republica con revalidación"
  );

  const discontinued = await request<{ data: { estado: string } }>(
    `/api/v1/seller/products/${productId}/discontinue`,
    { method: "POST", token: sellerToken }
  );
  assert(
    discontinued.body.data.estado === "DESCONTINUADO",
    "descontinuar deja el producto DESCONTINUADO"
  );

  const cannotRepublish = await request<{ error: { code: string } }>(
    `/api/v1/seller/products/${productId}/publish`,
    { method: "POST", token: sellerToken }
  );
  assert(
    cannotRepublish.status === 422,
    "un producto descontinuado no se republica"
  );

  const sellerOrders = await request<{ data: Array<{ id: string }> }>(
    "/api/v1/seller/orders",
    { token: sellerToken }
  );
  assert(sellerOrders.status === 200, "GET /seller/orders responde 200");

  const paymentAttempt = await request<{ error: { code: string } }>(
    "/api/v1/seller/orders/00000000-0000-4000-8000-000000000000/refund",
    { method: "POST", token: sellerToken }
  );
  assert(
    paymentAttempt.status === 404 || paymentAttempt.status === 405,
    "no existe una operación de pago/reembolso para el vendedor"
  );

  console.log(`\n${checks - failures}/${checks} comprobaciones correctas.`);
  if (failures > 0) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
