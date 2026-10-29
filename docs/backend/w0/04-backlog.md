# W0 — Backlog priorizado, dependencias y criterios de aceptación

**Proyecto:** NexusMarket
**Ola de origen:** W0 — Inventario y baseline
**Fecha:** 2026-10-28
**Commit:** `badf0b1993c927d6713d85cd7b44eee8b4259a46`
**Actualizado por:** `W1-01`, `W1-02` y `W1-03` (2026-10-28) — estado real de W1; no se inició ninguna tarea de implementación.
**Regla:** ninguna tarea se marca `DONE` sin artefacto verificable y prueba ejecutada. Las tareas de implementación no se inician en W0.

---

## 1. Estrategia

1. Resolver primero las decisiones que cambian el modelo o el contrato; no construir sobre ellas.
2. Elegir **un flujo vertical pequeño** y demostrarlo de extremo a extremo antes de ampliar módulos.
3. Crear solo los directorios y archivos que la tarea consuma; no generar módulos vacíos.
4. Mantener el dominio libre de HTTP, SQL, MongoDB y SDKs.
5. Cada tarea debe terminar con artefacto, prueba y evidencia registrada en `orchestrator-state.md`.

**Primer vertical aprobado y ejecutado:** `PI-01 RegisterBuyer` - alta de comprador, perfil, carrito vacío, hash de credencial, auditoría/outbox y errores de unicidad. Es el flujo con menos dependencias de políticas comerciales y permitió validar transacción, unicidad, seguridad de credenciales y trazabilidad.

**Segundo candidato:** `PI-02 RegisterSeller` — incorporación administrativa y primera bodega atómica (`DM-05`), con autorización `ADMINISTRADOR` y prueba de rollback.

**No iniciar por:** `UC-01 Checkout` (bloqueado por `DEC-BIZ-01`, `DEC-BIZ-04`, `DEC-BIZ-05`, `DEC-BIZ-07`, `L-07`, `L-22`) ni por catálogo (fuera del primer vertical; `CON-001`/`CON-003` ya resueltos, pero sus gates de implementación siguen abiertos).

---

## 2. Backlog por ola

### W0 — Inventario y baseline

| ID | Tarea | Prioridad | Estado | Dependencias | Criterio de aceptación | Evidencia |
|---|---|---|---|---|---|---|
| `W0-01` | Inventario de fuentes y árbol | P0 | `DONE` | — | 38 archivos rastreados identificados; fuentes con ruta y autoridad; ausencias registradas | `docs/backend/w0/01-inventory.md` |
| `W0-02` | Baseline de Git y entorno | P0 | `DONE` | `W0-01` | Rama/commit/estado, versiones y resultados reales registrados | `docs/backend/w0/02-baseline.md` |
| `W0-03` | Registro de discrepancias y riesgos | P0 | `DONE` | `W0-01` | Cada conflicto con evidencia, impacto, opciones y responsable | `docs/backend/w0/03-discrepancies.md` |
| `W0-04` | Backlog y dependencias | P0 | `DONE` | `W0-01`…`W0-03` | Tareas ordenadas, dependencias y criterios de aceptación | este documento |
| `W0-05` | Definir ubicación del backend | P0 | `DONE` (propuesta) | `W0-01` | Origen de la restricción `backend/src/` registrado; layout propuesto | `03-discrepancies.md` `U-007` |
| `W0-06` | Actualizar estado operativo | P0 | `DONE` | `W0-01`…`W0-05` | Cada cifra del estado coincide con `git status --short` / `git ls-files -o --exclude-standard`; gate y estados W0 coherentes | `orchestrator-state.md` |
| `W0-07` | Revisión independiente de W0 | P0 | `PASS` (2026-10-28, 3.ª revisión) | `W0-01`…`W0-06` | Un revisor distinto del autor verifica artefactos y baseline | registro en `orchestrator-state.md` §14 |

#### W0.1 — Correcciones derivadas de la revisión independiente

| ID | Tarea | Estado | Defecto corregido |
|---|---|---|---|
| `W0.1-01` | Corregir conteo de archivos sin rastrear | `DONE` | 3 entradas / 6 archivos, no 2 |
| `W0.1-02` | Corregir clasificación y citas de discrepancias | `DONE` | `CON-003`/`CON-004`, `U-003`, `U-007`, `GAP-002`, `RISK-006` |
| `W0.1-03` | Remapear conflictos a tareas reales | `DONE` | IDs de tareas bloqueadas |
| `W0.1-04` | Reabrir estados W0 y endurecer criterios | `DONE` | `W0-01`…`W0-06` en `IN_REVIEW`; criterios verificables |
| `W0.1-05` | Re-revisión independiente | `DONE` (`PASS`) | verificación de las correcciones |

### W1 — Dominio y decisiones ejecutables

| ID | Tarea | Prioridad | Estado | Dependencias | Criterio de aceptación |
|---|---|---|---|---|---|
| `W1-01` | Triage de `CON-001`…`CON-004` y `GAP-001`/`GAP-002` | P0 | `DONE`; `GATE-W1-01 = PASS` | `W0-07` | Cada conflicto tiene decisión, aceptación o límite explícito; ninguno se resuelve por conveniencia |
| `W1-02` | Cerrar `L-16` (estados iniciales) | P0 | `DONE_DOCUMENTAL` | `W1-01` | `Usuario` y `PerfilVendedor` tienen estado inicial aprobado y documentado; prueba funcional en W4/W5 |
| `W1-03` | Cerrar `L-12`/`L-20` (credenciales) | P0 | `DONE_DOCUMENTAL` | `W1-01` | Algoritmo, parámetros y política definidos; no texto plano; prueba funcional en W4 |
| `W1-04` | Cerrar `L-01` (dirección) para el primer vertical | P0 | `NOT_STARTED` | `W1-01` | Campos mínimos y validaciones definidos; snapshot inmutable |
| `W1-05` | Aprobar el primer caso de uso vertical | P0 | `DONE` (`DEC-IMPL-001`: `PI-01`) | `W1-01`…`W1-03`, `U-001`; `W1-04` solo si el vertical usa direcciones | Decisión registrada con alcance, exclusiones y criterios |
| `W1-06` | Especificar dominio del primer vertical | P0 | `DONE_IMPLEMENTATION` | `W1-05` | Entidades/VOs/reglas/invariantes y errores de dominio trazados a `[MOD]`/`[VO]`/`DS` |
| `W1-07` | Matriz de autorización del primer vertical | P0 | `N/A` para `PI-01`; `DEFERRED` para el resto | `W1-05` | `PI-01` es registro público sin autenticación; la autorización se decide en `ADR-004` |
| `W1-08` | Actualizar trazabilidad requisito → prueba | P0 | `PARTIAL` | `W1-06`, `W1-07` | Reporte de implementación y pruebas; falta matriz formal completa |

**Estado W1 (2026-10-28, actualizado tras el corte de implementación y la suite PostgreSQL):** `W1-01 = DONE` y `GATE-W1-01 = PASS`; `CON-001`…`CON-004` resueltos por `DEC-W1-001`…`004`. `W1-02`/`W1-03 = DONE_DOCUMENTAL` por `DEC-W1-007`/`DEC-W1-008`; tienen prueba funcional en `backend/tests/unit/argon2-password-hasher.test.ts` y en el flujo `PI-01`. `W1-05 = DONE` por `DEC-IMPL-001` y el alcance de `PI-01`. `W1-06 = DONE_IMPLEMENTATION`; `W1-07 = N/A` para `PI-01` (registro público, sin autenticación) y `DEFERRED` para el resto; `W1-08 = PARTIAL`. `W1-04` sigue abierta y no es requisito de `PI-01`, pero bloquea `PI-02` mientras `L-01` siga abierta. `GATE-W1` no se reabre: se mantiene el gate documental amplio. Gates del vertical: `GATE-PI01-CODE = PASS` (revisión independiente `PASS`), `GATE-PI01-CONTRACT = PASS_WITH_CONSTRAINTS` (solo tres rutas) y `GATE-PI01-POSTGRES = PASS` (suite automatizada; CI pendiente).

**Nota de trazabilidad:** catálogo, devoluciones, imágenes y pagos no tienen todavía tareas propias porque el primer vertical recomendado es `PI-01` (registro de comprador). Las decisiones de alcance ya existen, pero si `W1-05` incluye esos módulos, se crearán las tareas correspondientes y seguirán sujetas a sus gates; `L-10` y `L-22` permanecen abiertas.

**Gate W1:** dominio suficiente para el primer caso de uso; decisiones bloqueantes cerradas o explícitamente fuera de alcance.

### W2 — Arquitectura, ADR y propiedad de datos

| ID | Tarea | Prioridad | Dependencias | Criterio de aceptación |
|---|---|---|---|---|
| `W2-01` | ADR-001 framework HTTP y composición | P0 | `W1-01`, `W1-05` | Alternativas comparadas; decisión y consecuencias |
| `W2-02` | ADR-002 acceso a PostgreSQL y migraciones | P0 | `W1-01`, `W1-05` | Query builder/ORM, migraciones, transacciones y pruebas definidos |
| `W2-03` | ADR-003 propiedad de datos PostgreSQL/MongoDB | P0 | `W1-01`, `W1-05` | Matriz por agregado con fuente autoritativa, consistencia, índices y retención |
| `W2-04` | ADR-004 autenticación y autorización | P0 | `W1-01`, `W1-05` | Mecanismo de identidad, sesión/token y verificación por recurso |
| `W2-05` | ADR-005 contrato de errores | P0 | W2-01 | Códigos estables, formato, correlación y mapeo HTTP |
| `W2-06` | ADR-006 estrategia de pruebas | P0 | W2-01, W2-02 | Unit/integration/contract/e2e, contenedores y datos de prueba |
| `W2-07` | ADR-007 Docker y configuración | P0 | W2-01 | Dockerfile multi-stage, Compose, health checks, secretos |
| `W2-08` | ADR-008 layout `backend/` y Node LTS | P1 | W2-01 | `backend/src/`, `tests/`, `api/`, `docker/`; versión fijada |
| `W2-09` | Esqueleto mínimo ejecutable | P0 | W2-01…W2-08 | Arranque, config validada, health, logging, errores, sin reglas de negocio |
| `W2-10` | Migración inicial y constraints del primer vertical | P0 | W2-03, W2-09 | Migración desde cero probada; unicidad e integridad en BD |

**Gate W2:** arquitectura mínima y persistencia aprobadas; `docker compose config` válido (cuando el daemon esté disponible).

### W3 — Contrato API del primer vertical

| ID | Tarea | Prioridad | Dependencias | Criterio de aceptación |
|---|---|---|---|---|
| `W3-01` | Definir rutas, métodos y versionado | P0 | `W2-09`, `L-27` | Contrato aprobado; no se inventan endpoints fuera del alcance |
| `W3-02` | DTOs de entrada/salida y validación | P0 | W3-01 | Esquemas runtime; separación DTO/dominio/persistencia |
| `W3-03` | Errores y códigos HTTP | P0 | W2-05, W3-01 | Mapeo estable y seguro; sin filtrar detalles internos |
| `W3-04` | Autenticación/autorización contractual | P0 | W2-04, W3-01 | Identidad, rol, ownership y alcance documentados |
| `W3-05` | Idempotencia y concurrencia del contrato | P0 | W3-01 | Clave, conflicto, reintento y límites definidos |
| `W3-06` | OpenAPI validado y contract tests | P0 | W3-02…W3-05 | Lint/diff y pruebas de contrato ejecutadas |

**Gate W3:** contrato revisado y coherente con dominio, autorización y errores.

### W4 — Fundación ejecutable y Docker

| ID | Tarea | Prioridad | Dependencias | Criterio de aceptación |
|---|---|---|---|---|
| `W4-01` | Config tipada y validada | P0 | W2-09 | Falla temprano si falta configuración; sin secretos versionados |
| `W4-02` | Servidor HTTP y composición | P0 | W2-01, W2-09 | Arranque y cierre ordenado; dependencias inyectadas |
| `W4-03` | Logging y correlación | P0 | W4-02 | Logs estructurados sin secretos; `correlationId` |
| `W4-04` | Manejo uniforme de errores | P0 | W2-05, W4-02 | Errores conocidos mapeados; inesperados genéricos |
| `W4-05` | Health checks y readiness | P0 | W4-02 | `/health` y dependencias verificables |
| `W4-06` | Conexión PostgreSQL y migraciones | P0 | W2-02, W2-10 | Migración desde cero y rollback probados |
| `W4-07` | Conexión MongoDB (solo si aplica) | P1 | W2-03 | Colección/índice justificado; sin duplicar fuente |
| `W4-08` | Dockerfile y Compose | P0 | W2-07 | `docker compose up` reproducible; health checks |
| `W4-09` | Pruebas de infraestructura | P0 | W4-01…W4-08 | Config, health, conexión y errores cubiertos |
| `W4-10` | README de ejecución | P0 | W4-08 | Comandos exactos verificados |

**Gate W4:** entorno levantable, configuración documentada y comprobaciones básicas exitosas. Requiere daemon Docker activo.

### W5 — Primer caso de uso vertical

| ID | Tarea | Prioridad | Dependencias | Criterio de aceptación |
|---|---|---|---|---|
| `W5-01` | Dominio del primer vertical | P0 | W1-06 | Entidades/VOs validan invariantes; sin dependencias externas |
| `W5-02` | Caso de uso y puertos | P0 | `W5-01`, `W3-06` | Orquesta transacción; autorización; errores |
| `W5-03` | Adaptador de persistencia | P0 | W2-02, W2-10, W5-02 | Repositorio implementa el puerto; constraints reales |
| `W5-04` | Endpoint HTTP y DTOs | P0 | `W3-06`, `W5-02` | Validación de borde; mapeo de resultados |
| `W5-05` | Autorización y ownership | P0 | W1-07, W5-02 | Pruebas de rol, estado, propiedad y alcance |
| `W5-06` | Pruebas unitarias | P0 | W5-01, W5-02 | Invariantes y errores cubiertos sin BD/HTTP |
| `W5-07` | Pruebas de integración | P0 | W5-03, W4-06 | Transacción, unicidad, rollback y concurrencia |
| `W5-08` | OpenAPI y trazabilidad | P0 | W5-04, W3-06 | Contrato actualizado; matriz requisito → prueba |

**Gate W5:** flujo vertical demostrado con pruebas reales; no solo endpoint.

### W6 — Integración y pruebas críticas

| ID | Tarea | Prioridad | Dependencias | Criterio de aceptación |
|---|---|---|---|---|
| `W6-01` | Flujos entre contextos | P0 | `W5-08` | Pruebas de integración entre al menos dos contextos del primer vertical con dependencias reales |
| `W6-02` | Autorización negativa | P0 | W5-05 | Accesos ajenos, rol incorrecto y cuenta inactiva rechazados |
| `W6-03` | Concurrencia de inventario | P0 | `W5-02`, `W2-10` | Dos checkouts por la última unidad: solo uno gana |
| `W6-04` | Idempotencia y reintentos | P0 | `W5-02` | Duplicados sin doble efecto |
| `W6-05` | Fallos de dependencias | P1 | `W4-02`, `W4-06` | BD/proveedor caído no simula éxito |
| `W6-06` | Migraciones desde cero | P0 | W4-06 | Base limpia + migraciones + pruebas |
| `W6-07` | Contract tests | P0 | W3-06, W5-04 | OpenAPI y respuestas coherentes |

**Gate W6:** suite crítica ejecutada con resultados reales.

### W7 — Seguridad y robustez

| ID | Tarea | Prioridad | Dependencias | Criterio de aceptación |
|---|---|---|---|---|
| `W7-01` | Revisión de secretos y configuración | P0 | `W4-01` | Sin secretos en repo/logs; `.env.example` seguro |
| `W7-02` | Validación de entradas e inyección | P0 | `W5-04` | Consultas parametrizadas; límites de payload |
| `W7-03` | Autorización a nivel de recurso | P0 | W6-02 | Ownership y alcance comprobados |
| `W7-04` | Errores y filtración de información | P0 | W4-04 | Sin stack traces ni datos internos |
| `W7-05` | Dependencias y configuración MongoDB | P1 | W4-07 | Revisión de vulnerabilidades; auth de Mongo |
| `W7-06` | Graceful shutdown y recuperación | P1 | W4-02 | Cierre ordenado; fallos parciales documentados |
| `W7-07` | Revisión independiente de seguridad | P0 | W7-01…W7-06 | Hallazgos críticos cerrados o release bloqueado |

**Gate W7:** hallazgos críticos resueltos o release bloqueado.

### W8 — Documentación y release candidate

| ID | Tarea | Prioridad | Dependencias | Criterio de aceptación |
|---|---|---|---|---|
| `W8-01` | Actualizar README, OpenAPI y ADR | P0 | `W7-07` | README, OpenAPI y ADR actualizados al estado implementado; sin referencias obsoletas |
| `W8-02` | Matriz de trazabilidad final | P0 | `W7-07` | Requisito → implementación → prueba |
| `W8-03` | Instalación limpia y pruebas reproducibles | P0 | `W7-07` | Clone limpio + `npm ci` + pruebas |
| `W8-04` | Lista de verificación de release | P0 | W8-01…W8-03 | Alcance, exclusiones y riesgos declarados |
| `W8-05` | Gate final | P0 | W8-04 | `GATE-W8` aprobado con evidencia |

---

## 3. Dependencias críticas (grafo resumido)

```text
W0 (DONE; GATE-W0 PASS)
  └─ W1 decisiones (W1-01..W1-03 DONE/DONE_DOCUMENTAL; W1-04 abierta; W1-05 DONE con PI-01; U-001 resuelta)
       └─ W2 ADR + propiedad de datos + esqueleto
            ├─ W3 OpenAPI del primer vertical
            └─ W4 fundación + Docker + migración inicial
                 └─ W5 primer vertical
                      └─ W6 integración/concurrencia/idempotencia
                           └─ W7 seguridad
                                └─ W8 release candidate
```

**Regla:** W5 no puede comenzar si `W1-05` (primer caso de uso) o `W3-06` (OpenAPI) están abiertos. En este corte se autorizó expresamente el primer vertical sin esperar el SDD completo; `W1-05` quedó `DONE` y `W3-06` sigue `PARTIAL` (contrato cerrado solo para las tres rutas de `PI-01`). W4 tiene Docker, migración y suite PostgreSQL verificados; CI sigue pendiente.

---

## 4. Criterios de aceptación transversales

Toda tarea de implementación debe cumplir:

1. El dominio no importa HTTP, SQL, MongoDB ni SDKs.
2. Los DTOs HTTP no se usan como modelos de dominio.
3. Las reglas de negocio están en dominio/aplicación, no en handlers ni repositorios.
4. Las invariantes críticas se refuerzan en persistencia (unicidad, stock no negativo, transiciones).
5. La autorización verifica identidad, rol, estado, ownership y alcance.
6. Las operaciones críticas tienen idempotencia y límites transaccionales documentados.
7. Los errores internos no se filtran al cliente.
8. Las pruebas unitarias no dependen de HTTP/BD; las de integración usan dependencias reales.
9. No se declara `PASS` sin comando ejecutado y salida registrada.
10. La documentación y la matriz de trazabilidad se actualizan en la misma tarea.

---

## 5. Primer paquete de trabajo (histórico y estado actual)

```text
W1-01  Resolver CON-001..004 / GAP-001/GAP-002  [DONE: Q1-Q4 decididas]
W1-02  Cerrar L-16  [DONE_DOCUMENTAL; prueba funcional en PI-01]
W1-03  Cerrar L-12/L-20  [DONE_DOCUMENTAL; prueba funcional Argon2id]
W1-04  Cerrar L-01 para el primer vertical  [NOT_STARTED; no requerido por PI-01]
W1-05  Aprobar PI-01 RegisterBuyer  [DONE: DEC-IMPL-001]
W1-06  Especificar dominio de registro de comprador  [DONE_IMPLEMENTATION]
W1-07  Matriz de autorización (registro público + perfil propio)  [N/A en PI-01; DEFERRED]
W2-01..W2-10  ADR, layout, esqueleto, migración inicial  [PROVISIONAL: implementado sin ADR formales]
W3-01..W3-06  OpenAPI de registro  [PARTIAL: contrato de tres rutas y contract test; sin validador semántico]
W4-01..W4-10  Fundación ejecutable y Docker  [PARTIAL: memoria/HTTP, PostgreSQL/Docker y suite automatizada; CI pendiente]
W5-01..W5-08  Registro de comprador de extremo a extremo  [PARTIAL: código, 29 pruebas y PostgreSQL automatizado; revisión independiente PASS]
```

**Justificación:** `PI-01` no exige un endpoint autenticado para el alta, pero sí exige hash, unicidad, transacción, perfil, carrito, auditoría y errores. Permite demostrar el estilo arquitectónico completo sin resolver todavía checkout, pagos, logística ni facturación.

### 5.1 Corte implementado el 2026-10-28

| Tarea | Estado | Evidencia | Límite |
|---|---|---|---|
| `W5-01` Dominio del primer vertical | `DONE` | `backend/src/shared/domain/*`, `backend/src/modules/*/domain/*`; pruebas de VOs | `L-02`/`L-03` permanecen abiertas; no se fijaron límites no aprobados |
| `W5-02` Caso de uso y puertos | `DONE` | `backend/src/modules/buyers/application/register-buyer.ts`, `ports.ts` | Frontera transaccional compuesta; se separará al crecer el vertical |
| `W5-03` Adaptador de persistencia | `DONE` | `postgres-buyer-registration-store.ts`, `memory-buyer-registration-store.ts`, `001_initial.sql`; suite PostgreSQL | PostgreSQL 17.11 con concurrencia y rollback; CI pendiente |
| `W5-04` Endpoint HTTP y DTOs | `DONE` | `register-buyer-route.ts`, `app.ts`, `openapi.yaml` | `L-27` cerrada solo para tres rutas |
| `W5-05` Autorización y ownership | `N/A` para `PI-01` | Registro público sin autenticación | `ADR-004` pendiente para el resto |
| `W5-06` Pruebas unitarias | `DONE` | 3 archivos unitarios, 10 pruebas | Cobertura no medida con umbral |
| `W5-07` Pruebas de integración | `DONE` local | `register-buyer-http.test.ts` (15 HTTP); `register-buyer-postgres.test.ts` (2 PostgreSQL) | CI y e2e de frontend pendientes |
| `W5-08` OpenAPI y trazabilidad | `PARTIAL` | `backend/openapi.yaml`; `openapi.test.ts`; reporte de aceptación | Sin validador semántico OpenAPI; matriz formal incompleta |

**Evidencia de ejecución:** `npm run typecheck` OK; `npm test` 5 archivos/29 pruebas OK; `npm run test:postgres` 2 pruebas OK; `npm run build` OK; smoke HTTP real con `201`, `409`, `/health` y `/ready`.

**Gates:** `GATE-PI01-CODE = PASS` (revisión independiente `PASS`); `GATE-PI01-CONTRACT = PASS_WITH_CONSTRAINTS`; `GATE-PI01-POSTGRES = PASS`; `GATE-W1`/`GATE-W2`/`GATE-W3`/`GATE-W4`/`GATE-W5` no se declaran aprobados.
