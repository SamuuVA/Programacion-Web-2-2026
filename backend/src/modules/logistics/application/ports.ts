import type { DireccionSnapshot } from "../../buyers/domain/direccion-entrega.js";
import type { EstadoPago, EstadoPedido } from "../../orders/application/ports.js";
import type {
  EstadoEnvio,
  EvidenciaEntrega,
  ResultadoEntrega
} from "../domain/envio.js";

/**
 * Puertos de la operación logística.
 *
 * El `operadorId` y el `usuarioId` provienen de la sesión y del perfil; nunca
 * del cuerpo de la petición. El almacén aplica siempre el ámbito de bodegas
 * asignadas: un recurso fuera de ámbito se comporta como inexistente.
 */

export interface LogisticsActor {
  readonly usuarioId: string;
  readonly operadorId: string;
  readonly nombreOperador: string;
}

export type EstadoOperadorLogistico = "ACTIVO" | "INACTIVO";

export interface LogisticsWarehouseView {
  readonly id: string;
  readonly nombre: string;
  readonly ubicacion: string;
  readonly tipo: "MARKETPLACE" | "VENDEDOR";
  readonly estado: "ACTIVA" | "INACTIVA";
  readonly vendedorId: string | null;
  readonly vendedorNombre: string | null;
}

export interface LogisticsProfileView {
  readonly id: string;
  readonly usuarioId: string;
  readonly nombreOperador: string;
  readonly estado: EstadoOperadorLogistico;
  readonly creadoEn: string;
  readonly nombreCompleto: string;
  readonly correoElectronico: string;
  readonly bodegas: readonly LogisticsWarehouseView[];
}

export interface LogisticsOrderItemView {
  readonly id: string;
  readonly productoId: string;
  readonly nombreProducto: string;
  readonly sku: string;
  readonly tipoEntrega: "FISICA" | "DIGITAL";
  readonly cantidad: number;
  readonly precioUnitarioCentavos: number;
  readonly moneda: string;
  readonly subtotalCentavos: number;
}

export interface LogisticsReservationView {
  readonly id: string;
  readonly productoId: string;
  readonly productoNombre: string;
  readonly sku: string;
  readonly bodegaId: string;
  readonly bodegaNombre: string;
  readonly cantidad: number;
  readonly estado: "ACTIVA" | "LIBERADA" | "CONSUMIDA";
}

export interface LogisticsShipmentItemView {
  readonly productoId: string;
  readonly nombreProducto: string;
  readonly sku: string;
  readonly cantidad: number;
}

export interface LogisticsEvidenceView {
  readonly tipo: string;
  readonly referencia: string;
  readonly nota: string | null;
  readonly registradaEn: string;
}

export interface LogisticsShipmentView {
  readonly id: string;
  readonly pedidoId: string;
  readonly bodegaOrigenId: string;
  readonly bodegaNombre: string;
  readonly transportista: string | null;
  readonly trackingNumber: string | null;
  readonly estado: EstadoEnvio;
  readonly creadoEn: string;
  readonly despachadoEn: string | null;
  readonly entregadoEn: string | null;
  readonly items: readonly LogisticsShipmentItemView[];
  readonly evidencia: LogisticsEvidenceView | null;
}

export interface LogisticsHistoryView {
  readonly estadoPrevio: EstadoPedido | null;
  readonly estadoNuevo: EstadoPedido;
  readonly actorId: string | null;
  readonly actorRol: string | null;
  readonly ocurridoEn: string;
  readonly referenciaTipo: string;
  readonly referenciaId: string;
  readonly correlationId: string;
}

export interface LogisticsOrderSummary {
  readonly id: string;
  readonly numero: string;
  readonly estado: EstadoPedido;
  readonly estadoPago: EstadoPago;
  readonly moneda: string;
  readonly totalCentavos: number;
  readonly itemsCount: number;
  readonly creadoEn: string;
  readonly vendedorNombre: string;
  readonly bodegasCount: number;
  readonly enviosCount: number;
  readonly reservasActivas: number;
}

export interface LogisticsOrderDetail extends LogisticsOrderSummary {
  readonly direccionEntrega: DireccionSnapshot | null;
  readonly items: readonly LogisticsOrderItemView[];
  readonly reservas: readonly LogisticsReservationView[];
  readonly envios: readonly LogisticsShipmentView[];
  readonly historial: readonly LogisticsHistoryView[];
}

export interface LogisticsInventoryView {
  readonly productoId: string;
  readonly productoNombre: string;
  readonly sku: string;
  readonly bodegaId: string;
  readonly bodegaNombre: string;
  readonly onHand: number;
  readonly reserved: number;
  readonly unavailable: number;
  readonly disponible: number;
  readonly actualizadoEn: string;
}

export interface LogisticsSummaryView {
  readonly pedidosEnPreparacion: number;
  readonly enviosPorPreparar: number;
  readonly enviosDespachados: number;
  readonly enviosEntregados: number;
  readonly enviosConFallo: number;
  readonly bodegasAsignadas: number;
}

export interface PrepareCommand {
  readonly operadorId: string;
  readonly actorId: string;
  readonly pedidoId: string;
  readonly bodegaId: string;
  readonly transportista: string | null;
  readonly idempotencyKey: string;
  readonly now: string;
  readonly correlationId: string;
}

export interface PrepareResult {
  readonly envio: LogisticsShipmentView;
  readonly pedido: LogisticsOrderDetail;
  readonly duplicado: boolean;
}

export interface DispatchCommand {
  readonly operadorId: string;
  readonly actorId: string;
  readonly envioId: string;
  readonly transportista: string | null;
  readonly trackingNumber: string | null;
  readonly idempotencyKey: string;
  readonly now: string;
  readonly correlationId: string;
}

export interface DispatchResult {
  readonly envio: LogisticsShipmentView;
  readonly pedido: LogisticsOrderDetail;
  readonly movimientoIds: readonly string[];
  readonly duplicado: boolean;
}

export interface DeliverCommand {
  readonly operadorId: string;
  readonly actorId: string;
  readonly envioId: string;
  readonly resultado: ResultadoEntrega;
  readonly evidencia: EvidenciaEntrega;
  readonly idempotencyKey: string;
  readonly now: string;
  readonly correlationId: string;
}

export interface DeliverResult {
  readonly envio: LogisticsShipmentView;
  readonly pedido: LogisticsOrderDetail;
  readonly duplicado: boolean;
}

export interface RegisterOperatorCommand {
  readonly usuarioId: string;
  readonly operadorId: string;
  readonly nombreCompleto: string;
  readonly correoNormalizado: string;
  readonly documento: {
    readonly tipo: string;
    readonly pais: string;
    readonly numero: string;
  };
  readonly hashCredencial: string;
  readonly nombreOperador: string;
  readonly bodegaIds: readonly string[];
  readonly now: string;
}

export interface RegisterOperatorResult {
  readonly usuarioId: string;
  readonly operadorId: string;
  readonly nombreOperador: string;
  readonly bodegas: readonly string[];
}

export interface LogisticsStore {
  findProfile(usuarioId: string): Promise<LogisticsProfileView | null>;

  listWarehouses(operadorId: string): Promise<LogisticsWarehouseView[]>;
  listInventory(operadorId: string): Promise<LogisticsInventoryView[]>;

  listOrders(
    operadorId: string,
    estado: EstadoPedido | null
  ): Promise<LogisticsOrderSummary[]>;
  findOrder(
    operadorId: string,
    pedidoId: string
  ): Promise<LogisticsOrderDetail | null>;

  summary(operadorId: string): Promise<LogisticsSummaryView>;

  prepare(command: PrepareCommand): Promise<PrepareResult>;
  dispatch(command: DispatchCommand): Promise<DispatchResult>;
  deliver(command: DeliverCommand): Promise<DeliverResult>;

  existsByEmail(correoNormalizado: string): Promise<boolean>;
  existsByDocument(documento: RegisterOperatorCommand["documento"]): Promise<boolean>;
  registerOperator(command: RegisterOperatorCommand): Promise<RegisterOperatorResult>;

  healthCheck(): Promise<void>;
  close(): Promise<void>;
}
