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
| `DEC-V2-032` | Espacio administrativo separado de supervisión, solo lectura salvo las altas existentes | Vigente | `modules/admin/`, `admin-routes.ts` |
| `DEC-V2-033` | Guarda de método admin con allowlist de escritura | Vigente | `admin-routes.ts`, `admin-http.test.ts` |
| `DEC-V2-034` | Dashboard y reportes admin solo con agregados reales derivables | Vigente | `postgres-admin-store.ts`, `admin-postgres.test.ts` |
| `DEC-V2-035` | Minimización de datos en las vistas administrativas | Vigente | `ports.ts`, `postgres-admin-store.ts` |
| `DEC-V2-036` | `/admin/sellers` como lista y alta en `/admin/sellers/new` | Vigente | `frontend/src/app/admin/sellers/` |
| `DEC-V2-037` | Registro público reutiliza `registerBuyer`; el rol lo fija el backend | Vigente | `POST /api/v1/buyers`, `frontend/src/features/registration/` |
| `DEC-V2-038` | Solicitud de vendedor como agregado separado del estado de acceso | Vigente | `migrations/009_seller_applications.sql`, `modules/seller-applications/` |
| `DEC-V2-039` | Una sola solicitud `PENDIENTE` por usuario; reenvío tras rechazo sin definir | Vigente | Índice único parcial; UI sin reenvío |
| `DEC-V2-040` | La promoción conserva la identidad y el perfil/historial de comprador | Vigente | Aprobación actualiza `users.rol` sin crear otra cuenta |
| `DEC-V2-041` | Aprobación atómica e idempotente de vendedor + primera bodega | Vigente | `postgres-seller-application-store.ts`, prueba PostgreSQL |
| `DEC-V2-042` | Rechazo sin efectos de incorporación y sin cambiar el acceso | Vigente | `reject`, pruebas unitarias/HTTP/PostgreSQL |
| `DEC-V2-043` | Estados de acceso con tabla de transiciones explícita | Vigente | `update-user-access-status.ts`, `422` con `transicionInvalida` |
| `DEC-V2-044` | Desactivar/bloquear revoca sesiones; autogestión prohibida | Vigente | `postgres-user-access-store.ts`, E2E |
| `DEC-V2-045` | ESLint y Prettier integrados; CI de 5 jobs con E2E | Vigente (local) | `eslint.config.mjs`, `.prettierrc.json`, `ci.yml` |

> Las decisiones `DEC-V2-011` a `DEC-V2-031` están documentadas en las secciones siguientes; esta tabla se actualizó de forma incremental.

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

## DEC-V2-011 — Espacio del vendedor reutiliza la sesión y aplica ownership en el backend

- **Contexto:** el vendedor ya existe y puede iniciar sesión, pero no tenía portal ni rutas propias; no se debía crear una autenticación paralela.
- **Decisión:** reutilizar `SessionAuthenticator` y la cookie existente. El `sellerId` se deriva siempre de la sesión autenticada; el cuerpo y la URL nunca lo declaran. Toda consulta y mutación filtra por `vendedor_id`. Un recurso de otro vendedor responde `404`, no `403`, para no revelar su existencia.
- **Alternativas descartadas:** autenticación separada para vendedores (duplica seguridad); confiar en el `sellerId` del cliente (IDOR); responder `403` (filtra existencia).
- **Consecuencias:** el vendedor no puede operar fuera de su ámbito cambiando identificadores; el frontend no decide permisos.
- **Evidencia:** `backend/src/modules/seller-workspace/interfaces/http/seller-workspace-routes.ts`, `tests/integration/seller-workspace-http.test.ts`, `tests/postgres/seller-workspace-postgres.test.ts`, E2E de aislamiento.

## DEC-V2-012 — Ciclo de vida del producto con `BORRADOR` y transiciones aprobadas

- **Contexto:** el esquema solo admitía estados comerciales y no permitía crear un producto antes de publicarlo.
- **Decisión:** añadir `BORRADOR` como fase de creación reconocida por el SDD §7.1. Transiciones permitidas: `BORRADOR → PUBLICADO`, `PUBLICADO → SUSPENDIDO`, `SUSPENDIDO → PUBLICADO` (revalidando SKU e imagen) y `PUBLICADO/SUSPENDIDO → DESCONTINUADO`. `DESCONTINUADO` es terminal. Publicar exige SKU no vacío, al menos una imagen y vendedor `ACTIVO`.
- **Alternativas descartadas:** publicar al crear (viola la revisión); reactivar `DESCONTINUADO` (no aprobado); suspender sin transición explícita (estado ambiguo).
- **Consecuencias:** el catálogo público solo muestra `PUBLICADO`; suspender no publica automáticamente y descontinuar no reactiva.
- **Evidencia:** `backend/migrations/007_seller_workspace.sql`, `src/modules/seller-workspace/domain/producto-vendedor.ts`, `tests/unit/seller-workspace.test.ts`, smoke del vendedor.

## DEC-V2-013 — Imágenes como referencias URL persistentes; carga binaria bloqueada

- **Contexto:** publicar exige imágenes, pero el SDD rechaza `FileStorage` y no existe proveedor ni límites de tamaño/formato aprobados.
- **Decisión:** persistir referencias URL en `product_images` con ownership por producto y `alt` opcional. No se implementa carga binaria ni almacenamiento temporal en memoria.
- **Alternativas descartadas:** guardar archivos en el sistema de archivos local (no persistente ni aprobado); inventar límites o un proveedor (no autorizado); publicar sin imagen (viola la regla).
- **Consecuencias:** el vendedor puede publicar con URLs válidas; la carga binaria queda `BLOQUEADO` hasta que exista decisión de arquitectura.
- **Evidencia:** `backend/migrations/003_catalog.sql`, `007_seller_workspace.sql`, `src/modules/seller-workspace/**`, `seller-image-manager.tsx`.

## DEC-V2-014 — Inventario del vendedor: solo ingreso atómico e idempotente

- **Contexto:** la matriz §19 autoriza «operaciones autorizadas de su ámbito», pero no detalla ajustes negativos ni movimientos logísticos.
- **Decisión:** exponer únicamente `INGRESO` sobre producto físico propio y bodega activa propia. La mutación es transaccional: actualiza `inventory` y registra `inventory_movements` con actor, referencia y motivo. La idempotencia usa `(vendedor_id, idempotency_key)` y un bloqueo asesor por clave. El stock nunca queda negativo.
- **Alternativas descartadas:** permitir ajustes negativos sin política (riesgo de descuadre); mutar stock sin movimiento (pierde trazabilidad); idempotencia solo en memoria (no sobrevive reinicios).
- **Consecuencias:** el vendedor no puede alterar movimientos logísticos ni reservas; los ajustes negativos quedan pendientes de autorización explícita.
- **Evidencia:** `007_seller_workspace.sql`, `postgres-seller-workspace-store.ts`, `tests/postgres/seller-workspace-postgres.test.ts`, smoke 33/33.

## DEC-V2-015 — Pedidos del vendedor en solo lectura

- **Contexto:** el vendedor necesita ver pedidos con sus productos, pero la matriz §19 reserva preparación/despacho a logística y prohíbe confirmar pagos.
- **Decisión:** `GET /seller/orders` y `GET /seller/orders/{orderId}` filtran por productos del vendedor y devuelven solo la información necesaria. No se exponen mutaciones de estado, pago, reembolso ni logística.
- **Alternativas descartadas:** permitir cambiar el estado del pedido (invade logística); mostrar pedidos de otros vendedores (IDOR); ocultar el pedido completo (impide operar).
- **Consecuencias:** el vendedor consulta su operación sin asumir funciones ajenas.
- **Evidencia:** `seller-workspace-routes.ts`, `seller-workspace.test.ts`, `seller/orders/*`.

## DEC-V2-016 — Perfil del vendedor limitado a `nombreComercial`

- **Contexto:** el SDD no define todos los atributos comerciales editables ni sus políticas.
- **Decisión:** permitir consultar el perfil y actualizar solo `nombreComercial`. `razonSocial`, documentos y demás atributos no se inventan ni se exponen como editables.
- **Alternativas descartadas:** habilitar todos los campos (sin política); impedir toda edición (no cubre la necesidad mínima).
- **Consecuencias:** la edición es segura y acotada; los atributos faltantes quedan documentados como pendientes.
- **Evidencia:** `seller-profile-form.tsx`, `seller-workspace-routes.ts`, `seller-workspace.test.ts`.

## DEC-V2-017 — Clave de idempotencia de ingreso generada en el cliente tras montar

- **Contexto:** una clave derivada de `useId` se repetía entre cargas de página y el backend deduplicaba ingresos nuevos como si fueran reintentos.
- **Decisión:** generar `crypto.randomUUID()` en un `useEffect` al montar el formulario y deshabilitar el envío hasta tener la clave.
- **Alternativas descartadas:** `useId` (no es única por intención); clave generada en el servidor (no distingue reintentos de envíos nuevos); clave fija (deduplica todo).
- **Consecuencias:** cada intención de ingreso tiene su propia clave; un reintento real conserva la misma clave y no duplica stock.
- **Evidencia:** `seller-ingress-form.tsx`, smoke de idempotencia, E2E del recorrido del vendedor.

## DEC-V2-018 — Registro servidor de errores de aplicación 5xx

- **Contexto:** un `503` intermitente no dejaba rastro suficiente para diagnosticarlo y el cliente no debe recibir detalles internos.
- **Decisión:** en `app.ts`, registrar con `request.log.error` todo `ApplicationError` con estado 5xx, manteniendo la respuesta pública sin `detalles` para `DEPENDENCIA_NO_DISPONIBLE`.
- **Alternativas descartadas:** exponer la causa al cliente (filtra información); no registrar (dificulta el diagnóstico); registrar todos los 4xx (ruido).
- **Consecuencias:** los fallos de dependencia son diagnosticables en el servidor sin ampliar la superficie de información.
- **Evidencia:** `backend/src/app.ts`; ejecución del smoke y E2E posteriores.

## DEC-V2-019 — Ámbito del operador logístico por bodegas asignadas

- **Contexto:** el modelo §13.1 asigna `bodega_origen_id` al envío y la matriz §19 limita al operador a «su ámbito»; no define un `operador_id` dentro de `shipments`.
- **Decisión:** el ámbito se representa con `logistics_operators` y la tabla puente `logistics_operator_warehouses`. El operador solo consulta y opera pedidos, reservas y envíos cuya bodega de origen esté asignada. No se añade `operador_id` a `shipments`: el vínculo se deriva de la bodega. Un recurso fuera del ámbito responde `404`, no `403`.
- **Alternativas descartadas:** añadir `operador_id` al envío (duplica la fuente de verdad y contradice el modelo); confiar en un identificador enviado por el cliente (IDOR); responder `403` (filtra existencia).
- **Consecuencias:** un operador puede tener varias bodegas y compartirlas con otro; el backend valida el ámbito en cada lectura y mutación. El seed demo asigna al operador las bodegas de Aurora y Nido.
- **Evidencia:** `backend/migrations/008_logistics.sql`, `src/modules/logistics/infrastructure/postgres-logistics-store.ts`, `tests/postgres/logistics-postgres.test.ts`, `backend/scripts/seed-demo.ts`.

## DEC-V2-020 — Preparación solo con pago confirmado y reservas activas

- **Contexto:** el flujo aprobado exige que la preparación ocurra después del pago y con inventario reservado; el checkout deja el pedido en `EN_PREPARACION` y las reservas en `ACTIVA`.
- **Decisión:** `POST /logistics/orders/{orderId}/prepare` exige pedido en `PAGADO` o `EN_PREPARACION`, bodega asignada y reservas `ACTIVA` de esa bodega. Crea el envío en `PREPARACION` con las líneas reservadas, registra el evento y deja el pedido en `EN_PREPARACION`. No se inventan reservas, transportistas ni envíos.
- **Alternativas descartadas:** preparar sin reservas (descuadra inventario); permitir preparar pedidos no pagados (salta el flujo); crear un envío vacío (oculta la falta de stock).
- **Consecuencias:** sin reservas activas la operación falla con `SIN_RESERVAS`; un segundo envío para la misma bodega y pedido falla con `ENVIO_YA_PREPARADO`.
- **Evidencia:** `src/modules/logistics/application/use-cases.ts`, `src/modules/logistics/domain/envio.ts`, `postgres-logistics-store.ts`, `tests/unit/logistics.test.ts`, E2E logístico.

## DEC-V2-021 — Despacho con consumo de reservas y salida de inventario

- **Contexto:** despachar sin mover inventario dejaría stock y reservas inconsistentes; el modelo exige una salida de venta trazable.
- **Decisión:** el despacho exige un envío en `PREPARACION`/`EMPACADO` y un pedido `PAGADO`/`EN_PREPARACION`. Por cada línea valida que las reservas activas cubran la cantidad, descuenta `on_hand` y `reserved`, marca las reservas como `CONSUMIDA` con `consumida_en` y registra un movimiento `SALIDA_VENTA` con actor, envío y clave de idempotencia. El pedido pasa a `DESPACHADO` solo cuando no quedan envíos en `PREPARACION`/`EMPACADO` ni reservas activas.
- **Alternativas descartadas:** descontar solo `on_hand` (deja reservas colgadas); marcar el pedido como despachado con otros envíos pendientes (estado falso); mover inventario sin movimiento (pierde trazabilidad).
- **Consecuencias:** el stock nunca queda negativo; un despacho parcial mantiene el pedido en preparación hasta completar el resto.
- **Evidencia:** `postgres-logistics-store.ts`, `src/modules/logistics/domain/envio.ts`, `tests/postgres/logistics-postgres.test.ts`, E2E logístico.

## DEC-V2-022 — Entrega con evidencia obligatoria y pedido `ENTREGADO` solo al completar todo

- **Contexto:** el modelo exige evidencia de entrega y no define el cierre del pedido; marcar `ENTREGADO` con envíos pendientes sería incorrecto.
- **Decisión:** `POST /logistics/shipments/{shipmentId}/delivery` acepta `ENTREGADO` o `FALLIDO`. Para `ENTREGADO` exige tipo y referencia de evidencia; para `FALLIDO` exige motivo y lo conserva como referencia. La evidencia se persiste en `delivery_evidence`. El pedido pasa a `ENTREGADO` solo si todos sus envíos están `ENTREGADO` y no quedan reservas activas. `ENTREGADO → CERRADO` no se implementa.
- **Alternativas descartadas:** permitir entrega sin evidencia (incumple PI-18); cerrar el pedido automáticamente (sin actor/proceso aprobado); marcar `ENTREGADO` con envíos fallidos o pendientes (estado falso).
- **Consecuencias:** un fallo deja el envío en `FALLIDO` y el pedido no avanza; el cierre queda bloqueado hasta que se defina su actor y proceso.
- **Evidencia:** `src/modules/logistics/domain/envio.ts`, `postgres-logistics-store.ts`, `tests/unit/logistics.test.ts`, `frontend/e2e/logistics.spec.ts`.

## DEC-V2-023 — Idempotencia logística por operador y tipo de operación

- **Contexto:** reintentos de red no deben duplicar envíos, salidas de inventario ni evidencias; la idempotencia solo en memoria no sobrevive reinicios.
- **Decisión:** `logistics_operations` guarda `(operador_id, tipo, idempotency_key)` con unicidad y referencia al envío. Cada mutación toma un bloqueo asesor por operador, tipo y clave. Un reintento con los mismos datos devuelve `200` y el resultado previo; una clave reutilizada con otros datos falla con `IDEMPOTENCIA_CONFLICTO`.
- **Alternativas descartadas:** deduplicar en memoria (no persiste); usar solo la clave del cliente sin operador (colisiones entre operadores); ignorar reintentos (duplica stock y evidencia).
- **Consecuencias:** las tres operaciones son seguras ante reintentos; el frontend genera la clave al montar el formulario y la conserva durante el envío.
- **Evidencia:** `008_logistics.sql`, `postgres-logistics-store.ts`, `tests/postgres/logistics-postgres.test.ts`, `frontend/src/features/logistics/components/*.tsx`.

## DEC-V2-024 — Historial de estados del pedido con actor y referencia causal

- **Contexto:** el pedido cambiaba de estado sin dejar rastro de quién, cuándo ni por qué; el modelo §13.2 exige trazabilidad.
- **Decisión:** `order_status_history` registra `estado_previo`, `estado_nuevo`, `actor_id`, `actor_rol`, `ocurrido_en`, `referencia_tipo`, `referencia_id` y `correlation_id`. La logística escribe preparación, despacho y entrega. El checkout escribe `PENDIENTE_DE_PAGO → EN_PREPARACION` con referencia al pago cuando el resultado es `CONFIRMADO`, y `PENDIENTE_DE_PAGO → CANCELADO` cuando es `RECHAZADO`, resolviendo el actor desde `buyers.usuario_id`.
- **Alternativas descartadas:** inferir el historial de los eventos del envío (no cubre el checkout); registrar solo el estado nuevo (pierde la transición); dejar el actor nulo (impide auditar).
- **Consecuencias:** el detalle logístico muestra el historial real; los estados no se modifican sin dejar evidencia.
- **Evidencia:** `008_logistics.sql`, `src/modules/logistics/infrastructure/postgres-logistics-store.ts`, `src/modules/orders/infrastructure/postgres-checkout-store.ts`, `tests/postgres/logistics-postgres.test.ts`.

## DEC-V2-025 — Frontend logístico con guardas de servidor y Server Actions

- **Contexto:** el operador necesita un portal, pero el navegador no debe decidir permisos ni manejar el token de la API.
- **Decisión:** las páginas `/logistics` usan Server Components con `requireLogistics()` y el token de la cookie `HttpOnly`; las mutaciones usan Server Actions que reenvían el bearer y muestran el error de la API. El frontend no filtra por ámbito por su cuenta: el backend sigue siendo la autoridad.
- **Alternativas descartadas:** llamar a la API desde el navegador (expone el token y duplica CORS); decidir permisos en el cliente (eludible); crear una autenticación paralela (duplica seguridad).
- **Consecuencias:** un comprador o anónimo es redirigido; un operador inactivo recibe el error de la API; la UI solo muestra las operaciones que el backend autoriza.
- **Evidencia:** `frontend/src/app/logistics/**`, `frontend/src/features/logistics/**`, `frontend/src/features/auth/session.ts`, E2E logístico.

## DEC-V2-026 — Límites explícitos del rol logístico

- **Contexto:** el modelo no define asignación automática de pedidos, integración con transportistas externos, tracking del proveedor ni el actor del cierre del pedido.
- **Decisión:** no se implementan esas capacidades. `transportista` y `tracking_number` son datos opcionales que solo registra el operador cuando los aporta; no se consulta ningún proveedor externo. `CloseOrder` (`ENTREGADO → CERRADO`) queda bloqueado hasta que exista una decisión de negocio sobre su actor y proceso. El alta de operadores es administrativa (`POST /api/v1/admin/logistics-operators`), sin autorregistro.
- **Alternativas descartadas:** inventar asignación o tracking (sin contrato); cerrar pedidos automáticamente (sin responsable); permitir autorregistro (fuera de `PI-02`).
- **Consecuencias:** el flujo termina en `ENTREGADO`; las capacidades pendientes se documentan como bloqueadas y no se declaran completas.
- **Evidencia:** `docs/implementation/IMPLEMENTATION-STATUS.md`, `orchestrator-state.md` (`L-23`), `src/modules/logistics/**`.

## DEC-V2-027 — Supervisor como módulo global de solo lectura, separado de vendedor y logística

- **Contexto:** los almacenes de vendedor y logística derivan su ámbito de la sesión (`sellerId`, `operadorId`) y filtran por bodegas propias. El supervisor necesita una vista global y no encaja en esos puertos.
- **Decisión:** crear `backend/src/modules/supervisor/` con un puerto `SupervisorStore` que solo expone lecturas globales y un adaptador PostgreSQL con únicamente `SELECT`. No se crea un repositorio universal ni se reescriben los módulos existentes; se reutilizan tablas, estados y reglas ya definidas.
- **Alternativas descartadas:** reutilizar el store del vendedor o del operador (su ámbito impediría la vista global); añadir un flag `esSupervisor` a los stores existentes (mezcla responsabilidades y multiplica condiciones); crear un repositorio genérico (abstracción prematura).
- **Consecuencias:** el módulo es independiente, auditable y sin métodos de escritura; cualquier intento de mutación no tiene código al que llegar.
- **Evidencia:** `backend/src/modules/supervisor/application/ports.ts`, `infrastructure/postgres-supervisor-store.ts`, `tests/unit/persistence-architecture.test.ts`.

## DEC-V2-028 — Guarda de método `405` en todo el prefijo `/api/v1/supervisor`

- **Contexto:** `SUP-01` exige que el supervisor no modifique nada; confiar solo en registrar rutas `GET` deja la puerta abierta a que una ruta futura añada escritura por descuido.
- **Decisión:** un hook `onRequest` sobre `/api/v1/supervisor` y `/api/v1/supervisor/*` rechaza cualquier método distinto de `GET`, `HEAD` u `OPTIONS` con `405 METODO_NO_PERMITIDO` y `Allow: GET, HEAD`, antes de resolver la sesión.
- **Alternativas descartadas:** depender solo de las rutas registradas (frágil ante cambios); ocultar botones en el frontend (no es una garantía de backend).
- **Consecuencias:** la restricción es estructural y verificable incluso para rutas inexistentes; un `POST` anónimo recibe `405`, no `401`.
- **Evidencia:** `backend/src/modules/supervisor/interfaces/http/supervisor-routes.ts`, `tests/integration/supervisor-http.test.ts`, `frontend/e2e/supervisor.spec.ts`.

## DEC-V2-029 — `ADMINISTRADOR` no hereda el rol de supervisor

- **Contexto:** el prompt menciona un perfil de supervisión y el sistema ya tiene administración; asumir que el administrador “ya puede ver todo” ampliaría permisos sin decisión explícita.
- **Decisión:** `requireSupervisor()` exige rol `SUPERVISOR` y usuario `ACTIVO`. No hay `override` para `ADMINISTRADOR` ni para ningún otro rol.
- **Alternativas descartadas:** permitir administrador (mezcla responsabilidades y amplía la superficie sin aprobación); permitir cualquier rol activo (anula la autorización).
- **Consecuencias:** el administrador es redirigido igual que un comprador; el aislamiento se prueba en E2E.
- **Evidencia:** `backend/src/modules/identity/interfaces/http/session.ts`, `frontend/src/features/auth/session.ts`, `tests/integration/supervisor-http.test.ts`, `frontend/e2e/supervisor.spec.ts`.

## DEC-V2-030 — Minimización de datos personales en las vistas de supervisión

- **Contexto:** la supervisión necesita contexto operativo, no datos personales de compradores, vendedores ni actores.
- **Decisión:** las vistas omiten nombre, teléfono y dirección del comprador; correo y documento del vendedor; dirección de entrega; identificadores y nombres de actores; y la referencia del proveedor de pago. Se publican identificadores operativos, roles, estados, nombre comercial del vendedor y datos de inventario.
- **Alternativas descartadas:** reutilizar los DTO de comprador o vendedor (exponen datos que el supervisor no necesita); anonimizar en el frontend (el dato ya viajó).
- **Consecuencias:** el backend no envía esos campos y las pruebas verifican su ausencia.
- **Evidencia:** `backend/src/modules/supervisor/application/ports.ts`, `infrastructure/postgres-supervisor-store.ts`, `tests/postgres/supervisor-postgres.test.ts`.

## DEC-V2-031 — Dashboard con conteos directos y reportes bloqueados (`L-19`)

- **Contexto:** el prompt pide indicadores y reportes, pero el SDD no define catálogo, fórmulas, filtros ni límites (`L-19`). Inventar porcentajes, metas, SLA, rankings o proyecciones produciría datos falsos.
- **Decisión:** el dashboard solo muestra conteos directos de estados definidos y la suma de inventario `disponible = on_hand - reserved - unavailable` (`INV-03`). No se implementan endpoints ni pantallas de reportes; la interfaz muestra “No disponibles” y registra el bloqueo.
- **Alternativas descartadas:** inventar KPIs o fórmulas (datos sin respaldo); mostrar datos de ejemplo (confunde con datos reales); omitir el bloqueo en la UI (el usuario supondría que no existe).
- **Consecuencias:** todo número mostrado es verificable con SQL; los reportes quedan pendientes de definición de negocio.
- **Evidencia:** `backend/src/modules/supervisor/application/ports.ts`, `frontend/src/app/supervisor/page.tsx`, `docs/implementation/IMPLEMENTATION-STATUS.md`.

## DEC-V2-032 — Espacio administrativo separado de supervisión, solo lectura salvo las altas existentes

- **Contexto:** el administrador ya existía para las altas de vendedor y operador logístico; se pidió ampliar su espacio sin duplicar servicios ni ampliar permisos por conveniencia.
- **Decisión:** se crea el módulo `admin` con 17 consultas `GET` bajo `/api/v1/admin/*`. Las únicas escrituras siguen siendo `POST /admin/sellers` y `POST /admin/logistics-operators`. El espacio admin no reutiliza el módulo de supervisión ni concede acceso a otros roles.
- **Alternativas descartadas:** dar al administrador acceso global implícito (amplía la superficie sin decisión); duplicar los casos de uso del supervisor (doble mantenimiento y divergencia).
- **Consecuencias:** el administrador consulta usuarios, vendedores, compradores, bodegas, catálogo, inventario, pedidos, pagos y reportes; no modifica entidades.
- **Evidencia:** `backend/src/modules/admin/application/use-cases.ts`, `interfaces/http/admin-routes.ts`, `tests/integration/admin-http.test.ts`.

## DEC-V2-033 — Guarda de método admin con allowlist de escritura

- **Contexto:** un espacio de consulta debe rechazar escrituras aunque la ruta no exista, para no depender de la navegación del cliente.
- **Decisión:** bajo `/api/v1/admin/*` solo se permiten `GET`, `HEAD` y `OPTIONS`; `POST` se permite exclusivamente en `/admin/sellers` y `/admin/logistics-operators`. Cualquier otro método responde `405 METODO_NO_PERMITIDO` con `Allow`.
- **Alternativas descartadas:** confiar en que las rutas no declaren otros métodos (una ruta futura podría exponer escritura por error); devolver `404` (oculta que el método está prohibido).
- **Consecuencias:** la restricción se prueba en HTTP y E2E, y no afecta las altas atómicas existentes.
- **Evidencia:** `backend/src/modules/admin/interfaces/http/admin-routes.ts`, `tests/integration/admin-http.test.ts`, `frontend/e2e/admin.spec.ts`.

## DEC-V2-034 — Dashboard y reportes admin solo con agregados reales derivables

- **Contexto:** `L-19` sigue sin catálogo de reportes, fórmulas, filtros ni límites. Inventar KPIs produciría datos falsos.
- **Decisión:** el dashboard y `GET /admin/reports` solo devuelven conteos por estado, montos de pagos capturados y suma de inventario disponible (`on_hand - reserved - unavailable`). No hay porcentajes, metas, SLA, rankings, proyecciones, comisiones ni comparaciones temporales. No hay exportaciones PDF/Excel/CSV.
- **Alternativas descartadas:** inventar fórmulas (datos sin respaldo); generar archivos sin contrato (formato y columnas no aprobados).
- **Consecuencias:** todo número es verificable con SQL; el catálogo de reportes queda pendiente de negocio.
- **Evidencia:** `backend/src/modules/admin/infrastructure/postgres-admin-store.ts`, `tests/postgres/admin-postgres.test.ts`, `frontend/src/app/admin/reports/page.tsx`.

## DEC-V2-035 — Minimización de datos en las vistas administrativas

- **Contexto:** el administrador necesita contexto operativo, no secretos ni datos personales innecesarios.
- **Decisión:** el adaptador omite `hash_credencial`, documentos, tokens de sesión, referencia del proveedor de pago, dirección completa y `actor_id` de movimientos. El detalle de pedido solo expone `ciudad`, `region`, `pais` y `capturadoEn`.
- **Alternativas descartadas:** reutilizar DTO con todos los campos (el dato ya viajó); filtrar en el frontend (no reduce la exposición de la API).
- **Consecuencias:** las pruebas verifican la ausencia de esos campos.
- **Evidencia:** `backend/src/modules/admin/application/ports.ts`, `infrastructure/postgres-admin-store.ts`, `tests/postgres/admin-postgres.test.ts`.

## DEC-V2-036 — `/admin/sellers` como lista y alta en `/admin/sellers/new`

- **Contexto:** el espacio admin necesita una lista de vendedores y el formulario de alta ya existía en `/admin/sellers`; mantener ambos en la misma ruta impedía listar.
- **Decisión:** el formulario se mueve a `/admin/sellers/new` y `/admin/sellers` pasa a ser la lista. Las Server Actions revalidan `/admin/sellers`, `/admin/sellers/new` y `/admin`.
- **Alternativas descartadas:** poner la lista en `/admin/sellers/list` (URL menos natural); dejar el formulario en la lista (página mixta y difícil de probar).
- **Consecuencias:** el enlace de la cabecera apunta a `/admin`; el E2E de recorrido cruzado usa `/admin/sellers/new`.
- **Evidencia:** `frontend/src/app/admin/sellers/`, `frontend/src/features/sellers/actions.ts`, `frontend/e2e/cross-role.spec.ts`.

## DEC-V2-037 — Registro público reutiliza el caso de uso existente

- **Contexto:** el comprador ya podía crearse mediante `registerBuyer`; la fase necesitaba exponerlo al público sin duplicar la lógica ni abrir el rol a la petición.
- **Decisión:** reutilizar `RegisterBuyer` y `POST /api/v1/buyers`. El cuerpo declara identidad, documento y credencial; el rol `COMPRADOR` y el estado `ACTIVO` los fija el backend. La transacción crea `users`, `buyers`, `carts`, dirección principal, auditoría y outbox.
- **Alternativas descartadas:** un endpoint de registro nuevo (duplicación); aceptar `rol` desde el navegador (escalamiento de privilegios); crear la cuenta sin perfil o sin carrito (estado parcial).
- **Consecuencias:** el frontend `/register` no decide permisos; el login sigue siendo el único mecanismo de sesión.
- **Evidencia:** `backend/src/modules/buyers/**`, `frontend/src/features/registration/**`, `frontend/e2e/identity-onboarding.spec.ts`.

## DEC-V2-038 — Solicitud de vendedor separada del estado de acceso

- **Contexto:** el estado de acceso (`ACTIVO`, `INACTIVO`, `BLOQUEADO`) describe la cuenta, no el avance de una solicitud comercial.
- **Decisión:** crear `seller_applications` con estados propios `PENDIENTE`, `APROBADA` y `RECHAZADA`, más fechas, revisor, motivo, `seller_id` y `warehouse_id`. No se reutiliza el estado del usuario.
- **Alternativas descartadas:** añadir estados de solicitud a `users` (mezcla conceptos); usar `PENDIENTE` como estado de acceso (inventa un estado no aprobado).
- **Consecuencias:** una cuenta `BLOQUEADA` puede tener una solicitud pendiente sin que eso la habilite; la autorización de envío exige comprador `ACTIVO`.
- **Evidencia:** `backend/migrations/009_seller_applications.sql`, `backend/src/modules/seller-applications/domain/solicitud-vendedor.ts`.

## DEC-V2-039 — Una sola solicitud pendiente; reenvío sin definir

- **Contexto:** la documentación no define si un comprador puede reenviar o editar tras un rechazo.
- **Decisión:** permitir como máximo una solicitud `PENDIENTE` por usuario mediante índice único parcial. El backend no bloquea una nueva solicitud después de una `RECHAZADA`, pero la interfaz no ofrece reenvío y la política queda registrada como pendiente.
- **Alternativas descartadas:** prohibir toda nueva solicitud (inventa una política); permitir varias pendientes (duplica revisión); habilitar edición (no hay contrato).
- **Consecuencias:** si negocio define el reenvío, se implementará con una decisión explícita y probablemente una nueva restricción.
- **Evidencia:** índice `seller_applications_pendiente_unica`, `SubmitSellerApplication`, página `/seller-application`.

## DEC-V2-040 — Promoción sobre la misma identidad

- **Contexto:** un usuario tiene un único rol principal y `buyers`/`sellers` son perfiles relacionados, no herencia.
- **Decisión:** la aprobación conserva `users.id`, no crea una segunda cuenta y no elimina `buyers` ni el historial de pedidos. Cambia `users.rol` a `VENDEDOR`; el perfil de comprador permanece como dato histórico y no concede permisos de comprador.
- **Alternativas descartadas:** crear un usuario nuevo (duplica identidad e historial); borrar el perfil de comprador (pierde trazabilidad); mantener dos roles principales (rompe la regla del dominio).
- **Consecuencias:** las autorizaciones dependen del rol principal vigente y del estado de acceso; el acceso a `/seller` funciona con la misma sesión tras la aprobación.
- **Evidencia:** `ApproveSellerApplication`, `postgres-seller-application-store.ts`, E2E de aprobación.

## DEC-V2-041 — Aprobación atómica e idempotente

- **Contexto:** la incorporación crea varias filas en agregados distintos y debe resistir reintentos.
- **Decisión:** una única transacción PostgreSQL crea `sellers`, la primera `warehouses`, actualiza `users.rol`, marca la solicitud `APROBADA`, registra revisor, auditoría y outbox. Solo se aprueba desde `PENDIENTE`; un reintento sobre `APROBADA` devuelve `sellerId` y `warehouseId` existentes con `yaAprobada: true`.
- **Alternativas descartadas:** transacciones separadas (deja solicitud aprobada sin vendedor); compensación manual (mayor complejidad); crear vendedor provisional al solicitar (el dominio no lo contempla).
- **Consecuencias:** un fallo en cualquier paso revierte todo; no se duplican vendedores ni bodegas.
- **Evidencia:** `backend/src/modules/seller-applications/infrastructure/postgres-seller-application-store.ts`, `seller-applications-postgres.test.ts` (atomicidad, reintento y rollback por auditoría).

## DEC-V2-042 — Rechazo sin efectos de incorporación

- **Contexto:** el rechazo debe comunicar una decisión sin alterar la cuenta del comprador.
- **Decisión:** exigir `motivo`, marcar `RECHAZADA`, registrar revisor y auditoría. No se crea vendedor ni bodega y no se cambia el estado de acceso ni el estado comercial del comprador. Rechazar una solicitud ya rechazada es idempotente; una `APROBADA` no puede rechazarse.
- **Alternativas descartadas:** desactivar al comprador (castiga el rechazo); borrar la solicitud (pierde trazabilidad); permitir rechazar una aprobada (inconsistencia).
- **Consecuencias:** el comprador conserva su cuenta y puede seguir operando como comprador.
- **Evidencia:** `RejectSellerApplication`, `seller-applications.test.ts`, `seller-applications-http.test.ts`, E2E de rechazo.

## DEC-V2-043 — Estados de acceso y transiciones explícitas

- **Contexto:** `UserManagementService.md` documenta `ACTIVO`, `INACTIVO` y `BLOQUEADO`, pero no todas las transiciones ni sus consecuencias.
- **Decisión:** implementar la tabla `ACTIVO→INACTIVO`, `ACTIVO→BLOQUEADO`, `INACTIVO→ACTIVO`, `BLOQUEADO→ACTIVO`, `INACTIVO→BLOQUEADO`; `BLOQUEADO→INACTIVO` queda prohibida. `DESACTIVAR` y `BLOQUEAR` exigen motivo; `ACTIVAR` y `DESBLOQUEAR` lo admiten opcional. Una transición inválida responde `422 REGLA_NEGOCIO_INCUMPLIDA` con `detalles.transicionInvalida`.
- **Alternativas descartadas:** añadir `PENDIENTE`, `SUSPENDIDO` o `ELIMINADO` (sin decisión de dominio); permitir cualquier transición (inconsistencia); crear un código de error nuevo (el contrato ya cubre la regla).
- **Consecuencias:** el catálogo de estados permanece cerrado y auditable; la UI solo ofrece las acciones derivadas de la tabla, pero el backend revalida.
- **Evidencia:** `backend/src/modules/identity/application/update-user-access-status.ts`, `update-user-access-status.test.ts`, `admin-routes.ts`.

## DEC-V2-044 — Revocación de sesiones y autogestión prohibida

- **Contexto:** ocultar el menú no impide que una sesión vigente siga operando.
- **Decisión:** al pasar a `INACTIVO` o `BLOQUEADO`, revocar las sesiones activas de la cuenta en la misma transacción. `GetSession` ya rechaza estados distintos de `ACTIVO`, por lo que la sesión deja de servir de inmediato. Un administrador no puede cambiar su propio estado ni aprobar/rechazar su propia solicitud.
- **Alternativas descartadas:** confiar solo en el frontend (bypass); añadir JWT/denylist (incompatible con sesiones opacas); esperar la expiración natural (deja acceso indebido).
- **Consecuencias:** el usuario debe iniciar sesión de nuevo tras reactivarse; otro administrador debe gestionar la cuenta propia.
- **Evidencia:** `backend/src/modules/identity/infrastructure/postgres-user-access-store.ts`, `seller-applications-postgres.test.ts`, E2E de estado de acceso.

## DEC-V2-045 — Lint, formato y CI ampliado

- **Contexto:** el proyecto tenía TypeScript estricto pero ningún lint ni formato, y el CI no cubría E2E.
- **Decisión:** añadir ESLint 10 con `typescript-eslint` en ambos proyectos, reglas de Next/React Hooks en frontend y Prettier en backend. Ampliar `verify` del backend con `lint` y `format:check`. El workflow pasa a 5 jobs e incluye un E2E con PostgreSQL, backend, frontend y Chromium.
- **Alternativas descartadas:** Biome (herramienta nueva sin necesidad); solo TypeScript (no cubre hooks ni reglas de Next); E2E fuera del CI (menor cobertura).
- **Consecuencias:** el CI tarda más; la ejecución remota quedó verificada en el run `42749289978` (5/5 jobs).
- **Evidencia:** `backend/eslint.config.mjs`, `frontend/eslint.config.mjs`, `backend/.prettierrc.json`, `.github/workflows/ci.yml`.

## DEC-V2-046 — E2E determinista sobre una base recién sembrada

- **Contexto:** la base demo no incluye pedidos y los estados vacíos repiten palabras de los encabezados; el E2E no debe depender de datos locales acumulados.
- **Decisión:** la suite administrativa crea un pedido real con el comprador demo usando el mismo checkout de la aplicación, usa `exact: true` en encabezados ambiguos y busca por filtro en lugar de asumir la primera página.
- **Alternativas descartadas:** sembrar pedidos artificiales en el seed (datos inventados); ordenar suites por dependencia (frágil); omitir las aserciones de detalle (menor cobertura).
- **Consecuencias:** el detalle administrativo se verifica también en CI y la suite es independiente del estado previo de la base.
- **Evidencia:** `frontend/e2e/admin.spec.ts`, run `42749289978`.

---

## Decisiones pendientes

| Tema | Estado | Por qué importa |
|---|---|---|
| Reconciliación de pagos `DESCONOCIDO` | Pendiente | El pedido queda pendiente; falta consulta o reintento controlado |
| Reembolsos y logística inversa | Fuera de alcance | Requieren decisión de negocio y contrato propio |
| Reenvío o edición tras rechazo | Pendiente | El backend solo impide solicitudes `PENDIENTE` duplicadas; la UI no ofrece reenvío |
| Notificaciones externas de decisión | Pendiente | No hay infraestructura de correo/mensajería aprobada; el resultado se consulta en la app |
| Ejecución de CI en GitHub | `PASS` | Run `42749289978`, 5/5 jobs correctos; los avisos de Node.js 20 y `ubuntu-latest` son de la plataforma |
| Subida binaria de imágenes | `BLOQUEADO` | Sin proveedor, mecanismo ni límites aprobados; se usan URLs |
| Ajustes negativos / movimientos logísticos del vendedor | `BLOQUEADO` | La matriz §19 no autoriza explícitamente; solo se implementó `INGRESO` |
| Preparación/despacho del vendedor | `NO_APLICA` | Reservado al operador logístico; pedidos de solo lectura |
| Asignación automática de pedidos | `BLOQUEADO` | `L-23`; no hay política aprobada |
| Transportistas externos, tracking integrado y evidencia del proveedor | `BLOQUEADO` | `L-23`; solo se registran datos opcionales aportados por el operador |
| Cierre de pedido `ENTREGADO → CERRADO` (`CloseOrder`) | `BLOQUEADO` | No hay actor ni proceso definido; el flujo termina en `ENTREGADO` |
| Entrega digital (`PUB-06`) | Pendiente | El SDD no define la estructura del recurso |
| Reportes administrativos del supervisor | `BLOQUEADO` (`L-19`) | Sin catálogo, fórmulas, filtros ni límites aprobados |
| Reportes del administrador | `PARCIAL` / `BLOQUEADO` (`L-19`) | Solo agregados reales directos; catálogo, fórmulas, filtros y exportaciones sin aprobar |
| Devoluciones, reembolsos y facturación | `BLOQUEADO` | Sin tablas de persistencia ni reglas de negocio aprobadas |
| Mutaciones admin de producto/inventario/pago | `BLOQUEADO` | No definidas ni autorizadas; el espacio admin es de consulta salvo las dos altas |
| Autoregistro público de comprador | Implementado | `DEC-V2-037`; el rol lo fija el backend |
| Solicitud comprador → vendedor | Implementado | `DEC-V2-038` a `DEC-V2-042`; revisión administrativa y aprobación atómica |
| Variantes comerciales | Fuera de V1 por decisión | Discrepancia con `CAT-02` registrada, no resuelta por invención |

Estas decisiones no se resuelven por conveniencia en este corte.

