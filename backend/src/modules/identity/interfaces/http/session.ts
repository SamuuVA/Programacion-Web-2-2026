import type { FastifyReply, FastifyRequest } from "fastify";
import {
  AuthenticationError,
  AuthorizationError
} from "../../../../shared/domain/errors.js";
import type { RolSistema } from "../../domain/usuario.js";
import type { AuthenticatedUser } from "../../application/ports.js";
import type { GetSession } from "../../application/get-session.js";

export const SESSION_COOKIE = "nexus_session";

/**
 * Extrae el token de la cookie HttpOnly o de `Authorization: Bearer`.
 * La segunda forma facilita pruebas y clientes de API; el frontend usa cookie.
 */
export function extractSessionToken(request: FastifyRequest): string | undefined {
  const authorization = request.headers.authorization;
  if (typeof authorization === "string" && authorization.startsWith("Bearer ")) {
    const token = authorization.slice("Bearer ".length).trim();
    if (token.length > 0) {
      return token;
    }
  }
  return readCookie(request.headers.cookie, SESSION_COOKIE);
}

export function readCookie(
  header: string | undefined,
  name: string
): string | undefined {
  if (typeof header !== "string" || header.length === 0) {
    return undefined;
  }
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) {
      continue;
    }
    const key = part.slice(0, separator).trim();
    if (key !== name) {
      continue;
    }
    const raw = part.slice(separator + 1).trim();
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  return undefined;
}

export function setSessionCookie(
  reply: FastifyReply,
  token: string,
  maxAgeSeconds: number,
  secure: boolean
): void {
  const attributes = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`
  ];
  if (secure) {
    attributes.push("Secure");
  }
  reply.header("set-cookie", attributes.join("; "));
}

export function clearSessionCookie(reply: FastifyReply, secure: boolean): void {
  const attributes = [
    `${SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0"
  ];
  if (secure) {
    attributes.push("Secure");
  }
  reply.header("set-cookie", attributes.join("; "));
}

/**
 * Guardas de autorización reutilizables. Siempre se ejecutan en el backend; el
 * frontend solo oculta navegación y no es una frontera de seguridad.
 */
export class SessionAuthenticator {
  constructor(private readonly getSession: GetSession) {}

  async authenticate(request: FastifyRequest): Promise<AuthenticatedUser | null> {
    return this.getSession.execute(extractSessionToken(request));
  }

  async requireUser(request: FastifyRequest): Promise<AuthenticatedUser> {
    const user = await this.authenticate(request);
    if (user === null) {
      throw new AuthenticationError();
    }
    return user;
  }

  requireRole(user: AuthenticatedUser, roles: readonly RolSistema[]): void {
    if (!roles.includes(user.rol)) {
      throw new AuthorizationError("Tu rol no permite realizar esta operación.");
    }
  }

  requireAdmin(user: AuthenticatedUser): void {
    this.requireRole(user, ["ADMINISTRADOR"]);
  }

  requireBuyer(user: AuthenticatedUser): string {
    this.requireRole(user, ["COMPRADOR"]);
    if (user.compradorId === null) {
      throw new AuthorizationError("La cuenta no tiene un perfil de comprador activo.");
    }
    return user.compradorId;
  }

  requireSeller(user: AuthenticatedUser): string {
    this.requireRole(user, ["VENDEDOR"]);
    if (user.sellerId === null) {
      throw new AuthorizationError("La cuenta no tiene un perfil de vendedor activo.");
    }
    return user.sellerId;
  }

  requireLogistics(user: AuthenticatedUser): string {
    this.requireRole(user, ["OPERADOR_LOGISTICO"]);
    return user.usuarioId;
  }

  /**
   * `SUP-01`: el Supervisor solo consulta. No se concede equivalencia con el
   * Administrador ni con ningún otro rol.
   */
  requireSupervisor(user: AuthenticatedUser): string {
    this.requireRole(user, ["SUPERVISOR"]);
    if (user.estado !== "ACTIVO") {
      throw new AuthorizationError("La cuenta del supervisor no está activa.");
    }
    return user.usuarioId;
  }
}
