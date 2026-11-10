import { describe, expect, it } from "vitest";
import { GetSession } from "../../src/modules/identity/application/get-session.js";
import { LoginUser } from "../../src/modules/identity/application/login-user.js";
import { LogoutUser } from "../../src/modules/identity/application/logout-user.js";
import { hashSessionToken } from "../../src/shared/infrastructure/session-tokens.js";
import type { SessionTokenGenerator } from "../../src/shared/application/ports.js";
import { FixedClock, SequentialIds } from "../support/doubles.js";
import { FakeIdentityStore, FakePasswordHasher } from "../support/fakes.js";

const PASSWORD = "NexusMarketDemo2026!";
const USER_ID = "00000000-0000-4000-8000-000000000001";
const BUYER_ID = "00000000-0000-4000-8001-000000000001";

class DeterministicTokens implements SessionTokenGenerator {
  private count = 0;

  generate(): { token: string; tokenHash: string } {
    this.count += 1;
    const token = `token-${this.count}`;
    return { token, tokenHash: hashSessionToken(token) };
  }
}

interface SeedOverrides {
  estado?: "ACTIVO" | "INACTIVO" | "BLOQUEADO";
  rol?: "COMPRADOR" | "VENDEDOR" | "ADMINISTRADOR";
}

function createHarness(overrides: Partial<SeedOverrides> = {}) {
  const store = new FakeIdentityStore([
    {
      usuarioId: USER_ID,
      nombreCompleto: "Compradora Demo",
      correoElectronico: "comprador@nexusmarket.demo",
      credencial: PASSWORD,
      rol: "COMPRADOR",
      estado: "ACTIVO",
      compradorId: BUYER_ID,
      ...overrides
    }
  ]);
  const hasher = new FakePasswordHasher();
  const clock = new FixedClock();
  const ids = new SequentialIds();
  const tokens = new DeterministicTokens();
  const login = new LoginUser(store, hasher, tokens, clock, ids);
  const getSession = new GetSession(store, clock);
  const logout = new LogoutUser(store, clock);
  return { store, login, getSession, logout };
}

describe("ADR-004 autenticación con sesiones opacas", () => {
  it("inicia sesión con credencial válida y devuelve el usuario", async () => {
    const { login, store } = createHarness();

    const result = await login.execute({
      correoElectronico: "  COMPRADOR@NexusMarket.Demo ",
      credencial: PASSWORD,
      correlationId: "corr-login-1"
    });

    expect(result.token).toBe("token-1");
    expect(result.usuario).toMatchObject({
      usuarioId: USER_ID,
      rol: "COMPRADOR",
      compradorId: BUYER_ID
    });
    expect(store.getSessionCount()).toBe(1);
  });

  it("rechaza credencial incorrecta sin revelar si el correo existe", async () => {
    const { login, store } = createHarness();

    await expect(
      login.execute({
        correoElectronico: "comprador@nexusmarket.demo",
        credencial: "credencial-incorrecta",
        correlationId: "corr-login-2"
      })
    ).rejects.toMatchObject({
      code: "NO_AUTENTICADO",
      message: "Correo o contraseña incorrectos."
    });
    await expect(
      login.execute({
        correoElectronico: "desconocido@nexusmarket.demo",
        credencial: PASSWORD,
        correlationId: "corr-login-3"
      })
    ).rejects.toMatchObject({
      code: "NO_AUTENTICADO",
      message: "Correo o contraseña incorrectos."
    });
    expect(store.getSessionCount()).toBe(0);
  });

  it("rechaza cuentas inactivas aunque la credencial sea correcta", async () => {
    const { login } = createHarness({ estado: "INACTIVO" });

    await expect(
      login.execute({
        correoElectronico: "comprador@nexusmarket.demo",
        credencial: PASSWORD,
        correlationId: "corr-login-4"
      })
    ).rejects.toMatchObject({ code: "NO_AUTENTICADO" });
  });

  it("resuelve la sesión y la revoca al cerrar sesión", async () => {
    const { login, getSession, logout } = createHarness();
    const loginResult = await login.execute({
      correoElectronico: "comprador@nexusmarket.demo",
      credencial: PASSWORD,
      correlationId: "corr-login-5"
    });

    await expect(getSession.execute(loginResult.token)).resolves.toMatchObject({
      usuarioId: USER_ID,
      rol: "COMPRADOR"
    });

    await logout.execute(loginResult.token);
    await expect(getSession.execute(loginResult.token)).resolves.toBeNull();
  });

  it("trata una sesión expirada como ausente y la revoca", async () => {
    const { store, getSession } = createHarness();
    const token = "expired-token";
    await store.createSession({
      id: "00000000-0000-4000-8005-000000000099",
      usuarioId: USER_ID,
      tokenHash: hashSessionToken(token),
      creadaEn: "2026-10-27T00:00:00.000Z",
      expiraEn: "2026-10-27T08:00:00.000Z",
      correlationId: "corr-expired"
    });

    await expect(getSession.execute(token)).resolves.toBeNull();
    await expect(
      store.findSessionByTokenHash(hashSessionToken(token))
    ).resolves.toBeNull();
  });

  it("ignora tokens ausentes o vacíos", async () => {
    const { getSession, logout } = createHarness();

    await expect(getSession.execute(undefined)).resolves.toBeNull();
    await expect(getSession.execute("   ")).resolves.toBeNull();
    await expect(logout.execute(undefined)).resolves.toBeUndefined();
  });
});
