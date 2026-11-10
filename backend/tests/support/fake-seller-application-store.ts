import {
  BusinessRuleError,
  ResourceNotFoundError,
  UniquenessConflictError
} from "../../src/shared/domain/errors.js";
import type {
  ApproveSellerApplicationInput,
  ApproveSellerApplicationResult,
  CreateSellerApplicationRecord,
  RejectSellerApplicationInput,
  SellerApplicationDetail,
  SellerApplicationFilter,
  SellerApplicationPage,
  SellerApplicationStore
} from "../../src/modules/seller-applications/application/ports.js";
import type { EstadoSolicitudVendedor } from "../../src/modules/seller-applications/domain/solicitud-vendedor.js";
import type { RegistroAuditoria } from "../../src/shared/domain/audit.js";

interface FakeUser {
  readonly usuarioId: string;
  readonly nombreCompleto: string;
  readonly correoElectronico: string;
  readonly rol: SellerApplicationDetail["usuarioRol"];
  readonly estado: SellerApplicationDetail["usuarioEstado"];
}

/**
 * Doble en memoria del agregado SolicitudVendedor. Reproduce la unicidad de
 * solicitud pendiente y la idempotencia de la aprobación.
 */
export class FakeSellerApplicationStore implements SellerApplicationStore {
  private readonly users = new Map<string, FakeUser>();
  private readonly applications = new Map<string, SellerApplicationDetail>();
  private readonly sellerByUser = new Map<
    string,
    { sellerId: string; warehouseId: string }
  >();
  readonly audits: RegistroAuditoria[] = [];
  readonly events: string[] = [];

  seedUser(user: FakeUser): void {
    this.users.set(user.usuarioId, user);
  }

  seedApplication(application: SellerApplicationDetail): void {
    this.applications.set(application.id, application);
    if (application.sellerId !== null && application.warehouseId !== null) {
      this.sellerByUser.set(application.usuarioId, {
        sellerId: application.sellerId,
        warehouseId: application.warehouseId
      });
    }
  }

  getApplication(id: string): SellerApplicationDetail | undefined {
    return this.applications.get(id);
  }

  async create(
    record: CreateSellerApplicationRecord
  ): Promise<SellerApplicationDetail> {
    for (const application of this.applications.values()) {
      if (
        application.usuarioId === record.usuarioId &&
        application.estado === "PENDIENTE"
      ) {
        throw new UniquenessConflictError(
          "Ya existe una solicitud de vendedor pendiente para este usuario."
        );
      }
    }
    const user = this.users.get(record.usuarioId);
    if (!user) {
      throw new ResourceNotFoundError("La cuenta del solicitante no existe.");
    }
    const detail: SellerApplicationDetail = {
      id: record.id,
      usuarioId: record.usuarioId,
      nombreCompleto: user.nombreCompleto,
      correoElectronico: user.correoElectronico,
      nombreComercial: record.nombreComercial,
      nombreBodega: record.nombreBodega,
      ubicacionBodega: record.ubicacionBodega,
      estado: "PENDIENTE",
      motivoRechazo: null,
      revisadoPor: null,
      revisadoEn: null,
      sellerId: null,
      warehouseId: null,
      usuarioRol: user.rol,
      usuarioEstado: user.estado,
      creadaEn: record.creadaEn,
      actualizadaEn: record.actualizadaEn
    };
    this.applications.set(detail.id, detail);
    this.audits.push(record.auditoria);
    this.events.push(record.evento.tipo);
    return detail;
  }

  async findById(id: string): Promise<SellerApplicationDetail | null> {
    return this.applications.get(id) ?? null;
  }

  async findLatestByUserId(
    usuarioId: string
  ): Promise<SellerApplicationDetail | null> {
    return (
      [...this.applications.values()]
        .filter((application) => application.usuarioId === usuarioId)
        .sort((a, b) => b.creadaEn.localeCompare(a.creadaEn))[0] ?? null
    );
  }

  async findPendingByUserId(
    usuarioId: string
  ): Promise<SellerApplicationDetail | null> {
    return (
      [...this.applications.values()].find(
        (application) =>
          application.usuarioId === usuarioId &&
          application.estado === "PENDIENTE"
      ) ?? null
    );
  }

  async list(filter: SellerApplicationFilter): Promise<SellerApplicationPage> {
    let items = [...this.applications.values()];
    if (filter.estado) {
      items = items.filter((item) => item.estado === filter.estado);
    }
    if (filter.search) {
      const search = filter.search.toLowerCase();
      items = items.filter(
        (item) =>
          item.nombreCompleto.toLowerCase().includes(search) ||
          item.correoElectronico.toLowerCase().includes(search) ||
          item.nombreComercial.toLowerCase().includes(search) ||
          item.nombreBodega.toLowerCase().includes(search)
      );
    }
    items.sort((a, b) => b.creadaEn.localeCompare(a.creadaEn));
    const total = items.length;
    const start = (filter.page - 1) * filter.pageSize;
    return {
      items: items.slice(start, start + filter.pageSize),
      total,
      page: filter.page,
      pageSize: filter.pageSize
    };
  }

  async approve(
    input: ApproveSellerApplicationInput
  ): Promise<ApproveSellerApplicationResult> {
    const application = this.applications.get(input.applicationId);
    if (!application) {
      throw new ResourceNotFoundError("La solicitud de vendedor no existe.");
    }
    if (application.estado === "RECHAZADA") {
      throw new BusinessRuleError(
        "Una solicitud rechazada no puede aprobarse."
      );
    }
    if (application.estado === "APROBADA") {
      const existing = this.sellerByUser.get(application.usuarioId);
      if (!existing) {
        throw new BusinessRuleError("La solicitud aprobada no tiene vendedor.");
      }
      return {
        solicitud: application,
        sellerId: existing.sellerId,
        warehouseId: existing.warehouseId,
        yaAprobada: true
      };
    }
    const existing = this.sellerByUser.get(application.usuarioId);
    const sellerId = existing?.sellerId ?? input.sellerId;
    const warehouseId = existing?.warehouseId ?? input.warehouseId;
    this.sellerByUser.set(application.usuarioId, { sellerId, warehouseId });
    const updated: SellerApplicationDetail = {
      ...application,
      estado: "APROBADA",
      revisadoPor: input.actorId,
      revisadoEn: input.revisadoEn,
      actualizadaEn: input.revisadoEn,
      sellerId,
      warehouseId,
      usuarioRol: "VENDEDOR"
    };
    this.applications.set(updated.id, updated);
    this.audits.push(input.auditoria);
    this.events.push(input.evento.tipo);
    return { solicitud: updated, sellerId, warehouseId, yaAprobada: false };
  }

  async reject(
    input: RejectSellerApplicationInput
  ): Promise<SellerApplicationDetail> {
    const application = this.applications.get(input.applicationId);
    if (!application) {
      throw new ResourceNotFoundError("La solicitud de vendedor no existe.");
    }
    if (application.estado === "APROBADA") {
      throw new BusinessRuleError(
        "Una solicitud ya aprobada no puede rechazarse."
      );
    }
    if (application.estado === "RECHAZADA") {
      return application;
    }
    const updated: SellerApplicationDetail = {
      ...application,
      estado: "RECHAZADA",
      motivoRechazo: input.motivo,
      revisadoPor: input.actorId,
      revisadoEn: input.revisadoEn,
      actualizadaEn: input.revisadoEn
    };
    this.applications.set(updated.id, updated);
    this.audits.push(input.auditoria);
    this.events.push(input.evento.tipo);
    return updated;
  }

  async healthCheck(): Promise<void> {}
  async close(): Promise<void> {}

  countByEstado(estado: EstadoSolicitudVendedor): number {
    return [...this.applications.values()].filter(
      (application) => application.estado === estado
    ).length;
  }
}
