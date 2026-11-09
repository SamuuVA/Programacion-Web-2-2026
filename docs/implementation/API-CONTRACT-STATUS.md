# NexusMarket — Estado del contrato API

**Corte:** 2026-11-08
**Documento ejecutable:** `backend/openapi.yaml` (`openapi: 3.1.0`, `info.version: 0.7.0`)
**Autoridad:** el código y las pruebas del backend. Este documento describe lo que existe; no autoriza rutas futuras.

---

## 1. Alcance declarado

El contrato cubre **68 rutas / 76 operaciones**:

| Método | Ruta | Operación | Autenticación |
|---|---|---|---|
| `POST` | `/api/v1/buyers` | `registerBuyer` | Pública |
| `GET` | `/api/v1/products` | `listPublicProducts` | Pública |
| `GET` | `/api/v1/products/{productId}` | `getPublicProduct` | Pública |
| `GET` | `/api/v1/categories` | `listCategories` | Pública |
| `POST` | `/api/v1/auth/login` | `login` | Pública |
| `POST` | `/api/v1/auth/logout` | `logout` | Bearer |
| `GET` | `/api/v1/auth/session` | `getSession` | Bearer |
| `GET` | `/api/v1/buyers/me/addresses` | `listAddresses` | Bearer (comprador) |
| `POST` | `/api/v1/buyers/me/addresses` | `createAddress` | Bearer (comprador) |
| `PATCH` | `/api/v1/buyers/me/addresses/{direccionId}` | `updateAddress` | Bearer (comprador) |
| `DELETE` | `/api/v1/buyers/me/addresses/{direccionId}` | `deleteAddress` | Bearer (comprador) |
| `POST` | `/api/v1/buyers/me/addresses/{direccionId}/principal` | `setPrincipalAddress` | Bearer (comprador) |
| `POST` | `/api/v1/admin/sellers` | `registerSeller` | Bearer (administrador) |
| `GET` | `/api/v1/cart` | `getCart` | Bearer (comprador) |
| `POST` | `/api/v1/cart/items` | `addCartItem` | Bearer (comprador) |
| `PATCH` | `/api/v1/cart/items/{productoId}` | `updateCartItem` | Bearer (comprador) |
| `DELETE` | `/api/v1/cart/items/{productoId}` | `removeCartItem` | Bearer (comprador) |
| `POST` | `/api/v1/checkout` | `checkout` | Bearer (comprador) |
| `GET` | `/api/v1/orders` | `listOrders` | Bearer (comprador) |
| `GET` | `/api/v1/orders/{orderId}` | `getOrder` | Bearer (comprador) |
| `GET` | `/api/v1/seller/profile` | `getSellerProfile` | Bearer (vendedor) |
| `PATCH` | `/api/v1/seller/profile` | `updateSellerProfile` | Bearer (vendedor) |
| `GET` | `/api/v1/seller/products` | `listSellerProducts` | Bearer (vendedor) |
| `POST` | `/api/v1/seller/products` | `createSellerProduct` | Bearer (vendedor) |
| `GET` | `/api/v1/seller/products/{productId}` | `getSellerProduct` | Bearer (vendedor) |
| `PATCH` | `/api/v1/seller/products/{productId}` | `updateSellerProduct` | Bearer (vendedor) |
| `POST` | `/api/v1/seller/products/{productId}/images` | `addSellerProductImage` | Bearer (vendedor) |
| `DELETE` | `/api/v1/seller/products/{productId}/images/{imageId}` | `removeSellerProductImage` | Bearer (vendedor) |
| `POST` | `/api/v1/seller/products/{productId}/publish` | `publishSellerProduct` | Bearer (vendedor) |
| `POST` | `/api/v1/seller/products/{productId}/suspend` | `suspendSellerProduct` | Bearer (vendedor) |
| `POST` | `/api/v1/seller/products/{productId}/discontinue` | `discontinueSellerProduct` | Bearer (vendedor) |
| `GET` | `/api/v1/seller/warehouses` | `listSellerWarehouses` | Bearer (vendedor) |
| `POST` | `/api/v1/seller/warehouses` | `createSellerWarehouse` | Bearer (vendedor) |
| `PATCH` | `/api/v1/seller/warehouses/{warehouseId}` | `updateSellerWarehouse` | Bearer (vendedor) |
| `GET` | `/api/v1/seller/inventory` | `listSellerInventory` | Bearer (vendedor) |
| `POST` | `/api/v1/seller/inventory/ingresos` | `registerSellerIngress` | Bearer (vendedor) |
| `GET` | `/api/v1/seller/orders` | `listSellerOrders` | Bearer (vendedor) |
| `GET` | `/api/v1/seller/orders/{orderId}` | `getSellerOrder` | Bearer (vendedor) |
| `GET` | `/api/v1/logistics/profile` | `getLogisticsProfile` | Bearer (operador logístico) |
| `GET` | `/api/v1/logistics/warehouses` | `listLogisticsWarehouses` | Bearer (operador logístico) |
| `GET` | `/api/v1/logistics/inventory` | `listLogisticsInventory` | Bearer (operador logístico) |
| `GET` | `/api/v1/logistics/summary` | `getLogisticsSummary` | Bearer (operador logístico) |
| `GET` | `/api/v1/logistics/orders` | `listLogisticsOrders` | Bearer (operador logístico) |
| `GET` | `/api/v1/logistics/orders/{orderId}` | `getLogisticsOrder` | Bearer (operador logístico) |
| `POST` | `/api/v1/logistics/orders/{orderId}/prepare` | `prepareShipment` | Bearer (operador logístico) |
| `POST` | `/api/v1/logistics/shipments/{shipmentId}/dispatch` | `dispatchShipment` | Bearer (operador logístico) |
| `POST` | `/api/v1/logistics/shipments/{shipmentId}/delivery` | `confirmDelivery` | Bearer (operador logístico) |
| `POST` | `/api/v1/admin/logistics-operators` | `registerLogisticsOperator` | Bearer (administrador) |
| `GET` | `/api/v1/supervisor/dashboard` | `getSupervisorDashboard` | Bearer (supervisor) |
| `GET` | `/api/v1/supervisor/orders` | `listSupervisorOrders` | Bearer (supervisor) |
| `GET` | `/api/v1/supervisor/orders/{orderId}` | `getSupervisorOrder` | Bearer (supervisor) |
| `GET` | `/api/v1/supervisor/products` | `listSupervisorProducts` | Bearer (supervisor) |
| `GET` | `/api/v1/supervisor/products/{productId}` | `getSupervisorProduct` | Bearer (supervisor) |
| `GET` | `/api/v1/supervisor/warehouses` | `listSupervisorWarehouses` | Bearer (supervisor) |
| `GET` | `/api/v1/supervisor/inventory` | `listSupervisorInventory` | Bearer (supervisor) |
| `GET` | `/api/v1/supervisor/shipments` | `listSupervisorShipments` | Bearer (supervisor) |
| `GET` | `/api/v1/supervisor/sellers` | `listSupervisorSellers` | Bearer (supervisor) |
| `GET` | `/api/v1/admin/dashboard` | `getAdminDashboard` | Bearer (administrador) |
| `GET` | `/api/v1/admin/users` | `listAdminUsers` | Bearer (administrador) |
| `GET` | `/api/v1/admin/users/{userId}` | `getAdminUser` | Bearer (administrador) |
| `GET` | `/api/v1/admin/sellers` | `listAdminSellers` | Bearer (administrador) |
| `GET` | `/api/v1/admin/sellers/{sellerId}` | `getAdminSeller` | Bearer (administrador) |
| `GET` | `/api/v1/admin/buyers` | `listAdminBuyers` | Bearer (administrador) |
| `GET` | `/api/v1/admin/buyers/{buyerId}` | `getAdminBuyer` | Bearer (administrador) |
| `GET` | `/api/v1/admin/warehouses` | `listAdminWarehouses` | Bearer (administrador) |
| `GET` | `/api/v1/admin/warehouses/{warehouseId}` | `getAdminWarehouse` | Bearer (administrador) |
| `GET` | `/api/v1/admin/products` | `listAdminProducts` | Bearer (administrador) |
| `GET` | `/api/v1/admin/products/{productId}` | `getAdminProduct` | Bearer (administrador) |
| `GET` | `/api/v1/admin/inventory` | `listAdminInventory` | Bearer (administrador) |
| `GET` | `/api/v1/admin/inventory/movements` | `listAdminInventoryMovements` | Bearer (administrador) |
| `GET` | `/api/v1/admin/orders` | `listAdminOrders` | Bearer (administrador) |
| `GET` | `/api/v1/admin/orders/{orderId}` | `getAdminOrder` | Bearer (administrador) |
| `GET` | `/api/v1/admin/payments` | `listAdminPayments` | Bearer (administrador) |
| `GET` | `/api/v1/admin/reports` | `getAdminReports` | Bearer (administrador) |
| `GET` | `/health` | `health` | Pública |
| `GET` | `/ready` | `ready` | Pública |

No se declaran reembolsos, logística inversa, subida binaria de archivos, variantes ni pasarelas de pago reales. La logística cubre preparación, despacho y entrega; el cierre `ENTREGADO → CERRADO` no se declara.

La supervisión es estrictamente de solo lectura: solo se declaran operaciones `GET` bajo `/api/v1/supervisor/*`. Cualquier otro método responde `405 METODO_NO_PERMITIDO`. No se declaran reportes administrativos porque el catálogo, las fórmulas, los filtros y los límites siguen sin aprobarse (`L-19`).

El espacio administrativo declara 17 operaciones `GET` bajo `/api/v1/admin/*`, más las dos altas existentes (`POST /admin/sellers` y `POST /admin/logistics-operators`). Bajo el prefijo admin, cualquier método distinto de `GET`/`HEAD`/`OPTIONS` fuera de esas dos rutas responde `405 METODO_NO_PERMITIDO`. Los reportes admin son solo agregados reales directos; no hay exportaciones ni catálogo de reportes aprobado.

---

## 2. Seguridad

- Esquema `bearerAuth` (`http`, `bearer`).
- El login devuelve un token opaco; el backend también acepta la cookie `nexus_session`.
- Sesión inválida, expirada o revocada → `401 NO_AUTENTICADO`.
- Rol insuficiente → `403 NO_AUTORIZADO`.
- El cuerpo nunca declara identidad ni rol; el actor sale de la sesión.

---

## 3. Endpoints implementados

### 3.1 `POST /api/v1/buyers`

- **Cuerpo:** `RegisterBuyerRequest` con `additionalProperties: false`.
- **Éxito:** `201` con `usuarioId`, `compradorId`, `carritoId`, estados y correo normalizado.
- **Errores:** `400`, `409`, `413`, `415`, `500`, `503`.
- **Persistencia:** una transacción (`users`, `buyers`, `carts`, `audit_log`, `outbox`).
- **Pruebas:** `register-buyer-http.test.ts` (19), `register-buyer.test.ts` (5), `register-buyer-postgres.test.ts` (3).

### 3.2 Autenticación

- `POST /auth/login`: `correoElectronico` + `credencial`; `200` con `token`, `expiraEn`, `usuario`; `401` credenciales inválidas.
- `GET /auth/session`: `200` con el usuario autenticado; `401` sin sesión válida.
- `POST /auth/logout`: `204`; revoca la sesión.
- **Pruebas:** `login-user.test.ts` (6), `marketplace-http.test.ts`.

### 3.3 Catálogo

- `GET /products`: `search`, `categoria`, `orden`, `page`, `pageSize`; `200` con `{ data: { items, pagination } }`.
- `GET /products/{productId}`: `200` con detalle; UUID malformado → `400`; inexistente/no público → `404`.
- `GET /categories`: `200` con las cuatro categorías del dominio.
- **Reglas:** solo `PUBLICADO` de vendedores `ACTIVO`; disponibilidad calculada; `null` para `DIGITAL`.
- **Pruebas:** `catalog-http.test.ts` (10), `catalog-query-postgres.test.ts` (6).

### 3.4 Direcciones

- CRUD bajo `/buyers/me/addresses` y `POST .../{direccionId}/principal`.
- Ownership estricto; una principal por comprador; promoción al eliminar la principal.
- **Errores:** `400`, `401`, `403`, `404`, `409` (principal), `422`, `500`, `503`.
- **Pruebas:** `marketplace-http.test.ts`, `marketplace-postgres.test.ts`.

### 3.5 Alta de vendedor

- `POST /admin/sellers`: solo `ADMINISTRADOR` activo.
- `201` con usuario, vendedor y bodega creados atómicamente.
- `401`/`403` por sesión/rol; `409` por correo o documento duplicado; `422` por validación.
- **Pruebas:** `register-seller.test.ts` (5), `marketplace-postgres.test.ts` (éxito y rollback).

### 3.6 Carrito

- `GET /cart`, `POST /cart/items`, `PATCH /cart/items/{productoId}`, `DELETE /cart/items/{productoId}`.
- Rechaza producto inexistente/no público, vendedor inactivo y cantidades inválidas.
- Sin variantes en V1.
- **Pruebas:** `cart-use-cases.test.ts` (10), `marketplace-http.test.ts`.

### 3.7 Checkout y pedidos

- `POST /checkout` con `Idempotency-Key`, `direccionId`, `resultadoPagoSimulado`, `confirmarPrecio`.
- `201` confirmado/rechazado; `202` desconocido; `422` por stock, dirección, carrito vacío o cambio de precio (`motivo: "PRECIO_CAMBIADO"`).
- `GET /orders` y `GET /orders/{orderId}` con ownership.
- Un pedido por vendedor; snapshot de dirección; reservas de inventario.
- **Pruebas:** `marketplace-postgres.test.ts` (10), `marketplace-http.test.ts`.

### 3.8 `/health` y `/ready`

- `/health`: `200` si el proceso HTTP responde.
- `/ready`: `200` si PostgreSQL responde; `503` con `NotReadyResponse` si no.

### 3.9 Espacio de trabajo del vendedor

- 18 rutas bajo `/api/v1/seller/*`; el `sellerId` se deriva de la sesión y nunca del cuerpo o la URL.
- Perfil: `GET/PATCH /seller/profile`; la edición se limita a `nombreComercial`.
- Productos: alta en `BORRADOR`; publicación con SKU e imagen; transiciones `PUBLICADO → SUSPENDIDO → PUBLICADO` y `→ DESCONTINUADO` (terminal).
- Imágenes: referencias URL persistentes en `product_images`; alta y baja con ownership. No hay carga binaria.
- Bodegas: listar, crear y editar solo las propias.
- Inventario: consulta y `POST /seller/inventory/ingresos` con idempotencia por `(vendedor_id, idempotency_key)`; sin ajustes negativos ni movimientos logísticos.
- Pedidos: `GET /seller/orders` y detalle, solo con productos propios y en solo lectura.
- Acceso a recursos de otro vendedor → `404` (no filtra existencia).
- **Errores:** `400`, `401`, `403`, `404`, `409`, `422`, `500`, `503`.
- **Pruebas:** `seller-workspace.test.ts` (11), `seller-workspace-http.test.ts` (7), `seller-workspace-postgres.test.ts` (7), `seller-smoke.ts` (33/33), E2E del vendedor y recorrido cruzado (4/4).

### 3.10 Operación logística

- 9 rutas bajo `/api/v1/logistics/*` más `POST /api/v1/admin/logistics-operators`.
- El `operadorId` se resuelve desde el `usuarioId` de la sesión; no se acepta desde el cuerpo ni la URL. El rol debe ser `OPERADOR_LOGISTICO` y el perfil debe estar `ACTIVO`.
- Ámbito por bodegas asignadas en `logistics_operator_warehouses`: pedidos, reservas, envíos e inventario fuera de ese ámbito responden `404`.
- Preparación: `POST /logistics/orders/{orderId}/prepare` exige pedido `PAGADO`/`EN_PREPARACION`, bodega asignada y reservas `ACTIVA`; crea el envío en `PREPARACION`.
- Despacho: `POST /logistics/shipments/{shipmentId}/dispatch` consume reservas `ACTIVA → CONSUMIDA`, descuenta `on_hand`/`reserved` y registra `SALIDA_VENTA`. El pedido pasa a `DESPACHADO` solo si no quedan envíos pendientes ni reservas activas.
- Entrega: `POST /logistics/shipments/{shipmentId}/delivery` acepta `ENTREGADO` o `FALLIDO`; exige evidencia (tipo y referencia, o motivo en el fallo). El pedido pasa a `ENTREGADO` solo si todos los envíos están entregados y no quedan reservas activas.
- Idempotencia persistente por `(operador_id, tipo, idempotency_key)`; reintento con los mismos datos → `200`; clave reutilizada con otros datos → `422 IDEMPOTENCIA_CONFLICTO`.
- `order_status_history` registra actor, rol, transición, referencia causal y `correlation_id`. El checkout registra la transición de pago confirmado o rechazado.
- **Errores:** `400`, `401`, `403`, `404`, `409`, `422`, `500`, `503`.
- **Pruebas:** `logistics.test.ts` (14), `logistics-http.test.ts` (7), `logistics-postgres.test.ts` (6), E2E logístico completo (1).

### 3.11 Supervisión (solo lectura)

- 9 rutas `GET` bajo `/api/v1/supervisor/*`. El rol debe ser `SUPERVISOR` y el usuario debe estar `ACTIVO`; no hay acceso automático para `ADMINISTRADOR`.
- El guard rechaza cualquier método distinto de `GET`/`HEAD`/`OPTIONS` bajo `/api/v1/supervisor/*` con `405 METODO_NO_PERMITIDO` antes de resolver la sesión.
- `GET /supervisor/dashboard`: conteos directos de pedidos y pagos por estado, productos por estado, inventario sumado (`disponible = on_hand - reserved - unavailable`, `INV-03`), envíos por estado y vendedores por estado. No hay porcentajes, metas, SLA, rankings ni proyecciones.
- `GET /supervisor/orders` y `/orders/{orderId}`: pedidos de todos los vendedores con filtros por estado y paginación; el detalle incluye ítems, pago, reservas, envíos e historial de estados.
- `GET /supervisor/products` y `/products/{productId}`: catálogo completo (incluye `BORRADOR`, `SUSPENDIDO`, `DESCONTINUADO`) con filtros por estado, categoría y vendedor; el detalle incluye imágenes e inventario por bodega.
- `GET /supervisor/warehouses`, `/inventory`, `/shipments` y `/sellers`: consulta global con filtros y paginación.
- **Privacidad:** el adaptador omite nombre/teléfono/dirección del comprador, correo/documento del vendedor, dirección de entrega, identificadores de actor y referencia del proveedor de pago. Solo expone identificadores operativos, roles y estados.
- **Errores:** `400` (UUID o paginación inválida), `401`, `403`, `404`, `405`, `500`, `503`.
- **Pruebas:** `supervisor.test.ts` (5), `supervisor-http.test.ts` (9), `supervisor-postgres.test.ts` (3), E2E de supervisión (1).
- **Reportes:** `BLOQUEADO` (`L-19`). No se crean endpoints ni pantallas de reportes hasta que exista un catálogo aprobado.

### 3.12 Espacio administrativo

- 17 rutas `GET` bajo `/api/v1/admin/*` más las dos altas existentes. El rol debe ser `ADMINISTRADOR` y el usuario debe estar `ACTIVO`.
- Guarda de método: bajo `/api/v1/admin/*` solo se permiten `GET`/`HEAD`/`OPTIONS`, salvo `POST` en `/admin/sellers` y `/admin/logistics-operators`; el resto responde `405 METODO_NO_PERMITIDO` con `Allow`.
- `GET /admin/dashboard`: conteos directos de usuarios por rol/estado, vendedores, compradores, bodegas, productos, pedidos, pagos e inventario disponible, más consultas recientes reales. Sin porcentajes, metas, SLA, rankings ni proyecciones.
- `GET /admin/users` y `/users/{userId}`: usuarios con rol, estado y datos de perfil; el detalle no expone `hash_credencial` ni tokens.
- `GET /admin/sellers`, `/sellers/{sellerId}`, `/buyers`, `/buyers/{buyerId}`, `/warehouses`, `/warehouses/{warehouseId}`: consulta con filtros y paginación.
- `GET /admin/products` y `/products/{productId}`: catálogo completo con estado, categoría y vendedor; el detalle incluye imágenes e inventario.
- `GET /admin/inventory` y `/inventory/movements`: existencias y movimientos reales, sin `actor_id`.
- `GET /admin/orders` y `/orders/{orderId}`: pedidos globales; el detalle minimiza la dirección de entrega a `ciudad`, `region`, `pais` y `capturadoEn`.
- `GET /admin/payments`: pagos por estado, sin referencia del proveedor.
- `GET /admin/reports`: solo agregados reales derivables (conteos por estado, montos capturados, inventario disponible). Sin exportaciones ni catálogo de reportes aprobado.
- **Privacidad:** se omiten hashes, documentos, tokens, referencia del proveedor de pago, dirección completa y `actor_id`.
- **Errores:** `400`, `401`, `403`, `404`, `405`, `500`, `503`.
- **Pruebas:** `admin.test.ts` (5), `admin-http.test.ts` (10), `admin-postgres.test.ts` (3), E2E administrativo (1).

---

## 4. Esquemas declarados

| Esquema | Uso |
|---|---|
| `RegisterBuyerRequest` / `DocumentoIdentidad` / `RegisterBuyerResponse` | Alta de comprador |
| `LoginRequest` / `LoginResponse` / `SessionResponse` | Autenticación |
| `UsuarioAutenticado` | Usuario y rol |
| `DireccionEntrega` / `CreateAddressRequest` / `UpdateAddressRequest` | Direcciones |
| `RegisterSellerRequest` / `RegisterSellerResponse` | Alta administrativa |
| `Carrito` / `CarritoItem` / `AddCartItemRequest` / `UpdateCartItemRequest` | Carrito |
| `CheckoutRequest` / `CheckoutResponse` | Checkout |
| `PedidoResumen` / `PedidoDetalle` / `PedidoItem` / `PagoPedido` | Pedidos |
| `SellerProfile` / `UpdateSellerProfileRequest` | Perfil del vendedor |
| `SellerProduct` / `CreateSellerProductRequest` / `UpdateSellerProductRequest` | Productos del vendedor |
| `SellerProductImage` / `AddSellerProductImageRequest` | Imágenes por URL |
| `SellerWarehouse` / `CreateSellerWarehouseRequest` / `UpdateSellerWarehouseRequest` | Bodegas del vendedor |
| `SellerInventoryPosition` / `SellerIngressRequest` / `SellerIngressResponse` | Inventario e ingreso |
| `SellerOrderSummary` / `SellerOrderDetail` | Pedidos del vendedor |
| `LogisticsProfile` / `LogisticsWarehouse` / `LogisticsInventoryPosition` | Perfil, ámbito e inventario logístico |
| `LogisticsSummary` / `LogisticsOrderSummary` / `LogisticsOrderDetail` | Resumen y pedidos del operador |
| `PrepareShipmentRequest` / `DispatchShipmentRequest` / `DeliveryRequest` | Preparación, despacho y entrega |
| `RegisterLogisticsOperatorRequest` | Alta administrativa de operador |
| `SupervisorDashboard` | Resumen de supervisión |
| `SupervisorOrderSummary` / `SupervisorOrderDetail` / `SupervisorOrderItem` | Pedidos observados |
| `SupervisorPayment` / `SupervisorReservation` / `SupervisorShipment` / `SupervisorHistoryEntry` | Detalle operativo del pedido |
| `SupervisorProductSummary` / `SupervisorProductDetail` / `SupervisorProductInventory` / `SupervisorProductImage` | Catálogo observado |
| `SupervisorWarehouse` / `SupervisorInventoryPosition` / `SupervisorShipmentSummary` / `SupervisorSeller` | Consultas globales |
| `AdminDashboard` / `AdminRecentOrder` / `AdminRecentPayment` | Resumen administrativo |
| `AdminUserSummary` / `AdminUserDetail` | Usuarios |
| `AdminSellerSummary` / `AdminSellerDetail` / `AdminBuyerSummary` / `AdminBuyerDetail` | Vendedores y compradores |
| `AdminWarehouseSummary` / `AdminWarehouseDetail` | Bodegas |
| `AdminProductSummary` / `AdminProductDetail` / `AdminInventoryPosition` / `AdminInventoryMovement` | Catálogo e inventario |
| `AdminOrderSummary` / `AdminOrderDetail` / `AdminPayment` / `AdminReports` | Pedidos, pagos y reportes |
| `CategoriaProducto` / `PrecioProducto` / `ImagenProducto` / `VendedorResumen` | Catálogo |
| `ProductoResumen` / `ProductoDetalle` / `PaginacionCatalogo` | Catálogo |
| `HealthResponse` / `ReadyResponse` / `NotReadyResponse` | Estado |
| `ErrorResponse` | Sobre uniforme de error |

Cabecera transversal: `x-correlation-id` (1–200 caracteres, patrón `^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$`). Se reutiliza el valor válido del cliente o se genera un UUID.

---

## 5. Códigos de error

| Código | HTTP | Uso actual |
|---|---:|---|
| `VALIDACION_INVALIDA` | 400 | Cuerpo, JSON, query, parámetro o propiedad desconocida |
| `NO_AUTENTICADO` | 401 | Sesión ausente, inválida, expirada o revocada |
| `NO_AUTORIZADO` | 403 | Rol insuficiente o recurso ajeno |
| `RUTA_NO_ENCONTRADA` | 404 | Ruta global desconocida |
| `RECURSO_NO_ENCONTRADO` | 404 | Producto, pedido o dirección inexistente/no visible |
| `METODO_NO_PERMITIDO` | 405 | Método no declarado; incluye `Allow` |
| `CONFLICTO_UNICIDAD` | 409 | Correo/documento duplicado; dirección principal duplicada |
| `REGLA_NEGOCIO_INCUMPLIDA` | 422 | Stock, carrito vacío, dirección, cambio de precio |
| `DEPENDENCIA_NO_DISPONIBLE` | 503 | PostgreSQL o hashing no disponible |
| `ERROR_INTERNO` | 500 | Error no controlado |

Además, Fastify puede producir `413` y `415`; el contrato los declara donde aplica.

---

## 6. Validación del contrato

- `backend/scripts/validate-openapi.ts` valida offline: YAML, versión 3.1.x, rutas, `operationId` únicos, respuestas, parámetros de ruta, seguridad y resolución de `$ref`.
- `npm run validate:openapi` → `OpenAPI válido: 68 rutas, 76 operaciones, 904 referencias.`
- `npm run verify` ejecuta typecheck + pruebas + validación OpenAPI + build.
- `backend/tests/contract/openapi.test.ts` (6 pruebas) verifica rutas, métodos, respuestas, seguridad, esquemas y referencias. Incluye que las 9 rutas de supervisión solo declaren `GET`, que no existan operaciones de escritura bajo `/api/v1/supervisor/*`, y que las rutas admin sean de solo lectura salvo las dos altas.

Conteo total del backend: **20 archivos / 160 pruebas** en `npm test`; **8 archivos / 40 pruebas** en `npm run test:postgres`.

---

## 7. Brechas conocidas

| Brecha | Impacto | Estado |
|---|---|---|
| Resolución de pagos `DESCONOCIDO` | El pedido queda pendiente sin reconciliación automática | Abierta, fuera de alcance |
| Sin reembolsos ni logística inversa | No se puede revertir un pago confirmado | Fuera de alcance |
| Validador OpenAPI propio, no Spectral | Cobertura semántica menor que un validador estándar | Aceptada; corre offline |
| Sin lint | Deuda de estilo no verificada | `BLOCKED`: sin herramienta |
| Sin CI ejecutado en GitHub | La verificación continua no está probada en remoto | `READY_FOR_REVIEW` |
| Sin pruebas de contrato generadas desde OpenAPI | Las pruebas HTTP son manuales respecto al documento | Abierta |
| Sin `ETag`/`Cache-Control` explícitos | El frontend usa `cache: "no-store"` | Aceptado |
| Sin paginación por cursor | Solo paginación por página | Decisión V1 |
| Sin variantes comerciales | Cada combinación es un producto | Decisión V1 |
| Carga binaria de imágenes | Solo se declaran referencias URL persistentes | `BLOQUEADO`: sin proveedor/mecanismo/límites aprobados |
| Ajustes negativos y movimientos logísticos del vendedor | No hay rutas que los expongan | `BLOQUEADO`: sin autorización explícita |
| Preparación/despacho del vendedor | Pedidos de solo lectura | `NO_APLICA`: reservado a logística |
| Asignación automática de pedidos | No hay política ni contrato | `BLOQUEADO` (`L-23`) |
| Transportistas externos, tracking integrado y evidencia del proveedor | Solo datos opcionales aportados por el operador | `BLOQUEADO` (`L-23`) |
| Cierre `ENTREGADO → CERRADO` (`CloseOrder`) | No hay actor ni proceso definido | `BLOQUEADO` |
| Entrega digital (`PUB-06`) | No hay recurso declarado | Pendiente: estructura no definida en el SDD |
| Reportes administrativos del supervisor | No hay catálogo, fórmulas, filtros ni límites aprobados | `BLOQUEADO` (`L-19`); no se crean endpoints ni pantallas |
| Reportes del administrador | Solo agregados reales directos; sin catálogo, fórmulas, filtros ni exportaciones aprobadas | `PARCIAL`; catálogo y exportaciones `BLOQUEADO` (`L-19`) |
| Devoluciones, reembolsos y facturación | No existen tablas de persistencia ni reglas aprobadas | `BLOQUEADO`; no se crean endpoints |
| Mutaciones admin de producto/inventario/pago | No definidas ni autorizadas | `BLOQUEADO`; espacio admin de consulta salvo las dos altas |
| Autoregistro público de comprador | No definido para esta fase | Diferido; solo se documenta la dependencia |
| Solicitud comprador → vendedor | No definida para esta fase | Diferido; solo se documenta la dependencia |

Ninguna brecha se presenta como resuelta.

---

## 8. Protocolo de cambio

1. Cambiar dominio, caso de uso, adaptador y ruta en el backend.
2. Actualizar `backend/openapi.yaml`.
3. Actualizar `tests/contract/openapi.test.ts` y las pruebas HTTP/PostgreSQL.
4. Ejecutar `npm run verify` y `npm run test:postgres`.
5. Actualizar los tipos y funciones del feature correspondiente en el frontend.
6. Registrar la decisión en `DECISIONS-LOG.md` y el estado en este documento.

Una ruta no puede ser consumida por el frontend si no está en OpenAPI y cubierta por pruebas.
