import type { SessionTokenGenerator } from "../../../shared/application/ports.js";
import {
  AuthenticationError,
  DependencyUnavailableError
} from "../../../shared/domain/errors.js";
import type {
  Clock,
  IdGenerator,
  PasswordHasher
} from "../../../shared/application/ports.js";
import {
  CorrelationId,
  CorreoElectronico
} from "../../../shared/domain/value-objects.js";
import type { AuthenticatedUser, IdentityStore } from "./ports.js";

export const SESSION_TTL_SECONDS = 8 * 60 * 60;

export interface LoginUserCommand {
  readonly correoElectronico: string;
  readonly credencial: string;
  readonly correlationId: string;
}

export interface LoginUserResult {
  readonly token: string;
  readonly expiraEn: string;
  readonly usuario: AuthenticatedUser;
}

/**
 * ADR-004: autenticación con correo + credencial verificada mediante Argon2id.
 * Un error genérico evita revelar si el correo existe.
 */
export class LoginUser {
  constructor(
    private readonly store: IdentityStore,
    private readonly hasher: PasswordHasher,
    private readonly tokens: SessionTokenGenerator,
    private readonly clock: Clock,
    private readonly ids: IdGenerator
  ) {}

  async execute(command: LoginUserCommand): Promise<LoginUserResult> {
    const correo = CorreoElectronico.create(command.correoElectronico);
    if (
      typeof command.credencial !== "string" ||
      command.credencial.length === 0
    ) {
      throw new AuthenticationError("Correo o contraseña incorrectos.");
    }
    const correlationId = CorrelationId.create(command.correlationId);

    let record;
    try {
      record = await this.store.findCredentialsByEmail(correo.value);
    } catch (error) {
      if (error instanceof DependencyUnavailableError) {
        throw error;
      }
      throw new DependencyUnavailableError(
        "No fue posible consultar la identidad.",
        {
          cause: error instanceof Error ? error.message : "unknown"
        }
      );
    }

    if (record === null || record.estado !== "ACTIVO") {
      throw new AuthenticationError("Correo o contraseña incorrectos.");
    }

    let valid: boolean;
    try {
      valid = await this.hasher.verify(
        record.hashCredencial,
        command.credencial
      );
    } catch {
      throw new DependencyUnavailableError(
        "No fue posible verificar la credencial."
      );
    }
    if (!valid) {
      throw new AuthenticationError("Correo o contraseña incorrectos.");
    }

    const now = this.clock.now();
    const expiresAt = new Date(
      now.toDate().getTime() + SESSION_TTL_SECONDS * 1000
    );
    const generated = this.tokens.generate();

    try {
      await this.store.createSession({
        id: this.ids.sessionId(),
        usuarioId: record.usuarioId,
        tokenHash: generated.tokenHash,
        creadaEn: now.value,
        expiraEn: expiresAt.toISOString(),
        correlationId: correlationId.value
      });
    } catch (error) {
      throw new DependencyUnavailableError(
        "No fue posible iniciar la sesión.",
        {
          cause: error instanceof Error ? error.message : "unknown"
        }
      );
    }

    return {
      token: generated.token,
      expiraEn: expiresAt.toISOString(),
      usuario: {
        usuarioId: record.usuarioId,
        nombreCompleto: record.nombreCompleto,
        correoElectronico: record.correoElectronico,
        rol: record.rol,
        estado: record.estado,
        compradorId: record.compradorId,
        sellerId: record.sellerId
      }
    };
  }
}
