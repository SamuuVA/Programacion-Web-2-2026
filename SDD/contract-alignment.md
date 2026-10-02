# Alineación de Contratos — NexusMarket

> Documento de **alineación de contratos** entre el **Dominio** (`SDD/Domain/`) y los **contratos de
> entrada HTTP (REST)** expuestos por NexusMarket.
>
> Traduce los casos de uso (Input Ports), las entidades y los objetos de valor del dominio en
> contratos REST concretos (método, ruta, encabezados, request, response y errores), indica el
> mapeo explícito contra el modelo de dominio y especifica el almacenamiento implícito (SQL o
> MongoDB) de cada contrato.

## Ficha del documento

| Campo | Valor |
|---|---|
| Proyecto | NexusMarket |
| Documento | Alineación de contratos de dominio ↔ contratos REST (`contract-alignment.md`) |
| Alcance | Especificación de los contratos HTTP de entrada derivados del dominio |
| Estado | Propuesta alineada con `SDD/Domain/`; resuelve el pendiente O-08 (catálogo de endpoints) |
| Lenguaje | TypeScript (referencia de diseño; no contiene código de implementación) |
| Persistencia | SQL (fuente de verdad transaccional) + MongoDB (auditoría y trazabilidad) |
| Naturaleza | Documento de diseño. No contiene código, DTOs en TS ni esquemas de base de datos |
| Enfoque | Spec-Driven Development (SDD) |

---

## 1. Propósito

Este documento establece, endpoint por endpoint, **cómo se alinean los contratos del dominio con
los contratos REST**. Para cada operación responde:

1. ¿Cuál es el método, la ruta exacta y los encabezados requeridos?
2. ¿Qué datos viajan en ruta, consulta y cuerpo?
3. ¿Qué respuesta exitosa y qué errores puede producir?
4. ¿Cómo debe consumirlo el cliente/frontend?
5. ¿Qué entidades y objetos de valor del dominio representa cada request/response?
6. ¿Contra qué persistencia (relacional o documental) mapea?

No introduce reglas de negocio nuevas: **toda regla citada proviene de `SDD/Domain/`** (modelo,
objetos de valor, servicios, Input Ports y Output Ports).

---

## 2. Documentos base y criterio de alineación

### 2.1 Fuente primaria (obligatoria)

| Documento | Ruta | Aporte al contrato |
|---|---|---|
| Modelo de dominio | `SDD/Domain/DomainModel .md` | Entidades, atributos, relaciones, invariantes (RG-01…AUD-02) |
| Objetos de valor | `SDD/Domain/Domain Object Value.md` | Catálogos controlados usados en request/response |
| Servicios de dominio | `SDD/Domain/Domain  Servicies.md` | Operaciones, precondiciones, postcondiciones, errores |
| Servicios (detalle) | `SDD/Domain/Services/*.md` | Reglas y errores por servicio |
| Input Ports | `SDD/Domain/Input-Ports.md` | 25 casos de uso, `ExecutionContext`, entrada conceptual |
| Output Ports | `SDD/Domain/Output-Ports.md` | 17 puertos, SQL como fuente de verdad, MongoDB para auditoría |

### 2.2 Fuente secundaria (consistencia)

Se mantiene coherencia de vocabulario, formato de error y campos con la capa de adaptadores ya
documentada en `SDD/Adapters/` (`input/rest-controllers.md`, `input/request-dtos.md`,
`input/response-dtos.md`, `input/authentication-adapter.md`, `trazabilidad.md`,
`observaciones-arquitectonicas.md`). Esa capa **deriva** del dominio y no lo modifica.

### 2.3 Criterio de derivación

```text
Caso de uso (Input Port)  ──▶  1 endpoint REST
Actor documentado         ──▶  Autorización (rol) — no viaja en el cuerpo
Entrada conceptual        ──▶  Path / Query / Body
Salida del caso de uso    ──▶  Response (status + DTO)
Errores del servicio      ──▶  Errores HTTP (traducidos por el adaptador)
Entidad / VO del dominio  ──▶  Persistencia SQL o MongoDB
```

Reglas de derivación respetadas:

- El **actor nunca proviene del cuerpo**: se resuelve en el `ExecutionContext` (RG-01, RG-02).
- El cliente **no envía** `id`, `rol`, `estado` inicial, `estadoPago`, `estadoPedido`,
  `cantidadDisponible` ni `cantidadReservada` (los determina el dominio).
- Un caso de uso interno (`ReserveInventoryUseCase`) **no** produce endpoint público.
- La transformación de error de dominio a código HTTP pertenece al adaptador
  (`Input-Ports.md` §26); el dominio no conoce HTTP.

---

## 3. Convenciones generales del contrato

### 3.1 Representación y medios

| Aspecto | Convención |
|---|---|
| Formato | JSON (`application/json`) |
| Codificación | UTF-8 |
| Fechas | Tipo `LocalDateTime` del dominio; formato definitivo **pendiente** (ISO-8601 como referencia) |
| Números | `BigDecimal` (precio) → decimal; `int`/`Integer` (cantidades) → entero |
| Colecciones | Arreglos JSON; paginación **pendiente de definición** |

### 3.2 Encabezados

| Encabezado | Requerido | Descripción |
|---|---|---|
| `Authorization` | **Sí, en todos los endpoints** | Presenta la identidad del usuario autenticado (RG-01). El esquema concreto (token, sesión, proveedor) **queda fuera del alcance** y está pendiente (`Input-Ports.md` §8; `Output-Ports.md` §14). |
| `Content-Type: application/json` | Sí, cuando hay cuerpo | Endpoints `POST`/`PATCH` con body. |
| `Accept: application/json` | Recomendado | Negociación de la respuesta. |

Nota: el rol del usuario **no** se envía por encabezado ni por cuerpo; lo resuelve el adaptador de
autenticación (E15) que produce el `ExecutionContext{userId, role}`.

### 3.3 Identificadores y formato (resuelto — O-05)

El tipo de identificador está unificado: identificador **opaco** representado como `string`
(`DomainModel .md`, §2.5). Por tanto:

- El marcador `{id}` de las rutas representa un `string` (por ejemplo, UUID).
- Los ejemplos numéricos de este documento son ilustrativos y no fijan el tipo.

### 3.4 Catálogos (objetos de valor) en los contratos

Los valores de estado/rol/categoría **se serializan con los códigos exactos** de
`Domain Object Value.md`. No se inventan etiquetas alternativas.

| Catálogo | Códigos válidos | Uso en el contrato |
|---|---|---|
| `SystemRole` | `COMPRADOR`, `VENDEDOR`, `OPERADOR_LOGISTICO`, `ADMINISTRADOR`, `SUPERVISOR` | `rol` (respuesta) |
| `EstadoUsuario` | `ACTIVO`, `INACTIVO`, `BLOQUEADO` | `estado` / `newStatus` |
| `EstadoComercial` | `HABILITADO`, `RESTRINGIDO` | `estadoComercial` (respuesta) |
| `EstadoProducto` | `PUBLICADO`, `SUSPENDIDO`, `DESCONTINUADO` | `estado` / `newStatus` |
| `EstadoPedido` | `CARRITO`, `PENDIENTE_PAGO`, `PAGADO`, `DESPACHADO`, `ENTREGADO`, `CANCELADO` | `estadoPedido` |
| `EstadoPago` | `PENDIENTE`, `APROBADO`, `RECHAZADO`, `REEMBOLSADO` | `estadoPago` |
| `TipoMovimientoInventario` | `INGRESO`, `RESERVA`, `SALIDA_VENTA`, `AJUSTE`, `DEVOLUCION` | `tipoMovimiento` |
| `TipoBodega` | `MARKETPLACE`, `VENDEDOR` | `tipoBodega` |
| `CategoriaProducto` | `ELECTRONICA`, `ROPA`, `HOGAR`, `DIGITAL` | `categoria` |
| `GravedadAuditoria` | `INFORMACION`, `ADVERTENCIA`, `ERROR`, `CRITICO` | `severity` |
| `MetodoEntrega` | `ENVIO_FISICO`, `DESCARGA_DIGITAL` | `deliveryMethod` |

### 3.5 Envelope de error

Se adopta el envelope propuesto en `input/request-dtos.md` (§7), generalizado para errores de
negocio y de formato:

```json
{
  "error": "<codigo-estable>",
  "mensaje": "<descripcion legible>",
  "detalles": [
    { "campo": "<nombre del campo>", "problema": "<motivo>" }
  ]
}
```

- `error`: código estable de la categoría (p. ej. `UserAlreadyExists`, `InsufficientInventory`).
- `detalles`: **opcional**; presente en errores de validación (`400`) y en errores con campos
  identificables. Nunca revela infraestructura, tablas, trazas ni credenciales.
- El **catálogo definitivo** de códigos y su correspondencia HTTP es el de `Input-Ports.md` §26
  (resuelto — O-18); los nombres de error usados provienen de ese catálogo.

### 3.6 Correspondencia de errores de dominio ↔ estado HTTP

| Error / situación | Origen | HTTP |
|---|---|---|
| `UserAlreadyExists` (correo o documento duplicado) | `Input-Ports.md` §26; USR-01 | `409` |
| `UnauthorizedOperation` (sin identidad válida) | `Input-Ports.md` §26; RG-01 | `401` |
| `ForbiddenOperation` (rol/alcance insuficiente) | `Input-Ports.md` §26; RG-03 | `403` |
| `ProductNotFound` / entidad inexistente | `Input-Ports.md` §26; `Services/*.md` | `404` |
| `InsufficientInventory` | `Input-Ports.md` §26; INV-02 | `409` |
| `InvalidOrderState` (transición no permitida) | `Input-Ports.md` §26; `Domain Object Value.md` §8 | `409` |
| `OrderAlreadyFinalized` (ORD-01) | `Input-Ports.md` §26; `DomainModel .md` §13 | `409` |
| `InvalidPayment` | `Input-Ports.md` §26 | `422` |
| `ReturnNotAllowed` | `Input-Ports.md` §26 | `409` / `422` |
| Formato inválido / campo obligatorio ausente | `Input-Ports.md` §25.1 | `400` |
| Estado o catálogo con valor no permitido | `Domain Object Value.md`; VO-02 | `422` |
| Cantidad no positiva (`quantity <= 0`) | `Services/InventoryService.md` §7 | `400` |
| Pago rechazado | `Services/OrderProcessingService.md` §7 | **resultado de negocio** (`EstadoPago.RECHAZADO`), no error técnico |
| Fallo interno / proveedor externo | `Output-Ports.md` §20 | `500` / `502` / `503` |

```text
Domain / Application Error  ──▶  Input Adapter (contrato REST)  ──▶  HTTP Status + envelope
```

---

## 4. Resumen del catálogo de endpoints

Un endpoint por caso de uso expuesto (Input Port). `ReserveInventoryUseCase` es un caso de uso
**interno** del flujo de pedido y **no** tiene endpoint (`Input-Ports.md` §21).

| # | Método | Ruta | Caso de uso (Input Port) | Actor | Persistencia principal |
|---|---|---|---|---|---|
| 1 | `POST` | `/buyers` | `RegisterBuyerUseCase` | Comprador | SQL + MongoDB (auditoría) |
| 2 | `POST` | `/sellers` | `OnboardSellerUseCase` | Administrador | SQL + MongoDB (auditoría) |
| 3 | `PATCH` | `/users/{userId}/status` | `UpdateUserAccessStatusUseCase` | Administrador | SQL + MongoDB (auditoría) |
| 4 | `POST` | `/warehouses` | `CreateWarehouseUseCase` | Administrador / Vendedor | SQL |
| 5 | `POST` | `/products` | `CreateProductUseCase` | Vendedor | SQL + MongoDB (auditoría) |
| 6 | `PATCH` | `/products/{productId}/status` | `UpdateProductStatusUseCase` | Vendedor / Administrador | SQL + MongoDB (auditoría) |
| 7 | `POST` | `/inventory/replenishments` | `ReplenishStockUseCase` | Vendedor / Operador Logístico | SQL + MongoDB (auditoría) |
| 8 | `POST` | `/inventory/dispatches` | `DispatchInventoryUseCase` | Operador Logístico | SQL + MongoDB (auditoría) |
| 9 | `POST` | `/carts/{cartId}/items` | `AddItemToCartUseCase` | Comprador | SQL |
| 10 | `DELETE` | `/carts/{cartId}/items/{itemId}` | `RemoveItemFromCartUseCase` | Comprador | SQL |
| 11 | `POST` | `/carts/{cartId}/confirmation` | `ConfirmCartUseCase` | Comprador | SQL + MongoDB (auditoría) |
| 12 | `POST` | `/orders` | `ConfirmOrderUseCase` | Comprador | SQL + MongoDB (auditoría) |
| 13 | `GET` | `/orders/{orderId}` | `GetOrderUseCase` | Roles autorizados | SQL (lectura) |
| 14 | `PATCH` | `/orders/{orderId}/status` | `UpdateOrderStatusUseCase` | Roles autorizados | SQL + MongoDB (auditoría) |
| 15 | `POST` | `/orders/{orderId}/payments` | `ProcessPaymentUseCase` | Flujo comercial | SQL + MongoDB (auditoría) + `PaymentGateway` |
| 16 | `POST` | `/orders/{orderId}/invoices` | `CreateInvoiceUseCase` | Sistema | Externo (`BillingGateway`, O-12) |
| 17 | `POST` | `/orders/{orderId}/shipments` | `CreateShipmentUseCase` | Sistema / Operador Logístico | SQL + `LogisticsGateway` |
| 18 | `POST` | `/orders/{orderId}/dispatch` | `DispatchOrderUseCase` | Operador Logístico | SQL + MongoDB + `LogisticsGateway` |
| 19 | `POST` | `/orders/{orderId}/delivery` | `ConfirmDeliveryUseCase` | Operador Logístico | SQL + MongoDB (auditoría) |
| 20 | `POST` | `/orders/{orderId}/returns` | `RequestReturnUseCase` | Comprador | **Fuera de alcance** (O-01) |
| 21 | `PATCH` | `/returns/{returnId}/approval` | `ApproveReturnUseCase` | Vendedor | **Fuera de alcance** (O-01) |
| 22 | `POST` | `/orders/{orderId}/refunds` | `ProcessRefundUseCase` | Flujo autorizado | `PaymentGateway` (**fuera de alcance**, O-01) |
| 23 | `GET` | `/reports` | `GenerateAdministrativeReportUseCase` | Supervisor | SQL / proyección (lectura) |
| 24 | `GET` | `/audit-logs` | `QueryAuditLogUseCase` | Supervisor | MongoDB (auditoría) |

```text
Contrato interno (sin endpoint):
ReserveInventoryUseCase  →  invocado durante ProcessPayment/ConfirmOrder (flujo de pedido)
Escritura de auditoría   →  nunca se expone como endpoint (Input-Ports.md §20)
```

---

## 5. Catálogo detallado de endpoints

Cada bloque sigue la estructura: **uso → encabezados → request (path/query/body) → response
exitoso → errores → mapeo de dominio → persistencia**.

### 5.1 Administración de usuarios

#### 1. `POST /buyers` — Registro de comprador

| Campo | Valor |
|---|---|
| Caso de uso | `RegisterBuyerUseCase` (`Input-Ports.md` §9.1) |
| Servicio | `UserManagementService.registerBuyer` (`Services/UserManagementService.md` §4) |
| Actor | Proceso de registro / comprador |
| Encabezados | `Authorization`, `Content-Type: application/json`, `Accept: application/json` |
| Path params | — |
| Query params | — |

**Request body**

```json
{
  "nombreCompleto": "Ana Torres",
  "correoElectronico": "ana.torres@example.com",
  "documentoIdentidad": "1020304050",
  "direccionPrincipal": "Cra 10 # 20-30, Bogotá",
  "direccionesAdicionales": ["Cll 50 # 12-08, Medellín"]
}
```

**Response exitoso — `201 Created`**

```json
{
  "id": 1001,
  "nombreCompleto": "Ana Torres",
  "correoElectronico": "ana.torres@example.com",
  "rol": "COMPRADOR",
  "estado": "ACTIVO",
  "direccionPrincipal": "Cra 10 # 20-30, Bogotá",
  "direccionesAdicionales": ["Cll 50 # 12-08, Medellín"],
  "estadoComercial": "HABILITADO"
}
```

**Errores**

| HTTP | Código | Caso |
|---|---|---|
| `400` | (validación) | `correoElectronico` con formato inválido; `nombreCompleto`/`direccionPrincipal` vacíos |
| `401` | `UnauthorizedOperation` | Sin identidad válida (RG-01) |
| `409` | `UserAlreadyExists` | `correoElectronico` o `documentoIdentidad` ya registrados (USR-01) |

**Mapeo de dominio**

| Request/Response | Entidad / VO del dominio |
|---|---|
| Request | Entrada conceptual `RegisterBuyerCommand` (`Input-Ports.md` §9.1) |
| `nombreCompleto`, `correoElectronico`, `direccionPrincipal`, `direccionesAdicionales` | `Usuario` + `Comprador` (`DomainModel .md` §5.1, §5.2) |
| `documentoIdentidad` | Restricción de unicidad del `Usuario` (USR-01) |
| `rol = "COMPRADOR"` | Value Object `SystemRole` (`Domain Object Value.md` §4) |
| `estado = "ACTIVO"` | Value Object `EstadoUsuario` (§5) |
| `estadoComercial` | Value Object `EstadoComercial` (§6) |
| Response | `Buyer` (`Input-Ports.md` §9.1) |

**Persistencia implícita**

- **SQL (transaccional):** `UserRepository` (usuario), `BuyerRepository` (comprador),
  `CartRepository` (carrito vacío creado por la postcondición de `registerBuyer`).
- **MongoDB (trazabilidad):** `AuditRepository` — registro del alta de comprador
  (`Services/AuditService.md` §5).

---

#### 2. `POST /sellers` — Incorporación de vendedor

| Campo | Valor |
|---|---|
| Caso de uso | `OnboardSellerUseCase` (`Input-Ports.md` §9.2) |
| Servicio | `UserManagementService.onboardSeller` (`Services/UserManagementService.md` §4) |
| Actor | **Administrador** (exclusivo) |
| Encabezados | `Authorization`, `Content-Type: application/json`, `Accept: application/json` |
| Path params | — |
| Query params | — |

**Request body**

```json
{
  "nombreCompleto": "Carlos Ruiz",
  "correoElectronico": "ventas@tiendaruiz.com",
  "documentoIdentidad": "900123456",
  "razonSocial": "Tienda Ruiz S.A.S."
}
```

**Response exitoso — `201 Created`**

```json
{
  "id": 2001,
  "nombreCompleto": "Carlos Ruiz",
  "correoElectronico": "ventas@tiendaruiz.com",
  "rol": "VENDEDOR",
  "estado": "ACTIVO",
  "razonSocial": "Tienda Ruiz S.A.S."
}
```

**Errores**

| HTTP | Código | Caso |
|---|---|---|
| `400` | (validación) | `razonSocial`/`nombreCompleto` vacíos; formato de correo inválido |
| `401` | `UnauthorizedOperation` | Sin identidad válida |
| `403` | `ForbiddenOperation` | El ejecutor **no** es Administrador; intento de autorregistro de vendedor (SEL-01) |
| `409` | `UserAlreadyExists` | `correoElectronico` o `documentoIdentidad` duplicados (USR-01) |

**Mapeo de dominio**

| Request/Response | Entidad / VO del dominio |
|---|---|
| Request | Entrada conceptual `OnboardSellerCommand` (`Input-Ports.md` §9.2) |
| `razonSocial` | `Vendedor` (`DomainModel .md` §5.4) |
| `nombreCompleto`, `correoElectronico`, `documentoIdentidad` | `Usuario` |
| `rol = "VENDEDOR"` | `SystemRole` (§4) |
| `adminId` | Proviene del `ExecutionContext`, **no** del cuerpo (`Services/UserManagementService.md` §4) |

**Persistencia implícita**

- **SQL (transaccional):** `UserRepository`, `SellerRepository`; `WarehouseRepository` **si** la
  incorporación registra la primera bodega (`Input-Ports.md` §10.1).
- **MongoDB (trazabilidad):** `AuditRepository` — la incorporación debe quedar auditada
  (`Domain  Servicies.md` §4.2).

---

#### 3. `PATCH /users/{userId}/status` — Cambio de estado operativo

| Campo | Valor |
|---|---|
| Caso de uso | `UpdateUserAccessStatusUseCase` (`Input-Ports.md` §9.3) |
| Servicio | `UserManagementService.updateUserAccessStatus` |
| Actor | **Administrador** |
| Encabezados | `Authorization`, `Content-Type: application/json`, `Accept: application/json` |
| Path params | `userId` (identificador del usuario) |
| Query params | — |

**Request body**

```json
{ "newStatus": "BLOQUEADO" }
```

**Response exitoso — `200 OK`**

```json
{ "id": 1001, "estado": "BLOQUEADO" }
```

**Errores**

| HTTP | Código | Caso |
|---|---|---|
| `400` | (validación) | `newStatus` ausente |
| `401` | `UnauthorizedOperation` | Sin identidad válida |
| `403` | `ForbiddenOperation` | Ejecutor que no es Administrador (RG-03) |
| `404` | `ProductNotFound`-equivalente | `userId` inexistente |
| `422` | (valor no permitido) | `newStatus` distinto de `ACTIVO`/`INACTIVO`/`BLOQUEADO` (VO-02) |

**Mapeo de dominio**

| Elemento | Entidad / VO |
|---|---|
| `userId` | `Usuario.id` (`DomainModel .md` §5.1) |
| `newStatus` → `estado` | Value Object `EstadoUsuario` (§5) |
| `adminId` | `ExecutionContext` (no viaja en el cuerpo) |

**Persistencia implícita:** **SQL** `UserRepository`; **MongoDB** `AuditRepository` (operación
administrativa relevante, `Domain  Servicies.md` §4.3).

---

### 5.2 Bodegas

#### 4. `POST /warehouses` — Registro de bodega

| Campo | Valor |
|---|---|
| Caso de uso | `CreateWarehouseUseCase` (`Input-Ports.md` §10.1) |
| Servicio | **Pendiente**: ningún servicio documenta la creación de bodegas (O-04) |
| Actor | Administrador / Vendedor |
| Encabezados | `Authorization`, `Content-Type: application/json`, `Accept: application/json` |
| Path params | — |
| Query params | — |

**Request body**

```json
{
  "nombre": "Bodega Central",
  "ubicacion": "Zona Industrial, Bogotá",
  "tipoBodega": "MARKETPLACE"
}
```

**Response exitoso — `201 Created`**

```json
{
  "id": 3001,
  "nombre": "Bodega Central",
  "ubicacion": "Zona Industrial, Bogotá",
  "tipoBodega": "MARKETPLACE"
}
```

**Errores**

| HTTP | Código | Caso |
|---|---|---|
| `400` | (validación) | `nombre`/`ubicacion` vacíos |
| `401` | `UnauthorizedOperation` | Sin identidad válida |
| `403` | `ForbiddenOperation` | Rol sin permiso para administrar bodegas |
| `422` | (valor no permitido) | `tipoBodega` distinto de `MARKETPLACE`/`VENDEDOR` (VO-02) |

**Mapeo de dominio**

| Elemento | Entidad / VO |
|---|---|
| `nombre`, `ubicacion` | `Bodega` (`DomainModel .md` §7.1) |
| `tipoBodega` | Value Object `TipoBodega` (`Domain Object Value.md` §11) |
| Especialización | `BodegaMarketplace` o `BodegaVendedor` (§7.1); una `BodegaVendedor` debe identificar su vendedor propietario |

**Persistencia implícita:** **SQL** `WarehouseRepository` (fuente de verdad transaccional).

---

### 5.3 Catálogo

#### 5. `POST /products` — Publicación de producto con variantes

| Campo | Valor |
|---|---|
| Caso de uso | `CreateProductUseCase` (`Input-Ports.md` §11.1) → `CatalogService.publishProduct` |
| Servicio | `CatalogService.publishProduct` (`Services/CatalogService.md` §4) |
| Actor | **Vendedor** |
| Encabezados | `Authorization`, `Content-Type: application/json`, `Accept: application/json` |
| Path params | — |
| Query params | — |

**Request body**

```json
{
  "nombre": "Auriculares Bluetooth",
  "descripcion": "Auriculares inalámbricos con cancelación de ruido",
  "categoria": "ELECTRONICA",
  "tipoProducto": "FISICO",
  "variantes": [
    { "sku": "AUR-BLK-01", "nombreVariante": "Negro", "precio": 199900.00 },
    { "sku": "AUR-WHT-01", "nombreVariante": "Blanco", "precio": 199900.00 }
  ]
}
```

> `tipoProducto`: los valores permitidos **no están documentados** (`Input-Ports.md` §11.1) y deben
> alinearse con la distinción `ProductoFisico`/`ProductoDigital` (`DomainModel .md` §6.2, §6.3).
> El ejemplo usa `FISICO` solo como ilustración; queda **pendiente de definición**.

**Response exitoso — `201 Created`**

```json
{
  "id": 4001,
  "nombre": "Auriculares Bluetooth",
  "descripcion": "Auriculares inalámbricos con cancelación de ruido",
  "categoria": "ELECTRONICA",
  "estado": "PUBLICADO",
  "vendedor": 2001,
  "variantes": [
    { "id": 4101, "sku": "AUR-BLK-01", "nombreVariante": "Negro", "precio": 199900.00 },
    { "id": 4102, "sku": "AUR-WHT-01", "nombreVariante": "Blanco", "precio": 199900.00 }
  ]
}
```

**Errores**

| HTTP | Código | Caso |
|---|---|---|
| `400` | (validación) | Campos obligatorios vacíos; `precio` no numérico |
| `401` | `UnauthorizedOperation` | Sin identidad válida |
| `403` | `ForbiddenOperation` | El ejecutor no es Vendedor autorizado (RG-03) |
| `422` | (valor no permitido) | `sku` ausente/duplicado; `categoria` no válida; `precio` inválido |

**Mapeo de dominio**

| Elemento | Entidad / VO |
|---|---|
| `nombre`, `descripcion`, `vendedor` | `Producto` (`DomainModel .md` §6.1) |
| `categoria` | Value Object `CategoriaProducto` (`Domain Object Value.md` §12) |
| `estado = "PUBLICADO"` | Value Object `EstadoProducto` (§7) |
| `variantes[]` (`sku`, `nombreVariante`, `precio`) | Entidad `Variante` (`DomainModel .md` §6.4) |
| `tipoProducto` | `ProductoFisico` / `ProductoDigital` (§6.2, §6.3); valores **pendientes** |
| `sellerId` | Proviene del `ExecutionContext` (`publishProduct(sellerId, …)`) |

**Persistencia implícita**

- **SQL (transaccional):** `ProductRepository` (producto + variantes; el inventario se controla por
  `Variante`/SKU, `Services/CatalogService.md` §5).
- **MongoDB (trazabilidad):** `AuditRepository` — la publicación se audita
  (`Services/CatalogService.md` §4, paso 7).

---

#### 6. `PATCH /products/{productId}/status` — Cambio de estado de producto

| Campo | Valor |
|---|---|
| Caso de uso | `UpdateProductStatusUseCase` (`Input-Ports.md` §11.2) |
| Servicio | `CatalogService.updateProductStatus` |
| Actor | Vendedor propietario / Administrador |
| Encabezados | `Authorization`, `Content-Type: application/json`, `Accept: application/json` |
| Path params | `productId` |
| Query params | — |

**Request body**

```json
{ "newStatus": "SUSPENDIDO" }
```

**Response exitoso — `200 OK`**

```json
{ "id": 4001, "estado": "SUSPENDIDO" }
```

**Errores**

| HTTP | Código | Caso |
|---|---|---|
| `400` | (validación) | `newStatus` ausente |
| `401` | `UnauthorizedOperation` | Sin identidad válida |
| `403` | `ForbiddenOperation` | El vendedor no es propietario del producto |
| `404` | `ProductNotFound` | `productId` inexistente |
| `422` | (valor no permitido) | `newStatus` distinto de `PUBLICADO`/`SUSPENDIDO`/`DESCONTINUADO` |

**Mapeo de dominio**

| Elemento | Entidad / VO |
|---|---|
| `productId` | `Producto.id` (§6.1) |
| `newStatus` → `estado` | Value Object `EstadoProducto` (§7) |
| Control de permisos | Vendedor → solo productos propios; Administrador → según permisos (`Domain  Servicies.md` §5.2) |

**Persistencia implícita:** **SQL** `ProductRepository`; **MongoDB** `AuditRepository` (cambio de
estado auditado).

---

### 5.4 Inventario

#### 7. `POST /inventory/replenishments` — Ingreso / reabastecimiento de stock

| Campo | Valor |
|---|---|
| Caso de uso | `ReplenishStockUseCase` (`Input-Ports.md` §12.1) |
| Servicio | `InventoryService.replenishStock` (`Services/InventoryService.md` §4) |
| Actor | Vendedor / Operador Logístico |
| Encabezados | `Authorization`, `Content-Type: application/json`, `Accept: application/json` |
| Path params | — |
| Query params | — |

**Request body**

```json
{ "warehouseId": 3001, "variantId": 4101, "quantity": 50 }
```

**Response exitoso — `201 Created`**

```json
{
  "id": 5001,
  "tipoMovimiento": "INGRESO",
  "fecha": "2026-10-01T14:30:00",
  "cantidad": 50,
  "variante": 4101,
  "bodega": 3001,
  "realizadoPor": 7001
}
```

**Errores**

| HTTP | Código | Caso |
|---|---|---|
| `400` | (validación) | `quantity` no numérica o `quantity <= 0` (`Services/InventoryService.md` §7) |
| `401` | `UnauthorizedOperation` | Sin identidad válida |
| `403` | `ForbiddenOperation` | Ejecutor sin permisos logísticos ni propiedad de la bodega |
| `404` | (no encontrado) | `variantId` o `warehouseId` inexistentes |

**Mapeo de dominio**

| Elemento | Entidad / VO |
|---|---|
| `warehouseId`, `variantId`, `quantity` | `Inventario` = combinación **Variante + Bodega** (`DomainModel .md` §7.2) |
| `tipoMovimiento = "INGRESO"` | Value Object `TipoMovimientoInventario` (`Domain Object Value.md` §10) |
| Efecto | `cantidadDisponible ↑`, `cantidadReservada` sin cambios (`Domain  Servicies.md` §6.1) |
| `realizadoPor` | `Usuario` responsable; proviene del `ExecutionContext` |
| Response | `InventoryMovement` (`Input-Ports.md` §12.1) |

**Persistencia implícita:** **SQL** `InventoryRepository` (cantidades) +
`InventoryMovementRepository` (movimiento); **MongoDB** `AuditRepository` (AUD-01: todo movimiento
de inventario debe quedar auditado).

---

#### 8. `POST /inventory/dispatches` — Salida física por venta durante el despacho

| Campo | Valor |
|---|---|
| Caso de uso | `DispatchInventoryUseCase` (`Input-Ports.md` §12.3) |
| Servicio | `InventoryService.dispatchStock` |
| Actor | **Operador Logístico** |
| Encabezados | `Authorization`, `Content-Type: application/json`, `Accept: application/json` |
| Path params | — (el pedido puede identificarse por ruta, ver nota) |
| Query params | — |

**Request body**

```json
{ "orderId": 6001 }
```

> `DispatchInventoryCommand` documenta originalmente `{ orderId, operatorId }`, pero el actor proviene
> del `ExecutionContext` (`Input-Ports.md` §8 y §12.3); por ello el comando ya no incluye `operatorId`
> (resuelve O-06). El cuerpo solo transporta `orderId`.

**Response exitoso — `200 OK`** (movimientos `SALIDA_VENTA` generados)

```json
{
  "orderId": 6001,
  "estadoPedido": "DESPACHADO",
  "movimientos": [
    { "id": 5002, "tipoMovimiento": "SALIDA_VENTA", "cantidad": 1, "variante": 4101, "bodega": 3001 }
  ]
}
```

**Errores**

| HTTP | Código | Caso |
|---|---|---|
| `401` | `UnauthorizedOperation` | Sin identidad válida |
| `403` | `ForbiddenOperation` | Ejecutor sin permisos logísticos |
| `404` | (no encontrado) | `orderId` inexistente |
| `409` | `InvalidOrderState` | El pedido no está `PAGADO`; no existe reserva válida (`Services/InventoryService.md` §4) |

**Mapeo de dominio**

| Elemento | Entidad / VO |
|---|---|
| `orderId` | `Pedido` (`DomainModel .md` §9.1) |
| `tipoMovimiento = "SALIDA_VENTA"` | `TipoMovimientoInventario` (§10) |
| Efecto | `cantidadReservada ↓`; pedido → `DESPACHADO` (`Domain  Servicies.md` §6.3) |
| `estadoPedido` | Value Object `EstadoPedido` (§8) |

**Persistencia implícita:** **SQL** `InventoryRepository`, `InventoryMovementRepository`,
`OrderRepository`; **MongoDB** `AuditRepository` (movimiento y cambio de estado).

---

### 5.5 Carrito de compras

#### 9. `POST /carts/{cartId}/items` — Agregar variante al carrito

| Campo | Valor |
|---|---|
| Caso de uso | `AddItemToCartUseCase` (`Input-Ports.md` §13.1) |
| Servicio | `OrderProcessingService` / gestión de carrito |
| Actor | **Comprador** |
| Encabezados | `Authorization`, `Content-Type: application/json`, `Accept: application/json` |
| Path params | `cartId` |
| Query params | — |

**Request body**

```json
{ "variantId": 4101, "quantity": 2 }
```

**Response exitoso — `200 OK`**

```json
{
  "id": 8001,
  "comprador": 1001,
  "items": [
    { "variante": 4101, "cantidad": 2, "precioUnitario": 199900.00 }
  ]
}
```

**Errores**

| HTTP | Código | Caso |
|---|---|---|
| `400` | (validación) | `quantity` no numérica o `<= 0` |
| `401` | `UnauthorizedOperation` | Sin identidad válida |
| `403` | `ForbiddenOperation` | El carrito no pertenece al comprador ejecutor |
| `404` | (no encontrado) | `cartId` o `variantId` inexistentes |
| `409` | (no disponible) | La variante no está disponible para comercialización |

**Mapeo de dominio**

| Elemento | Entidad / VO |
|---|---|
| `cartId` | `CarritoDeCompras` (`DomainModel .md` §8.1) |
| `variantId` | `Variante` (§6.4) |
| `quantity`, `precioUnitario` | `ItemCarrito` (§8.2) |
| Regla | El carrito pertenece al comprador; selección provisional, no compromiso formal (§8.1) |

**Persistencia implícita:** **SQL** `CartRepository` (carrito e ítems).

---

#### 10. `DELETE /carts/{cartId}/items/{itemId}` — Eliminar artículo del carrito

| Campo | Valor |
|---|---|
| Caso de uso | `RemoveItemFromCartUseCase` (`Input-Ports.md` §13.2) |
| Servicio | Gestión de carrito |
| Actor | **Comprador** |
| Encabezados | `Authorization`, `Accept: application/json` |
| Path params | `cartId`, `itemId` |
| Query params | — |
| Body | — |

**Response exitoso — `200 OK`** (carrito resultante)

```json
{ "id": 8001, "comprador": 1001, "items": [] }
```

**Errores**

| HTTP | Código | Caso |
|---|---|---|
| `401` | `UnauthorizedOperation` | Sin identidad válida |
| `403` | `ForbiddenOperation` | El carrito no pertenece al comprador ejecutor |
| `404` | (no encontrado) | `cartId` o `itemId` inexistentes |

**Mapeo de dominio:** `CarritoDeCompras` + `ItemCarrito` (`DomainModel .md` §8). **Persistencia
implícita:** **SQL** `CartRepository`.

---

#### 11. `POST /carts/{cartId}/confirmation` — Confirmar carrito y generar pedido

| Campo | Valor |
|---|---|
| Caso de uso | `ConfirmCartUseCase` (`Input-Ports.md` §13.3) → `OrderProcessingService.createOrderFromCart` |
| Servicio | `OrderProcessingService.createOrderFromCart` |
| Actor | **Comprador** |
| Encabezados | `Authorization`, `Content-Type: application/json`, `Accept: application/json` |
| Path params | `cartId` |
| Query params | — |

**Request body:** vacío (`ConfirmCartCommand` solo contiene `cartId`).

**Response exitoso — `201 Created`**

```json
{
  "id": 6001,
  "comprador": 1001,
  "fechaCreacion": "2026-10-01T15:00:00",
  "estadoPedido": "PENDIENTE_PAGO",
  "estadoPago": "PENDIENTE",
  "direccionEnvio": "Cra 10 # 20-30, Bogotá",
  "items": [
    { "variante": 4101, "cantidad": 2, "precioAplicado": 199900.00 }
  ]
}
```

**Errores**

| HTTP | Código | Caso |
|---|---|---|
| `401` | `UnauthorizedOperation` | Sin identidad válida |
| `403` | `ForbiddenOperation` | Carrito de otro comprador (`Services/OrderProcessingService.md` §7) |
| `404` | (no encontrado) | `cartId` inexistente |
| `409` | (validación de negocio) | Carrito sin artículos o con variantes no válidas |

**Mapeo de dominio**

| Elemento | Entidad / VO |
|---|---|
| `cartId` | `CarritoDeCompras` (§8.1) |
| `items[]`, `precioAplicado` | `ItemPedido` (§9.2); conserva el precio de la operación |
| `direccionEnvio` | `Pedido.direccionEnvio` (§9.1) |
| `estadoPedido = "PENDIENTE_PAGO"` | Value Object `EstadoPedido` (`Domain Object Value.md` §8) |
| `estadoPago = "PENDIENTE"` | Value Object `EstadoPago` (§9) |

**Persistencia implícita:** **SQL** `CartRepository` + `OrderRepository`; **MongoDB**
`AuditRepository` (creación de pedido, `Services/OrderProcessingService.md` §4).

---

### 5.6 Pedidos

#### 12. `POST /orders` — Formalizar pedido

| Campo | Valor |
|---|---|
| Caso de uso | `ConfirmOrderUseCase` (`Input-Ports.md` §14.1) |
| Servicio | `OrderProcessingService` |
| Actor | **Comprador** |
| Encabezados | `Authorization`, `Content-Type: application/json`, `Accept: application/json` |
| Path params | — |
| Query params | — |

> La **entrada conceptual** de `ConfirmOrderUseCase` **no está documentada** (`Input-Ports.md` §14.1;
> `observaciones-arquitectonicas.md` O-03). El cuerpo de ejemplo es tentativo y debe confirmarse.

**Request body (tentativo — pendiente de definición)**

```json
{ "cartId": 8001 }
```

**Response exitoso — `201 Created`**: `OrderResponse` con `estadoPedido = "PENDIENTE_PAGO"`
(ver el ejemplo del endpoint 11).

**Errores**

| HTTP | Código | Caso |
|---|---|---|
| `400` | (validación) | Cuerpo inválido o campos obligatorios ausentes |
| `401` | `UnauthorizedOperation` | Sin identidad válida |
| `403` | `ForbiddenOperation` | El comprador solo gestiona sus propios pedidos (`DomainModel .md` §9.1) |
| `409` | (validación de negocio) | El pedido no representa una compra válida |

**Mapeo de dominio:** `Pedido` + `ItemPedido` (`DomainModel .md` §9); `estadoPedido` →
`EstadoPedido` (`PENDIENTE_PAGO`). **Persistencia implícita:** **SQL** `OrderRepository`;
**MongoDB** `AuditRepository`.

---

#### 13. `GET /orders/{orderId}` — Consultar pedido

| Campo | Valor |
|---|---|
| Caso de uso | `GetOrderUseCase` (`Input-Ports.md` §14.2) |
| Servicio | Consulta de pedido |
| Actor | Comprador / Vendedor / Operador Logístico / Supervisor / Administrador |
| Encabezados | `Authorization`, `Accept: application/json` |
| Path params | `orderId` |
| Query params | — |
| Body | — |

**Response exitoso — `200 OK`**

```json
{
  "id": 6001,
  "comprador": 1001,
  "fechaCreacion": "2026-10-01T15:00:00",
  "estadoPedido": "PAGADO",
  "estadoPago": "APROBADO",
  "direccionEnvio": "Cra 10 # 20-30, Bogotá",
  "items": [
    { "variante": 4101, "cantidad": 2, "precioAplicado": 199900.00 }
  ]
}
```

**Errores**

| HTTP | Código | Caso |
|---|---|---|
| `401` | `UnauthorizedOperation` | Sin identidad válida |
| `403` | `ForbiddenOperation` | El rol no tiene alcance sobre el pedido (`Input-Ports.md` §14.2; RG-03) |
| `404` | (no encontrado) | `orderId` inexistente |

**Mapeo de dominio:** `Pedido` + `ItemPedido` (`DomainModel .md` §9); `estadoPedido`/`estadoPago`
→ VO `EstadoPedido`/`EstadoPago`. **Persistencia implícita:** **SQL** `OrderRepository` (solo
lectura).

---

#### 14. `PATCH /orders/{orderId}/status` — Transición de estado del pedido

| Campo | Valor |
|---|---|
| Caso de uso | `UpdateOrderStatusUseCase` (`Input-Ports.md` §14.3) |
| Servicio | `OrderProcessingService` |
| Actor | Roles autorizados |
| Encabezados | `Authorization`, `Content-Type: application/json`, `Accept: application/json` |
| Path params | `orderId` |
| Query params | — |

> La **entrada conceptual** de `UpdateOrderStatusUseCase` **no está documentada** (`Input-Ports.md`
> §14.3; O-03). El cuerpo de ejemplo es tentativo.

**Request body (tentativo — pendiente de definición)**

```json
{ "newStatus": "CANCELADO" }
```

**Response exitoso — `200 OK`**

```json
{ "id": 6001, "estadoPedido": "CANCELADO" }
```

**Errores**

| HTTP | Código | Caso |
|---|---|---|
| `400` | (validación) | `newStatus` ausente |
| `401` | `UnauthorizedOperation` | Sin identidad válida |
| `403` | `ForbiddenOperation` | Rol sin alcance sobre el pedido |
| `404` | (no encontrado) | `orderId` inexistente |
| `409` | `InvalidOrderState` | Transición no permitida por el ciclo de vida |
| `409` | `OrderAlreadyFinalized` | El pedido está `ENTREGADO` y es **inmutable** (ORD-01) |
| `422` | (valor no permitido) | `newStatus` fuera de `EstadoPedido`; cancelación no autorizada por las reglas |

**Mapeo de dominio**

| Elemento | Entidad / VO |
|---|---|
| `orderId` | `Pedido.id` (§9.1) |
| `newStatus` → `estadoPedido` | Value Object `EstadoPedido` (`Domain Object Value.md` §8) |
| Regla de cancelación | `CANCELADO` = pedido anulado **antes del despacho** (`Domain  Servicies.md` §7.3) |
| Regla de inmutabilidad | `ENTREGADO` no modificable (`DomainModel .md` §13, ORD-01) |

**Persistencia implícita:** **SQL** `OrderRepository`; **MongoDB** `AuditRepository` (cambio de
estado de pedido).

---

### 5.7 Pago y facturación

#### 15. `POST /orders/{orderId}/payments` — Procesar / confirmar el pago

| Campo | Valor |
|---|---|
| Caso de uso | `ProcessPaymentUseCase` (`Input-Ports.md` §15.1) → `OrderProcessingService.confirmPayment` |
| Servicio | `OrderProcessingService.confirmPayment` |
| Actor | Flujo comercial |
| Encabezados | `Authorization`, `Content-Type: application/json`, `Accept: application/json` |
| Path params | `orderId` |
| Query params | — |

> La estructura interna de `paymentData` **no está documentada** (`Input-Ports.md` §15.1). El ejemplo
> es tentativo. La integración con el proveedor financiero se abstrae mediante el Output Port
> `PaymentGateway`; el proveedor concreto **no está definido**.

**Request body (tentativo — pendiente de definición)**

```json
{
  "paymentData": {
    "method": "TARJETA",
    "reference": "PAY-REF-0001"
  }
}
```

**Response exitoso — `200 OK`**

```json
{ "orderId": 6001, "estadoPago": "APROBADO", "estadoPedido": "PAGADO" }
```

**Errores**

| HTTP | Código | Caso |
|---|---|---|
| `400` | (validación) | `paymentData` ausente o mal formado |
| `401` | `UnauthorizedOperation` | Sin identidad válida |
| `404` | (no encontrado) | `orderId` inexistente |
| `409` | `InvalidOrderState` | El pedido no está `PENDIENTE_PAGO`; stock insuficiente al reservar |
| `409` | `InsufficientInventory` | La reserva de inventario falla tras aprobarse el pago (INV-02) |
| `422` | `InvalidPayment` | Datos de pago no procesables |
| `502`/`503` | (proveedor) | `PaymentGateway` no disponible |

> **Pago rechazado** no es un error técnico: es un **resultado de negocio**
> (`estadoPago = "RECHAZADO"`) que se devuelve en la respuesta (`Services/OrderProcessingService.md` §7).

**Mapeo de dominio**

| Elemento | Entidad / VO |
|---|---|
| `orderId` | `Pedido` (§9.1) |
| `estadoPago` | Value Object `EstadoPago` (`PENDIENTE`, `APROBADO`, `RECHAZADO`, `REEMBOLSADO`) |
| `estadoPedido = "PAGADO"` | Value Object `EstadoPedido` (§8) |
| Efecto encadenado | Al aprobarse el pago se inicia la **reserva de inventario** para productos físicos (`Domain  Servicies.md` §7.2) |

**Persistencia implícita**

- **SQL (transaccional):** `OrderRepository` (`estadoPago`, `estadoPedido`); al reservar,
  `InventoryRepository` + `InventoryMovementRepository` (movimientos `RESERVA`).
- **MongoDB (trazabilidad):** `AuditRepository` (resultado del pago y reserva).
- **Servicio externo:** `PaymentGateway` (pagos).

---

#### 16. `POST /orders/{orderId}/invoices` — Generar facturación

| Campo | Valor |
|---|---|
| Caso de uso | `CreateInvoiceUseCase` (`Input-Ports.md` §15.2) |
| Servicio | **Pendiente** (decisión de facturación interna/externa, O-12) |
| Actor | Sistema |
| Encabezados | `Authorization`, `Content-Type: application/json`, `Accept: application/json` |
| Path params | `orderId` |
| Query params | — |

> La estructura de `billingData` y de la entidad `Factura` **no está documentada**
> (`Input-Ports.md` §15.2; `DomainModel .md` no describe `Factura`). Ejemplo tentativo.

**Request body (tentativo — pendiente de definición)**

```json
{ "billingData": { "taxId": "900123456", "legalName": "Ana Torres" } }
```

**Response exitoso — `201 Created` (campos pendientes de definición)**

```json
{ "orderId": 6001, "invoiceId": "INV-0001", "estado": "<pendiente>" }
```

**Errores**

| HTTP | Código | Caso |
|---|---|---|
| `401` | `UnauthorizedOperation` | Sin identidad válida |
| `404` | (no encontrado) | `orderId` inexistente |
| `409` | (estado) | El pedido no cumple las condiciones de facturación |
| `500`/`502` | (proveedor) | Fallo del sistema de facturación |

**Mapeo de dominio:** `Pedido` (referencia); entidad `Factura` **no descrita** en el dominio.
**Persistencia implícita:** servicio externo `BillingGateway` (resuelto O-12); `InvoiceRepository` no se utiliza inicialmente.

---

### 5.8 Logística y envíos

#### 17. `POST /orders/{orderId}/shipments` — Iniciar gestión logística

| Campo | Valor |
|---|---|
| Caso de uso | `CreateShipmentUseCase` (`Input-Ports.md` §16.1) |
| Servicio | Logística (`LogisticsGateway` + `ShipmentRepository`) |
| Actor | Sistema / Operador Logístico |
| Encabezados | `Authorization`, `Content-Type: application/json`, `Accept: application/json` |
| Path params | `orderId` |
| Query params | — |

> La entidad `Envio` **no está descrita** en `DomainModel .md` su modelo pertenece a `ShipmentRepository`
> (`Output-Ports.md` §11). Ejemplo tentativo.

**Request body**

```json
{ "address": "Cra 10 # 20-30, Bogotá", "deliveryMethod": "ENVIO_FISICO" }
```

**Response exitoso — `201 Created` (campos pendientes de definición)**

```json
{ "orderId": 6001, "shipmentId": "SHP-0001", "estado": "<pendiente>" }
```

**Errores**

| HTTP | Código | Caso |
|---|---|---|
| `400` | (validación) | `address` vacía; campos obligatorios ausentes |
| `401` | `UnauthorizedOperation` | Sin identidad válida |
| `403` | `ForbiddenOperation` | Rol sin permisos logísticos |
| `404` | (no encontrado) | `orderId` inexistente |
| `422` | (valor no permitido) | `deliveryMethod` fuera de `ENVIO_FISICO`/`DESCARGA_DIGITAL` |
| `502`/`503` | (proveedor) | `LogisticsGateway` no disponible |

**Mapeo de dominio**

| Elemento | Entidad / VO |
|---|---|
| `orderId` | `Pedido` (§9.1) |
| `address` | Dirección de entrega del pedido (`Pedido.direccionEnvio`) |
| `deliveryMethod` | Value Object `MetodoEntrega` (`Domain Object Value.md` §13.2) |
| Regla | Aplica a productos físicos (`ProductoFisico` → `ENVIO_FISICO`); los digitales usan `DESCARGA_DIGITAL` |

**Persistencia implícita:** **SQL** `ShipmentRepository`; **servicio externo** `LogisticsGateway`.

---

#### 18. `POST /orders/{orderId}/dispatch` — Registrar despacho físico

| Campo | Valor |
|---|---|
| Caso de uso | `DispatchOrderUseCase` (`Input-Ports.md` §16.2) |
| Servicio | `OrderProcessingService` + `InventoryService` (`dispatchStock`) |
| Actor | **Operador Logístico** |
| Encabezados | `Authorization`, `Content-Type: application/json`, `Accept: application/json` |
| Path params | `orderId` |
| Query params | — |
| Body | — (el actor proviene del `ExecutionContext`) |

**Response exitoso — `200 OK`**

```json
{ "id": 6001, "estadoPedido": "DESPACHADO" }
```

**Errores**

| HTTP | Código | Caso |
|---|---|---|
| `401` | `UnauthorizedOperation` | Sin identidad válida |
| `403` | `ForbiddenOperation` | Ejecutor sin permisos logísticos |
| `404` | (no encontrado) | `orderId` inexistente |
| `409` | `InvalidOrderState` | El pedido no está `PAGADO` o no hay reserva de stock válida |

**Mapeo de dominio**

| Elemento | Entidad / VO |
|---|---|
| `orderId` | `Pedido` (§9.1) |
| Efecto inventario | `cantidadReservada ↓` + movimiento `SALIDA_VENTA` (`Domain  Servicies.md` §6.3) |
| `estadoPedido = "DESPACHADO"` | Value Object `EstadoPedido` (§8) |

> **Nota de alineación:** `DispatchOrderUseCase` (§16.2) y `DispatchInventoryUseCase` (§12.3) ambos
> conducen el pedido a `DESPACHADO` y generan la `SALIDA_VENTA`. Su delimitación exacta (endpoint 8 vs
> endpoint 18) es un **pendiente de alineación** para no duplicar responsabilidades.

**Persistencia implícita:** **SQL** `OrderRepository`, `ShipmentRepository`,
`InventoryRepository`/`InventoryMovementRepository`; **MongoDB** `AuditRepository`;
**servicio externo** `LogisticsGateway`.

---

#### 19. `POST /orders/{orderId}/delivery` — Confirmar entrega

| Campo | Valor |
|---|---|
| Caso de uso | `ConfirmDeliveryUseCase` (`Input-Ports.md` §16.3) → `OrderProcessingService.completeDelivery` |
| Servicio | `OrderProcessingService.completeDelivery` |
| Actor | Operador Logístico |
| Encabezados | `Authorization`, `Content-Type: application/json`, `Accept: application/json` |
| Path params | `orderId` |
| Query params | — |

**Request body (tentativo; `deliveryData` no documentado)**

```json
{ "confirmacionEntrega": true }
```

**Response exitoso — `200 OK`**

```json
{ "id": 6001, "estadoPedido": "ENTREGADO" }
```

**Errores**

| HTTP | Código | Caso |
|---|---|---|
| `401` | `UnauthorizedOperation` | Sin identidad válida |
| `403` | `ForbiddenOperation` | Ejecutor sin permisos |
| `404` | (no encontrado) | `orderId` inexistente |
| `409` | `InvalidOrderState` | El pedido no está `DESPACHADO` |
| `409` | `OrderAlreadyFinalized` | El pedido ya está `ENTREGADO` (inmutable, ORD-01) |

**Mapeo de dominio:** `Pedido` + VO `EstadoPedido` (`ENTREGADO`); tras esta transición el pedido
**no puede modificarse** (`DomainModel .md` §13; `Domain  Servicies.md` §7.4). **Persistencia
implícita:** **SQL** `OrderRepository`; **MongoDB** `AuditRepository` (entrega auditada).

---

### 5.9 Devoluciones y reembolsos

> **Aviso de vacío de dominio (O-01):** `Input-Ports.md` (§17, §18) define los casos de uso, pero el
> modelo de dominio **no** describe una entidad de devolución, su servicio ni su puerto de persistencia
> (`Services/OrderProcessingService.md` §8). Los contratos siguientes son **estructurales y
> tentativos**; sus campos deben confirmarse cuando exista la especificación funcional.

#### 20. `POST /orders/{orderId}/returns` — Solicitar devolución

| Campo | Valor |
|---|---|
| Caso de uso | `RequestReturnUseCase` (`Input-Ports.md` §17.1) |
| Servicio | **Fuera de alcance** (devoluciones no modeladas, O-01) |
| Actor | **Comprador** |
| Encabezados | `Authorization`, `Content-Type: application/json`, `Accept: application/json` |
| Path params | `orderId` |
| Query params | — |

**Request body (tentativo — pendiente de definición)**

```json
{
  "items": [ { "variante": 4101, "cantidad": 1 } ],
  "reason": "Producto defectuoso"
}
```

**Response exitoso — `201 Created` (campos pendientes de definición)**

```json
{ "orderId": 6001, "returnId": "<pendiente>", "estado": "<pendiente>" }
```

**Errores**

| HTTP | Código | Caso |
|---|---|---|
| `400` | (validación) | `items`/`reason` mal formados |
| `401` | `UnauthorizedOperation` | Sin identidad válida |
| `403` | `ForbiddenOperation` | El comprador no es propietario del pedido |
| `404` | (no encontrado) | `orderId` inexistente |
| `409`/`422` | `ReturnNotAllowed` | Devolución no permitida según las condiciones funcionales (`Input-Ports.md` §26) |

**Mapeo de dominio:** `Pedido` + `ItemPedido` (referencia); **no existe** entidad `Devolucion` en
`DomainModel .md`. **Persistencia implícita:** **pendiente** (no existe puerto ni entidad, O-01).

---

#### 21. `PATCH /returns/{returnId}/approval` — Aceptar devolución

| Campo | Valor |
|---|---|
| Caso de uso | `ApproveReturnUseCase` (`Input-Ports.md` §17.2) |
| Servicio | **Fuera de alcance** (devoluciones no modeladas, O-01) |
| Actor | **Vendedor** |
| Encabezados | `Authorization`, `Content-Type: application/json`, `Accept: application/json` |
| Path params | `returnId` |
| Query params | — |

> La **entrada conceptual** no está documentada (`Input-Ports.md` §17.2; O-03). Cuerpo tentativo.

**Request body (tentativo — pendiente de definición)**

```json
{ "decision": "APROBADA" }
```

**Response exitoso — `200 OK` (campos pendientes de definición)**

```json
{ "returnId": "<pendiente>", "estado": "<pendiente>" }
```

**Errores**

| HTTP | Código | Caso |
|---|---|---|
| `401` | `UnauthorizedOperation` | Sin identidad válida |
| `403` | `ForbiddenOperation` | Ejecutor distinto del vendedor responsable (`DomainModel .md` §14) |
| `404` | (no encontrado) | `returnId` inexistente |
| `409` | (estado) | La devolución no puede aceptarse en su estado actual |

**Mapeo de dominio / persistencia:** **pendiente** (O-01).

---

#### 22. `POST /orders/{orderId}/refunds` — Procesar reembolso

| Campo | Valor |
|---|---|
| Caso de uso | `ProcessRefundUseCase` (`Input-Ports.md` §18.1) |
| Servicio | **Fuera de alcance** (O-01); se apoya en `PaymentGateway` |
| Actor | Flujo autorizado (Vendedor / Administrador) |
| Encabezados | `Authorization`, `Content-Type: application/json`, `Accept: application/json` |
| Path params | `orderId` |
| Query params | — |

**Request body**

```json
{ "returnId": "<identificador de devolución>" }
```

**Response exitoso — `200 OK`**

```json
{ "orderId": 6001, "estadoPago": "REEMBOLSADO" }
```

**Errores**

| HTTP | Código | Caso |
|---|---|---|
| `401` | `UnauthorizedOperation` | Sin identidad válida |
| `403` | `ForbiddenOperation` | Rol sin autorización para reembolsos |
| `404` | (no encontrado) | `orderId` o `returnId` inexistentes |
| `409` | (estado) | La devolución asociada no está validada |
| `502`/`503` | (proveedor) | `PaymentGateway` no disponible |

**Mapeo de dominio:** `Pedido` + VO `EstadoPago` (**`REEMBOLSADO`**, `Domain Object Value.md` §9).
**Persistencia implícita:** **SQL** `OrderRepository` (`estadoPago`); **MongoDB** `AuditRepository`;
**servicio externo** `PaymentGateway` (`solicitarReembolso`).

---

### 5.10 Reportes administrativos

#### 23. `GET /reports` — Consulta y consolidación administrativa

| Campo | Valor |
|---|---|
| Caso de uso | `GenerateAdministrativeReportUseCase` (`Input-Ports.md` §19.1) |
| Servicio | Consulta de lectura (`ReportingQuery`, `Output-Ports.md` §13.1) |
| Actor | **Supervisor** (principal) |
| Encabezados | `Authorization`, `Accept: application/json` |
| Path params | — |
| Query params | `reportType`, `dateRange` (from/to), `filters` |
| Body | — |

**Ejemplo de consulta**

```text
GET /reports?reportType=VENTAS&dateRange=2026-09-01..2026-09-30
```

**Response exitoso — `200 OK` (forma de cada resumen pendiente)**

```json
{
  "reportType": "VENTAS",
  "dateRange": { "from": "2026-09-01", "to": "2026-09-30" },
  "resumenVentas": "<pendiente de definición>",
  "resumenInventario": "<pendiente de definición>",
  "resumenPedidos": "<pendiente de definición>"
}
```

**Errores**

| HTTP | Código | Caso |
|---|---|---|
| `400` | (validación) | `reportType` o `dateRange` con formato inválido |
| `401` | `UnauthorizedOperation` | Sin identidad válida |
| `403` | `ForbiddenOperation` | Rol distinto de Supervisor |

**Mapeo de dominio:** entidades agregadas del dominio (usuarios, pedidos, inventario, catálogo); la
autorización respeta el rol (`Output-Ports.md` §13.1). **Persistencia implícita:** **SQL /
proyección de solo lectura** (`ReportingQuery`); **no** modifica estado.

---

### 5.11 Auditoría

#### 24. `GET /audit-logs` — Consultar trazabilidad

| Campo | Valor |
|---|---|
| Caso de uso | `QueryAuditLogUseCase` (`Input-Ports.md` §20.1) |
| Servicio | `AuditService` (consulta) + `AuditRepository` |
| Actor | **Supervisor** (principal) |
| Encabezados | `Authorization`, `Accept: application/json` |
| Path params | — |
| Query params | `userId`, `eventType`, `dateRange`, `severity` |
| Body | — |

**Ejemplo de consulta**

```text
GET /audit-logs?eventType=INGRESO&severity=INFORMACION&dateRange=2026-09-01..2026-09-30
```

**Response exitoso — `200 OK`**

```json
{
  "items": [
    {
      "auditId": "AUD-0001",
      "tipoEvento": "INGRESO",
      "marcaTiempo": "2026-10-01T14:30:00",
      "realizadoPorUsuario": 7001,
      "rolUsuario": "OPERADOR_LOGISTICO",
      "severidad": "INFORMACION",
      "detalles": { "variantId": 4101, "warehouseId": 3001, "cantidad": 50 }
    }
  ]
}
```

**Errores**

| HTTP | Código | Caso |
|---|---|---|
| `400` | (validación) | `dateRange` mal formado; `severity` no válido |
| `401` | `UnauthorizedOperation` | Sin identidad válida |
| `403` | `ForbiddenOperation` | Rol distinto de Supervisor |
| `422` | (valor no permitido) | `severity` fuera de `GravedadAuditoria` |

> La **escritura** de auditoría **no se expone** como endpoint: los eventos se generan como
> consecuencia de operaciones de negocio (`Input-Ports.md` §20). Los registros son **append-only**
> (AUD-02).

**Mapeo de dominio**

| Elemento | Entidad / VO |
|---|---|
| Response | `RegistroAuditoria` (`DomainModel .md` §11) |
| `severity` / `GravedadAuditoria` | Value Object `GravedadAuditoria` (`Domain Object Value.md` §13.1) |
| `rolUsuario` | Value Object `SystemRole` (§4) |
| Campos mínimos | qué, cuándo, quién, sobre qué, resultado, severidad (`Services/AuditService.md` §6) |

**Persistencia implícita:** **MongoDB** `AuditRepository` (inmutable, append-only).

---

## 6. Guía de consumo (cliente / frontend)

### 6.1 Preliminares obligatorios

1. **Identidad:** toda petición incluye el encabezado `Authorization` con la credencial del usuario
   (RG-01). El frontend **no** envía `rol`, `estado`, `id` ni marcas de auditoría.
2. **Contenido:** `Content-Type: application/json` en peticiones con cuerpo; `Accept: application/json`.
3. **Errores:** parsear siempre el envelope `{ "error", "mensaje", "detalles" }`. Nunca mostrar
   `detalles` internos de infraestructura al usuario final.
4. **Estados:** la UI traduce los códigos del dominio (`PENDIENTE_PAGO`, `APROBADO`, …) a etiquetas
   legibles **en la capa de presentación**; no se reinterpretan dentro del backend.

### 6.2 Reglas generales de consumo

| Intención | Método | Código de éxito | Qué hace el frontend |
|---|---|---|---|
| Crear recurso | `POST` | `201` | Leer el `id` del recurso creado y navegar a su detalle |
| Cambiar estado | `PATCH` | `200` | Actualizar la vista con el nuevo estado devuelto |
| Consultar recurso | `GET` | `200` | Renderizar el DTO; respetar el alcance del rol |
| Eliminar artículo | `DELETE` | `200` | Actualizar la vista con el carrito resultante |

El cliente **no** reconstruye el estado de negocio: lo observa en la respuesta. El backend es la
única fuente de verdad (`Output-Ports.md`, OP-06).

### 6.3 Flujo de compra (Comprador) — extremo a extremo

```text
1. POST /buyers                         → 201  (registro; recibe id de comprador)
2. POST /carts/{cartId}/items           → 200  (agregar variante)
3. POST /carts/{cartId}/items           → 200  (opcional: más artículos)
4. DELETE /carts/{cartId}/items/{itemId}→ 200  (opcional: quitar artículo)
5. POST /carts/{cartId}/confirmation    → 201  (crea pedido PENDIENTE_PAGO)
6. POST /orders/{orderId}/payments      → 200  (APROBADO → PAGADO)
7. GET  /orders/{orderId}               → 200  (seguimiento del estado)
```

Puntos clave para el cliente:

- El **carrito** es una selección provisional; el compromiso formal nace al confirmarlo (paso 5).
- El **pago rechazado** llega como `estadoPago = "RECHAZADO"` en una respuesta `200`, **no** como error.
- Tras el pago aprobado, el backend reserva inventario de forma automática (no requiere llamada del cliente).
- El pedido `ENTREGADO` es de solo lectura (no permitir edición en la UI).

### 6.4 Flujo del Vendedor

```text
1. POST /sellers/{sellerId} … (la incorporación la ejecuta un Administrador)
2. POST /products                        → 201  (publicar producto + variantes/SKU)
3. PATCH /products/{productId}/status    → 200  (PUBLICADO / SUSPENDIDO / DESCONTINUADO)
4. POST /inventory/replenishments        → 201  (reabastecer stock por Variante + Bodega)
```

Regla para el cliente: el vendedor solo administra **sus propios** productos; un intento sobre otro
producto devuelve `403`.

### 6.5 Flujo del Administrador

```text
1. POST /sellers              → 201  (incorporar vendedor; no hay autorregistro)
2. PATCH /users/{userId}/status → 200 (ACTIVO / INACTIVO / BLOQUEADO)
3. POST /warehouses           → 201  (registrar bodega Marketplace o Vendedor)
```

### 6.6 Flujo del Operador Logístico

```text
1. POST /inventory/replenishments → 201  (ingreso de stock, si aplica)
2. POST /orders/{orderId}/dispatch→ 200  (SALIDA_VENTA → pedido DESPACHADO)
3. POST /orders/{orderId}/delivery→ 200  (pedido ENTREGADO; inmutable)
```

### 6.7 Flujo de supervisión (Supervisor)

```text
1. GET /orders/{orderId}  → 200  (seguimiento)
2. GET /reports           → 200  (consolidado administrativo, solo lectura)
3. GET /audit-logs        → 200  (trazabilidad; solo lectura, append-only)
```

---

## 7. Especificación de almacenamiento implícito

### 7.1 Criterio de asignación de persistencia

Según `Output-Ports.md` (OP-06, OP-07 y §16–§17):

- **SQL = fuente de verdad transaccional.** Almacena las entidades del negocio: usuarios,
  compradores, vendedores, productos y variantes, bodegas, inventario, movimientos de inventario,
  carrito, pedidos, facturas y envíos.
- **MongoDB = auditoría y trazabilidad.** Almacena `RegistroAuditoria` de forma **inmutable y
  append-only** (AUD-02). No duplica los datos transaccionales.
- **Servicios externos** (tras Output Ports): pagos (`PaymentGateway`), logística
  (`LogisticsGateway`), facturación (`BillingGateway`), identidad (`IdentityProvider`).

### 7.2 Matriz endpoint → persistencia

| # | Endpoint | SQL (repositorios) | MongoDB | Servicio externo |
|---|---|---|---|---|
| 1 | `POST /buyers` | `UserRepository`, `BuyerRepository`, `CartRepository` | `AuditRepository` | — |
| 2 | `POST /sellers` | `UserRepository`, `SellerRepository`, (`WarehouseRepository`) | `AuditRepository` | — |
| 3 | `PATCH /users/{userId}/status` | `UserRepository` | `AuditRepository` | — |
| 4 | `POST /warehouses` | `WarehouseRepository` | — | — |
| 5 | `POST /products` | `ProductRepository` | `AuditRepository` | — |
| 6 | `PATCH /products/{productId}/status` | `ProductRepository` | `AuditRepository` | — |
| 7 | `POST /inventory/replenishments` | `InventoryRepository`, `InventoryMovementRepository` | `AuditRepository` | — |
| 8 | `POST /inventory/dispatches` | `InventoryRepository`, `InventoryMovementRepository`, `OrderRepository` | `AuditRepository` | — |
| 9 | `POST /carts/{cartId}/items` | `CartRepository` | — | — |
| 10 | `DELETE /carts/{cartId}/items/{itemId}` | `CartRepository` | — | — |
| 11 | `POST /carts/{cartId}/confirmation` | `CartRepository`, `OrderRepository` | `AuditRepository` | — |
| 12 | `POST /orders` | `OrderRepository` | `AuditRepository` | — |
| 13 | `GET /orders/{orderId}` | `OrderRepository` (lectura) | — | — |
| 14 | `PATCH /orders/{orderId}/status` | `OrderRepository` | `AuditRepository` | — |
| 15 | `POST /orders/{orderId}/payments` | `OrderRepository`, `InventoryRepository`, `InventoryMovementRepository` | `AuditRepository` | `PaymentGateway` |
| 16 | `POST /orders/{orderId}/invoices` | — (sin persistencia local, O-12) | — | `BillingGateway` (O-12) |
| 17 | `POST /orders/{orderId}/shipments` | `ShipmentRepository` | — | `LogisticsGateway` |
| 18 | `POST /orders/{orderId}/dispatch` | `OrderRepository`, `ShipmentRepository`, `InventoryRepository`, `InventoryMovementRepository` | `AuditRepository` | `LogisticsGateway` |
| 19 | `POST /orders/{orderId}/delivery` | `OrderRepository` | `AuditRepository` | — |
| 20 | `POST /orders/{orderId}/returns` | **fuera de alcance** (O-01) | — | — |
| 21 | `PATCH /returns/{returnId}/approval` | **fuera de alcance** (O-01) | — | — |
| 22 | `POST /orders/{orderId}/refunds` | `OrderRepository` | `AuditRepository` | `PaymentGateway` |
| 23 | `GET /reports` | `ReportingQuery` (SQL/proyección, solo lectura) | — | — |
| 24 | `GET /audit-logs` | — | `AuditRepository` | — |

### 7.3 Notas de consistencia (derivadas del dominio)

- **AUD-01:** todo `MovimientoInventario` genera un `RegistroAuditoria` → los endpoints 7, 8, 15
  y 18 escriben en SQL **y** en MongoDB.
- **AUD-02:** los registros de auditoría son inmutables y append-only → el endpoint 24 solo lee.
- **OP-08 (atomicidad):** las operaciones de **reserva** (15) y **salida** (8/18) deben ser atómicas
  en SQL; la unidad de trabajo pertenece a infraestructura, no al dominio.
- **OP-07 (no duplicar):** los datos transaccionales **no** se replican en MongoDB; MongoDB solo
  conserva trazabilidad.
- **O-11:** la estrategia de consistencia SQL ↔ MongoDB (qué ocurre si un movimiento se confirma en
  SQL pero falla su auditoría) está **pendiente de definición**.

---

## 8. Matriz de trazabilidad: contrato ↔ dominio

| Endpoint | Input Port (caso de uso) | Servicio de dominio | Entidad principal | VO clave | Persistencia |
|---|---|---|---|---|---|
| `POST /buyers` | `RegisterBuyerUseCase` | `UserManagementService` | `Comprador`/`Usuario` | `SystemRole`, `EstadoUsuario`, `EstadoComercial` | SQL + Mongo |
| `POST /sellers` | `OnboardSellerUseCase` | `UserManagementService` | `Vendedor` | `SystemRole` | SQL + Mongo |
| `PATCH /users/{id}/status` | `UpdateUserAccessStatusUseCase` | `UserManagementService` | `Usuario` | `EstadoUsuario` | SQL + Mongo |
| `POST /warehouses` | `CreateWarehouseUseCase` | (pendiente O-04) | `Bodega` | `TipoBodega` | SQL |
| `POST /products` | `CreateProductUseCase` | `CatalogService` | `Producto`/`Variante` | `CategoriaProducto`, `EstadoProducto` | SQL + Mongo |
| `PATCH /products/{id}/status` | `UpdateProductStatusUseCase` | `CatalogService` | `Producto` | `EstadoProducto` | SQL + Mongo |
| `POST /inventory/replenishments` | `ReplenishStockUseCase` | `InventoryService` | `Inventario`/`MovimientoInventario` | `TipoMovimientoInventario` | SQL + Mongo |
| `POST /inventory/dispatches` | `DispatchInventoryUseCase` | `InventoryService` | `Inventario`/`Pedido` | `TipoMovimientoInventario`, `EstadoPedido` | SQL + Mongo |
| `POST /carts/{id}/items` | `AddItemToCartUseCase` | (carrito) | `CarritoDeCompras`/`ItemCarrito` | — | SQL |
| `DELETE /carts/{id}/items/{itemId}` | `RemoveItemFromCartUseCase` | (carrito) | `CarritoDeCompras` | — | SQL |
| `POST /carts/{id}/confirmation` | `ConfirmCartUseCase` | `OrderProcessingService` | `Pedido`/`ItemPedido` | `EstadoPedido`, `EstadoPago` | SQL + Mongo |
| `POST /orders` | `ConfirmOrderUseCase` | `OrderProcessingService` | `Pedido` | `EstadoPedido` | SQL + Mongo |
| `GET /orders/{id}` | `GetOrderUseCase` | Consulta | `Pedido`/`ItemPedido` | `EstadoPedido`, `EstadoPago` | SQL (lectura) |
| `PATCH /orders/{id}/status` | `UpdateOrderStatusUseCase` | `OrderProcessingService` | `Pedido` | `EstadoPedido` | SQL + Mongo |
| `POST /orders/{id}/payments` | `ProcessPaymentUseCase` | `OrderProcessingService` | `Pedido`/`Inventario` | `EstadoPago`, `EstadoPedido` | SQL + Mongo + externo |
| `POST /orders/{id}/invoices` | `CreateInvoiceUseCase` | `BillingGateway` | `Factura` (fuera de alcance) | — | Externo (O-12) |
| `POST /orders/{id}/shipments` | `CreateShipmentUseCase` | Logística | `Envio` (no modelada) | `MetodoEntrega` | SQL + externo |
| `POST /orders/{id}/dispatch` | `DispatchOrderUseCase` | `OrderProcessingService`+`InventoryService` | `Pedido`/`Inventario` | `EstadoPedido`, `TipoMovimientoInventario` | SQL + Mongo + externo |
| `POST /orders/{id}/delivery` | `ConfirmDeliveryUseCase` | `OrderProcessingService` | `Pedido` | `EstadoPedido` | SQL + Mongo |
| `POST /orders/{id}/returns` | `RequestReturnUseCase` | (pendiente O-01) | — | — | pendiente |
| `PATCH /returns/{id}/approval` | `ApproveReturnUseCase` | (pendiente O-01) | — | — | pendiente |
| `POST /orders/{id}/refunds` | `ProcessRefundUseCase` | (pendiente O-01) | `Pedido` | `EstadoPago` | SQL + Mongo + externo |
| `GET /reports` | `GenerateAdministrativeReportUseCase` | `ReportingQuery` | agregados | — | SQL (lectura) |
| `GET /audit-logs` | `QueryAuditLogUseCase` | `AuditService` | `RegistroAuditoria` | `GravedadAuditoria`, `SystemRole` | MongoDB |

---

## 9. Casos límite por dominio

### 9.1 Usuarios

| Caso límite | Regla | Resultado |
|---|---|---|
| Correo o documento ya registrados | USR-01 | `409 UserAlreadyExists` |
| Vendedor intenta autorregistrarse | SEL-01 | `403 ForbiddenOperation` |
| El ejecutor no es Administrador en operaciones administrativas | RG-03 | `403` |
| Usuario inexistente al cambiar estado | `Services/UserManagementService.md` §6 | `404` |
| Estado no permitido | VO-02 / `Domain Object Value.md` §5 | `422` |
| Un usuario con dos roles | RG-02 (invariante) | No representable; el rol es único |

### 9.2 Catálogo

| Caso límite | Regla | Resultado |
|---|---|---|
| Producto de otro vendedor | `Services/CatalogService.md` §8 | `403` |
| SKU ausente o inválido | `Services/CatalogService.md` §8 | `422` |
| Estado de producto inválido | `Domain Object Value.md` §7 | `422` |
| Producto inexistente | `Services/CatalogService.md` §8 | `404 ProductNotFound` |
| Stock controlado por `Product` en lugar de `Variante` | `Domain  Servicies.md` §5.1 | No permitido por diseño |

### 9.3 Inventario

| Caso límite | Regla | Resultado |
|---|---|---|
| `quantity <= 0` en reabastecimiento | `Services/InventoryService.md` §7 | `400` |
| Reservar stock inexistente o insuficiente | INV-02 | `409 InsufficientInventory` |
| Existencias negativas | INV-01 / VO-07 | No permitido |
| Inventario dañado / no disponible | INV-03 | No reservable; `409`/error de negocio |
| Movimiento sin auditoría | AUD-01 | Invariante: imposible (siempre se audita) |
| Operador sin permisos logísticos | `Services/InventoryService.md` §7 | `403` |

---

### 9.4 Carrito y pedidos

| Caso límite | Regla | Resultado |
|---|---|---|
| Carrito de otro comprador | `Services/OrderProcessingService.md` §7 | `403` |
| Comprador gestiona pedido ajeno | `DomainModel .md` §9.1 | `403` |
| Transición de estado no permitida | `Domain Object Value.md` §8 | `409 InvalidOrderState` |
| Modificar pedido `ENTREGADO` | ORD-01 / §13 | `409 OrderAlreadyFinalized` |
| Cancelar pedido despachado | `Domain  Servicies.md` §7.3 (`CANCELADO` antes del despacho) | `409`/`422` |
| Carrito sin artículos al confirmar | `Domain  Servicies.md` §7.1 | `409` (validación de negocio) |

### 9.5 Pago, logística, devoluciones y auditoría

| Caso límite | Regla | Resultado |
|---|---|---|
| Pago rechazado por el proveedor | `Services/OrderProcessingService.md` §7 | Resultado de negocio (`EstadoPago.RECHAZADO`), no error |
| Datos de pago no procesables | `Input-Ports.md` §26 | `422 InvalidPayment` |
| Proveedor de pago/logística no disponible | `Output-Ports.md` §20 | `502`/`503` |
| Devolución fuera de política | `Input-Ports.md` §26 | `409`/`422 ReturnNotAllowed` |
| Escritura de auditoría por el cliente | `Input-Ports.md` §20 | No expuesta |
| Modificar/eliminar un registro de auditoría | AUD-02 | No permitido (append-only) |
| Rol distinto de Supervisor en reportes/auditoría | `Input-Ports.md` §19, §20 | `403` |
| Confirmar entrega de un pedido no `DESPACHADO` | `Domain  Servicies.md` §7.4 | `409 InvalidOrderState` |

---

## 10. Alineación con la documentación existente

### 10.1 Qué resuelve este documento

| Observación | Estado tras este documento |
|---|---|
| **O-08** — Catálogo de endpoints no especificado | **Resuelto** por este documento (§4 y §5) |
| **O-03** — Entrada conceptual ausente (4 casos de uso) | **Resuelto**: `Input-Ports.md` §14.1, §14.2, §14.3 y §17.2 (§5) |
| **O-06** — `operatorId` frente al `ExecutionContext` | **Resuelto**: el actor proviene del `ExecutionContext` (`Input-Ports.md` §8 y §12.3) |
| **O-18** — Catálogo de errores | **Resuelto**: catálogo definitivo en `Input-Ports.md` §26 con su correspondencia HTTP |
| O-01 / O-02 — Devoluciones, `Factura`, `Envio` | Declarados **fuera de alcance** del modelo de dominio (`DomainModel .md` §15.1) |
| O-12 — Decisión de facturación | **Resuelto**: `BillingGateway` (`Output-Ports.md` §9) |

### 10.2 Reglas respetadas (sin contradicción con el dominio)

| Regla / invariante | Observancia en los contratos |
|---|---|
| RG-01 (usuario autenticado) | Todo endpoint exige `Authorization` |
| RG-02 (un rol único) | El rol se devuelve, nunca se recibe |
| RG-03 (alcance por rol) | `403` en operaciones fuera de alcance |
| USR-01 (correo/documento únicos) | `409` en `POST /buyers` y `POST /sellers` |
| SEL-01 (sin autorregistro de vendedor) | `POST /sellers` restringe a Administrador |
| INV-01/02/03 (no negativos, no reservar inexistente/dañado) | `409` y validaciones de inventario |
| ORD-01 (pedido entregado inmutable) | `409 OrderAlreadyFinalized` |
| AUD-01/AUD-02 (auditoría obligatoria e inmutable) | Escritura en MongoDB; solo lectura expuesta |
| VO-02 (valores controlados) | `422` ante códigos fuera de catálogo |
| IP-10 (autenticación fuera del contrato) | No se fija mecanismo; solo `Authorization` |

### 10.3 Correspondencia con Response DTOs de `SDD/Adapters/input/response-dtos.md`

| Endpoint | Response DTO |
|---|---|
| `POST /buyers` | `BuyerResponse` |
| `POST /sellers` | `SellerResponse` |
| `PATCH /users/{id}/status` | `UserStatusResponse` |
| `POST /warehouses` | `WarehouseResponse` |
| `POST /products`, `PATCH /products/{id}/status` | `ProductResponse`, `ProductStatusResponse` |
| `POST /inventory/replenishments` | `InventoryMovementResponse` |
| `POST /carts/*` | `CartResponse` |
| `POST /orders`, `GET /orders/{id}` | `OrderResponse`, `OrderStatusResponse` |
| `POST /orders/{id}/payments` | `PaymentStatusResponse` |
| `POST /orders/{id}/invoices` | `InvoiceResponse` (pendiente) |
| `POST /orders/{id}/shipments` | `ShipmentResponse` (pendiente) |
| `GET /reports` | `AdministrativeReportResponse` (parcial) |
| `GET /audit-logs` | `AuditLogResponse` |

---

## 11. Pendientes de definición

Los siguientes puntos **no** pueden cerrarse con la documentación actual y **no** se rellenaron por
suposición:

| # | Pendiente | Referencia |
|---|---|---|
| 1 | Estructura de `paymentData`, `billingData`, `items`, `filters`, `dateRange`, `reportType` | `request-dtos.md` §4.1 |
| 2 | **Mecanismo de autenticación** (JWT, sesiones, OAuth, proveedor de identidad) | O-09 |
| 3 | Delimitación entre `DispatchOrderUseCase` y `DispatchInventoryUseCase` | §5.8 (nota) |
| 4 | **Paginación**, filtros y formato de fechas en las respuestas | arquitectura |
| 5 | Valores de catálogo de `tipoProducto` (físico/digital) | `Input-Ports.md` §11.1 |
| 6 | Framework HTTP concreto | arquitectura |
| 7 | Proveedores externos (pago, logística) | arquitectura |

Resueltos con esta actualización (ver `observaciones-arquitectonicas.md`): O-05 (identificadores
`string`), O-03 (entrada conceptual), O-18 (catálogo de errores), O-06 (`operatorId`/`ExecutionContext`),
O-12 (facturación `BillingGateway`) y O-11 (consistencia SQL ↔ MongoDB, `Output-Ports.md` §19.1). O-01 y
O-02 quedan declarados **fuera de alcance** (`DomainModel .md` §15.1).

---


### Regla central

> **Cada endpoint de NexusMarket es una proyección del dominio: deriva de un caso de uso (Input
> Port), representa entidades y objetos de valor concretos, traduce los errores del dominio a
> estados HTTP en el adaptador y mapea la persistencia SQL (transaccional) o MongoDB (auditoría),
> sin introducir reglas de negocio nuevas.**