# NexusMarket — Estado del contrato API

**Corte:** 2026-11-03
**Documento ejecutable:** `backend/openapi.yaml` (`openapi: 3.1.0`, `info.version: 0.3.0`)
**Autoridad:** el código y las pruebas del backend. Este documento describe lo que existe; no autoriza rutas futuras.

---

## 1. Alcance declarado

El contrato cubre **19 rutas / 22 operaciones**:

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
| `GET` | `/health` | `health` | Pública |
| `GET` | `/ready` | `ready` | Pública |

No se declaran reembolsos, logística inversa, subida de archivos, variantes ni pasarelas de pago reales.

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
- `npm run validate:openapi` → `OpenAPI válido: 19 rutas, 22 operaciones, 237 referencias.`
- `npm run verify` ejecuta typecheck + pruebas + validación OpenAPI + build.
- `backend/tests/contract/openapi.test.ts` (6 pruebas) verifica rutas, métodos, respuestas, seguridad, esquemas y referencias.

Conteo total del backend: **12 archivos / 92 pruebas** en `npm test`; **4 archivos / 21 pruebas** en `npm run test:postgres`.

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
