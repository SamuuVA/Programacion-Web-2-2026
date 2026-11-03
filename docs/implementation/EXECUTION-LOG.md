# NexusMarket — Registro de ejecución

**Corte:** 2026-11-03
**Sesiones:** S-006 (cierre de `PI-01` y catálogo) y S-007 (marketplace funcional)
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
| Rama | `main` |
| Commit HEAD al iniciar | `10e65d8cb7f46898342323d223076255e7b95bb4` |
| Árbol | cambios sin commit (backend, frontend y documentación) |

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

## 3. Comandos consolidados

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

## 5. Comandos consolidados (corte actual)

### Backend

```powershell
cd backend
npm run verify            # typecheck + test + validate:openapi + build
$env:TEST_DATABASE_URL = "postgresql://nexusmarket:nexusmarket@127.0.0.1:5432/nexusmarket_test"
npm run test:postgres
```

| Suite | Archivos | Pruebas |
|---|---:|---:|
| `npm test` | 12 | 92 |
| `npm run test:postgres` | 4 | 21 |

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

## 6. Incidencias de la iteración 1 (histórico)

| Incidencia | Efecto | Mitigación |
|---|---|---|
| Espacio libre bajo en `C:` (~1.15 GB) | `npm install`/build podían fallar con `ENOSPC` | Limpieza de caché npm, `CrashDumps` y `.next/cache` |
| Ejecutar suites backend en paralelo | Node agotó memoria (`OOM`) | Ejecutar `npm test` y `npm run test:postgres` de forma secuencial |
| `loading.tsx` en detalle devolvía `200` antes del `notFound()` | 404 no real | Route groups y eliminación del `loading.tsx` del detalle |
| IDs malformados producían `400` visible | Mala experiencia | `isProductId()` en el cliente; se tratan como no encontrados |
| El prompt mencionaba Go | Stack incorrecto | Se preservó TypeScript/Fastify; registrado en `DEC-V1-001` |

---

## 7. Lo que no se ejecutó

| Verificación | Estado |
|---|---|
| Lint (ESLint/Biome) | No configurado (`BLOCKED`) |
| CI en GitHub Actions | Workflow creado y validado localmente; **no ejecutado en remoto** |
| Reconciliación de pagos `DESCONOCIDO` | No implementada |
| Reembolsos y logística inversa | No implementados (fuera de alcance) |
| Pruebas de carga o concurrencia | No ejecutadas |
| Subida de imágenes y variantes | No implementadas |
| Despliegue productivo | No realizado |

Estas ausencias no se compensan con afirmaciones: el estado correcto es “no ejecutado” o `BLOCKED`.

---

## 8. Reproducción mínima

1. `docker compose up -d` en la raíz.
2. `cd backend; npm install; Copy-Item .env.example .env; npm run db:migrate; npm run db:seed:demo; npm run dev`.
3. En otra terminal: `cd frontend; npm install; npm run dev -- -p 3001`.
4. Abrir `http://127.0.0.1:3001`.
5. Iniciar sesión con `comprador@nexusmarket.demo` o `admin@nexusmarket.demo`; contraseña `NexusMarketDemo2026!`.
6. Verificar `http://127.0.0.1:3000/health` y `/ready`.

Si PostgreSQL no está disponible, el backend no arranca y el estado correcto es `BLOCKED`, no `PASS`.
