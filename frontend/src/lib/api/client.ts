import "server-only";

/**
 * Cliente HTTP centralizado. Solo se ejecuta en el servidor: el navegador no
 * recibe la URL interna de la API ni secretos de configuración.
 */

import { ApiError } from "./errors";

export { ApiError };

const DEFAULT_TIMEOUT_MS = 8_000;

export function getApiBaseUrl(): string {
  const raw = process.env.API_URL?.trim() || "http://127.0.0.1:3000";
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("API_URL no es una URL válida.");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("API_URL debe usar http o https.");
  }
  return parsed.origin;
}

export interface ApiRequestOptions {
  readonly method?: "GET" | "POST" | "PATCH" | "DELETE";
  readonly body?: unknown;
  readonly token?: string | null;
  readonly timeoutMs?: number;
}

/**
 * Ejecuta una petición contra la API y devuelve el cuerpo JSON. El token de
 * sesión se reenvía como Bearer para que las cookies del backend no dependan
 * del dominio del navegador.
 */
export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const url = new URL(path, getApiBaseUrl());
  const method = options.method ?? "GET";
  const headers: Record<string, string> = { accept: "application/json" };

  if (options.token) {
    headers.authorization = `Bearer ${options.token}`;
  }
  if (options.body !== undefined) {
    headers["content-type"] = "application/json";
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      ...(options.body !== undefined
        ? { body: JSON.stringify(options.body) }
        : {}),
      cache: "no-store",
      signal: AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS)
    });
  } catch {
    throw new ApiError({
      status: 0,
      code: "RED_NO_DISPONIBLE",
      message:
        "No fue posible conectar con la API de NexusMarket. Verifica que el backend esté en ejecución."
    });
  }

  const correlationId = response.headers.get("x-correlation-id") ?? undefined;

  if (!response.ok) {
    const envelope = await safeJson(response);
    const error =
      isRecord(envelope) && isRecord(envelope.error) ? envelope.error : undefined;
    throw new ApiError({
      status: response.status,
      code: typeof error?.codigo === "string" ? error.codigo : "ERROR_HTTP",
      message:
        typeof error?.mensaje === "string"
          ? error.mensaje
          : "La API respondió con un error inesperado.",
      ...(correlationId !== undefined ? { correlationId } : {}),
      ...(isRecord(error?.detalles) ? { details: error.detalles } : {})
    });
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await safeJson(response);
  if (!isRecord(body)) {
    throw new ApiError({
      status: response.status,
      code: "RESPUESTA_INVALIDA",
      message: "La API devolvió una respuesta que no se pudo interpretar."
    });
  }
  return body as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path);
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
