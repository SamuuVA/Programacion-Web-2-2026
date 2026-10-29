import {
  DependencyUnavailableError,
  UniquenessConflictError,
  ValidationError
} from "../../../shared/domain/errors.js";
import type { Clock, IdGenerator, PasswordHasher } from "../../../shared/application/ports.js";
import {
  CorrelationId,
  CorreoElectronico,
  DocumentoIdentidad,
  HashCredencial,
  NombreCompleto
} from "../../../shared/domain/value-objects.js";
import { Usuario } from "../../identity/domain/usuario.js";
import { PerfilComprador } from "../domain/perfil-comprador.js";
import { Carrito } from "../../cart/domain/carrito.js";
import type { BuyerRegistrationStore } from "./ports.js";

export interface RegisterBuyerCommand {
  readonly nombreCompleto: string;
  readonly correoElectronico: string;
  readonly documentoIdentidad: {
    readonly tipo: string;
    readonly pais: string;
    readonly numero: string;
  };
  readonly credencial: string;
  readonly correlationId: string;
}

export interface RegisterBuyerResult {
  readonly usuarioId: string;
  readonly compradorId: string;
  readonly carritoId: string;
  readonly estadoUsuario: "ACTIVO";
  readonly estadoComercial: "HABILITADO";
  readonly correoNormalizado: string;
}

const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 128;

/**
 * PI-01 RegisterBuyer.
 * Flujo: validar → verificar unicidad → hashear → crear usuario/perfil/carrito
 * → auditar y encolar en la misma transacción → confirmar.
 */
export class RegisterBuyer {
  constructor(
    private readonly store: BuyerRegistrationStore,
    private readonly hasher: PasswordHasher,
    private readonly clock: Clock,
    private readonly ids: IdGenerator
  ) {}

  async execute(command: RegisterBuyerCommand): Promise<RegisterBuyerResult> {
    const nombreCompleto = NombreCompleto.create(command.nombreCompleto);
    const correo = CorreoElectronico.create(command.correoElectronico);
    const documento = DocumentoIdentidad.create(command.documentoIdentidad);
    const correlationId = CorrelationId.create(command.correlationId);
    validatePasswordPolicy(command.credencial);

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
    const hash = HashCredencial.create(hashValue);

    const now = this.clock.now();
    const usuario = Usuario.create({
      id: this.ids.usuarioId(),
      nombreCompleto,
      correoElectronico: correo,
      documentoIdentidad: documento,
      credencial: hash,
      rol: "COMPRADOR",
      estado: "ACTIVO",
      creadoEn: now,
      actualizadoEn: now
    });
    const comprador = PerfilComprador.create({
      id: this.ids.compradorId(),
      usuarioId: usuario.id,
      estadoComercial: "HABILITADO",
      direcciones: [],
      creadoEn: now
    });
    const carrito = Carrito.createEmpty({
      id: this.ids.carritoId(),
      compradorId: comprador.id,
      actualizadoEn: now
    });

    const auditoria = {
      id: this.ids.auditId(),
      evento: "buyer.registered.v1",
      recursoTipo: "PerfilComprador",
      recursoId: comprador.id,
      actorId: "system:public-registration",
      ocurridoEn: now,
      correlationId: correlationId.value,
      resultado: "EXITO" as const,
      gravedad: "INFORMACION" as const,
      detalles: {
        usuarioId: usuario.id,
        compradorId: comprador.id,
        carritoId: carrito.id
      }
    };

    const evento = {
      id: this.ids.eventId(),
      tipo: "buyer.registered",
      versionEsquema: 1 as const,
      agregadoTipo: "PerfilComprador",
      agregadoId: comprador.id,
      ocurridoEn: now,
      correlationId: correlationId.value,
      payload: {
        usuarioId: usuario.id,
        compradorId: comprador.id,
        carritoId: carrito.id
      }
    };

    try {
      await this.store.saveRegistration({
        usuario,
        comprador,
        carrito,
        auditoria,
        evento
      });
    } catch (error) {
      if (error instanceof UniquenessConflictError) {
        throw error;
      }
      throw new DependencyUnavailableError("No fue posible completar el registro.", {
        cause: error instanceof Error ? error.message : "unknown"
      });
    }

    return {
      usuarioId: usuario.id,
      compradorId: comprador.id,
      carritoId: carrito.id,
      estadoUsuario: "ACTIVO",
      estadoComercial: "HABILITADO",
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
