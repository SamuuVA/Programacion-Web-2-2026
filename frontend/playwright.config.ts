import { defineConfig } from "@playwright/test";

/**
 * E2E real del frontend contra backend + PostgreSQL en ejecución.
 *
 * Requisitos:
 * - Backend en `API_URL` (por defecto `http://127.0.0.1:3000`) con seed demo.
 * - Frontend en `E2E_BASE_URL` (por defecto `http://127.0.0.1:3001`).
 *
 * El navegador por defecto es Microsoft Edge del sistema para no depender de
 * una descarga de Chromium. En CI puede usarse `E2E_BROWSER_CHANNEL=chromium`
 * tras `npx playwright install chromium`.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:3001",
    channel: process.env.E2E_BROWSER_CHANNEL ?? "msedge",
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  }
});
