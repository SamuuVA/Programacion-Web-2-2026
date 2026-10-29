# W1-01 — Registro de ADR, contratos y artefactos requeridos

**Proyecto:** NexusMarket
**Ola:** W1 — Dominio y decisiones ejecutables
**Origen:** `GAP-002` — no existen contratos ejecutables ni ADR
**Fecha:** 2026-10-28
**Estado:** `PLANNED` — plan registrado. En el corte del 2026-10-28 se crearon el OpenAPI mínimo de `PI-01`, la migración `001_initial.sql` y código ejecutable; los ADR de esta tabla siguen `MISSING` salvo `ADR-009`, que tiene decisión. Este registro describe el plan de W1-01 y no debe confundirse con el estado implementado.
**Regla:** este documento no crea OpenAPI, esquemas, migraciones, SDKs ni ADR. Solo asigna qué falta, quién lo produce, de qué depende y en qué gate se exige.

---

## 1. Propósito y límites

`GAP-002` no se cierra declarando que los artefactos existen. Se cierra como **brecha planificada**: cada artefacto requerido queda identificado y asignado a una fase. Un gate no puede aprobarse si el artefacto que lo requiere sigue en `MISSING`.

**No se hace aquí al cierre de W1** (el corte posterior de `PI-01` se registra en la sección 7):

- No se eligen framework, ORM, proveedor de pago, biblioteca concreta de hash ni versión de Node. La política de hash sí está decidida en `DEC-W1-008`; la biblioteca se elige en W4.
- No se fijan rutas, métodos HTTP, códigos de estado, versiones de API ni límites de tasa (`L-27`).
- No se crean tablas, colecciones, migraciones ni DTOs.
- No se presentan propuestas como decisiones aprobadas.

**Regla de avance:** W1 no se bloquea por ADR/OpenAPI/migraciones. W2 no avanza sin ADR; W3 no avanza sin OpenAPI; W4 no avanza sin migración y Docker; W5 no avanza sin contrato del primer vertical y pruebas.

---

## 2. Registro de ADR

Los ADR se crearán como archivos Markdown en `docs/adr/` o en la ubicación que fije `ADR-008`; la ruta exacta también es una decisión de W2. Ninguno existe hoy.

| ADR | Decisión requerida | Responsable | Fase | Dependencias | Gate que lo exige | Estado |
|---|---|---|---|---|---|---|
| `ADR-001` | Framework HTTP, composición y ciclo de vida | Backend Architect | `W2-01` | `W1-05` (primer vertical) | `GATE-W2` | `MISSING` |
| `ADR-002` | Acceso a PostgreSQL: ORM/query builder, migraciones y transacciones | Backend Architect + PostgreSQL Agent | `W2-02` | `W1-05` | `GATE-W2` | `MISSING` |
| `ADR-003` | Propiedad de datos PostgreSQL/MongoDB, consistencia y retención | Backend Architect | `W2-03` | `W1-05`; modelo §24; `DD-09` | `GATE-W2` | `MISSING` |
| `ADR-004` | Autenticación, sesión/token y autorización técnica | Security Agent | `W2-04` | `W1-03`; `W1-05`; `L-27` | `GATE-W2` | `MISSING` |
| `ADR-005` | Contrato de errores API, correlación y mapeo HTTP | API Contract Agent | `W2-05` | `ADR-001` | `GATE-W2` | `MISSING` |
| `ADR-006` | Estrategia de pruebas: unit, integration, contract, e2e y datos | QA/Integration Agent | `W2-06` | `ADR-001`, `ADR-002` | `GATE-W2` | `MISSING` |
| `ADR-007` | Docker, Compose, configuración, secretos y health checks | Docker/DevEx Agent | `W2-07` | `ADR-001` | `GATE-W2` | `MISSING` |
| `ADR-008` | Layout de `backend/`, versión LTS de Node y scripts | Backend Architect | `W2-08` | `ADR-001` | `GATE-W2` | `MISSING` |
| `ADR-009` | Política de credenciales: algoritmo, parámetros y fortaleza | Security Agent | `W1-03` (decisión) / `W2-04` (ADR técnico) | `DEC-W1-008`; `W1-01` | `GATE-W2` (ADR); la decisión se registra en W1-03 | `DECISION_DONE` / `ADR_MISSING` |
| `ADR-010` | Sobre de eventos, outbox/inbox y catálogo de eventos | Backend Architect | `W2-03` / `W3-05` | `ADR-003`; `L-14` | `GATE-W2` / `GATE-W3` | `MISSING` |
| `ADR-011` | Almacenamiento de imágenes y validación de archivos | Backend Architect + Security Agent | No aplica en V1 | `DEC-W1-003` (imágenes fuera de V1) | No aplica en V1 | `OUT_OF_SCOPE_V1` |
| `ADR-012` | Política de devoluciones: configuración, vigencia y snapshot | Backend Architect + negocio | Ola de devoluciones (`W2`/`W5`) | `DEC-W1-002` | `GATE-W5` (si se implementan devoluciones) | `DECISION_DONE` / `ADR_DEFERRED` |

**Notas:**

- `ADR-009` no es solo técnico: la política de fortaleza y el algoritmo afectan `PI-01`/`PI-02`; por eso se adelanta a W1-03. La decisión ya está en `DEC-W1-008`; el ADR formal se produce en W2.
- `ADR-010` no debe convertir el outbox en event sourcing; el modelo solo exige eventos/auditoría y consistencia (`DD-09`, `DD-10`).
- `ADR-011` queda fuera de V1 por `DEC-W1-003`: no se crea mientras las imágenes sigan excluidas.
- `ADR-012` tiene decisión de política (`DEC-W1-002`), pero el ADR de configuración/vigencia/snapshot se difiere a la ola de devoluciones; no bloquea W1.

---

## 3. Registro de contratos y artefactos ejecutables

La numeración `CT-*` proviene de `BackendSDD/Contracts/nexusmarket-contract-alignment.md`. Los identificadores `API-*` provienen de `orchestrator-state.md` §12. No se inventan contratos nuevos fuera de esa trazabilidad.

### 3.1 Contratos del primer vertical (obligatorios para W3)

| ID | Artefacto | Responsable | Fase | Dependencias | Gate | Estado actual |
|---|---|---|---|---|---|---|
| `CT-01` / `API-001` | OpenAPI raíz: rutas, métodos, versiones, seguridad, errores y esquemas públicos | API Contract Agent | `W3-01`, `W3-06` | `ADR-001`, `ADR-004`, `ADR-005`; DTOs `W3-02`; `L-27` | `GATE-W3` | `PARTIAL` (tres rutas de `PI-01`; seguridad/versionado general pendientes) |
| `API-002` | Contrato de autenticación/contexto de identidad | Security Agent + API Contract Agent | `W3-04` | `ADR-004`; `CT-08` | `GATE-W3` | `MISSING` |
| `API-003` | Catálogo de errores y mapeo HTTP | API Contract Agent | `W2-05`, `W3-03` | `ADR-005` | `GATE-W2` / `GATE-W3` | `MISSING` |
| `API-004` | OpenAPI del primer flujo vertical | API Contract Agent | `W3-06`, `W5-08` | `API-001`…`API-003`; `W5-04` | `GATE-W3` / `GATE-W5` | `PARTIAL` (`backend/openapi.yaml` mínimo) |
| `CT-08` | Contrato de credenciales: hash, parámetros, verificación y errores | Security Agent | `W1-03` (decisión), `W3-04` (contrato) | `DEC-W1-008`; `ADR-009`; `PO-22` | `GATE-W3` (contrato); la decisión se registra en W1-03 | `DECISION_DONE` / `ARTIFACT_MISSING` |
| `CT-09` | Contrato de identificadores: formato, generación y unicidad | Backend Architect | `W2-08`, `W3-05` | `ADR-008`; `PO-21`; `L-13` | `GATE-W2` / `GATE-W3` | `MISSING` |
| `CT-12` | Persistencia SQL: esquema, constraints, índices, migraciones y unidad de trabajo | PostgreSQL Agent | `W2-10`, `W4-06` | `ADR-002`, `ADR-003`; modelo §24 | `GATE-W2` / `GATE-W4` | `MISSING` |
| `CT-13` | Reloj UTC: contrato de tiempo | Backend Architect | `W4-02` | `PO-20` | `GATE-W4` | `ALINEADO` (conceptual) |

### 3.2 Contratos de soporte del primer vertical

| ID | Artefacto | Responsable | Fase | Dependencias | Gate | Estado actual |
|---|---|---|---|---|---|---|
| `CT-02` | Esquema de eventos de dominio y sobre de outbox | Backend Architect | `W2-03`, `W3-05` | `ADR-003`, `ADR-010`; `L-14`; `PO-23` | `GATE-W2` / `GATE-W3` | `PARTIAL` (tabla outbox y evento `buyer.registered.v1` en `PI-01`) |
| `CT-03` | Esquema de auditoría append-only y consulta | Security Agent + Backend Architect | `W2-03`, `W4-04` | `ADR-003`; `L-11`, `L-15`; `PO-14` | `GATE-W4` | `PARTIAL` (tabla `audit_log` y escritura transaccional en `PI-01`) |
| `DB-001` | Migración inicial del primer vertical | PostgreSQL Agent | `W2-10`, `W4-06` | `CT-12`; `ADR-002` | `GATE-W4` | `DONE` (aplicada y verificada en PostgreSQL 17.11 por la suite automatizada) |
| `TEST-001` | Plan y matriz de pruebas del primer vertical | QA/Integration Agent | `W2-06`, `W5-06`…`W5-08` | `ADR-006`; `W1-06`/`W1-07` | `GATE-W2` / `GATE-W5` | `PARTIAL` (29 pruebas + 2 PostgreSQL; CI y e2e pendientes) |

### 3.3 Contratos de módulos posteriores (no bloquean W1)

| ID | Artefacto | Responsable | Fase | Dependencias | Gate | Estado actual |
|---|---|---|---|---|---|---|
| `CT-04` | Contrato de pago con proveedor/sandbox | Security Agent + Backend Architect | `W3-05`, `W5-02` | `DEC-W1-004` (sin pagos en `PI-01`); `L-22`; `ADR-004`; `PO-16` | `GATE-W5` (si checkout entra en alcance) | `MISSING` / `DEFERRED` |
| `CT-05` | Contrato logístico y tracking | Backend Architect | Ola de logística | `L-23`; `PO-17` | `GATE-W5+` | `MISSING` |
| `CT-06` | Contrato de notificaciones | Backend Architect | Ola de notificaciones | `L-24`; `PO-18` | `GATE-W5+` | `MISSING` |
| `CT-07` | Contrato de entrega digital | Backend Architect | Ola de entrega digital | `L-18`; `PO-19` | `GATE-W5+` | `MISSING` |
| `CT-10` | Contrato de facturación | Backend Architect | Ola de facturación | `L-17`; `PO-10` | `GATE-W6+` | `MISSING` |
| `CT-11` | Contrato de reportes | Backend Architect | Ola de reportes | `L-19`; `PO-24` | `GATE-W6+` | `MISSING` |

**Regla:** `CT-04`…`CT-11` no se crean en W1. Si el primer vertical no incluye checkout, logística, notificaciones, entrega digital, facturación o reportes, su ausencia no bloquea W3–W5; sí bloquea el flujo que los necesite.

---

## 4. Artefactos de datos y operación

| ID | Artefacto | Responsable | Fase | Dependencias | Gate | Estado |
|---|---|---|---|---|---|---|
| `DATA-MATRIX` | Matriz física: agregado, tabla/colección, fuente autoritativa, claves, índices, retención | Backend Architect + PostgreSQL/MongoDB Agents | `W2-03` | `ADR-003`; modelo §24 | `GATE-W2` | `PROPOSED` en `orchestrator-state.md` §9 |
| `DB-MIGRATIONS` | Migraciones versionadas desde cero y rollback | PostgreSQL Agent | `W2-10`, `W4-06` | `CT-12`; `ADR-002` | `GATE-W4` | `MISSING` |
| `OUTBOX` | Tabla/colección, relay, reintentos e idempotencia | Backend Architect + PostgreSQL Agent | `W2-03`, `W4-07` | `CT-02`; `ADR-010` | `GATE-W4` | `MISSING` |
| `AUDIT` | Repositorio append-only, índices y retención | Security Agent + Backend Architect | `W2-03`, `W4-04` | `CT-03`; `L-11`, `L-15` | `GATE-W4` | `MISSING` |
| `CONFIG` | Config tipada, `.env.example`, validación y secretos | Docker/DevEx Agent | `W4-01` | `ADR-007` | `GATE-W4` | `MISSING` |
| `DOCKER` | Dockerfile multi-stage, Compose, health checks | Docker/DevEx Agent | `W4-08` | `ADR-007`; daemon Docker | `GATE-W4` | `MISSING` |

**No se requiere** crear `backend/` ni ninguno de estos artefactos en W1.

---

## 5. Mapa de gates

| Gate | Artefactos que exige | Estado / bloqueo |
|---|---|---|
| `GATE-W1-01` | `DEC-W1-001`…`DEC-W1-006`; matriz y registro de artefactos | `PASS` (2026-10-28); no exige ADR/OpenAPI ejecutables |
| `GATE-W1` | `W1-01`…`W1-08`; `DEC-W1-007`/`DEC-W1-008` documentadas | No aprobado como gate amplio; `W1-05`/`W1-06` implementados para `PI-01`, `W1-04` pendiente para el resto |
| `GATE-W2` | `ADR-001`…`ADR-010`; `DATA-MATRIX`; esqueleto mínimo (`W2-09`) | No aprobado; ADR-009 tiene decisión pero no ADR |
| `GATE-W3` | `CT-01`/`API-001`, `API-002`…`API-004`, `CT-08`, `CT-09`, DTOs y contract tests | No aprobado; contrato de tres rutas y contract test existen, pero auth/versionado general y CT-08 siguen pendientes |
| `GATE-W4` | `CT-12`, `DB-001`, `DB-MIGRATIONS`, `CT-13`, `CONFIG`, `DOCKER`, health checks | No aprobado formalmente; `DB-001` y PostgreSQL verificados con suite automatizada; migraciones versionadas y CI pendientes |
| `GATE-W5` | `API-004`; `CT-04` si hay pago; pruebas unit/integration/e2e del vertical | No aprobado; `PI-01` tiene 29 pruebas y PostgreSQL local, pero CI/e2e no están integrados |
| `GATE-W6` | Contract tests, concurrencia, idempotencia, fallos de dependencias | No aprobado |
| `GATE-W7` | Revisión de seguridad y hallazgos críticos cerrados | No aprobado |
| `GATE-W8` | README, OpenAPI, ADR y matriz de trazabilidad final actualizados | No aprobado |

### 5.1 Qué no bloquea W1

- `CT-01`/OpenAPI: W3.
- `CT-12`/migraciones: W2/W4.
- `CT-04`/pago: W5, y solo si el primer vertical incluye checkout.
- `CT-05`…`CT-07`, `CT-10`, `CT-11`: olas posteriores.
- `ADR-001`…`ADR-008`, `ADR-010`: W2.
- `ADR-009`/`CT-08`: decisión hecha en W1-03; ADR/contrato ejecutable en W2/W3.
- `ADR-011`: fuera de V1 por `DEC-W1-003`; no se crea.
- `ADR-012`: decisión de política hecha (`DEC-W1-002`); ADR diferido a la ola de devoluciones.

### 5.2 Qué sí bloquea W1

- `DEC-W1-001`…`DEC-W1-004` para cerrar `W1-01` (`DONE`).
- `W1-02` (`L-16`) y `W1-03` (`L-12`/`L-20`) para `PI-01` (`DONE_DOCUMENTAL`).
- `W1-04` (`L-01`) para `PI-02`; no es requisito de `PI-01` (`NOT_STARTED`).
- `W1-05` para elegir el primer vertical (`DONE`: `DEC-IMPL-001`).
- `W1-06`…`W1-08` para el dominio, autorización y trazabilidad del vertical (`W1-06` implementado; `W1-07` N/A en `PI-01`; `W1-08` parcial).

---

## 6. Trazabilidad con `CT-01`…`CT-13`

| CT | Artefacto planificado | Fase | Estado actual | Gate |
|---|---|---|---|---|
| `CT-01` | `API-001` OpenAPI raíz | W3 | `MISSING` (`SIN_EVIDENCIA`) | W3 |
| `CT-02` | Esquema de eventos/outbox | W2–W3 | `MISSING` (conceptual) | W2/W3 |
| `CT-03` | Esquema de auditoría | W2–W4 | `MISSING` (conceptual) | W4 |
| `CT-04` | Contrato de pago | W3–W5 | `MISSING` / `DEFERRED` (sin pagos en `PI-01`) | W5 |
| `CT-05` | Contrato logístico | Posterior | `MISSING` | W5+ |
| `CT-06` | Contrato de notificaciones | Posterior | `MISSING` | W5+ |
| `CT-07` | Contrato de entrega digital | Posterior | `MISSING` | W5+ |
| `CT-08` | Contrato de credenciales | W1–W3 | `DECISION_DONE` / `ARTIFACT_MISSING` (decisión W1-03; contrato W3) | W3 |
| `CT-09` | Contrato de identificadores | W2–W3 | `MISSING` | W2/W3 |
| `CT-10` | Contrato de facturación | Posterior | `MISSING` | W6+ |
| `CT-11` | Contrato de reportes | Posterior | `MISSING` | W6+ |
| `CT-12` | Persistencia/migraciones | W2–W4 | `PARTIAL` (migración `001_initial.sql`; sin historial versionado) | W2/W4 |
| `CT-13` | Reloj UTC | W4 | `ALINEADO` + implementación en `PI-01`; formalización pendiente | W4 |

**Cobertura:** los 13 `CT` quedan asignados. La mayoría no se declara producida; `DB-001` se aplicó y verificó con la suite PostgreSQL, y `CT-02`/`CT-03` tienen implementación parcial. `CT-13` tiene alineación conceptual e implementación en el vertical; su formalización sigue siendo un artefacto de W4.

---

## 7. Estado y próximo paso

- **`GAP-002`:** `RESOLVED_AS_PLAN`.
- **Artefactos existentes:** `backend/openapi.yaml`, `backend/migrations/001_initial.sql`, esquema `audit_log`/`outbox`, suite PostgreSQL y código de `PI-01`; los ADR formales y el validador semántico siguen pendientes.
- **Responsables:** roles, no personas; se asignarán en W2.
- **Próximo paso:** `W1-01`/`W1-02`/`W1-03` cerrados; `W1-05`/`W1-06` implementados para `PI-01`. El siguiente paso es CI, migraciones versionadas y la decisión de `PI-02`. No ampliar a `PI-02`, catálogo, devoluciones, imágenes ni pagos sin sus decisiones y gates.
- **Actualización 2026-10-28:** existen `backend/openapi.yaml` (contrato de tres rutas de `PI-01`), `backend/migrations/001_initial.sql`, suite PostgreSQL y código ejecutable; la migración, concurrencia, rollback y limpieza se verificaron contra PostgreSQL 17.11. La revisión independiente terminó en `PASS`. Los ADR formales, la validación semántica OpenAPI, CI y las migraciones versionadas siguen pendientes; por eso el estado es `PARTIAL`, no `DONE`.
- **Condición de cierre real de `GAP-002`:** cada artefacto existe, está versionado, tiene revisión y su gate correspondiente lo valida. Hasta entonces, `GAP-002` sigue siendo una brecha planificada, no resuelta materialmente.
