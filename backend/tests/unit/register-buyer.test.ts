import { describe, expect, it } from "vitest";
import { RegisterBuyer } from "../../src/modules/buyers/application/register-buyer.js";
import type { RegisterBuyerCommand } from "../../src/modules/buyers/application/register-buyer.js";
import { MemoryBuyerRegistrationStore } from "../../src/modules/buyers/infrastructure/memory-buyer-registration-store.js";
import { Argon2PasswordHasher } from "../../src/modules/identity/infrastructure/argon2-password-hasher.js";
import { UniquenessConflictError, ValidationError } from "../../src/shared/domain/errors.js";
import { FixedClock, SequentialIds } from "../support/doubles.js";

const PASSWORD = "correct horse battery staple";

function createSubject() {
  const store = new MemoryBuyerRegistrationStore();
  const useCase = new RegisterBuyer(
    store,
    new Argon2PasswordHasher(),
    new FixedClock(),
    new SequentialIds()
  );
  return { store, useCase };
}

function command(overrides: Partial<RegisterBuyerCommand> = {}): RegisterBuyerCommand {
  return {
    nombreCompleto: "Ana María Pérez",
    correoElectronico: "Ana.Perez@Example.COM",
    documentoIdentidad: {
      tipo: "CC",
      pais: "CO",
      numero: "123456789"
    },
    credencial: PASSWORD,
    correlationId: "corr-pi-01-001",
    ...overrides
  };
}

describe("PI-01 RegisterBuyer", () => {
  it("crea Usuario ACTIVO, PerfilComprador HABILITADO, Carrito vacío, auditoría y outbox", async () => {
    const { store, useCase } = createSubject();

    const result = await useCase.execute(command());

    expect(result).toMatchObject({
      estadoUsuario: "ACTIVO",
      estadoComercial: "HABILITADO",
      correoNormalizado: "ana.perez@example.com"
    });

    const user = store.getUserByEmail("ana.perez@example.com");
    expect(user).toBeDefined();
    expect(user?.rol).toBe("COMPRADOR");
    expect(user?.estado).toBe("ACTIVO");
    expect(user?.credencial.value).not.toBe(PASSWORD);
    await expect(
      new Argon2PasswordHasher().verify(user!.credencial.value, PASSWORD)
    ).resolves.toBe(true);

    const buyer = store.getBuyerByUserId(user!.id);
    expect(buyer?.estadoComercial).toBe("HABILITADO");
    expect(buyer?.direcciones).toHaveLength(0);

    const cart = store.getCartByBuyerId(buyer!.id);
    expect(cart?.items).toHaveLength(0);
    expect(cart?.version).toBe(1);

    const audits = store.getAuditRecords();
    expect(audits).toHaveLength(1);
    expect(audits[0]).toMatchObject({
      evento: "buyer.registered.v1",
      correlationId: "corr-pi-01-001",
      resultado: "EXITO",
      gravedad: "INFORMACION"
    });
    expect(audits[0]?.detalles).not.toHaveProperty("credencial");
    expect(audits[0]?.detalles).not.toHaveProperty("password");

    const events = store.getOutboxEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      tipo: "buyer.registered",
      versionEsquema: 1,
      correlationId: "corr-pi-01-001"
    });
    expect(JSON.stringify(events[0])).not.toContain(PASSWORD);
    expect(JSON.stringify(audits[0])).not.toContain(PASSWORD);
  });

  it("rechaza correo duplicado sin persistir un segundo registro", async () => {
    const { store, useCase } = createSubject();
    await useCase.execute(command());

    await expect(
      useCase.execute(
        command({
          correoElectronico: "ANA.PEREZ@example.com",
          documentoIdentidad: { tipo: "CC", pais: "CO", numero: "999999" }
        })
      )
    ).rejects.toBeInstanceOf(UniquenessConflictError);

    expect(store.getAuditRecords()).toHaveLength(1);
    expect(store.getOutboxEvents()).toHaveLength(1);
  });

  it("rechaza documento duplicado sin persistir un segundo registro", async () => {
    const { store, useCase } = createSubject();
    await useCase.execute(command());

    await expect(
      useCase.execute(
        command({
          correoElectronico: "otra@example.com",
          documentoIdentidad: { tipo: "CC", pais: "CO", numero: "123456789" }
        })
      )
    ).rejects.toBeInstanceOf(UniquenessConflictError);

    expect(store.getAuditRecords()).toHaveLength(1);
    expect(store.getOutboxEvents()).toHaveLength(1);
  });

  it("rechaza credenciales fuera de 12–128 caracteres antes de persistir", async () => {
    const { store, useCase } = createSubject();

    await expect(useCase.execute(command({ credencial: "corta" }))).rejects.toBeInstanceOf(
      ValidationError
    );
    await expect(
      useCase.execute(command({ credencial: "x".repeat(129) }))
    ).rejects.toBeInstanceOf(ValidationError);
    expect(store.getAuditRecords()).toHaveLength(0);
    expect(store.getOutboxEvents()).toHaveLength(0);
  });

  it("no conserva la contraseña en claro en el resultado ni en la entidad", async () => {
    const { store, useCase } = createSubject();
    const result = await useCase.execute(command());
    const user = store.getUserById(result.usuarioId);

    expect(JSON.stringify(result)).not.toContain(PASSWORD);
    expect(JSON.stringify(user)).not.toContain(PASSWORD);
  });
});
