import { describe, expect, it } from "vitest";
import { UpdateUserAccessStatus } from "../../src/modules/identity/application/update-user-access-status.js";
import type { AuthenticatedUser } from "../../src/modules/identity/application/ports.js";
import {
  AuthorizationError,
  BusinessRuleError,
  ValidationError
} from "../../src/shared/domain/errors.js";
import { FakeUserAccessStore } from "../support/fake-user-access-store.js";
import { FixedClock, SequentialIds } from "../support/doubles.js";

const NOW = "2026-11-08T12:00:00.000Z";
const ADMIN_USER = "90000000-0000-4000-8000-0000000000ad";
const TARGET_USER = "90000000-0000-4000-8000-0000000000b1";

const admin: AuthenticatedUser = {
  usuarioId: ADMIN_USER,
  nombreCompleto: "Administradora Demo",
  correoElectronico: "admin@nexusmarket.demo",
  rol: "ADMINISTRADOR",
  estado: "ACTIVO",
  compradorId: null,
  sellerId: null
};

function createSubject(estado: "ACTIVO" | "INACTIVO" | "BLOQUEADO" = "ACTIVO") {
  const store = new FakeUserAccessStore();
  store.seedUser({
    usuarioId: TARGET_USER,
    rol: "COMPRADOR",
    estado,
    actualizadoEn: NOW
  });
  const useCase = new UpdateUserAccessStatus(
    store,
    new FixedClock(NOW),
    new SequentialIds()
  );
  return { store, useCase };
}

describe("PI-04 UpdateUserAccessStatus", () => {
  it("desactiva una cuenta activa y revoca sus sesiones", async () => {
    const { store, useCase } = createSubject("ACTIVO");
    store.sesionesVigentes = 2;

    const result = await useCase.execute({
      actor: admin,
      usuarioId: TARGET_USER,
      accion: "DESACTIVAR",
      motivo: "Solicitud del titular",
      correlationId: "corr-ua-001"
    });

    expect(result).toMatchObject({
      estadoAnterior: "ACTIVO",
      estadoNuevo: "INACTIVO",
      sesionesRevocadas: 2
    });
    expect(store.getUser(TARGET_USER)?.estado).toBe("INACTIVO");
    expect(store.transitions).toHaveLength(1);
  });

  it("reactiva una cuenta inactiva", async () => {
    const { store, useCase } = createSubject("INACTIVO");

    const result = await useCase.execute({
      actor: admin,
      usuarioId: TARGET_USER,
      accion: "ACTIVAR",
      correlationId: "corr-ua-002"
    });

    expect(result.estadoNuevo).toBe("ACTIVO");
    expect(result.sesionesRevocadas).toBe(0);
    expect(store.getUser(TARGET_USER)?.estado).toBe("ACTIVO");
  });

  it("bloquea una cuenta activa e inactiva, y desbloquea solo desde BLOQUEADO", async () => {
    const active = createSubject("ACTIVO");
    await active.useCase.execute({
      actor: admin,
      usuarioId: TARGET_USER,
      accion: "BLOQUEAR",
      motivo: "Incumplimiento",
      correlationId: "corr-ua-003"
    });
    expect(active.store.getUser(TARGET_USER)?.estado).toBe("BLOQUEADO");

    const inactive = createSubject("INACTIVO");
    await inactive.useCase.execute({
      actor: admin,
      usuarioId: TARGET_USER,
      accion: "BLOQUEAR",
      motivo: "Riesgo",
      correlationId: "corr-ua-004"
    });
    expect(inactive.store.getUser(TARGET_USER)?.estado).toBe("BLOQUEADO");

    const blocked = createSubject("BLOQUEADO");
    await blocked.useCase.execute({
      actor: admin,
      usuarioId: TARGET_USER,
      accion: "DESBLOQUEAR",
      motivo: "Resuelto",
      correlationId: "corr-ua-005"
    });
    expect(blocked.store.getUser(TARGET_USER)?.estado).toBe("ACTIVO");
  });

  it("no permite BLOQUEADO→INACTIVO ni transiciones repetidas", async () => {
    const { useCase } = createSubject("BLOQUEADO");

    await expect(
      useCase.execute({
        actor: admin,
        usuarioId: TARGET_USER,
        accion: "DESACTIVAR",
        motivo: "No aplica",
        correlationId: "corr-ua-006"
      })
    ).rejects.toBeInstanceOf(BusinessRuleError);

    const active = createSubject("ACTIVO");
    await expect(
      active.useCase.execute({
        actor: admin,
        usuarioId: TARGET_USER,
        accion: "ACTIVAR",
        correlationId: "corr-ua-007"
      })
    ).rejects.toBeInstanceOf(BusinessRuleError);
  });

  it("exige motivo para desactivar o bloquear", async () => {
    const { useCase } = createSubject("ACTIVO");

    await expect(
      useCase.execute({
        actor: admin,
        usuarioId: TARGET_USER,
        accion: "DESACTIVAR",
        correlationId: "corr-ua-008"
      })
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      useCase.execute({
        actor: admin,
        usuarioId: TARGET_USER,
        accion: "BLOQUEAR",
        motivo: "   ",
        correlationId: "corr-ua-009"
      })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("no permite que el administrador cambie su propio estado", async () => {
    const { store, useCase } = createSubject("ACTIVO");
    store.seedUser({
      usuarioId: ADMIN_USER,
      rol: "ADMINISTRADOR",
      estado: "ACTIVO",
      actualizadoEn: NOW
    });

    await expect(
      useCase.execute({
        actor: admin,
        usuarioId: ADMIN_USER,
        accion: "DESACTIVAR",
        motivo: "Auto",
        correlationId: "corr-ua-010"
      })
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("rechaza a un actor que no es administrador", async () => {
    const { useCase } = createSubject("ACTIVO");
    const supervisor: AuthenticatedUser = {
      ...admin,
      rol: "SUPERVISOR"
    };

    await expect(
      useCase.execute({
        actor: supervisor,
        usuarioId: TARGET_USER,
        accion: "DESACTIVAR",
        motivo: "No autorizado",
        correlationId: "corr-ua-011"
      })
    ).rejects.toBeInstanceOf(AuthorizationError);
  });
});
