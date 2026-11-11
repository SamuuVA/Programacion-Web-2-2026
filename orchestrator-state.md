# NEXUSMARKET — ORCHESTRATOR STATE

> **Propósito:** preservar el estado operativo verificable de la construcción del backend entre sesiones, interrupciones y cambios de agente.
>
> **Regla:** este archivo registra hechos comprobados. Todo estado debe poder contrastarse con archivos, commits, comandos o decisiones identificables.
>
> **Lectura vigente (2026-11-10):** las secciones 1–3, 9–11, el registro de incidencias, las evidencias 13–14 y las plantillas S-007…S-014 describen el estado actual. Las secciones 4–8 y las plantillas S-001…S-006 conservan el registro histórico de W0/W1 y pueden mencionar “sin backend”, el adaptador en memoria o la prueba PostgreSQL manual; no son el estado vigente.

---

## 0. Reglas para mantener este archivo

1. Leerlo antes de asignar o ejecutar tareas.
2. Actualizarlo al completar una tarea, aprobar/fallar un gate, tomar una decisión o detectar un bloqueo.
3. No marcar `DONE` sin comprobar artefactos y criterios de aceptación.
4. No marcar una prueba `PASS` si no se ejecutó.
5. No borrar decisiones, conflictos ni defectos históricos: cambiar estado y registrar resolución.
6. Si este archivo contradice el repositorio, prevalece el repositorio; registrar la discrepancia y reconciliar.
7. Mantener `NEXT_ACTION` ejecutable por otro agente sin rehacer toda la investigación.

---

## 1. Identificación del proyecto

| Campo | Valor |
|---|---|
| Proyecto | NexusMarket |
| Área | Backend |
| Versión del estado | 3.6 |
| Prompt aplicable | `prompt-orquestador-backend.md` (v1.0) |
| Stack objetivo | TypeScript, Node.js, PostgreSQL, Next.js, MongoDB, Docker |
| Rama Git comprobada | `main` |
| Commit HEAD comprobado | `dfa9fb4` (identidad y CI publicados); recuperación visual/tema verificada en local antes de confirmar |
| Fecha de actualización | 2026-11-10 |
| Agente coordinador actual | Backend Orchestrator (OpenCode / DeepSeek V4.1 Flash Free) |
| Revisor independiente | Sesiones `ses_e7b1c7ddaffepca7fRH5CGMyTx` (1.ª), `ses_e7b113275ffeeAZmlHtptxtOfT` (2.ª), `ses_e7b0b9ec9ffeC6278fXU0TKf9M` (3.ª: `PASS`) y `ses_e7a3f8c7fffehdXpxCqxD8gVkc` (4.ª: `PASS`) |
| Estado global | `IN_PROGRESS` (marketplace local con auth, direcciones, alta de vendedor, carrito, checkout, pago simulado, frontend, espacio del vendedor, operación logística, supervisión de solo lectura, espacio administrativo de consulta, registro público de comprador, solicitud comprador → vendedor, estados de acceso y tema claro/oscuro persistente; gates A–H, N, `GATE-V2-SELLER`, `GATE-V2-LOGISTICS`, `GATE-V2-SUPERVISOR`, `GATE-V2-ADMIN`, `GATE-V2-IDENTITY` y `GATE-RECUPERACION-VISUAL` en `PASS`; CI remoto `PASS` en el run `42749289978`) |
| Ola actual | V2: espacio del Vendedor, Operador Logístico, Supervisión, Administración e Identidad/onboarding — implementados y verificados; recuperación visual/tema y catálogo verificados localmente |
| Gate actual | `GATE-W0 = PASS`; `GATE-W1-01 = PASS`; `GATE-PI01-CODE = PASS`; `GATE-PI01-CONTRACT = PASS_WITH_CONSTRAINTS`; `GATE-PI01-POSTGRES = PASS`; `GATE-V1-A…H = PASS` (local); `GATE-V2-SELLER = PASS` (local); `GATE-V2-LOGISTICS = PASS` (local); `GATE-V2-SUPERVISOR = PASS` (local); `GATE-V2-ADMIN = PASS` (local); `GATE-V2-IDENTITY = PASS` (local + CI run `42749289978`); `GATE-RECUPERACION-VISUAL = PASS` (local) |
| Fuente de estado | Repositorio real + `backend/` + `frontend/` + PostgreSQL + `docs/implementation/*` + artefactos históricos `docs/backend/*` |

---

## 2. Estado ejecutivo

### 2.1 Objetivo vigente

Consolidar el marketplace con identidad completa: registro público de comprador, solicitud comprador → vendedor con revisión administrativa y gestión de estados de acceso. No se amplía a reportes con fórmulas, devoluciones/reembolsos/facturación ni cierre de pedidos sin contratos y decisiones de dominio.

### 2.2 Último hito comprobado

Corte del 2026-11-09: se completó la fase de **identidad y onboarding** (`GATE-V2-IDENTITY`). El backend reutiliza `RegisterBuyer` y `POST /api/v1/buyers` para el registro público (rol `COMPRADOR` fijado por el servidor) y añade el agregado `seller_applications` (migración `009`) con estados `PENDIENTE`/`APROBADA`/`RECHAZADA`, independiente del estado de acceso. La aprobación crea vendedor + primera bodega, cambia el rol principal a `VENDEDOR` y registra auditoría/outbox en una única transacción idempotente; el rechazo exige motivo y no crea vendedor ni bodega. `UpdateUserAccessStatus` implementa `ACTIVO`/`INACTIVO`/`BLOQUEADO` con transiciones explícitas, motivo obligatorio para desactivar/bloquear y revocación de sesiones en la misma transacción. El frontend añade `/register`, `/seller-application`, `/admin/seller-applications` (lista y detalle) y el formulario de estado en `/admin/users/[userId]`. Se incorporaron ESLint en ambos proyectos, Prettier en backend y un workflow de CI de 5 jobs con E2E. Ejecutados: backend `npm run verify` (23 archivos / 187 pruebas; OpenAPI 74 rutas / 83 operaciones / 984 referencias); `npm run test:postgres` 9 archivos / 46 pruebas; frontend lint/typecheck/build (56 rutas); E2E Playwright 10/10; CI remoto 5/5 jobs en el run `42749289978`. Evidencia en [`docs/implementation/IMPLEMENTATION-STATUS.md`](docs/implementation/IMPLEMENTATION-STATUS.md) y [`docs/implementation/EXECUTION-LOG.md`](docs/implementation/EXECUTION-LOG.md).

Corte del 2026-11-10: se completó la **recuperación visual y la auditoría integral** posterior al cambio de tema (`GATE-RECUPERACION-VISUAL`). El diagnóstico descartó un defecto del tema: los tokens CSS estaban completos (56 variables usadas, 0 sin definir) y el build era correcto. Las causas reales fueron PostgreSQL detenido (`503 DEPENDENCIA_NO_DISPONIBLE`) y un `next start` de 3001 sirviendo un CSS de un build anterior (`500`). Se restauró el servicio y se añadieron cobertura E2E de tema (`theme.spec.ts`, 3 pruebas) y reposición de stock por API real (`demo-stock.ts`). Evidencia: frontend lint 0 errores (2 avisos preexistentes), typecheck y build OK (56 rutas); E2E 13/13 en 3001 (4.6 min) y 3002 (11.2 min); backend `npm run verify` 23 archivos / 187 pruebas y PostgreSQL 9 archivos / 46 pruebas.

### 2.3 Trabajo en curso

- ID: cierre de la recuperación visual y del tema (`GATE-RECUPERACION-VISUAL`), posterior a `GATE-V2-IDENTITY`.
- Último corte ejecutado: frontend lint 0 errores, typecheck OK, build OK (56 rutas), E2E Playwright 13/13 en 3001 y 3002; backend `npm run verify` OK (23 archivos / 187 pruebas; OpenAPI 74 rutas / 83 operaciones / 984 referencias); PostgreSQL 46 pruebas / 9 archivos.
- Próximo trabajo: confirmar y publicar el corte de recuperación, revisión independiente y decisión de los bloqueos documentados.
- Bloqueo actual: reenvío/edición de solicitudes rechazadas sin política definida; reportes admin/supervisor sin catálogo/fórmulas/filtros/límites (`L-19`); devoluciones, reembolsos y facturación sin persistencia; asignación automática de pedidos, transportistas externos, tracking integrado, evidencia del proveedor y `CloseOrder` (`ENTREGADO → CERRADO`) sin actor/proceso definido. Carga binaria de imágenes, ajustes negativos/logística del vendedor, entrega digital y notificaciones externas siguen bloqueados o pendientes. CI remoto en `PASS` (run `42749289978`, 5/5 jobs).
- Riesgo operativo: espacio libre bajo en disco; ejecutar suites backend de forma secuencial.

### 2.4 Próxima acción exacta

**NEXT_ACTION — revisión independiente del corte de identidad; no ampliar capacidades bloqueadas**

1. Revisar el diff completo (identidad, onboarding, lint y CI). El workflow de CI ya se ejecutó en GitHub con resultado `PASS` (run `42749289978`, 5/5 jobs).
2. Decidir la política de reenvío/edición de solicitudes rechazadas antes de habilitarla; no inventar el comportamiento.
3. Decidir el actor y el proceso de `CloseOrder` (`ENTREGADO → CERRADO`) antes de implementar el cierre; no inventar un actor.
4. Definir con negocio el catálogo de reportes (`L-19`): métricas, fórmulas, filtros, límites y exportaciones. No crear endpoints ni pantallas adicionales hasta entonces.
5. Mantener fuera de alcance la asignación automática de pedidos, transportistas externos, tracking integrado y evidencia del proveedor (`L-23`).
6. Decidir la reconciliación de pagos `DESCONOCIDO` y obtener decisión de arquitectura para imágenes binarias y entrega digital (`PUB-06`).
7. No habilitar reembolsos, devoluciones, facturación, notificaciones externas ni mutaciones admin de producto/inventario/pago sin autorización explícita.

**Condición de finalización de la entrega actual:** código compilado, 187 pruebas backend, 46 PostgreSQL, OpenAPI válido, lint y formato, build de frontend y E2E 10/10. Cumplida localmente; CI y revisión independiente de esta entrega quedan pendientes.

### 2.5 Reconciliación del rol Vendedor (corte 2026-11-03)

**Fuentes aplicadas:** `BackendSDD/Domain/nexusmarket-domain-model.md` §6.4, §7.1, §8, §19, §21; `BackendSDD/Domain/services/politica-autorizacion-dominio.md`; `BackendSDD/Domain/services/politica-publicacion-catalogo.md`; `BackendSDD/Application/nexusmarket-output-ports.md`; código y migraciones reales.

| Capacidad / artefacto | Estado real al iniciar el corte | Evidencia o vacío | Decisión de este corte |
|---|---|---|---|
| Autenticación de vendedor y rol `VENDEDOR` | `COMPLETADO_VERIFICADO` | Login real de `aurora@nexusmarket.demo`; `GET /api/v1/auth/session` devuelve rol `VENDEDOR`; `requireSeller()` existe | Reutilizar la sesión existente; no crear autenticación paralela |
| Alta de vendedor solo por Administrador | `COMPLETADO_VERIFICADO` | `POST /api/v1/admin/sellers`; `PI-02`; prueba de rollback PostgreSQL | No reimplementar; el vendedor no se autorregistra |
| Perfil de vendedor (consulta/edición) | `PENDIENTE` | No hay rutas `/api/v1/seller/*` | Implementar consulta y edición limitada a `nombreComercial` |
| Crear/editar productos propios | `PENDIENTE` | Solo lectura pública en `catalog` | Implementar CRUD acotado al `sellerId` de la sesión |
| Ciclo `BORRADOR → PUBLICADO → SUSPENDIDO → DESCONTINUADO` | `PENDIENTE` | `products.estado` solo admite `PUBLICADO`, `SUSPENDIDO`, `DESCONTINUADO` | Migración `007`; transiciones del SDD §7.1; sin retorno desde `DESCONTINUADO` |
| SKU obligatorio y único para publicar | `PARCIAL` | `products_sku_unique` y `NOT NULL`; sin validación de publicación | Exigir SKU no vacío en la política de publicación |
| Imágenes obligatorias para publicar | `PARCIAL` | Tabla `product_images` con URL; seed usa rutas locales | Exigir al menos una imagen; URLs persistentes; carga binaria `BLOQUEADO` |
| Propiedad de imágenes y productos | `PENDIENTE` | Repositorio público no filtra por propietario | Filtro `vendedor_id = sellerId`; acceso cruzado responde `404` |
| Bodegas propias (listar/crear/editar) | `PENDIENTE` | Solo alta atómica en `PI-02` | Implementar alcance por `vendedor_id`; sin cambios de estado (`L-09` pendiente) |
| Inventario por producto + bodega | `PARCIAL` | Tabla `inventory` con `on_hand`, `reserved`, `unavailable`, `version` e invariantes | Implementar consulta e ingreso con transacción y bloqueo |
| Movimientos auditables de inventario | `PENDIENTE` | No existe `inventory_movements` | Crear tabla con actor, referencia, motivo e idempotencia |
| Idempotencia de mutaciones de stock | `PENDIENTE` | Solo `checkout_attempts` e `inventory_reservations` | Clave `(vendedor_id, idempotency_key)` + bloqueo asesor |
| Ajustes negativos y movimientos logísticos | `BLOQUEADO` | Matriz §19 solo autoriza «operaciones autorizadas de su ámbito»; no hay política explícita | No exponerlos; documentar el bloqueo |
| Consulta de pedidos con productos propios | `PENDIENTE` | `GET /api/v1/orders` es solo del comprador | Implementar lectura por `orders.vendedor_id`, sin datos de pago ajenos |
| Confirmar/rechazar pago o reembolsar | `NO_APLICA` | Matriz §19 prohíbe al vendedor | No implementar |
| Preparar/empacar/despachar | `NO_APLICA` | Matriz §19 reserva la operación a logística | Pedidos del vendedor en solo lectura |
| Aislamiento entre vendedores (IDOR) | `PENDIENTE` | No hay endpoints de vendedor | Todas las consultas y mutaciones filtran por `sellerId`; `404` fuera de alcance |
| Frontend `/seller` | `PENDIENTE` | No existe grupo de rutas ni navegación de vendedor | Implementar layout, páginas, formularios y estados |
| OpenAPI y pruebas de contrato | `PENDIENTE` | `openapi.yaml` 0.3.0 con 19 rutas | Extender a 0.4.0 y actualizar aserciones |
| Pruebas unitarias/HTTP/PostgreSQL del vendedor | `PENDIENTE` | No existen | Añadir unidad, integración HTTP y PostgreSQL |
| Lint | `BLOQUEADO` | No hay herramienta configurada | Mantener `BLOQUEADO`, no declarar `PASS` |
| CI en GitHub Actions | `PENDIENTE` | Workflow local validado, no ejecutado en GitHub | Mantener `READY_FOR_REVIEW` |

**Discrepancias registradas, no resueltas por invención:**

1. El SDD exige variantes (`CAT-02`); la decisión V1 y el código usan un producto por combinación vendible, sin variantes. Se aplica la decisión V1 y se registra la diferencia.
2. `FileStorage` está rechazado por el SDD y no existe política aprobada de tamaño/formato/proveedor. Las imágenes se persisten como URL; la carga binaria queda `BLOQUEADO`.
3. `PUB-06` exige un recurso de entrega digital, pero el SDD no define su estructura. No se inventa un campo; se documenta como pendiente.
4. El vendedor no tiene autorización explícita para ajustes negativos ni operaciones logísticas; solo se implementa `INGRESO` en su ámbito.

**Estado final del corte (2026-11-03), verificado con evidencia ejecutada:**

| Capacidad | Estado final | Evidencia |
|---|---|---|
| Perfil del vendedor | `COMPLETADO_VERIFICADO` | `GET/PATCH /seller/profile`; solo `nombreComercial`; prueba unitaria y smoke |
| Productos propios | `COMPLETADO_VERIFICADO` | CRUD acotado por `sellerId`; 18 rutas; pruebas HTTP y PostgreSQL |
| Ciclo `BORRADOR → PUBLICADO → SUSPENDIDO → DESCONTINUADO` | `COMPLETADO_VERIFICADO` | Migración `007`; transiciones en dominio; smoke y E2E |
| SKU e imágenes para publicar | `COMPLETADO_VERIFICADO` | Publicación `422` sin imagen y `200` con imagen; smoke |
| Imágenes por URL y ownership | `COMPLETADO_VERIFICADO` | `product_images`; alta/baja con ownership; prueba HTTP |
| Bodegas propias | `COMPLETADO_VERIFICADO` | Listar/crear/editar con alcance por vendedor; pruebas |
| Inventario e idempotencia | `COMPLETADO_VERIFICADO` | `inventory` + `inventory_movements`; bloqueo asesor; smoke de reintento |
| Aislamiento entre vendedores | `COMPLETADO_VERIFICADO` | `404` en acceso cruzado; prueba HTTP y E2E |
| Pedidos con productos propios | `COMPLETADO_VERIFICADO` | Solo lectura; filtro por productos del vendedor; pruebas |
| Frontend `/seller` | `COMPLETADO_VERIFICADO` | 18 rutas construidas; E2E 4/4 |
| OpenAPI y contrato | `COMPLETADO_VERIFICADO` | `0.4.0`; 33 rutas / 40 operaciones / 419 referencias; contrato 6 pruebas |
| Pruebas unitarias/HTTP/PostgreSQL | `COMPLETADO_VERIFICADO` | 11 unitarias, 7 HTTP, 7 PostgreSQL; suites completas |
| Ajustes negativos / movimientos logísticos | `BLOQUEADO` | Sin autorización explícita; no se exponen |
| Carga binaria de imágenes | `BLOQUEADO` | Sin mecanismo/proveedor/límites aprobados; solo URLs |
| Preparación/despacho | `NO_APLICA` | Reservado a logística; pedidos de solo lectura |
| Entrega digital (`PUB-06`) | `PENDIENTE` | Estructura no definida por el SDD |
| Lint | `BLOQUEADO` | Sin herramienta configurada |
| CI en GitHub | `READY_FOR_REVIEW` | Workflow local válido; no ejecutado en remoto |

`COMPLETADO_VERIFICADO` se usa aquí solo para capacidades con comando y resultado observados en este corte; no implica revisión independiente ni ejecución remota de CI.

### 2.6 Reconciliación del rol Operador Logístico (corte 2026-11-05)

**Fuentes aplicadas:** `BackendSDD/Domain/nexusmarket-domain-model.md` §13.1–§13.2, §19, §22.5; `BackendSDD/Domain/services/politica-autorizacion-dominio.md`; `BackendSDD/Application/nexusmarket-output-ports.md`; código y migraciones reales.

| Capacidad / artefacto | Estado final | Evidencia |
|---|---|---|
| Autenticación y rol `OPERADOR_LOGISTICO` | `COMPLETADO_VERIFICADO` | Login real de `logistica@nexusmarket.demo`; `requireLogistics()`; `GET /logistics/profile` |
| Perfil y ámbito de bodegas | `COMPLETADO_VERIFICADO` | `logistics_operators` + `logistics_operator_warehouses`; migración `008`; pruebas de ámbito |
| Bodegas e inventario autorizados | `COMPLETADO_VERIFICADO` | Consultas filtradas por bodegas asignadas; solo lectura de inventario |
| Pedidos y detalle en ámbito | `COMPLETADO_VERIFICADO` | Reservas activas de bodegas asignadas; `404` en acceso cruzado |
| Preparación de envío | `COMPLETADO_VERIFICADO` | Exige pedido pagado/en preparación y reservas activas; idempotente |
| Despacho | `COMPLETADO_VERIFICADO` | Consume reservas `ACTIVA → CONSUMIDA`, descuenta `on_hand`/`reserved`, registra `SALIDA_VENTA` |
| Entrega con evidencia | `COMPLETADO_VERIFICADO` | `ENTREGADO`/`FALLIDO`; evidencia obligatoria; pedido `ENTREGADO` solo si todo fue entregado |
| Historial de estados | `COMPLETADO_VERIFICADO` | `order_status_history` registra actor, rol, instantes y referencia causal; checkout y logística escriben transiciones reales |
| Frontend `/logistics` | `COMPLETADO_VERIFICADO` | Resumen, pedidos, detalle operable, bodegas e inventario; 22 rutas construidas |
| OpenAPI y contrato | `COMPLETADO_VERIFICADO` | `0.5.0`; 43 rutas / 50 operaciones / 544 referencias; contrato 6/6 |
| Pruebas unitarias/HTTP/PostgreSQL/E2E | `COMPLETADO_VERIFICADO` | 14 unitarias, 7 HTTP, 6 PostgreSQL, 1 E2E; suites completas |
| Asignación automática de pedidos | `BLOQUEADO` | `L-23`; no hay política aprobada |
| Transportistas externos, tracking integrado y evidencia del proveedor | `BLOQUEADO` | `L-23`; campos opcionales solo si el actor los aporta |
| `CloseOrder` (`ENTREGADO → CERRADO`) | `BLOQUEADO` | Sin actor/proceso definido; no se implementa |
| Lint / CI remoto | `BLOCKED` / `READY_FOR_REVIEW` | Sin herramienta de lint; workflow no ejecutado en GitHub |

### 2.7 Reconciliación del rol Supervisor (corte 2026-11-06)

**Fuentes aplicadas:** `BackendSDD/Domain/nexusmarket-domain-model.md` §6.4, §7.1, §8, §13.1–§13.2, §19, §22.5; `BackendSDD/Domain/services/politica-autorizacion-dominio.md`; `BackendSDD/Application/nexusmarket-output-ports.md`; `SUP-01`; código, migraciones y contrato reales.

| Capacidad / artefacto | Estado final | Evidencia |
|---|---|---|
| Rol `SUPERVISOR` en autenticación | `COMPLETADO_VERIFICADO` | `users.rol` admite `SUPERVISOR`; `requireSupervisor()` exige rol y usuario `ACTIVO`; login demo real |
| Perfil estrictamente de solo lectura (`SUP-01`) | `COMPLETADO_VERIFICADO` | Solo 9 rutas `GET`; guarda `405 METODO_NO_PERMITIDO` con `Allow: GET, HEAD` en todo el prefijo |
| Sin herencia de `ADMINISTRADOR` | `COMPLETADO_VERIFICADO` | `requireSupervisor()` no tiene override; E2E deniega a admin, comprador, vendedor y logística |
| Dashboard con datos reales | `COMPLETADO_VERIFICADO` | Conteos directos por estado y suma `on_hand - reserved - unavailable` (`INV-03`); sin porcentajes, metas, SLA, rankings ni proyecciones |
| Pedidos y detalle globales | `COMPLETADO_VERIFICADO` | `GET /supervisor/orders`, `/orders/{orderId}`; ítems, pago, reservas, envíos e historial |
| Productos y detalle globales | `COMPLETADO_VERIFICADO` | `GET /supervisor/products`, `/products/{productId}`; incluye `BORRADOR`, `SUSPENDIDO` y `DESCONTINUADO` |
| Almacenes, inventario, envíos y vendedores | `COMPLETADO_VERIFICADO` | Consultas globales con filtros y paginación |
| Minimización de datos personales | `COMPLETADO_VERIFICADO` | Se omiten comprador, correo/documento del vendedor, dirección, actores y referencia de pago; prueba PostgreSQL |
| Frontend `/supervisor` | `COMPLETADO_VERIFICADO` | Resumen, pedidos, productos, almacenes, inventario, envíos y vendedores; 29 rutas construidas; sin formularios |
| OpenAPI y contrato | `COMPLETADO_VERIFICADO` | `0.6.0`; 52 rutas / 59 operaciones / 647 referencias; contrato 6/6; sin escritura bajo el prefijo |
| Pruebas unitarias/HTTP/PostgreSQL/E2E | `COMPLETADO_VERIFICADO` | 5 unitarias, 9 HTTP, 3 PostgreSQL, 1 E2E; suites completas |
| Reportes administrativos | `BLOQUEADO` | `L-19`; sin catálogo, fórmulas, filtros ni límites aprobados |
| Lint / CI remoto | `BLOCKED` / `READY_FOR_REVIEW` | Sin herramienta de lint; workflow no ejecutado en GitHub |

---

### 2.8 Reconciliación del rol Administrador (corte 2026-11-08)

**Fuentes aplicadas:** `BackendSDD/Domain/nexusmarket-domain-model.md` §6, §19; `BackendSDD/Domain/services/politica-autorizacion-dominio.md`; código, migraciones y OpenAPI reales.

| Capacidad / artefacto | Estado real al iniciar el corte | Evidencia o vacío | Decisión de este corte |
|---|---|---|---|
| Autenticación y rol `ADMINISTRADOR` | `COMPLETADO_VERIFICADO` | Login real de `admin@nexusmarket.demo`; `GET /auth/session` devuelve `ADMINISTRADOR` | Reutilizar la sesión existente; no crear autenticación paralela |
| Alta atómica de vendedor + bodega | `COMPLETADO_VERIFICADO` | `POST /admin/sellers`; prueba de rollback PostgreSQL | Preservar sin cambios |
| Alta de operador logístico | `COMPLETADO_VERIFICADO` | `POST /admin/logistics-operators` | Preservar sin cambios |
| Consulta global de usuarios | `PENDIENTE` | No había rutas admin de lectura | Implementar `GET /admin/users` y detalle sin hashes ni tokens |
| Consulta de vendedores y compradores | `PENDIENTE` | Solo altas | Implementar listas y detalles con minimización de datos |
| Consulta de bodegas, catálogo e inventario | `PENDIENTE` | Solo rutas públicas, seller, logistics y supervisor | Implementar consultas admin de solo lectura |
| Consulta de pedidos y pagos | `PENDIENTE` | Solo ownership de comprador y vistas de otros roles | Implementar listas y detalle con dirección minimizada |
| Dashboard y reportes | `BLOQUEADO` (`L-19`) | Sin catálogo/fórmulas/filtros/límites | Dashboard y reportes solo con agregados reales directos; sin exportaciones |
| Guarda de método admin | `PENDIENTE` | No existía | `GET`/`HEAD`/`OPTIONS` salvo `POST` en las dos altas; resto `405` |
| Frontend `/admin` | `PARCIAL` | Solo formulario de alta en `/admin/sellers` | Layout protegido, dashboard, listas y detalles; alta en `/admin/sellers/new` |
| Mutaciones admin de producto/inventario/pago | `BLOQUEADO` | No definidas ni autorizadas | No implementar; el espacio admin es de consulta |
| Devoluciones, reembolsos y facturación | `BLOQUEADO` | Sin tablas de persistencia | Documentar ausencia; no crear pantallas vacías |
| Autoregistro de comprador / solicitud comprador → vendedor | `DEFERRED` | Sin flujo ni reglas de aprobación | Documentar dependencia; no implementar en esta fase |
| OpenAPI y pruebas de contrato | `PENDIENTE` | `openapi.yaml` 0.6.0 con 52 rutas | Extender a 0.7.0 (68 rutas / 76 operaciones / 904 referencias) |
| Pruebas admin | `PENDIENTE` | No existían | Unidad (5), HTTP (10) y PostgreSQL (3) |
| Lint | `BLOQUEADO` | Sin herramienta configurada | Mantener `BLOCKED` |
| CI en GitHub Actions | `PENDIENTE` | Workflow local validado, no ejecutado en GitHub | Mantener `READY_FOR_REVIEW` |

**Estado final del corte, verificado con evidencia ejecutada:**

| Capacidad | Estado final | Evidencia |
|---|---|---|
| Dashboard admin | `COMPLETADO_VERIFICADO` | `GET /admin/dashboard`; conteos y recientes reales; prueba PostgreSQL |
| Usuarios | `COMPLETADO_VERIFICADO` | `GET /admin/users` y detalle; sin hashes ni tokens; prueba HTTP/PostgreSQL |
| Vendedores y compradores | `COMPLETADO_VERIFICADO` | Listas y detalles; prueba HTTP/PostgreSQL |
| Bodegas y catálogo | `COMPLETADO_VERIFICADO` | Listas y detalles; prueba HTTP/PostgreSQL |
| Inventario y movimientos | `COMPLETADO_VERIFICADO` | `GET /admin/inventory` y `/movements`; sin `actor_id` |
| Pedidos y pagos | `COMPLETADO_VERIFICADO` | Listas y detalle; dirección minimizada; sin referencia del proveedor |
| Reportes | `PARCIAL` | Solo agregados reales; catálogo y exportaciones `BLOQUEADO` (`L-19`) |
| Guarda de método | `COMPLETADO_VERIFICADO` | `405` fuera de las altas; E2E y prueba HTTP |
| Frontend `/admin` | `COMPLETADO_VERIFICADO` | 20 rutas; typecheck/build; E2E |
| Altas existentes | `COMPLETADO_VERIFICADO` | Rutas y pruebas de rollback conservadas |
| Devoluciones/reembolsos/facturación | `BLOQUEADO` | Sin persistencia; documentado |
| Mutaciones admin | `BLOQUEADO` | No definidas ni autorizadas |
| Autoregistro / solicitud comprador → vendedor | `DEFERRED` | Dependencia documentada |

**Discrepancias y límites registrados, no resueltos por invención:**

1. `L-19` sigue sin catálogo de reportes; solo se implementaron agregados reales directos.
2. No existen tablas de devoluciones, reembolsos ni facturación; no se crean pantallas vacías.
3. El administrador no tiene autorización para mutar producto, inventario, pedido, pago, rol, vendedor ni bodega.
4. El autoregistro de comprador y la solicitud comprador → vendedor no tienen flujo ni reglas aprobadas; quedan diferidos.

### 2.9 Reconciliación de identidad y onboarding (corte 2026-11-09)

**Fuentes aplicadas:** `BackendSDD/Domain/nexusmarket-domain-model.md`, `BackendSDD/Domain/services/politica-autorizacion-dominio.md`, `BackendSDD/Domain/services/UserManagementService.md`, `FrontendSDD/07-buyer-ux-sdd.md`, `FrontendSDD/10-administrator-ux-sdd.md`; código, migraciones y OpenAPI reales.

| Capacidad / artefacto | Estado real al iniciar el corte | Evidencia o vacío | Decisión de este corte |
|---|---|---|---|
| Registro público de comprador | `PENDIENTE` | `RegisterBuyer` existía, pero no se exponía al público | Reutilizar el caso de uso; el backend fija `COMPRADOR` y `ACTIVO` |
| Solicitud comprador → vendedor | `DEFERRED` | Sin tabla, estados ni rutas | Crear `seller_applications` como agregado separado |
| Estados de solicitud | `PENDIENTE` | No existían | `PENDIENTE`, `APROBADA`, `RECHAZADA` |
| Aprobación administrativa | `PENDIENTE` | Solo alta directa `POST /admin/sellers` | Aprobación atómica e idempotente vendedor + primera bodega |
| Rechazo administrativo | `PENDIENTE` | No existía | Rechazo con motivo sin efectos de incorporación |
| Reenvío/edición tras rechazo | `PENDIENTE_DECISIÓN` | Sin política documentada | No implementar; registrar la decisión pendiente |
| Cambio de estado de acceso | `PARCIAL` | `users.estado` existía; sin operación administrativa | Implementar `UpdateUserAccessStatus` con tabla de transiciones |
| Revocación de sesiones | `PENDIENTE` | `GetSession` denegaba no-`ACTIVO`, pero no se revocaban sesiones | Revocar sesiones activas en la misma transacción |
| Autogestión administrativa | `PENDIENTE` | No había guarda | Prohibir autoaprobación/autorechazo y autocambio de estado |
| Frontend de registro y solicitud | `PENDIENTE` | Solo login y formularios existentes | `/register` y `/seller-application` |
| Frontend de revisión admin | `PENDIENTE` | Solo listas admin de consulta | Lista, detalle, aprobación y rechazo |
| OpenAPI | `0.7.0` | 68 rutas / 76 operaciones / 904 referencias | Extender a `0.8.0` (74 / 83 / 984) |
| Pruebas de identidad | `PENDIENTE` | No existían | Unidad (16), HTTP (11), PostgreSQL (6) y E2E (3) |
| Lint y formato | `BLOCKED` | Sin herramienta | ESLint en ambos proyectos y Prettier en backend |
| CI en GitHub Actions | `READY_FOR_REVIEW` | Workflow de 4 jobs, no ejecutado | Ampliar a 5 jobs con E2E; sigue sin ejecutarse en remoto |

**Estado final del corte, verificado con evidencia ejecutada:**

| Capacidad | Estado final | Evidencia |
|---|---|---|
| Registro público de comprador | `COMPLETADO_VERIFICADO` | `POST /api/v1/buyers`; rol fijado por backend; E2E de registro |
| Solicitud comprador → vendedor | `COMPLETADO_VERIFICADO` | `POST/GET /api/v1/buyer/seller-application`; prueba HTTP y PostgreSQL |
| Una solicitud `PENDIENTE` por usuario | `COMPLETADO_VERIFICADO` | Índice único parcial `seller_applications_pendiente_unica` |
| Aprobación atómica e idempotente | `COMPLETADO_VERIFICADO` | Transacción vendedor + bodega + rol + auditoría; reintento devuelve IDs existentes |
| Rechazo sin efectos | `COMPLETADO_VERIFICADO` | No crea vendedor ni bodega; no cambia el estado de acceso |
| Estados de acceso y transiciones | `COMPLETADO_VERIFICADO` | `UpdateUserAccessStatus`; `422` con `detalles.transicionInvalida` |
| Revocación de sesiones | `COMPLETADO_VERIFICADO` | Revocación transaccional; E2E de sesión revocada |
| Autogestión prohibida | `COMPLETADO_VERIFICADO` | Guarda de autoaprobación/rechazo y autocambio de estado |
| Frontend de identidad | `COMPLETADO_VERIFICADO` | `/register`, `/seller-application`, `/admin/seller-applications`; 56 rutas |
| OpenAPI `0.8.0` | `COMPLETADO_VERIFICADO` | 74 rutas / 83 operaciones / 984 referencias |
| Lint y formato | `COMPLETADO_VERIFICADO` local | ESLint 0 errores; Prettier limpio en backend |
| CI remoto | `COMPLETADO_VERIFICADO` | Run `42749289978`: 5/5 jobs correctos |
| Reenvío/edición tras rechazo | `PENDIENTE_DECISIÓN` | Backend solo impide `PENDIENTE` duplicadas; UI sin reenvío |
| Notificaciones externas | `NOT_IMPLEMENTED` | Sin infraestructura aprobada; resultado consultable en la app |

**Discrepancias y límites registrados, no resueltos por invención:**

1. La política de reenvío/edición tras un rechazo no está definida; solo se impide más de una solicitud `PENDIENTE`.
2. El perfil `buyers` se conserva tras la promoción, pero el rol principal `VENDEDOR` gobierna las autorizaciones; no se borra historial.
3. No se añadieron estados de acceso nuevos (`PENDIENTE`, `SUSPENDIDO`, `ELIMINADO`); el catálogo sigue cerrado.
4. No hay notificaciones externas de la decisión; no existe infraestructura de correo/mensajería aprobada.

---

## 3. Control de estado global

| Estado | Significado |
|---|---|
| `NOT_STARTED` | No iniciado. |
| `IN_PROGRESS` | Trabajo en ejecución. |
| `IN_REVIEW` | Entregables listos para verificación independiente. |
| `BLOCKED` | Impedimento que detiene el alcance afectado. |
| `PASS` / `FAIL` | Gate aprobado / verificación con incumplimientos. |
| `DONE` | Trabajo finalizado y aceptado. |
| `DEFERRED` / `CANCELLED` | Aplazado / cancelado explícitamente. |

**Vocabulario de incidencias (no es un gate):** `OPEN`, `PARTIALLY_RESOLVED`, `PENDING_DECISION`, `RESOLVED_AS_PLAN` y `RESOLVED_DOCUMENTARY` describen el estado de `CON-*`/`GAP-*`. `PARTIAL` describe una tarea entregada con residuo bloqueante. No equivalen a `PASS` ni autorizan implementación.

### 3.1 Progreso por ola

| Ola | Descripción | Estado | Gate |
|---|---|---|---|
| W0 | Inventario y baseline | `DONE` | `GATE-W0 = PASS` (2026-10-28) |
| W1 | Dominio y decisiones ejecutables | `IN_PROGRESS` (`W1-01` `DONE`; `W1-02`/`W1-03` documentales + prueba funcional; `W1-05`/`W1-06` implementados; `W1-04`/`W1-07` pendientes para el resto) | `GATE-W1 = NOT_RUN`; `GATE-W1-01 = PASS` |
| W2 | Arquitectura y propiedad de datos | `PARTIAL` (decisiones reversibles implementadas; ADR formales pendientes) | `GATE-W2 = NOT_RUN` |
| W3 | Contratos API/OpenAPI | `PARTIAL` (contrato de seis rutas y `openapi.test.ts`; sin validador semántico) | `GATE-W3 = NOT_RUN`; `GATE-PI01-CONTRACT = PASS_WITH_CONSTRAINTS`; `GATE-V1-C = PASS` |
| W4 | Fundación, persistencia y Docker | `PARTIAL` (config, HTTP, errores, health, PostgreSQL 17.11 con suite automatizada; sin modo memoria) | `GATE-W4 = NOT_RUN`; `GATE-PI01-POSTGRES = PASS`; `GATE-V1-A = PASS` |
| W5 | Casos de uso verticales | `PARTIAL` (`PI-01` + catálogo público; 51 pruebas; PostgreSQL automatizado) | `GATE-W5 = NOT_RUN`; `GATE-PI01-CODE = PASS`; `GATE-V1-B = PASS` |
| W6 | Integración y pruebas críticas | `PARTIAL` (smoke end-to-end local; sin CI ni e2e de navegador) | `GATE-W6 = NOT_RUN`; `GATE-V1-D = PASS`; `GATE-V1-E = PASS` local |
| W7 | Seguridad y robustez | `NOT_STARTED` | `GATE-W7 = NOT_RUN` |
| W8 | Documentación y release candidate | `NOT_STARTED` (documentación de implementación completa; sin release candidate) | `GATE-W8 = NOT_RUN` |
| V1 | Marketplace funcional (auth, direcciones, alta de vendedor, carrito, checkout, pago simulado, frontend) | `DONE` local | `GATE-V1-A…H = PASS` local |
| V2 | Espacio de trabajo del vendedor | `DONE` local | `GATE-V2-SELLER = PASS` local |
| V2-L | Operación logística (preparación, despacho, entrega, ámbito de bodegas) | `DONE` local | `GATE-V2-LOGISTICS = PASS` local |
| V2-S | Supervisión de solo lectura (dashboard, pedidos, productos, almacenes, inventario, envíos y vendedores) | `DONE` local | `GATE-V2-SUPERVISOR = PASS` local |
| V2-A | Espacio administrativo (dashboard, usuarios, vendedores, compradores, bodegas, catálogo, inventario, pedidos, pagos y reportes) | `DONE` local | `GATE-V2-ADMIN = PASS` local |
| V2-I | Identidad y onboarding (registro público, solicitud comprador → vendedor, revisión admin y estados de acceso) | `DONE` | `GATE-V2-IDENTITY = PASS` local + CI run `42749289978` |

---

## 4. Inventario de fuentes

Detalle completo en [`docs/backend/w0/01-inventory.md`](docs/backend/w0/01-inventory.md).

| ID | Fuente | Ruta real | Estado | Autoridad / uso |
|---|---|---|---|---|
| SRC-001 | Especificación funcional | `BackendSDD/enunciado.md` | `FOUND` | Requisitos `OBJ-01`…`OBJ-12`, `RG-01`…`RG-03` |
| SRC-002 | Modelo de dominio v2.0 | `BackendSDD/Domain/nexusmarket-domain-model.md` | `FOUND` | Agregados, invariantes, estados, `DD-01`…`DD-14` |
| SRC-003 | Objetos de valor | `BackendSDD/Domain/nexusmarket-domain-object-values.md` | `FOUND` | VOs, estados y validaciones |
| SRC-004 | Servicios y políticas | `BackendSDD/Domain/nexusmarket-domain-services.md` | `FOUND` | `DS-01`…`DS-09` |
| SRC-005 | Definiciones de servicios | `BackendSDD/Domain/services/*.md` | `FOUND` | Nueve documentos individuales |
| SRC-006 | Puertos de entrada | `BackendSDD/Application/nexusmarket-input-ports.md` | `FOUND` | `PI-01`…`PI-25` |
| SRC-007 | Puertos de salida | `BackendSDD/Application/nexusmarket-output-ports.md` | `FOUND` | `PO-01`…`PO-24` |
| SRC-008 | Casos de uso | `BackendSDD/Application/nexusmarket-use-cases-checkout-query-order.md` | `FOUND` | `UC-01`, `UC-02` |
| SRC-009 | Catálogo de adaptadores | `BackendSDD/Adapters/nexusmarket-adapters.md` | `FOUND` | `ADIN-01`, `ADOUT-01`…`ADOUT-13` |
| SRC-010 | Adaptadores individuales | `BackendSDD/Adapters/nexusmarket-adapter-*.md` | `FOUND` | 14 especificaciones |
| SRC-011 | Alineación de contratos | `BackendSDD/Contracts/nexusmarket-contract-alignment.md` | `FOUND` | `CT-01`…`CT-13` |
| SRC-012 | Estado documental | `BackendSDD/DOCUMENTATION_STATUS.md` | `FOUND` | `D-01`…`D-30`, `L-01`…`L-27` |
| SRC-013 | Arquitectura | `BackendSDD/Software Architecture/nexusmarket-arquitectura.md` | `FOUND` | Capas, persistencia, Docker, seguridad |
| SRC-014 | README | `README.md` | `FOUND` | Vista general y hoja de ruta |
| SRC-015 | Prompt maestro documental | `BackendSDD/Prompt-maestro-documentacion.md` | `FOUND` | Gobierno documental; no orquestación de agentes |

### 4.1 Fuentes solicitadas por el prompt que no existen

| Solicitada | Estado | Equivalente |
|---|---|---|
| `00-LEEME-INDICE.md` | `MISSING` | `README.md` |
| `01-negocio/01-alcance-y-decisiones.md` | `MISSING` | `BackendSDD/enunciado.md` + `DOCUMENTATION_STATUS.md` §9 |
| `nexusmarket-domain-sdd.md` | `MISSING` | `BackendSDD/Domain/nexusmarket-domain-model.md` |
| `nexusmarket-arquitectura-go.md` | `MISSING` | `BackendSDD/Software Architecture/nexusmarket-arquitectura.md` |
| `nexusmarket-prompt-maestro-agentes-concurrentes.md` | `MISSING` | `BackendSDD/Prompt-maestro-documentacion.md` (no equivalente exacto) |

**Estado W1-01:** `GAP-001 = PARTIALLY_RESOLVED`. Evaluación: `README.md` es índice suficiente; modelo + VOs + servicios cubren el SDD de dominio; la arquitectura TypeScript sustituye la referencia Go; `enunciado.md` + `DOCUMENTATION_STATUS.md` §9 cubren alcance/decisiones y Q1–Q4 ya están aprobadas; el prompt de agentes concurrentes no tiene equivalente. No se crearon archivos vacíos. El residuo de agentes concurrentes no bloquea la implementación. Detalle en [`docs/backend/w1/01-resolution-matrix.md`](docs/backend/w1/01-resolution-matrix.md) §3.5.

---

## 5. Baseline del repositorio

Detalle y comandos en [`docs/backend/w0/02-baseline.md`](docs/backend/w0/02-baseline.md).

| Verificación | Resultado real | Estado | Observaciones |
|---|---|---|---|
| Raíz del repositorio | Confirmada | `PASS` | Coincide con el directorio de trabajo |
| Rama Git | `main` | `PASS` | Sincronizada con `origin/main` |
| Commit HEAD | `badf0b1993c927d6713d85cd7b44eee8b4259a46` | `PASS` | `Version 2.0`, 2026-10-26 |
| Cambios sin commit | 14 archivos rastreados modificados; 3 entradas sin rastrear / 9 archivos | `PASS` | Modificaciones en `BackendSDD/` y `README.md`; sin rastrear `docs/backend/w0/` (4), `docs/backend/w1/` (3), `orchestrator-state.md` y `prompt-orquestador-backend.md` |
| Archivos rastreados | 38 (36 `.md`, `.gitignore`, `LICENSE`) | `PASS` | Repositorio documental |
| Node.js | `v24.21.0` | `PASS` | Runtime local |
| npm | `11.19.0` | `PASS` | — |
| Git | `2.51.0.windows.1` | `PASS` | — |
| Docker CLI | `29.8.0` | `PASS` (CLI) | Daemon no conecta |
| Docker Compose | `v5.5.1` | `PASS` (CLI) | No existe `compose.yaml` |
| Docker daemon | No conecta (`dockerDesktopLinuxEngine`) | `FAIL` | Bloquea W4/W6 |
| TypeScript (`tsc`) | No instalado | `NOT_INSTALLED` | No hay `tsconfig.json` |
| PostgreSQL (`psql`) | No instalado | `NOT_INSTALLED` | Usar contenedor en W4 |
| MongoDB (`mongod`) | No instalado | `NOT_INSTALLED` | Usar contenedor si aplica |
| `package.json` | No existe | `MISSING` | Sin build/lint/tests |
| TypeScript/config | No existe | `MISSING` | Sin typecheck |
| Código | No existe | `MISSING` | Sin backend |
| Pruebas | No existen | `MISSING` | Sin suite |
| Migraciones | No existen | `MISSING` | Sin esquema físico |
| OpenAPI | No existe | `MISSING` | `CT-01 = SIN_EVIDENCIA` |
| Dockerfile/Compose | No existen | `MISSING` | Solo ejemplos en arquitectura |
| Build | No aplica | `NOT_APPLICABLE` | No hay proyecto compilable |
| Lint/typecheck/tests | No aplica | `NOT_APPLICABLE` | No hay scripts |
| Health checks | No aplica | `NOT_APPLICABLE` | No hay servidor |

**Conclusión:** baseline documental y de entorno; no hay fallos de código preexistentes porque no hay código. No se declara ninguna prueba funcional como `PASS`.

---

## 6. Backlog y dependencias

Detalle en [`docs/backend/w0/04-backlog.md`](docs/backend/w0/04-backlog.md).

| ID | Tarea | Ola | Estado | Dependencias |
|---|---|---|---|---|
| `W0-01` | Inventario de fuentes y árbol | W0 | `DONE` | — |
| `W0-02` | Baseline de Git y entorno | W0 | `DONE` | W0-01 |
| `W0-03` | Registro de discrepancias y riesgos | W0 | `DONE` | W0-01 |
| `W0-04` | Backlog y criterios de aceptación | W0 | `DONE` | W0-01…W0-03 |
| `W0-05` | Ubicación del backend (`backend/src/`) | W0 | `DONE` (propuesta) | W0-01 |
| `W0-06` | Actualización del estado | W0 | `DONE` | W0-01…W0-05 |
| `W0-07` | Revisión independiente | W0 | `PASS` (2026-10-28) | W0-01…W0-06 |
| `W0.1-01` | Corregir conteo de no rastreados | W0.1 | `DONE` | W0-07 |
| `W0.1-02` | Corregir discrepancias y citas | W0.1 | `DONE` | W0-07 |
| `W0.1-03` | Remapear conflictos a tareas reales | W0.1 | `DONE` | W0-07 |
| `W0.1-04` | Reabrir estados y endurecer criterios | W0.1 | `DONE` | W0-07 |
| `W0.1-05` | Re-revisión independiente | W0.1 | `DONE` (`PASS`) | W0.1-01…W0.1-04 |
| `W1-01` | Triage de conflictos y decisiones | W1 | `DONE` (`GATE-W1-01 = PASS`) | W0-07 |
| `W1-02` | Cerrar `L-16` | W1 | `DONE_DOCUMENTAL` + prueba funcional | W1-01 |
| `W1-03` | Cerrar `L-12`/`L-20` | W1 | `DONE_DOCUMENTAL` + prueba funcional | W1-01 |
| `W1-04` | Cerrar `L-01` para el primer vertical | W1 | `NOT_STARTED` | W1-01, autorización; no requerido por `PI-01` |
| `W1-05` | Aprobar primer caso de uso | W1 | `DONE` (`DEC-IMPL-001`: `PI-01`) | W1-01…W1-03, `U-001`; `W1-04` solo si usa direcciones |
| `W1-06` | Dominio del primer vertical | W1 | `DONE_IMPLEMENTATION` | W1-05 |
| `W1-07` | Matriz de autorización del primer vertical | W1 | `N/A` en `PI-01`; `DEFERRED` | W1-05 |
| `W1-08` | Trazabilidad requisito → prueba | W1 | `PARTIAL` | W1-06, W1-07 |
| `W2-01`…`W2-10` | ADR, datos, esqueleto y migración | W2 | `PARTIAL` (sin ADR formales) | W1-05 |
| `W3-01`…`W3-06` | OpenAPI del primer vertical | W3 | `PARTIAL` (contrato de seis rutas; contract test) | W2-09 |
| `W4-01`…`W4-10` | Fundación ejecutable y Docker | W4 | `PARTIAL` (PostgreSQL/Docker y suite automatizada) | W2-09 |
| `W5-01`…`W5-08` | Primer caso de uso vertical | W5 | `PARTIAL` (`PI-01` + catálogo/51 pruebas; PostgreSQL automatizado) | W3-06, W4-10 |
| `W6-01`…`W6-07` | Integración y pruebas críticas | W6 | `NOT_STARTED` | W5-08 |
| `W7-01`…`W7-07` | Seguridad y robustez | W7 | `NOT_STARTED` | W6-07 |
| `W8-01`…`W8-05` | Documentación y release candidate | W8 | `NOT_STARTED` | W7-07 |

**Primer vertical seleccionado:** `PI-01 RegisterBuyer` (`DEC-IMPL-001`). `PI-02 RegisterSeller` sigue `BLOCKED` por autenticación/autorización, `U-004` (`L-01`) y contrato de ruta; evaluación en [`docs/backend/implementation/03-pi02-evaluation.md`](docs/backend/implementation/03-pi02-evaluation.md). Justificación y alternativas en `04-backlog.md` §1, `03-discrepancies.md` `U-001` y [`docs/backend/implementation/01-acceptance-and-unblock.md`](docs/backend/implementation/01-acceptance-and-unblock.md).

---

## 7. Registro de tareas W0

### W0-01 — Inventario de fuentes y árbol

- **Ola:** W0
- **Estado:** `DONE` (corregido en `W0.1-01`)
- **Prioridad:** P0
- **Responsable:** Backend Orchestrator / Repository Inspector
- **Objetivo:** identificar raíz, Git, fuentes, estructura y ausencias.
- **Alcance incluido:** `git ls-files`, árbol, metadatos, documentos de `BackendSDD/`.
- **Alcance excluido:** modificar documentos fuente, instalar dependencias.
- **Entradas:** repositorio real.
- **Artefactos:** `docs/backend/w0/01-inventory.md`.
- **Dependencias:** ninguna.
- **Bloqueos:** ninguno.
- **Criterios de aceptación:** cada fuente con ruta y estado; ausencias explícitas; sin afirmaciones no comprobadas.
- **Comandos ejecutados:** `git ls-files`, `git log`, listado recursivo, `Get-FileHash`.
- **Resultado real:** 38 archivos rastreados; 36 Markdown; sin código. 3 entradas sin rastrear / 6 archivos (conteo corregido tras la revisión).
- **Evidencias:** `01-inventory.md` §1–§3; `02-baseline.md` §5.
- **Revisor:** `FAIL` en la primera revisión por conteo de no rastreados; corrección aplicada; re-revisión `PASS` (3.ª).
- **Última actualización:** 2026-10-28.
- **Siguiente paso:** re-revisión.

### W0-02 — Baseline de Git y entorno

- **Ola:** W0
- **Estado:** `DONE` (corregido en `W0.1-01`)
- **Prioridad:** P0
- **Responsable:** Backend Orchestrator
- **Objetivo:** registrar rama, commit, estado, herramientas y resultados reales.
- **Artefactos:** `docs/backend/w0/02-baseline.md`.
- **Criterios de aceptación:** cada comando con resultado y estado; `FAIL`/`NOT_APPLICABLE` explícitos.
- **Resultado real:** Git limpio salvo 3 entradas sin rastrear (6 archivos); Node 24.21.0; Docker daemon inactivo; sin proyecto ejecutable.
- **Evidencias:** `02-baseline.md` §1–§5.5.
- **Revisor:** `FAIL` en la primera revisión por el conteo de no rastreados y el estado “PASS parcial”; corregido; re-revisión `PASS` (3.ª).
- **Siguiente paso:** re-revisión.

### W0-03 — Registro de discrepancias

- **Ola:** W0
- **Estado:** `DONE` (corregido en `W0.1-02`/`W0.1-03`)
- **Prioridad:** P0
- **Responsable:** Backend Orchestrator / Business Analyst (roles ejercidos secuencialmente)
- **Objetivo:** identificar contradicciones, requisitos sin soporte y decisiones necesarias.
- **Artefactos:** `docs/backend/w0/03-discrepancies.md`.
- **Criterios de aceptación:** evidencia con ruta/línea; impacto; opciones; responsable; tareas bloqueadas.
- **Resultado real:** 2 conflictos (`CON-001`, `CON-002`), 2 requisitos no documentados (`CON-003`, `CON-004`), 2 brechas documentales (`GAP-001`, `GAP-002`), 8 decisiones (`U-001`…`U-008`) y 6 riesgos.
- **Evidencias:** `03-discrepancies.md` §1–§7.
- **Revisor:** `FAIL` en la primera revisión (clasificación, citas y trazabilidad); corregido; re-revisión `PASS` (3.ª).
- **Siguiente paso:** decisión de negocio sobre `CON-001`…`CON-004` en W1.

### W0-04 — Backlog y criterios de aceptación

- **Ola:** W0
- **Estado:** `DONE` (corregido en `W0.1-04`)
- **Prioridad:** P0
- **Responsable:** Backend Orchestrator / Release Manager
- **Artefactos:** `docs/backend/w0/04-backlog.md`.
- **Criterios de aceptación:** tareas por ola, dependencias, criterios y primer vertical justificado.
- **Resultado real:** backlog W0–W8 con gates, dependencias por tarea y criterios verificables; `W0.1` para correcciones.
- **Revisor:** `FAIL` en la primera revisión (estados y criterios); corregido; re-revisión `PASS` (3.ª).
- **Siguiente paso:** aprobación del primer vertical en W1.

### W0-05 — Ubicación del backend

- **Ola:** W0
- **Estado:** `DONE` (propuesta, no aprobada)
- **Prioridad:** P0
- **Objetivo:** determinar cómo cumplir la restricción externa de ubicar el código en `backend/src/`.
- **Resultado real:** no existe backend ni estructura equivalente; se propone `backend/` como paquete ejecutable con `src/`, `tests/`, `api/`, `docker/`, `package.json`, `tsconfig.json`; `compose.yaml` en la raíz. La restricción proviene de la instrucción del usuario, no del repositorio (`prompt-orquestador-backend.md` líneas 130–133 presentan `src/` como referencia no obligatoria).
- **Evidencias:** `03-discrepancies.md` `U-007`; `01-inventory.md` §3.3.
- **Revisor:** `FAIL` por presentar la restricción como si constara en el repositorio; origen corregido; re-revisión `PASS` (3.ª).
- **Siguiente paso:** ADR de layout en W2 (`W2-08`).

### W0-06 — Actualización del estado

- **Ola:** W0
- **Estado:** `DONE`
- **Prioridad:** P0
- **Artefactos:** `orchestrator-state.md` (este archivo).
- **Criterios de aceptación:** cada cifra coincide con `git status --short` / `git ls-files -o --exclude-standard`; gate, ola y estados W0 coherentes; sin `PASS` funcional no ejecutado.
- **Resultado real:** estado corregido tras las revisiones; `GATE-W0 = PASS`; `W0.1-05` cerrada.
- **Revisor:** `FAIL` en la primera revisión por conteo, `GAP-002` omitido y “W0 COMPLETE” contradictorio; corregido; re-revisión `PASS` (3.ª).

### W0-07 — Revisión independiente

- **Ola:** W0
- **Estado:** `PASS` (2026-10-28, tercera revisión)
- **Prioridad:** P0
- **Responsable:** revisor independiente (`ses_e7b1c7ddaffepca7fRH5CGMyTx`).
- **Objetivo:** verificar los artefactos contra el repositorio y el baseline.
- **Resultado real:** 6 bloques `FAIL`; 1 defecto bloqueante (trazabilidad de conflictos a tareas), 4 mayores (conteo de no rastreados, clasificación de `CON-003`/`CON-004`, origen de `backend/src/`, estados `DONE` sin criterio) y 5 menores.
- **Evidencias:** §14 `GATE-W0`; `03-discrepancies.md` §7.
- **Siguiente paso:** `W0.1-05` re-revisión.

### W0.1 — Correcciones de la revisión independiente

| ID | Corrección | Estado | Evidencia |
|---|---|---|---|
| `W0.1-01` | Conteo de no rastreados: 3 entradas / 6 archivos | `DONE` | `01-inventory.md` §1; `02-baseline.md` §2 y §5.1; §5 de este archivo |
| `W0.1-02` | Reclasificar `CON-003`/`CON-004`, corregir citas de imágenes y `U-003`, declarar origen de `U-007`, añadir `GAP-002`/`RISK-006` | `DONE` | `03-discrepancies.md` §1, `CON-003`, `CON-004`, `U-003`, `U-007`, §7 |
| `W0.1-03` | Remapear tareas bloqueadas de los `CON` a tareas existentes | `DONE` | `03-discrepancies.md` `CON-001`…`CON-004`; `04-backlog.md` W1-01 |
| `W0.1-04` | Reabrir `W0-01`…`W0-06` como `IN_REVIEW`; endurecer criterios y dependencias | `DONE` | `04-backlog.md` §2; §6 y §7 de este archivo |
| `W0.1-05` | Re-revisión independiente | `DONE` (`PASS`) | tercera revisión en §14 |

### W1-01 — Triage de conflictos y brechas

- **Ola:** W1
- **Estado:** `DONE`; `GATE-W1-01 = PASS`
- **Prioridad:** P0
- **Responsable:** Backend Orchestrator / Business Analyst / Domain Steward (roles secuenciales)
- **Objetivo:** resolver documentalmente `CON-001`…`CON-004`, `GAP-001` y `GAP-002`, distinguiendo requisito, recomendación, inferencia y ausencia.
- **Artefactos:** `docs/backend/w1/01-resolution-matrix.md`; `docs/backend/w1/02-artifact-register.md`; `docs/backend/w1/03-decisions.md`.
- **Resultado real:**
  - `CON-001`: `RESOLVED` — `DEC-W1-001 = A`: `Producto`+`Variante`; variante = SKU, precio e inventario.
  - `CON-002`: `RESOLVED` — `DEC-W1-002 = B`: configurable, 30 días iniciales, política única de plataforma.
  - `CON-003`: `RESOLVED` — `DEC-W1-003 = A`: imágenes fuera de V1 y del primer vertical.
  - `CON-004`: `RESOLVED` — `DEC-W1-004 = A`: sin pagos en `PI-01`; dobles solo en pruebas.
  - `GAP-001`: `PARTIALLY_RESOLVED` — 3 cubiertas (2 suficientes + 1 sustituida), 1 parcial, 1 sin equivalente; no bloquea.
  - `GAP-002`: `RESOLVED_AS_PLAN` — ADR/contratos registrados con responsable, dependencia, fase y gate; ningún artefacto ejecutable existe aún.
- **Decisiones:** `DEC-W1-001`…`DEC-W1-004` (`APPROVED`); `DEC-W1-005`/`DEC-W1-006` (`RESOLVED_DOCUMENTARY`/`RESOLVED_AS_PLAN`).
- **Pruebas ejecutadas:** ninguna funcional; análisis documental y búsquedas de evidencia. No hay código.
- **Revisor:** revisión documental del propietario mediante autorización expresa; no se declara prueba funcional.
- **Siguiente paso:** `W1-02`/`W1-03` ejecutadas; no iniciar `W1-04`/`W1-05` sin aprobación de `U-001`.
- **Última actualización:** 2026-10-28.

### W1-02 — Cerrar `L-16` (estados iniciales)

- **Ola:** W1
- **Estado:** `DONE_DOCUMENTAL`; `DEC-W1-007`
- **Objetivo:** fijar los estados iniciales de `Usuario`, `PerfilComprador`, `PerfilVendedor` y primera `BodegaVendedor` para `PI-01`/`PI-02`.
- **Resultado:** `Usuario ACTIVO`, `PerfilComprador HABILITADO`, `PerfilVendedor ACTIVO` y primera `BodegaVendedor ACTIVA`; la incorporación administrativa es el acto de aprobación. Sin verificación de correo ni revisión separada del vendedor en V1.
- **Artefactos:** `docs/backend/w1/03-decisions.md` §2; modelo §6.1/§6.3/§6.4/§8.1; `PI-01`/`PI-02`; `DOCUMENTATION_STATUS.md` `L-16`.
- **Pruebas ejecutadas:** ninguna funcional; no existe `backend/`. Pruebas de integración quedan para W4/W5.
- **Límites:** `PI-02` sigue limitado por `L-01`; transiciones restantes en `L-09`. No se cerró `U-004`.
- **Última actualización:** 2026-10-28.

### W1-03 — Cerrar `L-12`/`L-20` (credenciales)

- **Ola:** W1
- **Estado:** `DONE_DOCUMENTAL`; `DEC-W1-008`
- **Objetivo:** fijar algoritmo, parámetros, formato y fortaleza de credenciales para `PI-01`/`PI-02`.
- **Resultado:** Argon2id v=19, `m=19456` KiB, `t=2`, `p=1`, sal de 16 bytes, salida de 32 bytes y formato PHC; contraseña de 12–128 caracteres sin composición obligatoria; verificación de tiempo constante; sin pepper.
- **Artefactos:** `docs/backend/w1/03-decisions.md` §3; `VO` §6.4; `PO-22`; `CT-08`; `ADOUT-13`; `DOCUMENTATION_STATUS.md` `L-12`/`L-20`.
- **Pruebas ejecutadas:** ninguna funcional; no se instaló biblioteca. Vectores y pruebas quedan para W4.
- **Límites:** la biblioteca concreta y el ADR/contrato ejecutable se eligen en W2/W4; rate limiting y recuperación no forman parte de `L-20`.
- **Última actualización:** 2026-10-28.

---

## 8. Registro de decisiones arquitectónicas

**No hay ADR aprobados.** Los siguientes son marcadores `PROPOSED`; no autorizan implementación.

| ID | Decisión | Estado | Artefactos afectados |
|---|---|---|---|
| ADR-001 | Framework HTTP y composición | `PROPOSED` | Backend foundation |
| ADR-002 | Acceso a PostgreSQL, query builder/ORM y migraciones | `PROPOSED` | Persistencia SQL |
| ADR-003 | Propiedad de datos PostgreSQL/MongoDB | `PROPOSED` | Persistencia |
| ADR-004 | Autenticación y autorización técnica | `PROPOSED` | Identity/security |
| ADR-005 | Contrato de errores API | `PROPOSED` | HTTP/OpenAPI |
| ADR-006 | Estrategia de pruebas | `PROPOSED` | CI/testing |
| ADR-007 | Docker y configuración de entorno | `PROPOSED` | DevEx/operations |
| ADR-008 | Layout `backend/` y versión LTS de Node | `PROPOSED` | Estructura/DevEx |
| ADR-009 | Política de credenciales (algoritmo, parámetros, fortaleza) | `DECISION_DONE` / `ADR_MISSING` (`DEC-W1-008`) | `CT-08`, `PI-01`/`PI-02` |
| ADR-010 | Sobre de eventos, outbox/inbox y catálogo | `PROPOSED` | `CT-02`, `PO-23` |
| ADR-011 | Almacenamiento de imágenes | `OUT_OF_SCOPE_V1` (`DEC-W1-003`) | `Producto`, `FileStorage` |
| ADR-012 | Política de devoluciones | `DECISION_DONE` / `ADR_DEFERRED` (`DEC-W1-002`) | `DS-07`, `PI-21`/`PI-22` |

**Plan detallado:** [`docs/backend/w1/02-artifact-register.md`](docs/backend/w1/02-artifact-register.md). `ADR-009` y `ADR-012` tienen decisión, pero ningún ADR formal ha sido creado; `ADR-011` no aplica en V1.

**Nota:** la arquitectura vigente recomienda Fastify, Zod, Vitest/Jest y PostgreSQL, pero no son decisiones aprobadas (README líneas 164–172; `nexusmarket-arquitectura.md` §2.1). No se instalaron dependencias.

---

## 9. Matriz de propiedad de datos (propuesta)

**Estado global:** `PROPOSED`; no aprobada hasta W2. Se deriva de `nexusmarket-domain-model.md` §24 y `DD-09`, que establecen SQL como fuente transaccional y MongoDB como complemento documental. No hay esquema físico.

| ID | Entidad/conjunto | Bounded context | Fuente propuesta | Consistencia | Estado |
|---|---|---|---|---|---|
| DATA-001 | `Usuario` | identity | PostgreSQL | Transaccional | `PROPOSED` |
| DATA-002 | `PerfilComprador` | buyers | PostgreSQL | Transaccional | `PROPOSED` |
| DATA-003 | `PerfilVendedor` | sellers | PostgreSQL | Transaccional | `PROPOSED` |
| DATA-004 | `Bodega` | warehouses | PostgreSQL | Transaccional | `PROPOSED` |
| DATA-005 | `Producto`/`Variante` | catalog | PostgreSQL | Transaccional | `PROPOSED` (`DEC-W1-001`; diseño W2) |
| DATA-006 | `Inventario`/reservas/movimientos | inventory | PostgreSQL | Transaccional + concurrencia | `PROPOSED` |
| DATA-007 | `Carrito`/`ItemCarrito` | cart | PostgreSQL | Transaccional | `PROPOSED` |
| DATA-008 | `Pedido`/`ItemPedido` | orders | PostgreSQL | Transaccional | `PROPOSED` |
| DATA-009 | `Pago` | payments | PostgreSQL + referencia externa | Transaccional + idempotencia | `PROPOSED` |
| DATA-010 | `Factura` | billing | PostgreSQL | Transaccional | `PROPOSED` |
| DATA-011 | `Envio` | shipping | PostgreSQL | Transaccional | `PROPOSED` |
| DATA-012 | `Devolucion`/`Reembolso` | returns/refunds | PostgreSQL | Transaccional | `PROPOSED` |
| DATA-013 | `RegistroAuditoria`/eventos | reporting | MongoDB (append-only) + outbox SQL | Eventual/outbox | `PROPOSED` |
| DATA-014 | Proyecciones de reportes | reporting | PostgreSQL inicialmente | Según consulta | `PROPOSED` (`D-25`) |

**Regla:** no crear tablas/colecciones hasta W2. `CON-001` ya está resuelto (`DEC-W1-001`); las demás decisiones de negocio aplicables deben estar resueltas antes de cada diseño. MongoDB no duplica la fuente autoritativa.

---

## 10. Registro de incertidumbres, conflictos y riesgos

Detalle completo en [`docs/backend/w0/03-discrepancies.md`](docs/backend/w0/03-discrepancies.md).

| ID | Título | Tipo | Severidad | Estado | Bloquea |
|---|---|---|---|---|---|
| `CON-001` | Variantes comerciales en V1 | `CONFLICT` | Alta | `RESOLVED` (`DEC-W1-001 = A`) | Catálogo/inventario sujetos a `W1-05`; no bloquean `PI-01` |
| `CON-002` | Plazo de devolución de 30 días | `CONFLICT` | Alta | `RESOLVED` (`DEC-W1-002 = B`) | Devoluciones sujetas a `L-10`; no bloquean `PI-01` |
| `CON-003` | Imágenes como requisito de publicación | `UNDOCUMENTED_REQUIREMENT` | Alta | `RESOLVED` (`DEC-W1-003 = A`) | Sin imágenes en V1; no bloquea `PI-01` |
| `CON-004` | Pago simulado en V1 | `UNDOCUMENTED_REQUIREMENT` | Alta | `RESOLVED` (`DEC-W1-004 = A`) | Pagos fuera de `PI-01`; `L-22` abierta |
| `GAP-001` | Fuentes nombradas en el prompt ausentes | `NON_BLOCKING` | Media | `PARTIALLY_RESOLVED` — 3 cubiertas, 1 parcial, 1 sin equivalente; no bloquea | Trazabilidad de proceso |
| `GAP-002` | Sin contratos ejecutables ni ADR | `NON_BLOCKING` (W1) / `BLOCKER` (W2–W5) | Media | `RESOLVED_AS_PLAN` + `PARTIAL` (migración/OpenAPI/código existen; ADR y validación formal pendientes) | W2/W3/W4/W5 |
| `U-001` | Primer caso de uso no aprobado | `BLOCKER` | Alta | `RESOLVED` (`DEC-IMPL-001`: `PI-01`) | — |
| `U-002` | Estados iniciales (`L-16`) | `BLOCKER` | Alta | `RESOLVED` (`DEC-W1-007`) | — |
| `U-003` | Política de credenciales (`L-12`/`L-20`) | `BLOCKER` | Alta | `RESOLVED` (`DEC-W1-008`; Argon2id probado) | — |
| `U-004` | Composición de dirección (`L-01`) | `BLOCKER` | Alta | `WAITING_FOR_DECISION` | PI-02/PI-03/PI-08/PI-12 |
| `U-005` | Framework/ORM/tests/auth | `BLOCKER` | Alta | `RESOLVED_REVERSIBLE` (`DEC-IMPL-002`/`006`) | ADR formales |
| `U-006` | Matriz física de datos | `BLOCKER` | Alta | `RESOLVED_REVERSIBLE` (`DEC-IMPL-003`) | Matriz completa |
| `U-007` | Layout de `backend/` | `NON_BLOCKING` | Baja | `RESOLVED` (`DEC-IMPL-004`) | — |
| `U-008` | Versión LTS de Node | `NON_BLOCKING` | Media | `RESOLVED` (`DEC-IMPL-005`: Node 24) | — |
| `RISK-001` | Docker daemon inactivo | `RISK` | Media | `RESOLVED` en este entorno (Docker/PostgreSQL verificados); riesgo operativo en otras máquinas | W4/W6 |
| `RISK-002` | Sin clientes locales de bases | `RISK` | Media | `PARTIALLY_RESOLVED` (`psql` del contenedor; host sin cliente) | W4/W6 |
| `RISK-003` | `L-27`: sin OpenAPI/auth | `RISK` | Alta | `PARTIAL` (contrato cerrado solo para seis rutas; auth no) | W3/W5 |
| `RISK-004` | `DEC-BIZ-01`…`07` abiertas; `DEC-BIZ-02` resuelta | `RISK` | Alta | `OPEN` | Checkout/facturación/posventa |
| `RISK-005` | Documentación sin código | `RISK` | Media | `MITIGATED` para `PI-01`; resto documental | Planificación |
| `RISK-006` | Deriva modelo v2.0 vs prompt | `RISK` | Media | `MITIGATED` | `CON-001` resuelto por `DEC-W1-001` |

**Conflictos documentales `C-01`…`C-21`:** se consideran cerrados en su ámbito según `DOCUMENTATION_STATUS.md` §6 y no se reabren. `C-20` sigue acotado por `L-22`/`L-23`.

---

## 11. Agentes y asignaciones

| ID | Rol | Responsable actual | Tarea | Archivos permitidos | Estado |
|---|---|---|---|---|---|
| AG-001 | Coordinator / Release Manager | Backend Orchestrator | W0 | `docs/backend/w0/*`, `orchestrator-state.md` | `IN_REVIEW` (autorrevisión) |
| AG-002 | Repository Inspector | Backend Orchestrator | Inventario/baseline | Solo lectura del repositorio | `DONE` |
| AG-003 | Business Analyst | Backend Orchestrator | Discrepancias/requisitos | Solo lectura | `DONE` |
| AG-004 | Independent Reviewer | Sesión `ses_e7b1c7ddaffepca7fRH5CGMyTx` | W0-07 | Solo lectura | `FAIL` (1.ª revisión) |
| AG-005 | Backend Architect | Por asignar | W2 | ADR/arquitectura | `NOT_STARTED` |
| AG-006 | API Contract Agent | Por asignar | W3 | OpenAPI/contratos | `NOT_STARTED` |
| AG-007 | PostgreSQL Agent | Por asignar | W2/W4 | Migraciones/adaptador | `NOT_STARTED` |
| AG-008 | MongoDB Agent | Por asignar | W2/W4 | Adaptador MongoDB | `NOT_STARTED` |
| AG-009 | Foundation Agent | Por asignar | W4 | Infraestructura | `NOT_STARTED` |
| AG-010 | Security Agent | Por asignar | W1/W7 | Auth/seguridad | `NOT_STARTED` |
| AG-011 | Docker/DevEx Agent | Por asignar | W4 | Docker/Compose | `NOT_STARTED` |
| AG-012 | QA/Integration Agent | Por asignar | W5/W6 | Pruebas | `NOT_STARTED` |
| AG-013 | Independent Reviewer | Por asignar | Gates | Solo revisión | `PENDING` |
| AG-014 | Independent Reviewer (W0.1) | Sesiones `ses_e7b113275ffeeAZmlHtptxtOfT` y `ses_e7b0b9ec9ffeC6278fXU0TKf9M` | W0.1-05 | Solo lectura | `PASS` (3.ª revisión) |
| AG-015 | Business Analyst / Domain Steward | Backend Orchestrator (roles secuenciales) | W1-01/W1-02/W1-03 | `docs/backend/w1/*`, `docs/backend/w0/*`, `orchestrator-state.md` | `DONE` (W1-02/03 `DONE_DOCUMENTAL`) |
| AG-016 | Independent Reviewer (W1-01) | No asignado | W1-01 | Solo lectura | `NOT_RUN`; el propietario autorizó Q1–Q4 |

No hubo agentes concurrentes en W0; los roles se ejercieron secuencialmente. Tres sesiones independientes de solo lectura revisaron W0: `FAIL`, `FAIL` y `PASS` final.

---

## 12. Contratos y APIs

| ID | Contrato | Versión | Estado | Propietario | Validación |
|---|---|---|---|---|---|
| API-001 | OpenAPI raíz | — | `PARTIAL`: contrato de seis rutas en `backend/openapi.yaml` | API Contract Agent | `openapi.test.ts`; sin validador semántico |
| API-002 | Autenticación/contexto de identidad | — | `NOT_STARTED` | Security + API | No existe (`L-27`) |
| API-003 | Errores API | — | `PARTIAL`: formato uniforme implementado | API Architect | Sin catálogo formal completo |
| API-004 | Primer flujo vertical | — | `IMPLEMENTED` (`PI-01` + catálogo) | Caso de uso asignado | 51 pruebas y PostgreSQL automatizado |

Se adoptó provisionalmente `/api/v1` y un contrato mínimo para `PI-01` y el catálogo público (`DEC-IMPL-007`, `DEC-V1-004`). `L-27` queda cerrada **solo** para `POST /api/v1/buyers`, `GET /api/v1/products`, `GET /api/v1/products/{productId}`, `GET /api/v1/categories`, `/health` y `/ready`; autenticación, versionado general, rate limiting y rutas futuras siguen abiertos. `CT-01 = PARCIAL` (seis rutas); `CT-02`…`CT-12 = ALINEADO_CON_PROPUESTA`; solo `CT-13` está `ALINEADO`.

**W1-01 (`GAP-002`):** el plan de ADR/contratos está en [`docs/backend/w1/02-artifact-register.md`](docs/backend/w1/02-artifact-register.md). El corte posterior creó el contrato de seis rutas, migraciones y código de `PI-01`/catálogo; los ADR formales y el validador semántico siguen pendientes. `ADR-009`/`CT-08` tienen decisión (`DEC-W1-008`) pero no ADR/contrato ejecutable; `ADR-011` queda fuera de V1 y `ADR-012` tiene política (`DEC-W1-002`) con ADR diferido. W2 exige ADR-001…010; W3 exige `CT-01`/`API-001`…`API-004`, `CT-08` y `CT-09`; W4 exige `CT-12`, `DB-001`, `CT-13`, configuración y Docker; W5 exige el contrato del primer vertical y `CT-04` si hay pago.

---

## 13. Evidencias de pruebas

| ID | Tarea | Comando | Resultado | Evidencia |
|---|---|---|---|---|
| TEST-EVIDENCE-W0-001 | Git baseline | `git rev-parse ...; git status --short` | `PASS` | `02-baseline.md` §5 |
| TEST-EVIDENCE-W0-002 | Herramientas | `node --version; npm --version; ...` | `PASS` (Node/npm/Git/Docker CLI); `NOT_INSTALLED` (tsc/psql/mongod) | `02-baseline.md` §5 |
| TEST-EVIDENCE-W0-003 | Docker daemon | `docker info` | `FAIL` | `02-baseline.md` §5 |
| TEST-EVIDENCE-W0-004 | Ausencia de artefactos | `git ls-files` + árbol | `PASS` | `02-baseline.md` §5 |
| TEST-EVIDENCE-W0-005 | Huellas SHA-256 | `Get-FileHash` | `PASS` | `02-baseline.md` §5 |
| TEST-EVIDENCE-W0-006 | Revisión independiente de W0 | Inspección de solo lectura: `git ls-files`, `git status`, versiones, `docker info`, contraste de documentos | `FAIL` | §14; 1 bloqueante, 4 mayores, 5 menores |
| TEST-EVIDENCE-W0-007 | Correcciones `W0.1` | Edición de artefactos y re-ejecución de `git status --short` / `git ls-files -o --exclude-standard` | `PASS` (correcciones aplicadas; no es aprobación del gate) | `01-inventory.md` §1; `02-baseline.md` §2; `03-discrepancies.md` §7 |
| TEST-EVIDENCE-W0-008 | Tercera revisión independiente | Verificación D1–D10 + comprobaciones base (`git status`, `git ls-files`, `git rev-parse`, tablas, ausencia de artefactos) | `PASS` | §14; 0 bloqueantes, 0 mayores |
| TEST-EVIDENCE-W1-001 | Contraste documental W1-01 | Lectura de `enunciado.md`, modelo §7/§11/§14/§25/§27/§28, `DS-07`, `PI-05`/`PI-21`/`PI-22`, `PO-05`/`PO-16`, `CT-01`…`CT-13`, `DOCUMENTATION_STATUS.md`; búsquedas de `imagen`/`foto`, `simulad`/`sandbox`/`fake`; verificación de fuentes ausentes | `PASS` documental (Q1–Q4 decididas) | `docs/backend/w1/01-resolution-matrix.md` §3; `02-artifact-register.md` |
| TEST-EVIDENCE-W1-002 | Estados iniciales (`W1-02`) | Contraste de `PI-01`/`PI-02`/`PI-04`, modelo §6/§8 y `L-16`; sin ejecución de código | `DONE_DOCUMENTAL`; prueba funcional `NOT_APPLICABLE` (no existe `backend/`) | `docs/backend/w1/03-decisions.md` §2 |
| TEST-EVIDENCE-W1-003 | Política de credenciales (`W1-03`) | Contraste de `PO-22`, `VO` §6.4, `CT-08` y `L-12`/`L-20`; no se instaló biblioteca | `DONE_DOCUMENTAL`; vectores funcionales `NOT_APPLICABLE` (W4) | `docs/backend/w1/03-decisions.md` §3 |
| TEST-EVIDENCE-PI01-001 | Typecheck y pruebas | `npm run typecheck`; `npm test` | `PASS`: 5 archivos, 29 pruebas | `backend/tests/**`; salida local del 2026-10-28 |
| TEST-EVIDENCE-PI01-002 | Contrato OpenAPI | `npm test` (`tests/contract/openapi.test.ts`) | `PASS`: rutas, métodos, respuestas, `additionalProperties` y refs locales | `backend/openapi.yaml`; `backend/tests/contract/openapi.test.ts` |
| TEST-EVIDENCE-PI01-003 | PostgreSQL real | `$env:TEST_DATABASE_URL=...; npm run test:postgres` | `PASS`: 2 pruebas; concurrencia `201`/`409`, rollback y limpieza | `backend/tests/postgres/**`; conteos finales 0/0/0/0/0 |
| TEST-EVIDENCE-PI01-004 | Guarda de base | `npm run test:postgres` sin URL, con URL de `nexusmarket` y con query param | `PASS` de la guarda: exit 1 explícito, suite no omitida | `backend/tests/postgres/support.ts` |
| TEST-EVIDENCE-PI01-005 | Revisión independiente | Inspección de Git/secretos/código/pruebas/contrato/documentación | `PASS` tras re-revisión; correcciones aplicadas | Sesión `ses_e7a3f8c7fffehdXpxCqxD8gVkc`; informe §11 |
| TEST-EVIDENCE-V1-001 | Persistencia PostgreSQL obligatoria | `npm run typecheck`; `npm test`; `npm run test:postgres`; reinicio real | `PASS`: 51 pruebas; 11 PostgreSQL; `POST 201` + reinicio + `count = 1` | `backend/tests/unit/persistence-architecture.test.ts`; `backend/tests/postgres/**` |
| TEST-EVIDENCE-V1-002 | Catálogo backend | `npm run db:seed:demo`; consultas HTTP reales | `PASS`: 8 productos, 2 vendedores, 8 imágenes, 6 inventario; búsqueda/filtros/orden/paginación | `backend/migrations/003_catalog.sql`; `tests/integration/catalog-http.test.ts`; `tests/postgres/catalog-query-postgres.test.ts` |
| TEST-EVIDENCE-V1-003 | Contrato OpenAPI | `npm test` (`tests/contract/openapi.test.ts`) | `PASS`: seis rutas, respuestas y `$ref` resueltos | `backend/openapi.yaml` 0.2.0 |
| TEST-EVIDENCE-V1-004 | Frontend | `npm run typecheck`; `npm run build`; smoke con `curl.exe` | `PASS`: build OK; home `200`/8 tarjetas; catálogo `200`/6; página 2 `200`/2; detalle `200`; inexistente y malformado `404` | `frontend/**`; `docs/implementation/EXECUTION-LOG.md` |
| TEST-EVIDENCE-V2-001 | Backend del vendedor | `npm run verify` | `PASS`: typecheck; 14 archivos / 110 pruebas; OpenAPI 33/40/419; build | `backend/tests/**`; `backend/openapi.yaml`; salida local 2026-11-03 |
| TEST-EVIDENCE-V2-002 | PostgreSQL del vendedor | `$env:TEST_DATABASE_URL=...; npm run test:postgres` | `PASS`: 5 archivos / 28 pruebas; ownership, estados, ingreso e idempotencia | `backend/tests/postgres/seller-workspace-postgres.test.ts` |
| TEST-EVIDENCE-V2-003 | Smoke HTTP del vendedor | `$env:API_URL=http://127.0.0.1:3000; npm run smoke:seller` | `PASS`: 33/33 comprobaciones | `backend/scripts/seller-smoke.ts`; salida local |
| TEST-EVIDENCE-V2-004 | Frontend del vendedor | `npm run typecheck`; `npm run build` | `PASS`: build OK; 18 rutas | `frontend/src/app/seller/**` |
| TEST-EVIDENCE-V2-005 | E2E del vendedor y recorrido cruzado | `npm run test:e2e` (Playwright + Edge) | `PASS`: 4/4 (protección, recorrido del vendedor, aislamiento y admin → vendedor → comprador → pedido) | `frontend/e2e/seller.spec.ts`; `frontend/e2e/cross-role.spec.ts`; `frontend/playwright.config.ts` |
| TEST-EVIDENCE-V2-006 | Backend logístico | `npm run verify` | `PASS`: typecheck; 16 archivos / 131 pruebas; OpenAPI 43/50/544; build | `backend/tests/unit/logistics.test.ts`; `backend/tests/integration/logistics-http.test.ts`; `backend/openapi.yaml`; salida local 2026-11-05 |
| TEST-EVIDENCE-V2-007 | PostgreSQL logístico | `$env:TEST_DATABASE_URL=...; npm run test:postgres` | `PASS`: 6 archivos / 34 pruebas; migración `008`, ámbito, flujo completo, inventario, reservas, historial, idempotencia y alta de operador | `backend/tests/postgres/logistics-postgres.test.ts` |
| TEST-EVIDENCE-V2-008 | Login y perfil del operador demo | `POST /auth/login`; `GET /auth/session`; `GET /logistics/profile`; `GET /logistics/summary` | `PASS`: rol `OPERADOR_LOGISTICO`, estado `ACTIVO`, 2 bodegas asignadas | Salida local 2026-11-05 |
| TEST-EVIDENCE-V2-009 | Frontend logístico | `npm run typecheck`; `npm run build` | `PASS`: build OK; 22 rutas, incluidas `/logistics`, pedidos, detalle, bodegas e inventario | `frontend/src/app/logistics/**` |
| TEST-EVIDENCE-V2-010 | E2E logístico completo | `npm run test:e2e` (Playwright + Edge) | `PASS`: 5/5; el comprador paga, el operador prepara, despacha y entrega con evidencia; el pedido queda `ENTREGADO` | `frontend/e2e/logistics.spec.ts`; `frontend/e2e/cross-role.spec.ts`; `frontend/e2e/seller.spec.ts` |
| TEST-EVIDENCE-V2-011 | Backend del supervisor | `npm run verify` | `PASS`: typecheck; 18 archivos / 145 pruebas; OpenAPI 52/59/647; build | `backend/tests/unit/supervisor.test.ts`; `backend/tests/integration/supervisor-http.test.ts`; `backend/openapi.yaml`; salida local 2026-11-06 |
| TEST-EVIDENCE-V2-012 | PostgreSQL del supervisor | `$env:TEST_DATABASE_URL=...; npm run test:postgres` | `PASS`: 7 archivos / 37 pruebas; consultas globales, filtros, conteos y ausencia de datos personales | `backend/tests/postgres/supervisor-postgres.test.ts` |
| TEST-EVIDENCE-V2-013 | E2E de supervisión | `npm run test:e2e` (Playwright + Edge) | `PASS`: 6/6; redirección anónima, denegación a admin/comprador/vendedor/logística, datos reales, sin formularios y `POST` → `405` | `frontend/e2e/supervisor.spec.ts` |
| TEST-EVIDENCE-V2-014 | Backend administrativo | `npm run verify` | `PASS`: typecheck; 20 archivos / 160 pruebas; OpenAPI 68/76/904; build | `backend/tests/unit/admin.test.ts`; `backend/tests/integration/admin-http.test.ts`; `backend/openapi.yaml`; salida local 2026-11-08 |
| TEST-EVIDENCE-V2-015 | PostgreSQL administrativo | `$env:TEST_DATABASE_URL=...; npm run test:postgres` | `PASS`: 8 archivos / 40 pruebas; consultas globales, agregados reales, minimización y guarda de método | `backend/tests/postgres/admin-postgres.test.ts` |
| TEST-EVIDENCE-V2-016 | E2E administrativo | `npm run test:e2e` (Playwright + Edge, build de producción) | `PASS`: 7/7; redirección anónima, aislamiento de rol, dashboard, listas/detalles, alta en `/admin/sellers/new` y `405` de escritura | `frontend/e2e/admin.spec.ts`; `frontend/e2e/cross-role.spec.ts` |

**No ejecutados:** lint, CI en GitHub y pruebas de carga masiva. El validador OpenAPI y el E2E de navegador sí se ejecutaron localmente; el E2E del marketplace (13/13) corresponde a un corte anterior y no se repitió.

---

## 14. Registro de gates

### GATE-W0 — Inventario y baseline

- **Ola:** W0
- **Estado:** `PASS` (tercera revisión independiente, 2026-10-28)
- **Fecha:** 2026-10-28
- **Commit verificado:** `badf0b1993c927d6713d85cd7b44eee8b4259a46`
- **Autor de los artefactos:** Backend Orchestrator
- **Revisores independientes:** `ses_e7b1c7ddaffepca7fRH5CGMyTx` (1.ª), `ses_e7b113275ffeeAZmlHtptxtOfT` (2.ª), `ses_e7b0b9ec9ffeC6278fXU0TKf9M` (3.ª: `PASS`). Los tres son sesiones separadas de solo lectura; ninguna es el autor.
- **Resultado de la primera revisión:** `FAIL` en los 6 bloques (inventario, baseline, discrepancias, backlog, estado, coherencia cruzada).
- **Defectos y corrección:**

| ID | Severidad | Defecto | Corrección aplicada |
|---|---|---|---|
| D2 | **BLOQUEANTE** | Tareas bloqueadas de `CON-001`…`CON-004` no correspondían al backlog | Remapeadas a `W1-01` y a las tareas reales; se declara que catálogo/devoluciones/pagos no tienen tareas propias aún |
| D1 | MAYOR | Conteo falso de no rastreados (2 vs. 6) | Corregido a 3 entradas / 6 archivos en inventario, baseline y estado |
| D3 | MAYOR | `CON-003`/`CON-004` mal clasificados; cita falsa “solo imagen Docker” | Reclasificados como `UNDOCUMENTED_REQUIREMENT`; citas de puertos corregidas |
| D4 | MAYOR | `backend/src/` presentado como restricción del repositorio | Declarado como instrucción externa del usuario; prompt solo lo muestra como referencia no obligatoria |
| D5 | MAYOR | `W0-02/03/05/06` en `DONE` sin cumplir criterios | Reabiertos como `IN_REVIEW`; criterios endurecidos |
| D6 | MENOR | `GAP-002`/`RISK-006` omitidos del resumen | Añadidos al resumen y al estado |
| D7 | MENOR | Cita errónea de `L-20` en `U-003` | Corregida a `input-ports` 220/229/1675 y `DOCUMENTATION_STATUS` 187 |
| D8 | MENOR | “Documentación W0 COMPLETE” con gate bloqueado | Sustituido por `W0 IN_REVIEW` |
| D9 | MENOR | Criterios vagos y dependencias por ola | Criterios con evidencia; dependencias por tarea |
| D10 | MENOR | Estado “PASS parcial” fuera de escala | Separado en `PASS` + `NOT_INSTALLED`; escala ampliada |

- **Segunda revisión (`W0.1-05`, 2026-10-28):** `FAIL`. D1 y D3–D10 `PASS`; D2 persistía porque `CON-004` citaba `W3-04` (autorización) como bloqueada por pagos. Defectos nuevos menores: N1 (“conflictos” en inventario y título de §2), N2 (protocolo de reanudación no contemplaba `FAIL`), N3 (`W1-07`/`W1-08` fuera del estado), N4 (prerequisitos del revisor incluían el conteo corregido por el autor). Todos corregidos: `CON-004` ya no cita `W3-04`; terminología ajustada; protocolo y filas W1 completados; prerequisitos separados por autor/revisor.

- **Tercera revisión (`W0.1-05`, 2026-10-28):** `PASS`. D1–D10 verificados; comprobaciones base re-ejecutadas (3 entradas / 6 archivos sin rastrear, 38 rastreados, 36 `.md`, commit correcto); tablas coherentes; gate sin autoproclamación; sin pruebas funcionales `PASS`; sin `backend/`, `package.json`, `tsconfig.json`, `src/`, migraciones ni endpoints. Observaciones cosméticas O1/O2 aplicadas.

- **Prerequisitos verificados por los revisores independientes:**
  - [x] Raíz, rama y commit comprobados; 3 entradas / 6 archivos sin rastrear; 38 rastreados / 36 `.md`.
  - [x] Fuentes localizadas; las 5 fuentes `MISSING` no existen en árbol ni historial.
  - [x] Baseline de entorno reproducido (Node, npm, Git, Docker, Compose); daemon Docker `FAIL`.
  - [x] Sin pruebas funcionales declaradas `PASS`.
  - [x] Discrepancias con evidencia localizable y clasificación corregida.
  - [x] Backlog con dependencias y criterios verificables.
  - [x] `GATE-W0` no se autoproclamó `PASS` durante las revisiones.
- **Criterios incumplidos:** ninguno.
- **Bloqueos:** en el momento de W0, `CON-001`…`CON-004` impedían cerrar `W1-01`; se resolvieron el 2026-10-28 (`DEC-W1-001`…`004`). Docker daemon sigue inactivo para W4/W6.
- **Decisión de avance:** **APROBADO.** `GATE-W0 = PASS`. W1 se autorizó el 2026-10-28; `W1-01` quedó `DONE` y `GATE-W1-01 = PASS`.

### GATE-W1-01 — Triage de conflictos y brechas

- **Ola:** W1
- **Estado:** `PASS` (2026-10-28)
- **Autor:** Backend Orchestrator / Business Analyst / Domain Steward
- **Revisor independiente:** no ejecutado (`AG-016` `NOT_RUN`); el propietario autorizó expresamente Q1–Q4 y `W1-02`/`W1-03`.
- **Artefactos:** `docs/backend/w1/01-resolution-matrix.md`; `docs/backend/w1/02-artifact-register.md`; `docs/backend/w1/03-decisions.md`
- **Resultado por ID:**

| ID | Estado | ¿Cierra el gate? | Decisión |
|---|---|---|---|
| `CON-001` | `RESOLVED` | Sí | `DEC-W1-001 = A` |
| `CON-002` | `RESOLVED` | Sí | `DEC-W1-002 = B` |
| `CON-003` | `RESOLVED` | Sí | `DEC-W1-003 = A` |
| `CON-004` | `RESOLVED` | Sí | `DEC-W1-004 = A` |
| `GAP-001` | `PARTIALLY_RESOLVED` | No bloquea implementación; residuo de proceso | Límite aceptado |
| `GAP-002` | `RESOLVED_AS_PLAN` | No bloquea W1; sí W2–W5 | Plan registrado |

- **Criterios de aceptación:** cada conflicto con decisión, aceptación o límite explícito; ninguno resuelto por conveniencia. **Cumplido.** `CON-001`…`CON-004` tienen decisión del propietario; `GAP-001` conserva su residuo y `GAP-002` está planificado.
- **Pruebas ejecutadas:** análisis documental y búsquedas de evidencia; ninguna prueba funcional. `W1-02`/`W1-03` se marcan `DONE_DOCUMENTAL`, no `PASS` funcional.
- **Decisión:** **APROBADO documentalmente.** `GATE-W1-01 = PASS`. No se inicia `W1-04`/`W1-05` ni W2 por este gate.

### GATES V1 — primera entrega demostrable (2026-11-01)

| Gate | Alcance | Estado | Evidencia |
|---|---|---|---|
| `GATE-V1-A` | Persistencia PostgreSQL obligatoria | `PASS` local | Almacén memoria eliminado; 51 pruebas; 11 PostgreSQL; reinicio con `count = 1` |
| `GATE-V1-B` | Catálogo backend | `PASS` local | Migración `003`; 8 productos; rutas de productos/detalle/categorías; pruebas HTTP/PostgreSQL |
| `GATE-V1-C` | Contrato OpenAPI | `PASS` local | `openapi.yaml` 0.2.0; 5 pruebas de contrato; seis rutas |
| `GATE-V1-D` | Frontend Next.js | `PASS` local | Typecheck/build; home, catálogo, detalle y 404 contra API real |
| `GATE-V1-E` | Verificación y documentación | `PASS` local | Suites, smoke, conteos y `docs/implementation/*` |

`PASS` local no equivale a CI, revisión independiente de esta entrega ni cobertura de capacidades fuera de alcance.

### GATE-V2-SELLER — espacio de trabajo del vendedor (2026-11-03)

- **Ola:** V2.
- **Estado:** `PASS` local.
- **Alcance:** perfil, productos, imágenes por URL, bodegas, inventario por ingreso, consulta de pedidos y frontend `/seller`.
- **Evidencia ejecutada:**
  - `backend`: `npm run verify`: typecheck OK; 14 archivos / 110 pruebas; `OpenAPI válido: 33 rutas, 40 operaciones, 419 referencias`; build OK.
  - `backend`: `npm run test:postgres`: 5 archivos / 28 pruebas OK.
  - `backend`: `npm run smoke:seller`: 33/33 PASS.
  - `frontend`: `npm run typecheck` y `npm run build`: OK; 18 rutas.
  - `frontend`: `npm run test:e2e`: 4/4 PASS (incluye el recorrido cruzado admin → vendedor → comprador → pedido).
- **Criterios cubiertos:** ownership por `sellerId` derivado de la sesión; `404` en acceso cruzado; transiciones de estado aprobadas; SKU e imagen obligatorios para publicar; ingreso atómico e idempotente; pedidos de solo lectura; sin pago ni logística.
- **Límites:** carga binaria de imágenes, ajustes negativos/logística y entrega digital quedan bloqueados o pendientes según la matriz §2.5. Lint sigue `BLOCKED`; CI sigue `READY_FOR_REVIEW`.
- **Revisión independiente:** no ejecutada para este gate; el estado es `PASS` local, no `DONE`.

### GATE-V2-LOGISTICS — operación logística (2026-11-05)

- **Ola:** V2.
- **Estado:** `PASS` local.
- **Alcance:** perfil del operador, ámbito de bodegas, inventario autorizado, pedidos y detalle, preparación, despacho, entrega con evidencia, historial y frontend `/logistics`.
- **Evidencia ejecutada:**
  - `backend`: `npm run verify`: typecheck OK; 16 archivos / 131 pruebas; `OpenAPI válido: 43 rutas, 50 operaciones, 544 referencias`; build OK.
  - `backend`: `npm run test:postgres`: 6 archivos / 34 pruebas OK.
  - `backend`: `npm run smoke:seller`: 33/33 PASS (regresión del vendedor).
  - `backend`: login real del operador demo: rol `OPERADOR_LOGISTICO`, estado `ACTIVO`, 2 bodegas.
  - `frontend`: `npm run typecheck` y `npm run build`: OK; 22 rutas.
  - `frontend`: `npm run test:e2e`: 5/5 PASS, incluido el recorrido logístico completo con evidencia.
- **Criterios cubiertos:** autorización por rol y estado; ámbito por bodegas asignadas; `404` en acceso cruzado; preparación solo con pago y reservas; despacho con consumo de reservas, descuento de inventario y `SALIDA_VENTA`; entrega con evidencia; idempotencia por operador y tipo; historial de estados con actor y referencia causal.
- **Límites:** asignación automática, transportistas externos, tracking integrado, evidencia del proveedor y `CloseOrder` siguen bloqueados o sin decisión. Lint sigue `BLOCKED`; CI sigue `READY_FOR_REVIEW`.
- **Revisión independiente:** no ejecutada para este gate; el estado es `PASS` local, no `DONE`.

### GATE-V2-SUPERVISOR — supervisión de solo lectura (2026-11-06)

- **Ola:** V2.
- **Estado:** `PASS` local.
- **Alcance:** dashboard global, pedidos y detalle, productos y detalle, almacenes, inventario, envíos, vendedores, autorización por rol y guarda de método.
- **Evidencia ejecutada:**
  - `backend`: `npm run verify`: typecheck OK; 18 archivos / 145 pruebas; `OpenAPI válido: 52 rutas, 59 operaciones, 647 referencias`; build OK.
  - `backend`: `npm run test:postgres`: 7 archivos / 37 pruebas OK.
  - `backend`: guarda de método: `GET` anónimo → `401`; `POST` → `405` con `Allow: GET, HEAD`.
  - `backend`: login real del supervisor demo: rol `SUPERVISOR`, estado `ACTIVO`.
  - `frontend`: `npm run typecheck` y `npm run build`: OK; 29 rutas.
  - `frontend`: `npm run test:e2e`: 6/6 PASS, incluida la suite de supervisión.
- **Criterios cubiertos:** solo lectura estructural; sin herencia de administrador; dashboard con conteos directos e `INV-03`; minimización de datos personales; sin formularios ni mutaciones; contrato sin operaciones de escritura.
- **Límites:** reportes administrativos `BLOQUEADO` (`L-19`). Lint sigue `BLOCKED`; CI sigue `READY_FOR_REVIEW`.
- **Revisión independiente:** no ejecutada para este gate; el estado es `PASS` local, no `DONE`.

### GATE-V2-ADMIN — espacio administrativo (2026-11-08)

- **Ola:** V2.
- **Estado:** `PASS` local.
- **Alcance:** dashboard, usuarios, vendedores, compradores, bodegas, catálogo, inventario, movimientos, pedidos, pagos y reportes; guarda de método; preservación de las dos altas existentes.
- **Evidencia ejecutada:**
  - `backend`: `npm run verify`: typecheck OK; 20 archivos / 160 pruebas; `OpenAPI válido: 68 rutas, 76 operaciones, 904 referencias`; build OK.
  - `backend`: `npm run test:postgres`: 8 archivos / 40 pruebas OK.
  - `backend`: pruebas admin: `admin.test.ts` (5), `admin-http.test.ts` (10), `admin-postgres.test.ts` (3).
  - `backend`: guarda de método: `GET` anónimo → `401`; `POST`/`PATCH`/`DELETE` fuera de las altas → `405`.
  - `backend`: alta atómica de vendedor conservada; rollback por fallo de bodega sigue probado.
  - `frontend`: `npm run typecheck` y `npm run build`: OK; 49 rutas (20 admin).
  - `frontend`: `npm run test:e2e`: 7/7 PASS contra build de producción, incluida la suite administrativa.
- **Criterios cubiertos:** autorización por rol y estado; guarda de método con allowlist de escritura; adaptador solo `SELECT`; minimización de datos; reportes solo con agregados reales; altas existentes intactas.
- **Límites:** catálogo/fórmulas/filtros/exportaciones de reportes `BLOQUEADO` (`L-19`); devoluciones, reembolsos y facturación `BLOQUEADO`; mutaciones admin `BLOQUEADO`; autoregistro y solicitud comprador → vendedor `DEFERRED`. Lint sigue `BLOCKED`; CI sigue `READY_FOR_REVIEW`.
- **Revisión independiente:** no ejecutada para este gate; el estado es `PASS` local, no `DONE`.

### GATE-V2-IDENTITY — identidad y onboarding (2026-11-09)

- **Ola:** V2.
- **Estado:** `PASS` (local + CI remoto).
- **Alcance:** registro público de comprador, solicitud comprador → vendedor, revisión administrativa (aprobación/rechazo), estados de acceso y revocación de sesiones; lint y CI ampliado.
- **Evidencia ejecutada:**
  - `backend`: `npm run verify`: lint OK, Prettier OK, typecheck OK; 23 archivos / 187 pruebas; `OpenAPI válido: 74 rutas, 83 operaciones, 984 referencias`; build OK.
  - `backend`: `npm run test:postgres`: 9 archivos / 46 pruebas OK.
  - `backend`: pruebas de identidad: `seller-applications.test.ts` (9), `update-user-access-status.test.ts` (7), `seller-applications-http.test.ts` (11), `seller-applications-postgres.test.ts` (6).
  - `backend`: migración `009_seller_applications.sql` aplicada sobre la base demo; índice único parcial de solicitud pendiente verificado.
  - `frontend`: `npm run lint` 0 errores (2 avisos `no-img-element`); `npm run typecheck` y `npm run build` OK; 56 rutas.
  - `frontend`: `npm run test:e2e`: 10/10 PASS, incluidos registro → solicitud → aprobación, rechazo sin efectos y cambio de estado con revocación de sesión. La suite administrativa crea un pedido real por checkout y usa encabezados exactos y búsquedas por filtro.
  - CI remoto: run `42749289978`, 5/5 jobs correctos (backend estático, pruebas backend, PostgreSQL, frontend y E2E).
- **Criterios cubiertos:** el backend fija el rol; no hay autoregistro de vendedor; la identidad y el historial de comprador se conservan; aprobación atómica e idempotente; rechazo sin efectos; transiciones de acceso explícitas; revocación de sesiones; autogestión prohibida.
- **Límites:** reenvío/edición tras rechazo `PENDIENTE_DECISIÓN`; notificaciones externas `NOT_IMPLEMENTED`; CI remoto `PASS`.
- **Revisión independiente:** no ejecutada para este gate; el estado es `PASS` local y de CI, no `DONE`.

### Gates previstos

| Gate | Alcance | Estado |
|---|---|---|
| GATE-W0 | Inventario y baseline | `PASS` (2026-10-28) |
| GATE-W1-01 | Triage de conflictos y brechas | `PASS` (2026-10-28) |
| GATE-W1 | Dominio y decisiones | `NOT_RUN` (`W1-04`/`W1-05` y `W1-06`…`W1-08` pendientes) |
| GATE-W2 | Arquitectura y datos | `NOT_RUN` |
| GATE-W3 | OpenAPI y contratos | `NOT_RUN` |
| GATE-W4 | Fundación y Docker | `NOT_RUN` |
| GATE-W5 | Casos de uso verticales | `NOT_RUN` |
| GATE-W6 | Integración y pruebas críticas | `NOT_RUN` |
| GATE-W7 | Seguridad y robustez | `NOT_RUN` |
| GATE-W8 | Release candidate | `NOT_RUN` |
| GATE-V2-SELLER | Espacio de trabajo del vendedor | `PASS` local (2026-11-03) |
| GATE-V2-LOGISTICS | Operación logística | `PASS` local (2026-11-05) |
| GATE-V2-SUPERVISOR | Supervisión de solo lectura | `PASS` local (2026-11-06) |
| GATE-V2-ADMIN | Espacio administrativo | `PASS` local (2026-11-08) |
| GATE-V2-IDENTITY | Identidad y onboarding | `PASS` local + CI (2026-11-09; run `42749289978` el 2026-11-10) |

---

## 15. Registro de cambios y continuidad

| Sesión | Fecha | Commit | Trabajo realizado | Decisiones | Pruebas | Próximo paso |
|---|---|---|---|---|---|---|
| S-000 | 2026-10-28 | `badf0b1` | Inicialización de plantilla | Ninguna | No ejecutadas | Completar W0 |
| S-001 | 2026-10-28 | `badf0b1` | W0: inventario, baseline, discrepancias, backlog, layout propuesto y estado | Solo propuestas `PROPOSED`; ningún ADR aprobado | Baseline Git/entorno; build/tests `NOT_APPLICABLE` | Revisión independiente |
| S-002 | 2026-10-28 | `badf0b1` | Revisión independiente (FAIL) y correcciones `W0.1-01`…`W0.1-04` | Ninguna decisión de negocio; `CON-003`/`CON-004` reclasificados como requisito no documentado | Revisión de solo lectura; `git status`/`git ls-files -o` re-ejecutados | Re-revisión independiente (`W0.1-05`) |
| S-003 | 2026-10-28 | `badf0b1` | Segunda revisión (FAIL parcial), correcciones O1–O2/N1–N4 y tercera revisión (`PASS`) | Ninguna decisión de negocio | Tres revisiones de solo lectura; comprobaciones base re-ejecutadas | W1-01 tras autorización del usuario |
| S-004 | 2026-10-28 | `badf0b1` | W1-01: matriz de los seis IDs, resolución documental de `GAP-001`/`GAP-002` y registro de ADR/contratos | `GAP-001` parcial; `GAP-002` planificado; `CON-001`/`002` parciales; `CON-003`/`004` pendientes | Análisis documental; sin pruebas funcionales | Responder Q1–Q4; no iniciar W1-02 |
| S-005 | 2026-10-28 | `badf0b1` | Cierre de W1-01; ejecución documental de W1-02/W1-03; corrección de contradicciones en prompt, modelo, `DS-07`, `VO`, puertos, contratos y estado | `DEC-W1-001`…`004` aprobadas; `DEC-W1-007`/`008`; `CON-*` resueltos; `U-002`/`U-003` cerrados | Contraste documental y búsquedas; sin build/tests/migraciones; `W1-02`/`W1-03 = DONE_DOCUMENTAL` | Revisar decisiones; no iniciar W1-04/W1-05 ni W2 sin `U-001` |
| S-006 | 2026-10-28 | `badf0b1` | Implementación inicial de `PI-01`, migración y smoke PostgreSQL manual | `DEC-IMPL-001`…`009` | `typecheck`; 16 pruebas; build; smoke `201`/`409`; PostgreSQL manual | Automatizar PostgreSQL |
| S-007 | 2026-10-28 | `badf0b1` | Suite PostgreSQL automatizada, contrato de tres rutas, revisión independiente `PASS`; `PI-02` evaluado y bloqueado | Sin decisiones de negocio nuevas | 29 pruebas; 2 PostgreSQL; guardas de base | Decidir auth, dirección y contrato de `PI-02` |
| S-008 | 2026-11-01 | `10e65d8` | Eliminación del adaptador en memoria; catálogo público; migración `003`; seed demo; frontend Next.js; documentación de implementación | `DEC-V1-001`…`014` | 51 pruebas; 11 PostgreSQL; typecheck/build backend y frontend; smoke end-to-end | Decidir `ADR-004`/`L-01` y contrato de `PI-02`; CI |
| S-009 | 2026-11-03 | `90e2c70` | Espacio de trabajo del vendedor: migración `007`, dominio, casos de uso, store PostgreSQL, 18 rutas, frontend `/seller`, OpenAPI `0.4.0`, pruebas y smoke | `DEC-V2-011`…`018` | 110 pruebas / 14 archivos; 28 PostgreSQL / 5 archivos; OpenAPI 33/40/419; smoke 33/33; frontend 18 rutas; E2E 3/3 | Revisar el corte, ejecutar CI y decidir imágenes/entrega digital |
| S-010 | 2026-11-04 | `90e2c70` | Continuación del cierre: reconciliación documental y E2E cruzado admin → vendedor → comprador → pedido | Sin decisiones nuevas; aplica `DEC-V2-011`…`018` | 110 pruebas / 14 archivos; 28 PostgreSQL / 5 archivos; OpenAPI 33/40/419; smoke 33/33; frontend 18 rutas; E2E 4/4 | Revisar el diff, ejecutar CI y decidir imágenes/entrega digital |
| S-011 | 2026-11-04 | `90e2c70` | Corrección de imágenes rotas del catálogo y alta del vendedor de verificación “Casa Luna” | Sin decisiones de negocio nuevas; se mantiene la política de imágenes por URL | Smoke 33/33; E2E 4/4; typecheck/build OK; 8 URLs de imagen verificadas contra `frontend/public/products` | Revisar el diff, ejecutar CI y decidir imágenes/entrega digital |
| S-012 | 2026-11-05 | `90e2c70` | Rol Operador Logístico: migración `008`, dominio, casos de uso, store PostgreSQL, 9 rutas logísticas + alta administrativa, frontend `/logistics`, seed demo, OpenAPI `0.5.0`, historial de checkout y pruebas | `DEC-V2-019`…`DEC-V2-026` (ámbito por bodegas, preparación/despacho/entrega, idempotencia, historial, `CloseOrder` bloqueado) | 131 pruebas / 16 archivos; 34 PostgreSQL / 6 archivos; OpenAPI 43/50/544; smoke 33/33; frontend 22 rutas; E2E 5/5 | Revisar el diff, ejecutar CI y decidir `CloseOrder` e integraciones externas |
| S-013 | 2026-11-06 | `90e2c70` | Rol Supervisor de solo lectura: módulo `supervisor`, 9 rutas `GET`, guarda `405`, store PostgreSQL solo `SELECT`, dashboard real, frontend `/supervisor`, seed demo, OpenAPI `0.6.0`, pruebas y E2E | `DEC-V2-027`…`DEC-V2-031` (módulo global, guarda de método, sin herencia admin, minimización de datos, dashboard sin KPIs inventados y reportes `L-19`) | 145 pruebas / 18 archivos; 37 PostgreSQL / 7 archivos; OpenAPI 52/59/647; smoke 33/33; frontend 29 rutas; E2E 6/6 | Revisar el diff, ejecutar CI y definir el catálogo de reportes (`L-19`) |
| S-014 | 2026-11-08 | `90e2c70` | Rol Administrador: módulo `admin`, 17 rutas `GET`, guarda de método con allowlist de escritura, store PostgreSQL solo `SELECT`, dashboard y reportes con agregados reales, frontend `/admin` (20 rutas), alta de vendedores en `/admin/sellers/new`, OpenAPI `0.7.0`, pruebas y E2E | `DEC-V2-032`…`DEC-V2-036` (espacio admin de consulta, guarda de método, reportes solo agregados, minimización de datos, separación lista/alta) | 160 pruebas / 20 archivos; 40 PostgreSQL / 8 archivos; OpenAPI 68/76/904; smoke 33/33; frontend 49 rutas; E2E 7/7 | Revisar el diff, ejecutar CI y definir reportes/devoluciones/autoregistro antes de ampliar |

### Plantilla de reanudación — S-003

- **Fecha:** 2026-10-28
- **Rama/commit inspeccionados:** `main` / `badf0b1993c927d6713d85cd7b44eee8b4259a46`
- **Estado del árbol:** limpio en archivos rastreados; 3 entradas / 6 archivos sin rastrear (`docs/backend/w0/*`, `orchestrator-state.md`, `prompt-orquestador-backend.md`).
- **Tarea activa al iniciar:** `W0.1-05` re-revisión.
- **Tarea terminada:** `W0.1-05` (tercera revisión `PASS`); `GATE-W0 = PASS`.
- **Archivos modificados/creados:** `orchestrator-state.md` y los cuatro artefactos de `docs/backend/w0/`. No se modificó ningún documento fuente ni se creó código.
- **Artefactos comprobados:** 38 archivos rastreados; 6 sin rastrear; ausencia de código; versiones del entorno; hashes; tablas y conteos.
- **Decisiones nuevas:** ninguna aprobada; `backend/src/` registrado como requisito externo.
- **Bloqueos al cerrar S-004:** `CON-001`…`CON-004` seguían abiertos y bloqueaban W1/W5; se resolvieron en S-005.
- **Pruebas ejecutadas:** tres revisiones independientes de solo lectura; baseline de Git/entorno; ausencia de artefactos.
- **Pruebas pendientes:** build, lint, typecheck, unit, integration, contract, e2e, migraciones, OpenAPI, Docker Compose.
- **Discrepancias estado/repositorio:** resueltas tras W0.1; la tercera revisión no encontró defectos bloqueantes ni mayores.
- **Tarea que debe continuar:** `W1-01` (triage de conflictos y decisiones), solo con autorización del usuario.
- **NEXT_ACTION:** esperar autorización; luego resolver `CON-001`…`CON-004` y `GAP-001`/`GAP-002`; no crear código antes del gate W2.
- **Prerequisitos:** autorización explícita del usuario; decisiones de negocio para los `CON`.
- **Comprobaciones al reanudar:** `git status --short`, `git rev-parse HEAD`, `git ls-files -o --exclude-standard`, `docs/backend/w0/*` y ausencia de código no autorizado.

### Plantilla de reanudación — S-004

- **Fecha:** 2026-10-28
- **Rama/commit inspeccionados:** `main` / `badf0b1993c927d6713d85cd7b44eee8b4259a46`
- **Estado del árbol:** sin commit nuevo; `docs/backend/w1/*` añadido como artefacto sin rastrear, además de los artefactos W0 y `prompt-orquestador-backend.md`. No hay código.
- **Tarea activa al iniciar:** `W1-01`.
- **Tarea terminada en S-004:** `W1-01` quedó `PARTIAL` y `GATE-W1-01 = BLOCKED`; superado por S-005.
- **Archivos modificados/creados:** `docs/backend/w1/01-resolution-matrix.md`, `docs/backend/w1/02-artifact-register.md`, `docs/backend/w0/01-inventory.md`, `docs/backend/w0/03-discrepancies.md`, `docs/backend/w0/04-backlog.md`, `orchestrator-state.md`.
- **Decisiones nuevas:** `DEC-W1-001`…`004` propuestas y pendientes; `DEC-W1-005`/`006` documentales y planificadas.
- **Bloqueos nuevos:** cuatro decisiones de negocio; no hay bloqueo de W1-01 por `GAP-002`.
- **Pruebas ejecutadas:** contraste documental y búsquedas de evidencia; ninguna prueba funcional.
- **Pruebas pendientes:** todas las de código; no existen artefactos ejecutables.
- **Discrepancias estado/repositorio:** ninguna; no se modificaron fuentes.
- **Tarea que debe continuar:** recibir Q1–Q4; después `W1-02`/`W1-03` si se autoriza.
- **NEXT_ACTION:** presentar Q1–Q4 y esperar decisión; no iniciar W1-02.
- **Prerequisitos:** decisión del propietario sobre variantes, plazo, imágenes y pago; autorización para W1-02.
- **Comprobaciones al reanudar:** `git status --short`, `git rev-parse HEAD`, `docs/backend/w1/*`, estados de `03-discrepancies.md` y ausencia de `backend/`.

### Plantilla de reanudación — S-005

- **Fecha:** 2026-10-28
- **Rama/commit inspeccionados:** `main` / `badf0b1993c927d6713d85cd7b44eee8b4259a46`
- **Estado del árbol:** sin commit nuevo; `docs/`, `orchestrator-state.md` y `prompt-orquestador-backend.md` siguen sin rastrear. No hay código.
- **Tarea activa al iniciar:** `W1-01` cerrada; `W1-02`/`W1-03` autorizadas.
- **Tarea terminada:** `W1-01 = DONE`; `W1-02`/`W1-03 = DONE_DOCUMENTAL`; `GATE-W1-01 = PASS`.
- **Archivos modificados/creados:** `docs/backend/w1/01-resolution-matrix.md`, `02-artifact-register.md`, `03-decisions.md`; `docs/backend/w0/01-inventory.md`, `03-discrepancies.md`, `04-backlog.md`; `orchestrator-state.md`; `README.md`; `prompt-orquestador-backend.md`; `BackendSDD/enunciado.md`, modelo, `DS-07`, `VO`, puertos, contratos, adaptadores, arquitectura y `DOCUMENTATION_STATUS.md`.
- **Decisiones nuevas:** `DEC-W1-001`…`004` aprobadas; `DEC-W1-007`/`008`; `U-002`/`U-003` cerrados.
- **Bloqueos nuevos:** ninguno. Siguen abiertos `U-001`, `U-004`…`U-008`, `L-10`, `L-22`, `L-27` y los riesgos de entorno.
- **Pruebas ejecutadas:** contraste documental, búsquedas de contradicciones y `git status`; ninguna prueba funcional.
- **Pruebas pendientes:** build, lint, typecheck, unit, integration, contract, e2e, migraciones, OpenAPI, Docker Compose; no existen artefactos.
- **Discrepancias estado/repositorio:** ninguna pendiente conocida; las contradicciones documentales identificadas se corrigieron o se registraron como límite.
- **Tarea que debe continuar:** ninguna automáticamente. Esperar aprobación de `U-001`; `W1-04` solo si el primer vertical usa direcciones.
- **NEXT_ACTION:** revisar `docs/backend/w1/03-decisions.md`; no iniciar `W1-04`/`W1-05` ni W2.
- **Prerequisitos:** aprobación del propietario para el primer vertical (`U-001`); autorización explícita para `W1-04`/`W1-05`.
- **Comprobaciones al reanudar:** `git status --short`, `git rev-parse HEAD`, `docs/backend/w1/*`, estados de `03-discrepancies.md` y ausencia de `backend/`.

### Plantilla de reanudación — S-006 (histórica: corte previo a la automatización PostgreSQL)

- **Fecha:** 2026-10-28
- **Rama/commit inspeccionados:** `main` / `badf0b1993c927d6713d85cd7b44eee8b4259a46`
- **Estado del árbol:** sin commit nuevo; `backend/` (incluido `node_modules`), `docs/`, `orchestrator-state.md` y `prompt-orquestador-backend.md` siguen sin rastrear. `backend/dist` y `backend/node_modules` están ignorados por `.gitignore`.
- **Tarea activa al iniciar:** auditoría de aceptación, desbloqueo de `U-001`/`U-005`…`U-008` e implementación del primer vertical.
- **Tarea terminada:** `PI-01 RegisterBuyer` implementado; `W1-05 = DONE`; `W1-06 = DONE_IMPLEMENTATION`; `GATE-PI01-CODE = PASS_WITH_CONSTRAINTS`; PostgreSQL 17.11 migrado y verificado manualmente.
- **Archivos creados/modificados:** `backend/**` (código, tests, migración, OpenAPI, README, compose, configuración); `docs/backend/implementation/01-acceptance-and-unblock.md`; actualizaciones en `docs/backend/w0/03-discrepancies.md`, `docs/backend/w0/04-backlog.md`, `docs/backend/w1/01-resolution-matrix.md`, `docs/backend/w1/02-artifact-register.md`, `docs/backend/w1/03-decisions.md`, `orchestrator-state.md` y `README.md`.
- **Decisiones nuevas:** `DEC-IMPL-001`…`009` (vertical, stack, propiedad de datos, layout, Node, auth diferida, contrato, auditoría/outbox y biblioteca Argon2id).
- **Bloqueos nuevos:** ninguno de Docker/PostgreSQL en este entorno; no hay revisión independiente nueva.
- **Pruebas ejecutadas:** `npm run typecheck` OK; `npm test` 4 archivos/16 pruebas OK; `npm run build` OK; `npm audit --omit=dev` 0 vulnerabilidades; smoke HTTP real `201`, `409`, `/health` y `/ready`; PostgreSQL 17.11 con migración, alta, duplicado y concurrencia (`201`+`409`, conteos 1/1/1/1/1).
- **Pruebas pendientes:** prueba PostgreSQL automatizada/CI, contract test/lint de OpenAPI y e2e de frontend.
- **Discrepancias estado/repositorio:** el estado anterior decía “sin backend”; corregido. La matriz W1 y el registro de artefactos conservan su texto histórico con notas de actualización.
- **Tarea que debe continuar:** automatizar la prueba PostgreSQL y su concurrencia; después `L-27`.
- **NEXT_ACTION:** añadir `TEST_DATABASE_URL` y una prueba reproducible con dos altas concurrentes, `409`, rollback y limpieza; no ampliar a `PI-02` ni catálogo.
- **Prerequisitos:** Docker/PostgreSQL disponibles; `TEST_DATABASE_URL` de una base de prueba; `L-27` para cerrar el contrato.
- **Comprobaciones al reanudar:** `git status --short`, `git rev-parse HEAD`, `npm run typecheck`, `npm test`, `npm run build`, `docker info`, presencia de `backend/`.

### Plantilla de reanudación — S-007

- **Fecha:** 2026-10-28
- **Rama/commit inspeccionados:** `main` / `badf0b1993c927d6713d85cd7b44eee8b4259a46`
- **Estado del árbol:** sin commit nuevo; `backend/`, `docs/`, `orchestrator-state.md` y `prompt-orquestador-backend.md` siguen sin rastrear. `backend/node_modules` y `backend/dist` están ignorados por `.gitignore`; no crear commit sin autorización.
- **Tarea activa al iniciar:** cierre verificable de `PI-01`, automatización PostgreSQL y contrato de las rutas existentes.
- **Tarea terminada:** suite PostgreSQL automatizada con guardas y limpieza; contrato de tres rutas y pruebas HTTP/OpenAPI; documentación operativa reconciliada; revisión independiente `PASS` con correcciones aplicadas; `PI-02` evaluado y mantenido `BLOCKED`.
- **Archivos creados/modificados:** `backend/tests/postgres/**`, `backend/tests/contract/openapi.test.ts`, `backend/tests/integration/register-buyer-http.test.ts`, `backend/vitest.postgres.config.ts`, `backend/openapi.yaml`, `backend/README.md`, `backend/package.json`, `backend/tsconfig.json`, `backend/.env.example`; `docs/backend/implementation/01-acceptance-and-unblock.md`, `02-operational-source-reconciliation.md`, `03-pi02-evaluation.md`; `README.md`, `docs/backend/w0/04-backlog.md`, `docs/backend/w1/01-resolution-matrix.md`, `prompt-orquestador-backend.md`, `orchestrator-state.md`.
- **Decisiones nuevas:** ninguna de negocio. Se mantienen `DEC-IMPL-001`…`009`; `PI-02` no se implementa.
- **Bloqueos nuevos:** `PI-02` por autenticación/autorización (`ADR-004`), composición de `DireccionFisica` (`L-01`) y contrato de ruta. CI y migraciones versionadas siguen pendientes.
- **Pruebas ejecutadas:** `npm run typecheck` OK; `npm test` 5 archivos/29 pruebas OK; `npm run test:postgres` 2 pruebas OK contra PostgreSQL 17.11; `npm run build` OK; guardas de `TEST_DATABASE_URL` verificadas; conteos finales de la base de prueba en 0.
- **Pruebas pendientes:** CI, validador semántico OpenAPI, lint y e2e de frontend.
- **Discrepancias estado/repositorio:** el prompt operativo citaba fuentes inexistentes y un layout distinto; corregido y registrado en `02-operational-source-reconciliation.md`. `L-27` se cerró solo para tres rutas.
- **Tarea que debe continuar:** decidir `ADR-004`, `L-01` y ruta de `PI-02`; llevar PostgreSQL a CI.
- **NEXT_ACTION:** formular las decisiones de autenticación, dirección y contrato de `PI-02`; no ampliar a `PI-02` ni catálogo sin autorización.
- **Prerequisitos:** Docker/PostgreSQL disponibles; `TEST_DATABASE_URL` de una base local terminada en `_test`; autorización del propietario para cualquier ampliación.
- **Comprobaciones al reanudar:** `git status --short`, `git rev-parse HEAD`, `npm run typecheck`, `npm test`, `npm run build`, `npm audit --omit=dev`, `docker info` y `npm run test:postgres` con la URL de prueba.

### Plantilla de reanudación — S-008

- **Fecha:** 2026-11-01
- **Rama/commit inspeccionados:** `main` / `10e65d8cb7f46898342323d223076255e7b95bb4`
- **Estado del árbol:** cambios sin commit en `backend/`, `frontend/`, `README.md`, `orchestrator-state.md` y `docs/implementation/`; `backend/node_modules`, `backend/dist` y `frontend/node_modules` ignorados.
- **Tarea activa al iniciar:** eliminar la persistencia en memoria, diagnosticar el baseline y construir una primera entrega demostrable.
- **Tarea terminada:** adaptador en memoria eliminado; PostgreSQL obligatorio; catálogo público; migración `003`; seed demo; frontend Next.js; documentación de implementación; verificación local de Gates A–E.
- **Archivos creados/modificados:** `backend/src/config.ts`, `factory.ts`, `app.ts`, `server.ts`, `modules/catalog/**`, `migrations/003_catalog.sql`, `scripts/seed-demo.ts`, `tests/**`, `openapi.yaml`, `README.md`; `frontend/**`; `docs/implementation/**`; `README.md`; `orchestrator-state.md`.
- **Decisiones nuevas:** `DEC-V1-001`…`014`.
- **Bloqueos nuevos:** ninguno funcional. Autenticación/autorización, carrito, checkout, pagos, CI y validador OpenAPI siguen pendientes. Espacio en disco bajo.
- **Pruebas ejecutadas:** `npm run typecheck` OK; `npm test` 8 archivos/51 pruebas; `npm run test:postgres` 3 archivos/11 pruebas; `npm run build` OK en backend y frontend; smoke end-to-end con home `200`/8, catálogo `200`/6, página 2 `200`/2, detalle `200`, inexistente/malformado `404`.
- **Pruebas pendientes:** CI, lint, validador semántico OpenAPI y e2e de navegador.
- **Discrepancias estado/repositorio:** el prompt citaba Go y un alcance mayor; se preservó TypeScript/Fastify y se registró en `DEC-V1-001`. Las plantillas S-001…S-007 son históricas.
- **Tarea que debe continuar:** decidir `ADR-004`, `L-01` y el contrato de `PI-02`; llevar las suites a CI.
- **NEXT_ACTION:** formular autenticación/autorización administrativa y el contrato de alta de vendedor + primera bodega; no ampliar a carrito, checkout ni pagos.
- **Prerequisitos:** PostgreSQL disponible; `TEST_DATABASE_URL` de una base local terminada en `_test`; autorización del propietario para cualquier ampliación.
- **Comprobaciones al reanudar:** `git status --short`, `git rev-parse HEAD`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:postgres` y `cd frontend; npm run typecheck; npm run build`.

### Plantilla de reanudación — S-009

- **Fecha:** 2026-11-03
- **Rama/commit inspeccionados:** `entrega-1-catalogo` / `90e2c70`
- **Estado del árbol:** trabajo del vendedor sin commit en `backend/`, `frontend/`, `docs/implementation/` y `orchestrator-state.md`; `node_modules` y `dist`/`.next` ignorados.
- **Tarea activa al iniciar:** auditoría del rol Vendedor y construcción de su espacio de trabajo sobre el marketplace existente.
- **Tarea terminada:** migración `007`; dominio, casos de uso, store PostgreSQL y 18 rutas `/api/v1/seller/*`; frontend `/seller`; OpenAPI `0.4.0`; pruebas unitarias/HTTP/PostgreSQL/contrato; smoke 33/33; E2E 4/4 (incluye recorrido cruzado).
- **Decisiones nuevas:** `DEC-V2-011`…`018` (ownership, ciclo de producto, imágenes URL, ingreso idempotente, pedidos de solo lectura, perfil acotado, clave de idempotencia y logging 5xx).
- **Bloqueos:** carga binaria de imágenes, ajustes negativos/logística y entrega digital. Lint `BLOCKED`; CI `READY_FOR_REVIEW`.
- **Pruebas ejecutadas:** `npm run verify` (110/14, OpenAPI 33/40/419, build); `npm run test:postgres` (28/5); `npm run smoke:seller` (33/33); `npm run typecheck`/`build` frontend (18 rutas); `npm run test:e2e` (4/4, incluye `cross-role.spec.ts`).
- **Pruebas pendientes:** CI en GitHub, lint y carga masiva.
- **Discrepancias estado/repositorio:** variantes (`CAT-02`) siguen fuera de V1 por decisión; `FileStorage` y `PUB-06` sin definición aprobada. Registradas, no inventadas.
- **Tarea que debe continuar:** revisión del diff, ejecución de CI y decisiones de imágenes/entrega digital.
- **NEXT_ACTION:** ejecutar CI en GitHub y registrar el resultado; no habilitar capacidades bloqueadas sin decisión.
- **Prerequisitos:** PostgreSQL disponible; `TEST_DATABASE_URL` de una base terminada en `_test`; backend en `:3000` y frontend en `:3001` para smoke/E2E; autorización del propietario para cualquier ampliación.
- **Comprobaciones al reanudar:** `git status --short`, `git rev-parse HEAD`, `npm run verify`, `npm run test:postgres`, `npm run smoke:seller` (con API arriba) y `cd frontend; npm run typecheck; npm run build; npm run test:e2e`.

### Plantilla de reanudación — S-010

- **Fecha:** 2026-11-04
- **Rama/commit inspeccionados:** `entrega-1-catalogo` / `90e2c70`
- **Estado del árbol:** trabajo del vendedor y E2E cruzado sin commit; documentación de cierre actualizada.
- **Tarea terminada:** reconciliación documental del corte y nuevo `frontend/e2e/cross-role.spec.ts` (admin registra vendedor → vendedor publica con stock → comprador compra con pago simulado → vendedor consulta el pedido).
- **Evidencia:** backend 110/14; PostgreSQL 28/5; OpenAPI 33/40/419; smoke 33/33; frontend 18 rutas; E2E 4/4.
- **Bloqueos vigentes:** imágenes binarias, ajustes negativos/logística, entrega digital, lint y CI. Sin cambios.
- **Tarea que debe continuar:** revisar el diff completo, ejecutar CI y obtener decisión para los bloqueos.
- **NEXT_ACTION:** ejecutar CI en GitHub y registrar el resultado real; no habilitar capacidades bloqueadas sin decisión.
- **Comprobaciones al reanudar:** las mismas de S-009, añadiendo `npx playwright test e2e/cross-role.spec.ts` para el recorrido cruzado.

---

## 16. Estado de entrega

| Capacidad | Estado | Evidencia requerida |
|---|---|---|
| Dominio y reglas | `IMPLEMENTED` para auth, direcciones, alta de vendedor, carrito, checkout, pago simulado, espacio del vendedor, operación logística y supervisión de solo lectura; resto `DOCUMENTED` / `NOT_IMPLEMENTED` | `backend/src/modules/*/domain/*`; pruebas unitarias y PostgreSQL |
| Arquitectura hexagonal | `IMPLEMENTED` en los módulos (dominio/aplicación/infraestructura/HTTP) | `backend/src`; separación de capas; sin imports de HTTP/SQL en dominio |
| PostgreSQL | `IMPLEMENTED` y verificado con suite automatizada | Migraciones `001`…`008`; `tests/postgres/**` (37 pruebas); CI pendiente |
| Catálogo público | `IMPLEMENTED` (lectura) + mutaciones del vendedor + lectura global del supervisor | `modules/catalog/**`, `modules/seller-workspace/**`, `modules/supervisor/**`; pruebas HTTP/PostgreSQL |
| Frontend | `IMPLEMENTED` (marketplace + `/seller` + `/logistics` + `/supervisor`, 29 rutas) | `frontend/**`; typecheck/build; E2E 6/6 |
| MongoDB | `NOT_STARTED` | Sin colecciones; fuera de este corte |
| OpenAPI | `IMPLEMENTED` (`0.6.0`: 52 rutas, 59 operaciones) | `backend/openapi.yaml`; validador offline; contrato 6 pruebas |
| Autenticación | `IMPLEMENTED` (sesiones opacas, cookie HttpOnly, bearer) | `modules/identity/**`; pruebas y smoke |
| Autorización y ownership | `IMPLEMENTED` (admin, comprador, vendedor, operador logístico y supervisor; `404` en acceso cruzado; supervisor sin herencia admin) | Matriz §19; pruebas HTTP/PostgreSQL/E2E |
| Inventario y concurrencia | `IMPLEMENTED` para reservas de checkout, ingreso del vendedor y consumo por despacho; ajustes negativos `BLOQUEADO` | `inventory`, `inventory_movements`, bloqueo asesor; pruebas |
| Logística | `IMPLEMENTED` (ámbito por bodegas, preparación, despacho, entrega con evidencia e historial); asignación/tracking/cierre `BLOQUEADO` | `modules/logistics/**`; migración `008`; pruebas y E2E |
| Supervisión | `IMPLEMENTED` (solo lectura global, guarda `405`, dashboard real y minimización de datos); reportes `BLOQUEADO` (`L-19`) | `modules/supervisor/**`; pruebas y E2E |
| Pago | `IMPLEMENTED` simulado con `DESCONOCIDO` explícito; reconciliación pendiente | `modules/orders/**`; pruebas PostgreSQL; smoke |
| Docker | `IMPLEMENTED` y verificado | Docker 29.8.0; `compose.yaml`; PostgreSQL 17.11 healthy |
| Integración | `DONE` local (HTTP/PostgreSQL/frontend/E2E) | 145 pruebas; 37 PostgreSQL; smoke 33/33; E2E 6/6 (incluye logística y supervisión); CI pendiente |
| Seguridad | `PARTIAL` (Argon2id, HttpOnly, ownership, sin secretos en auditoría); revisión independiente pendiente | Pruebas de hash, sesión y ownership |
| Documentación | `UPDATED` para este corte; revisión independiente pendiente | `docs/implementation/*`; `orchestrator-state.md` |
| Release candidate | `NOT_STARTED` | `GATE-W8` no ejecutado |

---

## 17. Protocolo de reanudación

1. Leer `prompt-orquestador-backend.md`, este archivo, `docs/implementation/IMPLEMENTATION-STATUS.md` y `docs/implementation/DECISIONS-LOG.md`.
2. Verificar `git status`, rama, commit y artefactos de `backend/`, `frontend/` y `docs/implementation/`.
3. Confirmar que `GATE-W0`, `GATE-W1-01`, `GATE-PI01-*`, `GATE-V1-A`…`H`, `GATE-V2-SELLER`, `GATE-V2-LOGISTICS`, `GATE-V2-SUPERVISOR`, `GATE-V2-ADMIN` y `GATE-V2-IDENTITY` siguen en `PASS` local; el CI remoto está en `PASS` (run `42749289978`). `GATE-W1` y `GATE-W2`…`W8` siguen `NOT_RUN` como gates amplios.
4. No habilitar carga binaria de imágenes, ajustes negativos, operaciones logísticas del vendedor, reembolsos, escritura del supervisor, reenvío de solicitudes rechazadas, notificaciones externas ni el cierre `ENTREGADO → CERRADO` sin decisión explícita. El operador logístico ya opera preparación, despacho y entrega dentro de su ámbito; el supervisor solo consulta; el comprador se registra públicamente y solicita ser vendedor; el vendedor no se autorregistra.
5. Ejecutar las suites backend de forma secuencial y el build del frontend por separado para evitar OOM/ENOSPC.
6. Actualizar este archivo en el mismo cambio de trabajo.

---

## 18. Condición de finalización del backend

El proyecto no puede declararse completo porque el servidor arranque. La entrega final requiere requisitos trazables, dominio e invariantes respetados, contratos coherentes, persistencia justificada, transacciones/concurrencia verificadas, seguridad comprobada, pruebas críticas ejecutadas, Docker reproducible, documentación actualizada y `GATE-W8` aprobado.

**Estado actual:** W0 documentado y aprobado; W1-01 `DONE`; `PI-01 RegisterBuyer`, catálogo público, autenticación, direcciones, alta administrativa de vendedor, carrito, checkout con pago simulado, espacio del vendedor, operación logística, supervisión de solo lectura, espacio administrativo de consulta, registro público de comprador, solicitud comprador → vendedor y estados de acceso implementados con Fastify/TypeScript y PostgreSQL. Evidencia local: 187 pruebas backend / 23 archivos, 46 pruebas PostgreSQL / 9 archivos, OpenAPI `0.8.0` (74 rutas / 83 operaciones / 984 referencias), frontend de 56 rutas, lint en ambos proyectos, Prettier en backend, smoke del vendedor 33/33 y E2E 10/10 (incluye logística, supervisión, administración y onboarding de identidad). `GATE-V1-A`…`H`, `GATE-V2-SELLER`, `GATE-V2-LOGISTICS`, `GATE-V2-SUPERVISOR`, `GATE-V2-ADMIN` y `GATE-V2-IDENTITY = PASS` local; CI remoto `PASS` (run `42749289978`, 5/5 jobs). Siguen pendientes: política de reenvío/edición tras rechazo, reconciliación de pagos `DESCONOCIDO`, catálogo de reportes (`L-19`), devoluciones/reembolsos/facturación, notificaciones externas, almacenamiento binario de imágenes, ajustes negativos del vendedor, asignación automática/tracking externo, cierre `ENTREGADO → CERRADO`, entrega digital y release candidate. Los requisitos excluidos o pendientes están identificados en `docs/implementation/IMPLEMENTATION-STATUS.md`, `docs/implementation/DECISIONS-LOG.md` y `docs/backend/*`, y no se presentan como funcionalidades completas.
