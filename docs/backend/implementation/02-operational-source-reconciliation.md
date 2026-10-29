# Reconciliación de fuentes operativas

**Fecha:** 2026-10-28  
**Alcance:** instrucciones de orquestación y fuentes usadas para implementar y verificar `PI-01`.  
**Regla:** no se editaron las fuentes originales del profesor. Las correcciones se aplican al prompt operativo propio del proyecto y se registran aquí.

---

## 1. Fuentes inspeccionadas

| Fuente | Uso | Estado |
|---|---|---|
| `README.md` | Índice y estado general | `FOUND` |
| `BackendSDD/enunciado.md` | Objetivos y reglas del negocio | `FOUND` |
| `BackendSDD/Domain/nexusmarket-domain-model.md` | Agregados, invariantes y estados | `FOUND` |
| `BackendSDD/Domain/nexusmarket-domain-object-values.md` | Objetos de valor y validaciones | `FOUND` |
| `BackendSDD/Domain/nexusmarket-domain-services.md` y `services/*.md` | Políticas y servicios | `FOUND` |
| `BackendSDD/Application/nexusmarket-input-ports.md` | `PI-01`…`PI-25` | `FOUND` |
| `BackendSDD/Application/nexusmarket-output-ports.md` | `PO-01`…`PO-24` | `FOUND` |
| `BackendSDD/Software Architecture/nexusmarket-arquitectura.md` | Arquitectura y stack | `FOUND` |
| `BackendSDD/Adapters/nexusmarket-adapter-http-input.md` | Frontera HTTP | `FOUND` |
| `BackendSDD/Contracts/nexusmarket-contract-alignment.md` | `CT-01`…`CT-13` | `FOUND` |
| `BackendSDD/DOCUMENTATION_STATUS.md` | Jerarquía y limitaciones | `FOUND` |
| `BackendSDD/Prompt-maestro-documentacion.md` | Gobierno documental | `FOUND`; no es prompt de orquestación |
| `orchestrator-state.md`, `docs/backend/**` | Estado y decisiones operativas | `FOUND` |
| `backend/**` | Código, pruebas, migración, OpenAPI y Compose | `FOUND` |

No se encontraron las rutas históricas `00-LEEME-INDICE.md`, `01-negocio/01-alcance-y-decisiones.md`, `nexusmarket-domain-sdd.md`, `nexusmarket-arquitectura-go.md` ni `nexusmarket-prompt-maestro-agentes-concurrentes.md`. Sus equivalencias están registradas en `docs/backend/w1/01-resolution-matrix.md` §3.5 y `orchestrator-state.md` §4.1.

---

## 2. Contradicciones operativas detectadas

| ID | Contradicción | Evidencia | Impacto | Resolución aplicada | Estado |
|---|---|---|---|---|---|
| `OPC-001` | El prompt operativo pedía archivos inexistentes y una arquitectura Go. | `prompt-orquestador-backend.md` §2 anterior; árbol real en `BackendSDD/` | Un agente podía detenerse o inventar fuentes. | §2 se reemplazó por las rutas reales y una nota de ausencias. No se editó `BackendSDD/**`. | `RESOLVED` |
| `OPC-002` | El prompt mostraba un layout `src/domain/...` distinto del layout real `backend/src/modules/...`. | `prompt-orquestador-backend.md` §4 anterior; `backend/src/**`; `DEC-IMPL-004` | Riesgo de duplicar jerarquías y romper imports. | §4 describe el árbol ejecutable y exige una decisión registrada para reorganizarlo. | `RESOLVED` |
| `OPC-003` | `Prompt-maestro-documentacion.md` prohíbe entregar código, pero el proyecto necesitaba implementar `PI-01`. | `BackendSDD/Prompt-maestro-documentacion.md` §1; autorización del propietario para el primer vertical | Un agente podía aplicar la prohibición documental al código de producto. | El prompt operativo distingue gobierno documental de ejecución; la implementación se autoriza por `DEC-IMPL-001` y el alcance de `PI-01`. | `RESOLVED` |
| `OPC-004` | `L-27` declara que no existe contrato HTTP aprobado, pero el repositorio contiene un OpenAPI provisional. | `DOCUMENTATION_STATUS.md` `L-27`; `backend/openapi.yaml`; `DEC-IMPL-007` | Confusión entre contrato global y contrato del alcance implementado. | `L-27` se cierra **solo** para `POST /api/v1/buyers`, `/health` y `/ready`; autenticación, versionado general, rate limiting y rutas futuras siguen abiertos. | `RESOLVED_WITH_SCOPE` |
| `OPC-005` | El prompt exige autenticación para operaciones protegidas, pero `PI-01` es público y no existe `ADR-004`. | `prompt-orquestador-backend.md` §6; `DEC-IMPL-006`; `nexusmarket-adapter-http-input.md` | No se puede implementar `PI-02` sin decidir el mecanismo de identidad. | Se mantiene `PI-02 = BLOCKED`; evaluación en [`03-pi02-evaluation.md`](03-pi02-evaluation.md). | `OPEN` |

---

## 3. Límites de la corrección

- Las fuentes del profesor conservan su contenido; las modificaciones que ya existían antes de esta sesión no se revierten ni se presentan como nuevas.
- El prompt operativo no inventa rutas, códigos ni mecanismos de autenticación.
- El OpenAPI solo documenta el alcance implementado y probado.
- La ausencia de `L-01` y de `ADR-004` sigue siendo un bloqueo real para `PI-02`, no una decisión que pueda tomar el orquestador.
