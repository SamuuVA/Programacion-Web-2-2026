import type { Clock, IdGenerator, PasswordHasher } from "../../../shared/application/ports.js";
import {
  AuthorizationError,
  DependencyUnavailableError,
  UniquenessConflictError,
  ValidationError
} from "../../../shared/domain/errors.js";
import {
  CorrelationId,
  CorreoElectronico,
  DocumentoIdentidad,
  HashCredencial,
  NombreCompleto
} from "../../../shared/domain/value-objects.js";
import { Usuario } from "../../identity/domain/usuario.js";
import type { AuthenticatedUser } from "../../identity/application/ports.js";
import type { SellerRegistrationStore } from "./ports.js";

const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 128;
const COMMERCIAL_NAME_MAX = 120;
const WAREHOUSE_NAME_MAX = 120;
const WAREHOUSE_LOCATION_MAX = 200;

export interface RegisterSellerCommand {
  readonly actor: AuthenticatedUser;
  readonly nombreCompleto: string;
  readonly correoElectronico: string;
  readonly documentoIdentidad: {
    readonly tipo: string;
    readonly pais: string;
    readonly numero: string;
  };
  readonly credencial: string;
  readonly nombreComercial: string;
  readonly bodega: {
    readonly nombre: string;
    readonly ubicacion: string;
  };
  readonly correlationId: string;
}

export interface RegisterSellerResult {
  readonly usuarioId: string;
  readonly sellerId: string;
  readonly warehouseId: string;
  readonly estadoUsuario: "ACTIVO";
  readonly estadoVendedor: "ACTIVO";
  readonly estadoBodega: "ACTIVA";
  readonly correoNormalizado: string;
}

/**
 * PI-02 RegisterSeller.
 *
 * Solo un Administrador activo puede ejecutarlo. El vendedor no puede
 * autorregistrarse: la ruta exige sesión y rol administrativo antes de llegar
 * a este caso de uso. Usuario, perfil de vendedor y primera bodega se guardan
 * en una única transacción PostgreSQL.
 */
export class RegisterSeller {
  constructor(
    private readonly store: SellerRegistrationStore,
    private readonly hasher: PasswordHasher,
    private readonly clock: Clock,
    private readonly ids: IdGenerator
  ) {}

  async execute(command: RegisterSellerCommand): Promise<RegisterSellerResult> {
    if (command.actor.rol !== "ADMINISTRADOR" || command.actor.estado !== "ACTIVO") {
      throw new AuthorizationError("Solo un administrador activo puede registrar vendedores.");
    }

    const nombreCompleto = NombreCompleto.create(command.nombreCompleto);
    const correo = CorreoElectronico.create(command.correoElectronico);
    const documento = DocumentoIdentidad.create(command.documentoIdentidad);
    const correlationId = CorrelationId.create(command.correlationId);
    validatePasswordPolicy(command.credencial);
    const nombreComercial = boundedText(
      command.nombreComercial,
      "El nombre comercial",
      COMMERCIAL_NAME_MAX
    );
    const warehouseName = boundedText(
      command.bodega?.nombre,
      "El nombre de la bodega",
      WAREHOUSE_NAME_MAX
    );
    const warehouseLocation = boundedText(
      command.bodega?.ubicacion,
      "La ubicación de la bodega",
      WAREHOUSE_LOCATION_MAX
    );

    if (await this.store.existsByEmail(correo)) {
      throw new UniquenessConflictError("El correo electrónico ya está registrado.");
    }
    if (await this.store.existsByDocument(documento)) {
      throw new UniquenessConflictError("El documento de identidad ya está registrado.");
    }

    let hashValue: string;
    try {
      hashValue = await this.hasher.hash(command.credencial);
    } catch (error) {
      throw new DependencyUnavailableError("No fue posible procesar la credencial.", {
        cause: error instanceof Error ? error.message : "unknown"
      });
    }

    const now = this.clock.now();
    const usuario = Usuario.create({
      id: this.ids.usuarioId(),
      nombreCompleto,
      correoElectronico: correo,
      documentoIdentidad: documento,
      credencial: HashCredencial.create(hashValue),
      rol: "VENDEDOR",
      estado: "ACTIVO",
      creadoEn: now,
      actualizadoEn: now
    });
    const sellerId = this.ids.sellerId();
    const warehouseId = this.ids.warehouseId();

    const auditoria = {
      id: this.ids.auditId(),
      evento: "seller.registered.v1",
      recursoTipo: "PerfilVendedor",
      recursoId: sellerId,
      actorId: command.actor.usuarioId,
      rolActor: command.actor.rol,
      ocurridoEn: now,
      correlationId: correlationId.value,
      resultado: "EXITO" as const,
      gravedad: "INFORMACION" as const,
      detalles: {
        usuarioId: usuario.id,
        sellerId,
        warehouseId
      }
    };

    const evento = {
      id: this.ids.eventId(),
      tipo: "seller.registered",
      versionEsquema: 1 as const,
      agregadoTipo: "PerfilVendedor",
      agregadoId: sellerId,
      ocurridoEn: now,
      correlationId: correlationId.value,
      payload: {
        usuarioId: usuario.id,
        sellerId,
        warehouseId
      }
    };

    try {
      await this.store.saveRegistration({
        usuario,
        seller: {
          id: sellerId,
          usuarioId: usuario.id,
          nombreComercial,
          estado: "ACTIVO",
          creadoEn: now.value
        },
        warehouse: {
          id: warehouseId,
          vendedorId: sellerId,
          nombre: warehouseName,
          ubicacion: warehouseLocation,
          tipo: "VENDEDOR",
          estado: "ACTIVA",
          creadaEn: now.value
        },
        auditoria,
        evento
      });
    } catch (error) {
      if (error instanceof UniquenessConflictError) {
        throw error;
      }
      throw new DependencyUnavailableError("No fue posible completar el registro del vendedor.", {
        cause: error instanceof Error ? error.message : "unknown"
      });
    }

    return {
      usuarioId: usuario.id,
      sellerId,
      warehouseId,
      estadoUsuario: "ACTIVO",
      estadoVendedor: "ACTIVO",
      estadoBodega: "ACTIVA",
      correoNormalizado: correo.value
    };
  }
}

function validatePasswordPolicy(value: string): void {
  if (typeof value !== "string") {
    throw new ValidationError("La credencial es obligatoria.");
  }
  const length = [...value].length;
  if (length < PASSWORD_MIN_LENGTH || length > PASSWORD_MAX_LENGTH) {
    throw new ValidationError(
      `La credencial debe tener entre ${PASSWORD_MIN_LENGTH} y ${PASSWORD_MAX_LENGTH} caracteres.`
    );
  }
}

function boundedText(value: string | undefined, label: string, max: number): string {
  if (typeof value !== "string") {
    throw new ValidationError(`${label} es obligatorio.`);
  }
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length === 0) {
    throw new ValidationError(`${label} no puede estar vacío.`);
  }
  if (normalized.length > max) {
    throw new ValidationError(`${label} no puede superar ${max} caracteres.`);
  }
  return normalized;
}
