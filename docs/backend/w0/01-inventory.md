# W0 — Inventario verificable del repositorio y las fuentes

**Proyecto:** NexusMarket
**Ola:** W0 — Inventario y baseline
**Fecha de inspección:** 2026-10-28
**Rama:** `main`
**Commit HEAD:** `badf0b1993c927d6713d85cd7b44eee8b4259a46` (`Version 2.0`, 2026-10-26T20:38:24-05:00)
**Remote:** `origin` → `https://github.com/SamuuVA/Programacion-Web-2-2026.git`
**Raíz real:** `C:\Users\Samuel V.A\OneDrive\Documentos\Uni\Proyectos\Programa Web 2026-2\NexusMarket\Programacion-Web-2-2026`
**Método:** inspección de solo lectura de Git, árbol de archivos, documentos y entorno local. No se modificó ningún documento fuente ni se instalaron dependencias.
**Actualizado por:** `W1-01` (2026-10-28) — evaluación de equivalencias en §3.2; la evidencia original se conserva.

---

## 1. Hechos de Git

| Comprobación | Resultado | Evidencia |
|---|---|---|
| Raíz del repositorio | Confirmada; coincide con el directorio de trabajo | `git rev-parse --show-toplevel` |
| Rama actual | `main` | `git branch --show-current` |
| Commit HEAD | `badf0b1993c927d6713d85cd7b44eee8b4259a46` | `git rev-parse HEAD` |
| Sincronización con remoto | `main` y `origin/main` apuntan al mismo commit | `git status` |
| Cambios rastreados sin confirmar | Ninguno | `git diff --stat` vacío; `git diff --cached --stat` vacío |
| Archivos sin rastrear | 3 entradas / 6 archivos: `docs/backend/w0/` (4 archivos), `orchestrator-state.md`, `prompt-orquestador-backend.md` | `git status --short`; `git ls-files -o --exclude-standard` |
| Archivos rastreados | 38 (36 `.md`, `.gitignore`, `LICENSE`) | `git ls-files` |
| Tamaño aproximado del árbol de trabajo (sin `.git`) | 1,22 MB | medición de `Get-ChildItem` |

**Conclusión:** el árbol de trabajo está limpio respecto de archivos rastreados. Los seis archivos sin rastrear (en tres entradas de `git status`) son los artefactos operativos de W0 y el prompt; no se sobrescribieron ni se eliminaron. No se hizo commit.

> **Corrección W0.1 (2026-10-28):** la versión inicial de esta tabla contaba solo dos archivos sin rastrear porque `git status --short` colapsa `docs/backend/w0/` en una sola entrada. El revisor independiente detectó el error; el conteo verificable es 6 archivos según `git ls-files -o --exclude-standard`.

---

## 2. Estructura real del repositorio

```text
Programacion-Web-2-2026/
├── .gitignore
├── LICENSE
├── README.md
├── orchestrator-state.md                  # sin rastrear; estado operativo
├── prompt-orquestador-backend.md          # sin rastrear; instrucciones
├── docs/backend/w0/                       # creado en esta ola; solo documentación
└── BackendSDD/
    ├── DOCUMENTATION_STATUS.md
    ├── enunciado.md
    ├── Prompt-maestro-documentacion.md
    ├── Software Architecture/
    │   └── nexusmarket-arquitectura.md
    ├── Domain/
    │   ├── nexusmarket-domain-model.md
    │   ├── nexusmarket-domain-object-values.md
    │   ├── nexusmarket-domain-services.md
    │   └── services/                      # 9 archivos DS-01…DS-09
    ├── Application/
    │   ├── nexusmarket-input-ports.md
    │   ├── nexusmarket-output-ports.md
    │   └── nexusmarket-use-cases-checkout-query-order.md
    ├── Adapters/                          # catálogo + 14 documentos
    └── Contracts/
        └── nexusmarket-contract-alignment.md
```

No existe `src/`, `backend/`, `tests/`, `api/`, `docker/`, `compose.yaml`, `package.json`, `tsconfig.json`, migraciones, CI ni código ejecutable. La antigua carpeta `SDD/` fue eliminada del árbol y solo existe en el historial de Git; no debe reintroducirse (README, líneas 485 y 633; `DOCUMENTATION_STATUS.md` §2).

---

## 3. Inventario de fuentes

### 3.1 Fuentes encontradas

| ID | Fuente | Ruta real | Estado | Autoridad / uso |
|---|---|---|---|---|
| SRC-001 | Especificación funcional del negocio | `BackendSDD/enunciado.md` | `FOUND` | Requisitos explícitos (`OBJ-01`…`OBJ-12`, `RG-01`…`RG-03`, dominios 1–7 y 10) |
| SRC-002 | Modelo de dominio | `BackendSDD/Domain/nexusmarket-domain-model.md` | `FOUND` | Línea base del dominio v2.0: agregados, invariantes, estados, `DD-01`…`DD-14` |
| SRC-003 | Objetos de valor | `BackendSDD/Domain/nexusmarket-domain-object-values.md` | `FOUND` | Catálogo de VOs, estados y validaciones |
| SRC-004 | Catálogo de servicios y políticas | `BackendSDD/Domain/nexusmarket-domain-services.md` | `FOUND` | `DS-01`…`DS-09`, interacciones y reglas |
| SRC-005 | Definiciones individuales de servicios | `BackendSDD/Domain/services/*.md` | `FOUND` | Nueve definiciones autocontenidas |
| SRC-006 | Puertos de entrada | `BackendSDD/Application/nexusmarket-input-ports.md` | `FOUND` | `PI-01`…`PI-25`, contratos conceptuales |
| SRC-007 | Puertos de salida | `BackendSDD/Application/nexusmarket-output-ports.md` | `FOUND` | `PO-01`…`PO-24`, contratos conceptuales |
| SRC-008 | Casos de uso | `BackendSDD/Application/nexusmarket-use-cases-checkout-query-order.md` | `FOUND` | `UC-01 Checkout`, `UC-02 QueryOrder` |
| SRC-009 | Catálogo de adaptadores | `BackendSDD/Adapters/nexusmarket-adapters.md` | `FOUND` | `ADIN-01`, `ADOUT-01`…`ADOUT-13` |
| SRC-010 | Adaptadores individuales | `BackendSDD/Adapters/nexusmarket-adapter-*.md` | `FOUND` | 14 especificaciones documentales |
| SRC-011 | Alineación de contratos | `BackendSDD/Contracts/nexusmarket-contract-alignment.md` | `FOUND` | `CT-01`…`CT-13`, cadena requisito → contrato |
| SRC-012 | Estado documental y continuidad | `BackendSDD/DOCUMENTATION_STATUS.md` | `FOUND` | Decisiones `D-01`…`D-30`, conflictos, limitaciones `L-01`…`L-27`, relevo |
| SRC-013 | Arquitectura de software | `BackendSDD/Software Architecture/nexusmarket-arquitectura.md` | `FOUND` | Capas, módulos, persistencia, Docker, seguridad y pruebas |
| SRC-014 | README del proyecto | `README.md` | `FOUND` | Vista general y hoja de ruta; declara estado documental |
| SRC-015 | Prompt maestro documental | `BackendSDD/Prompt-maestro-documentacion.md` | `FOUND` | Gobierno y calidad **documental**; no es el prompt de agentes concurrentes |

### 3.2 Fuentes nombradas en el prompt que no existen en el repositorio

| Nombre solicitado por `prompt-orquestador-backend.md` | Resultado | Equivalente real más cercano | Evaluación W1-01 |
|---|---|---|---|
| `00-LEEME-INDICE.md` | `MISSING` | `README.md` (índice y navegación) | `EQUIVALENTE_SUFICIENTE` |
| `01-negocio/01-alcance-y-decisiones.md` | `MISSING` | `BackendSDD/enunciado.md` + `BackendSDD/DOCUMENTATION_STATUS.md` §9 | `EQUIVALENTE_PARCIAL`: cubre requisitos y decisiones abiertas, pero no hay alcance V1 aprobado |
| `nexusmarket-domain-sdd.md` | `MISSING` | `BackendSDD/Domain/nexusmarket-domain-model.md` + VOs + servicios | `EQUIVALENTE_SUFICIENTE` |
| `nexusmarket-arquitectura-go.md` | `MISSING` | `BackendSDD/Software Architecture/nexusmarket-arquitectura.md` (adaptación TypeScript; el documento dice adaptar una arquitectura Go, pero el artefacto Go no está en el repositorio ni en el historial) | `SUSTITUIDO_POR_ARQUITECTURA_VIGENTE`; no es equivalente literal |
| `nexusmarket-prompt-maestro-agentes-concurrentes.md` | `MISSING` | `BackendSDD/Prompt-maestro-documentacion.md` (gobierno documental, no orquestación de agentes) | `SIN_EQUIVALENTE`; gap de proceso aceptado |

**Evidencia:** `git ls-files` no contiene esas rutas; `git log --all --name-only` tampoco registra los nombres `nexusmarket-domain-sdd.md`, `nexusmarket-arquitectura-go.md` ni `nexusmarket-prompt-maestro-agentes-concurrentes.md`. No se deben inventar ni crear para “completar” el inventario.

**Corrección W1-01:** la evaluación anterior no distinguía “equivalente real más cercano” de “equivalente suficiente”. Se corrige la trazabilidad: dos fuentes son suficientes, una está sustituida por la arquitectura vigente, una es parcial (alcance V1) y una no tiene equivalente. Detalle en [`../w1/01-resolution-matrix.md`](../w1/01-resolution-matrix.md) §3.5.

### 3.3 Artefactos técnicos ausentes

| Artefacto | Estado | Evidencia |
|---|---|---|
| `package.json` / lockfile | `MISSING` | no figura en `git ls-files` ni en el árbol |
| `tsconfig.json`, ESLint, Prettier | `MISSING` | ídem |
| Código TypeScript/JavaScript | `MISSING` | 0 archivos `.ts`/`.js` rastreados |
| Pruebas | `MISSING` | no existe `tests/` ni configuración de test runner |
| Migraciones SQL | `MISSING` | no existe `migrations/` ni SQL rastreado |
| Esquema/colecciones MongoDB | `MISSING` | no existe código ni documentación ejecutable |
| OpenAPI | `MISSING` | no existe `api/openapi.yaml`; `CT-01` está `SIN_EVIDENCIA` (`L-27`) |
| ADR | `MISSING` | no existe carpeta de ADR ni decisiones técnicas aprobadas |
| Dockerfile / Compose | `MISSING` | no existen; la arquitectura solo contiene ejemplos ilustrativos |
| CI/CD | `MISSING` | no existe `.github/workflows` ni equivalente |
| Backend o estructura equivalente | `MISSING` | no existe `backend/`, `src/` ni módulos implementados |

---

## 4. Mapa de autoridad

La precedencia aplicable, según el prompt y la jerarquía declarada por los propios documentos, es:

1. Requisitos explícitos de negocio: `BackendSDD/enunciado.md`.
2. Modelo de dominio v2.0 y sus decisiones `DD-01`…`DD-14`: `nexusmarket-domain-model.md`.
3. Decisiones de diseño documental vigentes `D-01`…`D-30` y limitaciones `L-01`…`L-27`: `DOCUMENTATION_STATUS.md`.
4. Contratos conceptuales de aplicación: `PI-*`, `PO-*`, `UC-*`, `ADIN/ADOUT`, `CT-*`.
5. Arquitectura: `nexusmarket-arquitectura.md`.
6. Pruebas: no existen.
7. Código: no existe.
8. Propuestas de esta ola: `docs/backend/w0/*` y ADR en estado `PROPOSED`; no son decisiones aprobadas.

**Advertencia de precedencia:** `prompt-orquestador-backend.md` enumera reglas de negocio “conocidas” (variantes, imágenes, pago simulado, plazo de 30 días). En W0 varias no estaban respaldadas por las fuentes y se registraron como conflictos o requisitos no documentados en `03-discrepancies.md`; W1 las resolvió con `DEC-W1-001`…`DEC-W1-004` (variantes, plazo, imágenes y pagos) y el prompt fue corregido. No se aplican por conveniencia.

---

## 5. Conclusión del inventario

El repositorio es **exclusivamente documental**. La documentación de dominio, puertos, casos de uso y adaptadores es extensa y coherente en su mayoría, pero no existe ningún artefacto ejecutable, esquema físico, contrato OpenAPI, ADR ni prueba. El baseline de código es, por tanto, “no aplicable”: no hay nada que compilar ni ejecutar todavía. Las brechas y contradicciones que condicionan la primera implementación están registradas en `03-discrepancies.md`.
