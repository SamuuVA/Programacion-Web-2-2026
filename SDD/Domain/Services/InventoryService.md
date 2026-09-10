# InventoryService

## 1. Descripción
Servicio de dominio **stateless** responsable del inventario distribuido de NexusMarket.

El inventario se identifica por la combinación:

```text
Variante + Bodega
```

y mantiene `cantidadDisponible` y `cantidadReservada`.

## 2. Responsabilidades
- Registrar ingresos.
- Reservar stock para pedidos.
- Registrar salidas por venta.
- Mantener cantidades consistentes.
- Evitar inventario negativo.
- Generar movimientos y auditoría.

## 3. Entidades y objetos
- `Inventario`
- `MovimientoInventario`
- `Variante`
- `Bodega`
- `Pedido`
- `ItemPedido`
- `Usuario`
- `InventoryMovementType`

### Tipos de movimiento
`INGRESO`, `RESERVA`, `SALIDA_VENTA`, `AJUSTE`, `DEVOLUCION`.

## 4. Operaciones

### `replenishStock`

```text
replenishStock(operatorId, warehouseId, variantId, quantity): InventoryMovement
```

**Precondiciones**
- Operador autenticado/autorizado.
- Bodega y variante existentes.
- `quantity > 0`.

**Flujo**
1. Validar operador.
2. Validar bodega y variante.
3. Crear/localizar inventario.
4. Incrementar disponible.
5. Crear movimiento `INGRESO`.
6. Auditar.

### `reserveStockForOrder`

```text
reserveStockForOrder(orderId, items): List<InventoryMovement>
```

**Precondiciones**
- Pedido y artículos válidos.
- Variante existente.
- Disponibilidad suficiente.
- Inventario apto para reserva.

**Flujo**
```text
Pedido
  -> Items
  -> Variante + Bodega
  -> Validar disponibilidad
  -> Disminuir disponible
  -> Aumentar reservado
  -> Crear RESERVA
  -> Auditar
```

Nunca se reserva inventario inexistente, insuficiente o no disponible.

### `dispatchStock`

```text
dispatchStock(operatorId, orderId): List<InventoryMovement>
```

**Precondiciones**
- Operador autorizado.
- Pedido existente.
- Inventario previamente reservado válido.
- Pedido en estado compatible.

**Flujo**
1. Validar operador y pedido.
2. Obtener artículos.
3. Identificar reservas.
4. Disminuir reservado.
5. Crear `SALIDA_VENTA`.
6. Auditar.
7. Permitir avance del pedido a `DESPACHADO`.

## 5. Reglas de negocio
- `cantidadDisponible >= 0`.
- `cantidadReservada >= 0`.
- Cada inventario corresponde a variante y bodega.
- No se reserva stock inexistente o insuficiente.
- Todo movimiento identifica tipo, fecha, cantidad, variante, bodega y actor.
- Los movimientos deben auditarse.

## 6. Integridad
Una operación de inventario debe mantener consistentes sus cambios relacionados. Una reserva no debe actualizar disponible sin actualizar reserva y registrar el movimiento correspondiente.

## 7. Errores
- Variante inexistente.
- Bodega inexistente.
- Cantidad no positiva.
- Stock insuficiente.
- Inventario no disponible.
- Operador no autorizado.
- Pedido inexistente.

## 8. Límites
No registra vendedores/productos, crea pedidos, procesa pagos ni ejecuta transporte. El detalle de devoluciones/reembolsos debe seguir la especificación funcional correspondiente.
