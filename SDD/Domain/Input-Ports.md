# Input Ports - NexusMarket

## 1. Introducción

Los **Input Ports** constituyen los contratos de entrada de la aplicación dentro de la arquitectura hexagonal de NexusMarket.

Su responsabilidad principal es definir **qué operaciones puede solicitar un actor o componente externo al sistema**, sin depender de HTTP, REST, JSON, Node.js, Express/Fastify, bases de datos u otras tecnologías concretas.

La especificación funcional define procesos como registro de compradores, incorporación administrativa de vendedores, gestión de productos, inventario, carrito, pedidos, facturación, envíos, devoluciones, reembolsos y reportes. Los Input Ports representan estas capacidades desde el punto de vista de la aplicación.

```text
Cliente / Actor externo
        │
        ▼
Input Adapter
(REST Controller)
        │
        ▼
Input Port
(Use Case)
        │
        ▼
Application / Domain Service
        │
        ▼
Output Ports
        │
        ▼
Output Adapters
        │
        ▼
SQL / MongoDB / Servicios externos
```

---

# 2. Propósito

Los Input Ports tienen los siguientes objetivos:

- Definir los casos de uso disponibles en la aplicación.
- Establecer contratos claros entre los Input Adapters y la lógica de aplicación.
- Evitar que los controladores conozcan directamente la implementación de los servicios.
- Mantener independiente el núcleo de negocio respecto del protocolo de entrada.
- Facilitar pruebas unitarias y de integración.
- Permitir que una misma operación sea invocada desde diferentes tipos de adaptadores.
- Aplicar el principio de inversión de dependencias.

Un Input Port responde principalmente a:

> **¿Qué puede hacer NexusMarket?**

No responde a:

> **¿Cómo llega la solicitud?**

Esa segunda responsabilidad corresponde a los **Input Adapters**.

---

# 3. Input Ports dentro de la arquitectura

NexusMarket utiliza una arquitectura **Hexagonal (Ports and Adapters) + DDD**.

Dentro de ella:

- **Input Ports:** definen los casos de uso de entrada.
- **Input Adapters:** reciben solicitudes externas y llaman a los Input Ports.
- **Domain Services:** ejecutan lógica de negocio que involucra varias entidades o reglas.
- **Output Ports:** definen las dependencias que necesita la aplicación para consultar o modificar recursos externos.
- **Output Adapters:** implementan esas dependencias.
- **Infrastructure:** proporciona configuración y recursos técnicos.

```text
                    NEXUSMARKET

              ┌─────────────────────┐
              │    Input Adapter    │
              │ REST / Controller   │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │     Input Port      │
              │      Use Case       │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │ Application /       │
              │ Domain Services     │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │    Output Ports     │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │   Output Adapters   │
              └──────────┬──────────┘
                         │
                ┌────────┴────────┐
                ▼                 ▼
             SQL / DB         Servicios
                             externos
```

El dominio y la aplicación no deben depender de los adaptadores.

---

# 4. Diferencia entre Input Port e Input Adapter

| Elemento | Responsabilidad |
|---|---|
| Input Port | Define el caso de uso que la aplicación puede ejecutar |
| Input Adapter | Recibe la solicitud externa y la transforma para invocar el Input Port |
| Controller | Es un tipo de Input Adapter para HTTP/REST |
| Request DTO | Transporta los datos de entrada |
| Mapper | Convierte DTOs hacia los objetos utilizados por la aplicación |
| Domain Service | Ejecuta reglas y operaciones de negocio |
| Output Port | Define recursos externos que la operación necesita |

Ejemplo:

```text
POST /buyers
     │
     ▼
BuyerController
     │
     ▼
RegisterBuyerUseCase
     │
     ▼
UserManagementService
     │
     ├── UserRepository
     └── AuditRepository
```

El `BuyerController` no registra directamente al comprador. El controlador adapta la solicitud y delega la operación al Input Port.

---

# 5. Principios de diseño

## 5.1 Inversión de dependencias

Los componentes externos dependen del contrato definido por la aplicación y no al contrario.

```text
Input Adapter
      │
      ▼
Input Port
      │
      ▼
Caso de uso
```

El Input Port no debe conocer:

- HTTP
- REST
- Express
- Fastify
- JSON
- PostgreSQL
- MongoDB
- Node.js
- Frameworks de autenticación
- Detalles específicos de infraestructura

## 5.2 Un Input Port representa una capacidad del sistema

Cada Input Port debe representar una operación significativa desde la perspectiva funcional.

Ejemplos:

```text
RegisterBuyerUseCase
OnboardSellerUseCase
CreateProductUseCase
ReserveInventoryUseCase
ConfirmOrderUseCase
ProcessPaymentUseCase
DispatchOrderUseCase
RequestReturnUseCase
GenerateAdministrativeReportUseCase
```

Los nombres deben representar acciones de negocio y no detalles técnicos.

Incorrecto:

```text
SaveUserToPostgresUseCase
```

Correcto:

```text
RegisterBuyerUseCase
```

---

# 6. Organización propuesta

Los Input Ports se organizan según los dominios funcionales de NexusMarket.

```text
src/
└── application/
    └── ports/
        └── input/
            ├── user/
            ├── seller/
            ├── buyer/
            ├── warehouse/
            ├── catalog/
            ├── inventory/
            ├── cart/
            ├── order/
            ├── billing/
            ├── logistics/
            ├── returns/
            ├── refund/
            ├── reporting/
            └── audit/
```

La estructura puede ajustarse durante la implementación, pero debe conservar la separación conceptual entre Input Ports y Output Ports.

---

# 7. Convención de nombres

Se recomienda utilizar una interfaz por caso de uso.

Convención:

```text
<Acción><Objeto>UseCase
```

Ejemplos:

```text
RegisterBuyerUseCase
OnboardSellerUseCase
UpdateUserAccessStatusUseCase
CreateWarehouseUseCase
CreateProductUseCase
UpdateProductStatusUseCase
AddItemToCartUseCase
ConfirmOrderUseCase
ReserveInventoryUseCase
DispatchOrderUseCase
CreateInvoiceUseCase
CreateShipmentUseCase
RequestReturnUseCase
ProcessRefundUseCase
GenerateAdministrativeReportUseCase
```

---

# 8. Contexto de ejecución

La especificación funcional establece que toda operación debe ser ejecutada por un usuario autenticado (RG-01), que cada usuario tiene un único rol (RG-02) y que ningún participante puede administrar información fuera de sus funciones (RG-03).

Conceptualmente puede utilizarse un contexto de ejecución:

```text
ExecutionContext
├── userId
└── role
```

Este concepto representa la identidad y el rol que ya fueron resueltos por la infraestructura de entrada.

**Importante:** el mecanismo técnico utilizado para autenticar al usuario permanece fuera de estos Input Ports. La especificación funcional deja los mecanismos técnicos de autenticación fuera del alcance.

Por tanto, este documento no fija JWT, sesiones, OAuth, cookies, MFA ni otro mecanismo específico.

---

# 9. Input Ports de Administración de Usuarios

## 9.1 RegisterBuyerUseCase

### Propósito

Registrar un nuevo comprador en NexusMarket.

### Actor principal

```text
Comprador
```

### Entrada conceptual

```text
RegisterBuyerCommand
├── nombreCompleto
├── correoElectronico
├── documentoIdentidad
├── direccionPrincipal
└── direccionesAdicionales
```

### Salida

```text
Buyer
```

### Reglas relevantes

- El correo electrónico debe ser único.
- El documento de identidad debe ser único.
- El comprador debe quedar correctamente identificado.
- Debe establecerse su estado correspondiente.
- El comprador posee un carrito de compras.

### Flujo

```text
Input Adapter
      │
      ▼
RegisterBuyerUseCase
      │
      ▼
UserManagementService
      │
      ├── UserRepository
      └── AuditRepository
```

## 9.2 OnboardSellerUseCase

### Propósito

Permitir al Administrador incorporar un vendedor al marketplace.

### Actor principal

```text
Administrador
```

### Entrada conceptual

```text
OnboardSellerCommand
├── nombreCompleto
├── correoElectronico
├── documentoIdentidad
└── razonSocial
```

### Salida

```text
Seller
```

### Reglas relevantes

- El vendedor no puede autoregistrarse.
- La operación debe ejecutarse por un Administrador.
- Los datos de identificación deben respetar las restricciones de unicidad.
- La incorporación debe quedar trazable.

## 9.3 UpdateUserAccessStatusUseCase

### Propósito

Actualizar el estado operativo de un usuario.

### Actor principal

```text
Administrador
```

### Entrada conceptual

```text
UpdateUserAccessStatusCommand
├── userId
└── newStatus
```

### Valores de estado

```text
ACTIVO
INACTIVO
BLOQUEADO
```

---

# 10. Input Ports de Bodegas

## 10.1 CreateWarehouseUseCase

### Propósito

Registrar una bodega dentro del sistema.

### Entrada conceptual

```text
CreateWarehouseCommand
├── nombre
├── ubicacion
└── tipoBodega
```

### Salida

```text
Warehouse
```

### Tipos

```text
MARKETPLACE
VENDEDOR
```

### Reglas

- Una bodega debe clasificarse como Marketplace o Vendedor.
- Una `BodegaVendedor` debe estar asociada a su propietario.
- La incorporación inicial del vendedor incluye el registro de su primera bodega.

---

# 11. Input Ports del Catálogo

## 11.1 CreateProductUseCase

### Propósito

Registrar un producto y sus variantes dentro del catálogo.

### Actor

```text
Vendedor
```

### Entrada conceptual

```text
CreateProductCommand
├── nombre
├── descripcion
├── categoria
├── tipoProducto
└── variantes
```

### Salida

```text
Product
```

### Reglas

- El producto pertenece a un vendedor.
- Puede ser físico o digital.
- Puede tener múltiples variantes.
- Cada variante tiene su propio SKU.
- El precio se establece a nivel de variante.

## 11.2 UpdateProductStatusUseCase

### Propósito

Cambiar el estado de publicación de un producto.

### Entrada conceptual

```text
UpdateProductStatusCommand
├── productId
└── newStatus
```

### Estados

```text
PUBLICADO
SUSPENDIDO
DESCONTINUADO
```

---

# 12. Input Ports de Inventario

## 12.1 ReplenishStockUseCase

### Propósito

Registrar ingreso o reabastecimiento de existencias.

### Actores

```text
Vendedor
Operador Logístico
```

### Entrada conceptual

```text
ReplenishStockCommand
├── warehouseId
├── variantId
└── quantity
```

### Reglas

- La cantidad debe ser mayor que cero.
- El inventario se encuentra asociado a una variante y una bodega.
- No se permiten existencias negativas.
- Debe generarse un movimiento `INGRESO`.
- El movimiento debe quedar trazable.

## 12.2 ReserveInventoryUseCase

### Propósito

Reservar inventario para un pedido pagado.

### Entrada conceptual

```text
ReserveInventoryCommand
├── orderId
└── items
```

### Reglas

- Debe existir stock suficiente.
- No se puede reservar inventario inexistente.
- No se puede reservar inventario dañado o no disponible.
- La reserva debe generar movimientos de tipo `RESERVA`.
- La cantidad disponible disminuye.
- La cantidad reservada aumenta.

## 12.3 DispatchInventoryUseCase

### Propósito

Registrar la salida física del inventario reservado durante el despacho.

### Actor

```text
Operador Logístico
```

### Entrada conceptual

```text
DispatchInventoryCommand
├── orderId
└── operatorId
```

### Reglas

- El pedido debe encontrarse en estado `PAGADO`.
- El stock reservado debe disminuir.
- Debe generarse un movimiento `SALIDA_VENTA`.
- El pedido pasa a `DESPACHADO`.

---

# 13. Input Ports del Carrito

## 13.1 AddItemToCartUseCase

### Propósito

Agregar una variante de producto al carrito de un comprador.

### Actor

```text
Comprador
```

### Entrada conceptual

```text
AddItemToCartCommand
├── cartId
├── variantId
└── quantity
```

### Reglas

- El carrito debe pertenecer al comprador que ejecuta la operación.
- La variante debe corresponder a un producto válido.
- La cantidad debe ser válida.
- El producto debe encontrarse disponible para comercialización.

## 13.2 RemoveItemFromCartUseCase

### Propósito

Eliminar un artículo del carrito.

```text
RemoveItemFromCartCommand
├── cartId
└── itemId
```

## 13.3 ConfirmCartUseCase

### Propósito

Confirmar la selección provisional del comprador y comenzar la creación formal del pedido.

### Entrada

```text
ConfirmCartCommand
└── cartId
```

### Resultado

```text
Order
```

### Flujo

```text
Carrito
   │
   ▼
Validación
   │
   ▼
Pedido
   │
   ▼
PENDIENTE_PAGO
```

---

# 14. Input Ports de Pedidos

## 14.1 ConfirmOrderUseCase

### Propósito

Formalizar el pedido generado por el comprador.

### Actor

```text
Comprador
```

### Reglas

- El comprador solamente puede gestionar sus propios pedidos.
- El pedido debe representar una compra válida.
- El pedido comienza en `PENDIENTE_PAGO`.
- El flujo posterior depende de la validación del pago.

## 14.2 GetOrderUseCase

### Propósito

Consultar información de un pedido.

### Actores autorizados

```text
Comprador
Vendedor
Operador Logístico
Supervisor
Administrador
```

El acceso debe respetar el rol y alcance autorizado.

## 14.3 UpdateOrderStatusUseCase

### Propósito

Realizar las transiciones permitidas del ciclo de vida del pedido.

### Estados principales

```text
CARRITO
PENDIENTE_PAGO
PAGADO
DESPACHADO
ENTREGADO
CANCELADO
```

### Regla crítica

Un pedido finalizado no puede modificarse.

---

# 15. Input Ports de Pago y Facturación

## 15.1 ProcessPaymentUseCase

### Propósito

Procesar la validación del pago asociado al pedido.

### Entrada conceptual

```text
ProcessPaymentCommand
├── orderId
└── paymentData
```

### Resultado

```text
PaymentStatus
```

Valores definidos:

```text
PENDIENTE
APROBADO
RECHAZADO
REEMBOLSADO
```

El Input Port define la necesidad funcional de procesar el pago, pero no el proveedor financiero ni su protocolo técnico. La integración externa se realiza mediante un Output Port como `PaymentGateway`.

## 15.2 CreateInvoiceUseCase

### Propósito

Gestionar la generación de la información de facturación asociada a una compra.

### Entrada conceptual

```text
CreateInvoiceCommand
├── orderId
└── billingData
```

La implementación concreta de facturación debe mantenerse detrás de los puertos correspondientes.

---

# 16. Input Ports de Logística y Envíos

## 16.1 CreateShipmentUseCase

### Propósito

Iniciar la gestión logística de un pedido físico.

### Entrada conceptual

```text
CreateShipmentCommand
├── orderId
├── address
└── deliveryMethod
```

Aplica principalmente a productos físicos. Los productos digitales utilizan el mecanismo de entrega correspondiente a su naturaleza.

## 16.2 DispatchOrderUseCase

### Propósito

Registrar el despacho físico de un pedido.

### Actor

```text
Operador Logístico
```

### Relación

```text
DispatchOrderUseCase
        │
        ├── InventoryService
        ├── InventoryRepository
        ├── ShipmentRepository
        └── LogisticsGateway
```

## 16.3 ConfirmDeliveryUseCase

### Propósito

Registrar la entrega satisfactoria del pedido.

### Resultado

```text
OrderStatus.ENTREGADO
```

Después de esta transición, el pedido queda finalizado e inmutable.

---

# 17. Input Ports de Devoluciones

## 17.1 RequestReturnUseCase

### Propósito

Solicitar una devolución asociada a una compra.

### Actor

```text
Comprador
```

### Entrada conceptual

```text
RequestReturnCommand
├── orderId
├── items
└── reason
```

La solicitud debe respetar las condiciones funcionales definidas para devoluciones. No se deben inventar políticas comerciales que no estén especificadas.

## 17.2 ApproveReturnUseCase

### Propósito

Gestionar la aceptación de una devolución cuando corresponda.

### Actor

```text
Vendedor
```

La autorización debe respetar la matriz de responsabilidades de NexusMarket.

---

# 18. Input Ports de Reembolsos

## 18.1 ProcessRefundUseCase

### Propósito

Procesar un reembolso derivado de una devolución validada.

### Entrada conceptual

```text
ProcessRefundCommand
├── orderId
└── returnId
```

### Resultado

```text
PaymentStatus.REEMBOLSADO
```

La comunicación con el proveedor financiero debe realizarse mediante un Output Port como `PaymentGateway`.

---

# 19. Input Ports de Reportes

## 19.1 GenerateAdministrativeReportUseCase

### Propósito

Permitir la consulta y consolidación de información administrativa.

### Actor principal

```text
Supervisor
```

### Entrada conceptual

```text
GenerateAdministrativeReportCommand
├── reportType
├── dateRange
└── filters
```

### Salida

```text
AdministrativeReport
```

El Input Port define qué información puede solicitarse; la consulta concreta se realiza mediante los Output Ports correspondientes.

---

# 20. Input Ports de Auditoría

## 20.1 QueryAuditLogUseCase

### Propósito

Consultar información de trazabilidad cuando el rol tenga autorización.

### Actor principal

```text
Supervisor
```

### Entrada conceptual

```text
QueryAuditLogCommand
├── userId
├── eventType
├── dateRange
└── severity
```

La escritura de registros de auditoría no debe quedar expuesta como una operación arbitraria para cualquier cliente. Los eventos de auditoría se generan como consecuencia de operaciones de negocio.

---

# 21. Resumen de Input Ports

| Dominio | Input Port | Actor principal |
|---|---|---|
| Usuarios | `RegisterBuyerUseCase` | Comprador |
| Usuarios | `OnboardSellerUseCase` | Administrador |
| Usuarios | `UpdateUserAccessStatusUseCase` | Administrador |
| Bodegas | `CreateWarehouseUseCase` | Administrador / Vendedor |
| Catálogo | `CreateProductUseCase` | Vendedor |
| Catálogo | `UpdateProductStatusUseCase` | Vendedor / Administrador |
| Inventario | `ReplenishStockUseCase` | Vendedor / Operador Logístico |
| Inventario | `ReserveInventoryUseCase` | Flujo de pedido |
| Inventario | `DispatchInventoryUseCase` | Operador Logístico |
| Carrito | `AddItemToCartUseCase` | Comprador |
| Carrito | `RemoveItemFromCartUseCase` | Comprador |
| Carrito | `ConfirmCartUseCase` | Comprador |
| Pedidos | `ConfirmOrderUseCase` | Comprador |
| Pedidos | `GetOrderUseCase` | Roles autorizados |
| Pedidos | `UpdateOrderStatusUseCase` | Roles autorizados |
| Pago | `ProcessPaymentUseCase` | Flujo comercial |
| Facturación | `CreateInvoiceUseCase` | Sistema |
| Logística | `CreateShipmentUseCase` | Sistema / Operador |
| Logística | `DispatchOrderUseCase` | Operador Logístico |
| Logística | `ConfirmDeliveryUseCase` | Operador Logístico |
| Devoluciones | `RequestReturnUseCase` | Comprador |
| Devoluciones | `ApproveReturnUseCase` | Vendedor |
| Reembolsos | `ProcessRefundUseCase` | Flujo autorizado |
| Reportes | `GenerateAdministrativeReportUseCase` | Supervisor |
| Auditoría | `QueryAuditLogUseCase` | Supervisor |

---

# 22. Relación con los Domain Services

Los Input Ports no deben convertirse en una segunda ubicación para las reglas de negocio.

Ejemplo:

```text
ConfirmOrderUseCase
        │
        ▼
OrderProcessingService
        │
        ├── CartRepository
        ├── OrderRepository
        ├── InventoryRepository
        ├── PaymentGateway
        └── AuditRepository
```

El `ConfirmOrderUseCase` define la entrada de la aplicación.

El `OrderProcessingService` contiene la lógica de negocio correspondiente.

Los Output Ports proporcionan las dependencias externas necesarias.

---

# 23. Relación con Output Ports

Los Input Ports y Output Ports cumplen funciones complementarias.

```text
                Aplicación
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
   Input Ports            Output Ports
        │                       │
 "Qué puede hacer"       "Qué necesita"
        │                       │
        ▼                       ▼
 Casos de uso          Recursos externos
```

Ejemplo:

```text
RegisterBuyerUseCase
        │
        ▼
UserManagementService
        │
        ├──────────────► UserRepository
        │
        └──────────────► AuditRepository
```

Por tanto:

- `RegisterBuyerUseCase` es un Input Port.
- `UserRepository` es un Output Port.
- El controlador REST es un Input Adapter.
- El adaptador SQL es un Output Adapter.

---

# 24. Flujo completo de una solicitud

```text
1. Cliente
      │
      ▼
2. HTTP Request
      │
      ▼
3. Input Adapter / Controller
      │
      ▼
4. Request DTO
      │
      ▼
5. Mapper
      │
      ▼
6. Input Port
      │
      ▼
7. Application / Domain Service
      │
      ▼
8. Output Port
      │
      ▼
9. Output Adapter
      │
      ▼
10. SQL / MongoDB / API externa
      │
      ▼
11. Resultado
      │
      ▼
12. Input Adapter
      │
      ▼
13. Response DTO
      │
      ▼
14. HTTP Response
```

Los Input Ports son el límite entre la forma en que una solicitud entra al sistema y la lógica que ejecuta el caso de uso.

---

# 25. Validación de entrada

Debe distinguirse entre **validación de formato** y **reglas de negocio**.

## 25.1 Validación de formato

Puede ejecutarse en el Input Adapter o mediante mecanismos de validación de la aplicación.

Ejemplos:

```text
correoElectronico tiene formato válido
quantity es un número
userId no está vacío
productId tiene estructura válida
```

## 25.2 Validación de negocio

Debe permanecer en la lógica de aplicación/dominio.

Ejemplos:

```text
El correo no puede estar duplicado.
El vendedor no puede autoregistrarse.
No se puede reservar inventario inexistente.
No se permiten existencias negativas.
Un pedido finalizado no puede modificarse.
Un usuario no puede administrar información fuera de su rol.
```

---

# 26. Manejo de errores

Los Input Ports deben exponer resultados o errores de aplicación comprensibles para el adaptador de entrada.

Ejemplos conceptuales:

```text
UserAlreadyExists
UnauthorizedOperation
ForbiddenOperation
ProductNotFound
InsufficientInventory
InvalidOrderState
OrderAlreadyFinalized
InvalidPayment
ReturnNotAllowed
```

La transformación final a códigos HTTP pertenece al Input Adapter.

```text
Domain/Application Error
          │
          ▼
Input Adapter
          │
          ▼
HTTP Status
```

El dominio no debe conocer códigos HTTP.

---

# 27. Seguridad y autorización

La especificación funcional establece:

```text
RG-01
Toda operación debe ejecutarse por un usuario autenticado.

RG-02
Cada usuario tendrá un único rol.

RG-03
Ningún participante podrá administrar información fuera de su rol.
```

Los Input Ports deben recibir suficiente contexto para determinar quién ejecuta la operación y permitir que la lógica de aplicación/dominio aplique las restricciones correspondientes.

Sin embargo, este documento no define el mecanismo técnico de autenticación.

Queda fuera de esta especificación:

```text
JWT
OAuth2
OIDC
Cookies
Sessions
MFA
Password hashing
Refresh tokens
Identity Provider específico
```

Estos mecanismos pertenecen a la infraestructura y/o a los adaptadores de seguridad.

---

# 28. Testabilidad

Una ventaja principal de los Input Ports es permitir probar los casos de uso sin levantar un servidor HTTP.

```text
Test
 │
 ▼
RegisterBuyerUseCase
 │
 ├── Fake UserRepository
 └── Fake AuditRepository
```

Esto permite comprobar:

- Registro correcto.
- Rechazo de correo duplicado.
- Rechazo de documento duplicado.
- Restricciones de roles.
- Transiciones de pedidos.
- Reservas de inventario.
- Reglas de devolución.
- Generación de auditoría.

El caso de uso puede probarse sin depender de HTTP, REST, PostgreSQL, MongoDB o del servidor Node.js.

---

# 29. Reglas arquitectónicas

## IP-01 — Un Input Port representa un caso de uso

Cada puerto debe representar una capacidad funcional significativa.

## IP-02 — Los Input Ports no dependen de HTTP

No deben recibir objetos `Request`, `Response` ni objetos propios de un framework HTTP.

## IP-03 — Los Input Ports no conocen bases de datos

No deben contener SQL, consultas MongoDB ni entidades de persistencia.

## IP-04 — Los Input Ports no contienen detalles de infraestructura

No deben depender de PostgreSQL, MongoDB, Node.js ni frameworks.

## IP-05 — Los controladores delegan

Los Input Adapters deben llamar a los Input Ports y no implementar reglas de negocio.

## IP-06 — Las reglas de negocio permanecen en Domain/Application

Los Input Ports no deben convertirse en controladores con lógica de negocio excesiva.

## IP-07 — Los Output Ports se utilizan para dependencias externas

Cuando un caso de uso necesita persistencia o un servicio externo, debe utilizar el Output Port correspondiente.

## IP-08 — Las respuestas no exponen necesariamente entidades internas

Los adaptadores pueden utilizar Response DTOs para controlar la representación externa.

## IP-09 — La autorización respeta el contexto del usuario

Las operaciones deben respetar RG-01, RG-02 y RG-03.

## IP-10 — Los puertos son independientes del mecanismo de autenticación

La implementación técnica de autenticación permanece fuera del alcance funcional y del contrato del Input Port.

---

# 30. Estructura conceptual de un Input Port

Un contrato puede representarse conceptualmente como:

```text
<<interface>>
RegisterBuyerUseCase

+ execute(command, context): BuyerResult
```

Donde `command` representa la intención y datos necesarios para realizar la operación, y `context` representa información contextual como el usuario y rol cuando sea necesario.

El contrato no debe indicar HTTP, REST, JSON, SQL, MongoDB, Express, Fastify ni Node.js.

---

# 31. Ejemplo de separación correcta

## Incorrecto

```text
BuyerController
    ├── valida correo
    ├── consulta PostgreSQL
    ├── verifica rol
    ├── crea Buyer
    ├── guarda Buyer
    ├── escribe auditoría
    └── devuelve HTTP
```

Este controlador concentra demasiadas responsabilidades.

## Correcto

```text
BuyerController
      │
      ▼
RegisterBuyerUseCase
      │
      ▼
UserManagementService
      │
      ├── UserRepository
      └── AuditRepository
```

Responsabilidades:

```text
Controller
    → Adaptación HTTP

Input Port
    → Contrato del caso de uso

Domain Service
    → Reglas de negocio

Output Port
    → Contrato con recursos externos

Output Adapter
    → Implementación tecnológica
```

---

# 32. Relación con la estructura general del proyecto

```text
src/
├── application/
│   ├── ports/
│   │   ├── input/
│   │   │   ├── user/
│   │   │   ├── seller/
│   │   │   ├── buyer/
│   │   │   ├── warehouse/
│   │   │   ├── catalog/
│   │   │   ├── inventory/
│   │   │   ├── cart/
│   │   │   ├── order/
│   │   │   ├── billing/
│   │   │   ├── logistics/
│   │   │   ├── returns/
│   │   │   ├── refund/
│   │   │   ├── reporting/
│   │   │   └── audit/
│   │   │
│   │   └── output/
│   │
│   └── services/
│
├── adapters/
│   ├── in/
│   │   └── rest/
│   │
│   └── out/
│
├── domain/
│   ├── models/
│   ├── valueobjects/
│   ├── services/
│   ├── ports/
│   └── exceptions/
│
└── infrastructure/
    ├── config/
    ├── database/
    └── security/
```

La ubicación exacta puede adaptarse durante la implementación, pero debe mantenerse la separación entre entrada, salida, dominio e infraestructura.

---

# 33. Relación con TypeScript

Dado que la arquitectura propuesta utiliza **TypeScript**, los Input Ports pueden expresarse mediante interfaces.

Conceptualmente:

```text
interface RegisterBuyerUseCase {
    execute(command, context): BuyerResult;
}
```

La aplicación trabaja contra un contrato. Un adaptador REST puede utilizar ese contrato sin conocer su implementación concreta.

También puede existir otro adaptador en el futuro:

```text
REST Adapter
     │
     ▼
RegisterBuyerUseCase

CLI Adapter
     │
     ▼
RegisterBuyerUseCase

Message Adapter
     │
     ▼
RegisterBuyerUseCase
```

El caso de uso permanece igual.

---

# 34. Flujo de dependencia final

```text
             ┌───────────────────┐
             │ Cliente externo   │
             └─────────┬─────────┘
                       │
                       ▼
             ┌───────────────────┐
             │   Input Adapter   │
             │     REST API      │
             └─────────┬─────────┘
                       │
                       ▼
             ┌───────────────────┐
             │    Input Port     │
             │     Use Case      │
             └─────────┬─────────┘
                       │
                       ▼
             ┌───────────────────┐
             │ Domain /          │
             │ Application       │
             │ Services          │
             └─────────┬─────────┘
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
      ┌──────────────┐    ┌──────────────┐
      │ Output Port  │    │ Output Port  │
      │ Repository   │    │ Gateway      │
      └──────┬───────┘    └──────┬───────┘
             │                   │
             ▼                   ▼
      ┌──────────────┐    ┌──────────────┐
      │ SQL Adapter  │    │ External API │
      └──────┬───────┘    └──────────────┘
             │
             ▼
        PostgreSQL
```

---

# 35. Decisión arquitectónica

Para NexusMarket, los **Input Ports** serán los contratos que representen los casos de uso de la aplicación.

La solución seguirá estas decisiones:

```text
Arquitectura:
    Hexagonal + DDD

Estilo inicial:
    Modular Monolith

Lenguaje:
    TypeScript

Runtime:
    Node.js

Entrada principal:
    REST API

Input Adapter:
    Controllers

Input Port:
    Use Cases

Lógica:
    Application / Domain Services

Persistencia:
    SQL

Persistencia documental:
    MongoDB para auditoría y trazabilidad

Integraciones:
    Output Ports + Output Adapters
```

La regla central será:

> **Los Input Ports definen las capacidades que NexusMarket expone hacia el exterior, mientras que los Input Adapters se encargan de adaptar las solicitudes externas a esos casos de uso.**

De esta manera, la lógica de negocio no queda acoplada a HTTP ni a un framework concreto y los casos de uso pueden probarse y reutilizarse independientemente del mecanismo de entrada.
