import { Pool, type PoolClient } from "pg";
import {
  ApplicationError,
  BusinessRuleError,
  DependencyUnavailableError,
  ResourceNotFoundError,
  UniquenessConflictError
} from "../../../shared/domain/errors.js";
import type { DireccionSnapshot } from "../../buyers/domain/direccion-entrega.js";
import type { EstadoPago, EstadoPedido } from "../../orders/application/ports.js";
import {
  assertEnvioEntregable,
  assertEnvioPreparable,
  assertPedidoDespachable,
  assertPedidoPreparable,
  type EstadoEnvio
} from "../domain/envio.js";
import type {
  DeliverCommand,
  DeliverResult,
  DispatchCommand,
  DispatchResult,
  LogisticsEvidenceView,
  LogisticsHistoryView,
  LogisticsInventoryView,
  LogisticsOrderDetail,
  LogisticsOrderItemView,
  LogisticsOrderSummary,
  LogisticsProfileView,
  LogisticsReservationView,
  LogisticsShipmentItemView,
  LogisticsShipmentView,
  LogisticsStore,
  LogisticsSummaryView,
  LogisticsWarehouseView,
  PrepareCommand,
  PrepareResult,
  RegisterOperatorCommand,
  RegisterOperatorResult
} from "../application/ports.js";

type Db = Pool | PoolClient;

interface ProfileRow {
  id: string;
  usuario_id: string;
  nombre_operador: string;
  estado: LogisticsProfileView["estado"];
  creado_en: Date;
  nombre_completo: string;
  correo_normalizado: string;
}

interface WarehouseRow {
  id: string;
  nombre: string;
  ubicacion: string;
  tipo: LogisticsWarehouseView["tipo"];
  estado: LogisticsWarehouseView["estado"];
  vendedor_id: string | null;
  vendedor_nombre: string | null;
}

interface InventoryRow {
  producto_id: string;
  producto_nombre: string;
  sku: string;
  bodega_id: string;
  bodega_nombre: string;
  on_hand: number;
  reserved: number;
  unavailable: number;
  actualizado_en: Date;
}

interface OrderRow {
  id: string;
  numero: string;
  vendedor_id: string;
  estado: EstadoPedido;
  estado_pago: EstadoPago;
  moneda: string;
  total_centavos: string | number;
  items_count: number;
  creado_en: Date;
  vendedor_nombre: string;
  bodegas_count: number;
  envios_count: number;
  reservas_activas: number;
  direccion_entrega: DireccionSnapshot | null;
}

interface OrderItemRow {
  id: string;
  producto_id: string;
  nombre_producto: string;
  sku: string;
  tipo_entrega: "FISICA" | "DIGITAL";
  cantidad: number;
  precio_unitario_centavos: string | number;
  moneda: string;
  subtotal_centavos: string | number;
}

interface ReservationRow {
  id: string;
  producto_id: string;
  producto_nombre: string;
  sku: string;
  bodega_id: string;
  bodega_nombre: string;
  cantidad: number;
  estado: LogisticsReservationView["estado"];
}

interface ShipmentRow {
  id: string;
  pedido_id: string;
  bodega_origen_id: string;
  bodega_nombre: string;
  transportista: string | null;
  tracking_number: string | null;
  estado: EstadoEnvio;
  creado_en: Date;
  despachado_en: Date | null;
  entregado_en: Date | null;
}

interface ShipmentItemRow {
  producto_id: string;
  nombre_producto: string;
  sku: string;
  cantidad: number;
}

interface EvidenceRow {
  tipo: string;
  referencia: string;
  nota: string | null;
  registrada_en: Date;
}

interface HistoryRow {
  estado_previo: EstadoPedido | null;
  estado_nuevo: EstadoPedido;
  actor_id: string | null;
  actor_rol: string | null;
  ocurrido_en: Date;
  referencia_tipo: string;
  referencia_id: string;
  correlation_id: string;
}

const ORDER_SELECT = `
  SELECT o.id, o.numero, o.vendedor_id, o.estado, o.estado_pago, o.moneda,
         o.total_centavos, o.creado_en, o.direccion_entrega,
         s.nombre_comercial AS vendedor_nombre,
         COUNT(DISTINCT oi.id)::int AS items_count,
         COUNT(DISTINCT r.bodega_id)::int AS bodegas_count,
         (SELECT COUNT(*)::int
            FROM shipments sh
           WHERE sh.pedido_id = o.id
             AND sh.bodega_origen_id = ANY($1::uuid[])) AS envios_count,
         (SELECT COUNT(*)::int
            FROM inventory_reservations r2
           WHERE r2.pedido_id = o.id
             AND r2.estado = 'ACTIVA'
             AND r2.bodega_id = ANY($1::uuid[])) AS reservas_activas
    FROM orders o
    JOIN sellers s ON s.id = o.vendedor_id
    LEFT JOIN order_items oi ON oi.pedido_id = o.id
    JOIN inventory_reservations r
      ON r.pedido_id = o.id AND r.bodega_id = ANY($1::uuid[])
`;

export class PostgresLogisticsStore implements LogisticsStore {
  private readonly pool: Pool;

  constructor(
    connectionString: string,
    private readonly ids: {
      shipmentId(): string;
      shipmentItemId(): string;
      shipmentEventId(): string;
      deliveryEvidenceId(): string;
      orderStatusHistoryId(): string;
      logisticsOperationId(): string;
      movimientoInventarioId(): string;
    }
  ) {
    this.pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000
    });
  }

  async findProfile(usuarioId: string): Promise<LogisticsProfileView | null> {
    try {
      const result = await this.pool.query<ProfileRow>(
        `SELECT lo.id, lo.usuario_id, lo.nombre_operador, lo.estado, lo.creado_en,
                u.nombre_completo, u.correo_normalizado
           FROM logistics_operators lo
           JOIN users u ON u.id = lo.usuario_id
          WHERE lo.usuario_id = $1`,
        [usuarioId]
      );
      const row = result.rows[0];
      if (!row) {
        return null;
      }
      const bodegas = await this.listWarehouses(row.id);
      return {
        id: row.id,
        usuarioId: row.usuario_id,
        nombreOperador: row.nombre_operador,
        estado: row.estado,
        creadoEn: row.creado_en.toISOString(),
        nombreCompleto: row.nombre_completo,
        correoElectronico: row.correo_normalizado,
        bodegas
      };
    } catch (error) {
      throw readError(error);
    }
  }

  async listWarehouses(operadorId: string): Promise<LogisticsWarehouseView[]> {
    try {
      const result = await this.pool.query<WarehouseRow>(
        `SELECT w.id, w.nombre, w.ubicacion, w.tipo, w.estado,
                w.vendedor_id, s.nombre_comercial AS vendedor_nombre
           FROM logistics_operator_warehouses low
           JOIN warehouses w ON w.id = low.bodega_id
           LEFT JOIN sellers s ON s.id = w.vendedor_id
          WHERE low.operador_id = $1
          ORDER BY w.nombre ASC, w.id ASC`,
        [operadorId]
      );
      return result.rows.map(toWarehouse);
    } catch (error) {
      throw readError(error);
    }
  }

  async listInventory(operadorId: string): Promise<LogisticsInventoryView[]> {
    try {
      const result = await this.pool.query<InventoryRow>(
        `SELECT i.producto_id, p.nombre AS producto_nombre, p.sku,
                i.bodega_id, w.nombre AS bodega_nombre,
                i.on_hand, i.reserved, i.unavailable, i.actualizado_en
           FROM inventory i
           JOIN products p ON p.id = i.producto_id
           JOIN warehouses w ON w.id = i.bodega_id
           JOIN logistics_operator_warehouses low ON low.bodega_id = i.bodega_id
          WHERE low.operador_id = $1
          ORDER BY w.nombre ASC, p.nombre ASC`,
        [operadorId]
      );
      return result.rows.map(toInventory);
    } catch (error) {
      throw readError(error);
    }
  }

  async listOrders(
    operadorId: string,
    estado: EstadoPedido | null
  ): Promise<LogisticsOrderSummary[]> {
    try {
      const bodegaIds = await this.assignedWarehouseIds(this.pool, operadorId);
      if (bodegaIds.length === 0) {
        return [];
      }
      const result = await this.pool.query<OrderRow>(
        `${ORDER_SELECT}
          WHERE ($2::text IS NULL OR o.estado = $2)
          GROUP BY o.id, s.nombre_comercial
          ORDER BY o.creado_en DESC, o.id DESC`,
        [bodegaIds, estado]
      );
      return result.rows.map(toOrderSummary);
    } catch (error) {
      throw readError(error);
    }
  }

  async findOrder(
    operadorId: string,
    pedidoId: string
  ): Promise<LogisticsOrderDetail | null> {
    try {
      const bodegaIds = await this.assignedWarehouseIds(this.pool, operadorId);
      if (bodegaIds.length === 0) {
        return null;
      }
      return this.loadOrderDetail(this.pool, bodegaIds, pedidoId);
    } catch (error) {
      throw readError(error);
    }
  }

  async summary(operadorId: string): Promise<LogisticsSummaryView> {
    try {
      const result = await this.pool.query<{
        pedidos_en_preparacion: number;
        envios_por_preparar: number;
        envios_despachados: number;
        envios_entregados: number;
        envios_con_fallo: number;
        bodegas_asignadas: number;
      }>(
        `WITH scope AS (
           SELECT bodega_id FROM logistics_operator_warehouses WHERE operador_id = $1
         )
         SELECT
           (SELECT COUNT(DISTINCT o.id)::int
              FROM orders o
              JOIN inventory_reservations r ON r.pedido_id = o.id
             WHERE r.bodega_id IN (SELECT bodega_id FROM scope)
               AND o.estado = 'EN_PREPARACION') AS pedidos_en_preparacion,
           (SELECT COUNT(*)::int FROM shipments sh
             WHERE sh.bodega_origen_id IN (SELECT bodega_id FROM scope)
               AND sh.estado IN ('PREPARACION', 'EMPACADO')) AS envios_por_preparar,
           (SELECT COUNT(*)::int FROM shipments sh
             WHERE sh.bodega_origen_id IN (SELECT bodega_id FROM scope)
               AND sh.estado IN ('DESPACHADO', 'EN_TRANSITO')) AS envios_despachados,
           (SELECT COUNT(*)::int FROM shipments sh
             WHERE sh.bodega_origen_id IN (SELECT bodega_id FROM scope)
               AND sh.estado = 'ENTREGADO') AS envios_entregados,
           (SELECT COUNT(*)::int FROM shipments sh
             WHERE sh.bodega_origen_id IN (SELECT bodega_id FROM scope)
               AND sh.estado IN ('FALLIDO', 'DEVUELTO')) AS envios_con_fallo,
           (SELECT COUNT(*)::int FROM scope) AS bodegas_asignadas`,
        [operadorId]
      );
      const row = result.rows[0];
      return {
        pedidosEnPreparacion: row?.pedidos_en_preparacion ?? 0,
        enviosPorPreparar: row?.envios_por_preparar ?? 0,
        enviosDespachados: row?.envios_despachados ?? 0,
        enviosEntregados: row?.envios_entregados ?? 0,
        enviosConFallo: row?.envios_con_fallo ?? 0,
        bodegasAsignadas: row?.bodegas_asignadas ?? 0
      };
    } catch (error) {
      throw readError(error);
    }
  }

  async prepare(command: PrepareCommand): Promise<PrepareResult> {
    const client = await this.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1)::bigint)", [
        `logistics:${command.operadorId}:PREPARAR:${command.idempotencyKey}`
      ]);

      const existing = await client.query<{ envio_id: string }>(
        `SELECT envio_id
           FROM logistics_operations
          WHERE operador_id = $1 AND tipo = 'PREPARAR' AND idempotency_key = $2`,
        [command.operadorId, command.idempotencyKey]
      );
      if (existing.rows[0]) {
        const envio = await this.loadShipment(client, existing.rows[0].envio_id);
        if (
          envio === null ||
          envio.pedidoId !== command.pedidoId ||
          envio.bodegaOrigenId !== command.bodegaId
        ) {
          throw new BusinessRuleError(
            "La clave de idempotencia ya fue utilizada con otros datos.",
            { motivo: "IDEMPOTENCIA_CONFLICTO" }
          );
        }
        const pedido = await this.requireOrderDetail(
          client,
          command.operadorId,
          command.pedidoId
        );
        await client.query("COMMIT");
        return { envio, pedido, duplicado: true };
      }

      await this.assertWarehouseInScope(client, command.operadorId, command.bodegaId);

      const order = await client.query<OrderRow>(
        `SELECT o.id, o.numero, o.vendedor_id, o.estado, o.estado_pago, o.moneda, o.total_centavos,
                o.creado_en, o.direccion_entrega,
                s.nombre_comercial AS vendedor_nombre,
                0 AS items_count, 0 AS bodegas_count, 0 AS envios_count,
                0 AS reservas_activas
           FROM orders o
           JOIN sellers s ON s.id = o.vendedor_id
          WHERE o.id = $1
          FOR UPDATE`,
        [command.pedidoId]
      );
      const orderRow = order.rows[0];
      if (!orderRow) {
        throw new ResourceNotFoundError(
          "El pedido no existe o no pertenece a tu ámbito logístico."
        );
      }
      assertPedidoPreparable(orderRow.estado);

      const reservations = await client.query<{ producto_id: string; cantidad: number }>(
        `SELECT producto_id, SUM(cantidad)::int AS cantidad
           FROM inventory_reservations
          WHERE pedido_id = $1 AND bodega_id = $2 AND estado = 'ACTIVA'
          GROUP BY producto_id
          ORDER BY producto_id ASC`,
        [command.pedidoId, command.bodegaId]
      );
      if (reservations.rows.length === 0) {
        throw new BusinessRuleError(
          "La bodega no tiene reservas activas para este pedido.",
          { motivo: "SIN_RESERVAS" }
        );
      }

      const already = await client.query<{ id: string }>(
        `SELECT id FROM shipments WHERE pedido_id = $1 AND bodega_origen_id = $2`,
        [command.pedidoId, command.bodegaId]
      );
      if (already.rows[0]) {
        throw new BusinessRuleError(
          "El envío de esta bodega ya fue preparado para el pedido.",
          { motivo: "ENVIO_YA_PREPARADO" }
        );
      }

      const envioId = this.ids.shipmentId();
      await client.query(
        `INSERT INTO shipments (
           id, pedido_id, bodega_origen_id, transportista, tracking_number,
           estado, creado_en, actualizado_en, despachado_en, entregado_en, version
         ) VALUES ($1, $2, $3, $4, NULL, 'PREPARACION', $5, $5, NULL, NULL, 1)`,
        [
          envioId,
          command.pedidoId,
          command.bodegaId,
          command.transportista,
          command.now
        ]
      );

      for (const reservation of reservations.rows) {
        await client.query(
          `INSERT INTO shipment_items (id, envio_id, producto_id, cantidad)
           VALUES ($1, $2, $3, $4)`,
          [
            this.ids.shipmentItemId(),
            envioId,
            reservation.producto_id,
            reservation.cantidad
          ]
        );
      }

      await this.insertShipmentEvent(client, {
        envioId,
        estadoPrevio: null,
        estadoNuevo: "PREPARACION",
        actorId: command.actorId,
        now: command.now,
        referenciaTipo: "PEDIDO",
        referenciaId: command.pedidoId,
        correlationId: command.correlationId
      });
      await this.insertOperation(client, {
        operadorId: command.operadorId,
        tipo: "PREPARAR",
        idempotencyKey: command.idempotencyKey,
        envioId,
        now: command.now
      });

      if (orderRow.estado !== "EN_PREPARACION") {
        await this.changeOrderState(client, {
          pedidoId: command.pedidoId,
          estadoPrevio: orderRow.estado,
          estadoNuevo: "EN_PREPARACION",
          actorId: command.actorId,
          actorRol: "OPERADOR_LOGISTICO",
          now: command.now,
          referenciaTipo: "ENVIO",
          referenciaId: envioId,
          correlationId: command.correlationId
        });
      }

      const envio = await this.loadShipment(client, envioId);
      const pedido = await this.requireOrderDetail(
        client,
        command.operadorId,
        command.pedidoId
      );
      if (envio === null) {
        throw new DependencyUnavailableError("El envío preparado no pudo recuperarse.");
      }
      await client.query("COMMIT");
      return { envio, pedido, duplicado: false };
    } catch (error) {
      await rollback(client);
      throw writeError(error);
    } finally {
      client.release();
    }
  }

  async dispatch(command: DispatchCommand): Promise<DispatchResult> {
    const client = await this.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1)::bigint)", [
        `logistics:${command.operadorId}:DESPACHAR:${command.idempotencyKey}`
      ]);

      const existing = await client.query<{ envio_id: string }>(
        `SELECT envio_id
           FROM logistics_operations
          WHERE operador_id = $1 AND tipo = 'DESPACHAR' AND idempotency_key = $2`,
        [command.operadorId, command.idempotencyKey]
      );
      if (existing.rows[0]) {
        if (existing.rows[0].envio_id !== command.envioId) {
          throw new BusinessRuleError(
            "La clave de idempotencia ya fue utilizada con otros datos.",
            { motivo: "IDEMPOTENCIA_CONFLICTO" }
          );
        }
        const envio = await this.loadShipment(client, command.envioId);
        if (envio === null) {
          throw new ResourceNotFoundError(ENVIO_NO_ENCONTRADO);
        }
        const pedido = await this.requireOrderDetail(
          client,
          command.operadorId,
          envio.pedidoId
        );
        await client.query("COMMIT");
        return { envio, pedido, movimientoIds: [], duplicado: true };
      }

      const shipment = await this.lockShipment(client, command.envioId);
      await this.assertWarehouseInScope(
        client,
        command.operadorId,
        shipment.bodega_origen_id
      );

      const order = await client.query<OrderRow>(
        `SELECT o.id, o.numero, o.vendedor_id, o.estado, o.estado_pago, o.moneda, o.total_centavos,
                o.creado_en, o.direccion_entrega,
                s.nombre_comercial AS vendedor_nombre,
                0 AS items_count, 0 AS bodegas_count, 0 AS envios_count,
                0 AS reservas_activas
           FROM orders o
           JOIN sellers s ON s.id = o.vendedor_id
          WHERE o.id = $1
          FOR UPDATE`,
        [shipment.pedido_id]
      );
      const orderRow = order.rows[0];
      if (!orderRow) {
        throw new ResourceNotFoundError(
          "El pedido no existe o no pertenece a tu ámbito logístico."
        );
      }
      assertPedidoDespachable(orderRow.estado);
      assertEnvioPreparable(shipment.estado);

      const items = await client.query<ShipmentItemRow>(
        `SELECT si.producto_id, p.nombre AS nombre_producto, p.sku, si.cantidad
           FROM shipment_items si
           JOIN products p ON p.id = si.producto_id
          WHERE si.envio_id = $1
          ORDER BY p.nombre ASC`,
        [command.envioId]
      );
      if (items.rows.length === 0) {
        throw new BusinessRuleError("El envío no tiene líneas para despachar.", {
          motivo: "ENVIO_SIN_ITEMS"
        });
      }

      const movimientoIds: string[] = [];
      for (const item of items.rows) {
        const reservation = await client.query<{ cantidad: number }>(
          `SELECT COALESCE(SUM(cantidad), 0)::int AS cantidad
             FROM inventory_reservations
            WHERE pedido_id = $1 AND bodega_id = $2 AND producto_id = $3
              AND estado = 'ACTIVA'`,
          [shipment.pedido_id, shipment.bodega_origen_id, item.producto_id]
        );
        if ((reservation.rows[0]?.cantidad ?? 0) < item.cantidad) {
          throw new BusinessRuleError(
            "Las reservas del envío no están activas o no cubren la cantidad despachada.",
            { motivo: "SIN_RESERVAS" }
          );
        }

        const inventory = await client.query<{
          id: string;
          on_hand: number;
          reserved: number;
        }>(
          `SELECT id, on_hand, reserved
             FROM inventory
            WHERE producto_id = $1 AND bodega_id = $2
            FOR UPDATE`,
          [item.producto_id, shipment.bodega_origen_id]
        );
        const position = inventory.rows[0];
        if (!position) {
          throw new BusinessRuleError(
            "No existe inventario para el producto en la bodega del envío.",
            { motivo: "SIN_INVENTARIO" }
          );
        }
        if (position.on_hand < item.cantidad || position.reserved < item.cantidad) {
          throw new BusinessRuleError(
            "El inventario reservado no cubre la cantidad a despachar.",
            { motivo: "STOCK_INSUFICIENTE" }
          );
        }

        await client.query(
          `UPDATE inventory
              SET on_hand = on_hand - $2,
                  reserved = reserved - $2,
                  version = version + 1,
                  actualizado_en = $3
            WHERE id = $1`,
          [position.id, item.cantidad, command.now]
        );

        const movimientoId = this.ids.movimientoInventarioId();
        movimientoIds.push(movimientoId);
        await client.query(
          `INSERT INTO inventory_movements (
             id, inventario_id, producto_id, bodega_id, vendedor_id, tipo,
             cantidad, referencia_tipo, referencia_id, actor_id, motivo,
             ocurrido_en, idempotency_key
           ) VALUES ($1, $2, $3, $4, $5, 'SALIDA_VENTA', $6, 'ENVIO', $7, $8,
                     $9, $10, $11)`,
          [
            movimientoId,
            position.id,
            item.producto_id,
            shipment.bodega_origen_id,
            orderRow.vendedor_id,
            item.cantidad,
            command.envioId,
            command.actorId,
            "Despacho de pedido",
            command.now,
            `${command.idempotencyKey}:${item.producto_id}`
          ]
        );

        await client.query(
          `UPDATE inventory_reservations
              SET estado = 'CONSUMIDA', consumida_en = $4
            WHERE pedido_id = $1 AND bodega_id = $2 AND producto_id = $3
              AND estado = 'ACTIVA'`,
          [
            shipment.pedido_id,
            shipment.bodega_origen_id,
            item.producto_id,
            command.now
          ]
        );
      }

      await client.query(
        `UPDATE shipments
            SET estado = 'DESPACHADO',
                transportista = COALESCE($2, transportista),
                tracking_number = COALESCE($3, tracking_number),
                despachado_en = $4,
                actualizado_en = $4,
                version = version + 1
          WHERE id = $1`,
        [command.envioId, command.transportista, command.trackingNumber, command.now]
      );
      await this.insertShipmentEvent(client, {
        envioId: command.envioId,
        estadoPrevio: shipment.estado,
        estadoNuevo: "DESPACHADO",
        actorId: command.actorId,
        now: command.now,
        referenciaTipo: "ENVIO",
        referenciaId: command.envioId,
        correlationId: command.correlationId
      });
      await this.insertOperation(client, {
        operadorId: command.operadorId,
        tipo: "DESPACHAR",
        idempotencyKey: command.idempotencyKey,
        envioId: command.envioId,
        now: command.now
      });

      const pending = await client.query<{ pendientes: number; reservas: number }>(
        `SELECT
           (SELECT COUNT(*)::int FROM shipments
             WHERE pedido_id = $1 AND estado IN ('PREPARACION', 'EMPACADO')) AS pendientes,
           (SELECT COUNT(*)::int FROM inventory_reservations
             WHERE pedido_id = $1 AND estado = 'ACTIVA') AS reservas`,
        [shipment.pedido_id]
      );
      const stillPending =
        (pending.rows[0]?.pendientes ?? 0) > 0 ||
        (pending.rows[0]?.reservas ?? 0) > 0;
      if (!stillPending && orderRow.estado !== "DESPACHADO") {
        await this.changeOrderState(client, {
          pedidoId: shipment.pedido_id,
          estadoPrevio: orderRow.estado,
          estadoNuevo: "DESPACHADO",
          actorId: command.actorId,
          actorRol: "OPERADOR_LOGISTICO",
          now: command.now,
          referenciaTipo: "ENVIO",
          referenciaId: command.envioId,
          correlationId: command.correlationId
        });
      }

      const envio = await this.loadShipment(client, command.envioId);
      const pedido = await this.requireOrderDetail(
        client,
        command.operadorId,
        shipment.pedido_id
      );
      if (envio === null) {
        throw new DependencyUnavailableError("El envío despachado no pudo recuperarse.");
      }
      await client.query("COMMIT");
      return { envio, pedido, movimientoIds, duplicado: false };
    } catch (error) {
      await rollback(client);
      throw writeError(error);
    } finally {
      client.release();
    }
  }

  async deliver(command: DeliverCommand): Promise<DeliverResult> {
    const client = await this.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1)::bigint)", [
        `logistics:${command.operadorId}:ENTREGAR:${command.idempotencyKey}`
      ]);

      const existing = await client.query<{ envio_id: string }>(
        `SELECT envio_id
           FROM logistics_operations
          WHERE operador_id = $1 AND tipo = 'ENTREGAR' AND idempotency_key = $2`,
        [command.operadorId, command.idempotencyKey]
      );
      if (existing.rows[0]) {
        if (existing.rows[0].envio_id !== command.envioId) {
          throw new BusinessRuleError(
            "La clave de idempotencia ya fue utilizada con otros datos.",
            { motivo: "IDEMPOTENCIA_CONFLICTO" }
          );
        }
        const envio = await this.loadShipment(client, command.envioId);
        if (envio === null) {
          throw new ResourceNotFoundError(ENVIO_NO_ENCONTRADO);
        }
        const pedido = await this.requireOrderDetail(
          client,
          command.operadorId,
          envio.pedidoId
        );
        await client.query("COMMIT");
        return { envio, pedido, duplicado: true };
      }

      const shipment = await this.lockShipment(client, command.envioId);
      await this.assertWarehouseInScope(
        client,
        command.operadorId,
        shipment.bodega_origen_id
      );
      const order = await client.query<OrderRow>(
        `SELECT o.id, o.numero, o.vendedor_id, o.estado, o.estado_pago, o.moneda, o.total_centavos,
                o.creado_en, o.direccion_entrega,
                s.nombre_comercial AS vendedor_nombre,
                0 AS items_count, 0 AS bodegas_count, 0 AS envios_count,
                0 AS reservas_activas
           FROM orders o
           JOIN sellers s ON s.id = o.vendedor_id
          WHERE o.id = $1
          FOR UPDATE`,
        [shipment.pedido_id]
      );
      const orderRow = order.rows[0];
      if (!orderRow) {
        throw new ResourceNotFoundError(
          "El pedido no existe o no pertenece a tu ámbito logístico."
        );
      }
      assertEnvioEntregable(shipment.estado);

      await client.query(
        `INSERT INTO delivery_evidence (
           id, envio_id, tipo, referencia, nota, registrada_por, registrada_en
         ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          this.ids.deliveryEvidenceId(),
          command.envioId,
          command.evidencia.tipo,
          command.evidencia.referencia,
          command.evidencia.nota,
          command.actorId,
          command.now
        ]
      );

      const entregado = command.resultado === "ENTREGADO";
      await client.query(
        `UPDATE shipments
            SET estado = $2,
                entregado_en = CASE WHEN $2 = 'ENTREGADO' THEN $3 ELSE entregado_en END,
                actualizado_en = $3,
                version = version + 1
          WHERE id = $1`,
        [command.envioId, command.resultado, command.now]
      );
      await this.insertShipmentEvent(client, {
        envioId: command.envioId,
        estadoPrevio: shipment.estado,
        estadoNuevo: command.resultado,
        actorId: command.actorId,
        now: command.now,
        referenciaTipo: "EVIDENCIA",
        referenciaId: command.evidencia.referencia,
        correlationId: command.correlationId
      });
      await this.insertOperation(client, {
        operadorId: command.operadorId,
        tipo: "ENTREGAR",
        idempotencyKey: command.idempotencyKey,
        envioId: command.envioId,
        now: command.now
      });

      if (entregado && orderRow.estado !== "ENTREGADO") {
        const pending = await client.query<{ pendientes: number; reservas: number }>(
          `SELECT
             (SELECT COUNT(*)::int FROM shipments
               WHERE pedido_id = $1 AND estado <> 'ENTREGADO') AS pendientes,
             (SELECT COUNT(*)::int FROM inventory_reservations
               WHERE pedido_id = $1 AND estado = 'ACTIVA') AS reservas`,
          [shipment.pedido_id]
        );
        const allDelivered =
          (pending.rows[0]?.pendientes ?? 0) === 0 &&
          (pending.rows[0]?.reservas ?? 0) === 0;
        if (allDelivered) {
          await client.query(
            `UPDATE orders
                SET estado = 'ENTREGADO', entregado_en = $2, actualizado_en = $2
              WHERE id = $1`,
            [shipment.pedido_id, command.now]
          );
          await this.insertOrderHistory(client, {
            pedidoId: shipment.pedido_id,
            estadoPrevio: orderRow.estado,
            estadoNuevo: "ENTREGADO",
            actorId: command.actorId,
            actorRol: "OPERADOR_LOGISTICO",
            now: command.now,
            referenciaTipo: "ENVIO",
            referenciaId: command.envioId,
            correlationId: command.correlationId
          });
        }
      }

      const envio = await this.loadShipment(client, command.envioId);
      const pedido = await this.requireOrderDetail(
        client,
        command.operadorId,
        shipment.pedido_id
      );
      if (envio === null) {
        throw new DependencyUnavailableError(
          "El envío actualizado no pudo recuperarse."
        );
      }
      await client.query("COMMIT");
      return { envio, pedido, duplicado: false };
    } catch (error) {
      await rollback(client);
      throw writeError(error);
    } finally {
      client.release();
    }
  }

  async existsByEmail(correoNormalizado: string): Promise<boolean> {
    try {
      const result = await this.pool.query(
        "SELECT 1 FROM users WHERE correo_normalizado = $1",
        [correoNormalizado]
      );
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      throw readError(error);
    }
  }

  async existsByDocument(
    documento: RegisterOperatorCommand["documento"]
  ): Promise<boolean> {
    try {
      const result = await this.pool.query(
        `SELECT 1 FROM users
          WHERE documento_tipo = $1 AND documento_pais = $2 AND documento_numero = $3`,
        [documento.tipo, documento.pais, documento.numero]
      );
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      throw readError(error);
    }
  }

  async registerOperator(
    command: RegisterOperatorCommand
  ): Promise<RegisterOperatorResult> {
    const client = await this.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO users (
           id, nombre_completo, correo_normalizado, documento_tipo, documento_pais,
           documento_numero, hash_credencial, rol, estado, creado_en, actualizado_en
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'OPERADOR_LOGISTICO', 'ACTIVO', $8, $8)`,
        [
          command.usuarioId,
          command.nombreCompleto,
          command.correoNormalizado,
          command.documento.tipo,
          command.documento.pais,
          command.documento.numero,
          command.hashCredencial,
          command.now
        ]
      );

      const warehouses = await client.query<{ id: string; estado: string }>(
        `SELECT id, estado FROM warehouses WHERE id = ANY($1::uuid[])`,
        [command.bodegaIds]
      );
      const found = new Map(warehouses.rows.map((row) => [row.id, row.estado]));
      for (const bodegaId of command.bodegaIds) {
        const estado = found.get(bodegaId);
        if (estado === undefined) {
          throw new ResourceNotFoundError(
            "Una de las bodegas asignadas no existe."
          );
        }
        if (estado !== "ACTIVA") {
          throw new BusinessRuleError(
            "Solo pueden asignarse bodegas activas a un operador logístico.",
            { motivo: "BODEGA_INACTIVA", bodegaId }
          );
        }
      }

      await client.query(
        `INSERT INTO logistics_operators (
           id, usuario_id, nombre_operador, estado, creado_en
         ) VALUES ($1, $2, $3, 'ACTIVO', $4)`,
        [command.operadorId, command.usuarioId, command.nombreOperador, command.now]
      );

      for (const bodegaId of command.bodegaIds) {
        await client.query(
          `INSERT INTO logistics_operator_warehouses (operador_id, bodega_id, asignada_en)
           VALUES ($1, $2, $3)`,
          [command.operadorId, bodegaId, command.now]
        );
      }

      await client.query("COMMIT");
      return {
        usuarioId: command.usuarioId,
        operadorId: command.operadorId,
        nombreOperador: command.nombreOperador,
        bodegas: command.bodegaIds
      };
    } catch (error) {
      await rollback(client);
      throw writeError(error);
    } finally {
      client.release();
    }
  }

  async healthCheck(): Promise<void> {
    try {
      await this.pool.query("SELECT 1");
    } catch (error) {
      throw new DependencyUnavailableError(
        "No fue posible comprobar la base de datos logística.",
        { cause: messageOf(error) }
      );
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  private async assignedWarehouseIds(
    db: Db,
    operadorId: string
  ): Promise<string[]> {
    const result = await db.query<{ bodega_id: string }>(
      `SELECT bodega_id FROM logistics_operator_warehouses WHERE operador_id = $1`,
      [operadorId]
    );
    return result.rows.map((row) => row.bodega_id);
  }

  private async assertWarehouseInScope(
    client: PoolClient,
    operadorId: string,
    bodegaId: string
  ): Promise<void> {
    const result = await client.query<{ estado: string }>(
      `SELECT w.estado
         FROM logistics_operator_warehouses low
         JOIN warehouses w ON w.id = low.bodega_id
        WHERE low.operador_id = $1 AND low.bodega_id = $2`,
      [operadorId, bodegaId]
    );
    const row = result.rows[0];
    if (!row) {
      throw new ResourceNotFoundError(
        "La bodega no existe o no pertenece a tu ámbito logístico."
      );
    }
    if (row.estado !== "ACTIVA") {
      throw new BusinessRuleError(
        "La bodega del envío no está activa.",
        { motivo: "BODEGA_INACTIVA" }
      );
    }
  }

  private async lockShipment(
    client: PoolClient,
    envioId: string
  ): Promise<ShipmentRow> {
    const result = await client.query<ShipmentRow>(
      `SELECT sh.id, sh.pedido_id, sh.bodega_origen_id, w.nombre AS bodega_nombre,
              sh.transportista, sh.tracking_number, sh.estado, sh.creado_en,
              sh.despachado_en, sh.entregado_en
         FROM shipments sh
         JOIN warehouses w ON w.id = sh.bodega_origen_id
        WHERE sh.id = $1
        FOR UPDATE`,
      [envioId]
    );
    const row = result.rows[0];
    if (!row) {
      throw new ResourceNotFoundError(ENVIO_NO_ENCONTRADO);
    }
    return row;
  }

  private async loadShipment(
    db: Db,
    envioId: string
  ): Promise<LogisticsShipmentView | null> {
    const result = await db.query<ShipmentRow>(
      `SELECT sh.id, sh.pedido_id, sh.bodega_origen_id, w.nombre AS bodega_nombre,
              sh.transportista, sh.tracking_number, sh.estado, sh.creado_en,
              sh.despachado_en, sh.entregado_en
         FROM shipments sh
         JOIN warehouses w ON w.id = sh.bodega_origen_id
        WHERE sh.id = $1`,
      [envioId]
    );
    const row = result.rows[0];
    if (!row) {
      return null;
    }
    const items = await db.query<ShipmentItemRow>(
      `SELECT si.producto_id, p.nombre AS nombre_producto, p.sku, si.cantidad
         FROM shipment_items si
         JOIN products p ON p.id = si.producto_id
        WHERE si.envio_id = $1
        ORDER BY p.nombre ASC`,
      [envioId]
    );
    const evidence = await db.query<EvidenceRow>(
      `SELECT tipo, referencia, nota, registrada_en
         FROM delivery_evidence
        WHERE envio_id = $1
        ORDER BY registrada_en DESC, id DESC
        LIMIT 1`,
      [envioId]
    );
    return toShipment(row, items.rows, evidence.rows[0] ?? null);
  }

  private async loadOrderDetail(
    db: Db,
    bodegaIds: readonly string[],
    pedidoId: string
  ): Promise<LogisticsOrderDetail | null> {
    const order = await db.query<OrderRow>(
      `${ORDER_SELECT}
        WHERE o.id = $2
        GROUP BY o.id, s.nombre_comercial
        LIMIT 1`,
      [bodegaIds, pedidoId]
    );
    const row = order.rows[0];
    if (!row) {
      return null;
    }

    const items = await db.query<OrderItemRow>(
      `SELECT id, producto_id, nombre_producto, sku, tipo_entrega, cantidad,
              precio_unitario_centavos, moneda, subtotal_centavos
         FROM order_items
        WHERE pedido_id = $1
        ORDER BY nombre_producto ASC, id ASC`,
      [pedidoId]
    );
    const reservations = await db.query<ReservationRow>(
      `SELECT r.id, r.producto_id, p.nombre AS producto_nombre, p.sku,
              r.bodega_id, w.nombre AS bodega_nombre, r.cantidad, r.estado
         FROM inventory_reservations r
         JOIN products p ON p.id = r.producto_id
         JOIN warehouses w ON w.id = r.bodega_id
        WHERE r.pedido_id = $1 AND r.bodega_id = ANY($2::uuid[])
        ORDER BY r.creada_en ASC, r.id ASC`,
      [pedidoId, bodegaIds]
    );
    const shipments = await db.query<ShipmentRow>(
      `SELECT sh.id, sh.pedido_id, sh.bodega_origen_id, w.nombre AS bodega_nombre,
              sh.transportista, sh.tracking_number, sh.estado, sh.creado_en,
              sh.despachado_en, sh.entregado_en
         FROM shipments sh
         JOIN warehouses w ON w.id = sh.bodega_origen_id
        WHERE sh.pedido_id = $1 AND sh.bodega_origen_id = ANY($2::uuid[])
        ORDER BY sh.creado_en ASC, sh.id ASC`,
      [pedidoId, bodegaIds]
    );
    const shipmentViews: LogisticsShipmentView[] = [];
    for (const shipment of shipments.rows) {
      const shipmentItems = await db.query<ShipmentItemRow>(
        `SELECT si.producto_id, p.nombre AS nombre_producto, p.sku, si.cantidad
           FROM shipment_items si
           JOIN products p ON p.id = si.producto_id
          WHERE si.envio_id = $1
          ORDER BY p.nombre ASC`,
        [shipment.id]
      );
      const evidence = await db.query<EvidenceRow>(
        `SELECT tipo, referencia, nota, registrada_en
           FROM delivery_evidence
          WHERE envio_id = $1
          ORDER BY registrada_en DESC, id DESC
          LIMIT 1`,
        [shipment.id]
      );
      shipmentViews.push(
        toShipment(shipment, shipmentItems.rows, evidence.rows[0] ?? null)
      );
    }
    const history = await db.query<HistoryRow>(
      `SELECT estado_previo, estado_nuevo, actor_id, actor_rol, ocurrido_en,
              referencia_tipo, referencia_id, correlation_id
         FROM order_status_history
        WHERE pedido_id = $1
        ORDER BY ocurrido_en ASC, id ASC`,
      [pedidoId]
    );

    return {
      ...toOrderSummary(row),
      direccionEntrega: row.direccion_entrega,
      items: items.rows.map(toOrderItem),
      reservas: reservations.rows.map(toReservation),
      envios: shipmentViews,
      historial: history.rows.map(toHistory)
    };
  }

  private async requireOrderDetail(
    db: Db,
    operadorId: string,
    pedidoId: string
  ): Promise<LogisticsOrderDetail> {
    const bodegaIds = await this.assignedWarehouseIds(db, operadorId);
    const detail = await this.loadOrderDetail(db, bodegaIds, pedidoId);
    if (detail === null) {
      throw new ResourceNotFoundError(
        "El pedido no existe o no pertenece a tu ámbito logístico."
      );
    }
    return detail;
  }

  private async changeOrderState(
    client: PoolClient,
    input: {
      pedidoId: string;
      estadoPrevio: EstadoPedido;
      estadoNuevo: EstadoPedido;
      actorId: string;
      actorRol: string;
      now: string;
      referenciaTipo: string;
      referenciaId: string;
      correlationId: string;
    }
  ): Promise<void> {
    await client.query(
      `UPDATE orders
          SET estado = $2, actualizado_en = $3
        WHERE id = $1`,
      [input.pedidoId, input.estadoNuevo, input.now]
    );
    await this.insertOrderHistory(client, input);
  }

  private async insertOrderHistory(
    client: PoolClient,
    input: {
      pedidoId: string;
      estadoPrevio: EstadoPedido | null;
      estadoNuevo: EstadoPedido;
      actorId: string | null;
      actorRol: string | null;
      now: string;
      referenciaTipo: string;
      referenciaId: string;
      correlationId: string;
    }
  ): Promise<void> {
    await client.query(
      `INSERT INTO order_status_history (
         id, pedido_id, estado_previo, estado_nuevo, actor_id, actor_rol,
         ocurrido_en, referencia_tipo, referencia_id, correlation_id
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        this.ids.orderStatusHistoryId(),
        input.pedidoId,
        input.estadoPrevio,
        input.estadoNuevo,
        input.actorId,
        input.actorRol,
        input.now,
        input.referenciaTipo,
        input.referenciaId,
        input.correlationId
      ]
    );
  }

  private async insertShipmentEvent(
    client: PoolClient,
    input: {
      envioId: string;
      estadoPrevio: EstadoEnvio | null;
      estadoNuevo: EstadoEnvio;
      actorId: string;
      now: string;
      referenciaTipo: string;
      referenciaId: string;
      correlationId: string;
    }
  ): Promise<void> {
    await client.query(
      `INSERT INTO shipment_events (
         id, envio_id, estado_previo, estado_nuevo, actor_id, ocurrido_en,
         referencia_tipo, referencia_id, correlation_id
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        this.ids.shipmentEventId(),
        input.envioId,
        input.estadoPrevio,
        input.estadoNuevo,
        input.actorId,
        input.now,
        input.referenciaTipo,
        input.referenciaId,
        input.correlationId
      ]
    );
  }

  private async insertOperation(
    client: PoolClient,
    input: {
      operadorId: string;
      tipo: "PREPARAR" | "DESPACHAR" | "ENTREGAR";
      idempotencyKey: string;
      envioId: string;
      now: string;
    }
  ): Promise<void> {
    await client.query(
      `INSERT INTO logistics_operations (
         id, operador_id, tipo, idempotency_key, envio_id, creado_en
       ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        this.ids.logisticsOperationId(),
        input.operadorId,
        input.tipo,
        input.idempotencyKey,
        input.envioId,
        input.now
      ]
    );
  }

  private async connect(): Promise<PoolClient> {
    try {
      return await this.pool.connect();
    } catch (error) {
      throw new DependencyUnavailableError(
        "No fue posible conectar con la base de datos logística.",
        { cause: messageOf(error) }
      );
    }
  }
}

const ENVIO_NO_ENCONTRADO =
  "El envío no existe o no pertenece a tu ámbito logístico.";

function toWarehouse(row: WarehouseRow): LogisticsWarehouseView {
  return {
    id: row.id,
    nombre: row.nombre,
    ubicacion: row.ubicacion,
    tipo: row.tipo,
    estado: row.estado,
    vendedorId: row.vendedor_id,
    vendedorNombre: row.vendedor_nombre
  };
}

function toInventory(row: InventoryRow): LogisticsInventoryView {
  return {
    productoId: row.producto_id,
    productoNombre: row.producto_nombre,
    sku: row.sku,
    bodegaId: row.bodega_id,
    bodegaNombre: row.bodega_nombre,
    onHand: row.on_hand,
    reserved: row.reserved,
    unavailable: row.unavailable,
    disponible: row.on_hand - row.reserved - row.unavailable,
    actualizadoEn: row.actualizado_en.toISOString()
  };
}

function toOrderSummary(row: OrderRow): LogisticsOrderSummary {
  return {
    id: row.id,
    numero: row.numero,
    estado: row.estado,
    estadoPago: row.estado_pago,
    moneda: row.moneda,
    totalCentavos: toInteger(row.total_centavos),
    itemsCount: row.items_count,
    creadoEn: row.creado_en.toISOString(),
    vendedorNombre: row.vendedor_nombre,
    bodegasCount: row.bodegas_count,
    enviosCount: row.envios_count,
    reservasActivas: row.reservas_activas
  };
}

function toOrderItem(row: OrderItemRow): LogisticsOrderItemView {
  return {
    id: row.id,
    productoId: row.producto_id,
    nombreProducto: row.nombre_producto,
    sku: row.sku,
    tipoEntrega: row.tipo_entrega,
    cantidad: row.cantidad,
    precioUnitarioCentavos: toInteger(row.precio_unitario_centavos),
    moneda: row.moneda,
    subtotalCentavos: toInteger(row.subtotal_centavos)
  };
}

function toReservation(row: ReservationRow): LogisticsReservationView {
  return {
    id: row.id,
    productoId: row.producto_id,
    productoNombre: row.producto_nombre,
    sku: row.sku,
    bodegaId: row.bodega_id,
    bodegaNombre: row.bodega_nombre,
    cantidad: row.cantidad,
    estado: row.estado
  };
}

function toShipment(
  row: ShipmentRow,
  items: readonly ShipmentItemRow[],
  evidence: EvidenceRow | null
): LogisticsShipmentView {
  const evidencia: LogisticsEvidenceView | null = evidence
    ? {
        tipo: evidence.tipo,
        referencia: evidence.referencia,
        nota: evidence.nota,
        registradaEn: evidence.registrada_en.toISOString()
      }
    : null;
  return {
    id: row.id,
    pedidoId: row.pedido_id,
    bodegaOrigenId: row.bodega_origen_id,
    bodegaNombre: row.bodega_nombre,
    transportista: row.transportista,
    trackingNumber: row.tracking_number,
    estado: row.estado,
    creadoEn: row.creado_en.toISOString(),
    despachadoEn: row.despachado_en?.toISOString() ?? null,
    entregadoEn: row.entregado_en?.toISOString() ?? null,
    items: items.map(toShipmentItem),
    evidencia
  };
}

function toShipmentItem(row: ShipmentItemRow): LogisticsShipmentItemView {
  return {
    productoId: row.producto_id,
    nombreProducto: row.nombre_producto,
    sku: row.sku,
    cantidad: row.cantidad
  };
}

function toHistory(row: HistoryRow): LogisticsHistoryView {
  return {
    estadoPrevio: row.estado_previo,
    estadoNuevo: row.estado_nuevo,
    actorId: row.actor_id,
    actorRol: row.actor_rol,
    ocurridoEn: row.ocurrido_en.toISOString(),
    referenciaTipo: row.referencia_tipo,
    referenciaId: row.referencia_id,
    correlationId: row.correlation_id
  };
}

function toInteger(value: string | number): number {
  return typeof value === "number" ? value : Number.parseInt(value, 10);
}

function readError(error: unknown): ApplicationError {
  if (error instanceof ApplicationError) {
    return error;
  }
  return new DependencyUnavailableError(
    "No fue posible consultar la información logística.",
    { cause: messageOf(error) }
  );
}

function writeError(error: unknown): ApplicationError {
  if (error instanceof ApplicationError) {
    return error;
  }
  if (isPgError(error, "23505")) {
    return new UniquenessConflictError(
      "La operación logística entra en conflicto con un registro existente.",
      { motivo: "CONFLICTO_UNICIDAD" }
    );
  }
  if (isPgError(error, "23503") || isPgError(error, "23514")) {
    return new BusinessRuleError(
      "La operación logística incumple una restricción de la base de datos.",
      { motivo: "OPERACION_INVALIDA" }
    );
  }
  return new DependencyUnavailableError(
    "No fue posible completar la operación logística.",
    { cause: messageOf(error) }
  );
}

function isPgError(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === code
  );
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "unknown";
}

async function rollback(client: PoolClient): Promise<void> {
  try {
    await client.query("ROLLBACK");
  } catch {
    // Se informa el error original.
  }
}
