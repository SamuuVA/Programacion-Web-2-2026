import type {
  Clock,
  PasswordHasher
} from "../../../shared/application/ports.js";
import {
  AuthorizationError,
  DependencyUnavailableError,
  ResourceNotFoundError,
  UniquenessConflictError,
  ValidationError
} from "../../../shared/domain/errors.js";
import {
  CorreoElectronico,
  DocumentoIdentidad,
  HashCredencial,
  NombreCompleto
} from "../../../shared/domain/value-objects.js";
import type { AuthenticatedUser } from "../../identity/application/ports.js";
import type { EstadoPedido } from "../../orders/application/ports.js";
import {
  normalizarEvidencia,
  textoOpcional,
  type ResultadoEntrega
} from "../domain/envio.js";
import type {
  DispatchResult,
  DeliverResult,
  LogisticsActor,
  LogisticsOrderDetail,
  LogisticsStore,
  PrepareResult,
  RegisterOperatorResult
} from "./ports.js";

const SIN_PERFIL = "La cuenta no tiene un perfil de operador logístico.";
const PERFIL_INACTIVO = "El perfil de operador logístico no está activo.";
const PEDIDO_NO_ENCONTRADO =
  "El pedido no existe o no pertenece a tu ámbito logístico.";

async function resolverActor(
  store: LogisticsStore,
  usuarioId: string
): Promise<LogisticsActor> {
  const profile = await store.findProfile(usuarioId);
  if (profile === null) {
    throw new AuthorizationError(SIN_PERFIL);
  }
  if (profile.estado !== "ACTIVO") {
    throw new AuthorizationError(PERFIL_INACTIVO);
  }
  return {
    usuarioId,
    operadorId: profile.id,
    nombreOperador: profile.nombreOperador
  };
}

function textoRequerido(value: string, campo: string, max = 100): string {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (normalized.length === 0) {
    throw new ValidationError(`${campo} es obligatorio.`);
  }
  if (normalized.length > max) {
    throw new ValidationError(`${campo} no puede superar ${max} caracteres.`);
  }
  return normalized;
}

function textoAcotado(
  value: string | null | undefined,
  campo: string,
  max: number
): string | null {
  const normalized = textoOpcional(value);
  if (normalized !== null && normalized.length > max) {
    throw new ValidationError(`${campo} no puede superar ${max} caracteres.`);
  }
  return normalized;
}

/** Consulta del perfil y de las bodegas asignadas al operador. */
export class GetLogisticsProfile {
  constructor(private readonly store: LogisticsStore) {}

  async execute(usuarioId: string) {
    const profile = await this.store.findProfile(usuarioId);
    if (profile === null) {
      throw new AuthorizationError(SIN_PERFIL);
    }
    if (profile.estado !== "ACTIVO") {
      throw new AuthorizationError(PERFIL_INACTIVO);
    }
    return profile;
  }
}

export class ListLogisticsWarehouses {
  constructor(private readonly store: LogisticsStore) {}

  async execute(usuarioId: string) {
    const actor = await resolverActor(this.store, usuarioId);
    return this.store.listWarehouses(actor.operadorId);
  }
}

export class ListLogisticsInventory {
  constructor(private readonly store: LogisticsStore) {}

  async execute(usuarioId: string) {
    const actor = await resolverActor(this.store, usuarioId);
    return this.store.listInventory(actor.operadorId);
  }
}

export class GetLogisticsSummary {
  constructor(private readonly store: LogisticsStore) {}

  async execute(usuarioId: string) {
    const actor = await resolverActor(this.store, usuarioId);
    return this.store.summary(actor.operadorId);
  }
}

export class ListLogisticsOrders {
  constructor(private readonly store: LogisticsStore) {}

  async execute(usuarioId: string, estado: EstadoPedido | null) {
    const actor = await resolverActor(this.store, usuarioId);
    return this.store.listOrders(actor.operadorId, estado);
  }
}

export class GetLogisticsOrder {
  constructor(private readonly store: LogisticsStore) {}

  async execute(
    usuarioId: string,
    pedidoId: string
  ): Promise<LogisticsOrderDetail> {
    const actor = await resolverActor(this.store, usuarioId);
    const order = await this.store.findOrder(
      actor.operadorId,
      textoRequerido(pedidoId, "El pedido")
    );
    if (order === null) {
      throw new ResourceNotFoundError(PEDIDO_NO_ENCONTRADO);
    }
    return order;
  }
}

export interface PrepareShipmentInput {
  readonly bodegaId: string;
  readonly transportista?: string | null | undefined;
  readonly idempotencyKey: string;
}

/** PI-16: preparar/empacar un envío de un pedido pagado. */
export class PrepareShipment {
  constructor(
    private readonly store: LogisticsStore,
    private readonly clock: Clock
  ) {}

  async execute(
    usuarioId: string,
    pedidoId: string,
    input: PrepareShipmentInput,
    correlationId: string
  ): Promise<PrepareResult> {
    const actor = await resolverActor(this.store, usuarioId);
    return this.store.prepare({
      operadorId: actor.operadorId,
      actorId: actor.usuarioId,
      pedidoId: textoRequerido(pedidoId, "El pedido"),
      bodegaId: textoRequerido(input.bodegaId, "La bodega"),
      transportista: textoAcotado(input.transportista, "El transportista", 120),
      idempotencyKey: textoRequerido(
        input.idempotencyKey,
        "La clave de idempotencia"
      ),
      now: this.clock.now().toString(),
      correlationId: textoRequerido(correlationId, "correlationId", 200)
    });
  }
}

export interface DispatchOrderInput {
  readonly transportista?: string | null | undefined;
  readonly trackingNumber?: string | null | undefined;
  readonly idempotencyKey: string;
}

/** PI-17: despachar, consumir reservas y registrar la salida de inventario. */
export class DispatchOrder {
  constructor(
    private readonly store: LogisticsStore,
    private readonly clock: Clock
  ) {}

  async execute(
    usuarioId: string,
    envioId: string,
    input: DispatchOrderInput,
    correlationId: string
  ): Promise<DispatchResult> {
    const actor = await resolverActor(this.store, usuarioId);
    return this.store.dispatch({
      operadorId: actor.operadorId,
      actorId: actor.usuarioId,
      envioId: textoRequerido(envioId, "El envío"),
      transportista: textoAcotado(input.transportista, "El transportista", 120),
      trackingNumber: textoAcotado(input.trackingNumber, "El seguimiento", 200),
      idempotencyKey: textoRequerido(
        input.idempotencyKey,
        "La clave de idempotencia"
      ),
      now: this.clock.now().toString(),
      correlationId: textoRequerido(correlationId, "correlationId", 200)
    });
  }
}

export interface ConfirmDeliveryInput {
  readonly resultado: ResultadoEntrega;
  readonly evidencia: {
    readonly tipo?: string | null | undefined;
    readonly referencia?: string | null | undefined;
    readonly nota?: string | null | undefined;
    readonly motivo?: string | null | undefined;
  };
  readonly idempotencyKey: string;
}

/** PI-18: registrar entrega o fallo con evidencia. No cierra el pedido. */
export class ConfirmDelivery {
  constructor(
    private readonly store: LogisticsStore,
    private readonly clock: Clock
  ) {}

  async execute(
    usuarioId: string,
    envioId: string,
    input: ConfirmDeliveryInput,
    correlationId: string
  ): Promise<DeliverResult> {
    const actor = await resolverActor(this.store, usuarioId);
    if (input.resultado !== "ENTREGADO" && input.resultado !== "FALLIDO") {
      throw new ValidationError("El resultado de entrega no es válido.");
    }
    return this.store.deliver({
      operadorId: actor.operadorId,
      actorId: actor.usuarioId,
      envioId: textoRequerido(envioId, "El envío"),
      resultado: input.resultado,
      evidencia: normalizarEvidencia(input.resultado, input.evidencia),
      idempotencyKey: textoRequerido(
        input.idempotencyKey,
        "La clave de idempotencia"
      ),
      now: this.clock.now().toString(),
      correlationId: textoRequerido(correlationId, "correlationId", 200)
    });
  }
}

export interface RegisterLogisticsOperatorInput {
  readonly nombreCompleto: string;
  readonly correoElectronico: string;
  readonly documentoIdentidad: {
    readonly tipo: string;
    readonly pais: string;
    readonly numero: string;
  };
  readonly credencial: string;
  readonly nombreOperador: string;
  readonly bodegaIds: readonly string[];
}

const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 128;

/**
 * Alta administrativa del operador logístico y de su ámbito de bodegas.
 *
 * No existe en el SDD un puerto específico de alta de operadores; se sigue el
 * mismo patrón aprobado para el alta de vendedores (PI-02): solo un
 * administrador activo, en una transacción, sin autorregistro.
 */
export class RegisterLogisticsOperator {
  constructor(
    private readonly store: LogisticsStore,
    private readonly hasher: PasswordHasher,
    private readonly clock: Clock,
    private readonly ids: {
      usuarioId(): string;
      logisticsOperatorId(): string;
    }
  ) {}

  async execute(
    actor: AuthenticatedUser,
    input: RegisterLogisticsOperatorInput
  ): Promise<RegisterOperatorResult> {
    if (actor.rol !== "ADMINISTRADOR" || actor.estado !== "ACTIVO") {
      throw new AuthorizationError(
        "Solo un administrador activo puede registrar operadores logísticos."
      );
    }

    const nombreCompleto = NombreCompleto.create(input.nombreCompleto);
    const correo = CorreoElectronico.create(input.correoElectronico);
    const documento = DocumentoIdentidad.create(input.documentoIdentidad);
    const nombreOperador = textoRequerido(
      input.nombreOperador,
      "El nombre del operador",
      120
    );
    if (
      typeof input.credencial !== "string" ||
      input.credencial.length < PASSWORD_MIN_LENGTH ||
      input.credencial.length > PASSWORD_MAX_LENGTH
    ) {
      throw new ValidationError(
        `La credencial debe tener entre ${PASSWORD_MIN_LENGTH} y ${PASSWORD_MAX_LENGTH} caracteres.`
      );
    }

    const bodegaIds = [
      ...new Set(input.bodegaIds.map((id) => textoRequerido(id, "La bodega")))
    ];
    if (bodegaIds.length === 0) {
      throw new ValidationError(
        "El operador logístico necesita al menos una bodega asignada."
      );
    }

    if (await this.store.existsByEmail(correo.value)) {
      throw new UniquenessConflictError(
        "El correo electrónico ya está registrado."
      );
    }
    if (await this.store.existsByDocument(documento)) {
      throw new UniquenessConflictError(
        "El documento de identidad ya está registrado."
      );
    }

    let hashValue: string;
    try {
      hashValue = await this.hasher.hash(input.credencial);
    } catch (error) {
      throw new DependencyUnavailableError(
        "No fue posible procesar la credencial.",
        {
          cause: error instanceof Error ? error.message : "unknown"
        }
      );
    }

    return this.store.registerOperator({
      usuarioId: this.ids.usuarioId(),
      operadorId: this.ids.logisticsOperatorId(),
      nombreCompleto: nombreCompleto.value,
      correoNormalizado: correo.value,
      documento: {
        tipo: documento.tipo,
        pais: documento.pais,
        numero: documento.numero
      },
      hashCredencial: HashCredencial.create(hashValue).value,
      nombreOperador,
      bodegaIds,
      now: this.clock.now().toString()
    });
  }
}
