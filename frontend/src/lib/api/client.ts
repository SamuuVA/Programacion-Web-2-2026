import "server-only";

/**
 * Cliente HTTP centralizado. Solo se ejecuta en el servidor: el navegador no
 * recibe la URL interna de la API ni secretos de configuración.
 */

const DEFAULT_TIMEOUT_MS = 8_000;

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly correlationId: string | undefined;
  readonly details: Record<string, unknown> | undefined;

  constructor(input: {
    message: string;
    status: number;
    code: string;
    correlationId?: string;
    details?: Record<string, unknown>;
  }) {
    super(input.message);
    this.name = "ApiError";
    this.status = input.status;
    this.code = input.code;
    this.correlationId = input.correlationId;
    this.details = input.details;
  }
}

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

export async function apiGet<T>(path: string): Promise<T> {
  const url = new URL(path, getApiBaseUrl());

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS)
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
    const error = isRecord(envelope) && isRecord(envelope.error) ? envelope.error : undefined;
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
