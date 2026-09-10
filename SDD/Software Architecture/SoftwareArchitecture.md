# Arquitectura de Software — NexusMarket

## 1. Descripción general

NexusMarket es un mercado digital centralizado que actúa como intermediario comercial entre compradores y vendedores. La plataforma coordina la gestión de usuarios, la incorporación de vendedores, el catálogo de productos, el inventario distribuido, los carritos de compra, los pedidos, la validación de pagos, la logística, la facturación, las devoluciones, los reembolsos y los reportes.

Esta arquitectura es una **arquitectura técnica propuesta**, derivada de la especificación funcional de NexusMarket y guiada por el ejemplo de arquitectura proporcionado para otro proyecto. La especificación funcional deja explícitamente fuera de su alcance las tecnologías de implementación y la arquitectura de software; por lo tanto, las decisiones tecnológicas y arquitectónicas de este documento son propuestas de ingeniería y no requisitos establecidos literalmente por la especificación.

La solución propuesta utiliza:

- **TypeScript como lenguaje de programación principal**, en lugar de JavaScript puro.
- **Arquitectura Hexagonal (Puertos y Adaptadores)** como estilo arquitectónico principal.
- **Diseño Orientado al Dominio (DDD)** para organizar el modelo de negocio.
- **SQL** como fuente de verdad de los datos de negocio transaccionales.
- **MongoDB** como base de datos NoSQL complementaria, principalmente para datos de auditoría y trazabilidad.
- REST como mecanismo inicial de comunicación externa.
- Separación explícita entre Dominio, Aplicación, Adaptadores e Infraestructura.

El objetivo principal es mantener las reglas de negocio de NexusMarket independientes de frameworks, bases de datos y tecnologías de transporte, al tiempo que se conserva la consistencia transaccional de los pedidos y el inventario.

---

# 2. Principios Arquitectónicos

La arquitectura sigue estos principios:

- Diseño centrado en el dominio.
- Separación de responsabilidades.
- Inversión de dependencias.
- Independencia tecnológica.
- Alta cohesión.
- Bajo acoplamiento.
- Límites explícitos.
- Consistencia transaccional.
- Trazabilidad.
- Seguridad mediante límites de autorización.
- Capacidad de prueba.
- Escalabilidad evolutiva.

La regla más importante es:

> Las reglas de negocio pertenecen al Dominio y no deben depender de SQL, MongoDB, HTTP, Express, Fastify, bibliotecas ORM ni de otras tecnologías de infraestructura.

---

# 3. Decisión Tecnológica Recomendada

## 3.1 JavaScript vs TypeScript

Aunque JavaScript es un lenguaje de ejecución válido para NexusMarket, se recomienda **TypeScript como lenguaje principal de desarrollo**.

El proyecto seguirá ejecutándose como JavaScript en tiempo de ejecución, ya que TypeScript se compila/transpila a JavaScript.

### Por qué es preferible TypeScript

NexusMarket contiene un modelo de dominio relativamente amplio que incluye:

- Múltiples roles de usuario.
- Varios tipos de productos.
- Variantes de productos.
- Inventario distribuido.
- Movimientos de inventario.
- Múltiples estados de pedidos.
- Estados de pago.
- Tipos de bodega.
- Registros de auditoría.
- Varios servicios de dominio.
- Relaciones claras entre entidades.

Estas características hacen especialmente valiosa la comprobación de tipos en tiempo de compilación.

### Ventajas

- Tipado fuerte para las entidades de dominio.
- Contratos de servicio más seguros.
- Mejor autocompletado y refactorización.
- Identificación más sencilla de estructuras de datos inválidas.
- Mejor documentación mediante interfaces y tipos.
- Menor probabilidad de pasar objetos incorrectos entre capas.
- Mejor soporte para modelos de dominio a gran escala.
- Mejor mantenibilidad a medida que crece el proyecto.

### Decisión

```text
Primary language: TypeScript
Runtime: Node.js
```

JavaScript sigue siendo el objetivo de ejecución, pero el código fuente de la aplicación debe escribirse en TypeScript.

---

# 4. Estilo Arquitectónico

NexusMarket utilizará:

```text
Hexagonal Architecture
        +
Dominio-Driven Design
        +
Layered Separation
```

La arquitectura puede representarse de la siguiente manera:

```text
                         Clientes externos
                                |
                                v
                    +-----------------------+
                    |   Adaptadores de entrada      |
                    | REST / Controladores    |
                    +-----------+-----------+
                                |
                                v
                    +-----------------------+
                    |   Capa de Aplicación   |
                    | Casos de uso / Comandos   |
                    +-----------+-----------+
                                |
                                v
                    +-----------------------+
                    |      Capa de Dominio     |
                    | Entidades / OV /       |
                    | Servicios / Puertos      |
                    +-----------+-----------+
                                |
                         Puertos de salida
                         /          \
                        v            v
              +-------------+   +-------------+
              | Adaptador SQL |   | Adaptador Mongo|
              +------+------+   +------+------+
                     |                 |
                     v                 v
                  BD SQL           MongoDB
```

El Dominio se encuentra en el centro.

---

# 5. ¿Por qué Arquitectura Hexagonal?

NexusMarket requiere interactuar con varias tecnologías externas:

- Clientes REST.
- Base de datos SQL.
- MongoDB.
- Mecanismos de autenticación.
- Proveedor de pagos o subsistema de pagos.
- Integraciones logísticas.
- Posibles servicios de notificaciones.

Si estas tecnologías están acopladas directamente al modelo de negocio, cambiar una base de datos o un framework requeriría modificar la lógica de negocio.

La Arquitectura Hexagonal evita este acoplamiento definiendo **puertos dentro del límite de aplicación/dominio** e implementando dichos puertos mediante adaptadores.

Por ejemplo:

```text
OrderProcessingService
        |
        v
OrderRepositoryPort
        |
        v
SqlOrderRepositoryAdapter
        |
        v
SQL
```

El servicio no sabe si el repositorio utiliza PostgreSQL, MySQL u otro motor relacional.

---

# 6. Capas de la Arquitectura

NexusMarket se organiza en cuatro áreas principales:

```text
src/
│
├── application/
├── domain/
├── adapters/
└── infrastructure/
```

Cada área tiene una responsabilidad específica.

---

# 7. Estructura de Paquetes

Estructura recomendada:

```text
src/
└── application/
    │
    ├── app.ts
    │
    ├── domain/
    │   ├── models/
    │   │   ├── user/
    │   │   ├── buyer/
    │   │   ├── seller/
    │   │   ├── product/
    │   │   ├── warehouse/
    │   │   ├── inventory/
    │   │   ├── cart/
    │   │   ├── order/
    │   │   └── audit/
    │   │
    │   ├── value-objects/
    │   │   ├── DominioCatalog.ts
    │   │   ├── SystemRole.ts
    │   │   ├── UserStatus.ts
    │   │   ├── CommercialStatus.ts
    │   │   ├── ProductStatus.ts
    │   │   ├── OrderStatus.ts
    │   │   ├── PaymentStatus.ts
    │   │   ├── InventoryMovementType.ts
    │   │   ├── WarehouseType.ts
    │   │   └── DeliveryMethod.ts
    │   │
    │   ├── services/
    │   │   ├── UserManagementService.ts
    │   │   ├── CatalogService.ts
    │   │   ├── InventoryService.ts
    │   │   ├── OrderProcessingService.ts
    │   │   └── AuditService.ts
    │   │
    │   ├── ports/
    │   │   ├── in/
    │   │   └── out/
    │   │
    │   ├── exceptions/
    │   └── events/
    │
    ├── application/
    │   ├── use-cases/
    │   │   ├── users/
    │   │   ├── catalog/
    │   │   ├── inventory/
    │   │   ├── orders/
    │   │   ├── billing/
    │   │   ├── logistics/
    │   │   └── reports/
    │   │
    │   ├── dto/
    │   │   ├── requests/
    │   │   └── responses/
    │   │
    │   └── mappers/
    │
    ├── adapters/
    │   ├── in/
    │   │   └── rest/
    │   │       ├── controllers/
    │   │       ├── routes/
    │   │       ├── requests/
    │   │       ├── responses/
    │   │       └── mappers/
    │   │
    │   └── out/
    │       ├── persistence/
    │       │   ├── sql/
    │       │   │   ├── models/
    │       │   │   ├── repositories/
    │       │   │   ├── mappers/
    │       │   │   └── adapters/
    │       │   │
    │       │   └── mongodb/
    │       │       ├── documents/
    │       │       ├── repositories/
    │       │       ├── mappers/
    │       │       └── adapters/
    │       │
    │       ├── payments/
    │       ├── logistics/
    │       └── notifications/
    │
    └── infrastructure/
        ├── config/
        ├── database/
        │   ├── sql/
        │   └── mongodb/
        ├── security/
        ├── http/
        ├── logging/
        └── dependency-injection/
```

La etiqueta `application` duplicada en el árbol conceptual anterior puede aplanarse en el repositorio real si se desea. Una estructura física más limpia es:

```text
src/
├── domain/
├── application/
├── adapters/
└── infrastructure/
```

---

# 8. Capa de Dominio

El Dominio es el núcleo de NexusMarket.

Contiene los conceptos y reglas de negocio identificados en la especificación funcional.

## 8.1 Entidades de dominio

Las entidades principales incluyen:

```text
Usuario
Comprador
Vendedor
Administrador
Supervisor
OperadorLogistico

Producto
ProductoFisico
ProductoDigital
Variante

Bodega
BodegaMarketplace
BodegaVendedor

Inventario
MovimientoInventario

CarritoDeCompras
ItemCarrito

Pedido
ItemPedido

RegistroAuditoria
```

Estas entidades no deben depender de:

- Express/Fastify.
- HTTP.
- Controladores de SQL.
- Controladores de MongoDB.
- Decoradores de ORM.
- DTOs de REST.
- Clases específicas de frameworks.

---

# 9. Objetos de Valor

Los Objetos de Valor representan conceptos definidos por sus valores y no por su identidad.

La arquitectura conserva los Objetos de Valor ya definidos para NexusMarket.

Ejemplos:

```text
DominioCatalog
SystemRole
UserStatus
CommercialStatus
ProductStatus
OrderStatus
PaymentStatus
InventoryMovementType
WarehouseType
ProductCategory
AuditSeverity
DeliveryMethod
```

Ejemplo:

```ts
class SystemRole {
    private constructor(
        public readonly value: string
    ) {}

    static comprador(): SystemRole {
        return new SystemRole("COMPRADOR");
    }

    static vendedor(): SystemRole {
        return new SystemRole("VENDEDOR");
    }
}
```

La implementación exacta puede utilizar clases, uniones discriminadas u otra representación de TypeScript, siempre que las reglas de dominio permanezcan explícitas e inmutables.

---

# 10. Servicios de Dominio

Los principales servicios de dominio son:

```text
UserManagementService
CatalogService
InventoryService
OrderProcessingService
AuditService
```

## 10.1 UserManagementService

Responsable de:

- Registro de compradores.
- Incorporación de vendedores.
- Estado de acceso de los usuarios.

Operaciones principales:

```text
registerBuyer()
onboardSeller()
updateUserAccessStatus()
```

## 10.2 CatalogService

Responsable de:

- Registro/publicación de productos.
- Gestión del estado de los productos.
- Variantes de productos.

Operaciones principales:

```text
publishProduct()
updateProductStatus()
```

## 10.3 InventoryService

Responsable de:

- Reposición de stock.
- Reserva de stock.
- Despacho de stock.
- Consistencia de los movimientos de inventario.

Operaciones principales:

```text
replenishStock()
reserveStockForOrder()
dispatchStock()
```

## 10.4 OrderProcessingService

Responsable de coordinar:

- Conversión de carrito a pedido.
- Confirmación del pago.
- Transiciones de estado del pedido.
- Finalización de la entrega.
- Cancelación cuando esté permitida.

Operaciones principales:

```text
createOrderFromCart()
confirmPayment()
cancelOrder()
completeDelivery()
```

## 10.5 AuditService

Responsable de:

```text
recordEvent()
```

y de conservar registros de auditoría inmutables y de solo adición.

---

# 11. Capa de Aplicación

La capa de Aplicación coordina los casos de uso.

Debe responder:

> ¿Qué necesita hacer el sistema para esta solicitud?

No debe contener las reglas fundamentales de negocio.

Por ejemplo:

```text
CreateOrderUseCase
        |
        v
OrderProcessingService
        |
        +----> InventoryService
        |
        +----> AuditService
```

La capa de Aplicación coordina la operación y el límite transaccional, mientras que el Dominio valida las reglas de negocio.

---

# 12. Puertos de Entrada

Los puertos de entrada definen lo que la aplicación puede hacer.

Ejemplos:

```text
RegisterBuyerUseCase
OnboardSellerUseCase
PublishProductUseCase
ReserveStockUseCase
CreateOrderUseCase
ConfirmPaymentUseCase
CompleteDeliveryUseCase
```

Un controlador REST debe depender de un puerto de entrada en lugar de manipular directamente las entidades de dominio.

Ejemplo:

```text
POST /orders
      |
      v
CreateOrderController
      |
      v
CreateOrderUseCase
      |
      v
OrderProcessingService
```

---

# 13. Puertos de Salida

Los puertos de salida definen las dependencias requeridas por el dominio/aplicación.

Los puertos recomendados incluyen:

```text
UserRepository
SellerRepository
BuyerRepository

ProductRepository
VariantRepository

WarehouseRepository
InventoryRepository
InventoryMovementRepository

CartRepository
OrderRepository

AuditRepository

PaymentGateway
LogisticsGateway
NotificationGateway
```

Las interfaces pertenecen al límite de aplicación/dominio.

Las implementaciones pertenecen a los adaptadores.

---

# 14. Adaptadores de Entrada

REST se propone como mecanismo inicial de entrada.

Responsabilidades:

- Recibir solicitudes HTTP.
- Validar la entrada a nivel de transporte.
- Autenticar la solicitud.
- Convertir los DTOs de solicitud.
- Invocar los puertos de entrada.
- Convertir los resultados en DTOs de respuesta.
- Mapear los errores a respuestas HTTP.

Los controladores no deben implementar reglas de negocio.

Ejemplo:

```text
HTTP Request
     |
     v
Controller
     |
     v
Request DTO
     |
     v
Caso de uso / Puerto de entrada
     |
     v
Dominio
```

---

# 15. Adaptadores de Salida

Los adaptadores de salida conectan el sistema con recursos externos.

Ejemplos:

```text
SQL persistence
MongoDB persistence
Payment provider
Logistics provider
Notification system
```

El Dominio se comunica con estos sistemas únicamente mediante puertos.

---

# 16. Estrategia de SQL y MongoDB

NexusMarket **no debe utilizar SQL y MongoDB indistintamente**.

Cada base de datos debe tener una responsabilidad clara.

## 16.1 SQL como fuente de verdad

Se recomienda SQL como base de datos principal para los datos de negocio transaccionales.

Motivo: NexusMarket contiene relaciones sólidas e invariantes transaccionales alrededor de:

- Usuarios.
- Vendedores.
- Compradores.
- Productos.
- Variantes.
- Bodegas.
- Inventario.
- Carritos.
- Pedidos.
- Ítems de pedido.
- Registros de pagos/facturación.
- Envíos.

Estas operaciones se benefician de:

- Transacciones ACID.
- Claves foráneas.
- Restricciones.
- Integridad referencial.
- Actualizaciones consistentes.
- Semántica transaccional sólida.

Dominios SQL recomendados:

```text
users
buyers
sellers
warehouses
products
product_variants
inventory
inventory_movements
carts
cart_items
orders
order_items
payments
shipments
```

El esquema exacto debe definirse durante el diseño de la base de datos.

---

# 17. Estrategia de MongoDB

MongoDB se recomienda como tecnología de persistencia complementaria y no como base de datos transaccional principal.

El caso de uso inicial más adecuado es:

```text
Auditoría / Trazabilidadability
```

Los registros de auditoría están orientados naturalmente a la adición y pueden contener información contextual que evoluciona con el tiempo.

Ejemplo de documento de MongoDB:

```json
{
  "eventId": "evt-123",
  "eventType": "INVENTORY_RESERVATION",
  "severity": "INFORMACIÓN",
  "actor": {
    "userId": "usr-456",
    "role": "VENDEDOR"
  },
  "entity": {
    "type": "Inventario",
    "id": "inv-789"
  },
  "timestamp": "2026-01-01T10:00:00Z",
  "operation": "RESERVA",
  "result": "SUCCESS",
  "metadata": {
    "orderId": "ord-001",
    "variantId": "var-002"
  }
}
```

Esta estructura debe considerarse un ejemplo arquitectónico y no un esquema final de MongoDB.

---

# 18. ¿Por qué no almacenar todo en MongoDB?

Sería posible utilizar MongoDB para todo el sistema, pero esto haría más difícil expresar y mantener algunos invariantes importantes de NexusMarket.

El sistema tiene relaciones transaccionales sólidas como:

```text
Order
  |
  +---- OrderItems
  |
  +---- Buyer
  |
  +---- Product/Variant
  |
  +---- Inventory
  |
  +---- Payment
  |
  +---- Shipment
```

El inventario también requiere consistencia atómica.

Por ejemplo:

```text
availableQuantity -= X
reservedQuantity += X
create InventoryMovement
```

Estos cambios deben coordinarse de forma transaccional.

Por lo tanto, SQL es la fuente de verdad preferida para las transacciones centrales del negocio.

---

# 19. Regla de Propiedad de los Datos

Una regla arquitectónica muy importante es:

> Un hecho de negocio debe tener una única fuente autorizada.

Propiedad recomendada:

| Business information | Source of truth |
|---|---|
| Users | SQL |
| Buyers | SQL |
| Sellers | SQL |
| Products | SQL |
| Variants | SQL |
| Warehouses | SQL |
| Inventory | SQL |
| Inventory movements | SQL |
| Carts | SQL |
| Orders | SQL |
| Payments/billing records | SQL |
| Shipments | SQL |
| Audit events | MongoDB |

MongoDB no debe convertirse en una segunda copia autorizada de los pedidos o del inventario.

---

# 20. Límites Transaccionales

Los límites transaccionales son especialmente importantes para NexusMarket.

## 20.1 Reserva de inventario

La siguiente operación debe ser atómica:

```text
BEGIN TRANSACTION

Validate available inventory

Decrease available quantity

Increase reserved quantity

Create inventory movement

COMMIT
```

Si alguna operación falla:

```text
ROLLBACK
```

No debe quedar ninguna reserva parcial.

---

# 21. Transacción de Procesamiento de Pedidos

Conceptualmente, un flujo de confirmación de pago/procesamiento de pedido puede ser:

```text
Confirm payment
      |
      v
Validate order
      |
      v
Update payment state
      |
      v
Update order state
      |
      v
Reserve inventory
      |
      v
Create inventory movement
      |
      v
Commit
```

El límite transaccional exacto debe refinarse durante la implementación, dependiendo de si el pago es interno o lo proporciona un servicio externo.

Los proveedores de pago externos no deben tratarse como si formaran parte de la transacción SQL.

---

# 22. Integración de Pagos Externos

La especificación funcional requiere validación de pagos, pero no especifica un proveedor de pagos concreto.

Por lo tanto, la arquitectura debe definir:

```text
PaymentGateway
```

como un puerto de salida.

Ejemplo:

```text
OrderProcessingService
        |
        v
PaymentGateway
        |
        v
Payment Adapter
        |
        v
External Payment Provider
```

Esto permite cambiar el proveedor sin modificar el dominio de pedidos.

---

# 23. Integración Logística

La especificación incluye operadores logísticos, empaquetado, despacho, transporte y entrega.

La arquitectura debe aislar la logística detrás de un puerto:

```text
LogisticsGateway
```

Posible adaptador:

```text
LogisticsGateway
       |
       v
LogisticsAdapter
       |
       v
External Logistics System
```

El proyecto inicial puede implementar esto mediante un adaptador interno si no existe un proveedor externo disponible.

---

# 24. Arquitectura de Seguridad

La especificación funcional requiere que las operaciones sean realizadas por usuarios autenticados y restringe a los participantes según sus roles.

Por lo tanto, la arquitectura separa:

```text
Authentication
Authorization
Reglas de negocio
```

La autenticación determina:

> ¿Quién es el usuario?

La autorización determina:

> ¿Este rol tiene permitido ejecutar este caso de uso?

El Dominio determina:

> ¿Esta operación cumple las reglas de negocio?

Esto evita colocar toda la lógica de autorización dentro de los controladores.

---

# 25. Acceso Basado en Roles

Los roles principales son:

```text
COMPRADOR
VENDEDOR
OPERADOR_LOGISTICO
ADMINISTRADOR
SUPERVISOR
```

Flujo conceptual de autorización:

```text
HTTP Request
     |
     v
Authentication
     |
     v
Authenticated User
     |
     v
Authorization
     |
     v
Input Port
     |
     v
Dominio Rules
```

Las restricciones de roles definidas por la especificación funcional deben seguir aplicándose incluso si se reemplaza la interfaz REST.

---

# 26. Arquitectura de Auditoría

La auditoría es una preocupación transversal.

El flujo recomendado es:

```text
Dominio Operation
      |
      v
Audit Port
      |
      v
Audit Adapter
      |
      v
MongoDB
```

Ejemplo:

```text
InventoryService
      |
      v
AuditRepository
      |
      v
MongoAuditRepository
      |
      v
MongoDB
```

El Dominio no importa un controlador de MongoDB.

---

# 27. Manejo de Errores

La arquitectura debe distinguir:

### Errores de dominio

Ejemplos:

```text
InsufficientStockException
InvalidOrderStateException
UnauthorizedDominioOperationException
DuplicateUserIdentityException
InvalidProductStatusException
InvalidInventoryOperationException
```

### Errores de aplicación

Errores de ejecución de casos de uso.

### Errores de adaptador

Ejemplos:

```text
DatabaseConnectionException
PaymentProviderException
LogisticsProviderException
```

### Errores HTTP

El adaptador REST mapea los errores internos a respuestas HTTP.

Ejemplo:

```text
Dominio Exception
       |
       v
Capa de Aplicación
       |
       v
Controller Error Mapper
       |
       v
HTTP 409 / 400 / 403 / 404 / 500
```

El Dominio no debe lanzar excepciones específicas de HTTP.

---

# 28. Reglas de Dominio que Deben Preservarse

La arquitectura debe preservar las reglas críticas identificadas en la especificación funcional.

## Reglas de usuarios

- Toda operación requiere un usuario autenticado.
- Cada usuario tiene un rol.
- Los usuarios no pueden administrar información fuera de su rol.
- El documento de identidad y el correo electrónico son únicos.
- Los vendedores no pueden registrarse por sí mismos.

## Reglas del catálogo

- Un producto pertenece a un vendedor.
- Los productos pueden ser físicos o digitales.
- Los productos pueden tener variantes.
- Las variantes utilizan SKU.
- Los estados de los productos están controlados.

## Reglas de inventario

- El inventario se distribuye por bodega.
- El inventario está asociado a una variante de producto.
- El stock no puede volverse negativo.
- El stock inválido o no disponible no puede reservarse.
- Los movimientos de inventario deben ser trazables.

## Reglas de pedidos

- Los pedidos siguen estados controlados.
- Los compradores gestionan sus propios pedidos.
- Los pedidos finalizados no pueden modificarse.
- La validación del pago forma parte del flujo del pedido.

Estas reglas son impulsores arquitectónicos y no deben ocultarse dentro de los adaptadores de base de datos o los controladores.

---

# 29. Flujo Principal del Dominio

El flujo principal del negocio puede representarse así:

```text
Administrator
     |
     v
Register Seller
     |
     v
Register First Warehouse
     |
     v
Seller
     |
     v
Register Product
     |
     v
Create/Load Inventory
     |
     v
Publish Product
     |
     v
Buyer
     |
     v
Shopping Cart
     |
     v
Create Order
     |
     v
Pending Payment
     |
     v
Payment Validation
     |
     v
Paid
     |
     v
Reserve Inventory
     |
     v
Packaging / Dispatch
     |
     v
Dispatched
     |
     v
Delivery
     |
     v
Delivered / Finalized
```

Este flujo es coordinado por casos de uso de aplicación y servicios de dominio, en lugar de por controladores.

---

# 30. Límites de Módulos Sugeridos

Inicialmente, el proyecto puede organizarse como un **monolito modular**.

Módulos delimitados recomendados:

```text
Identity & Users
Catalog
Inventory
Orders
Billing & Payments
Logistics
Returns & Refunds
Reportes
Audit
```

Esto es preferible a comenzar directamente con microservicios.

---

# 31. ¿Por qué un Monolito Modular?

NexusMarket tiene varios procesos transaccionales estrechamente relacionados:

```text
Order
  |
  +---- Payment
  |
  +---- Inventory
  |
  +---- Shipment
```

Separarlos inmediatamente en microservicios introduciría:

- Transacciones distribuidas.
- Fallos de red.
- Consistencia eventual.
- Descubrimiento de servicios.
- Mayor complejidad de despliegue.
- Mayores requisitos de monitorización.
- Desarrollo local más complicado.

Para la versión inicial, un monolito modular proporciona:

- Límites de módulos claros.
- Transacciones simples.
- Desarrollo más sencillo.
- Pruebas más sencillas.
- Menor complejidad operativa.
- Posibilidad de extraer servicios en el futuro.

Por lo tanto, la arquitectura debe estar **preparada para microservicios sin depender de ellos**.

---

# 32. Extracción Futura de Microservicios

Si NexusMarket crece significativamente, algunos módulos podrían convertirse posteriormente en servicios independientes.

Posible evolución:

```text
                    API Gateway
                         |
        +----------------+----------------+
        |                |                |
        v                v                v
     Identity          Catalog          Orders
                                          |
                                  +-------+-------+
                                  |               |
                                  v               v
                              Inventory        Payments
                                  |
                                  v
                              Logistics
```

Esta es una evolución futura, no un requisito para la primera implementación.

---

# 33. Extensión Orientada a Eventos

La arquitectura puede introducir posteriormente eventos de dominio como:

```text
BuyerRegistered
SellerOnboarded
ProductPublished
StockReplenished
StockReserved
OrderCreated
PaymentApproved
OrderDispatched
OrderDelivered
OrderCancelled
```

Flujo posible:

```text
OrderDelivered
      |
      v
Event Publisher
      |
      +----> Audit
      +----> Notifications
      +----> Reportes
      +----> Analytics
```

Esto debe introducirse únicamente cuando exista una necesidad real de procesamiento asíncrono.

---

# 34. Reportes

La especificación funcional incluye reportes administrativos.

Los reportes no deben consultar directamente componentes internos arbitrarios del dominio.

Un enfoque recomendado es:

```text
ReportesUseCase
       |
       v
ReportesQueryPort
       |
       v
Read Adapter
       |
       v
SQL / Read Model
```

Para reportes de alto volumen en el futuro, puede introducirse un modelo de lectura independiente o un almacén analítico sin modificar la lógica transaccional del dominio.

---

# 35. Arquitectura de Pruebas

La arquitectura debe admitir varios niveles de pruebas.

## Pruebas unitarias

Focus on:

- Entities.
- Value Objects.
- Dominio Services.
- Business rules.

Estas pruebas no deben requerir bases de datos.

## Pruebas de aplicación

Validar los casos de uso y las interacciones con los puertos.

## Pruebas de integración

Validar:

- Adaptadores SQL.
- Adaptadores de MongoDB.
- Adaptadores de pagos.
- Adaptadores logísticos.

## Pruebas de API

Validar:

- Endpoints REST.
- Autenticación.
- Autorización.
- Mapeo de solicitudes/respuestas.

Pirámide recomendada:

```text
          /\
         /  \
        / API\
       /------\
      / Integr.\
     /----------\
    / Aplicación\
   /--------------\
  / Dominio / Unit  \
 /------------------\
```

La capa de pruebas más grande debe ser la de dominio/pruebas unitarias.

---

# 36. Flujo de Dependencias

Las dependencias deben apuntar hacia el interior.

```text
REST Controller
       |
       v
Aplicación Use Case
       |
       v
Dominio Service
       |
       v
Output Port
       |
       v
Adapter
       |
       v
Infraestructura
       |
       v
Database / External System
```

La dirección opuesta está prohibida:

```text
Dominio -> MongoDB
Dominio -> SQL Driver
Dominio -> HTTP
Dominio -> Express
Dominio -> REST DTO
```

---

# 37. Inyección de Dependencias

Las dependencias deben inyectarse en la raíz de composición de la aplicación.

Conceptualmente:

```text
app.ts
 |
 +-- creates SQL repositories
 |
 +-- creates Mongo audit repository
 |
 +-- creates payment adapter
 |
 +-- creates logistics adapter
 |
 +-- creates domain services
 |
 +-- creates use cases
 |
 +-- creates controllers
```

Ejemplo:

```text
OrderProcessingService
        |
        +--> OrderRepository
        +--> InventoryRepository
        +--> AuditRepository
        +--> PaymentGateway
```

El servicio recibe interfaces en lugar de clases concretas de base de datos.

---

# 38. Stack de Ejecución Recomendado

Un stack inicial razonable es:

```text
Language:
    TypeScript

Runtime:
    Node.js

Arquitectura:
    Arquitectura Hexagonal + DDD

API:
    REST

Base de datos principal:
    SQL

NoSQL:
    MongoDB

Pruebas:
    Unit + Integration + API

Build:
    TypeScript compiler / compatible build tooling

Gestión de dependencias:
    npm
```

El framework HTTP específico y el ORM/constructor de consultas deben mantenerse como detalles arquitectónicos reemplazables.

---

# 39. Recomendación de Tecnología SQL

La arquitectura deja intencionadamente reemplazable el motor SQL.

Las opciones adecuadas incluyen:

```text
PostgreSQL
MySQL
MariaDB
```

Para NexusMarket, PostgreSQL sería una opción predeterminada sólida debido a su soporte de transacciones, restricciones, capacidades de indexación y ecosistema maduro.

Sin embargo, el Dominio no debe depender de APIs específicas de PostgreSQL.

Por lo tanto:

```text
Dominio
   |
   v
Repository Port
   |
   v
PostgreAdaptador SQL
```

en lugar de:

```text
Dominio
   |
   v
PostgreSQL Driver
```

---

# 40. Límite de la API

La API REST debe exponer DTOs en lugar de entidades de dominio.

Ejemplo:

```text
POST /buyers
POST /sellers
POST /products
PATCH /products/{id}/status
POST /inventory/replenishment
POST /orders
POST /orders/{id}/payment
POST /orders/{id}/dispatch
POST /orders/{id}/delivery
```

Estos endpoints son ejemplos arquitectónicos y deben refinarse durante la especificación de la API.

El controlador nunca debe exponer directamente:

```text
Producto
Pedido
Inventario
Usuario
```

como objetos de implementación de persistencia/dominio.

---

# 41. Mapeo de Persistencia

Los objetos de dominio y los modelos de persistencia deben permanecer separados.

```text
Dominio Entity
      |
      v
Mapper
      |
      v
SQL Entity / Mongo Document
```

Y en la dirección opuesta:

```text
SQL Entity / Mongo Document
      |
      v
Mapper
      |
      v
Dominio Entity
```

Esto protege al dominio de las representaciones específicas de la base de datos.

---

# 42. Restricciones Arquitectónicas

Las siguientes reglas son obligatorias:

1. La lógica de negocio pertenece al Dominio.
2. Los controladores no contienen reglas de negocio.
3. Los DTOs no entran al Dominio.
4. Los modelos SQL no se exponen mediante la API.
5. Los documentos de MongoDB no se exponen mediante la API.
6. El código de dominio no importa controladores de bases de datos.
7. El código de dominio no importa frameworks HTTP.
8. Los adaptadores implementan puertos.
9. La Infraestructura no define reglas de negocio.
10. Los datos transaccionales centrales tienen una única fuente autorizada.
11. SQL es la fuente de verdad de las entidades de negocio transaccionales.
12. MongoDB es complementario y, inicialmente, está dedicado principalmente a auditoría/trazabilidad.
13. Los cambios de inventario deben preservar la consistencia atómica.
14. Los pedidos finalizados no pueden modificarse.
15. Las restricciones de roles deben aplicarse independientemente de la capa de transporte.
16. Los registros de auditoría son inmutables y de solo adición.

---

# 43. Arquitectura Final Propuesta

```text
                                  NexusMarket
                                       |
                                       v
                              +----------------+
                              |   REST API     |
                              +-------+--------+
                                      |
                                      v
                              +---------------+
                              |   Controllers |
                              +-------+-------+
                                      |
                                      v
                              +---------------+
                              |  Aplicación   |
                              |   Use Cases   |
                              +-------+-------+
                                      |
                                      v
                    +-----------------------------------+
                    |              DOMAIN                |
                    |                                   |
                    | Entities                          |
                    | Value Objects                     |
                    | Dominio Services                   |
                    | Reglas de negocio                    |
                    | Input / Puertos de salida              |
                    +----------------+------------------+
                                     |
                    +----------------+----------------+
                    |                                 |
                    v                                 v
          +-------------------+              +-------------------+
          |   Adaptador SQLs    |              | MongoDB Adapter   |
          +---------+---------+              +---------+---------+
                    |                                  |
                    v                                  v
          +-------------------+              +-------------------+
          | SQL               |              | MongoDB           |
          | Transactional     |              | Auditoría / Trazabilidad     |
          | Source of Truth   |              |                   |
          +-------------------+              +-------------------+

                    External Adaptadores
                         |
              +----------+----------+
              |                     |
              v                     v
        Pasarela de pagos       Pasarela logística
```

---

# 44. Decisión Arquitectónica Final

Para NexusMarket, la arquitectura recomendada es:

```text
                    TypeScript
                        +
                   Node.js
                        +
             Hexagonal Architecture
                        +
                       DDD
                        +
               Modular Monolith
                        +
             SQL as transactional SoT
                        +
          MongoDB for audit/traceability
                        +
                REST API
```

Esta combinación proporciona un buen equilibrio entre integridad del dominio, mantenibilidad, consistencia transaccional y escalabilidad futura.

La decisión arquitectónica más importante no es simplemente elegir TypeScript, SQL o MongoDB. Es la separación de responsabilidades:

```text
Dominio
  = business rules

Aplicación
  = use-case orchestration

Adaptadores
  = translation to/from external systems

Infraestructura
  = technical implementation

SQL
  = transactional business truth

MongoDB
  = complementary audit/traceability store
```

Esto permite que NexusMarket evolucione sin obligar a realizar cambios en el modelo de negocio cada vez que cambie un framework, una base de datos, un proveedor de pagos o un proveedor logístico.
