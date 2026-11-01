# NexusMarket — Estado del contrato API

**Corte:** 2026-11-01
**Documento ejecutable:** `backend/openapi.yaml` (`openapi: 3.1.0`, `info.version: 0.2.0`)
**Autoridad:** el código y las pruebas del backend. Este documento describe lo que existe; no autoriza rutas futuras.

---

## 1. Alcance declarado

El contrato cubre exclusivamente:

| Método | Ruta | Operación | Autenticación |
|---|---|---|---|
| `POST` | `/api/v1/buyers` | `registerBuyer` | Pública |
| `GET` | `/api/v1/products` | `listPublicProducts` | Pública |
| `GET` | `/api/v1/products/{productId}` | `getPublicProduct` | Pública |
| `GET` | `/api/v1/categories` | `listCategories` | Pública |
| `GET` | `/health` | `health` | Pública |
| `GET` | `/ready` | `ready` | Pública |

No se declaran autenticación, autorización, carrito, checkout, pagos, pedidos, devoluciones, administración ni subida de archivos.

---

## 2. Endpoints implementados

### 2.1 `POST /api/v1/buyers`

- **Cuerpo:** `RegisterBuyerRequest` con `additionalProperties: false`.
- **Éxito:** `201` con `usuarioId`, `compradorId`, `carritoId`, estados y correo normalizado.
- **Errores declarados:** `400`, `409`, `413`, `415`, `500`, `503`.
- **Persistencia:** `PostgresBuyerRegistrationStore` en una sola transacción (`users`, `buyers`, `carts`, `audit_log`, `outbox`).
- **Pruebas:** `tests/integration/register-buyer-http.test.ts` (19), `tests/unit/register-buyer.test.ts` (5), `tests/postgres/register-buyer-postgres.test.ts` (3).

### 2.2 `GET /api/v1/products`

**Parámetros de consulta** (esquema estricto, propiedades desconocidas rechazadas):

| Parámetro | Tipo / valores | Default | Límite |
|---|---|---|---|
| `search` | Texto | Sin filtro | 100 caracteres |
| `categoria` | `ELECTRONICA`, `ROPA`, `HOGAR`, `DIGITAL` | Sin filtro | Enum cerrado |
| `orden` | `recientes`, `precio_asc`, `precio_desc`, `nombre_asc` | `recientes` | Enum cerrado |
| `page` | Entero | `1` | ≥ 1 |
| `pageSize` | Entero | `12` | 1–48 |

- **Éxito:** `200` con `{ data: { items, pagination } }`.
- **Errores declarados:** `400`, `500`, `503`.
- **Regla de visibilidad:** solo productos `PUBLICADO` de vendedores `ACTIVO`.
- **Disponibilidad:** suma de `on_hand - reserved - unavailable` en bodegas `ACTIVA`, mínimo 0; `null` para `DIGITAL`.
- **Búsqueda:** insensible a mayúsculas y acentos sobre nombre y descripción.
- **Pruebas:** `tests/integration/catalog-http.test.ts` (10), `tests/postgres/catalog-query-postgres.test.ts` (6).

### 2.3 `GET /api/v1/products/{productId}`

- **Parámetro:** `productId` UUID.
- **Éxito:** `200` con `ProductoDetalle` (resumen + `sku`, `imagenes`, `actualizadoEn`).
- **Errores declarados:** `400`, `404`, `500`, `503`.
- **Reglas:**
  - UUID malformado → `400 VALIDACION_INVALIDA`.
  - UUID válido inexistente, no publicado o de vendedor inactivo → `404 RECURSO_NO_ENCONTRADO`.
- **Pruebas:** incluidas en `catalog-http.test.ts` y `catalog-query-postgres.test.ts`.

### 2.4 `GET /api/v1/categories`

- **Éxito:** `200` con `{ data: [{ codigo, nombre }] }` para las cuatro categorías del dominio.
- **Sin parámetros.** El catálogo es cerrado en V1.
- **Pruebas:** `tests/integration/catalog-http.test.ts`.

### 2.5 `/health` y `/ready`

- `/health`: `200` si el proceso HTTP responde; no consulta dependencias.
- `/ready`: `200` si PostgreSQL responde; `503` con `NotReadyResponse` si no.
- **Pruebas:** `register-buyer-http.test.ts` y contrato OpenAPI.

---

## 3. Esquemas declarados

| Esquema | Uso |
|---|---|
| `RegisterBuyerRequest` | Cuerpo de alta de comprador |
| `DocumentoIdentidad` | Documento dentro de la solicitud |
| `RegisterBuyerResponse` | Respuesta `201` |
| `CategoriaProducto` | Enum de categorías |
| `PrecioProducto` | `montoCentavos` + `moneda` |
| `ImagenProducto` | `id`, `url`, `alt`, `orden` |
| `VendedorResumen` | `id`, `nombreComercial` |
| `ProductoResumen` | Tarjeta de catálogo |
| `ProductoDetalle` | Detalle con SKU e imágenes |
| `PaginacionCatalogo` | `page`, `pageSize`, `total`, `totalPages` |
| `HealthResponse` / `ReadyResponse` / `NotReadyResponse` | Estado del proceso |
| `ErrorResponse` | Sobre uniforme de error |

Cabecera transversal: `x-correlation-id` (1–200 caracteres, patrón `^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$`). Se reutiliza el valor válido del cliente o se genera un UUID.

---

## 4. Códigos de error

| Código | HTTP | Uso actual |
|---|---:|---|
| `VALIDACION_INVALIDA` | 400 | Cuerpo, JSON, query, parámetro o propiedad desconocida |
| `CONFLICTO_UNICIDAD` | 409 | Correo o documento ya registrado |
| `REGLA_NEGOCIO_INCUMPLIDA` | 422 | Reservado; sin uso en el alcance actual |
| `NO_AUTORIZADO` | 403 | Reservado; no hay autenticación |
| `RUTA_NO_ENCONTRADA` | 404 | Ruta global desconocida |
| `RECURSO_NO_ENCONTRADO` | 404 | Producto inexistente o no público |
| `METODO_NO_PERMITIDO` | 405 | Método no declarado; incluye cabecera `Allow` |
| `DEPENDENCIA_NO_DISPONIBLE` | 503 | PostgreSQL o hashing no disponible |
| `ERROR_INTERNO` | 500 | Error no controlado |

Además, Fastify puede producir `413` y `415` para cuerpo excesivo o media type no soportado; el contrato los declara donde aplica.

---

## 5. Cobertura de pruebas de contrato

`backend/tests/contract/openapi.test.ts` (5 pruebas) verifica:

1. Solo existen las seis rutas y los métodos implementados.
2. Cada operación declara exactamente las respuestas que el adaptador puede producir.
3. `RegisterBuyerRequest` y `DocumentoIdentidad` rechazan propiedades desconocidas.
4. Existen los errores globales `404`/`405`, la cabecera de correlación y los códigos `RUTA_NO_ENCONTRADA`, `METODO_NO_PERMITIDO` y `ERROR_INTERNO`.
5. Todas las referencias locales `$ref` resuelven.

Conteo total del backend: **8 archivos / 51 pruebas** en `npm test`; **3 archivos / 11 pruebas** en `npm run test:postgres`.

---

## 6. Brechas conocidas

| Brecha | Impacto | Estado |
|---|---|---|
| Sin validador semántico OpenAPI (Spectral u otro) | El contrato se prueba estructuralmente, no contra un validador externo | Abierta |
| Sin autenticación declarada | No hay rutas protegidas ni esquema `security` | Fuera de alcance |
| Sin paginación por cursor | Solo paginación por página | Decisión V1 |
| Sin `ETag`/`Cache-Control` explícitos | El frontend usa `cache: "no-store"` | Aceptado |
| Sin versionado de esquemas de eventos | No hay eventos públicos en esta entrega | Fuera de alcance |
| Sin pruebas de contrato generadas desde OpenAPI | Las pruebas HTTP son manuales respecto al documento | Abierta |

Ninguna brecha se presenta como resuelta. El contrato no declara rutas de carrito, checkout ni pagos.

---

## 7. Protocolo de cambio

1. Cambiar dominio, caso de uso, adaptador y ruta en el backend.
2. Actualizar `backend/openapi.yaml`.
3. Actualizar `tests/contract/openapi.test.ts` y las pruebas HTTP/PostgreSQL.
4. Actualizar `frontend/src/features/catalog/types.ts` y `api.ts` si el cambio afecta al consumo público.
5. Ejecutar `npm run typecheck`, `npm test`, `npm run build` y `npm run test:postgres`.
6. Registrar la decisión en `DECISIONS-LOG.md` y el estado en este documento.

Una ruta no puede ser consumida por el frontend si no está en OpenAPI y cubierta por pruebas.
