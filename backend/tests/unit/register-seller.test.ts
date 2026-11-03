import { describe, expect, it } from "vitest";
import type { AuthenticatedUser } from "../../src/modules/identity/application/ports.js";
import { Argon2PasswordHasher } from "../../src/modules/identity/infrastructure/argon2-password-hasher.js";
import {
  RegisterSeller,
  type RegisterSellerCommand
} from "../../src/modules/sellers/application/register-seller.js";
import { FixedClock, SequentialIds } from "../support/doubles.js";
import { FakeSellerRegistrationStore } from "../support/fakes.js";

const PASSWORD = "NexusMarketDemo2026!";
const ADMIN_ID = "00000000-0000-4000-8000-0000000000ad";

function admin(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    usuarioId: ADMIN_ID,
    nombreCompleto: "Administradora Nexus",
    correoElectronico: "admin@nexusmarket.demo",
    rol: "ADMINISTRADOR",
    estado: "ACTIVO",
    compradorId: null,
    sellerId: null,
    ...overrides
  };
}

function command(
  overrides: Partial<RegisterSellerCommand> = {}
): RegisterSellerCommand {
  return {
    actor: admin(),
    nombreCompleto: "Vendedor Nuevo",
    correoElectronico: "vendedor@nexusmarket.demo",
    documentoIdentidad: { tipo: "CC", pais: "CO", numero: "900123456" },
    credencial: PASSWORD,
    nombreComercial: "Estudio Nuevo",
    bodega: { nombre: "Bodega Principal", ubicacion: "Bogotá, Colombia" },
    correlationId: "corr-seller-1",
    ...overrides
  };
}

function harness() {
  const store = new FakeSellerRegistrationStore();
  const useCase = new RegisterSeller(
    store,
    new Argon2PasswordHasher(),
    new FixedClock(),
    new SequentialIds()
  );
  return { store, useCase };
}

describe("PI-02 alta administrativa de vendedor", () => {
  it("crea usuario, vendedor y primera bodega en una sola operación", async () => {
    const { store, useCase } = harness();

    const result = await useCase.execute(command());

    expect(result).toMatchObject({
      estadoUsuario: "ACTIVO",
      estadoVendedor: "ACTIVO",
      estadoBodega: "ACTIVA",
      correoNormalizado: "vendedor@nexusmarket.demo"
    });
    expect(store.getUserCount()).toBe(1);
    expect(store.getSellerCount()).toBe(1);
    expect(store.getWarehouseCount()).toBe(1);
  });

  it("exige un administrador activo y rechaza otros roles", async () => {
    for (const actor of [
      admin({ rol: "COMPRADOR", compradorId: "00000000-0000-4000-8001-000000000001" }),
      admin({ rol: "VENDEDOR", sellerId: "00000000-0000-4000-8006-000000000001" }),
      admin({ estado: "INACTIVO" })
    ]) {
      const { store, useCase } = harness();
      await expect(
        useCase.execute(command({ actor }))
      ).rejects.toMatchObject({ code: "NO_AUTORIZADO" });
      expect(store.getUserCount()).toBe(0);
    }
  });

  it("rechaza correo y documento duplicados", async () => {
    const { useCase } = harness();
    await useCase.execute(command());

    await expect(
      useCase.execute(
        command({
          documentoIdentidad: { tipo: "CC", pais: "CO", numero: "OTRO-001" }
        })
      )
    ).rejects.toMatchObject({ code: "CONFLICTO_UNICIDAD" });

    await expect(
      useCase.execute(
        command({
          correoElectronico: "otro@nexusmarket.demo",
          documentoIdentidad: { tipo: "CC", pais: "CO", numero: "900123456" }
        })
      )
    ).rejects.toMatchObject({ code: "CONFLICTO_UNICIDAD" });
  });

  it("valida credencial y datos comerciales antes de persistir", async () => {
    const invalid: Array<Partial<RegisterSellerCommand>> = [
      { credencial: "corta" },
      { nombreComercial: "   " },
      { bodega: { nombre: "", ubicacion: "Bogotá" } },
      { bodega: { nombre: "Bodega", ubicacion: " " } },
      { correoElectronico: "no-es-correo" }
    ];

    for (const overrides of invalid) {
      const { store, useCase } = harness();
      await expect(
        useCase.execute(command(overrides))
      ).rejects.toMatchObject({ code: "VALIDACION_INVALIDA" });
      expect(store.getUserCount()).toBe(0);
    }
  });

  it("no deja usuario ni vendedor si falla la creación de la bodega", async () => {
    const { store, useCase } = harness();
    store.failOnWarehouse = true;

    await expect(useCase.execute(command())).rejects.toMatchObject({
      code: "DEPENDENCIA_NO_DISPONIBLE"
    });

    expect(store.getUserCount()).toBe(0);
    expect(store.getSellerCount()).toBe(0);
    expect(store.getWarehouseCount()).toBe(0);
  });
});
