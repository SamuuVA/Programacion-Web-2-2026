# Servicios de Dominio - NexusMarket

## 1. Propósito

Los **Servicios de Dominio** encapsulan operaciones de negocio que no pertenecen naturalmente a una sola entidad u objeto de valor.

Son servicios sin estado persistente (*stateless*) y coordinan varias entidades para:

- Aplicar reglas de negocio.
- Validar precondiciones.
- Ejecutar operaciones que afectan múltiples conceptos.
- Mantener invariantes.
- Coordinar cambios de estado.
- Generar trazabilidad mediante auditoría.

Los servicios descritos aquí se derivan de los procesos y restricciones de la especificación funcional de NexusMarket.

---

# 2. Servicios definidos

| Servicio | Responsabilidad | Entidades principales |
|---|---|---|
| `UserManagementService` | Registro, incorporación y administración de usuarios. | `User`, `Buyer`, `Seller`, `Administrator` |
| `CatalogService` | Gestión del catálogo, productos, variantes y estados de publicación. | `Product`, `Variant`, `Seller` |
| `InventoryService` | Stock distribuido, reservas, ingresos, salidas y movimientos. | `Inventory`, `Warehouse`, `Variant`, `InventoryMovement` |
| `OrderProcessingService` | Checkout, pago y ciclo de vida de pedidos. | `Buyer`, `ShoppingCart`, `Order`, `OrderItem`, `Inventory` |
| `AuditService` | Registro inmutable de operaciones críticas. | `AuditLog`, `User`, `InventoryMovement` |

---

# 3. Reglas transversales de los servicios

Todos los servicios deben respetar:

1. **Autenticación:** toda operación debe ejecutarse por un usuario autenticado.
2. **Autorización por rol:** cada operación debe validar que el usuario tenga el rol correspondiente.
3. **Alcance:** ningún usuario puede administrar información fuera de su rol.
4. **Auditoría:** las operaciones críticas deben producir trazabilidad.
5. **Consistencia:** una operación que modifique varias entidades debe mantener las invariantes del dominio.
6. **No inventar estados:** solo pueden utilizarse los estados definidos por el dominio.

---

# 4. UserManagementService

## Responsabilidad

Gestiona el ciclo administrativo de los usuarios, incluyendo el registro de compradores, la incorporación de vendedores y la actualización del estado de acceso.

---

## 4.1 `registerBuyer(buyerData): Buyer`

### Objetivo

Registrar un nuevo comprador.

### Precondiciones

- Los datos requeridos del comprador están completos.
- El correo electrónico no existe previamente.
- El documento de identidad no existe previamente.
- La operación es ejecutada dentro del contexto autorizado.

### Proceso

```text
Validar datos
   ↓
Validar unicidad de correo
   ↓
Validar unicidad de documento
   ↓
Crear User
   ↓
Asignar rol COMPRADOR
   ↓
Estado = ACTIVO
   ↓
Estado comercial = HABILITADO
   ↓
Crear ShoppingCart vacío
```

### Postcondiciones

- Existe un nuevo `Buyer`.
- `User.status = ACTIVO`.
- `Buyer.commercialStatus = HABILITADO`.
- El comprador dispone de un carrito vacío.

### Reglas

El comprador no recibe permisos para administrar inventario, vendedores ni información de otros compradores.

---

## 4.2 `onboardSeller(adminId, sellerData): Seller`

### Objetivo

Incorporar un vendedor al marketplace.

### Precondiciones

- `adminId` corresponde a un usuario autenticado.
- El usuario ejecutor tiene `SystemRole.ADMINISTRADOR`.
- El vendedor no está intentando autorregistrarse.

### Proceso

```text
Administrador solicita incorporación
          ↓
Validar rol ADMINISTRADOR
          ↓
Validar datos del vendedor
          ↓
Crear Seller
          ↓
Registrar operación en AuditLog
```

### Postcondiciones

- Existe una nueva entidad `Seller`.
- El vendedor queda asociado al marketplace.
- La incorporación queda registrada en auditoría.

### Regla crítica

Los vendedores **no pueden autorregistrarse**.

---

## 4.3 `updateUserAccessStatus(adminId, userId, newStatus): Void`

### Objetivo

Actualizar el estado operativo de un usuario.

### Precondiciones

- El ejecutor está autenticado.
- El ejecutor posee rol `ADMINISTRADOR`.
- `newStatus` pertenece a `ACTIVO`, `INACTIVO` o `BLOQUEADO`.

### Postcondiciones

`User.status` queda actualizado al nuevo estado.

### Trazabilidad

El cambio de estado debe ser registrable como operación administrativa relevante.

---

# 5. CatalogService

## Responsabilidad

Administra la oferta comercial del marketplace.

Incluye:

- Productos.
- Variantes.
- SKU.
- Categorías.
- Estado de publicación.
- Asociación del producto con el vendedor.

---

## 5.1 `publishProduct(sellerId, productData, variantsData): Product`

### Objetivo

Registrar un producto y sus variantes para su publicación en el catálogo.

### Precondiciones

- El ejecutor está autenticado.
- El ejecutor posee rol `VENDEDOR`.
- El vendedor es válido.
- Los datos básicos del producto están completos.
- Las variantes proporcionadas son válidas.
- Cada variante debe disponer de un SKU identificable.

### Proceso

```text
Validar vendedor
      ↓
Validar datos del producto
      ↓
Crear Product
      ↓
Asignar vendedor
      ↓
Asignar categoría
      ↓
Crear Variant(s)
      ↓
Asignar SKU
      ↓
Estado = PUBLICADO
```

### Postcondiciones

- Se crea el `Product`.
- El producto queda asociado al vendedor.
- Se crean las variantes.
- El producto queda en estado `PUBLICADO`.

### Regla

El stock se controla por `Variant`, no directamente por `Product`.

---

## 5.2 `updateProductStatus(sellerId, productId, newStatus): Void`

### Objetivo

Modificar el estado comercial de un producto.

### Estados permitidos

- `PUBLICADO`
- `SUSPENDIDO`
- `DESCONTINUADO`

### Precondiciones

- El ejecutor es el vendedor propietario o un Administrador.
- El producto existe.
- El nuevo estado es válido.

### Postcondiciones

El estado del producto queda actualizado.

### Control de permisos

```text
VENDEDOR
   └── solo productos propios

ADMINISTRADOR
   └── puede administrar productos conforme a sus permisos

OTROS ROLES
   └── no pueden modificar productos
```

---

# 6. InventoryService

## Responsabilidad

Coordina el inventario distribuido entre bodegas.

Controla:

- Ingresos.
- Reservas.
- Salidas por venta.
- Ajustes.
- Devoluciones.
- Cantidad disponible.
- Cantidad reservada.
- Auditoría de movimientos.

---

## 6.1 `replenishStock(operatorId, warehouseId, variantId, quantity): InventoryMovement`

### Objetivo

Ingresar o reabastecer stock.

### Precondiciones

- El ejecutor está autenticado.
- El ejecutor es un `OPERADOR_LOGISTICO` o el `VENDEDOR` propietario de la bodega.
- La bodega existe.
- La variante existe.
- `quantity > 0`.

### Proceso

```text
Validar ejecutor
      ↓
Validar bodega
      ↓
Validar variante
      ↓
Validar quantity > 0
      ↓
Incrementar availableQuantity
      ↓
Crear InventoryMovement(INGRESO)
      ↓
Registrar AuditLog
```

### Postcondiciones

```text
availableQuantity =
    availableQuantity anterior + quantity

reservedQuantity =
    reservedQuantity anterior
```

Se crea un movimiento `INGRESO` y su correspondiente registro de auditoría.

---

## 6.2 `reserveStockForOrder(orderId, items): List<InventoryMovement>`

### Objetivo

Reservar las unidades necesarias para un pedido pagado.

### Precondiciones

- El pedido existe.
- El pago ha sido confirmado.
- La cantidad total disponible en las bodegas aplicables es suficiente.
- No se utiliza inventario dañado o no disponible.

### Proceso conceptual

```text
Pedido PAGADO
     ↓
Determinar variantes y cantidades
     ↓
Consultar inventario distribuido
     ↓
Verificar disponibilidad total
     ↓
Seleccionar existencias válidas
     ↓
Reducir availableQuantity
     ↓
Incrementar reservedQuantity
     ↓
Crear movimientos RESERVA
     ↓
Registrar auditoría
```

### Postcondiciones

Para cada inventario afectado:

```text
availableQuantity ↓
reservedQuantity ↑
```

Se generan movimientos de tipo `RESERVA`.

### Invariante

Nunca se debe reservar una cantidad superior al stock disponible.

---

## 6.3 `dispatchStock(operatorId, orderId): List<InventoryMovement>`

### Objetivo

Registrar la salida física del stock reservado al despachar un pedido.

### Precondiciones

- El operador está autenticado.
- El operador tiene permisos logísticos.
- El pedido está en estado `PAGADO`.
- El stock necesario se encuentra reservado.

### Proceso

```text
Pedido PAGADO
     ↓
Preparación / empaque
     ↓
Validar reserva
     ↓
Reducir reservedQuantity
     ↓
Crear SALIDA_VENTA
     ↓
Actualizar pedido = DESPACHADO
     ↓
Registrar AuditLog
```

### Postcondiciones

- `reservedQuantity` disminuye.
- Se generan movimientos `SALIDA_VENTA`.
- El pedido pasa a `DESPACHADO`.

---

## 6.4 Invariantes del InventoryService

```text
availableQuantity >= 0
reservedQuantity >= 0

Nunca reservar:
requestedQuantity > availableQuantity

Todo InventoryMovement
    → debe producir AuditLog
```

---

# 7. OrderProcessingService

## Responsabilidad

Coordina el ciclo comercial del pedido desde el carrito hasta la entrega.

La especificación funcional define el flujo:

```text
Carrito
   ↓
Pendiente de Pago
   ↓
Pagado
   ↓
Despachado
   ↓
Entregado / Finalizado
```

También contempla `CANCELADO` como estado del pedido.

---

## 7.1 `createOrderFromCart(buyerId): Order`

### Objetivo

Convertir la selección provisional del carrito en un pedido formal.

### Precondiciones

- El comprador existe.
- El comprador está habilitado comercialmente.
- El carrito contiene los artículos requeridos.
- Las variantes seleccionadas son válidas.

### Postcondiciones

- Se crea un `Order`.
- El pedido queda inicialmente en `PENDIENTE_PAGO`.
- Se crean sus `OrderItem`.
- Se conserva la dirección de envío correspondiente al pedido.
- Los precios aplicados se registran en cada línea.

---

## 7.2 `confirmPayment(orderId): Void`

### Objetivo

Registrar la confirmación del pago y permitir que el pedido continúe hacia preparación.

### Precondiciones

- El pedido existe.
- El pedido está pendiente de pago.
- La transacción financiera ha sido aprobada.

### Postcondiciones

```text
Order.paymentStatus = APROBADO
Order.orderStatus = PAGADO
```

A partir de esta transición se inicia la reserva de inventario para productos físicos.

---

## 7.3 `cancelOrder(orderId): Void`

### Objetivo

Cancelar un pedido cuando las reglas de negocio lo permitan.

### Restricción

La especificación establece que `CANCELADO` representa un pedido anulado antes del despacho.

Por tanto:

```text
Permitido:
PENDIENTE_PAGO → CANCELADO
```

y cualquier otra transición debe estar explícitamente autorizada por las reglas de negocio antes de implementarse.

---

## 7.4 `completeDelivery(orderId): Void`

### Objetivo

Cerrar el ciclo de un pedido físico después de confirmar su entrega.

### Precondiciones

- El pedido se encuentra `DESPACHADO`.
- Existe confirmación de entrega.

### Postcondiciones

```text
Order.orderStatus = ENTREGADO
```

### Regla crítica

Después de alcanzar `ENTREGADO`, el pedido no puede ser modificado.

---

# 8. AuditService

## Responsabilidad

Garantiza la trazabilidad de operaciones críticas.

El `AuditService` no debe modificar retrospectivamente registros existentes.

---

## 8.1 `recordEvent(eventData): AuditLog`

### Objetivo

Crear un registro inmutable de una operación.

### Información mínima

- Tipo de evento.
- Marca de tiempo.
- Usuario responsable.
- Rol del usuario.
- Detalles operativos.
- Gravedad, cuando corresponda.

### Postcondición

Se agrega un nuevo `AuditLog`.

```text
AuditLog existente
      │
      ├── NO modificar
      ├── NO eliminar
      │
      └── agregar nuevo evento
```

---

## 8.2 Eventos que deben auditarse

Como mínimo, el modelo establece trazabilidad para:

- Movimientos de inventario.
- Cambios de estado de pedidos.
- Incorporación de vendedores.
- Ajustes administrativos relevantes.
- Operaciones críticas del dominio.

---

# 9. Coordinación entre servicios

## Flujo de incorporación

```text
Administrator
      │
      ▼
UserManagementService
      │
      ├── crea Seller
      └── AuditService registra evento
```

## Flujo de publicación

```text
Seller
   │
   ▼
CatalogService
   │
   ├── Product
   └── Variant / SKU
```

## Flujo de compra

```text
Buyer
  │
  ▼
ShoppingCart
  │
  ▼
OrderProcessingService
  │
  ├── Order = PENDIENTE_PAGO
  │
  └── Pago aprobado
          │
          ▼
       Order = PAGADO
          │
          ▼
InventoryService
          │
          ├── reserva stock
          └── AuditService
```

## Flujo de despacho

```text
Order = PAGADO
       │
       ▼
InventoryService
       │
       ├── SALIDA_VENTA
       ├── reservedQuantity ↓
       └── AuditService
       │
       ▼
Order = DESPACHADO
       │
       ▼
Entrega confirmada
       │
       ▼
Order = ENTREGADO
```

---

# 10. Matriz de precondiciones y postcondiciones

| Servicio | Operación | Precondición principal | Resultado |
|---|---|---|---|
| UserManagement | `registerBuyer` | Correo/documento únicos | Comprador activo y habilitado |
| UserManagement | `onboardSeller` | Ejecuta Administrador | Vendedor creado y auditado |
| UserManagement | `updateUserAccessStatus` | Ejecuta Administrador | Estado actualizado |
| Catalog | `publishProduct` | Ejecuta Vendedor | Producto publicado con variantes |
| Catalog | `updateProductStatus` | Propietario o Administrador | Estado actualizado |
| Inventory | `replenishStock` | Cantidad > 0 | Ingreso de stock |
| Inventory | `reserveStockForOrder` | Stock suficiente | Stock reservado |
| Inventory | `dispatchStock` | Pedido PAGADO | Salida y pedido DESPACHADO |
| Order | `createOrderFromCart` | Carrito válido | Pedido PENDIENTE_PAGO |
| Order | `confirmPayment` | Pago aprobado | Pedido PAGADO |
| Order | `cancelOrder` | Antes del despacho | Pedido CANCELADO |
| Order | `completeDelivery` | Pedido DESPACHADO | Pedido ENTREGADO |
| Audit | `recordEvent` | Evento válido | Registro inmutable |

---

# 11. Invariantes globales

### Usuarios

```text
Cada User tiene exactamente un Role.
Toda operación requiere un User autenticado.
```

### Inventario

```text
availableQuantity >= 0
reservedQuantity >= 0
No reservar stock inexistente.
No reservar stock dañado/no disponible.
```

### Pedidos

```text
ENTREGADO → no modificable
```

### Auditoría

```text
InventoryMovement → AuditLog obligatorio
AuditLog → append-only
AuditLog → no UPDATE
AuditLog → no DELETE
```

### Catálogo

```text
Product → pertenece a un Seller
Product → posee Variant(s)
Inventory → pertenece a Variant + Warehouse
```

---

# 12. Consideraciones de alcance

La especificación funcional establece que el sistema incluye:

- Registro de compradores.
- Administración de usuarios.
- Registro administrativo de vendedores.
- Administración de bodegas.
- Catálogo.
- Inventario.
- Carrito.
- Pedidos.
- Facturación.
- Envíos.
- Devoluciones.
- Reembolsos.
- Reportes administrativos.

Sin embargo, los documentos de dominio proporcionados detallan con mayor profundidad usuarios, catálogo, inventario, pedidos y auditoría.

Por lo tanto, **facturación, devoluciones, reembolsos y reportes** se mantienen como responsabilidades funcionales reconocidas por el dominio, pero no se deben inventar operaciones específicas hasta que exista una definición funcional adicional.

---

# 13. Reglas de diseño

Los servicios de dominio deben:

- Evitar contener detalles de interfaz gráfica.
- Evitar depender de tecnologías concretas de almacenamiento.
- Trabajar con entidades y objetos de valor del dominio.
- Validar permisos y reglas antes de ejecutar cambios.
- Garantizar las invariantes del dominio.
- Generar auditoría para las operaciones que requieren trazabilidad.
- Mantener las transiciones de estado explícitas.
