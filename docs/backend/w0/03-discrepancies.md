# W0 — Registro de discrepancias, decisiones y riesgos

**Proyecto:** NexusMarket
**Ola:** W0 — Inventario y baseline
**Fecha:** 2026-10-28
**Commit de referencia:** `badf0b1993c927d6713d85cd7b44eee8b4259a46`
**Actualizado por:** `W1-01` (2026-10-28) — se añadieron estados y §8; no se alteró la evidencia original.
**Regla:** una discrepancia no se resuelve por conveniencia técnica ni se oculta reescribiendo la fuente. Se registra, se identifica la autoridad y se detienen solo las tareas afectadas.

---

## 1. Resumen ejecutivo

| ID | Título | Tipo | Severidad | Estado | Bloquea |
|---|---|---|---|---|---|
| `CON-001` | Variantes comerciales en V1 | `CONFLICT` | Alta | `RESOLVED` (`DEC-W1-001`) | Catálogo/inventario siguen sujetos a `W1-05` y gates; no bloquean `PI-01` |
| `CON-002` | Plazo de devolución de 30 días | `CONFLICT` | Alta | `RESOLVED` (`DEC-W1-002`) | Devoluciones siguen sujetas a `L-10` y gates; no bloquean `PI-01` |
| `CON-003` | Imágenes como requisito de publicación | `UNDOCUMENTED_REQUIREMENT` | Alta | `RESOLVED` (`DEC-W1-003`) | Sin imágenes en V1; no bloquea `PI-01` |
| `CON-004` | Pago simulado en V1 | `UNDOCUMENTED_REQUIREMENT` | Alta | `RESOLVED` (`DEC-W1-004`) | Pagos fuera de `PI-01`; `L-22`/`CT-04` siguen abiertos |
| `GAP-001` | Fuentes nombradas en el prompt ausentes | `NON_BLOCKING` | Media | `PARTIALLY_RESOLVED` | Protocolo de agentes concurrentes sin equivalente; no bloquea |
| `GAP-002` | No existen contratos ejecutables ni ADR | `NON_BLOCKING` (W1) / `BLOCKER` (W2–W5) | Media | `RESOLVED_AS_PLAN` | W2, W3, W4, W5 (cada gate exige sus artefactos) |
| `U-001` | Primer caso de uso vertical no aprobado | `BLOCKER` | Alta | `RESOLVED` (`DEC-IMPL-001`: `PI-01`) | W1-05, W5 |
| `U-002` | Estados iniciales de cuenta y vendedor (`L-16`) | `BLOCKER` | Alta | `RESOLVED` (`DEC-W1-007`) | — |
| `U-003` | Política de credenciales (`L-12`, `L-20`) | `BLOCKER` | Alta | `RESOLVED` (`DEC-W1-008`) | — |
| `U-004` | Composición de dirección (`L-01`) | `BLOCKER` | Alta | `WAITING_FOR_DECISION` | `PI-02`, `PI-03`, `PI-08`, `PI-12` |
| `U-005` | Framework, ORM, test runner y autenticación | `BLOCKER` | Alta | `RESOLVED_REVERSIBLE` (`DEC-IMPL-002`/`006`) | W2/W4 |
| `U-006` | Matriz física de propiedad de datos | `BLOCKER` | Alta | `RESOLVED_REVERSIBLE` (`DEC-IMPL-003`) | W2/W4 |
| `U-007` | Layout exacto de `backend/` | `NON_BLOCKING` | Baja | `RESOLVED` (`DEC-IMPL-004`) | W2 |
| `U-008` | Versión LTS de Node | `NON_BLOCKING` | Media | `RESOLVED` (`DEC-IMPL-005`: Node 24) | W2/W4 |
| `RISK-001` | Daemon Docker inactivo | `RISK` | Media | `OPEN` | W4/W6 |
| `RISK-002` | Sin clientes locales de PostgreSQL/MongoDB | `RISK` | Media | `OPEN` | W4/W6 |
| `RISK-003` | Contratos HTTP y auth no aprobados (`L-27`) | `RISK` | Alta | `OPEN` | W3/W5 |
| `RISK-004` | Decisiones de negocio abiertas `DEC-BIZ-01`…`07` | `RISK` | Alta | `OPEN` | Checkout, facturación, devoluciones |
| `RISK-005` | Documentación “completa” sin artefactos ejecutables | `RISK` | Media | `OPEN` | Planificación; no es un defecto funcional |
| `RISK-006` | Deriva entre el modelo v2.0 y el prompt operativo | `RISK` | Alta | `OPEN` | Catálogo, inventario |

Las conciliaciones documentales `C-01`…`C-21` de `DOCUMENTATION_STATUS.md` se consideran cerradas en su ámbito y **no se reabren** en esta ola. Las que afectan al baseline se citan solo como contexto.

---

## 2. Conflictos y requisitos no documentados que requieren decisión

### CON-001 — Variantes comerciales en V1

- **Tipo:** `CONFLICT`
- **Estado:** `RESOLVED` (`DEC-W1-001`, 2026-10-28)
- **Detectado por:** Backend Orchestrator / Repository Inspector
- **Fecha:** 2026-10-28
- **Pregunta concreta:** ¿En V1 cada combinación vendible es un `Producto` independiente, o se mantiene `Producto` + `Variante` como unidad de SKU, precio e inventario?
- **Evidencia:**
  - `prompt-orquestador-backend.md` línea 255: “En V1 no existen variantes comerciales de producto. Cada combinación vendible corresponde a un producto independiente.”
  - `BackendSDD/enunciado.md` líneas 147–149: el catálogo incluye “Variantes” como diferencias de color, talla o modelo.
  - `BackendSDD/Domain/nexusmarket-domain-model.md` líneas 117–118: `Producto` agrupa una o más `Variante`; la variante es “unidad de SKU, precio e inventario”.
  - Ídem líneas 306–371 (`§7`), 396–422 (`§8.2`), 1073–1074 (`DM-06`, `DM-07`), 1130 (`DD-04`).
  - `BackendSDD/Application/nexusmarket-input-ports.md` `PI-05` y `BackendSDD/Application/nexusmarket-use-cases-checkout-query-order.md` usan `varianteId` en carrito, pedido e inventario.
- **Fuente(s) afectada(s):** prompt operativo vs. especificación funcional + modelo de dominio v2.0 + puertos/casos de uso.
- **Artefactos afectados:** modelo de catálogo, inventario, carrito, pedido, esquema SQL, DTOs, OpenAPI, pruebas.
- **Impacto funcional/técnico:** cambia la clave de inventario (`productoId` vs. `varianteId`), la unicidad de SKU, el precio, las líneas de carrito/pedido y la publicación (`CAT-02`/`CAT-03`). No es una decisión de infraestructura.
- **Opciones:**
  1. Mantener `Producto` + `Variante` (modelo v2.0 y enunciado).
  2. Aplicar la regla del prompt: un producto por combinación vendible, sin entidad `Variante`.
  3. Modelo híbrido: producto “simple” con una variante implícita, preservando el contrato de variante.
- **Trade-offs:** la opción 1 conserva la línea base y las pruebas `DM-06`/`DM-07`; la opción 2 simplifica el catálogo pero contradice el modelo, los puertos y los casos de uso; la opción 3 reduce el cambio de contrato pero añade complejidad.
- **Recomendación:** no decidir unilateralmente. Si no existe una decisión de negocio posterior al 2026-10-26 que derogue el modelo 2.0, tratar la regla del prompt como **no respaldada** y mantener la opción 1. La decisión corresponde al responsable de negocio/dominio.
- **Responsable de decidir:** responsable de negocio/dominio del proyecto.
- **Tareas bloqueadas:** `W1-01` (decisión). Si el primer vertical o una ola posterior incluye catálogo/inventario, quedan bloqueadas `W2-03`, `W2-10`, `W3-02` y `W5-01`…`W5-03`. No existen todavía tareas específicas de catálogo en el backlog; se crearán al aprobarse el alcance.
- **Resolución W1-01:** `RESOLVED` por `DEC-W1-001 = A`. El propietario ratificó `Producto` + `Variante` en V1; la variante es la unidad de SKU, precio e inventario. Se corrigió el prompt §6 y se alineó `enunciado.md` (inventario por producto/variante). No se modificó el modelo 2.0 porque ya era la línea base. Detalle en [`../w1/03-decisions.md`](../w1/03-decisions.md) §1.1 y [`../w1/01-resolution-matrix.md`](../w1/01-resolution-matrix.md) §3.1.

### CON-002 — Plazo de devolución de 30 días

- **Tipo:** `CONFLICT`
- **Estado:** `RESOLVED` (`DEC-W1-002`, 2026-10-28)
- **Pregunta concreta:** ¿El plazo de devolución es exactamente 30 días desde la entrega o es una política configurable sin cifra fijada?
- **Evidencia:**
  - `prompt-orquestador-backend.md` línea 265: “La elegibilidad de devolución contempla un plazo de 30 días desde la entrega, según la regla de dominio disponible.”
  - `nexusmarket-domain-model.md` línea 712: el período “se parametriza como política de negocio, no se fija aquí una cifra arbitraria”.
  - `nexusmarket-domain-model.md` línea 1138 (`DD-12`): “plazo configurable, no una cifra inventada”.
  - `DOCUMENTATION_STATUS.md` línea 173 (`L-06`) y línea 251 (`DEC-BIZ-02`): el plazo no está especificado.
- **Impacto:** `DS-07`, `PI-21`/`PI-22`, pruebas de elegibilidad, contrato de devoluciones y mensajes al comprador.
- **Opciones:** fijar 30 días por decisión de negocio; parametrizar por categoría/jurisdicción; mantener configurable con valor por entorno.
- **Recomendación:** mantener la política configurable y registrar el valor aprobado; no hardcodear los 30 días, que son el valor inicial de `DEC-W1-002` y deben provenir de configuración versionada.
- **Responsable:** negocio.
- **Tareas bloqueadas:** `W1-01` (decisión). No hay tareas de devoluciones o reembolsos en el backlog actual; si se incorporan, `DS-07`, su contrato y sus pruebas quedan bloqueados hasta fijar la política y el valor aplicable.
- **Resolución W1-01:** `RESOLVED` por `DEC-W1-002 = B`. El propietario aprobó una política configurable con **30 días como valor inicial**, una sola política de plataforma en V1; se registra el valor aplicado. El evento de inicio sigue siendo la entrega confirmada (`ENTREGADO` o entrega digital confirmada) y las condiciones `RET-01`…`RET-12` no cambian. No se hardcodea: la configuración y el snapshot pertenecen a W2/W5. `L-10` (catálogo de motivos) sigue abierta. Detalle en [`../w1/03-decisions.md`](../w1/03-decisions.md) §1.2 y [`../w1/01-resolution-matrix.md`](../w1/01-resolution-matrix.md) §3.2.

### CON-003 — Imágenes como requisito de publicación

- **Tipo:** `UNDOCUMENTED_REQUIREMENT`
- **Estado:** `RESOLVED` (`DEC-W1-003`, 2026-10-28)
- **Pregunta concreta:** ¿Las imágenes son obligatorias para publicar un producto y dónde se almacenan?
- **Evidencia:**
  - `prompt-orquestador-backend.md` línea 257: “Las imágenes se asocian al producto.”
  - Ídem línea 259: “SKU e imágenes son requisitos de publicación del producto.”
  - Búsqueda de `imagen`/`foto` en `BackendSDD/`: no existe una regla de negocio que exija imágenes de producto. `nexusmarket-input-ports.md` línea 440 y `nexusmarket-output-ports.md` línea 376 declaran que los puertos no definen ni generan imágenes; las restantes coincidencias corresponden a la imagen Docker de la arquitectura.
  - `nexusmarket-domain-model.md` líneas 327–328 (`CAT-02`/`CAT-03`): la publicación exige variante vendible, vendedor activo, datos obligatorios y precio válido; no exige imágenes.
  - `nexusmarket-domain-model.md` líneas 995–998: precondiciones de publicación sin imágenes.
- **Impacto:** modelo de producto, política `DS-02`, almacenamiento de archivos, validación de uploads, API y pruebas. Añadir imágenes sin decisión introduce un requisito no documentado y una dependencia de almacenamiento no elegida.
- **Opciones:** (a) no incluir imágenes en V1; (b) incluirlas como dato opcional; (c) incluirlas como requisito obligatorio con almacenamiento local/S3 u otro.
- **Recomendación:** no implementarlas hasta que negocio confirme requisito y política de almacenamiento. Si se confirman, decidir antes el almacenamiento y los límites de upload.
- **Responsable:** negocio + arquitectura.
- **Tareas bloqueadas:** `W1-01` (decisión). No hay tareas de imágenes en el backlog actual; si se aprueban, requieren una decisión de almacenamiento previa y bloquean `W3-02` y las tareas de catálogo que se creen.
- **Resolución W1-01:** `RESOLVED` por `DEC-W1-003 = A`. Imágenes fuera del alcance de V1 y del primer vertical; no se añaden campos, upload, almacenamiento ni `FileStorage`, y `ADR-011` no se crea. Se corrigió el prompt §6. Si el negocio las incorpora después, requiere nueva decisión de alcance y un ADR de almacenamiento. Detalle en [`../w1/03-decisions.md`](../w1/03-decisions.md) §1.3 y [`../w1/01-resolution-matrix.md`](../w1/01-resolution-matrix.md) §3.3.

### CON-004 — Pago simulado en V1

- **Tipo:** `UNDOCUMENTED_REQUIREMENT`
- **Estado:** `RESOLVED` (`DEC-W1-004`, 2026-10-28)
- **Pregunta concreta:** ¿V1 debe usar un proveedor de pago simulado y qué semántica tiene (éxito, rechazo, timeout, conciliación)?
- **Evidencia:**
  - `prompt-orquestador-backend.md` línea 262: “En V1, el pago es simulado y se implementa detrás de un puerto.”
  - Búsqueda literal de `simulad`, `sandbox`: sin coincidencias en `BackendSDD/`.
  - `nexusmarket-domain-model.md` líneas 603–628 (`§11.1`, `PAY-01`…`PAY-06`): el pago se confirma con proveedor o conciliación autorizada; un rechazo no se convierte en éxito; los timeouts no equivalen a rechazo.
  - `DOCUMENTATION_STATUS.md` línea 189 (`L-22`): protocolo del proveedor no definido.
- **Impacto:** el adaptador `ADOUT-07`, `UC-01`, estados de pago, pruebas de rechazo/timeout y el alcance de V1. Un “pago simulado” puede ser un doble de pruebas, pero no debe presentarse como regla de negocio aprobada ni saltarse `PAY-01`.
- **Opciones:** (a) implementar solo un `PaymentGateway` fake para pruebas, sin flujo de producción; (b) implementar un proveedor sandbox aprobado; (c) posponer pagos y cerrar el primer vertical antes.
- **Recomendación:** tratar el pago simulado como **decisión de alcance** pendiente; si se adopta, definir estados, idempotencia y verificación de callbacks y registrar un ADR. No declarar `CAPTURADO` sin una confirmación verificable.
- **Responsable:** negocio + arquitectura/seguridad.
- **Tareas bloqueadas:** `W1-01` (decisión). No hay tareas de pago en el backlog actual; ninguna tarea de autorización contractual depende de esta decisión. Si el primer vertical incluye checkout, las tareas de pago que se creen en `W5` quedarán bloqueadas hasta resolver esta decisión.
- **Resolución W1-01:** `RESOLVED` por `DEC-W1-004 = A`. Sin pagos en `PI-01`; los dobles de pago se usan exclusivamente en pruebas; no se implementa adaptador de pago ni simulador de producción en el primer vertical. `PO-16` sigue abstracto y `L-22`/`CT-04` siguen abiertos para una ola posterior. Se corrigió el prompt §6. Detalle en [`../w1/03-decisions.md`](../w1/03-decisions.md) §1.4 y [`../w1/01-resolution-matrix.md`](../w1/01-resolution-matrix.md) §3.4.

---

## 3. Brechas documentales

### GAP-001 — Fuentes nombradas en el prompt ausentes

- **Tipo:** `NON_BLOCKING` (proceso) / `CONFLICT` documental
- **Estado:** `PARTIALLY_RESOLVED`
- **Descripción:** el prompt ordena leer `00-LEEME-INDICE.md`, `01-negocio/01-alcance-y-decisiones.md`, `nexusmarket-domain-sdd.md`, `nexusmarket-arquitectura-go.md` y `nexusmarket-prompt-maestro-agentes-concurrentes.md`. Ninguno existe en el árbol ni en el historial.
- **Evidencia:** `git ls-files`; `git log --all --name-only`; inventario `01-inventory.md` §3.2.
- **Impacto:** no puede verificarse la fuente Go original ni el prompt de agentes concurrentes. Los equivalentes actuales cubren negocio, dominio, arquitectura y gobierno documental, pero no son idénticos.
- **Recomendación:** aceptar formalmente los equivalentes de `01-inventory.md` §3.2 y registrar que el prompt se aplicó sobre la documentación vigente `BackendSDD/`. No crear archivos vacíos con esos nombres.
- **Responsable:** usuario/coordinador.
- **Tareas bloqueadas:** ninguna si se acepta la equivalencia; de lo contrario, W1 no puede citar las fuentes exigidas.
- **Resolución W1-01:** `PARTIALLY_RESOLVED`. Se evaluaron las equivalencias: `README.md` es índice suficiente; modelo + VOs + servicios cubren el SDD de dominio; la arquitectura TypeScript sustituye la referencia Go; `enunciado.md` + `DOCUMENTATION_STATUS` §9 cubren el alcance/decisiones y Q1–Q4 ya están aprobadas; el prompt de agentes concurrentes no tiene equivalente. No se crean archivos vacíos. El residuo de agentes concurrentes no bloquea la implementación. Detalle en [`../w1/01-resolution-matrix.md`](../w1/01-resolution-matrix.md) §3.5.

### GAP-002 — No existen contratos ejecutables ni ADR

- **Tipo:** `NON_BLOCKING` para W1 / `BLOCKER` para W2–W5
- **Estado:** `RESOLVED_AS_PLAN`
- **Descripción:** `CT-01`…`CT-12` son conceptuales; `CT-01` es `SIN_EVIDENCIA`; no hay OpenAPI, migraciones ni ADR. Es el estado declarado por el propio repositorio, no un defecto oculto.
- **Impacto:** W3 y W4 no pueden comenzar sin decisiones y artefactos.
- **Recomendación:** producir ADR `PROPOSED` en W2 y OpenAPI en W3; no crear endpoints antes.
- **Tareas bloqueadas:** `W2-01`…`W2-10`, `W3-01`…`W3-06`, `W4-01`…`W4-10`, `W5-01`…`W5-08` hasta que existan los artefactos correspondientes.
- **Resolución W1-01:** `RESOLVED_AS_PLAN`. Se registraron los ADR (`ADR-001`…`ADR-012`), contratos (`CT-01`…`CT-13`, `API-001`…`API-004`) y artefactos de datos/operación con responsable, dependencias, fase y gate en [`../w1/02-artifact-register.md`](../w1/02-artifact-register.md). **Ningún artefacto existe todavía**; el plan no sustituye su producción ni la validación de cada gate.

---

## 4. Decisiones necesarias para la primera implementación

### U-001 — Selección del primer caso de uso vertical

- **Pregunta:** ¿Cuál es el primer flujo vertical que se implementará y probará?
- **Candidatos evaluados:**
  - `PI-01 RegisterBuyer`: alta de comprador + perfil + carrito + hash + auditoría. Buen aislamiento; sin HTTP autenticado; `L-16` y `L-12`/`L-20` ya cerradas por `DEC-W1-007`/`DEC-W1-008`.
  - `PI-02 RegisterSeller`: incorporación administrativa + primera bodega atómica (`DM-05`). Mayor valor de dominio y autorización; sigue limitado por `L-01` (dirección) y `L-09`.
  - `PI-05`/`PI-06` catálogo: `CON-001`/`CON-003` resueltos; aún sujeto a `W1-05` y a los gates de catálogo.
  - `UC-01 Checkout`: alto valor pero bloqueado por `DEC-BIZ-01`, `DEC-BIZ-04`, `DEC-BIZ-05`, `DEC-BIZ-07`, `L-07`, `L-22`, además de concurrencia de inventario.
  - `UC-02 QueryOrder`: requiere pedidos existentes; bloqueado por `L-19`/`L-26`.
- **Recomendación:** `PI-01 RegisterBuyer` como primer vertical, seguido de `PI-02 RegisterSeller`. Es el flujo con menos dependencias externas y permite probar transacción, unicidad, hash, auditoría y errores sin inventar políticas comerciales. `L-16` y `L-12`/`L-20` ya están cerradas.
- **Resolución (2026-10-28):** `DEC-IMPL-001` adopta `PI-01 RegisterBuyer` como primer vertical. El alcance y las exclusiones están en [`../implementation/01-acceptance-and-unblock.md`](../implementation/01-acceptance-and-unblock.md) §4. `L-01`/`U-004` queda fuera de alcance.
- **Responsable:** responsable técnico + negocio para `L-16`.
- **Tareas bloqueadas:** ninguna para `PI-01`; `W1-04` sigue pendiente para `PI-02`.

### U-002 — Estados iniciales (`L-16`) — `RESOLVED`

- **Pregunta:** ¿`Usuario` nace `ACTIVO` o requiere activación? ¿`PerfilVendedor` nace `EN_REVISION` o `ACTIVO`?
- **Decisión:** `DEC-W1-007` (W1-02): `Usuario ACTIVO`, `PerfilComprador HABILITADO`, `PerfilVendedor ACTIVO` y primera `BodegaVendedor ACTIVA`. La incorporación administrativa es el acto de aprobación; no hay verificación de correo ni revisión separada en V1.
- **Evidencia:** `DOCUMENTATION_STATUS.md` `L-16`; `nexusmarket-input-ports.md` `PI-01`/`PI-02`; modelo §6/§8.
- **Impacto:** `PI-01`, `PI-02`, `PI-04`; las transiciones restantes siguen en `L-09`.

### U-003 — Política de credenciales (`L-12`, `L-20`) — `RESOLVED`

- **Pregunta:** algoritmo de hash, parámetros y política de fortaleza.
- **Decisión:** `DEC-W1-008` (W1-03): Argon2id v=19, `m=19456` KiB, `t=2`, `p=1`, sal de 16 bytes, salida de 32 bytes y formato PHC; contraseña de 12–128 caracteres sin composición obligatoria; verificación de tiempo constante. La biblioteca concreta se elige en W4.
- **Evidencia:** `DOCUMENTATION_STATUS.md` `L-12`/`L-20`; `VO` §6.4; `PO-22`; `CT-08`.
- **Impacto:** `PI-01`, `PI-02`, `PO-22`, `ADOUT-13`; no se almacena texto plano ni se usa pepper en V1.

### U-004 — Composición de dirección (`L-01`)

- **Pregunta:** campos exactos de `Direccion`/`DireccionFisica`.
- **Evidencia:** `DOCUMENTATION_STATUS.md` línea 168; `nexusmarket-input-ports.md` línea 1651.
- **Impacto:** `PI-02` (bodega), `PI-03`, `PI-08`, `PI-12`; contrato de entrada.
- **Recomendación:** definir un conjunto mínimo de campos y validaciones; puede ser una decisión técnica documentada si negocio no impone formato.

### U-005 — Stack técnico no fijado

- **Pregunta:** framework HTTP (Fastify/Express), ORM/query builder/migraciones, test runner (Vitest/Jest), autenticación.
- **Evidencia:** `README.md` líneas 164–172; `nexusmarket-arquitectura.md` líneas 43–60 y 868–889; `nexusmarket-adapter-http-input.md` líneas 103–109.
- **Impacto:** W2/W4; ninguna elección está aprobada por el profesor.
- **Resolución reversible (2026-10-28):** `DEC-IMPL-002`/`DEC-IMPL-006`: Fastify 5, Zod 4, Vitest 5, TypeScript 5.9, `pg` con SQL directo (sin ORM en `PI-01`), autenticación no implementada en `PI-01`. Detalle, alternativas y reversión en [`../implementation/01-acceptance-and-unblock.md`](../implementation/01-acceptance-and-unblock.md) §3.
- **Estado:** `RESOLVED_REVERSIBLE`; no sustituye `ADR-001`/`ADR-002`/`ADR-004`, que siguen pendientes como documentación formal.

### U-006 — Matriz física de propiedad de datos

- **Pregunta:** tablas, claves, índices, constraints y colecciones; PostgreSQL vs. MongoDB por agregado.
- **Evidencia:** `nexusmarket-domain-model.md` líneas 1052–1058; `DOCUMENTATION_STATUS.md` §7; `nexusmarket-contract-alignment.md` `CT-12`.
- **Impacto:** W2/W4, migraciones y pruebas de concurrencia.
- **Resolución reversible (2026-10-28):** `DEC-IMPL-003`: PostgreSQL es la fuente autoritativa de `Usuario`, `PerfilComprador`, `Carrito`, auditoría y outbox; el adaptador en memoria es solo desarrollo/pruebas; Mongo no se usa en `PI-01`. La migración inicial y los constraints están en `backend/migrations/001_initial.sql` y se aplicaron correctamente en PostgreSQL 17.11 durante la verificación.
- **Estado:** `RESOLVED_REVERSIBLE` para `PI-01`; la matriz completa por agregado sigue pendiente para el resto del sistema.

### U-007 — Layout de `backend/`

- **Restricción declarada por el usuario:** el código de producción debe residir en `backend/src/`.
- **Origen de la restricción:** instrucción del usuario en la tarea de W0; **no consta en `prompt-orquestador-backend.md`**, que presenta `src/` como “estructura de referencia, no obligatoria” (líneas 130–133). No es verificable desde el repositorio; se registra como requisito externo.
- **Hecho:** el backend ya existe con el layout mínimo aplicado.
- **Resolución (2026-10-28):** `DEC-IMPL-004` fija `backend/src/modules/{identity,buyers,cart}`, `backend/src/shared`, `backend/tests/{unit,integration}`, `backend/migrations` y `backend/openapi.yaml`. Detalle en [`backend/README.md`](../../../backend/README.md).
- **Estado:** `RESOLVED`; el ADR de layout sigue pendiente como formalización.

### U-008 — Versión LTS de Node

- **Hecho:** entorno local `v24.21.0`; la arquitectura ilustra `node:22-bookworm-slim` y exige fijar una LTS.
- **Resolución (2026-10-28):** `DEC-IMPL-005` fija Node.js 24 LTS con `engines >=24 <25`. Verificado con `node v24.21.0`; `npm run typecheck`, `npm test` y `npm run build` ejecutados.
- **Estado:** `RESOLVED`; el ADR de runtime/despliegue sigue pendiente.

---

## 5. Riesgos

| ID | Riesgo | Probabilidad | Impacto | Mitigación | Estado |
|---|---|---|---|---|---|
| `RISK-001` | Docker daemon inactivo | Alta | W4/W6 no verificables | Iniciar Docker Desktop; repetir `docker info` | `RESOLVED` en este entorno (Docker 29.8.0 y PostgreSQL 17.11 verificados); sigue siendo riesgo operativo en otras máquinas |
| `RISK-002` | Sin clientes locales de bases | Alta | Integración depende de contenedores | Compose con PostgreSQL/MongoDB; no mockear integración | `PARTIALLY_RESOLVED`: `psql` del contenedor disponible; cliente del host ausente |
| `RISK-003` | `L-27`: sin OpenAPI/auth/versionado | Alta | W3/W5 bloqueados | Decidir contrato y auth antes de endpoints | `PARTIAL`: contrato de tres rutas de `PI-01` con contract test; auth, versionado general y rutas futuras pendientes |
| `RISK-004` | `DEC-BIZ-01`…`07` abiertas; `DEC-BIZ-02` resuelta por `DEC-W1-002` | Alta | Checkout, facturación, devoluciones | Cerrar por negocio; no inventar | `OPEN` |
| `RISK-005` | Documentación amplia sin código | Media | Expectativa de avance superior al real | Mantener estado honesto; vertical pequeño | `MITIGATED` para `PI-01`; resto documental |
| `RISK-006` | Deriva entre modelo v2.0 y prompt | Media | Retrabajo residual | `CON-001` resuelto por `DEC-W1-001`; vigilar nuevas reglas del prompt | `MITIGATED` |

---

## 6. Lo que no se decidió en W0

No se aprobaron frameworks, ORM, algoritmos, rutas, códigos HTTP, esquemas, políticas comerciales, versiones de API ni estructuras de código. Tampoco se modificaron los documentos fuente. Las propuestas de este registro llevan `PROPOSED` y requieren aprobación en W1/W2.

---

## 7. Correcciones aplicadas en W0.1

Revisión independiente del 2026-10-28: `FAIL` (1 defecto bloqueante, 4 mayores, 5 menores). Correcciones en este documento:

| Defecto | Corrección |
|---|---|
| `CON-001`…`CON-004` apuntaban a tareas inexistentes o de otro alcance | Remapeados a `W1-01` (decisión) y a las tareas reales que dependen del alcance; se declara que catálogo, devoluciones, imágenes y pagos aún no tienen tareas propias en el backlog |
| `CON-003`/`CON-004` clasificados como `CONFLICT` | Reclasificados como `UNDOCUMENTED_REQUIREMENT`: el prompt exige algo que las fuentes no documentan, pero no existe una regla contraria |
| Afirmación falsa “las únicas coincidencias son imagen Docker” | Corregida: los puertos declaran que no definen/generan imágenes (`input-ports` 440, `output-ports` 376) |
| `U-003` citaba `input-ports:275`, que trata `L-16`/`L-01` | Citas corregidas a `DOCUMENTATION_STATUS` 179/187 e `input-ports` 220/229/1675 |
| `U-007` presentaba `backend/src/` como restricción del repositorio | Se declara su origen externo (instrucción del usuario) y que el prompt solo muestra `src/` como referencia no obligatoria |
| `GAP-002` y `RISK-006` omitidos del resumen | Añadidos al resumen y con tareas afectadas |

**Estado:** correcciones aplicadas y re-revisión `PASS` (2026-10-28). Ningún conflicto se ha cerrado por conveniencia.

---

## 8. Resoluciones W1 (2026-10-28)

Esta sección conserva los identificadores y la evidencia original. Registra el estado tras las decisiones Q1–Q4 y las tareas `W1-02`/`W1-03`.

| ID | Estado anterior | Estado actual | Resolución | Evidencia |
|---|---|---|---|---|
| `CON-001` | `PARTIALLY_RESOLVED` | `RESOLVED` | `DEC-W1-001 = A`: `Producto`+`Variante`; variante = SKU, precio e inventario | [`../w1/03-decisions.md`](../w1/03-decisions.md) §1.1 |
| `CON-002` | `PARTIALLY_RESOLVED` | `RESOLVED` | `DEC-W1-002 = B`: configurable, 30 días iniciales, política única de plataforma | [`../w1/03-decisions.md`](../w1/03-decisions.md) §1.2 |
| `CON-003` | `PENDING_DECISION` | `RESOLVED` | `DEC-W1-003 = A`: imágenes fuera de V1 y del primer vertical | [`../w1/03-decisions.md`](../w1/03-decisions.md) §1.3 |
| `CON-004` | `PENDING_DECISION` | `RESOLVED` | `DEC-W1-004 = A`: sin pagos en `PI-01`; dobles solo en pruebas | [`../w1/03-decisions.md`](../w1/03-decisions.md) §1.4 |
| `U-002` | `WAITING_FOR_DECISION` | `RESOLVED` | `DEC-W1-007`: estados iniciales (`ACTIVO`/`HABILITADO`/`ACTIVO`/`ACTIVA`) | [`../w1/03-decisions.md`](../w1/03-decisions.md) §2 |
| `U-003` | `WAITING_FOR_DECISION` | `RESOLVED` | `DEC-W1-008`: Argon2id v=19; 12–128 caracteres; PHC | [`../w1/03-decisions.md`](../w1/03-decisions.md) §3 |
| `GAP-001` | `PARTIALLY_RESOLVED` | `PARTIALLY_RESOLVED` | 3 cubiertas, 1 parcial, 1 sin equivalente; no se crean archivos vacíos | [`../w1/01-resolution-matrix.md`](../w1/01-resolution-matrix.md) §3.5 |
| `GAP-002` | `RESOLVED_AS_PLAN` | `PARTIAL` | ADR/contratos registrados; OpenAPI mínimo, migración y código de `PI-01` existen; ADR formales y validación de contrato siguen pendientes | [`../w1/02-artifact-register.md`](../w1/02-artifact-register.md) |

**Regla de cierre:** `CON-001`…`CON-004` se cerraron por decisión del propietario. `U-002`/`U-003` se cerraron **solo** por `W1-02`/`W1-03`, no por las decisiones de negocio. `U-001` se cerró por `DEC-IMPL-001`; `U-005`…`U-008` se cerraron como decisiones técnicas reversibles (`DEC-IMPL-002`…`005`) y quedan sujetas a ADR formales. `U-004` sigue abierto y fuera de `PI-01`.

**Efecto en el gate:** `W1-01 = DONE`; `GATE-W1-01 = PASS`; `W1-02`/`W1-03 = DONE_DOCUMENTAL`; `GATE-W1 = NOT_RUN` porque `W1-04`/`W1-05` no se iniciaron. No se implementó código. `W1-02`/`W1-03` no tienen prueba funcional porque no existe `backend/`.
