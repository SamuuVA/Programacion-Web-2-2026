# NexusMarket — Estado de implementación

**Corte:** 2026-11-03
**Estado global:** marketplace funcional local (autenticación, direcciones, alta de vendedor, carrito, checkout con pago simulado y frontend integrado) verificado con evidencia ejecutada.
**Fuente de verdad:** código del repositorio, PostgreSQL real y comandos ejecutados en este corte.

---

## 1. Resumen de gates

| Gate | Alcance | Estado | Evidencia principal |
|---|---|---|---|
| A | Persistencia PostgreSQL obligatoria | `PASS` | Sin almacén memoria en `src/`; 92 pruebas; 21 pruebas PostgreSQL |
| B | Catálogo backend | `PASS` | Migración `003`; rutas de productos y categorías |
| C | Contrato OpenAPI | `PASS` | `openapi.yaml` 0.3.0; validador offline; prueba de contrato |
| D | Frontend de catálogo | `PASS` | Typecheck/build; home, catálogo y detalle contra API real |
| E | Verificación y documentación (entrega 1) | `PASS` local | Suites, smoke y documentos |
| F | Autenticación y sesiones (`ADR-004`) | `PASS` | Login/sesión/logout, cookie HttpOnly, bearer, 401/403 probados |
| G | Direcciones de comprador (`L-01`) | `PASS` | CRUD, principal único, ownership y snapshot en pedidos |
| H | Alta administrativa de vendedor (`PI-02`) | `PASS` | `POST /api/v1/admin/sellers`; transacción atómica; rollback probado |
| I | Carrito persistente | `PASS` | `GET/POST/PATCH/DELETE`; validación de producto y cantidades |
| J | Checkout, pedidos y pago simulado | `PASS` | Confirmado/rechazado/desconocido; idempotencia; reservas |
| K | Integración frontend del marketplace | `PASS` | Login, carrito, checkout, pedidos, direcciones, admin; E2E navegador 13/13 |
| L | CI y validación OpenAPI | `READY_FOR_REVIEW` | Workflow válido y reproducible; **no ejecutado en GitHub** |
| M | Lint | `BLOCKED` | No existe herramienta de lint configurada en el repositorio |

`PASS` significa “verificado con la evidencia listada”. No implica ejecución remota de CI ni revisión independiente. `READY_FOR_REVIEW` indica que el artefacto existe y fue validado localmente, pero su ejecución real en GitHub Actions está pendiente.

---

## 2. Evidencia consolidada de este corte

### Backend

| Comando | Resultado observado |
|---|---|
| `npm run typecheck` | OK |
| `npm test` | 12 archivos, 92 pruebas aprobadas |
| `npm run validate:openapi` | `OpenAPI válido: 19 rutas, 22 operaciones, 237 referencias.` |
| `npm run build` | OK |
| `npm run verify` | OK (typecheck + test + validate:openapi + build) |
| `npm run test:postgres` | 4 archivos, 21 pruebas aprobadas |

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
| `tests/integration/register-buyer-http.test.ts` | 19 |
| `tests/integration/catalog-http.test.ts` | 10 |
| `tests/integration/marketplace-http.test.ts` | 19 |
| `tests/contract/openapi.test.ts` | 6 |

Desglose de `npm run test:postgres`:

| Archivo | Pruebas |
|---|---:|
| `tests/postgres/register-buyer-postgres.test.ts` | 3 |
| `tests/postgres/migrations-postgres.test.ts` | 2 |
| `tests/postgres/catalog-query-postgres.test.ts` | 6 |
| `tests/postgres/marketplace-postgres.test.ts` | 10 |

### Frontend

| Comando / comprobación | Resultado observado |
|---|---|
| `npm run typecheck` | OK |
| `npm run build` | OK (Next.js 16.4.3, 11 rutas) |
| Smoke HTTP del frontend | 15/15 PASS |
| E2E de navegador real (Chrome CDP) | 13/13 PASS |

### Migraciones aplicadas

`001_initial.sql`, `002_audit_nested_secrets.sql`, `003_catalog.sql`, `004_identity_sessions.sql`, `005_buyer_addresses.sql`, `006_cart_checkout.sql`.

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

## 9. Gate L — CI y validación OpenAPI

### Implementado

- `backend/scripts/validate-openapi.ts`: valida sintaxis YAML, versión 3.1.x, rutas, `operationId` únicos, respuestas, parámetros de ruta, seguridad y resolución de `$ref`; corre offline con la dependencia `yaml` existente.
- `npm run validate:openapi` integrado en `npm run verify`.
- `.github/workflows/ci.yml` con cuatro jobs:
  1. Backend typecheck + OpenAPI + build.
  2. Backend pruebas unitarias e integración.
  3. PostgreSQL 17: migraciones + pruebas.
  4. Frontend typecheck + build.

### Evidencia y límite

- `npm run validate:openapi` → `OpenAPI válido: 19 rutas, 22 operaciones, 237 referencias.`
- YAML del workflow parseado correctamente: 4 jobs (`backend-static`, `backend-tests`, `backend-postgres`, `frontend`).
- `npm run db:migrate` es idempotente: “No había migraciones pendientes.”
- **No hay evidencia de ejecución en GitHub Actions** en este corte. El gate queda `READY_FOR_REVIEW`, no `PASS`.

---

## 10. Gate M — Lint (limitación declarada)

No existe ESLint, Biome ni herramienta equivalente configurada en `backend/` ni en `frontend/`. El análisis estático disponible es TypeScript estricto (`npm run typecheck` en ambos proyectos). No se declara lint como `PASS`; el estado correcto es `BLOCKED` por ausencia de herramienta, no por fallo del código.

---

## 11. Lo que no se declara terminado

| Capacidad | Estado real |
|---|---|
| Reembolsos y logística inversa | No implementados (fuera de alcance de esta etapa) |
| Resolución de pagos `DESCONOCIDO` | Queda pendiente; no se trata como éxito ni rechazo |
| Subida de imágenes | No implementado |
| Variantes comerciales | Fuera de V1 por decisión |
| Recuperación de contraseña / MFA | No implementado |
| CI ejecutado en GitHub | `READY_FOR_REVIEW`; no ejecutado |
| Lint | `BLOCKED`: sin herramienta configurada |
| Despliegue / producción | No realizado |

---

## 12. Próxima acción

1. Revisar y ejecutar el workflow de CI en GitHub; si falla, corregir y registrar evidencia.
2. Decidir e implementar la resolución de pagos `DESCONOCIDO` (consulta/reconciliación) antes de considerar completo el flujo de pagos.
3. Incorporar lint (ESLint/Biome) si el proyecto lo requiere, y registrar el gate correspondiente.
4. No declarar reembolsos ni logística inversa hasta que exista decisión de negocio y contrato.
