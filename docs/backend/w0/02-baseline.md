# W0 — Baseline real del repositorio y del entorno

**Proyecto:** NexusMarket
**Ola:** W0 — Inventario y baseline
**Fecha:** 2026-10-28
**Commit verificado:** `badf0b1993c927d6713d85cd7b44eee8b4259a46`
**Rama:** `main`
**Principio:** cada resultado se registra como `PASS`, `FAIL`, `NOT_RUN`, `NOT_INSTALLED`, `BLOCKED` o `NOT_APPLICABLE`. No se declaró ninguna prueba como aprobada sin ejecutarla.

---

## 1. Entorno local comprobado

| Componente | Resultado real | Estado | Evidencia |
|---|---|---|---|
| Sistema operativo | Windows NT 10.0.26300.0 (`Windows_NT`) | `PASS` | `[System.Environment]::OSVersion.VersionString` |
| Node.js | `v24.21.0` | `PASS` | `node --version` |
| npm | `11.19.0` | `PASS` | `npm --version` |
| Git | `2.51.0.windows.1` | `PASS` | `git --version` |
| Docker CLI | `29.8.0`, build `88096ef` | `PASS` (CLI) | `docker --version` |
| Docker Compose | `v5.5.1` | `PASS` (CLI) | `docker compose version` |
| Docker daemon | No conecta: `open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified` | `FAIL` / `BLOCKED` para Docker | `docker info` |
| TypeScript (`tsc`) | No instalado globalmente | `NOT_INSTALLED` | `Get-Command tsc` |
| Cliente PostgreSQL (`psql`) | No instalado | `NOT_INSTALLED` | `Get-Command psql` |
| MongoDB (`mongod`) | No instalado | `NOT_INSTALLED` | `Get-Command mongod` |

**Lectura:** el entorno puede ejecutar Node/npm y dispone de Docker CLI/Compose, pero el daemon no está activo y no hay clientes locales de PostgreSQL/MongoDB. Las pruebas de integración y Docker no pueden ejecutarse hasta que exista una fundación y el daemon esté disponible; se registran como `BLOCKED`, no como fallos del producto.

---

## 2. Baseline de Git

| Verificación | Comando exacto | Resultado | Estado |
|---|---|---|---|
| Raíz | `git rev-parse --show-toplevel` | Ruta del proyecto | `PASS` |
| Rama | `git branch --show-current` | `main` | `PASS` |
| Commit | `git rev-parse HEAD` | `badf0b1993c927d6713d85cd7b44eee8b4259a46` | `PASS` |
| Estado | `git status --short` | 3 entradas sin rastrear: `docs/`, `orchestrator-state.md`, `prompt-orquestador-backend.md` (6 archivos) | `PASS` |
| Diff rastreado | `git diff --stat` | Vacío | `PASS` |
| Diff staged | `git diff --cached --stat` | Vacío | `PASS` |
| Remoto | `git remote -v` | `origin` → GitHub `SamuuVA/Programacion-Web-2-2026` | `PASS` |
| Último commit | `git log -1 --format=...` | `Version 2.0`, autor `SamuuVA`, 2026-10-26T20:38:24-05:00 | `PASS` |

---

## 3. Baseline de build, calidad y pruebas

| Verificación | Comando aplicable | Resultado | Estado | Motivo |
|---|---|---|---|---|
| Instalación reproducible | `npm ci` | No ejecutado | `NOT_APPLICABLE` | No existe `package.json` ni lockfile |
| Formato | — | No existe script | `NOT_APPLICABLE` | No hay configuración de formato |
| Lint | — | No existe script | `NOT_APPLICABLE` | No hay ESLint ni equivalente |
| Typecheck | `tsc --noEmit` | No ejecutado | `NOT_APPLICABLE` | No existe `tsconfig.json` ni TypeScript instalado |
| Pruebas unitarias | — | No ejecutado | `NOT_APPLICABLE` | No existe suite ni test runner |
| Pruebas de integración | — | No ejecutado | `NOT_APPLICABLE` | No existe código, base de datos ni suite |
| Build | — | No ejecutado | `NOT_APPLICABLE` | No existe proyecto compilable |
| Validación OpenAPI | — | No ejecutado | `NOT_APPLICABLE` | No existe `api/openapi.yaml` (`L-27`) |
| Migraciones desde cero | — | No ejecutado | `NOT_APPLICABLE` | No existen migraciones ni esquema |
| Docker Compose | `docker compose config` | No ejecutado | `BLOCKED` | No existe `compose.yaml` y el daemon no está activo |
| Build de imagen | `docker build ...` | No ejecutado | `BLOCKED` | No existe Dockerfile ni daemon activo |
| Health checks | — | No ejecutado | `NOT_APPLICABLE` | No existe servidor |

**Conclusión:** no hay fallos preexistentes de código porque no hay código. Tampoco existe una línea base funcional que pueda compararse; el baseline es documental y de entorno. Declarar “build PASS” o “tests PASS” sería falso.

---

## 4. Baseline de persistencia, contratos y configuración

| Elemento | Estado real | Evidencia |
|---|---|---|
| PostgreSQL como fuente transaccional | Decidido en documentación (`[MOD]` §24, `DD-09`), sin esquema físico | `nexusmarket-domain-model.md` líneas 1052–1058; `DOCUMENTATION_STATUS.md` §7 |
| MongoDB para auditoría/proyecciones | Decidido a alto nivel (`[MOD]` §24, `DD-09`), sin colecciones ni índices | ídem; `ADOUT-05` |
| Propiedad de datos detallada | Pendiente de matriz física y migraciones | `DOCUMENTATION_STATUS.md` §7; este baseline |
| OpenAPI | Ausente; `CT-01 = SIN_EVIDENCIA` | `nexusmarket-contract-alignment.md` líneas 83–97 |
| Autenticación | Mecanismo no aprobado (`L-27`) | `nexusmarket-adapter-http-input.md` líneas 96–109 |
| ADR técnicos | Ausentes | no existe carpeta ni documento de ADR |
| Secretos y `.env` | `.env` y `.env.*` ignorados; no hay `.env.example` | `.gitignore` |
| Docker/Compose | Solo ejemplos ilustrativos en la arquitectura; no ejecutables | `nexusmarket-arquitectura.md` §10 |

---

## 5. Evidencias de comandos

### TEST-EVIDENCE-W0-001 — Estado de Git

- **Comando exacto:** `git rev-parse --show-toplevel; git branch --show-current; git rev-parse HEAD; git status --short`
- **Fecha:** 2026-10-28
- **Entorno:** Windows, PowerShell, repositorio local
- **Resultado:** `PASS`
- **Salida real:** raíz del proyecto; `main`; `badf0b1993c927d6713d85cd7b44eee8b4259a46`; 3 entradas sin rastrear (`docs/`, `orchestrator-state.md`, `prompt-orquestador-backend.md`), 6 archivos según `git ls-files -o --exclude-standard`.
- **Limitaciones:** no se verificó una copia limpia en otro directorio.

### TEST-EVIDENCE-W0-002 — Herramientas

- **Comando exacto:** `node --version; npm --version; git --version; docker --version; docker compose version; tsc --version; psql --version; mongod --version`
- **Fecha:** 2026-10-28
- **Resultado:** `PASS` para Node/npm/Git/Docker CLI/Compose; `NOT_INSTALLED` para `tsc`, `psql` y `mongod`
- **Salida real:** Node 24.21.0; npm 11.19.0; Git 2.51.0; Docker 29.8.0; Compose v5.5.1. `tsc`, `psql` y `mongod` no están instalados.
- **Limitaciones:** la ausencia de clientes locales no impide usar contenedores, pero el daemon está detenido.

### TEST-EVIDENCE-W0-003 — Docker daemon

- **Comando exacto:** `docker info --format '{{.ServerVersion}} {{.OperatingSystem}}'`
- **Fecha:** 2026-10-28
- **Resultado:** `FAIL`
- **Salida real:** `failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine ...`
- **Impacto:** W4 y W6 no podrán validar contenedores ni bases reales hasta iniciar Docker Desktop.
- **Próxima acción:** iniciar el daemon y repetir `docker info` antes de W4.

### TEST-EVIDENCE-W0-004 — Ausencia de artefactos ejecutables

- **Comando exacto:** `git ls-files` y listado recursivo del árbol
- **Fecha:** 2026-10-28
- **Resultado:** `PASS` (verificación de ausencia)
- **Salida real:** 38 archivos rastreados; 36 Markdown; solo `.gitignore` y `LICENSE` como no-Markdown.
- **Limitaciones:** no se inspeccionaron objetos internos de Git distintos de los nombres de archivo del historial.

### TEST-EVIDENCE-W0-005 — Huellas de documentos clave

- **Comando exacto:** `Get-FileHash -Algorithm SHA256` sobre los documentos clave
- **Fecha:** 2026-10-28
- **Resultado:** `PASS`
- **Salida real:**
  - `9DC6C2D1E35A635B1CFF30279D96E06EAAF8DDEC23FD06D587FF8FEB748052C1` — `BackendSDD/enunciado.md`
  - `B7DB889336DC890705B566DFF4D230861B83AEE078D8D0DD46CC752F1499E5E4` — `BackendSDD/Domain/nexusmarket-domain-model.md`
  - `CB1363566AC96AC9518FCC4AD57258B89217DCF997400C858F13A5AF693196AD` — `BackendSDD/Software Architecture/nexusmarket-arquitectura.md`
  - `23EE736146649BBBB754ED686F52ACEB80B941E449F33832AA514426FACEB8CA` — `BackendSDD/Contracts/nexusmarket-contract-alignment.md`
  - `2B4255CA0AD517DD30AA320E790F4F83F62CA9B7BDB4D7160C48FB9777E70AA2` — `README.md`
- **Limitaciones:** las huellas permiten detectar cambios posteriores, no sustituyen la revisión de contenido.

---

## 6. Riesgos de baseline

| ID | Riesgo | Impacto | Mitigación |
|---|---|---|---|
| RISK-001 | El daemon Docker no está activo | W4/W6 no pueden validar Compose, migraciones ni integración real | Iniciar Docker Desktop y repetir `docker info` antes de W4 |
| RISK-002 | No hay clientes locales de PostgreSQL/MongoDB | Las pruebas de integración dependen de contenedores | Usar Compose cuando exista; no simular integración con mocks |
| RISK-003 | El entorno tiene Node 24, mientras la arquitectura ilustra `node:22` | Posible deriva entre runtime local e imagen | Fijar versión LTS en ADR y en `engines`/imagen; no asumir |
| RISK-004 | No existe una copia limpia verificada | El baseline podría depender de estado local | Repetir `npm ci` y pruebas en un clon limpio en W4/W8 |

---

## 7. Conclusión del baseline

El baseline queda establecido como **repositorio documental sin código ejecutable**. No hay build, lint, typecheck, pruebas, migraciones, OpenAPI ni Docker que ejecutar. Los únicos resultados `FAIL` corresponden al daemon de Docker; los demás son `NOT_APPLICABLE` por ausencia de artefactos, no por éxito supuesto. Cualquier implementación posterior debe crear su propia línea base ejecutable y registrar nuevas evidencias.
