import {
  AuthorizationError,
  BusinessRuleError,
  ResourceNotFoundError,
  UniquenessConflictError
} from "../../../shared/domain/errors.js";
import type { Clock, IdGenerator } from "../../../shared/application/ports.js";
import type { AuthenticatedUser } from "../../identity/application/ports.js";
import type {
  SellerApplicationDetail,
  SellerApplicationStore
} from "./ports.js";
import {
  validarDatosSolicitud,
  validarMotivoRechazo
} from "../domain/solicitud-vendedor.js";

function assertAdmin(actor: AuthenticatedUser): void {
  if (actor.rol !== "ADMINISTRADOR") {
    throw new AuthorizationError(
      "Solo un administrador puede revisar solicitudes de vendedor."
    );
  }
  if (actor.estado !== "ACTIVO") {
    throw new AuthorizationError("La cuenta del administrador no está activa.");
  }
}

function assertApplicant(actor: AuthenticatedUser): void {
  if (actor.rol !== "COMPRADOR") {
    throw new AuthorizationError(
      "Solo una cuenta compradora puede solicitar la incorporación como vendedor."
    );
  }
  if (actor.estado !== "ACTIVO") {
    throw new AuthorizationError(
      "La cuenta debe estar activa para solicitar la incorporación."
    );
  }
  if (actor.compradorId === null) {
    throw new AuthorizationError(
      "La cuenta no tiene un perfil de comprador asociado."
    );
  }
}

export interface SubmitSellerApplicationCommand {
  readonly actor: AuthenticatedUser;
  readonly nombreComercial: string;
  readonly nombreBodega: string;
  readonly ubicacionBodega: string;
  readonly correlationId: string;
}

/**
 * PI-02 extendido: un comprador autenticado solicita ser vendedor.
 *
 * La solicitud no cambia el rol ni el estado de acceso. La aprobación
 * administrativa es la única operación que crea el perfil de vendedor.
 */
export class SubmitSellerApplication {
  constructor(
    private readonly store: SellerApplicationStore,
    private readonly clock: Clock,
    private readonly ids: IdGenerator
  ) {}

  async execute(
    command: SubmitSellerApplicationCommand
  ): Promise<SellerApplicationDetail> {
    assertApplicant(command.actor);
    const datos = validarDatosSolicitud(command);

    const pending = await this.store.findPendingByUserId(
      command.actor.usuarioId
    );
    if (pending !== null) {
      throw new BusinessRuleError(
        "Ya tienes una solicitud de vendedor pendiente de revisión."
      );
    }

    const now = this.clock.now();
    const applicationId = this.ids.sellerApplicationId();

    try {
      return await this.store.create({
        id: applicationId,
        usuarioId: command.actor.usuarioId,
        nombreComercial: datos.nombreComercial,
        nombreBodega: datos.nombreBodega,
        ubicacionBodega: datos.ubicacionBodega,
        creadaEn: now.value,
        actualizadaEn: now.value,
        auditoria: {
          id: this.ids.auditId(),
          evento: "seller-application.submitted.v1",
          recursoTipo: "SolicitudVendedor",
          recursoId: applicationId,
          actorId: command.actor.usuarioId,
          rolActor: command.actor.rol,
          ocurridoEn: now,
          correlationId: command.correlationId,
          resultado: "EXITO",
          gravedad: "INFORMACION",
          detalles: {
            usuarioId: command.actor.usuarioId,
            nombreComercial: datos.nombreComercial
          }
        },
        evento: {
          id: this.ids.eventId(),
          tipo: "seller.application.submitted",
          versionEsquema: 1,
          agregadoTipo: "SolicitudVendedor",
          agregadoId: applicationId,
          ocurridoEn: now,
          correlationId: command.correlationId,
          payload: {
            solicitudId: applicationId,
            usuarioId: command.actor.usuarioId
          }
        }
      });
    } catch (error) {
      if (error instanceof UniquenessConflictError) {
        throw new BusinessRuleError(
          "Ya tienes una solicitud de vendedor pendiente de revisión."
        );
      }
      throw error;
    }
  }
}

/**
 * Consulta de la propia solicitud. Se permite a COMPRADOR y VENDEDOR porque,
 * tras la aprobación, la misma identidad pasa a ser VENDEDOR y debe poder ver
 * el resultado de su trámite.
 */
export class GetOwnSellerApplication {
  constructor(private readonly store: SellerApplicationStore) {}

  async execute(
    actor: AuthenticatedUser
  ): Promise<SellerApplicationDetail | null> {
    if (actor.rol !== "COMPRADOR" && actor.rol !== "VENDEDOR") {
      throw new AuthorizationError(
        "Solo un comprador o vendedor puede consultar una solicitud propia."
      );
    }
    if (actor.estado !== "ACTIVO") {
      throw new AuthorizationError("La cuenta no está activa.");
    }
    return this.store.findLatestByUserId(actor.usuarioId);
  }
}

export interface AdminSellerApplicationsInput {
  readonly estado: SellerApplicationDetail["estado"] | null;
  readonly search: string | null;
  readonly page: number;
  readonly pageSize: number;
}

export class ListAdminSellerApplications {
  constructor(private readonly store: SellerApplicationStore) {}

  async execute(actor: AuthenticatedUser, input: AdminSellerApplicationsInput) {
    assertAdmin(actor);
    return this.store.list({
      estado: input.estado,
      search: input.search?.trim() || null,
      page: input.page,
      pageSize: input.pageSize
    });
  }
}

export class GetAdminSellerApplication {
  constructor(private readonly store: SellerApplicationStore) {}

  async execute(
    actor: AuthenticatedUser,
    applicationId: string
  ): Promise<SellerApplicationDetail> {
    assertAdmin(actor);
    const application = await this.store.findById(applicationId);
    if (application === null) {
      throw new ResourceNotFoundError("La solicitud de vendedor no existe.");
    }
    return application;
  }
}

export interface ApproveSellerApplicationCommand {
  readonly actor: AuthenticatedUser;
  readonly applicationId: string;
  readonly correlationId: string;
}

/**
 * Aprobación administrativa: misma identidad, rol VENDEDOR, perfil de vendedor
 * y primera bodega ACTIVA en una transacción. Un reintento devuelve el mismo
 * vendedor y la misma bodega sin duplicarlos.
 */
export class ApproveSellerApplication {
  constructor(
    private readonly store: SellerApplicationStore,
    private readonly clock: Clock,
    private readonly ids: IdGenerator
  ) {}

  async execute(command: ApproveSellerApplicationCommand) {
    assertAdmin(command.actor);
    const application = await this.store.findById(command.applicationId);
    if (application === null) {
      throw new ResourceNotFoundError("La solicitud de vendedor no existe.");
    }
    if (application.usuarioId === command.actor.usuarioId) {
      throw new AuthorizationError(
        "No puedes aprobar tu propia solicitud de vendedor."
      );
    }
    if (application.estado === "RECHAZADA") {
      throw new BusinessRuleError(
        "Una solicitud rechazada no puede aprobarse. El comprador debe enviar una nueva solicitud."
      );
    }

    const now = this.clock.now();
    const sellerId = this.ids.sellerId();
    const warehouseId = this.ids.warehouseId();

    return this.store.approve({
      applicationId: application.id,
      actorId: command.actor.usuarioId,
      actorRol: command.actor.rol,
      revisadoEn: now.value,
      sellerId,
      warehouseId,
      auditoria: {
        id: this.ids.auditId(),
        evento: "seller-application.approved.v1",
        recursoTipo: "SolicitudVendedor",
        recursoId: application.id,
        actorId: command.actor.usuarioId,
        rolActor: command.actor.rol,
        ocurridoEn: now,
        correlationId: command.correlationId,
        resultado: "EXITO",
        gravedad: "INFORMACION",
        detalles: {
          usuarioId: application.usuarioId,
          sellerId,
          warehouseId
        }
      },
      evento: {
        id: this.ids.eventId(),
        tipo: "seller.application.approved",
        versionEsquema: 1,
        agregadoTipo: "SolicitudVendedor",
        agregadoId: application.id,
        ocurridoEn: now,
        correlationId: command.correlationId,
        payload: {
          solicitudId: application.id,
          usuarioId: application.usuarioId,
          sellerId,
          warehouseId
        }
      }
    });
  }
}

export interface RejectSellerApplicationCommand {
  readonly actor: AuthenticatedUser;
  readonly applicationId: string;
  readonly motivo: string;
  readonly correlationId: string;
}

export class RejectSellerApplication {
  constructor(
    private readonly store: SellerApplicationStore,
    private readonly clock: Clock,
    private readonly ids: IdGenerator
  ) {}

  async execute(
    command: RejectSellerApplicationCommand
  ): Promise<SellerApplicationDetail> {
    assertAdmin(command.actor);
    const application = await this.store.findById(command.applicationId);
    if (application === null) {
      throw new ResourceNotFoundError("La solicitud de vendedor no existe.");
    }
    if (application.usuarioId === command.actor.usuarioId) {
      throw new AuthorizationError(
        "No puedes rechazar tu propia solicitud de vendedor."
      );
    }
    if (application.estado === "APROBADA") {
      throw new BusinessRuleError(
        "Una solicitud ya aprobada no puede rechazarse."
      );
    }

    const motivo = validarMotivoRechazo(command.motivo);
    const now = this.clock.now();

    return this.store.reject({
      applicationId: application.id,
      actorId: command.actor.usuarioId,
      actorRol: command.actor.rol,
      motivo,
      revisadoEn: now.value,
      auditoria: {
        id: this.ids.auditId(),
        evento: "seller-application.rejected.v1",
        recursoTipo: "SolicitudVendedor",
        recursoId: application.id,
        actorId: command.actor.usuarioId,
        rolActor: command.actor.rol,
        ocurridoEn: now,
        correlationId: command.correlationId,
        resultado: "EXITO",
        gravedad: "INFORMACION",
        detalles: {
          usuarioId: application.usuarioId,
          motivo
        }
      },
      evento: {
        id: this.ids.eventId(),
        tipo: "seller.application.rejected",
        versionEsquema: 1,
        agregadoTipo: "SolicitudVendedor",
        agregadoId: application.id,
        ocurridoEn: now,
        correlationId: command.correlationId,
        payload: {
          solicitudId: application.id,
          usuarioId: application.usuarioId,
          motivo
        }
      }
    });
  }
}
