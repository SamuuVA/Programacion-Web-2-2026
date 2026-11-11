import { expect, type APIRequestContext } from "@playwright/test";

const API_URL = process.env.API_URL ?? "http://127.0.0.1:3000";
const SELLER_EMAIL = "aurora@nexusmarket.demo";
const PASSWORD = process.env.NEXUS_DEMO_PASSWORD ?? "NexusMarketDemo2026!";

export const DEMO_PRODUCT_ID = "40000000-0000-4000-8000-000000000001";
export const DEMO_PRODUCT_NAME = "Audífonos Aurora";
export const DEMO_WAREHOUSE_ID = "30000000-0000-4000-8000-000000000001";

/**
 * Garantiza stock real del producto demo usando el mismo endpoint de ingreso de
 * inventario que usa el vendedor. Evita que las suites E2E dependan del estado
 * acumulado de ejecuciones anteriores: en una base recién sembrada sobra, y en
 * una base usada repone lo consumido por compras previas. No usa mocks ni
 * escribe stock directamente en PostgreSQL.
 */
export async function ensureDemoProductStock(
  request: APIRequestContext,
  cantidad = 50
): Promise<void> {
  const login = await request.post(`${API_URL}/api/v1/auth/login`, {
    data: { correoElectronico: SELLER_EMAIL, credencial: PASSWORD }
  });
  expect(login.status()).toBe(200);

  const ingress = await request.post(`${API_URL}/api/v1/seller/inventory/ingresos`, {
    data: {
      productoId: DEMO_PRODUCT_ID,
      bodegaId: DEMO_WAREHOUSE_ID,
      cantidad,
      idempotencyKey: `e2e-stock-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`
    }
  });

  expect([200, 201]).toContain(ingress.status());
}
