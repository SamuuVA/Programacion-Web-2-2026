import { randomUUID } from "node:crypto";
import {
  BusinessRuleError,
  ResourceNotFoundError,
  UniquenessConflictError
} from "../../src/shared/domain/errors.js";
import {
  assertEnvioEntregable,
  assertEnvioPreparable,
  assertPedidoDespachable,
  assertPedidoPreparable,
  type ResultadoEntrega
} from "../../src/modules/logistics/domain/envio.js";
import type {
  DeliverCommand,
  DeliverResult,
  DispatchCommand,
  DispatchResult,
  LogisticsInventoryView,
  LogisticsOrderDetail,
  LogisticsProfileView,
  LogisticsShipmentView,
  LogisticsStore,
  LogisticsSummaryView,
  LogisticsWarehouseView,
  PrepareCommand,
  PrepareResult,
  RegisterOperatorCommand,
  RegisterOperatorResult
} from "../../src/modules/logistics/application/ports.js";

/**
 * Doble en memoria para pruebas HTTP y de casos de uso. El adaptador real es
 * PostgreSQL; este doble replica las precondiciones del dominio para que las
 * pruebas de autorización y transiciones no dependan de la base.
 */
export class FakeLogisticsStore implements LogisticsStore {
  private readonly profiles = new Map<string, LogisticsProfileView>();
  private readonly warehouses = new Map<string, LogisticsWarehouseView>();
  private readonly assignments = new Map<string, Set<string>>();
  private readonly inventory = new Map<string, LogisticsInventoryView>();
  private readonly orders = new Map<string, LogisticsOrderDetail>();
  private readonly shipments = new Map<string, LogisticsShipmentView>();
  private readonly operations = new Map<string, { envioId: string }>();
  private readonly emails = new Set<string>();
  private readonly documents = new Set<string>();

  seedProfile(profile: LogisticsProfileView): void {
    this.profiles.set(profile.usuarioId, profile);
    if (!this.assignments.has(profile.id)) {
      this.assignments.set(profile.id, new Set());
    }
  }

  assignWarehouse(operadorId: string, warehouse: LogisticsWarehouseView): void {
    this.warehouses.set(warehouse.id, warehouse);
    const scope = this.assignments.get(operadorId) ?? new Set<string>();
    scope.add(warehouse.id);
    this.assignments.set(operadorId, scope);
  }

  seedInventory(position: LogisticsInventoryView): void {
    this.inventory.set(`${position.productoId}:${position.bodegaId}`, position);
  }

  seedOrder(detail: LogisticsOrderDetail): void {
    this.orders.set(detail.id, detail);
  }

  seedEmail(email: string): void {
    this.emails.add(email);
  }

  seedDocument(documento: RegisterOperatorCommand["documento"]): void {
    this.documents.add(
      `${documento.tipo}:${documento.pais}:${documento.numero}`
    );
  }

  async findProfile(usuarioId: string): Promise<LogisticsProfileView | null> {
    return this.profiles.get(usuarioId) ?? null;
  }

  async listWarehouses(operadorId: string): Promise<LogisticsWarehouseView[]> {
    const scope = this.assignments.get(operadorId) ?? new Set();
    return [...scope]
      .map((id) => this.warehouses.get(id))
      .filter((value): value is LogisticsWarehouseView => value !== undefined);
  }

  async listInventory(operadorId: string): Promise<LogisticsInventoryView[]> {
    const scope = this.assignments.get(operadorId) ?? new Set();
    return [...this.inventory.values()].filter((position) =>
      scope.has(position.bodegaId)
    );
  }

  async listOrders(
    operadorId: string,
    estado: string | null
  ): Promise<LogisticsOrderDetail[]> {
    const scope = this.assignments.get(operadorId) ?? new Set();
    return [...this.orders.values()]
      .filter((order) =>
        order.reservas.some((reserva) => scope.has(reserva.bodegaId))
      )
      .filter((order) => (estado === null ? true : order.estado === estado))
      .map((order) => this.withCounters(order));
  }

  async findOrder(
    operadorId: string,
    pedidoId: string
  ): Promise<LogisticsOrderDetail | null> {
    const order = this.orders.get(pedidoId);
    if (!order) {
      return null;
    }
    const scope = this.assignments.get(operadorId) ?? new Set();
    if (!order.reservas.some((reserva) => scope.has(reserva.bodegaId))) {
      return null;
    }
    return this.withCounters(order);
  }

  async summary(operadorId: string): Promise<LogisticsSummaryView> {
    const scope = this.assignments.get(operadorId) ?? new Set();
    const shipments = [...this.shipments.values()].filter((envio) =>
      scope.has(envio.bodegaOrigenId)
    );
    const orders = [...this.orders.values()].filter((order) =>
      order.reservas.some((reserva) => scope.has(reserva.bodegaId))
    );
    return {
      pedidosEnPreparacion: orders.filter(
        (order) => order.estado === "EN_PREPARACION"
      ).length,
      enviosPorPreparar: shipments.filter(
        (envio) => envio.estado === "PREPARACION" || envio.estado === "EMPACADO"
      ).length,
      enviosDespachados: shipments.filter(
        (envio) =>
          envio.estado === "DESPACHADO" || envio.estado === "EN_TRANSITO"
      ).length,
      enviosEntregados: shipments.filter(
        (envio) => envio.estado === "ENTREGADO"
      ).length,
      enviosConFallo: shipments.filter(
        (envio) => envio.estado === "FALLIDO" || envio.estado === "DEVUELTO"
      ).length,
      bodegasAsignadas: scope.size
    };
  }

  async prepare(command: PrepareCommand): Promise<PrepareResult> {
    const previous = this.operations.get(
      operationKey(command.operadorId, "PREPARAR", command.idempotencyKey)
    );
    if (previous) {
      const envio = this.shipments.get(previous.envioId);
      if (
        !envio ||
        envio.pedidoId !== command.pedidoId ||
        envio.bodegaOrigenId !== command.bodegaId
      ) {
        throw new BusinessRuleError(
          "La clave de idempotencia ya fue utilizada con otros datos.",
          { motivo: "IDEMPOTENCIA_CONFLICTO" }
        );
      }
      return {
        envio,
        pedido: await this.requireOrder(command.operadorId, command.pedidoId),
        duplicado: true
      };
    }

    this.assertScope(command.operadorId, command.bodegaId);
    const order = await this.requireOrder(command.operadorId, command.pedidoId);
    assertPedidoPreparable(order.estado);

    const reservations = order.reservas.filter(
      (reserva) =>
        reserva.bodegaId === command.bodegaId && reserva.estado === "ACTIVA"
    );
    if (reservations.length === 0) {
      throw new BusinessRuleError(
        "La bodega no tiene reservas activas para este pedido.",
        { motivo: "SIN_RESERVAS" }
      );
    }
    if (
      order.envios.some((envio) => envio.bodegaOrigenId === command.bodegaId)
    ) {
      throw new BusinessRuleError(
        "El envío de esta bodega ya fue preparado para el pedido.",
        { motivo: "ENVIO_YA_PREPARADO" }
      );
    }

    const grouped = new Map<
      string,
      {
        productoId: string;
        nombreProducto: string;
        sku: string;
        cantidad: number;
      }
    >();
    for (const reserva of reservations) {
      const current = grouped.get(reserva.productoId);
      grouped.set(reserva.productoId, {
        productoId: reserva.productoId,
        nombreProducto: reserva.productoNombre,
        sku: reserva.sku,
        cantidad: (current?.cantidad ?? 0) + reserva.cantidad
      });
    }

    const envio: LogisticsShipmentView = {
      id: randomUUID(),
      pedidoId: command.pedidoId,
      bodegaOrigenId: command.bodegaId,
      bodegaNombre: this.warehouses.get(command.bodegaId)?.nombre ?? "Bodega",
      transportista: command.transportista,
      trackingNumber: null,
      estado: "PREPARACION",
      creadoEn: command.now,
      despachadoEn: null,
      entregadoEn: null,
      items: [...grouped.values()],
      evidencia: null
    };
    this.shipments.set(envio.id, envio);
    this.operations.set(
      operationKey(command.operadorId, "PREPARAR", command.idempotencyKey),
      { envioId: envio.id }
    );

    const updated: LogisticsOrderDetail = {
      ...order,
      estado:
        order.estado === "EN_PREPARACION" ? order.estado : "EN_PREPARACION",
      envios: [...order.envios, envio],
      historial:
        order.estado === "EN_PREPARACION"
          ? order.historial
          : [
              ...order.historial,
              history(order.estado, "EN_PREPARACION", command.now)
            ]
    };
    this.orders.set(updated.id, updated);
    return { envio, pedido: this.withCounters(updated), duplicado: false };
  }

  async dispatch(command: DispatchCommand): Promise<DispatchResult> {
    const previous = this.operations.get(
      operationKey(command.operadorId, "DESPACHAR", command.idempotencyKey)
    );
    if (previous) {
      const envio = this.shipments.get(previous.envioId);
      if (!envio || envio.id !== command.envioId) {
        throw new BusinessRuleError(
          "La clave de idempotencia ya fue utilizada con otros datos.",
          { motivo: "IDEMPOTENCIA_CONFLICTO" }
        );
      }
      return {
        envio,
        pedido: await this.requireOrder(command.operadorId, envio.pedidoId),
        movimientoIds: [],
        duplicado: true
      };
    }

    const shipment = this.shipments.get(command.envioId);
    if (!shipment) {
      throw new ResourceNotFoundError(
        "El envío no existe o no pertenece a tu ámbito logístico."
      );
    }
    this.assertScope(command.operadorId, shipment.bodegaOrigenId);
    const order = await this.requireOrder(
      command.operadorId,
      shipment.pedidoId
    );
    assertPedidoDespachable(order.estado);
    assertEnvioPreparable(shipment.estado);

    const movimientoIds: string[] = [];
    for (const item of shipment.items) {
      const position = this.inventory.get(
        `${item.productoId}:${shipment.bodegaOrigenId}`
      );
      if (!position) {
        throw new BusinessRuleError(
          "No existe inventario para el producto en la bodega del envío.",
          { motivo: "SIN_INVENTARIO" }
        );
      }
      if (
        position.onHand < item.cantidad ||
        position.reserved < item.cantidad
      ) {
        throw new BusinessRuleError(
          "El inventario reservado no cubre la cantidad a despachar.",
          { motivo: "STOCK_INSUFICIENTE" }
        );
      }
      this.inventory.set(`${item.productoId}:${shipment.bodegaOrigenId}`, {
        ...position,
        onHand: position.onHand - item.cantidad,
        reserved: position.reserved - item.cantidad,
        disponible:
          position.onHand -
          item.cantidad -
          (position.reserved - item.cantidad) -
          position.unavailable,
        actualizadoEn: command.now
      });
      movimientoIds.push(randomUUID());
    }

    const updatedShipment: LogisticsShipmentView = {
      ...shipment,
      estado: "DESPACHADO",
      transportista: command.transportista ?? shipment.transportista,
      trackingNumber: command.trackingNumber ?? shipment.trackingNumber,
      despachadoEn: command.now
    };
    this.shipments.set(updatedShipment.id, updatedShipment);
    this.operations.set(
      operationKey(command.operadorId, "DESPACHAR", command.idempotencyKey),
      { envioId: updatedShipment.id }
    );

    const reservas = order.reservas.map((reserva) =>
      reserva.bodegaId === shipment.bodegaOrigenId &&
      reserva.estado === "ACTIVA"
        ? { ...reserva, estado: "CONSUMIDA" as const }
        : reserva
    );
    const envios = order.envios.map((envio) =>
      envio.id === updatedShipment.id ? updatedShipment : envio
    );
    const pending =
      envios.some(
        (envio) => envio.estado === "PREPARACION" || envio.estado === "EMPACADO"
      ) || reservas.some((reserva) => reserva.estado === "ACTIVA");
    const updatedOrder: LogisticsOrderDetail = {
      ...order,
      estado: pending ? order.estado : "DESPACHADO",
      reservas,
      envios,
      historial: pending
        ? order.historial
        : [...order.historial, history(order.estado, "DESPACHADO", command.now)]
    };
    this.orders.set(updatedOrder.id, updatedOrder);
    return {
      envio: updatedShipment,
      pedido: this.withCounters(updatedOrder),
      movimientoIds,
      duplicado: false
    };
  }

  async deliver(command: DeliverCommand): Promise<DeliverResult> {
    const previous = this.operations.get(
      operationKey(command.operadorId, "ENTREGAR", command.idempotencyKey)
    );
    if (previous) {
      const envio = this.shipments.get(previous.envioId);
      if (!envio || envio.id !== command.envioId) {
        throw new BusinessRuleError(
          "La clave de idempotencia ya fue utilizada con otros datos.",
          { motivo: "IDEMPOTENCIA_CONFLICTO" }
        );
      }
      return {
        envio,
        pedido: await this.requireOrder(command.operadorId, envio.pedidoId),
        duplicado: true
      };
    }

    const shipment = this.shipments.get(command.envioId);
    if (!shipment) {
      throw new ResourceNotFoundError(
        "El envío no existe o no pertenece a tu ámbito logístico."
      );
    }
    this.assertScope(command.operadorId, shipment.bodegaOrigenId);
    assertEnvioEntregable(shipment.estado);
    const order = await this.requireOrder(
      command.operadorId,
      shipment.pedidoId
    );

    const updatedShipment: LogisticsShipmentView = {
      ...shipment,
      estado: command.resultado,
      entregadoEn:
        command.resultado === "ENTREGADO" ? command.now : shipment.entregadoEn,
      evidencia: {
        tipo: command.evidencia.tipo,
        referencia: command.evidencia.referencia,
        nota: command.evidencia.nota,
        registradaEn: command.now
      }
    };
    this.shipments.set(updatedShipment.id, updatedShipment);
    this.operations.set(
      operationKey(command.operadorId, "ENTREGAR", command.idempotencyKey),
      { envioId: updatedShipment.id }
    );

    const envios = order.envios.map((envio) =>
      envio.id === updatedShipment.id ? updatedShipment : envio
    );
    const allDelivered =
      command.resultado === "ENTREGADO" &&
      envios.every((envio) => envio.estado === "ENTREGADO") &&
      order.reservas.every((reserva) => reserva.estado !== "ACTIVA");
    const updatedOrder: LogisticsOrderDetail = {
      ...order,
      estado: allDelivered ? "ENTREGADO" : order.estado,
      envios,
      historial: allDelivered
        ? [...order.historial, history(order.estado, "ENTREGADO", command.now)]
        : order.historial
    };
    this.orders.set(updatedOrder.id, updatedOrder);
    return {
      envio: updatedShipment,
      pedido: this.withCounters(updatedOrder),
      duplicado: false
    };
  }

  async existsByEmail(correoNormalizado: string): Promise<boolean> {
    return this.emails.has(correoNormalizado);
  }

  async existsByDocument(
    documento: RegisterOperatorCommand["documento"]
  ): Promise<boolean> {
    return this.documents.has(
      `${documento.tipo}:${documento.pais}:${documento.numero}`
    );
  }

  async registerOperator(
    command: RegisterOperatorCommand
  ): Promise<RegisterOperatorResult> {
    for (const bodegaId of command.bodegaIds) {
      const warehouse = this.warehouses.get(bodegaId);
      if (!warehouse) {
        throw new ResourceNotFoundError(
          "Una de las bodegas asignadas no existe."
        );
      }
      if (warehouse.estado !== "ACTIVA") {
        throw new BusinessRuleError(
          "Solo pueden asignarse bodegas activas a un operador logístico.",
          { motivo: "BODEGA_INACTIVA", bodegaId }
        );
      }
    }
    if (this.emails.has(command.correoNormalizado)) {
      throw new UniquenessConflictError(
        "El correo electrónico ya está registrado."
      );
    }
    this.emails.add(command.correoNormalizado);
    const profile: LogisticsProfileView = {
      id: command.operadorId,
      usuarioId: command.usuarioId,
      nombreOperador: command.nombreOperador,
      estado: "ACTIVO",
      creadoEn: command.now,
      nombreCompleto: command.nombreCompleto,
      correoElectronico: command.correoNormalizado,
      bodegas: []
    };
    this.profiles.set(command.usuarioId, profile);
    for (const bodegaId of command.bodegaIds) {
      this.assignWarehouse(command.operadorId, this.warehouses.get(bodegaId)!);
    }
    return {
      usuarioId: command.usuarioId,
      operadorId: command.operadorId,
      nombreOperador: command.nombreOperador,
      bodegas: command.bodegaIds
    };
  }

  async healthCheck(): Promise<void> {
    return undefined;
  }

  async close(): Promise<void> {
    return undefined;
  }

  private assertScope(operadorId: string, bodegaId: string): void {
    const scope = this.assignments.get(operadorId) ?? new Set();
    if (!scope.has(bodegaId)) {
      throw new ResourceNotFoundError(
        "La bodega no existe o no pertenece a tu ámbito logístico."
      );
    }
    const warehouse = this.warehouses.get(bodegaId);
    if (warehouse?.estado !== "ACTIVA") {
      throw new BusinessRuleError("La bodega del envío no está activa.", {
        motivo: "BODEGA_INACTIVA"
      });
    }
  }

  private async requireOrder(
    operadorId: string,
    pedidoId: string
  ): Promise<LogisticsOrderDetail> {
    const order = await this.findOrder(operadorId, pedidoId);
    if (!order) {
      throw new ResourceNotFoundError(
        "El pedido no existe o no pertenece a tu ámbito logístico."
      );
    }
    return order;
  }

  private withCounters(order: LogisticsOrderDetail): LogisticsOrderDetail {
    return {
      ...order,
      enviosCount: order.envios.length,
      reservasActivas: order.reservas.filter(
        (reserva) => reserva.estado === "ACTIVA"
      ).length,
      bodegasCount: new Set(order.reservas.map((reserva) => reserva.bodegaId))
        .size
    };
  }
}

function operationKey(operadorId: string, tipo: string, key: string): string {
  return `${operadorId}:${tipo}:${key}`;
}

function history(
  estadoPrevio: string | null,
  estadoNuevo: string,
  ocurridoEn: string
) {
  return {
    estadoPrevio: estadoPrevio as LogisticsOrderDetail["estado"] | null,
    estadoNuevo: estadoNuevo as LogisticsOrderDetail["estado"],
    actorId: null,
    actorRol: "OPERADOR_LOGISTICO",
    ocurridoEn,
    referenciaTipo: "ENVIO",
    referenciaId: "fake",
    correlationId: "fake-correlation"
  };
}

export function resultadoEntrega(value: string): ResultadoEntrega {
  return value === "FALLIDO" ? "FALLIDO" : "ENTREGADO";
}
