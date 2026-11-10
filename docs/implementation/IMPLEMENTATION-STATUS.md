# NexusMarket — Estado de implementación

**Corte:** 2026-11-09
**Estado global:** marketplace funcional local (autenticación, direcciones, alta de vendedor, carrito, checkout con pago simulado, frontend integrado, espacio de trabajo del vendedor, operación logística, supervisión de solo lectura, espacio administrativo de consulta, autoregistro público de comprador, solicitud comprador → vendedor, revisión administrativa y gestión de estados de acceso) verificado con evidencia ejecutada.
**Fuente de verdad:** código del repositorio, PostgreSQL real y comandos ejecutados en este corte.

---

## 1. Resumen de gates

| Gate | Alcance | Estado | Evidencia principal |
|---|---|---|---|
| A | Persistencia PostgreSQL obligatoria | `PASS` | Sin almacén memoria en `src/`; 187 pruebas; 46 pruebas PostgreSQL |
| B | Catálogo backend | `PASS` | Migración `003`; rutas de productos y categorías |
| C | Contrato OpenAPI | `PASS` | `openapi.yaml` 0.7.0; validador offline; prueba de contrato |
| D | Frontend de catálogo | `PASS` | Typecheck/build; home, catálogo y detalle contra API real |
| E | Verificación y documentación (entrega 1) | `PASS` local | Suites, smoke y documentos |
| F | Autenticación y sesiones (`ADR-004`) | `PASS` | Login/sesión/logout, cookie HttpOnly, bearer, 401/403 probados |
| G | Direcciones de comprador (`L-01`) | `PASS` | CRUD, principal único, ownership y snapshot en pedidos |
| H | Alta administrativa de vendedor (`PI-02`) | `PASS` | `POST /api/v1/admin/sellers`; transacción atómica; rollback probado |
| I | Carrito persistente | `PASS` | `GET/POST/PATCH/DELETE`; validación de producto y cantidades |
| J | Checkout, pedidos y pago simulado | `PASS` | Confirmado/rechazado/desconocido; idempotencia; reservas |
| K | Integración frontend del marketplace | `PASS` | Login, carrito, checkout, pedidos, direcciones, admin; E2E navegador 13/13 |
| L | CI y validación OpenAPI | `READY_FOR_REVIEW` | Workflow de 5 jobs válido (lint, formato, tipos, pruebas, PostgreSQL y E2E); **no ejecutado en GitHub** |
| M | Lint y formato | `PASS` local | ESLint en backend y frontend; Prettier `format:check` en backend; ambos ejecutados sin errores |
| N | Espacio de trabajo del vendedor (`GATE-V2-SELLER`) | `PASS` local | 18 rutas `/api/v1/seller/*`; 110 pruebas backend; 28 PostgreSQL; smoke 33/33; E2E 4/4 |
| O | Operación logística (`GATE-V2-LOGISTICS`) | `PASS` local | 9 rutas `/api/v1/logistics/*` + alta administrativa; 145 pruebas backend; 37 PostgreSQL; smoke 33/33; E2E 6/6 |
| P | Supervisión de solo lectura (`GATE-V2-SUPERVISOR`) | `PASS` local | 9 rutas `GET /api/v1/supervisor/*` + guarda `405`; dashboard real; E2E 6/6; reportes `BLOQUEADO` (`L-19`) |
| Q | Espacio administrativo (`GATE-V2-ADMIN`) | `PASS` local | 17 rutas `GET /api/v1/admin/*` + guarda de método; alta atómica de vendedor/logística intacta; 160 pruebas backend; 40 PostgreSQL; E2E 7/7; reportes solo agregados reales |
| R | Identidad y onboarding (`GATE-V2-IDENTITY`) | `PASS` local | Registro público, solicitud comprador → vendedor, aprobación atómica, rechazo sin efectos y estados de acceso con revocación de sesión; 187 pruebas backend; 46 PostgreSQL; E2E 10/10; lint y formato ejecutados |

`PASS` significa “verificado con la evidencia listada”. No implica ejecución remota de CI ni revisión independiente. `READY_FOR_REVIEW` indica que el artefacto existe y fue validado localmente, pero su ejecución real en GitHub Actions está pendiente.

---

## 2. Evidencia consolidada de este corte

### Backend

| Comando | Resultado observado |
|---|---|
| `npm run lint` | OK (ESLint 10 + typescript-eslint; 0 errores) |
| `npm run format:check` | OK (Prettier; todos los archivos cumplen) |
| `npm run typecheck` | OK |
| `npm test` | 23 archivos, 187 pruebas aprobadas |
| `npm run validate:openapi` | `OpenAPI válido: 74 rutas, 83 operaciones, 984 referencias.` |
| `npm run build` | OK |
| `npm run verify` | OK (lint + format + typecheck + test + validate:openapi + build) |
| `npm run test:postgres` | 9 archivos, 46 pruebas aprobadas |
| `npm run smoke:seller` | 33/33 comprobaciones PASS contra la API real |

Desglose de `npm test`:

| Archivo | Pruebas |
|---|---:|
| `tests/unit/value-objects.test.ts` | 4 |
| `tests/unit/register-buyer.test.ts` | 5 |
| `tests/unit/argon2-password-hasher.test.ts` | 1 |
| `tests/unit/config.test.ts` | 5 |
| `tests/unit/persistence-architecture.test.ts` | 2 |
| `tests/unit/login-user.test.ts` | 6 |
| `tests/unit/register-seller.test.ts` | 5 |
| `tests/unit/cart-use-cases.test.ts` | 10 |
| `tests/unit/seller-workspace.test.ts` | 11 |
| `tests/unit/logistics.test.ts` | 14 |
| `tests/unit/supervisor.test.ts` | 5 |
| `tests/unit/admin.test.ts` | 5 |
| `tests/integration/register-buyer-http.test.ts` | 19 |
| `tests/integration/catalog-http.test.ts` | 10 |
| `tests/integration/marketplace-http.test.ts` | 19 |
| `tests/integration/seller-workspace-http.test.ts` | 7 |
| `tests/integration/logistics-http.test.ts` | 7 |
| `tests/integration/supervisor-http.test.ts` | 9 |
| `tests/integration/admin-http.test.ts` | 10 |
| `tests/unit/seller-applications.test.ts` | 9 |
| `tests/unit/update-user-access-status.test.ts` | 7 |
| `tests/integration/seller-applications-http.test.ts` | 11 |
| `tests/contract/openapi.test.ts` | 6 |

Desglose de `npm run test:postgres`:

| Archivo | Pruebas |
|---|---:|
| `tests/postgres/register-buyer-postgres.test.ts` | 3 |
| `tests/postgres/migrations-postgres.test.ts` | 2 |
| `tests/postgres/catalog-query-postgres.test.ts` | 6 |
| `tests/postgres/marketplace-postgres.test.ts` | 10 |
| `tests/postgres/seller-workspace-postgres.test.ts` | 7 |
| `tests/postgres/logistics-postgres.test.ts` | 6 |
| `tests/postgres/supervisor-postgres.test.ts` | 3 |
| `tests/postgres/admin-postgres.test.ts` | 3 |
| `tests/postgres/seller-applications-postgres.test.ts` | 6 |

### Frontend

| Comando / comprobación | Resultado observado |
|---|---|
| `npm run lint` | OK (ESLint 10 + Next + React Hooks; 0 errores, 2 avisos de `<img>`) |
| `npm run typecheck` | OK |
| `npm run build` | OK (Next.js 16.4.3, 56 rutas) |
| Smoke HTTP del frontend (corte anterior) | 15/15 PASS |
| E2E de navegador real del marketplace (corte anterior, Chrome CDP) | 13/13 PASS |
| E2E de navegador real (Playwright + Microsoft Edge) | 10/10 PASS (protección, recorrido del vendedor, aislamiento, recorrido cruzado, recorrido logístico completo, supervisión de solo lectura, administración y onboarding de identidad) |
| Smoke HTTP del vendedor | 33/33 PASS |

### Migraciones aplicadas

`001_initial.sql`, `002_audit_nested_secrets.sql`, `003_catalog.sql`, `004_identity_sessions.sql`, `005_buyer_addresses.sql`, `006_cart_checkout.sql`, `007_seller_workspace.sql`, `008_logistics.sql`, `009_seller_applications.sql`.

---

## 3. Gate F — Autenticación y sesiones (`ADR-004`)

### Implementado

- `POST /api/v1/auth/login`: valida correo + credencial con Argon2id, crea sesión opaca y devuelve `{ token, expiraEn, usuario }`.
- `GET /api/v1/auth/session`: devuelve el usuario autenticado y su rol.
- `POST /api/v1/auth/logout`: revoca la sesión activa.
- Token aleatorio de 256 bits; solo se almacena su hash SHA-256 en `sessions`.
- Cookie `nexus_session` `HttpOnly`, `SameSite=Lax`, TTL de 8 horas; se acepta `Authorization: Bearer` para API y pruebas.
- Sesión inválida/expirada/revocada → `401 NO_AUTENTICADO`.
- Autorización por rol en el backend (`ADMINISTRADOR`, `COMPRADOR`); el frontend no decide permisos.

### Evidencia

- `backend/tests/unit/login-user.test.ts` (6).
- `backend/tests/integration/marketplace-http.test.ts` (19) cubre login, sesión, logout, token inválido y guardas de rol.
- Smoke HTTP real: login/sesión/logout correctos; anónimo `401`; comprador en ruta admin `403`.

---

## 4. Gate G — Direcciones de comprador (`L-01`)

### Implementado

- Modelo mínimo: `destinatario`, `telefono`, `linea1`, `linea2?`, `ciudad`, `region`, `codigoPostal?`, `pais` (ISO-3166-1 alpha-2).
- `GET/POST /api/v1/buyers/me/addresses`, `PATCH/DELETE /api/v1/buyers/me/addresses/{direccionId}`, `POST .../{direccionId}/principal`.
- Ownership estricto: cada comprador solo ve y modifica sus direcciones.
- Una sola dirección principal por comprador mediante índice único parcial; al eliminar la principal se promueve la más antigua restante.
- Los pedidos guardan una copia JSON inmutable de la dirección usada en el checkout.

### Evidencia

- `backend/tests/postgres/marketplace-postgres.test.ts` cubre ownership, principal único y snapshot.
- E2E de navegador: crear, marcar principal y eliminar dirección.

---

## 5. Gate H — Alta administrativa de vendedor (`PI-02`)

### Implementado

- `POST /api/v1/admin/sellers`, solo `ADMINISTRADOR` con cuenta `ACTIVO`.
- Crea en una sola transacción PostgreSQL: `users` (rol `VENDEDOR`), `sellers` y `warehouses` (primera bodega), más auditoría/outbox.
- El cuerpo no puede declarar identidad ni rol; el actor sale de la sesión.
- Conflicto de correo/documento → `409 CONFLICTO_UNICIDAD`.
- Si falla la creación de la bodega, toda la transacción revierte y no queda vendedor sin bodega.

### Evidencia

- `backend/tests/unit/register-seller.test.ts` (5).
- `backend/tests/postgres/marketplace-postgres.test.ts` incluye éxito atómico y rollback por fallo de bodega.
- Smoke HTTP real: alta correcta y duplicado `409`.

---

## 6. Gate I — Carrito persistente

### Implementado

- `GET /api/v1/cart`, `POST /api/v1/cart/items`, `PATCH /api/v1/cart/items/{productoId}`, `DELETE /api/v1/cart/items/{productoId}`.
- Persistencia real en `carts`/`cart_items`; sin variantes en V1.
- Rechaza productos inexistentes, no públicos, de vendedor inactivo, cantidades inválidas y productos no vendibles.
- El backend es autoridad de cantidades y precios; el frontend solo muestra lo que devuelve la API.
- `precio_referencial_centavos` permite detectar cambios de precio en checkout.

### Evidencia

- `backend/tests/unit/cart-use-cases.test.ts` (10).
- `backend/tests/integration/marketplace-http.test.ts` cubre alta, actualización, eliminación y rechazos.
- E2E: agregar al carrito y cambiar cantidad a 3.

---

## 7. Gate J — Checkout, pedidos y pago simulado

### Implementado

- `POST /api/v1/checkout`: valida carrito, productos, stock y dirección; crea un pedido por vendedor; reserva inventario; simula el pago.
- `GET /api/v1/orders`, `GET /api/v1/orders/{orderId}` con ownership.
- Idempotencia por `(comprador_id, idempotency_key)` en `checkout_attempts`; reintentos devuelven el mismo resultado sin duplicar pedidos ni reservas.
- Resultados simulados explícitos:
  - `CONFIRMADO` → pedido `EN_PREPARACION`, pago `CAPTURADO`.
  - `RECHAZADO` → pedido `CANCELADO`, pago `RECHAZADO`; libera reservas una sola vez.
  - `DESCONOCIDO` → pedido `PENDIENTE_DE_PAGO`, pago `PENDIENTE`; **no** es éxito ni rechazo y queda pendiente de resolución.
- Cambio de precio → `422 REGLA_NEGOCIO_INCUMPLIDA` con `motivo: "PRECIO_CAMBIADO"` salvo `confirmarPrecio: true`.
- No se implementan reembolsos ni logística inversa en esta etapa.

### Evidencia

- `backend/tests/postgres/marketplace-postgres.test.ts` (10) cubre confirmado, rechazado, desconocido, idempotencia, cambio de precio y pedidos por vendedor.
- Smoke HTTP real: `201` confirmado, `201` rechazado, `202` desconocido, reintento desconocido con el mismo checkout/pedidos, `422 PRECIO_CAMBIADO`, `201` con confirmación y `401` anónimo.
- E2E de navegador: checkout confirmado y detalle de pedido.

---

## 8. Gate K — Integración frontend del marketplace

### Entregables

| Pantalla / pieza | Ruta |
|---|---|
| Login / logout | `frontend/src/app/login/`, `frontend/src/features/auth/` |
| Carrito | `frontend/src/app/cart/`, `frontend/src/features/cart/` |
| Checkout | `frontend/src/app/checkout/`, `frontend/src/features/orders/components/checkout-form.tsx` |
| Pedidos | `frontend/src/app/orders/(list)/`, `frontend/src/app/orders/[orderId]/` |
| Direcciones | `frontend/src/app/addresses/`, `frontend/src/features/addresses/` |
| Admin vendedores | `frontend/src/app/admin/sellers/`, `frontend/src/features/sellers/` |
| Cabecera con rol | `frontend/src/components/site-header.tsx` |

### Decisiones de integración

- Server Actions para mutaciones; el token opaco se guarda en una cookie `HttpOnly` propia del frontend y se reenvía como `Bearer`.
- El checkout conserva la misma `idempotency_key` en reintentos por pago desconocido y por confirmación de precio.
- `/checkout` ya no redirige con carrito vacío: muestra estado vacío y mantiene visible el resultado exitoso tras la revalidación.
- El detalle de pedido valida el ID antes de llamar a la API; un ID malformado devuelve 404 real. La lista tiene su propio `loading.tsx` en `(list)` para no convertir el detalle en un soft-404.
- `ApiError` vive en `frontend/src/lib/api/errors.ts` para que los componentes cliente no importen el módulo `server-only`.

### Evidencia

- `npm run typecheck` y `npm run build` OK.
- Smoke HTTP: 15/15 PASS (home, login, guardas anónimas, carrito, pedidos, direcciones, checkout, admin, redirección de login, add-to-cart, aviso anónimo, 404 de producto y pedido).
- E2E navegador (Chrome CDP): 13/13 PASS (login comprador, agregar, actualizar cantidad, checkout confirmado, detalle, dirección crear/principal/eliminar, logout, login admin, alta vendedor, logout admin, sin errores de consola).

---

## 9. Gate N — Espacio de trabajo del vendedor (`GATE-V2-SELLER`)

### Alcance implementado

- Reutiliza la autenticación y la sesión existentes; no crea un mecanismo paralelo. El vendedor solo puede existir por alta administrativa (`PI-02`); no hay autoregistro.
- Backend con 18 rutas bajo `/api/v1/seller/*`:
  - Perfil: `GET/PATCH /seller/profile` (la edición se limita a `nombreComercial`).
  - Productos: `GET/POST /seller/products`, `GET/PATCH /seller/products/{productId}`.
  - Imágenes: `POST /seller/products/{productId}/images`, `DELETE /seller/products/{productId}/images/{imageId}`.
  - Ciclo de vida: `POST .../publish`, `POST .../suspend`, `POST .../discontinue`.
  - Bodegas: `GET/POST /seller/warehouses`, `PATCH /seller/warehouses/{warehouseId}`.
  - Inventario: `GET /seller/inventory`, `POST /seller/inventory/ingresos`.
  - Pedidos: `GET /seller/orders`, `GET /seller/orders/{orderId}` (solo lectura).
- Ownership en el backend: el `sellerId` se deriva de la sesión, nunca del cuerpo ni de la URL. Todo acceso a un recurso de otro vendedor responde `404` para no filtrar su existencia.
- Productos: creación en `BORRADOR`; publicación solo si el SKU no está vacío, existe al menos una imagen y el vendedor está `ACTIVO`; transiciones `BORRADOR → PUBLICADO`, `PUBLICADO → SUSPENDIDO`, `SUSPENDIDO → PUBLICADO` (con revalidación) y `PUBLICADO/SUSPENDIDO → DESCONTINUADO`. `DESCONTINUADO` es terminal y no se reactiva.
- Imágenes: referencias URL persistentes en `product_images`, con ownership por producto. La carga binaria queda `BLOQUEADO` porque el SDD rechaza `FileStorage` y no hay proveedor ni límites de tamaño/formato aprobados.
- Inventario: ingreso (`INGRESO`) atómico sobre `inventory` + `inventory_movements`, con bloqueo asesor e idempotencia por `(vendedor_id, idempotency_key)`. La invariante de stock no negativo la impone el esquema PostgreSQL.
- Pedidos: el vendedor solo ve pedidos que contienen productos propios; no confirma/rechaza pagos, no reembolsa y no prepara/despacha.
- Frontend `/seller`: layout protegido, inicio, perfil, productos, alta/edición, bodegas, inventario y pedidos, con estados de carga, vacío, error, validación, acceso denegado y no encontrado.
- OpenAPI `0.4.0`: 33 rutas, 40 operaciones y 419 referencias; pruebas de contrato actualizadas.

### Evidencia ejecutada

| Comprobación | Resultado |
|---|---|
| `backend`: `npm run verify` | OK; 14 archivos / 110 pruebas; OpenAPI 33/40/419; build OK |
| `backend`: `npm run test:postgres` | 5 archivos / 28 pruebas OK contra PostgreSQL 17.11 |
| `backend`: `npm run smoke:seller` | 33/33 PASS (perfil, productos, publicación, imágenes, ownership, ingreso, idempotencia, estados, pedidos) |
| `frontend`: `npm run typecheck` | OK |
| `frontend`: `npm run build` | OK; 18 rutas |
| `frontend`: `npm run test:e2e` | 4/4 PASS (protección de rutas, recorrido completo del vendedor, aislamiento entre vendedores y recorrido cruzado admin → vendedor → comprador → pedido) |

### Límites declarados

- Carga binaria de imágenes: `BLOQUEADO` por ausencia de mecanismo/proveedor/límites aprobados. Se implementaron referencias URL persistentes.
- Ajustes negativos de inventario y movimientos logísticos: no autorizados explícitamente por la matriz §19; no se exponen.
- Preparación, empaque y despacho: reservados al operador logístico; los pedidos del vendedor son de solo lectura.
- Recurso de entrega digital (`PUB-06`): el SDD no define su estructura; no se modela.
- Variantes comerciales: fuera de V1 por decisión, aunque el SDD las exige (`CAT-02`); discrepancia registrada.

---

## 10. Gate O — Operación logística (`GATE-V2-LOGISTICS`)

### Alcance implementado

- Migración `008_logistics.sql`: `logistics_operators`, `logistics_operator_warehouses`, `shipments`, `shipment_items`, `shipment_events`, `delivery_evidence`, `logistics_operations` y `order_status_history`; `inventory_reservations.estado` admite `CONSUMIDA` y `consumida_en`; `orders.entregado_en`.
- Autenticación reutilizada: `requireLogistics()` exige rol `OPERADOR_LOGISTICO` y estado `ACTIVO`. El identificador del operador se resuelve desde el `usuarioId` de la sesión; no se acepta desde el cuerpo ni la URL.
- Ámbito por bodegas asignadas: el operador solo consulta y opera pedidos, reservas y envíos cuya bodega de origen esté en `logistics_operator_warehouses`. Un recurso fuera del ámbito responde `404`.
- Backend con 9 rutas bajo `/api/v1/logistics/*` más el alta administrativa:
  - Perfil y ámbito: `GET /logistics/profile`, `GET /logistics/warehouses`.
  - Inventario autorizado: `GET /logistics/inventory`.
  - Resumen y pedidos: `GET /logistics/summary`, `GET /logistics/orders`, `GET /logistics/orders/{orderId}`.
  - Preparación: `POST /logistics/orders/{orderId}/prepare`.
  - Despacho: `POST /logistics/shipments/{shipmentId}/dispatch`.
  - Entrega: `POST /logistics/shipments/{shipmentId}/delivery`.
  - Alta administrativa: `POST /api/v1/admin/logistics-operators`.
- Flujo verificado: pago confirmado → reservas `ACTIVA` → preparación (`PREPARACION`) → despacho (reservas `ACTIVA → CONSUMIDA`, descuento de `on_hand`/`reserved`, movimiento `SALIDA_VENTA`) → entrega con evidencia → pedido `ENTREGADO` cuando todos los envíos están entregados y no quedan reservas activas.
- Idempotencia persistente en `logistics_operations` por `(operador_id, tipo, idempotency_key)` y bloqueo asesor; un reintento devuelve `200` sin duplicar envíos, salidas ni evidencias.
- Historial real en `order_status_history` con actor, rol, referencia causal y `correlation_id`. El checkout registra `PENDIENTE_DE_PAGO → EN_PREPARACION` o `→ CANCELADO` según el pago simulado.
- Frontend `/logistics`: resumen, pedidos con filtro, detalle operable (preparación, despacho, entrega e historial), bodegas e inventario; guardas de servidor y Server Actions.
- OpenAPI `0.6.0`: 52 rutas, 59 operaciones y 647 referencias; contratos logístico y de supervisión cubiertos.
- Seed demo: operador `logistica@nexusmarket.demo` con las bodegas de Aurora y Nido.

### Evidencia ejecutada

| Comprobación | Resultado |
|---|---|
| `backend`: `npm run verify` | OK; 18 archivos / 145 pruebas; OpenAPI 52/59/647; build OK |
| `backend`: `npm run test:postgres` | 7 archivos / 37 pruebas OK contra PostgreSQL 17.11 |
| `backend`: `npm run smoke:seller` | 33/33 PASS (regresión del vendedor) |
| `backend`: login real del operador demo | rol `OPERADOR_LOGISTICO`, estado `ACTIVO`, 2 bodegas asignadas |
| `frontend`: `npm run typecheck` / `npm run build` | OK; 29 rutas |
| `frontend`: `npm run test:e2e` | 6/6 PASS, incluido el recorrido logístico completo con evidencia |

### Límites declarados

- Asignación automática de pedidos, transportistas externos, tracking integrado y evidencia del proveedor: `BLOQUEADO` (`L-23`). Solo se registran `transportista` y `tracking_number` cuando el operador los aporta.
- `CloseOrder` (`ENTREGADO → CERRADO`): `BLOQUEADO`; no hay actor ni proceso definido. El flujo termina en `ENTREGADO`.
- El operador no modifica precios, pagos, reembolsos ni devoluciones; el inventario es de solo lectura salvo el efecto del despacho.
- Lint sigue `BLOCKED` y CI sigue `READY_FOR_REVIEW`.

---

## 11. Gate P — Supervisión de solo lectura (`GATE-V2-SUPERVISOR`)

### Alcance implementado

- Perfil `SUPERVISOR` estrictamente de consulta (`SUP-01`). No se agregó ninguna migración: se reutilizan las tablas y consultas existentes.
- Backend con 9 rutas `GET` bajo `/api/v1/supervisor/*`:
  - `GET /supervisor/dashboard`
  - `GET /supervisor/orders`, `GET /supervisor/orders/{orderId}`
  - `GET /supervisor/products`, `GET /supervisor/products/{productId}`
  - `GET /supervisor/warehouses`
  - `GET /supervisor/inventory`
  - `GET /supervisor/shipments`
  - `GET /supervisor/sellers`
- Guarda de método: cualquier `POST`, `PATCH`, `PUT` o `DELETE` bajo el prefijo responde `405 METODO_NO_PERMITIDO` con `Allow: GET, HEAD`, incluso si la ruta no existe. La restricción no depende de la navegación del cliente.
- Autorización: `requireSupervisor()` exige rol `SUPERVISOR` y usuario `ACTIVO`. `ADMINISTRADOR` no hereda el acceso.
- Adaptador PostgreSQL de solo lectura: la implementación no contiene `INSERT`, `UPDATE` ni `DELETE`.
- Dashboard construido con conteos directos de estados definidos y con la suma de inventario `disponible = on_hand - reserved - unavailable` (`INV-03`). No hay porcentajes, metas, SLA, rankings, proyecciones ni comparaciones temporales.
- Privacidad por minimización: se omiten nombre/teléfono/dirección del comprador, correo/documento del vendedor, dirección de entrega, identificadores de actor y referencia del proveedor de pago. Se publican identificadores operativos, roles, estados y el nombre comercial del vendedor.
- Frontend `/supervisor`: layout protegido, resumen, pedidos (lista y detalle), productos (lista y detalle), almacenes, inventario, envíos y vendedores; estados de carga, vacío, error, acceso denegado y no encontrado. No hay formularios ni botones de mutación.
- OpenAPI `0.6.0`: 52 rutas, 59 operaciones y 647 referencias; contrato de supervisión cubierto y sin operaciones de escritura bajo el prefijo.
- Seed demo: `supervisor@nexusmarket.demo` (`SUPERVISOR`, `ACTIVO`).

### Evidencia ejecutada

| Comprobación | Resultado |
|---|---|
| `backend`: `npm run verify` | OK; 18 archivos / 145 pruebas; OpenAPI 52/59/647; build OK |
| `backend`: `npm run test:postgres` | 7 archivos / 37 pruebas OK contra PostgreSQL 17.11 |
| `backend`: pruebas de supervisión | `supervisor.test.ts` (5), `supervisor-http.test.ts` (9), `supervisor-postgres.test.ts` (3) |
| `backend`: guarda de método | `GET` anónimo → `401`; `POST` → `405` con `Allow: GET, HEAD` |
| `backend`: login real del supervisor demo | rol `SUPERVISOR`, estado `ACTIVO` |
| `frontend`: `npm run typecheck` / `npm run build` | OK; 29 rutas |
| `frontend`: `npm run test:e2e` | 6/6 PASS; la suite de supervisión verifica redirección anónima, denegación a admin/comprador/vendedor/logística, datos reales y ausencia de formularios |

### Límites declarados

- Reportes administrativos: `BLOQUEADO` (`L-19`). No hay catálogo, fórmulas, filtros ni límites aprobados; no se crean endpoints ni pantallas, y la interfaz muestra “No disponibles”.
- El supervisor no modifica precios, inventario, pedidos, pagos, vendedores, bodegas, roles ni logística.
- Sin acceso a datos personales ni a la referencia del proveedor de pago.
- Lint sigue `BLOCKED` y CI sigue `READY_FOR_REVIEW`.

---

## 12. Gate Q — Espacio administrativo (`GATE-V2-ADMIN`)

### Alcance implementado

- Perfil `ADMINISTRADOR` con espacio de consulta y las dos altas administrativas ya existentes. No se agregó migración: se reutilizan las tablas y consultas existentes.
- Backend con 17 rutas `GET` bajo `/api/v1/admin/*`:
  - `GET /admin/dashboard`
  - `GET /admin/users`, `GET /admin/users/{userId}`
  - `GET /admin/sellers`, `GET /admin/sellers/{sellerId}`
  - `GET /admin/buyers`, `GET /admin/buyers/{buyerId}`
  - `GET /admin/warehouses`, `GET /admin/warehouses/{warehouseId}`
  - `GET /admin/products`, `GET /admin/products/{productId}`
  - `GET /admin/inventory`, `GET /admin/inventory/movements`
  - `GET /admin/orders`, `GET /admin/orders/{orderId}`
  - `GET /admin/payments`
  - `GET /admin/reports`
- Altas existentes preservadas sin cambios: `POST /api/v1/admin/sellers` (transacción atómica vendedor + primera bodega) y `POST /api/v1/admin/logistics-operators`.
- Guarda de método: bajo el prefijo admin solo se permiten `GET`, `HEAD` y `OPTIONS`; `POST` solo en las dos rutas de alta. Cualquier otro método responde `405 METODO_NO_PERMITIDO` con `Allow` correspondiente, incluso si la ruta no existe.
- Autorización: `requireAdmin()` exige rol `ADMINISTRADOR` y usuario `ACTIVO`. `SUPERVISOR` y demás roles no heredan el acceso.
- Adaptador PostgreSQL de solo lectura: no contiene `INSERT`, `UPDATE` ni `DELETE`.
- Dashboard y reportes construidos solo con agregados reales y derivables: conteos por estado, montos de pagos capturados y suma de inventario disponible (`on_hand - reserved - unavailable`). No hay porcentajes, metas, SLA, rankings, proyecciones, comisiones ni comparaciones temporales.
- Privacidad por minimización: se omiten `hash_credencial`, documentos, tokens de sesión, referencia del proveedor de pago, dirección de entrega completa y `actor_id` de movimientos. El detalle de pedido solo expone `ciudad`, `region`, `pais` y `capturadoEn` como datos de entrega.
- Frontend `/admin`: layout protegido con dashboard, usuarios (lista/detalle), vendedores (lista/detalle), compradores (lista/detalle), bodegas (lista/detalle), catálogo (lista/detalle), inventario, movimientos, pedidos (lista/detalle), pagos y reportes. El alta de vendedores se movió a `/admin/sellers/new`; `/admin/sellers` es ahora la lista. Se reutilizan `seller-shell`, tablas, badges, paginación y estados de carga/vacío/error; no se introdujo un sistema de diseño nuevo.
- OpenAPI `0.7.0`: 68 rutas, 76 operaciones y 904 referencias; esquemas y rutas admin cubiertos por la prueba de contrato.
- Seed demo: `admin@nexusmarket.demo` (`ADMINISTRADOR`, `ACTIVO`).

### Evidencia ejecutada

| Comprobación | Resultado |
|---|---|
| `backend`: `npm run verify` | OK; 20 archivos / 160 pruebas; OpenAPI 68/76/904; build OK |
| `backend`: `npm run test:postgres` | 8 archivos / 40 pruebas OK contra PostgreSQL 17.11 |
| `backend`: pruebas admin | `admin.test.ts` (5), `admin-http.test.ts` (10), `admin-postgres.test.ts` (3) |
| `backend`: guarda de método | `GET` anónimo → `401`; `POST`/`PATCH`/`DELETE` fuera de las altas → `405` con `Allow` |
| `backend`: alta atómica de vendedor | Conservada; rollback por fallo de bodega sigue probado |
| `frontend`: `npm run typecheck` / `npm run build` | OK; 49 rutas (20 admin) |
| `frontend`: `npm run test:e2e` | 7/7 PASS; la suite admin verifica redirección anónima, aislamiento de rol, dashboard, listas y detalles, ruta de alta y guarda `405` |

### Límites declarados

- Reportes: solo agregados directos y reales. No hay catálogo, fórmulas, filtros ni límites aprobados (`L-19`); no se implementan exportaciones PDF/Excel/CSV sin contrato.
- Devoluciones, reembolsos y facturación: `BLOQUEADO`; no existen tablas de persistencia. No se crean pantallas vacías; la ausencia se documenta.
- El administrador no modifica productos, inventario, pedidos, pagos, roles, vendedores ni bodegas desde este espacio. Las únicas escrituras admin son las dos altas existentes.
- Autoregistro público de comprador y solicitud comprador → vendedor: diferidos a la siguiente fase; solo se documenta la dependencia.
- Lint sigue `BLOCKED` y CI sigue `READY_FOR_REVIEW`.

---

## 13. Gate L — CI y validación OpenAPI

### Implementado

- `backend/scripts/validate-openapi.ts`: valida sintaxis YAML, versión 3.1.x, rutas, `operationId` únicos, respuestas, parámetros de ruta, seguridad y resolución de `$ref`; corre offline con la dependencia `yaml` existente.
- `npm run validate:openapi` integrado en `npm run verify`.
- `.github/workflows/ci.yml` con cinco jobs:
  1. Backend lint + formato + typecheck + OpenAPI + build.
  2. Backend pruebas unitarias e integración.
  3. PostgreSQL 17: migraciones + pruebas.
  4. Frontend lint + typecheck + build.
  5. Frontend E2E Playwright contra PostgreSQL, backend y frontend reales (Chromium).

### Evidencia y límite

- `npm run validate:openapi` → `OpenAPI válido: 74 rutas, 83 operaciones, 984 referencias.` (versión `0.8.0`)
- YAML del workflow parseado correctamente: 5 jobs (`backend-static`, `backend-tests`, `backend-postgres`, `frontend`, `frontend-e2e`).
- `npm run db:migrate` es idempotente y aplicó `009` sobre la base demo.
- **No hay evidencia de ejecución en GitHub Actions** en este corte. El gate queda `READY_FOR_REVIEW`, no `PASS`. Los comandos equivalentes sí se ejecutaron localmente: lint, formato, typecheck, 187 pruebas backend, 46 PostgreSQL, build y E2E 10/10.

---

## 14. Gate M — Lint y formato

### Implementado

- **Backend:** ESLint 10 con `@eslint/js`, `typescript-eslint` y `globals`; configuración plana en `backend/eslint.config.mjs`. Prettier 3 con `.prettierrc.json` (`trailingComma: none`, `endOfLine: auto`) y `.prettierignore`.
- **Frontend:** ESLint 10 con `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks` y `@next/eslint-plugin-next` (reglas `recommended` y `core-web-vitals`) en `frontend/eslint.config.mjs`.
- Scripts: `npm run lint` en ambos proyectos; `npm run format` y `npm run format:check` en backend. `npm run verify` del backend incluye lint, formato, typecheck, pruebas, OpenAPI y build.
- Los dos avisos del frontend son `@next/next/no-img-element` en imágenes ya existentes; no son errores y no bloquean la build.

### Evidencia

| Comprobación | Resultado |
|---|---|
| `backend`: `npm run lint` | 0 errores |
| `backend`: `npm run format:check` | Todos los archivos cumplen Prettier |
| `frontend`: `npm run lint` | 0 errores, 2 avisos `no-img-element` |

No se declara el CI remoto como `PASS`; el gate L sigue `READY_FOR_REVIEW`.

---

## 15. Lo que no se declara terminado

| Capacidad | Estado real |
|---|---|
| Reembolsos y logística inversa | No implementados (fuera de alcance de esta etapa) |
| Resolución de pagos `DESCONOCIDO` | Queda pendiente; no se trata como éxito ni rechazo |
| Subida binaria de imágenes | `BLOQUEADO`: sin proveedor, mecanismo ni límites aprobados; se usan URLs persistentes |
| Ajustes negativos / movimientos logísticos del vendedor | `BLOQUEADO`: sin autorización explícita en la matriz §19 |
| Preparación, empaque y despacho del vendedor | `NO_APLICA`: reservado a logística; pedidos de solo lectura |
| Asignación automática de pedidos | `BLOQUEADO` (`L-23`): sin política aprobada |
| Transportistas externos, tracking integrado y evidencia del proveedor | `BLOQUEADO` (`L-23`): solo datos opcionales aportados por el operador |
| Cierre de pedido `ENTREGADO → CERRADO` (`CloseOrder`) | `BLOQUEADO`: sin actor ni proceso definido; el flujo termina en `ENTREGADO` |
| Recurso de entrega digital (`PUB-06`) | Pendiente: el SDD no define su estructura |
| Reportes administrativos del supervisor | `BLOQUEADO` (`L-19`): sin catálogo, fórmulas, filtros ni límites aprobados |
| Reportes del administrador | Solo agregados reales directos; catálogo/fórmulas/filtros/exportaciones `BLOQUEADO` (`L-19`) |
| Devoluciones, reembolsos y facturación | `BLOQUEADO`: sin tablas de persistencia ni reglas aprobadas |
| Autoregistro público de comprador | `IMPLEMENTED` (Gate R): `POST /api/v1/buyers` reutilizado; rol `COMPRADOR` fijado por el backend |
| Solicitud comprador → vendedor | `IMPLEMENTED` (Gate R): envío, consulta propia, aprobación atómica y rechazo |
| Reenvío o edición tras rechazo | Pendiente de decisión; el backend solo impide más de una solicitud `PENDIENTE` y la UI no ofrece reenvío |
| Mutaciones admin de producto/inventario/pago/reembolso | No definidas ni autorizadas; el espacio admin es de consulta salvo las dos altas |
| Variantes comerciales | Fuera de V1 por decisión (discrepancia con `CAT-02` registrada) |
| Recuperación de contraseña / MFA | No implementado |
| CI ejecutado en GitHub | `READY_FOR_REVIEW`; workflow de 5 jobs válido, no ejecutado en remoto |
| Lint y formato | `PASS` local: ESLint en ambos proyectos y Prettier en backend |
| Despliegue / producción | No realizado |

---

## 16. Gate R — Identidad y onboarding (`GATE-V2-IDENTITY`)

### Alcance implementado

- **Registro público de comprador:** se reutiliza `RegisterBuyer` y `POST /api/v1/buyers`. El cuerpo no acepta `rol` ni `estado`; el backend asigna `COMPRADOR` y `ACTIVO`. La creación de `users`, `buyers`, `carts`, dirección principal, auditoría y outbox sigue siendo transaccional. El frontend añade `/register` con validación, estado de carga, prevención de doble envío y aviso en `/login`.
- **Solicitud comprador → vendedor:** nueva entidad `seller_applications` (migración `009`) con estados `PENDIENTE`, `APROBADA` y `RECHAZADA`, independiente del estado de acceso. Un índice único parcial impide más de una solicitud `PENDIENTE` por usuario.
- **API de solicitudes:**
  - `POST /api/v1/buyer/seller-application` (comprador `ACTIVO`): crea la solicitud `PENDIENTE`.
  - `GET /api/v1/buyer/seller-application`: devuelve solo la solicitud del solicitante.
  - `GET /api/v1/admin/seller-applications` y `GET /api/v1/admin/seller-applications/{applicationId}`: listado con filtros/paginación y detalle.
  - `POST /api/v1/admin/seller-applications/{applicationId}/approve`: crea `sellers` + primera `warehouses`, cambia el rol principal a `VENDEDOR`, marca `APROBADA`, registra revisor, auditoría y outbox en una única transacción PostgreSQL. Un reintento devuelve los identificadores existentes sin duplicar.
  - `POST /api/v1/admin/seller-applications/{applicationId}/reject`: exige motivo, marca `RECHAZADA`, registra revisor y auditoría; no crea vendedor ni bodega y no cambia el estado de acceso.
- **Identidad:** se conserva el mismo `users.id`. El perfil `buyers` y el historial de pedidos no se eliminan. El rol principal vigente (`VENDEDOR`) gobierna las autorizaciones; conservar el perfil de comprador no concede permisos de comprador.
- **Estados de acceso:** `UpdateUserAccessStatus` implementa `ACTIVO`, `INACTIVO` y `BLOQUEADO` con transiciones explícitas (`ACTIVO→INACTIVO`, `ACTIVO→BLOQUEADO`, `INACTIVO→ACTIVO`, `BLOQUEADO→ACTIVO`, `INACTIVO→BLOQUEADO`; `BLOQUEADO→INACTIVO` prohibida). `DESACTIVAR` y `BLOQUEAR` exigen motivo. Al pasar a `INACTIVO` o `BLOQUEADO` se revocan las sesiones activas en la misma transacción; `GetSession` ya rechaza estados distintos de `ACTIVO`. Un administrador no puede cambiar su propio estado.
- **Autorización:** todas las decisiones se aplican en el backend (`requireAdmin`, `requireBuyer`, ownership por `usuarioId`). El administrador no puede aprobar ni rechazar su propia solicitud. El frontend solo refleja el resultado y oculta acciones no permitidas como ayuda visual.
- **Frontend:** `/seller-application` (formulario, estado, resultado y enlace al espacio del vendedor), `/admin/seller-applications` (lista con búsqueda, filtro y paginación) y `/admin/seller-applications/{applicationId}` (detalle, aprobación y rechazo con confirmación). El detalle admin de usuario incorpora el formulario de estado de acceso; el autogestión se bloquea también en la interfaz.
- **OpenAPI `0.8.0`:** 74 rutas, 83 operaciones y 984 referencias.

### Evidencia ejecutada

| Comprobación | Resultado |
|---|---|
| `backend`: `npm run verify` | OK; lint, formato, typecheck, 23 archivos / 187 pruebas, OpenAPI 74/83/984 y build |
| `backend`: `npm run test:postgres` | 9 archivos / 46 pruebas OK contra PostgreSQL 17.11 |
| `backend`: pruebas nuevas | `seller-applications.test.ts` (9), `update-user-access-status.test.ts` (7), `seller-applications-http.test.ts` (11), `seller-applications-postgres.test.ts` (6) |
| `backend`: migración `009` | Aplicada sobre la base demo; índice único parcial de solicitud pendiente verificado |
| `frontend`: `npm run lint` / `npm run typecheck` / `npm run build` | OK; 0 errores de lint; 56 rutas |
| `frontend`: `npm run test:e2e` | 10/10 PASS; los 3 escenarios nuevos cubren registro → solicitud → aprobación → acceso vendedor, rechazo sin efectos y cambio de estado con revocación de sesión |

### Decisiones y límites

- La aprobación solo es válida desde `PENDIENTE`; un reintento sobre `APROBADA` devuelve el vendedor y la bodega existentes. El rechazo desde `RECHAZADA` es idempotente; desde `APROBADA` se rechaza.
- Una transición de acceso inválida responde `422 REGLA_NEGOCIO_INCUMPLIDA` con `detalles.transicionInvalida`; no se añadió un código de error nuevo.
- El reenvío o la edición después de un rechazo **no están definidos**. El backend solo impide solicitudes `PENDIENTE` duplicadas y la interfaz no ofrece reenvío. Queda registrado como decisión pendiente.
- No se implementaron notificaciones externas ni correo: no existe infraestructura aprobada. El resultado se consulta dentro de la aplicación.
- No se crearon cuentas duplicadas, vendedores por autoregistro, comisiones, datos bancarios, tributarios o empresariales.

---

## 17. Próxima acción

1. Ejecutar el workflow de CI en GitHub y registrar el resultado real; los cinco jobs están definidos y sus comandos equivalentes ya pasaron localmente.
2. Decidir la política de reenvío/edición de solicitudes rechazadas antes de habilitarla; no inventar el comportamiento.
3. Decidir el actor y el proceso de `CloseOrder` (`ENTREGADO → CERRADO`) antes de implementar el cierre; no inventar un actor.
4. Decidir e implementar la resolución de pagos `DESCONOCIDO` (consulta/reconciliación) antes de considerar completo el flujo de pagos.
5. Definir con negocio el catálogo de reportes (`L-19`): métricas, fórmulas, filtros, límites y exportaciones. Hasta entonces, el espacio admin solo muestra agregados reales.
6. Definir con negocio el mecanismo de almacenamiento de imágenes y la estructura de entrega digital antes de ampliar el vendedor.
7. No declarar reembolsos ni logística inversa hasta que exista decisión de negocio, persistencia y contrato; mantener bloqueadas la asignación automática, los transportistas externos, el tracking integrado y la evidencia del proveedor (`L-23`).
