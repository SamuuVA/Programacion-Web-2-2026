import { createHash, randomBytes } from "node:crypto";
import type { SessionTokenGenerator } from "../application/ports.js";

/**
 * Token opaco de 256 bits. El valor en claro solo viaja al cliente una vez; la
 * base de datos guarda su SHA-256 para que una lectura de `sessions` no permita
 * reutilizar la sesión.
 */
export class SecureSessionTokens implements SessionTokenGenerator {
  generate(): { token: string; tokenHash: string } {
    const token = randomBytes(32).toString("base64url");
    return { token, tokenHash: hashSessionToken(token) };
  }
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}
