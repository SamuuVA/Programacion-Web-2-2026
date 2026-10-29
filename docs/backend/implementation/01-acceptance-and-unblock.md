# Backend — Aceptación documental y desbloqueo de PI-01

**Fecha:** 2026-10-28
**Commit base:** `badf0b1993c927d6713d85cd7b44eee8b4259a46`
**Alcance:** auditoría de aceptación, decisiones técnicas reversibles y primer vertical ejecutable.
**Regla aplicada:** no se declara verificado ningún artefacto sin inspeccionarlo o ejecutarlo.

---

## 1. Método y baseline

Se contrastaron los documentos fuente del dominio, puertos, arquitectura, decisiones W1, matriz de resolución, registro de artefactos, backlog y estado operativo. No se repitió la auditoría completa de los 14 documentos de adaptadores porque sus registros de alineación y el alcance de `PI-01` no los requieren.

Baseline real:

| Elemento | Valor verificado |
|---|---|
| Node.js | `v24.21.0` |
| npm | `11.19.0` |
| Docker client | `29.8.0` |
| Docker daemon | Activo; `docker info` devolvió `29.8.0` |
| PostgreSQL | `postgres:17-alpine`, PostgreSQL 17.11, contenedor `nexusmarket-postgres` healthy |
| `psql` local | No está en `PATH`; se usó `docker compose exec -T postgres psql` |
| HEAD | `badf0b1993c927d6713d85cd7b44eee8b4259a46` |
| Estado Git | 14 archivos rastreados modificados; `backend/`, `docs/` y `orchestrator-state.md` sin rastrear |

## 2. Clasificación de artefactos

| Artefacto | Clasificación | Evidencia y límite |
|---|---|---|
| `BackendSDD/Application/nexusmarket-input-ports.md`, `PI-01` | `ACCEPTED_WITH_CONSTRAINTS` | Define propósito, entrada, precondiciones, postcondiciones y errores. Restricciones abiertas: `L-02`/`L-03` (longitud/formato exactos); `L-27` queda acotada a la ruta implementada y sigue abierta fuera de ella. No requiere dirección, pago ni imagen. |
| `BackendSDD/Application/nexusmarket-output-ports.md`, `PO-01`, `PO-02`, `PO-07`, `PO-14`, `PO-20`, `PO-21`, `PO-22`, `PO-23` | `ACCEPTED` | Definen persistencia de `Usuario`, `PerfilComprador` y `Carrito`, auditoría, reloj, ids, hasher y outbox. La implementación los compone en una frontera transaccional de primer vertical. |
| `BackendSDD/Domain/nexusmarket-domain-model.md` §6.1, §6.3, §9.1, §15.1 | `ACCEPTED_WITH_CONSTRAINTS` | Atributos e invariantes de las entidades usadas. La ubicación de auditoría en Mongo no es obligatoria para `PI-01`; se conserva la evidencia durable en PostgreSQL. |
| `BackendSDD/Domain/nexusmarket-domain-object-values.md` §6.2–§6.4 | `ACCEPTED_WITH_CONSTRAINTS` | Nombre, correo, documento y hash. `L-02`/`L-03` impiden fijar límites o formato exactos; se aplican solo normalización y validación mínimas documentadas. |
| `BackendSDD/Domain/services/servicio-auditoria.md` (`DS-09`) | `ACCEPTED_WITH_CONSTRAINTS` | Auditoría append-only y sin secretos. El catálogo de eventos (`L-14`) no está cerrado; se usa un código provisional versionado. |
| `BackendSDD/Software Architecture/nexusmarket-arquitectura.md` §4–§8 | `ACCEPTED_WITH_CONSTRAINTS` | Recomienda Node LTS, API REST, Fastify o Express, PostgreSQL y Vitest o Jest. No fija ORM, framework ni ruta; esas decisiones se adoptan abajo como reversibles. |
| `BackendSDD/Adapters/nexusmarket-adapter-http-input.md` | `ACCEPTED_WITH_CONSTRAINTS` | Prohíbe inventar rutas y códigos; `L-27` sigue abierto fuera de las tres rutas implementadas. La ruta es una decisión provisional del primer vertical, no una aprobación externa. |
| `BackendSDD/Adapters/nexusmarket-adapter-sql-identity-profiles.md` | `ACCEPTED_WITH_CONSTRAINTS` | Contrato de persistencia compatible con `PO-01`/`PO-02`; no existía implementación ejecutable. |
| `docs/backend/w1/03-decisions.md` | `ACCEPTED` | `DEC-W1-001`…`004` aprobadas; `DEC-W1-007` (estados iniciales) y `DEC-W1-008` (Argon2id/PHC) documentadas y aplicadas. |
| `docs/backend/w1/01-resolution-matrix.md` | `ACCEPTED_WITH_CONSTRAINTS` | Trazabilidad de conflictos y decisiones. Mantiene gates W2–W5 abiertos; no son requisito para este corte autorizado. |
| `docs/backend/w1/02-artifact-register.md` | `ACCEPTED_WITH_CONSTRAINTS` | Registra ADR/OpenAPI/migraciones faltantes. La estrategia de “no bloquear PI-01 por todo el SDD” se aplica en este corte. |
| `docs/backend/w0/04-backlog.md` | `ACCEPTED_WITH_CONSTRAINTS` | Backlog válido, pero su secuencia W2→W5 quedó superada por la autorización de implementar el primer vertical ahora. Se actualiza el estado, no se borra la historia. |
| `orchestrator-state.md` | `ACCEPTED_WITH_CONSTRAINTS` | Reflejaba “sin backend” y “no iniciar W2”; se actualiza con el corte real. |
| `README.md` raíz | `ACCEPTED_WITH_CONSTRAINTS` | Describe el proyecto y sus decisiones; se añade el estado ejecutable. |
| `BackendSDD/Contracts/nexusmarket-contract-alignment.md` | `NOT_VERIFIED` para contrato ejecutable | No se requiere para `PI-01`; `L-27` sigue abierto fuera de tres rutas. Se creó el contrato OpenAPI de las rutas implementadas y se cerró solo ese alcance. |

### 2.1 Decisiones de negocio y propagación

- `CON-001` → `DEC-W1-001 = A`: `Producto` + `Variante`; no afecta a `PI-01`.
- `CON-002` → `DEC-W1-002 = B`: devoluciones configurables con 30 días iniciales; no afecta a `PI-01`.
- `CON-003` → `DEC-W1-003 = A`: imágenes fuera de V1; no se creó almacenamiento ni campo de imagen.
- `CON-004` → `DEC-W1-004 = A`: sin pagos en `PI-01`; no se creó adaptador ni simulador de pago.

No se detectó una contradicción nueva que bloquee `PI-01`. `GAP-001` sigue `PARTIALLY_RESOLVED`; `U-004` (`L-01`, dirección) sigue abierto y fuera de alcance.

## 3. Decisiones técnicas adoptadas

Las siguientes son decisiones técnicas reversibles, no aprobaciones de negocio. Se adoptan porque las fuentes dejan el punto abierto y porque el usuario autorizó el desbloqueo y la implementación.

| ID | Decisión | Fuente / justificación | Impacto y reversión |
|---|---|---|---|
| `DEC-IMPL-001` | Primer vertical: `PI-01 RegisterBuyer`. | `U-001` recomendaba `PI-01`; el usuario pidió el primer vertical ejecutable. Es el flujo con menos dependencias (sin dirección, pago ni imagen). | Reversible: cambiar el primer vertical no altera las decisiones de negocio; el código de `buyers` queda aislado. |
| `DEC-IMPL-002` | TypeScript 5.9 + Node 24 + Fastify 5 + Zod 4 + Vitest 5. Acceso a PostgreSQL con `pg` y SQL directo, sin ORM en este vertical. | Arquitectura §4 permite Fastify/Express, PostgreSQL y Vitest/Jest; deja ORM abierto. El vertical usa cinco tablas y constraints simples; SQL directo evita codegen y motores nativos y mantiene la transacción explícita. | Reversible: el caso de uso depende de un puerto; se puede sustituir Fastify, Zod o `pg` sin tocar dominio. Si se adopta Prisma/Drizzle, se reemplaza solo la infraestructura. |
| `DEC-IMPL-003` | PostgreSQL es la fuente autoritativa de `Usuario`, `PerfilComprador`, `Carrito`, auditoría y outbox. El adaptador en memoria es solo desarrollo/pruebas. Mongo no se usa en `PI-01`. | Modelo §24.1 y `DS-09`; `U-006`. La primera transacción necesita atomicidad local; separar auditoría en Mongo añadiría consistencia distribuida sin necesidad. | Reversible: la auditoría puede migrarse a Mongo con outbox cuando exista una decisión y un adaptador; la fuente transaccional sigue en PostgreSQL. |
| `DEC-IMPL-004` | Layout `backend/src/modules/{identity,buyers,cart}/...`, `backend/src/shared/...`, `backend/tests/{unit,integration}`, `backend/migrations`. | `U-007`; arquitectura §7. | Reversible: mover archivos no cambia contratos; los imports se ajustan. |
| `DEC-IMPL-005` | Node.js 24 LTS, rango `>=24 <25`. | Entorno real `v24.21.0`; Node 24 es LTS al corte. | Reversible: fijar 22 LTS requeriría cambiar `engines` y validar dependencias. |
| `DEC-IMPL-006` | `PI-01` no implementa autenticación ni sesión. Para endpoints futuros se propone sesión opaca server-side con cookie `HttpOnly`/`SameSite`, pendiente de `ADR-004`. | `PI-01` es registro público y no exige autenticación; `L-27`/`ADR-004` siguen abiertos. | Reversible y no implementado; no se declara aprobado. |
| `DEC-IMPL-007` | Contrato: `POST /api/v1/buyers`, `/health`, `/ready`; JSON; `201`/`400`/`409`/`413`/`415`/`503`/`500`; `x-correlation-id`; UUID v4; timestamps UTC; error uniforme `{error:{codigo,mensaje,correlationId,detalles?}}`. | `L-27`/`L-13` abiertos; se elige lo mínimo para un vertical demostrable. OpenAPI en `backend/openapi.yaml` y contract test en `backend/tests/contract/openapi.test.ts`. | Reversible: la ruta y DTOs están en el adaptador HTTP; se puede cambiar sin tocar dominio. `L-27` se cierra solo para estas rutas. |
| `DEC-IMPL-008` | Evento/auditoría provisional `buyer.registered.v1`; auditoría y outbox en la misma transacción. El payload solo contiene ids. | `DS-09`, modelo §15.1, `PO-23`; `L-14` (catálogo de eventos) abierto. | Reversible: el catálogo puede versionarse; el outbox permite republicar. |
| `DEC-IMPL-009` | Biblioteca Argon2id: `@node-rs/argon2` 2.2.2, sal explícita de 16 bytes, salida 32, PHC. | `DEC-W1-008`; W1-03 dejó la biblioteca para W4. | Reversible: se sustituye el adaptador `PasswordHasher`; los hashes PHC conservan parámetros. |

## 4. Alcance del primer vertical

Incluido:

- `Usuario`: rol `COMPRADOR`, estado `ACTIVO`, correo normalizado, documento normalizado, hash Argon2id.
- `PerfilComprador`: estado `HABILITADO`, sin direcciones.
- `Carrito`: vacío, versión 1.
- Unicidad de correo y documento; conflicto `409`.
- Auditoría append-only y outbox en la misma transacción.
- Endpoint HTTP, validación, correlación, health/readiness.
- Adaptador PostgreSQL y adaptador en memoria.
- Pruebas unitarias, de integración HTTP y de contrato OpenAPI.
- Prueba automatizada PostgreSQL con concurrencia, `409`, rollback y limpieza dirigida.

Excluido:

- autenticación, login, sesiones, roles operativos y autorización;
- pagos, checkout, pedidos, devoluciones y reembolsos;
- imágenes, archivos, catálogo, variantes, inventario y direcciones;
- frontend;
- Mongo y proyecciones de auditoría;
- CI y ejecución de la suite PostgreSQL en un pipeline remoto.

## 5. Implementación y evidencia

### 5.1 Comprobaciones ejecutadas

| Comprobación | Comando | Resultado real |
|---|---|---|
| Instalación | `npm install` | 108 paquetes; `npm audit --omit=dev`: 0 vulnerabilidades. Advertencia de postinstall de `esbuild`; no impidió ejecutar Vitest. |
| Typecheck | `npm run typecheck` | Exit 0, sin errores. |
| Pruebas | `npm test` | 5 archivos, 29 pruebas aprobadas, exit 0. |
| Contrato PostgreSQL | `npm run test:postgres` con `TEST_DATABASE_URL` local | 1 archivo, 2 pruebas aprobadas: concurrencia `201`/`409` y rollback tras fallo posterior a escrituras. |
| Guarda de base | `npm run test:postgres` sin `TEST_DATABASE_URL` y con URL de `nexusmarket` | Exit 1 con error explícito; no se omite la suite ni se conecta a una base de desarrollo. |
| Limpieza | Consulta de conteos tras la suite | `users=0`, `buyers=0`, `carts=0`, `audit_log=0`, `outbox=0`; el centinela ajeno se conservó hasta la limpieza final. |
| Build | `npm run build` | Exit 0; salida en `backend/dist`. |
| Smoke HTTP en memoria | `node dist/server.js` en `127.0.0.1:3100` | `POST /api/v1/buyers` → `201`; duplicado → `409`; `/health` → `200`; `/ready` → `200`; correlación devuelta. |
| Docker Compose | `docker compose config`; `docker compose up -d`; `docker compose ps` | Config válida; `postgres:17-alpine` levantado y `healthy`; PostgreSQL 17.11. |
| Migración PostgreSQL | `npm run db:migrate` con `DATABASE_URL` local | `001_initial.sql` aplicada correctamente. |
| Smoke HTTP PostgreSQL | `node dist/server.js` en `127.0.0.1:3101`, `PERSISTENCE=postgres` | Alta `201`; duplicado `409`; `/ready` y `/health` `200`; filas en `users`, `buyers`, `carts`, `audit_log` y `outbox`. |
| Concurrencia PostgreSQL | Dos `POST` simultáneos con el mismo correo/documento | Un `201` y un `409`; la base quedó con 1 usuario, 1 comprador, 1 carrito, 1 auditoría y 1 evento. |

Pruebas cubiertas:

- VOs: nombre, correo, documento y hash PHC.
- Argon2id: parámetros `m=19456,t=2,p=1`, verificación correcta/incorrecta.
- Caso de uso: alta completa, correo duplicado, documento duplicado, credencial fuera de 12–128, ausencia de contraseña en entidad/resultado/auditoría/outbox.
- HTTP: `201`, `400` por cuerpo inválido/JSON malformado/correo/propiedad desconocida, `409` por correo y documento, `413`, `415`, `503`, correlación generada/reemplazada, health/readiness y readiness no disponible.
- Contrato OpenAPI: solo las tres rutas implementadas, métodos, respuestas documentadas, `additionalProperties: false` y referencias locales resueltas.
- PostgreSQL: concurrencia real, `409`, rollback posterior a `users`/`buyers`/`carts`, ausencia de filas parciales y limpieza por identificadores/correlación.

### 5.2 Evidencia parcial o no automatizada

- La suite PostgreSQL está automatizada y se ejecuta con `npm run test:postgres`, pero no está integrada en CI ni en `npm test`.
- El contrato OpenAPI tiene prueba de sintaxis, rutas, respuestas y referencias; no hay un validador semántico OpenAPI ni lint de esquemas.
- La revisión independiente del corte se ejecutó y terminó en `PASS`; sus límites residuales se registran en la sección 11.
- `psql` no está instalado en el host; se usó el cliente del contenedor.
- La prueba de concurrencia demuestra el comportamiento actual y es reproducible localmente; no sustituye una ejecución en CI.
- `migrate.ts` aplica un único archivo y no mantiene una tabla de migraciones versionadas; una segunda ejecución sobre el mismo esquema falla. Es aceptable para este corte, pero debe sustituirse antes de un despliegue repetible.
- La prueba PostgreSQL requiere una base local dedicada terminada en `_test`; si no está disponible, el script falla y el gate debe registrarse `BLOCKED`.

### 5.3 Gates de este corte

| Gate | Estado | Motivo |
|---|---|---|
| `GATE-PI01-CODE` | `PASS` | Typecheck, 29 pruebas, build, smoke HTTP y revisión independiente (`PASS`) aprobados; límites residuales en la sección 11. |
| `GATE-PI01-POSTGRES` | `PASS` | Suite automatizada ejecutada contra PostgreSQL 17.11; concurrencia, `409`, rollback, ausencia de parciales y limpieza comprobados. CI sigue pendiente. |
| `GATE-PI01-CONTRACT` | `PASS_WITH_CONSTRAINTS` | Contrato y pruebas solo para `POST /api/v1/buyers`, `/health` y `/ready`; autenticación, versionado general, rate limiting y rutas futuras siguen abiertos. |
| `GATE-W1` | `NOT_RUN` | Gate documental amplio; no se reabre por este vertical. |

## 6. Riesgos de entorno

| Riesgo | Estado | Mitigación actual |
|---|---|---|
| Docker daemon | `RESOLVED` en este entorno | `docker info` y `docker compose up -d` verificados; el entorno de otra máquina puede requerir iniciar Docker Desktop. |
| `psql` local | `WARNING` | Se usó `docker compose exec -T postgres psql`; para uso fuera de Docker, instalar el cliente. |
| Prueba PostgreSQL | `RESOLVED` local / `WARNING` CI | Suite automatizada con `TEST_DATABASE_URL`; no se ejecuta en CI. |
| `esbuild` postinstall no aprobado por npm 11 | `WARNING` | Vitest se ejecutó correctamente; si falla en otra máquina, aprobar el script o fijar versión compatible. |
| `L-27` sin contrato aprobado globalmente | `OPEN` acotada | Cerrada solo para `POST /api/v1/buyers`, `/health` y `/ready`; el resto sigue abierto. |
| OpenAPI sin validador semántico | `WARNING` | Prueba de sintaxis, rutas, respuestas y referencias; no sustituye un lint OpenAPI. |
| `L-13` sin formato de ids | `OPEN` | UUID v4 provisional, aislado en `UuidGenerator`. |
| Eventos/auditoría (`L-14`) abiertos | `OPEN` | Código versionado provisional y outbox. |
| `U-004`/direcciones | `DEFERRED` | Fuera de `PI-01`; no se implementó dirección. |

## 7. Próxima tarea priorizada

**Prioridad 1:** llevar la suite PostgreSQL a CI y sustituir `migrate.ts` por migraciones versionadas antes de un despliegue repetible.

**Prioridad 2:** decidir el mecanismo de autenticación (`ADR-004`), la composición de `DireccionFisica` (`L-01`) y la ruta administrativa antes de implementar `PI-02 RegisterSeller`. La evaluación y las preguntas están en [`03-pi02-evaluation.md`](03-pi02-evaluation.md).

**Prioridad 3:** decidir si `PI-01` requiere idempotencia explícita y si se adopta un validador semántico OpenAPI.

## 8. Archivos entregados y fuera de alcance

Código y configuración principales:

- `backend/package.json`, `package-lock.json`, `tsconfig.json`, `tsconfig.build.json`, `vitest.config.ts`, `vitest.postgres.config.ts`, `.env.example`.
- `backend/src/app.ts`, `backend/src/server.ts`, `backend/src/config.ts`.
- `backend/src/modules/buyers/application/register-buyer.ts`, `ports.ts`.
- `backend/src/modules/buyers/infrastructure/memory-buyer-registration-store.ts`, `postgres-buyer-registration-store.ts`.
- `backend/src/modules/buyers/interfaces/http/register-buyer-route.ts`.
- `backend/src/modules/identity/domain/usuario.ts`, `backend/src/modules/buyers/domain/perfil-comprador.ts`, `backend/src/modules/cart/domain/carrito.ts`.
- `backend/src/shared/domain/*`, `backend/src/shared/application/ports.ts`, `backend/src/shared/infrastructure/*`.
- `backend/migrations/001_initial.sql`, `backend/scripts/migrate.ts`, `backend/compose.yaml`, `backend/openapi.yaml`.
- `backend/tests/unit/*`, `backend/tests/integration/register-buyer-http.test.ts`, `backend/tests/support/doubles.ts`.
- `backend/tests/contract/openapi.test.ts`, `backend/tests/postgres/register-buyer-postgres.test.ts`, `backend/tests/postgres/support.ts`.

Documentación:

- `README.md`, `backend/README.md`, `docs/backend/implementation/01-acceptance-and-unblock.md`, `02-operational-source-reconciliation.md`, `03-pi02-evaluation.md`.
- `docs/backend/w0/03-discrepancies.md`, `docs/backend/w0/04-backlog.md`.
- `docs/backend/w1/01-resolution-matrix.md`, `02-artifact-register.md`, `03-decisions.md`.
- `orchestrator-state.md`, `prompt-orquestador-backend.md`.

**Fuera de alcance de esta entrega:** autenticación/sesiones, catálogo, variantes, inventario, direcciones, checkout, pedidos, pagos, devoluciones, imágenes, Mongo, frontend y CI. La documentación mínima del frontend queda como siguiente fase; no se creó para no presentar como diseñado algo que aún no tiene contrato aprobado.

## 9. Cierre acotado de `L-27`

`L-27` queda cerrada **solo** para el contrato implementado y probado:

| Ruta | Método | Respuestas documentadas |
|---|---|---|
| `/api/v1/buyers` | `POST` | `201`, `400`, `409`, `413`, `415`, `500`, `503` |
| `/health` | `GET` | `200` |
| `/ready` | `GET` | `200`, `503` |

Evidencia:

- `backend/openapi.yaml` describe el cuerpo estricto, la correlación, el sobre de error y las respuestas.
- `backend/tests/integration/register-buyer-http.test.ts` verifica el comportamiento real del adaptador.
- `backend/tests/contract/openapi.test.ts` verifica rutas, métodos, respuestas, `additionalProperties: false` y referencias locales.
- El cuerpo raíz y `documentoIdentidad` usan `.strict()`: una propiedad desconocida produce `400`, alineado con el contrato.

**Sigue abierto fuera de este alcance:** autenticación, autorización, versionado general, rate limiting, idempotencia explícita, contrato de rutas futuras y cualquier esquema público adicional. `L-27` no se declara cerrada globalmente.

## 10. `PI-02 RegisterSeller`

`PI-02` no se implementó. Permanece `BLOCKED` por la ausencia de un mecanismo decidido de identidad administrativa (`ADR-004`), la composición no fijada de `DireccionFisica` (`L-01`) y la falta de contrato/tablas de vendedor y bodega. La evaluación, opciones y preguntas concretas están en [`03-pi02-evaluation.md`](03-pi02-evaluation.md).

## 11. Revisión independiente

| Campo | Resultado |
|---|---|
| Sesión | `ses_e7a3f8c7fffehdXpxCqxD8gVkc` |
| Dictamen inicial | `PASS_WITH_CONSTRAINTS` |
| Re-revisión tras correcciones | **`PASS`** |
| Alcance | Código, transacciones, pruebas, contrato de tres rutas, secretos, `.gitignore`, scripts y coherencia documental |
| Commit revisado | `badf0b1993c927d6713d85cd7b44eee8b4259a46` (sin commit nuevo) |

Correcciones aplicadas a partir de la revisión:

- `HOST` por defecto cambiado de `0.0.0.0` a `127.0.0.1`; documentado que un contenedor debe definir `HOST=0.0.0.0` explícitamente.
- Mojibake corregido en la suite PostgreSQL.
- El alta ganadora se registra para limpieza antes de validar la respuesta del perdedor.
- `TEST_DATABASE_URL` rechaza parámetros de query que podrían alterar el host o la base validados.
- Fila duplicada eliminada del informe; decisiones y notas históricas alineadas; `L-27` presentada como acotada y no como pendiente global.

Límites residuales aceptados:

- Las respuestas por defecto para rutas o métodos desconocidos no usan el sobre de error; no hay handler global `404`/`405`.
- La suite PostgreSQL limpia por identificadores/correlación; si una aserción fallara antes de registrar el ganador, podría quedar un residuo en la base de prueba. No afecta a la base de desarrollo.
- El CHECK de auditoría solo cubre la raíz del payload, no objetos anidados.
- `x-correlation-id` no restringe el alfabeto; se acepta cualquier cadena de hasta 200 caracteres.
- `.env.example` incluye `TEST_DATABASE_URL`; copiarlo a `.env` habilita la suite de prueba.
- `DOCUMENTATION_STATUS.md` conserva texto histórico de la fase documental.
- CI no ejecuta la suite PostgreSQL y `migrate.ts` no usa migraciones versionadas.

**Conclusión:** el corte de `PI-01` queda aprobado para su alcance actual. Ningún límite residual autoriza a presentar `PI-02`, catálogo, pagos, devoluciones o frontend como implementados.
