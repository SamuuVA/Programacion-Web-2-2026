import type { Clock } from "../../../shared/application/ports.js";
import { hashSessionToken } from "../../../shared/infrastructure/session-tokens.js";
import type { IdentityStore } from "./ports.js";

/** Cierre de sesión idempotente: revocar un token ausente no es un error. */
export class LogoutUser {
  constructor(
    private readonly store: IdentityStore,
    private readonly clock: Clock
  ) {}

  async execute(token: string | undefined): Promise<void> {
    if (typeof token !== "string" || token.trim().length === 0) {
      return;
    }
    await this.store.revokeSession(hashSessionToken(token), this.clock.now().value);
  }
}
