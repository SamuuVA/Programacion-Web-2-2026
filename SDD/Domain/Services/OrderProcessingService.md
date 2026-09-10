# OrderProcessingService

## 1. Descripción
Servicio de dominio **stateless** que coordina el ciclo de vida de los pedidos.

Flujo principal:

```text
CARRITO
  -> PENDIENTE_PAGO
  -> PAGADO
  -> DESPACHADO
  -> ENTREGADO / FINALIZADO
```

## 2. Responsabilidades
- Crear pedidos desde carritos.
- Coordinar validación del pago.
- Coordinar reserva de inventario.
- Coordinar despacho.
- Registrar entrega/finalización.
- Controlar transiciones de estado.
- Impedir modificaciones de pedidos finalizados.
- Auditar cambios relevantes.

## 3. Entidades y objetos
- `CarritoDeCompras`
- `ItemCarrito`
- `Pedido`
- `ItemPedido`
- `Comprador`
- `Inventario`
- `OrderStatus`
- `PaymentStatus`
- `DeliveryMethod`
- `RegistroAuditoria`

## 4. Operaciones

### `createOrderFromCart`

```text
createOrderFromCart(buyerId, cartId): Order
```

**Precondiciones**
- Comprador autenticado.
- Carrito existente y perteneciente al comprador.
- Artículos válidos.
- Variantes identificables.
- Cantidades válidas.

**Flujo**
1. Validar comprador.
2. Validar carrito y pertenencia.
3. Validar artículos.
4. Crear `Pedido`.
5. Crear `ItemPedido`.
6. Establecer `PENDIENTE_PAGO`.
7. Auditar.

### `confirmPayment`

```text
confirmPayment(orderId, paymentData): Void
```

**Flujo de aprobación**
```text
PENDIENTE_PAGO
   -> pago aprobado
   -> PAGADO
   -> reservar inventario
   -> auditar
```

Los estados de pago son `PENDIENTE`, `APROBADO`, `RECHAZADO` y `REEMBOLSADO`.

La especificación funcional define la validación del pago, pero no un proveedor ni mecanismo técnico concreto; este servicio no debe inventar esa implementación.

### `cancelOrder`

```text
cancelOrder(orderId, actorId): Void
```

**Precondiciones**
- Pedido existente.
- Actor autenticado y autorizado.
- Estado compatible con cancelación.
- No debe tratarse de un pedido ya finalizado.

Si existe inventario reservado, la cancelación debe coordinar la liberación/devolución correspondiente según las reglas de inventario.

### `completeDelivery`

```text
completeDelivery(orderId, deliveryData): Void
```

**Precondiciones**
- Pedido existente.
- Estado compatible con entrega.
- Actor autorizado.

**Flujo**
1. Validar pedido.
2. Validar estado.
3. Registrar entrega.
4. Cambiar a `ENTREGADO`.
5. Auditar.

Un pedido finalizado no puede modificarse.

## 5. Reglas de negocio
- Toda operación requiere autenticación.
- El comprador solo gestiona sus propios pedidos.
- Las transiciones deben respetar los estados definidos.
- Un pedido finalizado no puede modificarse.
- Las operaciones que requieran stock deben respetar su disponibilidad.
- Los cambios relevantes de estado deben auditarse.

## 6. Interacción con inventario

```text
Pago aprobado
    -> InventoryService.reserveStockForOrder()
    -> inventario reservado
```

Durante el despacho:

```text
Pedido PAGADO
    -> InventoryService.dispatchStock()
    -> SALIDA_VENTA
    -> Pedido DESPACHADO
```

## 7. Errores
- Pedido inexistente.
- Carrito inexistente.
- Carrito de otro comprador.
- Estado inválido.
- Pedido finalizado.
- Stock insuficiente.
- Actor no autorizado.
- Pago rechazado.

## 8. Límites
No registra usuarios, productos ni inventario directamente; tampoco implementa el mecanismo técnico de pago o transporte. Facturación, devoluciones, reembolsos y reportes requieren especificación adicional para definir operaciones internas concretas.
