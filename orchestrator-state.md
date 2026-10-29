# NEXUSMARKET — ORCHESTRATOR STATE

> **Propósito:** preservar el estado operativo verificable de la construcción del backend entre sesiones, interrupciones y cambios de agente.
>
> **Regla:** este archivo registra hechos comprobados. Todo estado debe poder contrastarse con archivos, commits, comandos o decisiones identificables.
>
> **Lectura vigente (2026-10-28):** las secciones 1–2 y 9–11, el registro de incidencias y la plantilla S-007 describen el estado actual. Las secciones 3–8 y las plantillas S-001…S-006 conservan el registro histórico de W0/W1 y pueden mencionar “sin backend” o la prueba PostgreSQL manual; no son el estado vigente.

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
| Versión del estado | 2.0 |
| Prompt aplicable | `prompt-orquestador-backend.md` (v1.0) |
| Stack objetivo | TypeScript, Node.js, PostgreSQL, MongoDB, Docker |
| Rama Git comprobada | `main` |
| Commit HEAD comprobado | `badf0b1993c927d6713d85cd7b44eee8b4259a46` |
| Fecha de actualización | 2026-10-28 |
| Agente coordinador actual | Backend Orchestrator (OpenCode / DeepSeek V4.1 Flash Free) |
| Revisor independiente | Sesiones `ses_e7b1c7ddaffepca7fRH5CGMyTx` (1.ª), `ses_e7b113275ffeeAZmlHtptxtOfT` (2.ª), `ses_e7b0b9ec9ffeC6278fXU0TKf9M` (3.ª: `PASS`) y `ses_e7a3f8c7fffehdXpxCqxD8gVkc` (4.ª: `PASS`) |
| Estado global | `IN_PROGRESS` (W0 cerrada; W1-01 cerrada; `PI-01` implementado, con suite PostgreSQL automatizada, contrato de tres rutas y revisión independiente `PASS`; CI pendiente) |
| Ola actual | Cierre de `PI-01`; `PI-02` bloqueado por autenticación, `L-01` y contrato |
| Gate actual | `GATE-W0 = PASS`; `GATE-W1-01 = PASS`; `GATE-W1 = NOT_RUN`; `GATE-PI01-CODE = PASS`; `GATE-PI01-CONTRACT = PASS_WITH_CONSTRAINTS`; `GATE-PI01-POSTGRES = PASS` |
| Fuente de estado | Repositorio real + `backend/` + artefactos `docs/backend/w0/*`, `docs/backend/w1/*` y `docs/backend/implementation/*` |

---

## 2. Estado ejecutivo

### 2.1 Objetivo vigente

Cerrar `PI-01 RegisterBuyer` con evidencia verificable y mantener la trazabilidad documental. El vertical está implementado y probado en memoria/HTTP y PostgreSQL 17.11; el contrato de las tres rutas existentes está acotado y la revisión independiente terminó en `PASS`. Antes de ampliar alcance hay que decidir autenticación, dirección y ruta para `PI-02`.

### 2.2 Último hito comprobado

Corte de implementación y verificación del 2026-10-28: `backend/` usa Fastify 5, TypeScript 5.9, Zod 4, Vitest 5, `pg` y `@node-rs/argon2`; `PI-01`, Argon2id `DEC-W1-008`, stores en memoria/PostgreSQL, migración, endpoint, contrato de tres rutas y pruebas. Ejecutados: `npm run typecheck` OK; `npm test` 5 archivos/29 pruebas OK; `npm run test:postgres` 2 pruebas OK contra PostgreSQL 17.11 (concurrencia `201`/`409`, rollback posterior a escrituras y limpieza dirigida); `npm run build` OK; smoke HTTP real `201`/`409`/health/ready. Evidencia en [`docs/backend/implementation/01-acceptance-and-unblock.md`](docs/backend/implementation/01-acceptance-and-unblock.md).

### 2.3 Trabajo en curso

- ID: cierre documental de `PI-01` completado; siguiente decisión de alcance para `PI-02`.
- Próximo trabajo: decidir `ADR-004`, `L-01` y ruta de `PI-02`; llevar PostgreSQL a CI.
- Bloqueo actual: `PI-02` por autenticación/autorización, composición de `DireccionFisica` y contrato de ruta. `L-27` está cerrada solo para las tres rutas implementadas; `L-10` y `L-22` siguen abiertas; `GAP-001` sigue `PARTIALLY_RESOLVED`.
- CI no ejecuta la suite PostgreSQL; `migrate.ts` no tiene tabla de migraciones versionadas.

### 2.4 Próxima acción exacta

**NEXT_ACTION — decisión de alcance de `PI-02`; no ampliar la implementación**

1. Formular la decisión de `ADR-004` (mecanismo de identidad y autorización administrativa) y `L-01` (campos de `DireccionFisica`) antes de implementar `PI-02`.
2. Definir el contrato de la ruta administrativa, la tabla de vendedor y la relación vendedor-bodega.
3. Llevar la suite PostgreSQL a CI y sustituir `migrate.ts` por migraciones versionadas.
4. No implementar `PI-02`, catálogo, devoluciones, imágenes, pagos ni frontend sin autorización y gates.

**Condición de finalización de `PI-01`:** código compilado, pruebas unitarias/HTTP/contrato aprobadas, PostgreSQL real automatizado y revisión independiente sin hallazgos bloqueantes. Cumplida; CI y migraciones versionadas quedan como trabajo posterior.

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
| W3 | Contratos API/OpenAPI | `PARTIAL` (contrato de tres rutas y `openapi.test.ts`; sin validador semántico) | `GATE-W3 = NOT_RUN`; `GATE-PI01-CONTRACT = PASS_WITH_CONSTRAINTS` |
| W4 | Fundación, persistencia y Docker | `PARTIAL` (config, HTTP, errores, health, memoria y PostgreSQL 17.11 con suite automatizada) | `GATE-W4 = NOT_RUN`; `GATE-PI01-POSTGRES = PASS` |
| W5 | Casos de uso verticales | `PARTIAL` (`PI-01` código y 29 pruebas; PostgreSQL automatizado; revisión independiente `PASS`) | `GATE-W5 = NOT_RUN`; `GATE-PI01-CODE = PASS` |
| W6 | Integración y pruebas críticas | `NOT_STARTED` | `GATE-W6 = NOT_RUN` |
| W7 | Seguridad y robustez | `NOT_STARTED` | `GATE-W7 = NOT_RUN` |
| W8 | Documentación y release candidate | `NOT_STARTED` | `GATE-W8 = NOT_RUN` |

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
| `W3-01`…`W3-06` | OpenAPI del primer vertical | W3 | `PARTIAL` (contrato de tres rutas; contract test) | W2-09 |
| `W4-01`…`W4-10` | Fundación ejecutable y Docker | W4 | `PARTIAL` (PostgreSQL/Docker y suite automatizada) | W2-09 |
| `W5-01`…`W5-08` | Primer caso de uso vertical | W5 | `PARTIAL` (`PI-01` código/29 pruebas; PostgreSQL automatizado) | W3-06, W4-10 |
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
| `RISK-003` | `L-27`: sin OpenAPI/auth | `RISK` | Alta | `PARTIAL` (contrato cerrado solo para tres rutas; auth no) | W3/W5 |
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
| API-001 | OpenAPI raíz | — | `PARTIAL`: contrato de tres rutas en `backend/openapi.yaml` | API Contract Agent | `openapi.test.ts`; sin validador semántico |
| API-002 | Autenticación/contexto de identidad | — | `NOT_STARTED` | Security + API | No existe (`L-27`) |
| API-003 | Errores API | — | `PARTIAL`: formato uniforme implementado | API Architect | Sin catálogo formal completo |
| API-004 | Primer flujo vertical | — | `IMPLEMENTED` (`PI-01`) | Caso de uso asignado | 29 pruebas y PostgreSQL automatizado |

Se adoptó provisionalmente `/api/v1` y un contrato mínimo para `PI-01` (`DEC-IMPL-007`). `L-27` queda cerrada **solo** para `POST /api/v1/buyers`, `/health` y `/ready`; autenticación, versionado general, rate limiting y rutas futuras siguen abiertos. `CT-01 = PARCIAL` (tres rutas); `CT-02`…`CT-12 = ALINEADO_CON_PROPUESTA`; solo `CT-13` está `ALINEADO`.

**W1-01 (`GAP-002`):** el plan de ADR/contratos está en [`docs/backend/w1/02-artifact-register.md`](docs/backend/w1/02-artifact-register.md). El corte posterior creó el contrato de tres rutas, migración y código de `PI-01`; los ADR formales y el validador semántico siguen pendientes. `ADR-009`/`CT-08` tienen decisión (`DEC-W1-008`) pero no ADR/contrato ejecutable; `ADR-011` queda fuera de V1 y `ADR-012` tiene política (`DEC-W1-002`) con ADR diferido. W2 exige ADR-001…010; W3 exige `CT-01`/`API-001`…`API-004`, `CT-08` y `CT-09`; W4 exige `CT-12`, `DB-001`, `CT-13`, configuración y Docker; W5 exige el contrato del primer vertical y `CT-04` si hay pago.

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

**No ejecutados:** lint, e2e de frontend, CI y validador semántico OpenAPI. La suite PostgreSQL se ejecutó localmente; en CI queda `PENDING`.

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

---

## 16. Estado de entrega

| Capacidad | Estado | Evidencia requerida |
|---|---|---|
| Dominio y reglas | `IMPLEMENTED` para `PI-01`; resto `DOCUMENTED` / `NOT_IMPLEMENTED` | `backend/src/shared/domain/*`, `backend/src/modules/*/domain/*`; pruebas unitarias |
| Arquitectura hexagonal | `PARTIAL` (módulos/adaptadores) | `backend/src`; separación dominio/aplicación/infraestructura/HTTP |
| PostgreSQL | `IMPLEMENTED` y verificado con suite automatizada | `backend/migrations/001_initial.sql`; `postgres-buyer-registration-store.ts`; `tests/postgres/**`; CI pendiente |
| MongoDB | `NOT_STARTED` | Sin colecciones; fuera de `PI-01` |
| OpenAPI | `PARTIAL` (tres rutas) | `backend/openapi.yaml`; `tests/contract/openapi.test.ts`; sin validador semántico |
| Autenticación | `NOT_STARTED` / `DEFERRED` | `L-27` acotada; `ADR-004` pendiente |
| Autorización y ownership | `N/A` en `PI-01` | Registro público; matriz para el resto pendiente |
| Inventario y concurrencia | `DOCUMENTED` / `NOT_IMPLEMENTED` | Reglas `INV-*`; sin pruebas |
| Pago | `DOCUMENTED` / `NOT_IMPLEMENTED` | `PAY-*`; `CON-004` resuelto: sin pagos en `PI-01` |
| Docker | `IMPLEMENTED` y verificado | Docker 29.8.0; `compose.yaml`; PostgreSQL 17.11 healthy |
| Integración | `DONE` local (HTTP/memoria + PostgreSQL automatizado) | `tests/integration/register-buyer-http.test.ts`; `tests/postgres/**`; CI pendiente |
| Seguridad | `PARTIAL` (Argon2id, sin secretos en auditoría) | Pruebas de hash y ausencia de contraseña |
| Documentación | `W0 DONE`; `W1-01 DONE`; `PI-01` documentado | `docs/backend/*`; revisión independiente `PASS` |
| Release candidate | `NOT_STARTED` | `GATE-W8` no ejecutado |

---

## 17. Protocolo de reanudación

1. Leer `prompt-orquestador-backend.md`, este archivo, `docs/backend/w1/01-resolution-matrix.md` y `docs/backend/w1/03-decisions.md`.
2. Verificar `git status`, rama, commit y artefactos de `docs/backend/w0/` y `docs/backend/w1/`.
3. Confirmar que `GATE-W0` y `GATE-W1-01` siguen en `PASS`; `GATE-W1` sigue `NOT_RUN` como gate amplio. `GATE-PI01-CODE = PASS`; `GATE-PI01-CONTRACT = PASS_WITH_CONSTRAINTS`; `GATE-PI01-POSTGRES = PASS`.
4. No iniciar `PI-02`, catálogo ni fases posteriores sin sus decisiones; el siguiente trabajo es la revisión independiente y la decisión de autenticación/dirección/ruta.
5. No implementar catálogo, devoluciones, imágenes ni pagos sin sus gates; `L-10`/`L-22` siguen abiertas y `L-27` está acotada a tres rutas.
6. Actualizar este archivo en el mismo cambio de trabajo.

---

## 18. Condición de finalización del backend

El proyecto no puede declararse completo porque el servidor arranque. La entrega final requiere requisitos trazables, dominio e invariantes respetados, contratos coherentes, persistencia justificada, transacciones/concurrencia verificadas, seguridad comprobada, pruebas críticas ejecutadas, Docker reproducible, documentación actualizada y `GATE-W8` aprobado.

**Estado actual:** W0 documentado y aprobado; W1-01 `DONE`; `PI-01 RegisterBuyer` implementado con Fastify/TypeScript, 29 pruebas aprobadas, contrato de tres rutas probado y PostgreSQL 17.11 automatizado con concurrencia, `409`, rollback y limpieza. `GATE-PI01-CODE = PASS` (revisión independiente `PASS`), `GATE-PI01-CONTRACT = PASS_WITH_CONSTRAINTS` y `GATE-PI01-POSTGRES = PASS`. `PI-02` sigue bloqueado por autenticación, `U-004` (`L-01`) y contrato; `L-22`, `L-10` y el resto de `L-27` siguen abiertos. Los requisitos excluidos o pendientes están identificados en `03-discrepancies.md`, `docs/backend/w1/01-resolution-matrix.md`, `docs/backend/w1/03-decisions.md` y `docs/backend/implementation/01-acceptance-and-unblock.md`, y no se presentan como funcionalidades completas.
