# NexusMarket — Registro de ejecución

**Corte:** 2026-11-01
**Sesión:** S-006 (continuación del cierre de `PI-01`)
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

## 2. Línea de tiempo

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

## 4. Incidencias y mitigaciones

| Incidencia | Efecto | Mitigación |
|---|---|---|
| Espacio libre bajo en `C:` (~1.15 GB) | `npm install`/build podían fallar con `ENOSPC` | Limpieza de caché npm, `CrashDumps` y `.next/cache`; instalación y build completados |
| Ejecutar suites backend en paralelo | Node agotó memoria (`OOM`) | Ejecutar `npm test` y `npm run test:postgres` de forma secuencial |
| `loading.tsx` en detalle devolvía `200` antes del `notFound()` | 404 no real | Route groups y eliminación del `loading.tsx` del detalle |
| IDs malformados producían `400` visible | Mala experiencia | `isProductId()` en el cliente; se tratan como no encontrados |
| El prompt mencionaba Go | Stack incorrecto | Se preservó TypeScript/Fastify; registrado en `DEC-V1-001` |

No hubo bloqueos funcionales. El disco y la memoria fueron límites operativos, no defectos del producto.

---

## 5. Lo que no se ejecutó

| Verificación | Estado |
|---|---|
| Lint | No configurado |
| CI (GitHub Actions u otro) | No configurado |
| Validador semántico OpenAPI | No ejecutado |
| Pruebas e2e de navegador (Playwright/Cypress) | No ejecutadas |
| Pruebas de carga o concurrencia de catálogo | No ejecutadas |
| Autenticación/autorización | No implementadas |
| Carrito, checkout y pagos | No implementados |

Estas ausencias no se compensan con afirmaciones: el estado correcto es “no ejecutado”.

---

## 6. Reproducción mínima

1. `docker compose up -d` en la raíz.
2. `cd backend; npm install; Copy-Item .env.example .env; npm run db:migrate; npm run db:seed:demo; npm run dev`.
3. En otra terminal: `cd frontend; npm install; npm run dev -- -p 3001`.
4. Abrir `http://127.0.0.1:3001`.
5. Verificar `http://127.0.0.1:3000/health` y `/ready`.

Si PostgreSQL no está disponible, el backend no arranca y el estado correcto es `BLOCKED`, no `PASS`.
