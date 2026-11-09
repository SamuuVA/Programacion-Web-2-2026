import type { EstadoUsuario, RolSistema } from "../domain/usuario.js";

/**
 * Identidad mínima que el backend adjunta a una solicitud autenticada.
 *
 * `compradorId` y `sellerId` se resuelven desde los perfiles; nunca se aceptan
 * desde el cuerpo o la URL. El rol y el estado siempre provienen de PostgreSQL.
 */
export interface AuthenticatedUser {
  readonly usuarioId: string;
  readonly nombreCompleto: string;
  readonly correoElectronico: string;
  readonly rol: RolSistema;
  readonly estado: EstadoUsuario;
  readonly compradorId: string | null;
  readonly sellerId: string | null;
}

export interface CredentialRecord {
  readonly usuarioId: string;
  readonly nombreCompleto: string;
  readonly correoElectronico: string;
  readonly hashCredencial: string;
  readonly rol: RolSistema;
  readonly estado: EstadoUsuario;
  readonly compradorId: string | null;
  readonly sellerId: string | null;
}

export interface SessionRecord {
  readonly id: string;
  readonly usuarioId: string;
  readonly tokenHash: string;
  readonly creadaEn: string;
  readonly expiraEn: string;
  readonly correlationId: string;
}

export interface StoredSession {
  readonly session: SessionRecord;
  readonly user: AuthenticatedUser;
}

/**
 * Puerto de identidad y sesiones. La implementación de ejecución es PostgreSQL;
 * las pruebas usan un doble explícito.
 */
export interface IdentityStore {
  findCredentialsByEmail(email: string): Promise<CredentialRecord | null>;
  createSession(record: SessionRecord): Promise<void>;
  findSessionByTokenHash(tokenHash: string): Promise<StoredSession | null>;
  touchSession(tokenHash: string, at: string): Promise<void>;
  revokeSession(tokenHash: string, at: string): Promise<void>;
  healthCheck(): Promise<void>;
  close(): Promise<void>;
}
