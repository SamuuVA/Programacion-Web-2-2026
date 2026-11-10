import {
  AuthorizationError,
  BusinessRuleError,
  ResourceNotFoundError,
  ValidationError
} from "../../../shared/domain/errors.js";
import type { Clock, IdGenerator } from "../../../shared/application/ports.js";
import type { AuthenticatedUser } from "./ports.js";
import type { EstadoUsuario, RolSistema } from "../domain/usuario.js";

export const ACCIONES_ESTADO_USUARIO = [
  "ACTIVAR",
  "DESACTIVAR",
  "BLOQUEAR",
  "DESBLOQUEAR"
] as const;

export type AccionEstadoUsuario = (typeof ACCIONES_ESTADO_USUARIO)[number];

export interface UserAccessRecord {
  readonly usuarioId: string;
  readonly rol: RolSistema;
  readonly estado: EstadoUsuario;
  readonly actualizadoEn: string;
}

export interface ApplyUserAccessTransitionInput {
  readonly usuarioId: string;
  readonly estadoEsperado: EstadoUsuario;
  readonly estadoNuevo: EstadoUsuario;
  readonly accion: AccionEstadoUsuario;
  readonly motivo: string | null;
  readonly actorId: string;
  readonly actorRol: RolSistema;
  readonly correlationId: string;
  readonly ocurridoEn: string;
  readonly auditId: string;
  readonly revocarSesiones: boolean;
}

export interface UserAccessTransitionResult {
  readonly usuarioId: string;
  readonly estadoAnterior: EstadoUsuario;
  readonly estadoNuevo: EstadoUsuario;
  readonly actualizadoEn: string;
  readonly sesionesRevocadas: number;
}

/**
 * Puerto de escritura del estado de acceso. Es independiente del estado
 * comercial del comprador, del estado del vendedor y del estado de una
 * solicitud de vendedor.
 */
export interface UserAccessStore {
  findUser(usuarioId: string): Promise<UserAccessRecord | null>;
  applyTransition(
    input: ApplyUserAccessTransitionInput
  ): Promise<UserAccessTransitionResult>;
  healthCheck(): Promise<void>;
  close(): Promise<void>;
}

interface TransitionRule {
  readonly desde: readonly EstadoUsuario[];
  readonly hacia: EstadoUsuario;
}

const TRANSICIONES: Record<AccionEstadoUsuario, TransitionRule> = {
  ACTIVAR: { desde: ["INACTIVO"], hacia: "ACTIVO" },
  DESACTIVAR: { desde: ["ACTIVO"], hacia: "INACTIVO" },
  BLOQUEAR: { desde: ["ACTIVO", "INACTIVO"], hacia: "BLOQUEADO" },
  DESBLOQUEAR: { desde: ["BLOQUEADO"], hacia: "ACTIVO" }
};

const MOTIVO_MAX = 500;

export interface UpdateUserAccessStatusCommand {
  readonly actor: AuthenticatedUser;
  readonly usuarioId: string;
  readonly accion: AccionEstadoUsuario;
  readonly motivo?: string;
  readonly correlationId: string;
}

/**
 * PI-04 ManageUser.
 *
 * Aplica únicamente las transiciones confirmadas del modelo:
 * ACTIVO→INACTIVO, ACTIVO→BLOQUEADO, INACTIVO→ACTIVO, BLOQUEADO→ACTIVO e
 * INACTIVO→BLOQUEADO. BLOQUEADO→INACTIVO no se permite.
 *
 * El administrador no puede cambiar su propio estado. Cuando la cuenta deja de
 * estar ACTIVA se revocan sus sesiones vigentes en la misma transacción.
 */
export class UpdateUserAccessStatus {
  constructor(
    private readonly store: UserAccessStore,
    private readonly clock: Clock,
    private readonly ids: IdGenerator
  ) {}

  async execute(command: UpdateUserAccessStatusCommand) {
    if (command.actor.rol !== "ADMINISTRADOR") {
      throw new AuthorizationError(
        "Solo un administrador puede cambiar el estado de acceso de una cuenta."
      );
    }
    if (command.actor.estado !== "ACTIVO") {
      throw new AuthorizationError(
        "La cuenta del administrador no está activa."
      );
    }
    if (command.actor.usuarioId === command.usuarioId) {
      throw new AuthorizationError(
        "No puedes cambiar tu propio estado de acceso."
      );
    }

    const rule = TRANSICIONES[command.accion];
    if (rule === undefined) {
      throw new ValidationError("La acción de estado no es válida.");
    }

    const motivo = normalizeMotivo(command.motivo);
    if (
      (command.accion === "DESACTIVAR" || command.accion === "BLOQUEAR") &&
      motivo === null
    ) {
      throw new ValidationError(
        "El motivo es obligatorio para desactivar o bloquear una cuenta."
      );
    }

    const user = await this.store.findUser(command.usuarioId);
    if (user === null) {
      throw new ResourceNotFoundError("La cuenta no existe.");
    }
    if (!rule.desde.includes(user.estado)) {
      throw new BusinessRuleError(
        `La transición ${user.estado}→${rule.hacia} no está permitida.`,
        {
          transicionInvalida: true,
          estadoActual: user.estado,
          accion: command.accion
        }
      );
    }

    const now = this.clock.now();
    return this.store.applyTransition({
      usuarioId: user.usuarioId,
      estadoEsperado: user.estado,
      estadoNuevo: rule.hacia,
      accion: command.accion,
      motivo,
      actorId: command.actor.usuarioId,
      actorRol: command.actor.rol,
      correlationId: command.correlationId,
      ocurridoEn: now.value,
      auditId: this.ids.auditId(),
      revocarSesiones: rule.hacia !== "ACTIVO"
    });
  }
}

function normalizeMotivo(value: string | undefined): string | null {
  if (value === undefined) {
    return null;
  }
  if (typeof value !== "string") {
    throw new ValidationError("El motivo no es válido.");
  }
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length === 0) {
    return null;
  }
  if (normalized.length > MOTIVO_MAX) {
    throw new ValidationError(
      `El motivo no puede superar ${MOTIVO_MAX} caracteres.`
    );
  }
  return normalized;
}
