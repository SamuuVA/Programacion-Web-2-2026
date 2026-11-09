# NexusMarket — Plan de implementación V1

**Corte:** 2026-11-03
**Objetivo acumulado:** llevar NexusMarket de un backend parcial a un marketplace demostrable: catálogo público, autenticación, direcciones, alta administrativa de vendedor, carrito, checkout con pago simulado, frontend Next.js integrado y espacio de trabajo del vendedor, todo sobre PostgreSQL real.

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

**Estado:** `PASS` (ampliado en la iteración 2 a 0.3.0, en la iteración 3 a 0.4.0 con 33 rutas / 40 operaciones, en la iteración 4 a 0.5.0 con 43 rutas / 50 operaciones y en la iteración 5 a 0.6.0 con 52 rutas / 59 operaciones).

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

## 4. Iteración 3 — espacio de trabajo del vendedor

### Gate N — Espacio de trabajo del vendedor (`GATE-V2-SELLER`)

**Objetivo:** permitir que un vendedor existente administre su perfil, productos, imágenes por URL, bodegas, inventario e consulta de pedidos, sin invadir funciones administrativas ni logísticas.

**Trabajo:**

- Migración `007_seller_workspace.sql`: `BORRADOR` y `inventory_movements`.
- Dominio `producto-vendedor.ts` e `inventario-vendedor.ts`; transiciones aprobadas.
- Casos de uso y puertos para perfil, productos, imágenes, bodegas, inventario y pedidos.
- `PostgresSellerWorkspaceStore` con ownership, transacciones, bloqueo asesor e idempotencia.
- 18 rutas `/api/v1/seller/*`; acceso cruzado `404`.
- Frontend `/seller` con layout protegido y estados completos.
- OpenAPI `0.4.0`; pruebas unitarias, HTTP, PostgreSQL, contrato, smoke y E2E.

**Criterios de aceptación:**

- El `sellerId` sale de la sesión; cambiar un ID ajeno responde `404`.
- Crear producto deja `BORRADOR`; publicar exige SKU e imagen; `DESCONTINUADO` no reactiva.
- El ingreso de stock es atómico e idempotente y no deja stock negativo.
- El vendedor solo ve pedidos con productos propios y no puede cambiar pagos ni logística.
- Typecheck/build, 110 pruebas backend, 28 PostgreSQL, smoke 33/33 y E2E 4/4 (incluye recorrido cruzado).

**Estado:** `PASS` local. Carga binaria, ajustes negativos/logística y entrega digital quedan bloqueados o pendientes según `IMPLEMENTATION-STATUS.md`.

---

## 5. Iteración 4 — Operación logística

### Gate O — Operación logística (`GATE-V2-LOGISTICS`)

**Objetivo:** permitir que un operador logístico prepare, despache y entregue pedidos pagados dentro de las bodegas que tiene asignadas, sin invadir pagos, precios ni funciones del vendedor.

**Trabajo:**

- Migración `008_logistics.sql`: perfil, ámbito de bodegas, envíos, líneas, eventos, evidencia, operaciones idempotentes e historial de estados.
- Dominio `envio.ts` con estados, precondiciones y evidencia; sin HTTP ni SQL.
- Casos de uso y puertos para perfil, bodegas, inventario, resumen, pedidos, preparación, despacho, entrega y alta administrativa.
- `PostgresLogisticsStore` con ámbito por bodegas, transacciones, bloqueos asesores, idempotencia, consumo de reservas y `SALIDA_VENTA`.
- 9 rutas `/api/v1/logistics/*` más `POST /api/v1/admin/logistics-operators`.
- Frontend `/logistics` con resumen, pedidos, detalle operable, bodegas e inventario.
- OpenAPI `0.5.0`; pruebas unitarias, HTTP, PostgreSQL, contrato, smoke y E2E.

**Criterios de aceptación:**

- El `operadorId` sale de la sesión y el rol/perfil se validan en el backend.
- Un pedido, envío o bodega fuera del ámbito responde `404`.
- Preparar exige pedido pagado y reservas activas; despachar consume reservas y descuenta inventario; entregar exige evidencia.
- El pedido solo pasa a `DESPACHADO`/`ENTREGADO` cuando se cumplen las condiciones globales.
- Typecheck/build, 131 pruebas backend, 34 PostgreSQL, smoke 33/33 y E2E 5/5 (incluye el recorrido logístico completo).

**Estado:** `PASS` local. Asignación automática, transportistas externos, tracking integrado, evidencia del proveedor y `CloseOrder` quedan bloqueados o sin decisión según `IMPLEMENTATION-STATUS.md`.

---

## 6. Iteración 5 — Supervisión de solo lectura

### Gate P — Supervisión (`GATE-V2-SUPERVISOR`)

**Objetivo:** permitir que un perfil `SUPERVISOR` consulte el estado operativo del marketplace sin modificar productos, precios, inventario, pedidos, pagos, vendedores, bodegas, roles ni logística (`SUP-01`).

**Trabajo:**

- Módulo `backend/src/modules/supervisor/` con puertos de solo lectura, 9 casos de uso, adaptador PostgreSQL con únicamente `SELECT` y 9 rutas `GET`.
- Guarda de método sobre `/api/v1/supervisor/*`: cualquier escritura responde `405 METODO_NO_PERMITIDO` con `Allow: GET, HEAD`.
- `requireSupervisor()` exige rol `SUPERVISOR` y usuario `ACTIVO`; sin herencia de `ADMINISTRADOR`.
- Dashboard con conteos directos de estados y suma de inventario `on_hand - reserved - unavailable` (`INV-03`).
- Frontend `/supervisor`: resumen, pedidos (lista y detalle), productos (lista y detalle), almacenes, inventario, envíos y vendedores; sin formularios.
- OpenAPI `0.6.0`; pruebas unitarias, HTTP, PostgreSQL, contrato y E2E.
- Seed demo: `supervisor@nexusmarket.demo`.

**Criterios de aceptación:**

- Un usuario sin rol `SUPERVISOR` no accede, aunque sea `ADMINISTRADOR`.
- Ninguna ruta bajo `/api/v1/supervisor/*` acepta escritura; el backend responde `405`.
- El dashboard no muestra porcentajes, metas, SLA, rankings ni proyecciones inventadas.
- Las vistas omiten datos personales y la referencia del proveedor de pago.
- Typecheck/build, 145 pruebas backend, 37 PostgreSQL y E2E 6/6.

**Estado:** `PASS` local. Reportes administrativos `BLOQUEADO` (`L-19`): sin catálogo, fórmulas, filtros ni límites aprobados.

---

## 7. Orden de dependencias

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
Iteración 3:
  N (espacio del vendedor) depende de F, H, B y del contrato de imágenes
Iteración 4:
  O (operación logística) depende de J, N y de las reservas de inventario
Iteración 5:
  P (supervisión) depende de B, J, N y O; reutiliza sus tablas y estados
```

`H` depende de `F` y del modelo de dirección de `G`. `J` depende de `I`, `G` y del stock del catálogo. `K` no se inició hasta que `F`–`J` tuvieron contrato y pruebas. `N` reutiliza la sesión de `F` y la bodega creada en `H`.

---

## 8. Fuera de alcance de esta entrega

- Reembolsos, cancelaciones posteriores al pago y logística inversa.
- Resolución automática de pagos `DESCONOCIDO` (reconciliación).
- Subida binaria de imágenes: `BLOQUEADO`; solo referencias URL persistentes.
- Ajustes negativos y movimientos logísticos del vendedor: `BLOQUEADO`; solo `INGRESO`.
- Preparación, empaque y despacho del vendedor: reservados a logística.
- Entrega digital (`PUB-06`): estructura no definida por el SDD.
- Variantes comerciales.
- Reportes administrativos del supervisor: `BLOQUEADO` (`L-19`); no hay catálogo, fórmulas, filtros ni límites aprobados.
- Recuperación de contraseña, MFA y proveedores de identidad externos.
- Pasarelas de pago reales.
- Despliegue productivo.

Estas capacidades no se muestran como funcionales en la interfaz ni se declaran terminadas.

---

## 9. Riesgos y mitigaciones

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
| IDOR en recursos del vendedor | Acceso a datos ajenos | `sellerId` de la sesión; filtro SQL; `404` fuera de alcance |
| Reintento de ingreso duplica stock | Inventario inflado | Idempotencia por `(vendedor_id, idempotency_key)` y bloqueo asesor |
| Supervisor con permisos de escritura | Alteración de datos operativos | Guarda `405` en todo el prefijo, adaptador solo `SELECT` y E2E sin formularios |
| Supervisor accede a datos personales | Exposición innecesaria | Vistas minimizadas y pruebas de ausencia de campos |
| KPIs inventados en el dashboard | Decisiones sobre datos falsos | Solo conteos directos y `INV-03`; reportes `BLOQUEADO` (`L-19`) |

---

## 10. Próximos pasos sugeridos

1. Ejecutar CI en GitHub y registrar evidencia; corregir fallos si aparecen.
2. Decidir la reconciliación de pagos `DESCONOCIDO`.
3. Definir con negocio el catálogo de reportes del supervisor (`L-19`); no implementar reportes hasta entonces.
4. Incorporar lint si el proyecto lo adopta.
5. Obtener decisión de arquitectura para almacenamiento de imágenes y entrega digital.
6. Evaluar reembolsos, logística inversa, ajustes negativos y variantes solo con contrato y decisiones explícitas.
