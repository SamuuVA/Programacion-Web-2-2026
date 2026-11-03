import type { Clock } from "../../../shared/application/ports.js";
import { DependencyUnavailableError } from "../../../shared/domain/errors.js";
import { hashSessionToken } from "../../../shared/infrastructure/session-tokens.js";
import type { AuthenticatedUser, IdentityStore } from "./ports.js";

/**
 * Resuelve la sesión de cada solicitud. Una sesión expirada o revocada se
 * revoca de inmediato y se trata como ausente; nunca se degrada a un rol
 * anterior ni se acepta el usuario enviado por el cliente.
 */
export class GetSession {
  constructor(
    private readonly store: IdentityStore,
    private readonly clock: Clock
  ) {}

  async execute(token: string | undefined): Promise<AuthenticatedUser | null> {
    if (typeof token !== "string" || token.trim().length === 0) {
      return null;
    }

    const tokenHash = hashSessionToken(token);
    let stored;
    try {
      stored = await this.store.findSessionByTokenHash(tokenHash);
    } catch (error) {
      throw new DependencyUnavailableError("No fue posible consultar la sesión.", {
        cause: error instanceof Error ? error.message : "unknown"
      });
    }
    if (stored === null) {
      return null;
    }

    const now = this.clock.now();
    const expired = stored.session.expiraEn <= now.value;
    if (expired || stored.user.estado !== "ACTIVO") {
      try {
        await this.store.revokeSession(tokenHash, now.value);
      } catch {
        // La sesión ya es inválida; el fallo de limpieza no la resucita.
      }
      return null;
    }

    try {
      await this.store.touchSession(tokenHash, now.value);
    } catch {
      // La actividad es informativa; no bloquea una sesión vigente.
    }
    return stored.user;
  }
}
