# Output Ports — NexusMarket

## 1. Propósito

Los **Output Ports** de NexusMarket representan los contratos mediante los cuales el núcleo de la aplicación solicita información o servicios que se encuentran fuera del dominio y de la lógica central del sistema.

En la **Arquitectura Hexagonal (Ports and Adapters)**, los Output Ports pertenecen al lado interno de la aplicación. Definen **qué necesita el sistema**, pero no **cómo se implementa técnicamente esa necesidad**.

Su objetivo es mantener el dominio y la aplicación independientes de:

- PostgreSQL u otro motor SQL.
- MongoDB.
- Proveedores de pago.
- Sistemas logísticos externos.
- Servicios de notificación.
- Proveedores de identidad o autenticación, cuando corresponda.
- Librerías específicas de persistencia.

La implementación concreta de cada port se realiza mediante un **Output Adapter**.

---

## 2. Ubicación dentro de la arquitectura

```text
+------------------------------------------------------+
|                 Adaptadores de Entrada               |
|              REST / HTTP / Controllers               |
+---------------------------+--------------------------+
                            |
                            v
+------------------------------------------------------+
|                   Capa de Aplicación                 |
|                Casos de uso / Commands               |
+---------------------------+--------------------------+
                            |
                            v
+------------------------------------------------------+
|                    Capa de Dominio                   |
|       Entidades / Objetos de Valor / Servicios       |
|                    Reglas de negocio                 |
+---------------------------+--------------------------+
                            |
                     Output Ports
                            |
             +--------------+--------------+
             |              |              |
             v              v              v
      +-----------+   +-----------+   +-----------+
      | SQL       |   | MongoDB   |   | Servicios |
      | Adapter   |   | Adapter   |   | externos  |
      +-----------+   +-----------+   +-----------+
             |              |              |
             v              v              v
        PostgreSQL      MongoDB       Pagos / Logística
```

La dirección de dependencia debe mantenerse hacia el interior:

```text
Adapter -> Output Port -> Application/Domain
```

y no:

```text
Domain -> PostgreSQL
Domain -> MongoDB
Domain -> SDK de pagos
Domain -> SDK logístico
```

---

# 3. Principio fundamental

Un Output Port expresa una necesidad del sistema mediante un contrato.

Por ejemplo, NexusMarket necesita guardar y consultar pedidos. El dominio o la aplicación no deberían conocer PostgreSQL, SQL, Prisma, TypeORM o MongoDB.

En su lugar, pueden depender de:

```typescript
interface OrderRepository {
    guardar(pedido: Pedido): Promise<void>;
    buscarPorId(id: string): Promise<Pedido | null>;
}
```

La implementación concreta puede ser:

```text
OrderRepository
        ^
        |
SQLOrderRepository
        |
        v
   PostgreSQL
```

Si posteriormente se sustituye el motor de persistencia, el contrato interno puede permanecer estable.

---

# 4. Clasificación de Output Ports

Para NexusMarket se proponen cuatro grupos:

1. **Ports de persistencia transaccional**
2. **Ports de auditoría y trazabilidad**
3. **Ports de servicios externos**
4. **Ports de consulta y reporting**

La separación busca mantener responsabilidades claras y evitar ports excesivamente genéricos.

---

# 5. Ports de persistencia transaccional

Representan las necesidades de almacenamiento y recuperación de información que participa directamente en las operaciones del negocio.

La especificación funcional define como componentes principales usuarios, vendedores, compradores, bodegas, productos, inventario, pedidos, facturación y envíos.

Para esta información, la arquitectura establece **SQL como fuente principal de verdad**.

MongoDB no debe convertirse en una segunda fuente autoritativa de los mismos datos sin una decisión arquitectónica explícita.

---

## 5.1 UserRepository

Responsable de persistir y consultar usuarios.

```typescript
interface UserRepository {
    guardar(usuario: Usuario): Promise<void>;
    buscarPorId(id: string): Promise<Usuario | null>;
    buscarPorCorreo(correo: string): Promise<Usuario | null>;
    existePorCorreo(correo: string): Promise<boolean>;
}
```

### Responsabilidades

- Guardar usuarios.
- Buscar usuarios por identificador.
- Consultar usuarios por correo.
- Verificar unicidad del correo.
- Recuperar estado y rol del usuario.

### Reglas relacionadas

- El correo debe ser único.
- Cada usuario posee un único rol.
- Toda operación requiere un usuario autenticado.
- Un usuario no puede administrar información fuera de su rol.

---

## 5.2 SellerRepository

Responsable de la persistencia de vendedores.

```typescript
interface SellerRepository {
    guardar(vendedor: Vendedor): Promise<void>;
    buscarPorId(id: string): Promise<Vendedor | null>;
}
```

### Responsabilidades

- Registrar vendedores.
- Consultar vendedores.
- Mantener la relación entre vendedor y productos.
- Proporcionar información necesaria para operaciones de catálogo.

### Regla importante

El vendedor no puede autorregistrarse. La incorporación corresponde al Administrador.

---

## 5.3 BuyerRepository

Responsable de la persistencia de compradores.

```typescript
interface BuyerRepository {
    guardar(comprador: Comprador): Promise<void>;
    buscarPorId(id: string): Promise<Comprador | null>;
}
```

### Responsabilidades

- Registrar compradores.
- Recuperar compradores.
- Consultar información necesaria para pedidos.
- Mantener dirección principal, direcciones adicionales y estado comercial.

---

## 5.4 ProductRepository

Responsable de productos y sus variantes.

```typescript
interface ProductRepository {
    guardar(producto: Producto): Promise<void>;
    buscarPorId(id: string): Promise<Producto | null>;
    listarPublicados(): Promise<Producto[]>;
    actualizar(producto: Producto): Promise<void>;
}
```

### Responsabilidades

- Registrar productos.
- Recuperar productos.
- Consultar productos publicados.
- Actualizar información permitida.
- Mantener la relación entre producto y vendedor.

Las variantes forman parte del modelo de producto y deben conservar su identidad y SKU.

---

## 5.5 WarehouseRepository

Responsable de las bodegas.

```typescript
interface WarehouseRepository {
    guardar(bodega: Bodega): Promise<void>;
    buscarPorId(id: string): Promise<Bodega | null>;
    listarPorVendedor(vendedorId: string): Promise<Bodega[]>;
}
```

### Responsabilidades

- Registrar bodegas.
- Recuperar bodegas.
- Consultar bodegas pertenecientes a un vendedor.
- Permitir determinar dónde se encuentra el inventario.

---

# 6. Ports de inventario

El inventario es una parte crítica de NexusMarket porque las operaciones de reserva y salida deben mantener consistencia.

## 6.1 InventoryRepository

```typescript
interface InventoryRepository {
    buscarPorVarianteYBodega(
        varianteId: string,
        bodegaId: string
    ): Promise<Inventario | null>;

    guardar(inventario: Inventario): Promise<void>;

    actualizar(inventario: Inventario): Promise<void>;
}
```

### Responsabilidades

- Recuperar existencias.
- Actualizar cantidades disponibles.
- Actualizar cantidades reservadas.
- Persistir el estado del inventario.

### Invariante crítica

No se permiten existencias negativas.

Por ello, una reserva no debe implementarse como una simple lectura seguida de una actualización sin protección contra condiciones de carrera. El adapter SQL debe garantizar la atomicidad necesaria.

---

## 6.2 InventoryMovementRepository

Responsable de persistir movimientos de inventario.

```typescript
interface InventoryMovementRepository {
    guardar(movimiento: MovimientoInventario): Promise<void>;
    listarPorInventario(inventarioId: string): Promise<MovimientoInventario[]>;
}
```

### Tipos de movimiento

- `INGRESO`
- `RESERVA`
- `SALIDA_VENTA`
- `AJUSTE`
- `DEVOLUCION`

Cada movimiento debe poder relacionarse con el inventario correspondiente y formar parte de la trazabilidad operacional.

---

# 7. Ports de carrito y pedidos

## 7.1 CartRepository

Responsable de la persistencia del carrito de compras.

```typescript
interface CartRepository {
    buscarPorComprador(compradorId: string): Promise<CarritoDeCompras | null>;
    guardar(carrito: CarritoDeCompras): Promise<void>;
    actualizar(carrito: CarritoDeCompras): Promise<void>;
}
```

### Responsabilidades

- Recuperar el carrito del comprador.
- Persistir productos agregados.
- Actualizar cantidades.
- Mantener la relación entre comprador e ítems.

---

## 7.2 OrderRepository

Responsable de los pedidos.

```typescript
interface OrderRepository {
    guardar(pedido: Pedido): Promise<void>;
    buscarPorId(id: string): Promise<Pedido | null>;
    listarPorComprador(compradorId: string): Promise<Pedido[]>;
    listarPorVendedor(vendedorId: string): Promise<Pedido[]>;
    actualizar(pedido: Pedido): Promise<void>;
}
```

### Responsabilidades

- Crear pedidos.
- Recuperar pedidos.
- Consultar pedidos según el participante autorizado.
- Persistir cambios de estado permitidos.

### Estados principales

```text
CARRITO
   |
   v
PENDIENTE_PAGO
   |
   v
PAGADO
   |
   v
DESPACHADO
   |
   v
ENTREGADO
```

La especificación también contempla procesos de cancelación y reembolso. Su implementación concreta debe respetar las reglas definidas para esos procesos.

### Restricción crítica

Un pedido entregado/finalizado no puede modificarse.

El repositorio no debe utilizarse para saltarse esta regla. La validación pertenece al dominio o a la aplicación; el adapter persiste únicamente una operación válida.

---

# 8. Ports relacionados con pagos

La especificación contempla validación de pago, facturación y reembolsos, pero no define un proveedor tecnológico específico.

Por ello, la dependencia se abstrae mediante un port.

## 8.1 PaymentGateway

```typescript
interface PaymentGateway {
    procesarPago(request: PaymentRequest): Promise<PaymentResult>;

    consultarPago(paymentId: string): Promise<PaymentResult>;

    solicitarReembolso(
        request: RefundRequest
    ): Promise<RefundResult>;
}
```

### Responsabilidades

- Procesar pagos.
- Consultar resultados.
- Solicitar reembolsos.

### No debe conocer

El dominio no debe depender directamente de:

```text
Proveedor de pagos
SDK específico
API HTTP concreta
Credenciales
Endpoints
Tokens técnicos
```

El adapter traduce el contrato interno al proveedor seleccionado.

```text
PaymentGateway
       ^
       |
PaymentProviderAdapter
       |
       v
Proveedor de pagos
```

---

# 9. Ports de facturación

Si la facturación se maneja dentro de NexusMarket:

```typescript
interface InvoiceRepository {
    guardar(factura: Factura): Promise<void>;
    buscarPorId(id: string): Promise<Factura | null>;
    buscarPorPedido(pedidoId: string): Promise<Factura | null>;
}
```

Si se delega a un sistema externo:

```typescript
interface BillingGateway {
    emitirFactura(request: BillingRequest): Promise<BillingResult>;
    consultarFactura(id: string): Promise<BillingResult>;
}
```

La especificación funcional no determina cuál alternativa se utilizará. Por tanto, la decisión corresponde al diseño técnico posterior.

---

# 10. Ports logísticos

NexusMarket contempla empaque, despacho, transporte y confirmación de entrega para productos físicos.

## 10.1 LogisticsGateway

```typescript
interface LogisticsGateway {
    crearEnvio(request: ShipmentRequest): Promise<ShipmentResult>;

    consultarEnvio(
        shipmentId: string
    ): Promise<ShipmentResult>;

    confirmarEntrega(
        shipmentId: string
    ): Promise<DeliveryResult>;
}
```

### Responsabilidades

- Crear envíos.
- Consultar estado.
- Obtener información de seguimiento.
- Registrar o consultar la confirmación de entrega.

```text
NexusMarket
     |
     v
LogisticsGateway
     |
     v
LogisticsAdapter
     |
     +---- Empresa logística A
     |
     +---- Empresa logística B
     |
     +---- Sistema interno
```

---

# 11. ShipmentRepository

Además del gateway externo, NexusMarket puede necesitar persistir la información propia del envío.

```typescript
interface ShipmentRepository {
    guardar(envio: Envio): Promise<void>;
    buscarPorId(id: string): Promise<Envio | null>;
    buscarPorPedido(pedidoId: string): Promise<Envio | null>;
    actualizar(envio: Envio): Promise<void>;
}
```

La separación es intencional:

```text
ShipmentRepository
    =
datos propios de NexusMarket

LogisticsGateway
    =
comunicación con el sistema logístico externo
```

---

# 12. Ports de auditoría

La auditoría es un requisito importante del sistema.

El modelo establece que los movimientos de inventario deben quedar auditados y que los registros de auditoría son inmutables.

## 12.1 AuditRepository

```typescript
interface AuditRepository {
    registrar(evento: RegistroAuditoria): Promise<void>;

    buscarPorEntidad(
        entidadTipo: string,
        entidadId: string
    ): Promise<RegistroAuditoria[]>;
}
```

### Característica

Los registros deben tratarse como **append-only**:

```text
CREAR  -> permitido
LEER   -> permitido
EDITAR -> no permitido
BORRAR -> no permitido
```

### Persistencia

La arquitectura propone MongoDB principalmente para auditoría y trazabilidad:

```text
AuditRepository
       ^
       |
MongoAuditRepository
       |
       v
    MongoDB
```

MongoDB no sustituye al SQL como fuente de verdad transaccional.

---

# 13. Ports de reporting y consultas

Los reportes administrativos pueden requerir información combinada de varias entidades.

Para evitar consultas complejas dentro del dominio, se recomienda separar las necesidades de lectura.

## 13.1 ReportingQuery

```typescript
interface ReportingQuery {
    obtenerResumenVentas(
        filtros: SalesReportFilters
    ): Promise<SalesReport>;

    obtenerResumenInventario(
        filtros: InventoryReportFilters
    ): Promise<InventoryReport>;

    obtenerResumenPedidos(
        filtros: OrderReportFilters
    ): Promise<OrderReport>;
}
```

### Característica

Este port está orientado a lectura y no debe modificar el estado del sistema.

Puede implementarse mediante:

- Consultas SQL optimizadas.
- Vistas.
- Proyecciones.
- Consultas especializadas.

La implementación debe respetar la autorización correspondiente al rol del usuario.

---

# 14. Ports y autenticación

La especificación exige que toda operación sea ejecutada por un usuario autenticado, pero deja fuera del alcance los mecanismos técnicos de autenticación.

Por ello, la autenticación debe tratarse como una preocupación arquitectónica separada del dominio.

Conceptualmente puede existir:

```typescript
interface IdentityProvider {
    validarCredenciales(
        credentials: Credentials
    ): Promise<AuthenticatedIdentity>;
}
```

Este port solo debe incorporarse si el diseño de autenticación elegido requiere que NexusMarket abstraiga un proveedor de identidad.

La especificación no determina si se utilizará:

- JWT.
- OAuth 2.0.
- OpenID Connect.
- Sesiones.
- Un proveedor externo.

La decisión debe quedar documentada en la arquitectura de seguridad.

---

# 15. ¿Dónde se implementan los Output Ports?

Los ports son contratos internos y los adapters viven fuera del núcleo.

Una estructura conceptual puede ser:

```text
src/
└── main/
    └── typescript/
        ├── domain/
        │   ├── models/
        │   ├── value-objects/
        │   ├── services/
        │   └── ports/
        │
        ├── application/
        │   └── use-cases/
        │
        └── adapters/
            └── out/
                ├── persistence/
                │   ├── sql/
                │   └── mongo/
                │
                └── external/
                    ├── payments/
                    └── logistics/
```

La estructura física puede variar, pero la separación conceptual debe mantenerse.

---

# 16. SQL Output Adapters

Los adapters SQL implementan los ports relacionados con información transaccional.

```text
UserRepository
      ^
      |
SQLUserRepository
      |
      v
 PostgreSQL
```

```text
ProductRepository
      ^
      |
SQLProductRepository
      |
      v
 PostgreSQL
```

```text
OrderRepository
      ^
      |
SQLOrderRepository
      |
      v
 PostgreSQL
```

PostgreSQL es una opción inicial recomendada para la base SQL, manteniendo los ports desacoplados del motor.

---

# 17. MongoDB Output Adapters

MongoDB se utilizará principalmente para información que se beneficia de un modelo documental, especialmente:

- Auditoría.
- Trazabilidad.
- Eventos o registros operativos que posteriormente se definan.

```text
AuditRepository
      ^
      |
MongoAuditRepository
      |
      v
   MongoDB
```

No se debe duplicar innecesariamente la información transaccional principal entre SQL y MongoDB.

---

# 18. External Service Adapters

Los servicios externos también se conectan mediante Output Ports.

```text
              Output Ports
                  |
        +---------+---------+
        |                   |
        v                   v
 PaymentGateway      LogisticsGateway
        |                   |
        v                   v
PaymentAdapter       LogisticsAdapter
        |                   |
        v                   v
Proveedor pago      Proveedor logístico
```

El objetivo es que el dominio dependa de abstracciones y no de proveedores concretos.

---

# 19. Transacciones

Algunas operaciones requieren más de un Output Port.

Un ejemplo crítico es la reserva de inventario:

```text
1. Recuperar inventario
2. Verificar disponibilidad
3. Reducir disponible
4. Aumentar reservado
5. Registrar movimiento RESERVA
6. Persistir cambios
7. Registrar auditoría
```

Las operaciones transaccionales relacionadas deben utilizar los mecanismos de atomicidad de SQL cuando corresponda.

```text
Application Use Case
        |
        v
InventoryService
        |
        v
InventoryRepository
        |
        v
SQL Transaction
   ├── UPDATE inventory
   ├── INSERT movement
   └── COMMIT
```

La implementación concreta de la transacción pertenece al adapter o a la unidad de trabajo de infraestructura, no al modelo de dominio.

---

# 20. Manejo de errores

Los Output Ports deben utilizar errores con significado para la aplicación, evitando propagar directamente errores específicos de una tecnología.

No se recomienda que el dominio lance errores como:

```typescript
PrismaClientKnownRequestError
```

En su lugar, los adapters pueden traducir:

```text
PostgreSQL error
       |
       v
SQL Adapter
       |
       v
Application-level error
```

Esto evita contaminar el dominio con detalles tecnológicos.

---

# 21. No filtrar modelos de persistencia

Los Output Ports deben trabajar con modelos apropiados para el dominio o contratos específicos de aplicación.

No se deben exponer directamente:

```text
PrismaModel
TypeORM Entity
MongoDocument
SQL Row
```

hacia el dominio.

Ejemplo incorrecto:

```typescript
interface UserRepository {
    findUser(): Promise<PrismaUser>;
}
```

Ejemplo preferible:

```typescript
interface UserRepository {
    buscarPorId(id: string): Promise<Usuario | null>;
}
```

El adapter realiza el mapeo:

```text
Database Row
     |
     v
Persistence Model
     |
     v
Domain Model
```

---

# 22. Flujo de confirmación de un pedido

```text
Comprador
    |
    v
REST Controller
    |
    v
ConfirmOrderUseCase
    |
    +----> OrderRepository
    |
    +----> ProductRepository
    |
    +----> InventoryRepository
    |
    +----> PaymentGateway
    |
    +----> AuditRepository
    |
    v
Pedido actualizado
```

Cada dependencia externa está representada mediante un contrato.

El caso de uso no necesita conocer:

```text
PostgreSQL
MongoDB
Proveedor de pagos
Proveedor logístico
SDK específico
```

---

# 23. Flujo de reserva de inventario

```text
OrderProcessingService
          |
          v
InventoryRepository
          |
          v
SQL Adapter
          |
          v
PostgreSQL
```

Y para la trazabilidad:

```text
InventoryMovementRepository
          |
          v
SQL Adapter
          |
          v
PostgreSQL

          +

AuditRepository
          |
          v
Mongo Adapter
          |
          v
MongoDB
```

Así se mantiene la separación:

```text
Estado transaccional
        ↓
SQL

Trazabilidad / auditoría
        ↓
MongoDB
```

---

# 24. Reglas arquitectónicas

### OP-01 — Los ports pertenecen al interior

Los contratos deben estar definidos en la capa interna correspondiente.

### OP-02 — Los adapters implementan los ports

La infraestructura depende de los contratos internos.

### OP-03 — El dominio no depende de infraestructura

No se permiten dependencias directas hacia:

- Drivers SQL.
- MongoDB.
- SDKs de pago.
- SDKs logísticos.
- Frameworks de persistencia.

### OP-04 — Un port representa una necesidad

No debe crearse un port genérico que mezcle responsabilidades no relacionadas.

### OP-05 — No filtrar detalles tecnológicos

Los modelos internos no deben depender de entidades de persistencia.

### OP-06 — SQL es la fuente de verdad transaccional

Las entidades principales del negocio deben tener una fuente autoritativa clara.

### OP-07 — MongoDB tiene responsabilidad específica

MongoDB se utilizará principalmente para auditoría y trazabilidad, evitando duplicación innecesaria.

### OP-08 — Las operaciones críticas deben ser atómicas

Especialmente:

- Reserva de inventario.
- Salida de inventario.
- Cambios críticos de pedidos.
- Operaciones relacionadas con pago.

### OP-09 — Los pedidos finalizados son inmutables

Ningún adapter debe permitir utilizar la persistencia para saltarse las reglas del dominio.

### OP-10 — La autorización no depende exclusivamente del controller

Aunque REST puede realizar verificaciones iniciales, las reglas relevantes para el negocio deben mantenerse protegidas en las capas internas.

---

# 25. Relación con los servicios de dominio

Los servicios de dominio y los casos de uso pueden necesitar información externa.

Ejemplo:

```text
InventoryService
       |
       v
InventoryRepository
```

o:

```text
OrderProcessingService
       |
       +----> OrderRepository
       |
       +----> InventoryRepository
       |
       +----> PaymentGateway
```

El servicio trabaja con el contrato y no con:

```text
PostgreSQL
MongoDB
Payment SDK
Logistics SDK
```

Esto mantiene la lógica de negocio independiente de la infraestructura.

---

# 26. Pruebas

Los Output Ports facilitan las pruebas unitarias.

Por ejemplo:

```typescript
class FakeInventoryRepository
    implements InventoryRepository {

    // implementación en memoria
}
```

Así el `InventoryService` puede probarse sin levantar PostgreSQL.

En pruebas unitarias:

```text
InventoryService
      |
      v
FakeInventoryRepository
```

En pruebas de integración:

```text
InventoryService
      |
      v
SQLInventoryRepository
      |
      v
PostgreSQL
```

---

# 27. Matriz de Output Ports

| Port | Propósito | Implementación inicial |
|---|---|---|
| `UserRepository` | Usuarios | SQL |
| `SellerRepository` | Vendedores | SQL |
| `BuyerRepository` | Compradores | SQL |
| `ProductRepository` | Productos y variantes | SQL |
| `WarehouseRepository` | Bodegas | SQL |
| `InventoryRepository` | Existencias | SQL |
| `InventoryMovementRepository` | Movimientos | SQL |
| `CartRepository` | Carritos | SQL |
| `OrderRepository` | Pedidos | SQL |
| `InvoiceRepository` | Facturación propia | SQL |
| `ShipmentRepository` | Envíos propios | SQL |
| `AuditRepository` | Auditoría | MongoDB |
| `PaymentGateway` | Pagos y reembolsos | Servicio externo |
| `BillingGateway` | Facturación externa, si aplica | Servicio externo |
| `LogisticsGateway` | Logística | Servicio externo |
| `ReportingQuery` | Consultas administrativas | SQL/proyección |
| `IdentityProvider` | Identidad/autenticación, si aplica | Servicio de identidad |

---

# 28. Arquitectura final de Output Ports

```text
                         NEXUSMARKET
                              |
                    +---------+---------+
                    |                   |
              Input Adapters       Application
                    |                   |
                    +---------+---------+
                              |
                              v
                     +----------------+
                     |    DOMAIN      |
                     |                |
                     | Entities       |
                     | Value Objects   |
                     | Domain Services|
                     |                |
                     | Output Ports   |
                     +-------+--------+
                             |
              +--------------+----------------+
              |              |                |
              v              v                v
        Persistence     Audit / Query    External Services
              |              |                |
       +------+-----+        |          +-----+------+
       |            |        |          |            |
       v            v        v          v            v
   SQL Adapter  SQL Query  Mongo     Payment      Logistics
       |            |      Adapter    Adapter      Adapter
       v            v        |          |            |
 PostgreSQL     PostgreSQL   v          v            v
                          MongoDB    Provider     Provider
```

---

# 29. Decisión arquitectónica

Para NexusMarket, los Output Ports serán el mecanismo principal de **inversión de dependencias** entre el núcleo del negocio y los sistemas externos.



La decisión fundamental es:

> **El dominio y la aplicación no deben depender de tecnologías externas. Los Output Ports definen los contratos que necesita NexusMarket y los Output Adapters implementan dichos contratos utilizando SQL, MongoDB, proveedores de pago, sistemas logísticos u otras tecnologías externas.**

Esto permite que NexusMarket evolucione tecnológicamente sin alterar las reglas centrales del negocio.
