import { describe, expect, it } from "vitest";
import { Argon2PasswordHasher } from "../../src/modules/identity/infrastructure/argon2-password-hasher.js";

describe("Argon2PasswordHasher", () => {
  it("produce un PHC Argon2id con los parámetros de DEC-W1-008 y verifica", async () => {
    const hasher = new Argon2PasswordHasher();
    const hash = await hasher.hash("correct horse battery staple");

    expect(hash).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
    await expect(hasher.verify(hash, "correct horse battery staple")).resolves.toBe(true);
    await expect(hasher.verify(hash, "otra contraseña distinta")).resolves.toBe(false);
  });
});
