# NexusMarket — Plan de implementación V1

**Corte:** 2026-11-03
**Objetivo acumulado:** llevar NexusMarket de un backend parcial a un marketplace demostrable: catálogo público, autenticación, direcciones, alta administrativa de vendedor, carrito, checkout con pago simulado y frontend Next.js integrado, todo sobre PostgreSQL real.

---

## 1. Principios de ejecución

1. **Backend antes que frontend:** ninguna pantalla consume un endpoint que no exista o no esté probado.
2. **Datos reales:** la demostración usa PostgreSQL y el seed explícito; no se inventan respuestas ni productos en el frontend.
3. **Entrega vertical:** cada gate debe dejar algo ejecutable y verificable.
4. **Backend autoridad:** permisos, stock, precios y transiciones se validan en el backend; el frontend no decide nada crítico.
5. **Contrato primero:** OpenAPI y pruebas de contrato se actualizan antes de conectar la interfaz.
6. **Evidencia ejecutada:** un gate no se marca aprobado sin comandos y resultados reales.
7. **Sin capacidades ficticias:** si algo no existe (reembolsos, resolución de pagos desconocidos), se declara y no se simula como terminado.

---

## 2. Iteración 1 — Catálogo y frontend público

### Gate A — Persistencia real obligatoria

**Estado:** `PASS`.

- Eliminado el almacén en memoria del runtime; `DATABASE_URL` obligatoria.
- Adaptador PostgreSQL y doble exclusivo de pruebas.
- Prueba de arquitectura que impide reintroducir `PERSISTENCE`.

### Gate B — Catálogo backend

**Estado:** `PASS`.

- Migración `003_catalog.sql`; productos sin variantes, imágenes e inventario.
- `GET /api/v1/products`, `/products/{productId}`, `/categories`.
- Visibilidad `PUBLICADO` + vendedor `ACTIVO`; disponibilidad calculada; `null` para digital.

### Gate C — Contrato ejecutable

**Estado:** `PASS` (ampliado en la iteración 2 a 0.3.0).

### Gate D — Frontend conectado

**Estado:** `PASS`.

- Next.js App Router, Server Components, cliente API solo servidor.
- Home, catálogo, detalle, búsqueda, filtros, orden, paginación y estados.

### Gate E — Verificación y documentación

**Estado:** `PASS` local.

---

## 3. Iteración 2 — Marketplace funcional

### Gate F — Autenticación y sesiones (`ADR-004`)

**Objetivo:** identidad verificable en el backend, sin proveedores externos.

**Trabajo:**

- Migración `004_identity_sessions.sql`.
- `IdentityStore`, `LoginUser`, `GetSession`, `LogoutUser`, `PostgresIdentityStore`.
- Token opaco de 256 bits; hash SHA-256 en `sessions`; TTL 8 h.
- Cookie `HttpOnly`/`SameSite=Lax` y `Authorization: Bearer`.
- Rutas `/auth/login`, `/auth/logout`, `/auth/session`.
- Guardas de rol y mapeo `NO_AUTENTICADO` → `401`.

**Criterios de aceptación:**

- Credenciales válidas crean sesión; inválidas no revelan si el correo existe.
- Sesión expirada/revocada responde `401`.
- Logout revoca y el token deja de servir.
- El cuerpo no puede suplantar identidad ni rol.
- Pruebas unitarias, HTTP y PostgreSQL aprueban.

**Estado:** `PASS`.

---

### Gate G — Direcciones de comprador (`L-01`)

**Objetivo:** modelo mínimo de dirección con ownership, principal único y snapshot de checkout.

**Trabajo:**

- Migración `005_buyer_addresses.sql`.
- Dominio `DireccionEntrega`, `AddressStore`, casos de uso CRUD y principal.
- `PostgresAddressStore`; rutas bajo `/buyers/me/addresses`.
- Índice único parcial para una sola principal por comprador.
- Promoción de la más antigua al eliminar la principal.
- Snapshot JSON inmutable en el pedido.

**Criterios de aceptación:**

- Un comprador no puede leer ni modificar direcciones ajenas.
- Solo una principal por comprador.
- Eliminar la principal deja exactamente una principal si quedan direcciones.
- El pedido conserva la dirección aunque luego se edite o elimine.

**Estado:** `PASS`.

---

### Gate H — Alta administrativa de vendedor (`PI-02`)

**Objetivo:** creación atómica de vendedor + primera bodega por un administrador.

**Trabajo:**

- `RegisterSeller`, `PostgresSellerRegistrationStore`.
- `POST /api/v1/admin/sellers`, solo `ADMINISTRADOR` activo.
- Transacción única: `users` + `sellers` + `warehouses` + auditoría/outbox.
- Conflicto de unicidad → `409`.
- Rollback explícito si falla la bodega.

**Criterios de aceptación:**

- El cuerpo no declara identidad ni rol.
- Un comprador recibe `403`; un anónimo `401`.
- Un fallo de bodega no deja vendedor creado.
- Prueba PostgreSQL de éxito y de rollback.

**Estado:** `PASS`.

---

### Gate I — Carrito persistente

**Objetivo:** carrito real por comprador, con validación de producto y cantidades.

**Trabajo:**

- Migración `006_cart_checkout.sql` (`cart_items`, `checkout_attempts`, `inventory_reservations`).
- Dominio `Carrito` basado en producto; sin variantes.
- `CartStore`, casos de uso add/update/remove/get, `PostgresCartStore`.
- Rutas `/cart` y `/cart/items`.
- `precio_referencial_centavos` para detectar cambios de precio.

**Criterios de aceptación:**

- Rechaza producto inexistente, no público, vendedor inactivo y cantidades inválidas.
- El backend devuelve cantidades y precios autoritativos.
- Un comprador no ve el carrito de otro.

**Estado:** `PASS`.

---

### Gate J — Checkout, pedidos y pago simulado

**Objetivo:** convertir el carrito en pedidos con reserva de inventario y pago simulado, incluyendo el resultado desconocido e idempotencia.

**Trabajo:**

- `Checkout`, `ListOrders`, `GetOrder`, `PostgresCheckoutStore`.
- Un pedido por vendedor; snapshot de dirección; reservas en `inventory_reservations`.
- Idempotencia por `(comprador_id, idempotency_key)`.
- Resultados `CONFIRMADO`, `RECHAZADO`, `DESCONOCIDO`.
- Liberación de reservas exactamente una vez en rechazo.
- Cambio de precio → `422` con `PRECIO_CAMBIADO` salvo `confirmarPrecio`.
- Rutas `/checkout`, `/orders`, `/orders/{orderId}`.

**Criterios de aceptación:**

- Confirmado: pedido `EN_PREPARACION`, pago `CAPTURADO`.
- Rechazado: pedido `CANCELADO`, pago `RECHAZADO`, reservas liberadas.
- Desconocido: pedido `PENDIENTE_DE_PAGO`, pago `PENDIENTE`; no es éxito ni rechazo.
- Reintento con la misma clave no duplica pedidos ni cargos.
- Sin stock o dirección inválida no crea pedido.
- Sin reembolsos ni logística inversa.

**Estado:** `PASS`.

---

### Gate K — Integración frontend del marketplace

**Objetivo:** exponer las capacidades reales con estados de carga, error, vacío y éxito.

**Trabajo:**

- Auth con Server Actions y cookie `HttpOnly` propia; reenvío `Bearer`.
- Login/logout, cabecera con rol.
- Carrito, checkout con resultado de pago seleccionable, pedidos y detalle.
- Direcciones y panel admin de vendedores.
- Add-to-cart en detalle de producto.
- Fronteras de carga acotadas; 404 real en IDs malformados.
- `ApiError` neutral para evitar filtrar `server-only` a componentes cliente.

**Criterios de aceptación:**

- Typecheck y build aprueban.
- Guardas anónimas y por rol funcionan en la UI.
- Checkout conserva el resultado tras la revalidación.
- Reintentos de pago desconocido conservan la clave de idempotencia.
- Smoke HTTP 15/15 y E2E de navegador 13/13.

**Estado:** `PASS`.

---

### Gate L — CI y validación OpenAPI

**Objetivo:** verificación reproducible y continua.

**Trabajo:**

- Validador OpenAPI offline (`scripts/validate-openapi.ts`).
- Integración en `npm run verify`.
- Workflow `.github/workflows/ci.yml` con backend estático, tests, PostgreSQL y frontend.

**Criterios de aceptación:**

- El validador pasa localmente.
- El YAML del workflow es válido y las migraciones son idempotentes.
- La ejecución en GitHub Actions queda registrada con evidencia real.

**Estado:** `READY_FOR_REVIEW`. La validación local está hecha; la ejecución remota en GitHub no se ha realizado en este corte.

---

### Gate M — Lint

**Estado:** `BLOCKED`. No existe ESLint/Biome configurado. El análisis estático disponible es TypeScript estricto. No se declara `PASS`.

---

## 4. Orden de dependencias

```text
Iteración 1: A → B → C → D → E
Iteración 2:
  F (identidad)
   ├── G (direcciones)
   ├── H (vendedor + bodega)
   └── I (carrito)
          └── J (checkout y pedidos)
                 └── K (frontend)
                        └── L (CI) / M (lint)
```

`H` depende de `F` y del modelo de dirección de `G`. `J` depende de `I`, `G` y del stock del catálogo. `K` no se inició hasta que `F`–`J` tuvieron contrato y pruebas.

---

## 5. Fuera de alcance de esta entrega

- Reembolsos, cancelaciones posteriores al pago y logística inversa.
- Resolución automática de pagos `DESCONOCIDO` (reconciliación).
- Subida y almacenamiento de imágenes.
- Variantes comerciales.
- Recuperación de contraseña, MFA y proveedores de identidad externos.
- Pasarelas de pago reales.
- Despliegue productivo.

Estas capacidades no se muestran como funcionales en la interfaz ni se declaran terminadas.

---

## 6. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación aplicada |
|---|---|---|
| El frontend confía en precios/cantidades | Fraude o inconsistencia | El backend recalcula y valida; `precio_referencial_centavos` |
| Reintento de checkout duplica pedidos | Cobros/pedidos duplicados | Clave de idempotencia única por comprador |
| Pago desconocido tratado como éxito | Pedido no pagado | Estado `PENDIENTE_DE_PAGO`/`PENDIENTE` explícito |
| Vendedor sin bodega por fallo parcial | Inconsistencia | Transacción atómica y prueba de rollback |
| Dirección principal duplicada | Ambigüedad de envío | Índice único parcial y promoción controlada |
| `server-only` filtrado al cliente | Build roto | `ApiError` en módulo neutral |
| `loading.tsx` convierte 404 en soft-404 | SEO/semántica | Fronteras de carga por route group |
| Falta de lint | Deuda de estilo | Declarado `BLOCKED`; typecheck estricto como gate actual |

---

## 7. Próximos pasos sugeridos

1. Ejecutar CI en GitHub y registrar evidencia; corregir fallos si aparecen.
2. Decidir la reconciliación de pagos `DESCONOCIDO`.
3. Incorporar lint si el proyecto lo adopta.
4. Evaluar reembolsos y logística inversa como nueva decisión de negocio.
5. Añadir subida de imágenes y variantes solo con contrato y decisiones explícitas.
