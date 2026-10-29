import "dotenv/config";
import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().min(1).default("127.0.0.1"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  PERSISTENCE: z.enum(["memory", "postgres"]).default("memory"),
  DATABASE_URL: z.string().min(1).optional(),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  CORS_ORIGINS: z.string().default("")
});

export interface AppConfig extends Omit<
  z.infer<typeof environmentSchema>,
  "CORS_ORIGINS"
> {
  /** Orígenes exactos permitidos para navegador. Vacío desactiva CORS. */
  readonly CORS_ORIGINS: readonly string[];
}

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = environmentSchema.safeParse(environment);
  if (!parsed.success) {
    const messages = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Configuración inválida: ${messages}`);
  }

  const config = parsed.data;
  if (config.PERSISTENCE === "postgres" && !config.DATABASE_URL) {
    throw new Error("DATABASE_URL es obligatoria cuando PERSISTENCE=postgres.");
  }

  return {
    ...config,
    CORS_ORIGINS: parseCorsOrigins(config.CORS_ORIGINS)
  };
}

/**
 * Acepta una lista separada por comas de orígenes exactos, sin rutas ni
 * comodines. Un valor vacío desactiva CORS.
 */
export function parseCorsOrigins(value: string): string[] {
  const entries = value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  const origins: string[] = [];
  for (const entry of entries) {
    let parsed: URL;
    try {
      parsed = new URL(entry);
    } catch {
      throw new Error(`Configuración inválida: CORS_ORIGINS contiene un origen inválido (${entry}).`);
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error(
        `Configuración inválida: CORS_ORIGINS solo admite orígenes http/https (${entry}).`
      );
    }
    if (
      parsed.username.length > 0 ||
      parsed.password.length > 0 ||
      parsed.pathname !== "/" ||
      parsed.search.length > 0 ||
      parsed.hash.length > 0
    ) {
      throw new Error(
        `Configuración inválida: CORS_ORIGINS debe contener orígenes sin ruta, credenciales ni query (${entry}).`
      );
    }

    const origin = parsed.origin;
    if (!origins.includes(origin)) {
      origins.push(origin);
    }
  }

  return origins;
}
