import { describe, expect, it } from "vitest";
import {
  ApproveSellerApplication,
  GetOwnSellerApplication,
  RejectSellerApplication,
  SubmitSellerApplication
} from "../../src/modules/seller-applications/application/use-cases.js";
import type { AuthenticatedUser } from "../../src/modules/identity/application/ports.js";
import {
  AuthorizationError,
  BusinessRuleError,
  ValidationError
} from "../../src/shared/domain/errors.js";
import { FakeSellerApplicationStore } from "../support/fake-seller-application-store.js";
import { FixedClock, SequentialIds } from "../support/doubles.js";

const NOW = "2026-11-08T12:00:00.000Z";
const BUYER_USER = "90000000-0000-4000-8000-0000000000b1";
const BUYER_ID = "71000000-0000-4000-8000-000000000001";
const ADMIN_USER = "90000000-0000-4000-8000-0000000000ad";
const OTHER_BUYER_USER = "90000000-0000-4000-8000-0000000000b2";

const buyer: AuthenticatedUser = {
  usuarioId: BUYER_USER,
  nombreCompleto: "Compradora Demo",
  correoElectronico: "compradora@nexusmarket.demo",
  rol: "COMPRADOR",
  estado: "ACTIVO",
  compradorId: BUYER_ID,
  sellerId: null
};

const admin: AuthenticatedUser = {
  usuarioId: ADMIN_USER,
  nombreCompleto: "Administradora Demo",
  correoElectronico: "admin@nexusmarket.demo",
  rol: "ADMINISTRADOR",
  estado: "ACTIVO",
  compradorId: null,
  sellerId: null
};

function createSubject() {
  const store = new FakeSellerApplicationStore();
  store.seedUser({
    usuarioId: BUYER_USER,
    nombreCompleto: buyer.nombreCompleto,
    correoElectronico: buyer.correoElectronico,
    rol: "COMPRADOR",
    estado: "ACTIVO"
  });
  store.seedUser({
    usuarioId: OTHER_BUYER_USER,
    nombreCompleto: "Otro Comprador",
    correoElectronico: "otro@nexusmarket.demo",
    rol: "COMPRADOR",
    estado: "ACTIVO"
  });
  store.seedUser({
    usuarioId: ADMIN_USER,
    nombreCompleto: admin.nombreCompleto,
    correoElectronico: admin.correoElectronico,
    rol: "ADMINISTRADOR",
    estado: "ACTIVO"
  });
  const clock = new FixedClock(NOW);
  const ids = new SequentialIds();
  return {
    store,
    clock,
    ids,
    submit: new SubmitSellerApplication(store, clock, ids),
    getOwn: new GetOwnSellerApplication(store),
    approve: new ApproveSellerApplication(store, clock, ids),
    reject: new RejectSellerApplication(store, clock, ids)
  };
}

const command = {
  actor: buyer,
  nombreComercial: "Estudio Nueva",
  nombreBodega: "Bodega Principal",
  ubicacionBodega: "Bogotá, Colombia",
  correlationId: "corr-sa-001"
};

describe("Solicitudes de vendedor", () => {
  it("registra una solicitud PENDIENTE sin cambiar el rol ni el estado del comprador", async () => {
    const { store, submit } = createSubject();

    const result = await submit.execute(command);

    expect(result).toMatchObject({
      usuarioId: BUYER_USER,
      estado: "PENDIENTE",
      nombreComercial: "Estudio Nueva",
      usuarioRol: "COMPRADOR",
      usuarioEstado: "ACTIVO",
      sellerId: null,
      warehouseId: null
    });
    expect(store.countByEstado("PENDIENTE")).toBe(1);
    expect(store.audits[0]?.evento).toBe("seller-application.submitted.v1");
    expect(store.events).toContain("seller.application.submitted");
  });

  it("rechaza una segunda solicitud pendiente del mismo usuario", async () => {
    const { submit } = createSubject();
    await submit.execute(command);

    await expect(submit.execute(command)).rejects.toBeInstanceOf(
      BusinessRuleError
    );
  });

  it("rechaza la solicitud de un actor que no es comprador", async () => {
    const { submit } = createSubject();
    const sellerActor: AuthenticatedUser = {
      ...buyer,
      rol: "VENDEDOR",
      compradorId: null,
      sellerId: "20000000-0000-4000-8000-000000000001"
    };

    await expect(
      submit.execute({ ...command, actor: sellerActor })
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("valida los datos comerciales antes de persistir", async () => {
    const { store, submit } = createSubject();

    await expect(
      submit.execute({ ...command, nombreComercial: "   " })
    ).rejects.toBeInstanceOf(ValidationError);
    expect(store.countByEstado("PENDIENTE")).toBe(0);
  });

  it("aprueba creando vendedor y primera bodega sin duplicar en un reintento", async () => {
    const { store, submit, approve } = createSubject();
    const application = await submit.execute(command);

    const first = await approve.execute({
      actor: admin,
      applicationId: application.id,
      correlationId: "corr-sa-approve"
    });

    expect(first.yaAprobada).toBe(false);
    expect(first.solicitud.estado).toBe("APROBADA");
    expect(first.solicitud.usuarioRol).toBe("VENDEDOR");
    expect(first.sellerId).toBeTruthy();
    expect(first.warehouseId).toBeTruthy();
    expect(store.countByEstado("APROBADA")).toBe(1);

    const second = await approve.execute({
      actor: admin,
      applicationId: application.id,
      correlationId: "corr-sa-approve-retry"
    });
    expect(second.yaAprobada).toBe(true);
    expect(second.sellerId).toBe(first.sellerId);
    expect(second.warehouseId).toBe(first.warehouseId);
    expect(store.countByEstado("APROBADA")).toBe(1);
  });

  it("rechaza sin crear vendedor ni bodega y conserva el estado del comprador", async () => {
    const { store, submit, reject } = createSubject();
    const application = await submit.execute(command);

    const rejected = await reject.execute({
      actor: admin,
      applicationId: application.id,
      motivo: "Información comercial incompleta",
      correlationId: "corr-sa-reject"
    });

    expect(rejected.estado).toBe("RECHAZADA");
    expect(rejected.sellerId).toBeNull();
    expect(rejected.warehouseId).toBeNull();
    expect(rejected.usuarioRol).toBe("COMPRADOR");
    expect(store.countByEstado("APROBADA")).toBe(0);
    expect(store.events).toContain("seller.application.rejected");
  });

  it("no permite aprobar ni rechazar la propia solicitud del administrador", async () => {
    const { store, submit, approve, reject } = createSubject();
    const application = await submit.execute(command);
    const selfAdmin: AuthenticatedUser = { ...admin, usuarioId: BUYER_USER };

    await expect(
      approve.execute({
        actor: selfAdmin,
        applicationId: application.id,
        correlationId: "corr-self"
      })
    ).rejects.toBeInstanceOf(AuthorizationError);
    await expect(
      reject.execute({
        actor: selfAdmin,
        applicationId: application.id,
        motivo: "Intento propio",
        correlationId: "corr-self"
      })
    ).rejects.toBeInstanceOf(AuthorizationError);
    expect(store.countByEstado("PENDIENTE")).toBe(1);
  });

  it("no permite rechazar una solicitud ya aprobada", async () => {
    const { submit, approve, reject } = createSubject();
    const application = await submit.execute(command);
    await approve.execute({
      actor: admin,
      applicationId: application.id,
      correlationId: "corr-approve"
    });

    await expect(
      reject.execute({
        actor: admin,
        applicationId: application.id,
        motivo: "Cambio de decisión",
        correlationId: "corr-reject"
      })
    ).rejects.toBeInstanceOf(BusinessRuleError);
  });

  it("permite consultar la solicitud propia después de la aprobación", async () => {
    const { submit, approve, getOwn } = createSubject();
    const application = await submit.execute(command);
    await approve.execute({
      actor: admin,
      applicationId: application.id,
      correlationId: "corr-approve"
    });

    const own = await getOwn.execute({
      ...buyer,
      rol: "VENDEDOR",
      compradorId: null
    });
    expect(own?.estado).toBe("APROBADA");
    expect(own?.id).toBe(application.id);
  });
});
