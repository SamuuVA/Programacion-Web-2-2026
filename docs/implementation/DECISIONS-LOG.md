# NexusMarket — Registro de decisiones V1

**Corte:** 2026-11-03
**Alcance:** decisiones tomadas para construir la primera entrega demostrable (persistencia real, catálogo público y frontend) y la segunda iteración (autenticación, direcciones, vendedores, carrito, checkout y CI).
**Regla:** una decisión solo está vigente si el código y las pruebas la sostienen. Las alternativas descartadas se conservan para evitar reabrirlas sin contexto.

---

## Resumen

| ID | Decisión | Estado | Evidencia |
|---|---|---|---|
| `DEC-V1-001` | Conservar TypeScript/Fastify/PostgreSQL | Vigente | `backend/package.json`, `backend/src/` |
| `DEC-V1-002` | PostgreSQL como único adaptador de ejecución | Vigente | `backend/src/config.ts`, `factory.ts`, guarda de arquitectura |
| `DEC-V1-003` | Conservar el puerto de comprador y mover el doble a pruebas | Vigente | `tests/support/fake-buyer-registration-store.ts` |
| `DEC-V1-004` | Catálogo V1 sin variantes comerciales | Vigente | `migrations/003_catalog.sql` |
| `DEC-V1-005` | Vendedor y primera bodega modelados para alta atómica futura | Vigente (esquema) | `sellers`, `warehouses` |
| `DEC-V1-006` | Perfiles relacionados con `User`, un rol principal | Vigente | `users`, `buyers`, `sellers` |
| `DEC-V1-007` | Visibilidad pública: producto `PUBLICADO` + vendedor `ACTIVO` | Vigente | `postgres-catalog-query-repository.ts` |
| `DEC-V1-008` | Disponibilidad física calculada; `null` para digital | Vigente | Consulta SQL de inventario |
| `DEC-V1-009` | Búsqueda insensible a mayúsculas y acentos | Vigente | `translate(lower(...))` |
| `DEC-V1-010` | Paginación por página; 12 por defecto, 48 máximo, 6 en la UI | Vigente | `ports.ts`, catálogo frontend |
| `DEC-V1-011` | Seed demo explícito, transaccional e idempotente | Vigente | `scripts/seed-demo.ts` |
| `DEC-V1-012` | Frontend con Server Components y cliente API solo servidor | Vigente | `lib/api/client.ts`, páginas |
| `DEC-V1-013` | Fronteras de carga por route group; detalle sin `loading.tsx` | Vigente | `app/(home)`, `products/(catalog)` |
| `DEC-V1-014` | UI honesta: sin carrito falso y sin datos inventados | Vigente | Detalle, estados vacíos/error |
| `DEC-V2-001` | Sesión opaca server-side (`ADR-004`) | Vigente | `sessions`, `session-tokens.ts`, rutas auth |
| `DEC-V2-002` | Dirección mínima de comprador (`L-01`) | Vigente | `005_buyer_addresses.sql`, `direccion-entrega.ts` |
| `DEC-V2-003` | Alta atómica de vendedor + bodega (`PI-02`) | Vigente | `POST /admin/sellers`, prueba de rollback |
| `DEC-V2-004` | Carrito persistente basado en producto, sin variantes | Vigente | `006_cart_checkout.sql`, `Carrito` |
| `DEC-V2-005` | Checkout por vendedor con reservas e idempotencia | Vigente | `checkout_attempts`, `inventory_reservations` |
| `DEC-V2-006` | Pago simulado con resultado desconocido explícito | Vigente | `PENDIENTE_DE_PAGO`/`PENDIENTE` |
| `DEC-V2-007` | Detección de cambio de precio con confirmación | Vigente | `precio_referencial_centavos`, `PRECIO_CAMBIADO` |
| `DEC-V2-008` | Frontend con Server Actions y cookie `HttpOnly` propia | Vigente | `features/auth/session.ts`, acciones |
| `DEC-V2-009` | `ApiError` en módulo neutral | Vigente | `lib/api/errors.ts` |
| `DEC-V2-010` | CI con validador OpenAPI offline y 4 jobs | Vigente (local) | `validate-openapi.ts`, `.github/workflows/ci.yml` |

---

## DEC-V1-001 — Conservar el stack existente

- **Contexto:** la solicitud mencionaba Go, pero el repositorio ya contenía un backend TypeScript/Node.js con Fastify, Zod, Vitest y PostgreSQL.
- **Decisión:** preservar el stack existente y ampliarlo; no reescribir en Go.
- **Alternativas descartadas:** reescritura completa en Go (pérdida de trabajo verificado, doble mantenimiento); capa Go parcial (dos runtimes sin beneficio demostrable).
- **Consecuencias:** se mantiene una sola cadena de build, pruebas y despliegue. La deuda de autenticación y CI sigue siendo la misma.
- **Evidencia:** `backend/package.json`, `backend/src/app.ts`, `backend/tests/**`.

## DEC-V1-002 — PostgreSQL obligatorio y eliminación del modo memoria

- **Contexto:** existía `PERSISTENCE=memory` y un almacén en memoria que podía perder datos al reiniciar.
- **Decisión:** eliminar `PERSISTENCE`; `DATABASE_URL` es obligatoria y el servidor no arranca sin ella. El único adaptador de ejecución es PostgreSQL.
- **Alternativas descartadas:** mantener memoria como modo de desarrollo (contradice la prioridad de persistencia real); memoria opt-in por bandera (deja una ruta de pérdida de datos).
- **Consecuencias:** el arranque exige PostgreSQL; las pruebas que necesitan un doble usan uno explícito de pruebas. `tests/unit/persistence-architecture.test.ts` impide reintroducir `PERSISTENCE` o el almacén en memoria en `src/`.
- **Evidencia:** `backend/src/config.ts`, `backend/src/infrastructure/factory.ts`, `backend/tests/unit/persistence-architecture.test.ts`, reinicio real con `SELECT count(*) = 1`.

## DEC-V1-003 — Puerto de comprador estable; doble solo en pruebas

- **Contexto:** el caso de uso `RegisterBuyer` dependía de `BuyerRegistrationStore`.
- **Decisión:** conservar el puerto y el adaptador PostgreSQL; mover el comportamiento en memoria a `tests/support/fake-buyer-registration-store.ts`.
- **Alternativas descartadas:** borrar el puerto y acoplar el caso de uso a `pg` (rompe hexagonal); mantener el doble en `src/` (vuelve a exponer una ruta de producción).
- **Consecuencias:** el caso de uso sigue siendo testeable sin base; la producción solo compone PostgreSQL.
- **Evidencia:** `backend/src/modules/buyers/application/**`, `backend/src/modules/buyers/infrastructure/postgres-buyer-registration-store.ts`, `backend/tests/support/fake-buyer-registration-store.ts`.

## DEC-V1-004 — Catálogo V1 sin variantes comerciales

- **Contexto:** el modelo documental contempla variantes, pero V1 necesita un catálogo demostrable y acotado.
- **Decisión:** cada producto es una combinación vendible independiente con `sku`, `precio_centavos`, `moneda`, imágenes y tipo de entrega propios. No hay tablas de variantes.
- **Alternativas descartadas:** variantes completas (multiplica tablas, validaciones y UI sin necesidad para la primera entrega); variantes simuladas en el frontend (datos falsos).
- **Consecuencias:** publicar “talla M” y “talla L” exige dos productos. La migración y el contrato no prometen variantes.
- **Evidencia:** `backend/migrations/003_catalog.sql`, `backend/src/modules/catalog/domain/producto.ts`, `backend/openapi.yaml`.

## DEC-V1-005 — Vendedor y bodega listos para alta atómica

- **Contexto:** el requisito indica que el Administrador crea al vendedor junto con su primera bodega, de forma atómica.
- **Decisión:** modelar `sellers` y `warehouses` con FK y una restricción que exige `vendedor_id` para bodegas `VENDEDOR` y lo prohíbe para `MARKETPLACE`. La creación atómica se implementará cuando exista autenticación administrativa; el esquema ya la soporta.
- **Alternativas descartadas:** crear vendedores sin bodega (viola el requisito); permitir bodegas huérfanas (inconsistencia de propiedad).
- **Consecuencias:** no se declara implementado `PI-02`; solo se preparó la persistencia. El seed usa la misma forma.
- **Evidencia:** `backend/migrations/003_catalog.sql` (`warehouses_propietario`), `backend/scripts/seed-demo.ts`.

## DEC-V1-006 — Perfiles relacionados con `User`, sin herencia

- **Contexto:** comprador y vendedor comparten identidad pero tienen datos y estados distintos.
- **Decisión:** `buyers` y `sellers` son tablas de perfil con FK a `users`; no hay herencia de tablas ni roles múltiples simultáneos en V1. Un usuario tiene un rol principal.
- **Alternativas descartadas:** tabla única con columnas opcionales (mezcla invariantes); herencia PostgreSQL (rigidez y migraciones costosas).
- **Consecuencias:** el backend es autoridad de permisos y estados; el frontend no decide roles.
- **Evidencia:** `backend/migrations/001_initial.sql`, `backend/migrations/003_catalog.sql`, `backend/src/modules/buyers/domain/**`.

## DEC-V1-007 — Regla de visibilidad pública

- **Contexto:** el catálogo público no debe exponer borradores, productos suspendidos ni vendedores inactivos.
- **Decisión:** una consulta pública solo devuelve productos con `estado = 'PUBLICADO'` cuyo vendedor tiene `estado = 'ACTIVO'`.
- **Alternativas descartadas:** filtrar en el frontend (bypass de la regla); exponer todo y ocultar con CSS (fuga de datos).
- **Consecuencias:** un producto puede existir y no ser visible; el detalle responde `404`, no `403`, para no revelar su existencia.
- **Evidencia:** `backend/src/modules/catalog/infrastructure/postgres-catalog-query-repository.ts`, `catalog-http.test.ts`, `catalog-query-postgres.test.ts`.

## DEC-V1-008 — Disponibilidad y productos digitales

- **Contexto:** el catálogo necesita mostrar stock sin reservar ni vender todavía.
- **Decisión:** `disponible` es la suma de `on_hand - reserved - unavailable` en bodegas `ACTIVA`, con mínimo 0. Para `tipo_entrega = 'DIGITAL'` se devuelve `null`.
- **Alternativas descartadas:** mostrar `on_hand` bruto (ignora reservas y daños); mostrar `0` para digital (sugiere falta de stock inexistente).
- **Consecuencias:** el frontend distingue “sin stock” de “no aplica”. La reserva real llegará con checkout.
- **Evidencia:** consulta SQL de catálogo; `ProductSummary.disponible` documentado en `ports.ts` y OpenAPI.

## DEC-V1-009 — Búsqueda insensible a acentos

- **Contexto:** el catálogo en español debe encontrar “lampara” al buscar “Lámpara”.
- **Decisión:** normalizar con `translate(lower(...))` sobre nombre y descripción, reemplazando vocales acentuadas y `ñ`.
- **Alternativas descartadas:** `ILIKE` simple (falla con acentos); extensión `unaccent` (dependencia adicional no instalada).
- **Consecuencias:** la búsqueda es determinista y portable en PostgreSQL 17 sin extensiones. No hay búsqueda difusa ni ranking.
- **Evidencia:** `postgres-catalog-query-repository.ts`; smoke `search=lampara` devuelve 1 resultado.

## DEC-V1-010 — Paginación

- **Contexto:** el catálogo demo tiene 8 productos y se necesita demostrar paginación real.
- **Decisión:** paginación por página con `page` (≥ 1) y `pageSize` (1–48); default de API 12; la interfaz usa 6 para que la segunda página tenga 2 productos.
- **Alternativas descartadas:** cursor (más complejo sin necesidad); cargar todo (no demuestra paginación).
- **Consecuencias:** `totalPages` se calcula con mínimo 1. Cambiar el tamaño de página en la UI no altera el contrato de la API.
- **Evidencia:** `backend/src/modules/catalog/application/ports.ts`, `frontend/src/app/products/(catalog)/page.tsx`.

## DEC-V1-011 — Seed demo explícito

- **Contexto:** se necesitaban datos para demostrar el catálogo sin inventar respuestas en la API.
- **Decisión:** `npm run db:seed:demo` escribe 2 vendedores, 2 bodegas, 8 productos, 8 imágenes y 6 filas de inventario en PostgreSQL, dentro de una transacción, con `ON CONFLICT ... DO UPDATE`. No se ejecuta automáticamente al arrancar.
- **Alternativas descartadas:** datos hardcodeados en el frontend (no demuestran persistencia); seed automático en producción (efecto secundario peligroso).
- **Consecuencias:** la demo es reproducible y repetible. Los productos usan IDs fijos `40000000-...-0001` a `...-0008`.
- **Evidencia:** `backend/scripts/seed-demo.ts`; conteos reales 8/2/8/6.

## DEC-V1-012 — Server Components y cliente API solo servidor

- **Contexto:** el frontend no debe exponer la URL interna ni credenciales, y el catálogo es de solo lectura.
- **Decisión:** las páginas son Server Components por defecto; `frontend/src/lib/api/client.ts` se ejecuta solo en el servidor y usa `API_URL` (no `NEXT_PUBLIC_*`). El cliente centraliza timeout, `no-store`, correlación y conversión a `ApiError`.
- **Alternativas descartadas:** fetch desde el navegador (expone la API y duplica estados); datos embebidos (no reflejan PostgreSQL).
- **Consecuencias:** el navegador solo recibe HTML/CSS/JS de Next.js. Las mutaciones futuras requerirán Server Actions o rutas propias.
- **Evidencia:** `frontend/src/lib/api/client.ts`, `frontend/src/app/**`, `BACKEND-FRONTEND-DEPENDENCIES.md`.

## DEC-V1-013 — Fronteras de carga y 404 real

- **Contexto:** un `loading.tsx` en el segmento de detalle hacía que un producto inexistente devolviera `200` con esqueleto antes del `notFound()`.
- **Decisión:** usar route groups `(home)` y `products/(catalog)` para acotar los esqueletos; el detalle no tiene `loading.tsx`. `notFound()` se evalúa en `generateMetadata` y en la página.
- **Alternativas descartadas:** un `loading.tsx` global (rompe el 404); redirección a home (oculta el error).
- **Consecuencias:** home y catálogo muestran esqueleto; detalle inexistente responde HTTP `404` con UI propia.
- **Evidencia:** `frontend/src/app/(home)/loading.tsx`, `frontend/src/app/products/(catalog)/loading.tsx`, `frontend/src/app/products/[productId]/not-found.tsx`; smoke `404`.

## DEC-V1-014 — UI honesta y defensa ante IDs inválidos

- **Contexto:** el alcance no incluye carrito ni pagos, y un UUID malformado en la URL no debe producir un error 400 visible.
- **Decisión:** validar el formato del ID en el cliente con `isProductId()` y tratarlo como no encontrado; no mostrar botones de carrito/compra; el detalle explica que esas capacidades llegan después. Los estados vacíos y de error no sustituyen datos.
- **Alternativas descartadas:** botón “Añadir al carrito” deshabilitado o simulado (promesa falsa); llamar a la API con cualquier texto y mostrar `400` (mala experiencia).
- **Consecuencias:** la interfaz refleja solo capacidades reales. Un ID válido pero inexistente sigue devolviendo `404` desde la API.
- **Evidencia:** `frontend/src/app/products/[productId]/page.tsx`, `frontend/src/features/catalog/**`, smoke de ID malformado.

---

## DEC-V2-001 — Sesión opaca server-side (`ADR-004`)

- **Contexto:** el marketplace necesita identidad verificable sin proveedores externos, y el cliente no puede declarar `actorId`/rol.
- **Decisión:** token aleatorio de 256 bits; solo se guarda su hash SHA-256 en `sessions`; TTL de 8 horas; cookie `nexus_session` `HttpOnly`/`SameSite=Lax`; se acepta `Authorization: Bearer` para API y pruebas; logout y expiración revocan.
- **Alternativas descartadas:** JWT firmado sin estado (revocación difícil y secreto adicional); identidad enviada por el cliente (suplantación); proveedor externo (requisito de funcionamiento local).
- **Consecuencias:** el backend es la única autoridad de sesión y rol. El frontend guarda el token en su propia cookie y lo reenvía como bearer.
- **Evidencia:** `backend/migrations/004_identity_sessions.sql`, `src/shared/infrastructure/session-tokens.ts`, `src/modules/identity/**`, `tests/unit/login-user.test.ts`, `tests/integration/marketplace-http.test.ts`.

## DEC-V2-002 — Dirección mínima de comprador (`L-01`)

- **Contexto:** `PI-02` y el checkout necesitaban una composición de dirección que no inventara reglas.
- **Decisión:** campos mínimos `destinatario`, `telefono`, `linea1`, `linea2?`, `ciudad`, `region`, `codigoPostal?`, `pais` ISO-3166-1 alpha-2; una principal por comprador vía índice único parcial; al eliminar la principal se promueve la más antigua; el pedido guarda un snapshot JSON inmutable.
- **Alternativas descartadas:** cadena opaca (no validable); dirección compartida entre compradores (fuga de datos); recalcular desde la dirección viva (pedidos históricos mutables).
- **Consecuencias:** checkout exige dirección para productos físicos; los pedidos conservan la dirección aunque se edite después.
- **Evidencia:** `backend/migrations/005_buyer_addresses.sql`, `src/modules/buyers/domain/direccion-entrega.ts`, `tests/postgres/marketplace-postgres.test.ts`.

## DEC-V2-003 — Alta atómica de vendedor + primera bodega (`PI-02`)

- **Contexto:** el requisito exige que un administrador cree vendedor y primera bodega en una sola operación.
- **Decisión:** `POST /api/v1/admin/sellers`, solo `ADMINISTRADOR` activo; una transacción PostgreSQL inserta `users` (rol `VENDEDOR`), `sellers`, `warehouses` y auditoría/outbox. Si falla la bodega, revierte todo. El cuerpo no declara identidad ni rol.
- **Alternativas descartadas:** crear vendedor sin bodega (viola la postcondición); endpoint público (inseguro); operación interna sin HTTP (no cubre el borde real).
- **Consecuencias:** se cierra el bloqueo histórico de `PI-02`; el autoregistro de vendedores sigue prohibido.
- **Evidencia:** `src/modules/sellers/**`, `tests/unit/register-seller.test.ts`, `tests/postgres/marketplace-postgres.test.ts` (éxito y rollback).

## DEC-V2-004 — Carrito persistente basado en producto

- **Contexto:** el carrito debía ser real y coherente con el catálogo sin variantes.
- **Decisión:** `carts`/`cart_items` con `producto_id`, `cantidad` y `precio_referencial_centavos`; sin variantes; el backend valida producto público, vendedor activo y cantidades.
- **Alternativas descartadas:** carrito en `localStorage` (no autoritativo, se pierde); variantes simuladas (fuera de V1); precios enviados por el cliente (fraude).
- **Consecuencias:** el carrito sobrevive reinicios y el checkout puede detectar cambios de precio.
- **Evidencia:** `backend/migrations/006_cart_checkout.sql`, `src/modules/cart/**`, `tests/unit/cart-use-cases.test.ts`.

## DEC-V2-005 — Checkout por vendedor con reservas e idempotencia

- **Contexto:** un carrito puede mezclar vendedores y los reintentos no deben duplicar pedidos.
- **Decisión:** un pedido por vendedor; reservas en `inventory_reservations`; `checkout_attempts` con único `(comprador_id, idempotency_key)`; la misma clave devuelve el mismo resultado.
- **Alternativas descartadas:** un pedido único multi-vendedor (complica envíos y ownership); crear pedido antes de reservar (sobreventa); ignorar idempotencia (duplicados).
- **Consecuencias:** el frontend conserva la clave en reintentos; las reservas se liberan exactamente una vez en rechazo.
- **Evidencia:** `src/modules/orders/infrastructure/postgres-checkout-store.ts`, `tests/postgres/marketplace-postgres.test.ts`.

## DEC-V2-006 — Pago simulado con resultado desconocido explícito

- **Contexto:** el resultado desconocido no puede tratarse como éxito ni como rechazo.
- **Decisión:** `resultadoPagoSimulado` acepta `CONFIRMADO`, `RECHAZADO`, `DESCONOCIDO`. Confirmado → `EN_PREPARACION`/`CAPTURADO`; rechazado → `CANCELADO`/`RECHAZADO`; desconocido → `PENDIENTE_DE_PAGO`/`PENDIENTE` y `202`.
- **Alternativas descartadas:** mapear desconocido a éxito (cobro no confirmado); mapearlo a rechazo (pierde una venta válida); reintentar automáticamente sin control (duplicados).
- **Consecuencias:** el pedido desconocido queda pendiente de reconciliación; no hay reembolsos ni logística inversa en esta etapa.
- **Evidencia:** `src/modules/orders/**`, `tests/postgres/marketplace-postgres.test.ts`, smoke HTTP real.

## DEC-V2-007 — Detección de cambio de precio

- **Contexto:** el precio puede cambiar entre agregar al carrito y confirmar.
- **Decisión:** comparar contra `cart_items.precio_referencial_centavos`; si cambió, `422 REGLA_NEGOCIO_INCUMPLIDA` con `motivo: "PRECIO_CAMBIADO"` salvo `confirmarPrecio: true`.
- **Alternativas descartadas:** cobrar el precio viejo (pérdida); cobrar el nuevo sin avisar (sorpresa); bloquear siempre (fricción innecesaria).
- **Consecuencias:** el frontend muestra el aviso y permite confirmar; la clave de idempotencia se conserva.
- **Evidencia:** `postgres-checkout-store.ts`, `checkout-form.tsx`, pruebas PostgreSQL y smoke HTTP.

## DEC-V2-008 — Frontend con Server Actions y cookie `HttpOnly` propia

- **Contexto:** el navegador no debe ver el token ni la URL interna de la API.
- **Decisión:** Server Actions para login/logout y mutaciones; el token se guarda en una cookie `HttpOnly` del frontend y se reenvía como bearer desde el servidor.
- **Alternativas descartadas:** exponer el token al cliente (XSS); llamar a la API desde el navegador (CORS y exposición); guardar el token en `localStorage`.
- **Consecuencias:** las guardas de ruta viven en el servidor; el backend sigue validando cada operación.
- **Evidencia:** `frontend/src/features/auth/**`, `frontend/src/app/login/`, smoke y E2E.

## DEC-V2-009 — `ApiError` en módulo neutral

- **Contexto:** importar `ApiError` desde `client.ts` arrastraba `server-only` a componentes cliente y rompía el build.
- **Decisión:** mover `ApiError` a `frontend/src/lib/api/errors.ts`; `client.ts` lo reexporta.
- **Alternativas descartadas:** duplicar la clase (deriva); quitar `server-only` (expone el cliente).
- **Consecuencias:** componentes cliente pueden tipar errores sin incluir el cliente de servidor.
- **Evidencia:** `frontend/src/lib/api/errors.ts`, `client.ts`, `action-state.ts`, build de producción.

## DEC-V2-010 — CI con validador OpenAPI offline

- **Contexto:** se necesitaba validación reproducible sin depender de un servicio externo.
- **Decisión:** script propio con la dependencia `yaml` ya presente; workflow con cuatro jobs (backend estático, tests, PostgreSQL y frontend).
- **Alternativas descartadas:** Spectral (dependencia adicional); solo pruebas de contrato (no valida sintaxis/estructura); CI sin migraciones (no prueba PostgreSQL real).
- **Consecuencias:** la validación corre localmente y en CI; el lint sigue sin herramienta y se declara `BLOCKED`.
- **Evidencia:** `backend/scripts/validate-openapi.ts`, `.github/workflows/ci.yml`, `npm run validate:openapi`.

---

## Decisiones pendientes

| Tema | Estado | Por qué importa |
|---|---|---|
| Reconciliación de pagos `DESCONOCIDO` | Pendiente | El pedido queda pendiente; falta consulta o reintento controlado |
| Reembolsos y logística inversa | Fuera de alcance | Requieren decisión de negocio y contrato propio |
| Lint (ESLint/Biome) | `BLOCKED` | No hay herramienta configurada |
| Ejecución de CI en GitHub | `READY_FOR_REVIEW` | El workflow existe y es válido, pero no se ejecutó en remoto |
| Subida de imágenes y variantes | Pendiente | Fuera de V1 por decisión |

Estas decisiones no se resuelven por conveniencia en este corte.

