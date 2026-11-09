# NexusMarket — Baseline del repositorio

**Corte:** 2026-11-01
**Rama:** `main`
**HEAD:** `10e65d8cb7f46898342323d223076255e7b95bb4`
**Estado del árbol:** cambios de implementación sin commit (backend de catálogo + frontend + documentación).
**Alcance:** primera entrega demostrable: catálogo público sobre PostgreSQL y frontend Next.js.

---

## 1. Entorno verificado

| Elemento | Valor comprobado |
|---|---|
| Sistema | Windows (PowerShell 5.1) |
| Node.js | `v24.21.0` |
| npm | `11.19.0` |
| Backend | Fastify 5, TypeScript 5.9, Zod 4, Vitest 5, `pg`, `@node-rs/argon2` |
| Frontend | Next.js `16.4.3`, React `19.3.1`, TypeScript 5.9 |
| Base de datos | PostgreSQL 17.11 en contenedor `nexusmarket-postgres`, puerto `5432` |
| Base de pruebas | `nexusmarket_test` |
| Migraciones aplicadas | `001_initial.sql`, `002_audit_nested_secrets.sql`, `003_catalog.sql` |

No se declara CI, lint ni pruebas de navegador automatizadas: no existen en este corte.

---

## 2. Estado de partida

Antes de esta entrega el repositorio contenía:

- Un backend Fastify/TypeScript con el vertical `PI-01 RegisterBuyer`.
- Dos adaptadores de persistencia para compradores: PostgreSQL y un almacén en memoria.
- La variable `PERSISTENCE` para elegir el adaptador.
- Contrato OpenAPI limitado a `POST /api/v1/buyers`, `/health` y `/ready`.
- Sin catálogo, sin datos de productos y sin frontend.

El riesgo principal era que el modo en memoria podía perder registros al reiniciar y no representaba el comportamiento real de producción.

---

## 3. Estado actual

### 3.1 Persistencia

- `DATABASE_URL` es obligatoria.
- `PERSISTENCE` fue eliminada de la configuración, del código y de `.env.example`.
- El almacén en memoria de compradores fue eliminado del runtime.
- Se conserva el puerto `BuyerRegistrationStore`; el adaptador PostgreSQL es el único de ejecución.
- El doble en memoria vive únicamente en `backend/tests/support/fake-buyer-registration-store.ts`.
- Una prueba de arquitectura impide referencias a `PERSISTENCE` o al almacén en memoria dentro de `backend/src/`.

### 3.2 Catálogo

- Migración `backend/migrations/003_catalog.sql` con `sellers`, `warehouses`, `products`, `product_images` e `inventory`.
- Dominio de catálogo en `backend/src/modules/catalog/domain/producto.ts`.
- Puerto de consulta en `backend/src/modules/catalog/application/ports.ts`.
- Caso de uso `QueryCatalog` en `backend/src/modules/catalog/application/query-catalog.ts`.
- Adaptador PostgreSQL en `backend/src/modules/catalog/infrastructure/postgres-catalog-query-repository.ts`.
- Rutas HTTP en `backend/src/modules/catalog/interfaces/http/catalog-routes.ts`.

### 3.3 Contrato

- `backend/openapi.yaml` versión `0.2.0`.
- Cubre compradores, catálogo público, health y readiness.
- `backend/tests/contract/openapi.test.ts` valida rutas, métodos, respuestas y referencias locales.

### 3.4 Datos de demostración

`backend/scripts/seed-demo.ts` escribe datos reales en PostgreSQL mediante `npm run db:seed:demo`. No es un mock de la API.

Conteo comprobado directamente en PostgreSQL:

| Tabla | Filas |
|---|---:|
| `products` publicados | 8 |
| `sellers` | 2 |
| `product_images` | 8 |
| `inventory` | 6 |

Los productos digitales no tienen fila de inventario; su disponibilidad es `null`.

### 3.5 Frontend

- Aplicación Next.js App Router en `frontend/`.
- Server Components por defecto.
- Cliente HTTP centralizado y solo de servidor en `frontend/src/lib/api/client.ts`.
- Home, catálogo, detalle de producto, búsqueda, filtros, orden y paginación.
- Estados de carga, error, vacío y producto no encontrado.
- Ocho imágenes SVG locales en `frontend/public/products/`.

---

## 4. Comandos ejecutados y resultados

### 4.1 Backend

| Comando | Resultado real |
|---|---|
| `npm run typecheck` | OK |
| `npm test` | 8 archivos, 51 pruebas aprobadas |
| `npm run build` | OK |
| `$env:TEST_DATABASE_URL=...; npm run test:postgres` | 3 archivos, 11 pruebas aprobadas |

La primera ejecución de `npm run verify` y `npm run test:postgres` en paralelo terminó con errores de memoria del proceso Node. La causa fue la ejecución simultánea de ambas suites en un equipo con poca memoria libre; al ejecutarlas secuencialmente ambas aprobaron. No se registra como fallo de código.

### 4.2 Frontend

| Comando | Resultado real |
|---|---|
| `npm install --no-audit --no-fund` | 27 paquetes instalados |
| `npm run typecheck` | OK |
| `npm run build` | OK; rutas `/`, `/products`, `/products/[productId]`, `/_not-found`, `/icon.svg` |

La primera instalación falló por falta de espacio en disco (`ENOSPC`). Se limpiaron cachés seguras (caché de npm, `CrashDumps`, caché de build) y la instalación se repitió con éxito.

### 4.3 Smoke HTTP real

Con backend en `http://127.0.0.1:3000` y frontend en `http://127.0.0.1:3001`:

| Verificación | Resultado |
|---|---|
| `GET /` | `200`; 8 tarjetas de producto |
| `GET /products` | `200`; 6 productos en página 1 y enlace a página 2 |
| `GET /products?page=2` | `200`; 2 productos y página 2 marcada |
| `GET /products?search=lampara` | `200`; 1 producto (búsqueda sin acentos) |
| `GET /products?categoria=DIGITAL` | `200`; 2 productos digitales |
| `GET /products?orden=precio_asc` | `200`; primer producto: Guía práctica de finanzas personales |
| `GET /products/:id` | `200`; SKU `AUR-AUD-001` visible |
| `GET /products/:id-inexistente` | `404`; UI “Producto no encontrado” |
| 8 imágenes `/products/*.svg` | `200` |

---

## 5. Limitaciones y límites del baseline

- No hay autenticación, sesiones ni autorización.
- No hay carrito operativo, checkout, pedidos ni pagos.
- No hay inscripción de vendedores desde la aplicación.
- No hay subida de imágenes; las imágenes demo son activos SVG locales.
- No hay variantes comerciales: cada producto es una combinación vendible.
- No hay CI, lint ni pruebas end-to-end de navegador.
- No se usa MongoDB en este corte.
- El árbol de trabajo no está comprometido en Git; el HEAD sigue siendo `10e65d8`.

---

## 6. Reproducción mínima

```powershell
# Backend
cd backend
npm install
Copy-Item .env.example .env
docker compose up -d
npm run db:migrate
npm run db:seed:demo
npm run dev

# Frontend (otra terminal)
cd frontend
npm install
$env:API_URL = "http://127.0.0.1:3000"
npm run dev -- -p 3001
```

La API escucha por defecto en `127.0.0.1:3000`; el frontend en `3001` para evitar conflicto de puerto.
