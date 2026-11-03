import { randomBytes } from "node:crypto";
import { Pool, type PoolClient } from "pg";
import type { IdGenerator } from "../../../shared/application/ports.js";
import {
  ApplicationError,
  BusinessRuleError,
  DependencyUnavailableError,
  ResourceNotFoundError
} from "../../../shared/domain/errors.js";
import { DireccionEntrega, type DireccionSnapshot } from "../../buyers/domain/direccion-entrega.js";
import type {
  CheckoutCommand,
  CheckoutResult,
  CheckoutStore,
  EstadoPago,
  EstadoPedido,
  OrderDetail,
  OrderItemView,
  OrderSummary,
  PaymentView
} from "../application/ports.js";

interface CartLineRow {
  producto_id: string;
  cantidad: number;
  precio_referencial_centavos: string | number;
  moneda_referencial: string;
  nombre: string;
  sku: string;
  tipo_entrega: "FISICA" | "DIGITAL";
  precio_centavos: string | number;
  moneda: string;
  estado_producto: "PUBLICADO" | "SUSPENDIDO" | "DESCONTINUADO";
  vendedor_id: string;
  vendedor_nombre: string;
  estado_vendedor: "EN_REVISION" | "ACTIVO" | "SUSPENDIDO" | "INACTIVO";
  disponible: string | number | null;
}

interface OrderRow {
  id: string;
  numero: string;
  vendedor_id: string;
  vendedor_nombre: string;
  estado: EstadoPedido;
  estado_pago: EstadoPago;
  moneda: string;
  total_centavos: string | number;
  items_count: number;
  creado_en: Date;
  direccion_entrega: DireccionSnapshot | null;
}

interface ItemRow {
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

interface PaymentRow {
  id: string;
  estado: EstadoPago;
  proveedor: string;
  referencia: string | null;
  monto_centavos: string | number;
  moneda: string;
}

interface AddressRow {
  id: string;
  comprador_id: string;
  destinatario: string;
  telefono: string;
  linea1: string;
  linea2: string | null;
  ciudad: string;
  region: string;
  codigo_postal: string | null;
  pais: string;
  es_principal: boolean;
  creada_en: Date;
  actualizada_en: Date;
}

export class PostgresCheckoutStore implements CheckoutStore {
  private readonly pool: Pool;

  constructor(
    connectionString: string,
    private readonly ids: IdGenerator
  ) {
    this.pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000
    });
  }

  async executeCheckout(command: CheckoutCommand): Promise<CheckoutResult> {
    const client = await this.connect();
    try {
      await client.query("BEGIN");

      const cart = await client.query<{ id: string }>(
        `SELECT id FROM carts WHERE comprador_id = $1 FOR UPDATE`,
        [command.compradorId]
      );
      const cartRow = cart.rows[0];
      if (!cartRow) {
        throw new ResourceNotFoundError("El comprador no tiene un carrito activo.");
      }
      const cartId = cartRow.id;

      // Idempotencia primero: un reintento con la misma clave devuelve el
      // resultado ya confirmado sin volver a reservar ni cobrar.
      const checkoutId = this.ids.checkoutId();
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO checkout_attempts (
           id, comprador_id, idempotency_key, estado, resultado, creado_en, actualizado_en
         ) VALUES ($1, $2, $3, 'PROCESANDO', NULL, $4, $4)
         ON CONFLICT (comprador_id, idempotency_key) DO NOTHING
         RETURNING id`,
        [checkoutId, command.compradorId, command.idempotencyKey, command.now]
      );

      if (inserted.rowCount === 0) {
        const existing = await client.query<{
          id: string;
          estado: string;
          resultado: CheckoutResult | null;
        }>(
          `SELECT id, estado, resultado
             FROM checkout_attempts
            WHERE comprador_id = $1
              AND idempotency_key = $2
            LIMIT 1`,
          [command.compradorId, command.idempotencyKey]
        );
        const row = existing.rows[0];
        if (!row || row.resultado === null) {
          throw new DependencyUnavailableError(
            "El intento de checkout anterior aún no tiene un resultado disponible."
          );
        }
        await client.query("COMMIT");
        return row.resultado;
      }

      const lines = await this.loadCartLines(client, cartId);
      if (lines.length === 0) {
        throw new BusinessRuleError("El carrito está vacío.", { motivo: "CARRITO_VACIO" });
      }

      this.validateLines(lines);
      const priceChanges = lines.filter(
        (line) =>
          toInteger(line.precio_referencial_centavos) !== toInteger(line.precio_centavos) ||
          line.moneda_referencial !== line.moneda
      );
      if (priceChanges.length > 0 && !command.confirmarPrecio) {
        throw new BusinessRuleError(
          "El precio de algunos productos cambió. Revisa el nuevo total y confirma la compra.",
          {
            motivo: "PRECIO_CAMBIADO",
            cambios: priceChanges.map((line) => ({
              productoId: line.producto_id,
              nombre: line.nombre,
              precioAnteriorCentavos: toInteger(line.precio_referencial_centavos),
              precioActualCentavos: toInteger(line.precio_centavos),
              monedaAnterior: line.moneda_referencial,
              monedaActual: line.moneda
            }))
          }
        );
      }

      const currencies = new Set(lines.map((line) => line.moneda));
      if (currencies.size > 1) {
        throw new BusinessRuleError("El carrito mezcla monedas y no puede procesarse.", {
          motivo: "MONEDA_NO_SOPORTADA"
        });
      }

      const needsAddress = lines.some((line) => line.tipo_entrega === "FISICA");
      let addressSnapshot: DireccionSnapshot | null = null;
      if (command.direccionEntregaId !== null) {
        addressSnapshot = await this.loadAddressSnapshot(
          client,
          command.compradorId,
          command.direccionEntregaId,
          command.now
        );
      } else if (needsAddress) {
        throw new BusinessRuleError(
          "Debes elegir una dirección de entrega para los productos físicos.",
          { motivo: "DIRECCION_REQUERIDA" }
        );
      }

      const groups = groupBySeller(lines);
      const orderIds: string[] = [];
      for (const group of groups.values()) {
        const orderId = this.ids.orderId();
        orderIds.push(orderId);
        const totalCentavos = group.reduce(
          (sum, line) => sum + toInteger(line.precio_centavos) * line.cantidad,
          0
        );
        const groupNeedsAddress = group.some((line) => line.tipo_entrega === "FISICA");
        const orderAddress = groupNeedsAddress ? addressSnapshot : null;
        const orderNumber = makeOrderNumber(command.now);

        await client.query(
          `INSERT INTO orders (
             id, checkout_id, comprador_id, vendedor_id, numero, estado, estado_pago,
             moneda, total_centavos, direccion_entrega, creado_en, actualizado_en
           ) VALUES ($1, $2, $3, $4, $5, 'PENDIENTE_DE_PAGO', 'PENDIENTE', $6, $7, $8, $9, $9)`,
          [
            orderId,
            checkoutId,
            command.compradorId,
            group[0]!.vendedor_id,
            orderNumber,
            group[0]!.moneda,
            totalCentavos,
            orderAddress === null ? null : JSON.stringify(orderAddress),
            command.now
          ]
        );

        for (const line of group) {
          const unitPrice = toInteger(line.precio_centavos);
          const subtotal = unitPrice * line.cantidad;
          await client.query(
            `INSERT INTO order_items (
               id, pedido_id, producto_id, vendedor_id, nombre_producto, sku,
               tipo_entrega, cantidad, precio_unitario_centavos, moneda, subtotal_centavos
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
              this.ids.orderItemId(),
              orderId,
              line.producto_id,
              line.vendedor_id,
              line.nombre,
              line.sku,
              line.tipo_entrega,
              line.cantidad,
              unitPrice,
              line.moneda,
              subtotal
            ]
          );
          if (line.tipo_entrega === "FISICA") {
            await this.reserveInventory(client, checkoutId, orderId, line, command.now);
          }
        }

        await client.query(
          `INSERT INTO payments (
             id, pedido_id, estado, proveedor, referencia, monto_centavos, moneda,
             creado_en, actualizado_en
           ) VALUES ($1, $2, 'PENDIENTE', 'SIMULADO', $3, $4, $5, $6, $6)`,
          [
            this.ids.paymentId(),
            orderId,
            `SIM-${orderNumber}`,
            totalCentavos,
            group[0]!.moneda,
            command.now
          ]
        );
      }

      // Refrescar la referencia de precio si el comprador confirmó el cambio.
      if (priceChanges.length > 0) {
        await client.query(
          `UPDATE cart_items ci
              SET precio_referencial_centavos = p.precio_centavos,
                  moneda_referencial = p.moneda
             FROM products p
            WHERE ci.producto_id = p.id
              AND ci.carrito_id = $1`,
          [cartId]
        );
      }

      await this.applyPaymentOutcome(
        client,
        checkoutId,
        cartId,
        orderIds,
        command.resultadoPagoSimulado,
        command.now
      );

      const pedidos: OrderDetail[] = [];
      for (const orderId of orderIds) {
        const order = await this.loadOrder(client, command.compradorId, orderId);
        if (order !== null) {
          pedidos.push(order);
        }
      }

      const result: CheckoutResult = {
        estado: command.resultadoPagoSimulado,
        checkoutId,
        pedidos,
        mensaje: messageFor(command.resultadoPagoSimulado)
      };

      await client.query(
        `UPDATE checkout_attempts
            SET estado = $2,
                resultado = $3,
                actualizado_en = $4
          WHERE id = $1`,
        [checkoutId, command.resultadoPagoSimulado, JSON.stringify(result), command.now]
      );

      await client.query("COMMIT");
      return result;
    } catch (error) {
      await rollback(client);
      if (error instanceof ApplicationError) {
        throw error;
      }
      throw new DependencyUnavailableError("No fue posible completar el checkout.", {
        cause: messageOf(error)
      });
    } finally {
      client.release();
    }
  }

  async listOrders(compradorId: string): Promise<OrderSummary[]> {
    try {
      const result = await this.pool.query<OrderRow>(
        `SELECT o.id,
                o.numero,
                o.vendedor_id,
                s.nombre_comercial AS vendedor_nombre,
                o.estado,
                o.estado_pago,
                o.moneda,
                o.total_centavos,
                o.creado_en,
                o.direccion_entrega,
                (SELECT COUNT(*)::int FROM order_items oi WHERE oi.pedido_id = o.id) AS items_count
           FROM orders o
           JOIN sellers s ON s.id = o.vendedor_id
          WHERE o.comprador_id = $1
          ORDER BY o.creado_en DESC`,
        [compradorId]
      );
      return result.rows.map(toSummary);
    } catch (error) {
      throw new DependencyUnavailableError("No fue posible consultar los pedidos.", {
        cause: messageOf(error)
      });
    }
  }

  async findOrder(compradorId: string, orderId: string): Promise<OrderDetail | null> {
    try {
      return await this.loadOrder(this.pool, compradorId, orderId);
    } catch (error) {
      if (error instanceof DependencyUnavailableError) {
        throw error;
      }
      throw new DependencyUnavailableError("No fue posible consultar el pedido.", {
        cause: messageOf(error)
      });
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  private async loadCartLines(client: PoolClient, cartId: string): Promise<CartLineRow[]> {
    const result = await client.query<CartLineRow>(
      `SELECT ci.producto_id,
              ci.cantidad,
              ci.precio_referencial_centavos,
              ci.moneda_referencial,
              p.nombre,
              p.sku,
              p.tipo_entrega,
              p.precio_centavos,
              p.moneda,
              p.estado AS estado_producto,
              s.id AS vendedor_id,
              s.nombre_comercial AS vendedor_nombre,
              s.estado AS estado_vendedor,
              CASE WHEN p.tipo_entrega = 'FISICA' THEN COALESCE((
                SELECT SUM(GREATEST(i.on_hand - i.reserved - i.unavailable, 0))
                  FROM inventory i
                  JOIN warehouses w ON w.id = i.bodega_id
                 WHERE i.producto_id = p.id
                   AND w.estado = 'ACTIVA'
              ), 0)::int ELSE NULL END AS disponible
         FROM cart_items ci
         JOIN products p ON p.id = ci.producto_id
         JOIN sellers s ON s.id = p.vendedor_id
        WHERE ci.carrito_id = $1
        ORDER BY ci.agregado_en ASC
        FOR UPDATE OF ci, p`,
      [cartId]
    );
    return result.rows;
  }

  private validateLines(lines: readonly CartLineRow[]): void {
    const problems: Array<Record<string, unknown>> = [];
    for (const line of lines) {
      if (line.estado_producto !== "PUBLICADO") {
        problems.push({
          productoId: line.producto_id,
          motivo: "PRODUCTO_NO_PUBLICADO"
        });
        continue;
      }
      if (line.estado_vendedor !== "ACTIVO") {
        problems.push({
          productoId: line.producto_id,
          motivo: "VENDEDOR_NO_ACTIVO"
        });
        continue;
      }
      if (
        line.tipo_entrega === "FISICA" &&
        line.cantidad > toInteger(line.disponible ?? 0)
      ) {
        problems.push({
          productoId: line.producto_id,
          motivo: "STOCK_INSUFICIENTE",
          solicitado: line.cantidad,
          disponible: toInteger(line.disponible ?? 0)
        });
      }
    }
    if (problems.length > 0) {
      throw new BusinessRuleError(
        "El carrito contiene productos que ya no pueden comprarse.",
        { motivo: "CARRITO_NO_VENDIBLE", lineas: problems }
      );
    }
  }

  private async loadAddressSnapshot(
    client: PoolClient,
    compradorId: string,
    direccionId: string,
    now: string
  ): Promise<DireccionSnapshot> {
    const result = await client.query<AddressRow>(
      `SELECT *
         FROM buyer_addresses
        WHERE comprador_id = $1
          AND id = $2
        FOR SHARE`,
      [compradorId, direccionId]
    );
    const row = result.rows[0];
    if (!row) {
      throw new BusinessRuleError(
        "La dirección de entrega no existe o no pertenece al comprador.",
        { motivo: "DIRECCION_INVALIDA" }
      );
    }
    const direccion = DireccionEntrega.create({
      id: row.id,
      compradorId: row.comprador_id,
      destinatario: row.destinatario,
      telefono: row.telefono,
      linea1: row.linea1,
      linea2: row.linea2,
      ciudad: row.ciudad,
      region: row.region,
      codigoPostal: row.codigo_postal,
      pais: row.pais,
      esPrincipal: row.es_principal,
      creadaEn: row.creada_en.toISOString(),
      actualizadaEn: row.actualizada_en.toISOString()
    });
    return direccion.toSnapshot(now);
  }

  private async reserveInventory(
    client: PoolClient,
    checkoutId: string,
    orderId: string,
    line: CartLineRow,
    now: string
  ): Promise<void> {
    const warehouses = await client.query<{
      inventory_id: string;
      bodega_id: string;
      disponible: number;
    }>(
      `SELECT i.id AS inventory_id,
              i.bodega_id,
              (i.on_hand - i.reserved - i.unavailable)::int AS disponible
         FROM inventory i
         JOIN warehouses w ON w.id = i.bodega_id
        WHERE i.producto_id = $1
          AND w.estado = 'ACTIVA'
          AND i.on_hand - i.reserved - i.unavailable > 0
        ORDER BY w.creada_en ASC, i.id ASC
        FOR UPDATE`,
      [line.producto_id]
    );

    let remaining = line.cantidad;
    for (const warehouse of warehouses.rows) {
      if (remaining <= 0) {
        break;
      }
      const take = Math.min(remaining, warehouse.disponible);
      if (take <= 0) {
        continue;
      }
      await client.query(
        `UPDATE inventory
            SET reserved = reserved + $2,
                version = version + 1,
                actualizado_en = $3
          WHERE id = $1`,
        [warehouse.inventory_id, take, now]
      );
      await client.query(
        `INSERT INTO inventory_reservations (
           id, checkout_id, pedido_id, producto_id, bodega_id, cantidad,
           estado, creada_en, liberada_en
         ) VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVA', $7, NULL)`,
        [
          this.ids.reservationId(),
          checkoutId,
          orderId,
          line.producto_id,
          warehouse.bodega_id,
          take,
          now
        ]
      );
      remaining -= take;
    }

    if (remaining > 0) {
      throw new BusinessRuleError("El stock cambió durante el checkout.", {
        motivo: "STOCK_INSUFICIENTE",
        productoId: line.producto_id,
        faltante: remaining
      });
    }
  }

  private async applyPaymentOutcome(
    client: PoolClient,
    checkoutId: string,
    cartId: string,
    orderIds: readonly string[],
    outcome: CheckoutCommand["resultadoPagoSimulado"],
    now: string
  ): Promise<void> {
    if (outcome === "CONFIRMADO") {
      for (const orderId of orderIds) {
        await client.query(
          `UPDATE payments
              SET estado = 'CAPTURADO',
                  actualizado_en = $2
            WHERE pedido_id = $1`,
          [orderId, now]
        );
        await client.query(
          `UPDATE orders
              SET estado = 'EN_PREPARACION',
                  estado_pago = 'CAPTURADO',
                  actualizado_en = $2
            WHERE id = $1`,
          [orderId, now]
        );
      }
      await this.clearCart(client, cartId, now);
      return;
    }

    if (outcome === "RECHAZADO") {
      for (const orderId of orderIds) {
        await client.query(
          `UPDATE payments
              SET estado = 'RECHAZADO',
                  actualizado_en = $2
            WHERE pedido_id = $1`,
          [orderId, now]
        );
        await client.query(
          `UPDATE orders
              SET estado = 'CANCELADO',
                  estado_pago = 'RECHAZADO',
                  actualizado_en = $2
            WHERE id = $1`,
          [orderId, now]
        );
      }
      await this.releaseReservations(client, checkoutId, now);
      return;
    }

    // DESCONOCIDO: el pedido y la reserva quedan pendientes. No se marca como
    // pagado ni como rechazado. Se vacía el carrito para que un nuevo intento
    // no genere un pedido duplicado; el comprador puede consultar el pedido.
    await this.clearCart(client, cartId, now);
  }

  private async clearCart(client: PoolClient, cartId: string, now: string): Promise<void> {
    await client.query(`DELETE FROM cart_items WHERE carrito_id = $1`, [cartId]);
    await client.query(
      `UPDATE carts
          SET actualizado_en = $2,
              version = version + 1
        WHERE id = $1`,
      [cartId, now]
    );
  }

  private async releaseReservations(
    client: PoolClient,
    checkoutId: string,
    now: string
  ): Promise<void> {
    await client.query(
      `UPDATE inventory i
          SET reserved = GREATEST(i.reserved - r.cantidad, 0),
              version = i.version + 1,
              actualizado_en = $2
         FROM inventory_reservations r
        WHERE r.checkout_id = $1
          AND r.estado = 'ACTIVA'
          AND i.bodega_id = r.bodega_id
          AND i.producto_id = r.producto_id`,
      [checkoutId, now]
    );
    await client.query(
      `UPDATE inventory_reservations
          SET estado = 'LIBERADA',
              liberada_en = $2
        WHERE checkout_id = $1
          AND estado = 'ACTIVA'`,
      [checkoutId, now]
    );
  }

  private async loadOrder(
    queryable: Pool | PoolClient,
    compradorId: string,
    orderId: string
  ): Promise<OrderDetail | null> {
    const orderResult = await queryable.query<OrderRow>(
      `SELECT o.id,
              o.numero,
              o.vendedor_id,
              s.nombre_comercial AS vendedor_nombre,
              o.estado,
              o.estado_pago,
              o.moneda,
              o.total_centavos,
              o.creado_en,
              o.direccion_entrega,
              (SELECT COUNT(*)::int FROM order_items oi WHERE oi.pedido_id = o.id) AS items_count
         FROM orders o
         JOIN sellers s ON s.id = o.vendedor_id
        WHERE o.comprador_id = $1
          AND o.id = $2
        LIMIT 1`,
      [compradorId, orderId]
    );
    const order = orderResult.rows[0];
    if (!order) {
      return null;
    }

    const itemsResult = await queryable.query<ItemRow>(
      `SELECT id, producto_id, nombre_producto, sku, tipo_entrega, cantidad,
              precio_unitario_centavos, moneda, subtotal_centavos
         FROM order_items
        WHERE pedido_id = $1
        ORDER BY nombre_producto ASC`,
      [orderId]
    );
    const paymentResult = await queryable.query<PaymentRow>(
      `SELECT id, estado, proveedor, referencia, monto_centavos, moneda
         FROM payments
        WHERE pedido_id = $1
        ORDER BY creado_en DESC
        LIMIT 1`,
      [orderId]
    );

    return {
      ...toSummary(order),
      items: itemsResult.rows.map(toItem),
      pago: paymentResult.rows[0] ? toPayment(paymentResult.rows[0]) : null,
      direccionEntrega: order.direccion_entrega
    };
  }

  private async connect(): Promise<PoolClient> {
    try {
      return await this.pool.connect();
    } catch (error) {
      throw new DependencyUnavailableError("No fue posible conectar con la base de datos.", {
        cause: messageOf(error)
      });
    }
  }
}

function groupBySeller(lines: readonly CartLineRow[]): Map<string, CartLineRow[]> {
  const groups = new Map<string, CartLineRow[]>();
  for (const line of lines) {
    const current = groups.get(line.vendedor_id);
    if (current) {
      current.push(line);
    } else {
      groups.set(line.vendedor_id, [line]);
    }
  }
  return groups;
}

function makeOrderNumber(now: string): string {
  const date = now.slice(0, 10).replace(/-/g, "");
  return `NM-${date}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

function toSummary(row: OrderRow): OrderSummary {
  return {
    id: row.id,
    numero: row.numero,
    vendedorId: row.vendedor_id,
    vendedorNombre: row.vendedor_nombre,
    estado: row.estado,
    estadoPago: row.estado_pago,
    moneda: row.moneda,
    totalCentavos: toInteger(row.total_centavos),
    itemsCount: row.items_count,
    creadoEn: row.creado_en.toISOString()
  };
}

function toItem(row: ItemRow): OrderItemView {
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

function toPayment(row: PaymentRow): PaymentView {
  return {
    id: row.id,
    estado: row.estado,
    proveedor: row.proveedor,
    referencia: row.referencia,
    montoCentavos: toInteger(row.monto_centavos),
    moneda: row.moneda
  };
}

function messageFor(outcome: CheckoutCommand["resultadoPagoSimulado"]): string {
  switch (outcome) {
    case "CONFIRMADO":
      return "Pago confirmado. Los pedidos quedaron en preparación.";
    case "RECHAZADO":
      return "El pago fue rechazado. Los pedidos quedaron cancelados y las reservas liberadas.";
    case "DESCONOCIDO":
      return "El resultado del pago es desconocido. Los pedidos quedaron pendientes de confirmación; no se reintentó el cobro.";
  }
}

function toInteger(value: string | number): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    throw new Error("Valor numérico inválido en la base de datos.");
  }
  return parsed;
}

async function rollback(client: PoolClient): Promise<void> {
  try {
    await client.query("ROLLBACK");
  } catch {
    // Se informa el error original.
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "unknown";
}
