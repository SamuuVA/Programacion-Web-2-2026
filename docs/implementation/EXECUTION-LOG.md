# NexusMarket — Registro de ejecución

**Corte:** 2026-11-09
**Sesiones:** S-006 (cierre de `PI-01` y catálogo), S-007 (marketplace funcional), S-009 (espacio de trabajo del vendedor), S-012 (operación logística), S-013 (supervisión de solo lectura), S-014 (administración) y S-015 (identidad y onboarding)
**Regla:** solo se registran comandos ejecutados y resultados observados. Lo no ejecutado se declara como tal.

---

## 1. Entorno de ejecución

| Elemento | Valor observado |
|---|---|
| Sistema | Windows (PowerShell) |
| Node.js | 24.x (fijado en `engines`) |
| Backend | Fastify 5, TypeScript 5.9, Zod 4, Vitest 5, `pg`, `@node-rs/argon2` |
| Frontend | Next.js 16.4.3, React 19.3.1 |
| PostgreSQL | 17.11 en Docker (`nexusmarket-postgres`, healthy, puerto 5432) |
| Backend dev | `http://127.0.0.1:3000` |
| Frontend prod | `http://127.0.0.1:3001` |
| Base de prueba | `nexusmarket_test` |
| Rama | `entrega-1-catalogo` |
| Commit HEAD al iniciar | `90e2c70` (`actualizacion 2026113`) |
| Árbol | cambios sin commit (backend, frontend y documentación; trabajo del vendedor, logística y supervisión) |
| E2E | Playwright con Microsoft Edge del sistema, frontend en `127.0.0.1:3001` |

---

## 2. Línea de tiempo (iteración 1, S-006)

> Los resultados de esta sección corresponden al corte 2026-11-01 y se conservan como histórico. El estado vigente está en la sección 4 (iteración 2) y en `IMPLEMENTATION-STATUS.md`.

### 2.1 Diagnóstico inicial

1. Se inspeccionó el backend existente y se confirmó que el stack real es TypeScript/Node.js + Fastify + PostgreSQL, no Go.
2. Se localizó `memory-buyer-registration-store.ts` y la bandera `PERSISTENCE` como ruta de pérdida de datos.
3. Se levantó PostgreSQL con `docker compose up -d` y se comprobó el estado `healthy`.
4. Se aplicaron las migraciones existentes y se creó `nexusmarket_test`.

### 2.2 Gate A — persistencia real

Comandos ejecutados desde `backend/`:

```powershell
npm run typecheck
npm test
npm run build
$env:TEST_DATABASE_URL = "postgresql://nexusmarket:nexusmarket@127.0.0.1:5432/nexusmarket_test"
npm run test:postgres
```

Resultados:

| Comando | Resultado |
|---|---|
| `npm run typecheck` | OK |
| `npm test` | 8 archivos, 51 pruebas aprobadas |
| `npm run build` | OK |
| `npm run test:postgres` | 3 archivos, 11 pruebas aprobadas |

Prueba de reinicio real:

1. `POST /api/v1/buyers` → `201`.
2. Se detuvo y reinició el servidor.
3. `SELECT count(*) FROM users WHERE ...` → `1`.

Conclusión: el comprador sobrevive al reinicio; no queda un modo en memoria en `src/`.

### 2.3 Gate B — catálogo backend

1. Se creó `backend/migrations/003_catalog.sql` con `sellers`, `warehouses`, `products`, `product_images` e `inventory`.
2. Se implementaron dominio, puerto `CatalogQueryRepository`, caso de uso `QueryCatalog`, adaptador PostgreSQL y rutas HTTP.
3. Se conectó el catálogo en `app.ts`, `server.ts` y `factory.ts`.
4. Se ejecutó el seed demo:

```powershell
npm run db:seed:demo
```

Conteos verificados en PostgreSQL:

| Tabla | Filas |
|---|---:|
| `products` publicados | 8 |
| `sellers` | 2 |
| `product_images` | 8 |
| `inventory` | 6 |

5. Se verificó la búsqueda sin acentos: `search=lampara` devuelve “Lámpara Nido”.
6. Se corrigió el bug de `imagenPrincipal` en el detalle.

### 2.4 Gate C — contrato OpenAPI

1. `backend/openapi.yaml` se actualizó a `info.version: 0.2.0`.
2. Se declararon las rutas de productos, detalle y categorías, sus esquemas y `RECURSO_NO_ENCONTRADO`.
3. Se amplió `tests/contract/openapi.test.ts` a 5 pruebas.
4. `npm test` volvió a pasar con 51 pruebas.

### 2.5 Gate D — frontend Next.js

1. Se creó `frontend/` con App Router, TypeScript y CSS propio.
2. Se implementaron layout, header, footer, iconos, badges, precio, paginación, tarjetas, filtros, galería, home, catálogo y detalle.
3. Se crearon 8 SVG en `frontend/public/products/` alineados con el seed.
4. Se instalaron dependencias y se verificó:

```powershell
cd frontend
npm install
npm run typecheck
npm run build
```

| Comando | Resultado |
|---|---|
| `npm install` | OK (tras liberar espacio en disco) |
| `npm run typecheck` | OK |
| `npm run build` | OK |

5. Se levantó el frontend de producción:

```powershell
npm run start -- -p 3001
```

### 2.6 Smoke end-to-end contra API y PostgreSQL reales

| Comprobación | Resultado observado |
|---|---|
| Home `GET /` | `200`, 8 tarjetas |
| Catálogo `GET /products` | `200`, 6 tarjetas, enlace a página 2 |
| Catálogo página 2 | `200`, 2 tarjetas, página actual marcada |
| Búsqueda `lampara` | `200`, 1 resultado |
| Categoría `DIGITAL` | `200`, 2 resultados |
| Orden `precio_asc` | `200`, primer resultado: Guía de finanzas |
| Detalle `GET /products/40000000-...-0001` | `200`, SKU `AUR-AUD-001` |
| Producto inexistente | `404` con UI de no encontrado |
| ID malformado | Tratado como no encontrado, sin `400` visible |
| Imágenes SVG | 8 de 8 responden `200` |

### 2.7 Gate E — documentación

Se crearon:

- `docs/implementation/REPOSITORY-BASELINE.md`
- `docs/implementation/IMPLEMENTATION-PLAN.md`
- `docs/implementation/IMPLEMENTATION-STATUS.md`
- `docs/implementation/BACKEND-FRONTEND-DEPENDENCIES.md`
- `docs/implementation/API-CONTRACT-STATUS.md`
- `docs/implementation/DECISIONS-LOG.md`
- `docs/implementation/EXECUTION-LOG.md`

Se actualizaron `backend/README.md`, `README.md`, `orchestrator-state.md` y notas históricas sobre el adaptador en memoria.

---

## 3. Comandos consolidados (iteración 1, histórico)

### Backend

```powershell
cd backend
npm run typecheck
npm test
npm run build
$env:TEST_DATABASE_URL = "postgresql://nexusmarket:nexusmarket@127.0.0.1:5432/nexusmarket_test"
npm run test:postgres
```

| Suite | Archivos | Pruebas |
|---|---:|---:|
| `npm test` | 8 | 51 |
| `npm run test:postgres` | 3 | 11 |

Desglose de `npm test`:

| Archivo | Pruebas |
|---|---:|
| `tests/unit/value-objects.test.ts` | 4 |
| `tests/unit/register-buyer.test.ts` | 5 |
| `tests/unit/argon2-password-hasher.test.ts` | 1 |
| `tests/unit/config.test.ts` | 5 |
| `tests/unit/persistence-architecture.test.ts` | 2 |
| `tests/integration/register-buyer-http.test.ts` | 19 |
| `tests/integration/catalog-http.test.ts` | 10 |
| `tests/contract/openapi.test.ts` | 5 |

Desglose de `npm run test:postgres`:

| Archivo | Pruebas |
|---|---:|
| `tests/postgres/register-buyer-postgres.test.ts` | 3 |
| `tests/postgres/migrations-postgres.test.ts` | 2 |
| `tests/postgres/catalog-query-postgres.test.ts` | 6 |

### Frontend

```powershell
cd frontend
npm run typecheck
npm run build
npm run start -- -p 3001
```

### PostgreSQL

```powershell
docker compose up -d
docker compose ps
cd backend
npm run db:migrate
npm run db:seed:demo
```

---

## 4. Iteración 2 — marketplace funcional (S-007)

### 4.1 Alcance implementado

1. Migraciones `004_identity_sessions.sql`, `005_buyer_addresses.sql` y `006_cart_checkout.sql`, aplicadas a la base de desarrollo.
2. Autenticación: `IdentityStore`, `LoginUser`, `GetSession`, `LogoutUser`, `PostgresIdentityStore`, `SessionAuthenticator`; rutas `/auth/login`, `/auth/logout`, `/auth/session`.
3. Direcciones: dominio `DireccionEntrega`, `AddressStore`, CRUD y principal, `PostgresAddressStore`, rutas `/buyers/me/addresses`.
4. Vendedores: `RegisterSeller`, `PostgresSellerRegistrationStore`, `POST /admin/sellers` con transacción atómica y rollback.
5. Carrito: dominio `Carrito`, `CartStore`, casos de uso y `PostgresCartStore`, rutas `/cart` y `/cart/items`.
6. Checkout y pedidos: `Checkout`, `ListOrders`, `GetOrder`, `PostgresCheckoutStore`; idempotencia, reservas, pago simulado y snapshot de dirección.
7. Frontend: login/logout, carrito, checkout, pedidos, direcciones, admin de vendedores, add-to-cart, cabecera con rol y estados de carga/error/vacío/éxito.
8. CI: validador OpenAPI offline y workflow de cuatro jobs.

### 4.2 Comandos y resultados

Desde `backend/`:

```powershell
npm run verify
$env:TEST_DATABASE_URL = "postgresql://nexusmarket:nexusmarket@127.0.0.1:5432/nexusmarket_test"
npm run test:postgres
```

| Comando | Resultado observado |
|---|---|
| `npm run typecheck` | OK |
| `npm test` | 12 archivos, 92 pruebas aprobadas |
| `npm run validate:openapi` | `OpenAPI válido: 19 rutas, 22 operaciones, 237 referencias.` |
| `npm run build` | OK |
| `npm run verify` | OK (secuencia completa) |
| `npm run test:postgres` | 4 archivos, 21 pruebas aprobadas |
| `npm run db:migrate` (test DB) | `No había migraciones pendientes.` |

Desde `frontend/`:

```powershell
npm run typecheck
npm run build
```

| Comando | Resultado observado |
|---|---|
| `npm run typecheck` | OK |
| `npm run build` | OK (Next.js 16.4.3, 11 rutas) |

### 4.3 Smoke HTTP del frontend

Script reproducible con sesiones reales del backend y `curl` para conservar cookies:

| Comprobación | Resultado |
|---|---|
| Home anónimo | PASS, `200` |
| Login | PASS, `200` |
| Guarda anónima de carrito | PASS, redirección a `/login?redirect=%2Fcart` |
| Guarda anónima de admin | PASS, redirección a `/login?redirect=%2Fadmin%2Fsellers` |
| Carrito de comprador | PASS, `200` con líneas |
| Pedidos de comprador | PASS, `200` con tarjetas |
| Direcciones de comprador | PASS, `200` con formulario y principal |
| Checkout de comprador | PASS, `200` con formulario y selector de pago |
| Admin con rol comprador | PASS, redirección a `/` |
| Página admin con rol administrador | PASS, `200` con formulario |
| Login con sesión activa | PASS, redirección a `/` |
| Detalle de producto con add-to-cart | PASS |
| Aviso anónimo en detalle | PASS |
| ID de producto malformado | PASS, `404` |
| ID de pedido malformado | PASS, `404` |

**Total: 15/15 PASS.**

### 4.4 E2E de navegador real (Chrome CDP)

Flujo completo ejecutado en Chrome headless contra el frontend de producción:

| Paso | Resultado |
|---|---|
| Login de comprador | PASS |
| Agregar producto al carrito (cantidad 2) | PASS |
| Actualizar cantidad a 3 | PASS |
| Checkout con pago confirmado | PASS |
| Ver detalle del pedido | PASS |
| Crear dirección | PASS |
| Marcar dirección como principal | PASS |
| Eliminar dirección | PASS |
| Logout | PASS |
| Login de administrador | PASS |
| Registrar vendedor + primera bodega | PASS |
| Logout de administrador | PASS |
| Sin errores de consola | PASS |

**Total: 13/13 PASS.**

### 4.5 Incidencias y mitigaciones de la iteración 2

| Incidencia | Efecto | Mitigación |
|---|---|---|
| `ApiError` importado desde `client.ts` arrastraba `server-only` a componentes cliente | Build fallaba | Se movió a `lib/api/errors.ts` neutral |
| Checkout exitoso redirigía a `/cart` al revalidar con carrito vacío | El resultado de éxito desaparecía | Se eliminó la redirección; el formulario muestra estado vacío y conserva el resultado |
| `loading.tsx` en `orders` convertía el detalle malformado en soft-404 (`200`) | 404 no real | Se acotó la frontera de carga a `orders/(list)` y se eliminó del detalle |
| Servidor de Next.js obsoleto seguía en el puerto 3001 | Pruebas contra build viejo | Se terminaron todos los procesos del puerto antes de reiniciar |
| Validador OpenAPI no resolvía `$ref` en parámetros y respuestas | Falsos positivos | Se añadió `dereference()` para `$ref` locales |
| El script de smoke usaba `$home`, variable reservada de PowerShell | Fallo del script | Se renombró a `$homePage` |
| Codificación de acentos en PowerShell | Falsos negativos en aserciones | Se usaron marcadores ASCII/clases CSS y lectura UTF-8 explícita |
| Fixtures PostgreSQL reutilizaban correo/SKU | Violaciones de unicidad | Se usaron identificadores por fixture |

### 4.6 Documentación actualizada

- `docs/implementation/IMPLEMENTATION-STATUS.md`
- `docs/implementation/IMPLEMENTATION-PLAN.md`
- `docs/implementation/BACKEND-FRONTEND-DEPENDENCIES.md`
- `docs/implementation/API-CONTRACT-STATUS.md`
- `docs/implementation/DECISIONS-LOG.md`
- `docs/implementation/EXECUTION-LOG.md`
- `docs/backend/implementation/03-pi02-evaluation.md` (nota de resolución)

---

## 5. Iteración 3 — espacio de trabajo del vendedor (S-009)

### 5.1 Alcance implementado

1. Migración `007_seller_workspace.sql`: estado `BORRADOR` en `products.estado`, tabla `inventory_movements` y índices por vendedor.
2. Dominio del vendedor: `producto-vendedor.ts` (estados y transiciones aprobadas) e `inventario-vendedor.ts` (invariantes de ingreso).
3. Aplicación: puertos y casos de uso para perfil, productos, imágenes, bodegas, inventario y pedidos.
4. Infraestructura PostgreSQL: `PostgresSellerWorkspaceStore` con transacciones, bloqueo asesor e idempotencia de ingresos.
5. HTTP: 18 rutas `/api/v1/seller/*`; autorización por sesión y ownership derivado del `sellerId`; acceso cruzado `404`.
6. Frontend: layout protegido `/seller`, inicio, perfil, productos, alta/edición, imágenes, bodegas, inventario y pedidos, con estados de carga/vacío/error/validación/denegado/no encontrado.
7. OpenAPI `0.4.0` con las rutas y esquemas del vendedor.
8. Pruebas: unidad, integración HTTP, PostgreSQL, contrato, smoke HTTP y E2E Playwright.

### 5.2 Comandos y resultados

Desde `backend/`:

```powershell
npm run verify
$env:TEST_DATABASE_URL = "postgresql://nexusmarket:nexusmarket@127.0.0.1:5432/nexusmarket_test"
npm run test:postgres
$env:API_URL = "http://127.0.0.1:3000"
npm run smoke:seller
```

| Comando | Resultado observado |
|---|---|
| `npm run typecheck` | OK |
| `npm test` | 14 archivos, 110 pruebas aprobadas |
| `npm run validate:openapi` | `OpenAPI válido: 33 rutas, 40 operaciones, 419 referencias.` |
| `npm run build` | OK |
| `npm run verify` | OK (secuencia completa) |
| `npm run test:postgres` | 5 archivos, 28 pruebas aprobadas |
| `npm run smoke:seller` | 33/33 comprobaciones PASS |

Desde `frontend/`:

```powershell
npm run typecheck
npm run build
npm run test:e2e
```

| Comando | Resultado observado |
|---|---|
| `npm run typecheck` | OK |
| `npm run build` | OK (Next.js 16.4.3, 18 rutas) |
| `npm run test:e2e` | 4/4 PASS (incluye el recorrido cruzado) |

### 5.3 Smoke HTTP del vendedor (33 comprobaciones)

Cubre, contra la API real y PostgreSQL:

- Sesión `VENDEDOR` con `sellerId` propio.
- Perfil: lectura y actualización acotada.
- Rechazo `403` de un comprador en rutas de vendedor.
- Bodegas propias.
- Alta de producto en `BORRADOR`, propietario derivado de la sesión.
- Publicación rechazada sin imagen (`422`) y aceptada con imagen.
- Producto publicado visible en el catálogo público.
- Acceso de otro vendedor `404` (sin filtrar existencia).
- Ingreso de stock `201`, suma de unidades e idempotencia en el reintento.
- Suspensión y descontinuación con las transiciones aprobadas.
- Consulta de pedidos con productos propios.

### 5.4 E2E de navegador (Playwright + Microsoft Edge)

| Prueba | Resultado |
|---|---|
| Protección de `/seller` para anónimos y compradores | PASS |
| Recorrido completo: alta, imagen, publicación, ingreso, pedidos y estados | PASS |
| Aislamiento entre vendedores cambiando el identificador | PASS |
| Recorrido cruzado: admin registra vendedor → vendedor publica con stock → comprador compra con pago simulado → vendedor ve el pedido | PASS |

**Total: 4/4 PASS**, con `timeout` de 120 s (240 s para el recorrido cruzado) y `expect` de 15 s. El recorrido cruzado usa contextos de navegador independientes por rol y no simula pagos ni logística: usa el checkout y el pago simulado existentes.

### 5.4.1 Continuación S-010 (2026-11-04)

- Se agregó `frontend/e2e/cross-role.spec.ts` para cubrir la integración real entre roles, que era el hueco declarado del corte anterior.
- El test crea un vendedor y su bodega desde el formulario administrativo, inicia sesión con esas credenciales, publica un producto físico con imagen y stock, y compra ese producto como comprador demo.
- El vendedor consulta el pedido en `/seller/orders`, abre el detalle y verifica producto, SKU y ausencia de acciones de pago/logística.
- Resultado: `npx playwright test e2e/cross-role.spec.ts` → 1/1 PASS; suite completa → 4/4 PASS.
- Incidencias corregidas: aserciones ambiguas por coincidencia parcial de `heading`/`getByText`; se usaron `exact` y `.first()` donde el DOM repite el nombre.

### 5.5 Incidencias y mitigaciones de la iteración 3

| Incidencia | Efecto | Mitigación |
|---|---|---|
| Un ingreso devolvió `503` de forma intermitente | Fallo no reproducible en ejecuciones posteriores | Se añadió registro servidor de errores de aplicación 5xx (`request.log.error`) para diagnosticar; el cliente sigue sin recibir detalles internos |
| La clave de idempotencia se derivaba de `useId` | Se repetía entre cargas y el backend deduplicaba ingresos nuevos | Se genera `crypto.randomUUID()` tras montar; el botón queda deshabilitado hasta tener la clave |
| `submitAction` capturaba la URL antes de terminar la navegación | Timeout en el E2E de alta/edición | Se espera el `heading` del detalle y se acepta cualquier POST del mismo origen |
| El login del E2E no esperaba a salir de `/login` | La siguiente navegación usaba una sesión aún no disponible | Se espera a que la URL deje de ser `/login` |
| Playwright no encontraba Chromium instalado | E2E no arrancaba | Se usa el canal `msedge` del sistema |
| El test de migraciones no conocía `007` | Falso negativo de esquema | Se actualizó la aserción a `inventory_movements` y al estado `BORRADOR` |

### 5.6 Documentación actualizada

- `docs/implementation/IMPLEMENTATION-STATUS.md`
- `docs/implementation/EXECUTION-LOG.md`
- `docs/implementation/DECISIONS-LOG.md`
- `orchestrator-state.md`

### 5.6.1 Corrección de imágenes (2026-11-04)

- **Síntoma:** el catálogo mostraba imágenes rotas o “desaparecidas”.
- **Causa:** los productos creados por las pruebas E2E y por `seller-smoke.ts` referenciaban `/products/aurora-lampara.svg` y `/products/smoke.svg`, archivos que no existen en `frontend/public/products`. Eran 19 registros de `product_images`.
- **Corrección:**
  - `seller.spec.ts`, `cross-role.spec.ts` y `seller-smoke.ts` ahora usan `/products/lampara-nido.svg`, que sí existe.
  - Se actualizaron las 19 referencias dañadas en PostgreSQL a una URL válida.
  - Se agregó `ProductImage`, un componente cliente que muestra el placeholder “NM” cuando la URL falla, en lugar de un icono roto.
  - Se agregó el activo `frontend/public/products/casa-luna-tazas.svg` para el producto de demostración de Casa Luna.
- **Verificación:** las 8 URLs distintas de `product_images` tienen archivo en `frontend/public/products`; `GET /products/casa-luna-tazas.svg` responde `200 image/svg+xml`; detalle y catálogo responden `200` con el producto visible; smoke 33/33; E2E 4/4; typecheck y build OK.
- **Nota:** no se eliminaron productos de prueba; solo se corrigieron sus referencias de imagen.

### 5.7 Límites de la iteración

- Carga binaria de imágenes: `BLOQUEADO` (sin mecanismo/proveedor/límites aprobados); se usan URLs persistentes.
- Ajustes negativos y movimientos logísticos: no autorizados para el vendedor; solo `INGRESO`.
- Preparación/despacho: reservados a logística; pedidos de solo lectura.
- Entrega digital (`PUB-06`): estructura no definida por el SDD; no modelada.
- Variantes: fuera de V1 por decisión; discrepancia con `CAT-02` registrada.

---

## 6. Iteración 4 — operación logística (S-012)

**Fecha:** 2026-11-05
**Rama/commit:** `entrega-1-catalogo` / `90e2c70` (trabajo sin confirmar)

### Alcance implementado

- Migración `008_logistics.sql`: `logistics_operators`, `logistics_operator_warehouses`, `shipments`, `shipment_items`, `shipment_events`, `delivery_evidence`, `logistics_operations` y `order_status_history`; reservas `CONSUMIDA`; `orders.entregado_en`.
- Dominio logístico sin HTTP/SQL: estados del envío, precondiciones de preparación/despacho/entrega y normalización de evidencia.
- Casos de uso: perfil, bodegas, inventario, resumen, pedidos, detalle, preparación, despacho, entrega y alta administrativa de operadores.
- Adaptador PostgreSQL transaccional con ámbito por bodegas, bloqueos asesores, idempotencia persistente, consumo de reservas, movimiento `SALIDA_VENTA` e historial de estados.
- 9 rutas `/api/v1/logistics/*` más `POST /api/v1/admin/logistics-operators`; `requireLogistics()` exige rol y perfil activo.
- Frontend `/logistics`: resumen, pedidos, detalle operable, bodegas e inventario; guardas de servidor y Server Actions.
- Seed demo con `logistica@nexusmarket.demo` y asignación a las bodegas de Aurora y Nido.
- OpenAPI `0.5.0`: 43 rutas, 50 operaciones, 544 referencias.
- El checkout ahora escribe `order_status_history` para pago confirmado y rechazado.

### Evidencia ejecutada

| Comprobación | Resultado |
|---|---|
| `backend`: `npm run verify` | OK; 16 archivos / 131 pruebas; OpenAPI 43/50/544; build OK |
| `backend`: `npm run test:postgres` | 6 archivos / 34 pruebas OK |
| `backend`: `npm run smoke:seller` | 33/33 PASS (regresión) |
| `backend`: login real del operador demo | rol `OPERADOR_LOGISTICO`, estado `ACTIVO`, 2 bodegas |
| `frontend`: `npm run typecheck` / `npm run build` | OK; 22 rutas |
| `frontend`: `npm run test:e2e` | 5/5 PASS, incluido el flujo logístico completo |

### Decisiones

`DEC-V2-019`…`DEC-V2-026`: ámbito por bodegas, preparación con reservas, despacho con salida de inventario, entrega con evidencia, idempotencia por operador/tipo, historial con actor y referencia causal, frontend con guardas de servidor y límites explícitos.

### Límites

- Asignación automática, transportistas externos, tracking integrado y evidencia del proveedor: `BLOQUEADO` (`L-23`).
- `CloseOrder` (`ENTREGADO → CERRADO`): `BLOQUEADO`; sin actor ni proceso definido.
- Lint `BLOCKED`; CI `READY_FOR_REVIEW`.

---

## 7. Iteración 5 — supervisión de solo lectura (S-013)

**Fecha:** 2026-11-06
**Rama/commit:** `entrega-1-catalogo` / `90e2c70` (trabajo sin confirmar)

### Alcance implementado

- Sin migración nueva: se reutilizan las tablas, consultas y contratos existentes.
- Módulo `backend/src/modules/supervisor/`: puertos de solo lectura, 9 casos de uso, adaptador PostgreSQL con únicamente `SELECT` y 9 rutas `GET`.
- Guarda `SUP-01`: cualquier método distinto de `GET`/`HEAD`/`OPTIONS` bajo `/api/v1/supervisor/*` responde `405 METODO_NO_PERMITIDO` con `Allow: GET, HEAD`, antes de resolver la sesión.
- `requireSupervisor()` exige rol `SUPERVISOR` y usuario `ACTIVO`; `ADMINISTRADOR` no hereda el acceso.
- Dashboard con conteos directos de estados definidos y suma de inventario `on_hand - reserved - unavailable` (`INV-03`). Sin porcentajes, metas, SLA, rankings ni proyecciones.
- Privacidad: se omiten comprador, correo/documento del vendedor, dirección de entrega, identificadores de actor y referencia del proveedor de pago.
- Frontend `/supervisor`: resumen, pedidos (lista y detalle), productos (lista y detalle), almacenes, inventario, envíos y vendedores; sin formularios ni mutaciones.
- Enlace “Supervisión” en la cabecera solo para el rol `SUPERVISOR`.
- Seed demo: `supervisor@nexusmarket.demo` / `NexusMarketDemo2026!`.
- OpenAPI `0.6.0`: 52 rutas, 59 operaciones, 647 referencias.
- Reportes administrativos: no implementados (`L-19`); la interfaz muestra “No disponibles”.

### Evidencia ejecutada

| Comprobación | Resultado |
|---|---|
| `backend`: `npm run verify` | OK; 18 archivos / 145 pruebas; OpenAPI 52/59/647; build OK |
| `backend`: `npm run test:postgres` | 7 archivos / 37 pruebas OK |
| `backend`: pruebas de supervisión | `supervisor.test.ts` (5), `supervisor-http.test.ts` (9), `supervisor-postgres.test.ts` (3) |
| `backend`: guarda de método | `GET` anónimo → `401`; `POST` → `405` con `Allow: GET, HEAD` |
| `frontend`: `npm run typecheck` / `npm run build` | OK; 29 rutas |
| `frontend`: `npm run test:e2e` | 6/6 PASS, incluida la suite de supervisión |

### Incidencias corregidas

| Incidencia | Efecto | Mitigación |
|---|---|---|
| El E2E usaba `vendedor@nexusmarket.demo`, que no existe en el seed | Login del vendedor `401` y prueba detenida | Se usa `aurora@nexusmarket.demo` |
| La cuenta demo del supervisor no existía en la base | Login `401` | Se agregó al seed y se re-ejecutó `npm run db:seed:demo` |
| El listado de productos ordena por fecha y el producto demo no aparecía en la primera página | Falso negativo del E2E | Se navega al detalle por ID y se filtra inventario por bodega |
| El servidor en ejecución era anterior a la compilación del módulo | `404` en rutas del supervisor | Se reiniciaron backend y frontend tras el build |

### Límites

- Reportes administrativos: `BLOQUEADO` (`L-19`); sin catálogo, fórmulas, filtros ni límites.
- El supervisor no modifica precios, inventario, pedidos, pagos, vendedores, bodegas, roles ni logística.
- Lint `BLOCKED`; CI `READY_FOR_REVIEW`.

---

## 8. Iteración 6 — espacio administrativo (S-014)

**Fecha:** 2026-11-08
**Rama/commit:** `entrega-1-catalogo` / `90e2c70` (trabajo sin confirmar)

### Alcance implementado

- Sin migración nueva: se reutilizan las tablas, consultas y contratos existentes.
- Módulo `backend/src/modules/admin/`: puertos de solo lectura, casos de uso, adaptador PostgreSQL con únicamente `SELECT` y 17 rutas `GET`.
- Las altas existentes se preservan intactas: `POST /admin/sellers` (transacción atómica vendedor + primera bodega) y `POST /admin/logistics-operators`.
- Guarda de método: bajo `/api/v1/admin/*` solo se permiten `GET`/`HEAD`/`OPTIONS`, salvo `POST` en las dos altas; el resto responde `405 METODO_NO_PERMITIDO` con `Allow`.
- `requireAdmin()` exige rol `ADMINISTRADOR` y usuario `ACTIVO`; `SUPERVISOR` no hereda el acceso.
- Dashboard y reportes con agregados reales directos: conteos por estado, montos capturados y suma de inventario disponible. Sin porcentajes, metas, SLA, rankings, proyecciones, comisiones ni comparaciones temporales.
- Privacidad: se omiten `hash_credencial`, documentos, tokens, referencia del proveedor de pago, dirección completa y `actor_id`; el detalle de pedido solo expone `ciudad`, `region`, `pais` y `capturadoEn`.
- Frontend `/admin`: dashboard, usuarios, vendedores, compradores, bodegas, catálogo, inventario, movimientos, pedidos, pagos y reportes, con listas y detalles. El alta de vendedores se movió a `/admin/sellers/new`.
- Enlace “Administración” en la cabecera solo para el rol `ADMINISTRADOR`.
- OpenAPI `0.7.0`: 68 rutas, 76 operaciones, 904 referencias.

### Evidencia ejecutada

| Comprobación | Resultado |
|---|---|
| `backend`: `npm run verify` | OK; 20 archivos / 160 pruebas; OpenAPI 68/76/904; build OK |
| `backend`: `npm run test:postgres` | 8 archivos / 40 pruebas OK |
| `backend`: pruebas admin | `admin.test.ts` (5), `admin-http.test.ts` (10), `admin-postgres.test.ts` (3) |
| `backend`: guarda de método | `GET` anónimo → `401`; `POST`/`PATCH`/`DELETE` fuera de las altas → `405` |
| `frontend`: `npm run typecheck` / `npm run build` | OK; 49 rutas (20 admin) |
| `frontend`: `npm run test:e2e` | 7/7 PASS, incluida la suite administrativa |

### Incidencias corregidas

| Incidencia | Efecto | Mitigación |
|---|---|---|
| El producto demo quedaba fuera de la primera página del catálogo admin (38 productos) | Falso negativo del E2E | El E2E filtra por `?search=Audífonos Aurora` en catálogo e inventario |
| Playwright accedía por `127.0.0.1` mientras `next dev` se anunciaba en `localhost` | Next bloqueaba recursos de desarrollo y los formularios quedaban deshabilitados | Se agregó `allowedDevOrigins: ["127.0.0.1"]` y se verificó contra build de producción |
| `.next/dev` y `test-results` consumían espacio con ~3.7 GB libres | Riesgo de `ENOSPC` en builds | Se eliminaron artefactos de desarrollo antes del build final |

### Límites

- Reportes: solo agregados reales directos; catálogo, fórmulas, filtros y exportaciones `BLOQUEADO` (`L-19`).
- Devoluciones, reembolsos y facturación: `BLOQUEADO`; no hay tablas de persistencia.
- El administrador no modifica producto, inventario, pedido, pago, rol, vendedor ni bodega; solo ejecuta las dos altas existentes.
- Autoregistro público de comprador y solicitud comprador → vendedor: diferidos a la siguiente fase.
- Lint `BLOCKED`; CI `READY_FOR_REVIEW`.

---

## 9. Comandos consolidados (corte actual)

### Backend

```powershell
cd backend
npm run verify            # typecheck + test + validate:openapi + build
$env:TEST_DATABASE_URL = "postgresql://nexusmarket:nexusmarket@127.0.0.1:5432/nexusmarket_test"
npm run test:postgres
$env:API_URL = "http://127.0.0.1:3000"
npm run smoke:seller
```

| Suite | Archivos | Pruebas |
|---|---:|---:|
| `npm test` | 20 | 160 |
| `npm run test:postgres` | 8 | 40 |

### Frontend

```powershell
cd frontend
npm run typecheck
npm run build
npm run start -- -p 3001
npm run test:e2e
```

### PostgreSQL

```powershell
cd backend
docker compose up -d
docker compose ps
npm run db:migrate
npm run db:seed:demo
```

---

## 10. Incidencias de la iteración 1 (histórico)

| Incidencia | Efecto | Mitigación |
|---|---|---|
| Espacio libre bajo en `C:` (~1.15 GB) | `npm install`/build podían fallar con `ENOSPC` | Limpieza de caché npm, `CrashDumps` y `.next/cache` |
| Ejecutar suites backend en paralelo | Node agotó memoria (`OOM`) | Ejecutar `npm test` y `npm run test:postgres` de forma secuencial |
| `loading.tsx` en detalle devolvía `200` antes del `notFound()` | 404 no real | Route groups y eliminación del `loading.tsx` del detalle |
| IDs malformados producían `400` visible | Mala experiencia | `isProductId()` en el cliente; se tratan como no encontrados |
| El prompt mencionaba Go | Stack incorrecto | Se preservó TypeScript/Fastify; registrado en `DEC-V1-001` |

---

## 11. Lo que no se ejecutó

| Verificación | Estado |
|---|---|
| Lint (ESLint/Biome) | Resuelto en S-015: ESLint configurado en backend y frontend; Prettier en backend (ver §13) |
| CI en GitHub Actions | Workflow de 5 jobs creado y validado localmente; **no ejecutado en remoto** |
| Reconciliación de pagos `DESCONOCIDO` | No implementada |
| Reembolsos y logística inversa | No implementados (fuera de alcance) |
| Pruebas de carga o concurrencia masiva | No ejecutadas (sí se probó concurrencia e idempotencia funcional) |
| Subida binaria de imágenes | `BLOQUEADO`; solo referencias URL persistentes |
| Variantes comerciales | Fuera de V1 por decisión |
| Ajustes negativos / movimientos logísticos del vendedor | `BLOQUEADO`; solo `INGRESO` |
| Asignación automática de pedidos | `BLOQUEADO` (`L-23`) |
| Transportistas externos, tracking integrado y evidencia del proveedor | `BLOQUEADO` (`L-23`); solo datos opcionales del operador |
| Cierre `ENTREGADO → CERRADO` (`CloseOrder`) | `BLOQUEADO`; sin actor ni proceso definido |
| Entrega digital (`PUB-06`) | No modelada; estructura no definida en el SDD |
| Reportes administrativos del supervisor | `BLOQUEADO` (`L-19`); sin catálogo, fórmulas, filtros ni límites |
| Reportes del administrador | Solo agregados reales directos; catálogo, fórmulas, filtros y exportaciones `BLOQUEADO` (`L-19`) |
| Devoluciones, reembolsos y facturación | `BLOQUEADO`; sin tablas de persistencia ni reglas aprobadas |
| Mutaciones admin de producto/inventario/pago | No definidas ni autorizadas; espacio admin de consulta salvo las dos altas |
| Autoregistro público de comprador | Diferido a la siguiente fase |
| Solicitud comprador → vendedor | Diferida a la siguiente fase |
| Despliegue productivo | No realizado |

Estas ausencias no se compensan con afirmaciones: el estado correcto es “no ejecutado” o `BLOCKED`.

---

## 12. Reproducción mínima

1. `cd backend; docker compose up -d` (el `compose.yaml` vive en `backend/`).
2. `cd backend; npm install; Copy-Item .env.example .env; npm run db:migrate; npm run db:seed:demo; npm run dev`.
3. En otra terminal: `cd frontend; npm install; npm run dev -- -p 3001`.
4. Abrir `http://127.0.0.1:3001`.
5. Iniciar sesión con `comprador@nexusmarket.demo`, `admin@nexusmarket.demo`, `logistica@nexusmarket.demo` o `supervisor@nexusmarket.demo`; contraseña `NexusMarketDemo2026!`. El administrador abre `/admin`; el alta de vendedores vive en `/admin/sellers/new`.
6. Verificar `http://127.0.0.1:3000/health` y `/ready`.

Si PostgreSQL no está disponible, el backend no arranca y el estado correcto es `BLOCKED`, no `PASS`.

---

## 13. Fase de identidad y onboarding (S-015, 2026-11-09)

### 13.1 Punto de partida

- Rama `main`, commit base `9b10282` (fase administrativa fusionada y sincronizada con `origin/main`).
- Árbol limpio antes de empezar. No se recuperaron implementaciones parciales de esta fase: no existían solicitudes de vendedor ni cambio de estado de acceso.
- Se reutilizaron `RegisterBuyer`, la autenticación de sesiones opacas, el alta administrativa de vendedor y los patrones de UI administrativos.

### 13.2 Implementación

- Backend: módulo `seller-applications` (dominio, puertos, casos de uso, adaptador PostgreSQL y rutas HTTP), `UpdateUserAccessStatus` y su adaptador transaccional, migración `009_seller_applications.sql` y conexión en `app.ts`, `server.ts` y `factory.ts`.
- Identidad: la aprobación conserva `users.id`, no crea una segunda cuenta y cambia el rol principal a `VENDEDOR`. El perfil `buyers` y el historial de pedidos se conservan.
- Estados de acceso: tabla de transiciones explícita, motivo obligatorio para desactivar/bloquear y revocación de sesiones en la misma transacción.
- Frontend: `/register`, `/seller-application`, `/admin/seller-applications` (lista y detalle), formulario de estado de acceso en el detalle de usuario, enlaces en cabecera y navegación admin.
- Contrato: `openapi.yaml` `0.8.0` con 74 rutas, 83 operaciones y 984 referencias.
- Calidad: ESLint en backend y frontend, Prettier en backend, scripts `lint`/`format:check` y workflow de CI con 5 jobs.

### 13.3 Comandos ejecutados y resultados

Desde `backend/`:

| Comando | Resultado observado |
|---|---|
| `npm run lint` | OK, 0 errores |
| `npm run format:check` | OK, todos los archivos cumplen Prettier |
| `npm run typecheck` | OK |
| `npm test` | 23 archivos, 187 pruebas aprobadas |
| `npm run validate:openapi` | `OpenAPI válido: 74 rutas, 83 operaciones, 984 referencias.` |
| `npm run build` | OK |
| `npm run verify` | OK (lint + formato + typecheck + pruebas + OpenAPI + build) |
| `npm run test:postgres` | 9 archivos, 46 pruebas aprobadas contra PostgreSQL 17.11 |
| `npm run db:migrate` | Aplicó `009` sobre la base demo |
| `npm run db:status` | `009` aplicada; sin pendientes |

Desde `frontend/`:

| Comando | Resultado observado |
|---|---|
| `npm run lint` | 0 errores, 2 avisos `@next/next/no-img-element` |
| `npm run typecheck` | OK |
| `npm run build` | OK; 56 rutas |
| `npm run test:e2e` | 10/10 PASS en 5.6 min |

Escenarios E2E nuevos (`identity-onboarding.spec.ts`, 3/3):

1. Registro público → inicio de sesión → solicitud → aprobación admin → vendedor y primera bodega → acceso a `/seller` → sin segunda cuenta ni segunda incorporación.
2. Rechazo con motivo → sin vendedor ni bodega → el comprador conserva su cuenta y sigue operando.
3. Desactivación con motivo → sesión del comprador revocada → reactivación → nuevo inicio de sesión → autogestión del admin bloqueada en la UI.

### 13.4 Incidencias y mitigaciones

| Incidencia | Efecto | Mitigación |
|---|---|---|
| Checksum de migraciones distinto entre Windows (CRLF) y Linux (LF) | `db:status` fallaba con “la migración 003 cambió” | Se normalizan `\r\n`/`\r` a `\n` antes de calcular el SHA-256 en `migrations.ts` |
| Base `nexusmarket_test` con checksums antiguos | La suite PostgreSQL no arrancaba | Se recreó el esquema de prueba y se aplicaron las migraciones normalizadas |
| Puerto `3001` ocupado por un `next start` previo | El nuevo servidor no arrancaba | Se detuvo el proceso y se reutilizó el servidor de producción ya compilado para el E2E |
| Prettier marcaba 119 archivos del backend | El formato no era verificable | Se adoptó `trailingComma: none` y `endOfLine: auto`, y se normalizó el backend con `npm run format` |

### 13.5 Lo que no se ejecutó

| Verificación | Estado |
|---|---|
| GitHub Actions en remoto | Workflow de 5 jobs válido y parseado; **no ejecutado en GitHub** |
| Reenvío/edición de solicitudes rechazadas | No implementado; decisión pendiente |
| Notificaciones externas de decisión | No implementadas; no hay infraestructura aprobada |
| Reconciliación de pagos `DESCONOCIDO`, reportes `L-19`, devoluciones/reembolsos/facturación y `CloseOrder` | Fuera de alcance; sin reglas inventadas |
