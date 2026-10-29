import { randomBytes } from "node:crypto";
import { Algorithm, hash, verify, Version } from "@node-rs/argon2";
import type { PasswordHasher } from "../../../shared/application/ports.js";

const POLICY = {
  algorithm: Algorithm.Argon2id,
  version: Version.V0x13,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32
} as const;

/**
 * ADOUT-13 / PO-22.
 * Los parámetros provienen de DEC-W1-008; la biblioteca concreta es una
 * decisión reversible documentada en la implementación.
 */
export class Argon2PasswordHasher implements PasswordHasher {
  async hash(plainPassword: string): Promise<string> {
    return hash(plainPassword, {
      ...POLICY,
      salt: randomBytes(16)
    });
  }

  async verify(hashed: string, plainPassword: string): Promise<boolean> {
    return verify(hashed, plainPassword);
  }
}
