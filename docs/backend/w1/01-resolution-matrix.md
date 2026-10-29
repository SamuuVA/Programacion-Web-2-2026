# W1-01 — Matriz de resolución de conflictos y brechas

**Proyecto:** NexusMarket
**Ola:** W1 — Dominio y decisiones ejecutables
**Tarea:** `W1-01` — triage de `CON-001`…`CON-004`, `GAP-001` y `GAP-002`
**Fecha:** 2026-10-28
**Commit de referencia:** `badf0b1993c927d6713d85cd7b44eee8b4259a46`
**Estado de la tarea:** `DONE` — Q1–Q4 decididas por el propietario; `W1-02`/`W1-03` ejecutadas como decisiones documentales
**Estado del gate:** `GATE-W1-01 = PASS`; `GATE-W1 = NOT_RUN` (gate documental amplio; ver actualización de implementación abajo)
**Actualización 2026-10-28 (posterior a W1-01):** se autorizó el primer vertical; `DEC-IMPL-001` selecciona `PI-01`, `DEC-IMPL-002`…`005` resuelven reversiblemente `U-005`…`U-008`, y `W1-05`/`W1-06` tienen implementación. Las filas de esta matriz describen el estado al cierre de `W1-01`; el estado vigente está en [`../implementation/01-acceptance-and-unblock.md`](../implementation/01-acceptance-and-unblock.md) y en `orchestrator-state.md`.

**Regla aplicada:** una fuente de menor precedencia no sobrescribe una superior. Una recomendación no se presenta como decisión aprobada. Una ausencia de información no se convierte en regla por conveniencia técnica.

---

## 1. Resultado ejecutivo

| ID | Título | Evidencia principal | Clasificación | Estado W1-01 | Decisión |
|---|---|---|---|---|---|
| `CON-001` | Variantes comerciales en V1 | Modelo v2.0 §7/§25; prompt §6.1 | Contradicción entre requisito de dominio y regla operativa | `RESOLVED` | `DEC-W1-001`: A — se mantienen `Producto` + `Variante`. |
| `CON-002` | Plazo de devolución de 30 días | Modelo §14.1/DD-12; `DS-07`; prompt §6.11 | Valor no fijado por las fuentes | `RESOLVED` | `DEC-W1-002`: B — configurable, 30 días iniciales, política única de plataforma. |
| `CON-003` | Imágenes obligatorias para publicar | Prompt §6.3/§6.5; modelo `CAT-02`/`CAT-03`; `PI-05`/`PO-05` | Requisito no documentado | `RESOLVED` | `DEC-W1-003`: A — fuera de V1 y del primer vertical. |
| `CON-004` | Pago simulado en V1 | Prompt §6.8; modelo `PAY-01`…`PAY-07`; `PO-16`; `L-22` | Requisito no documentado | `RESOLVED` | `DEC-W1-004`: A — sin pagos en `PI-01`; dobles solo en pruebas. |
| `GAP-001` | Fuentes nombradas ausentes | Prompt §2; inventario §3.2; árbol real | 3 cubiertas, 1 parcial, 1 sin equivalente | `PARTIALLY_RESOLVED` | No requiere decisión de negocio; se mantiene el límite de proceso. |
| `GAP-002` | Contratos ejecutables y ADR inexistentes | `CT-01`…`CT-13`; `D-28`/`D-30` | Ausencia planificada | `RESOLVED_AS_PLAN` | `DEC-W1-006`; artefactos asignados a W2–W5. |

**Conclusión:** `W1-01` queda cerrada. Las cuatro decisiones de negocio están registradas en [`03-decisions.md`](03-decisions.md). `GAP-001` sigue parcial por el protocolo de agentes concurrentes, sin bloquear la implementación; `GAP-002` queda planificado y no se declara que los artefactos existan. No se creó código, esquema, OpenAPI, migración ni ADR.

---

## 2. Método y clasificación

### 2.1 Fuentes contrastadas

| Fuente | Uso |
|---|---|
| `prompt-orquestador-backend.md` §2 y §6 | Fuentes exigidas y reglas operativas declaradas |
| `BackendSDD/enunciado.md` | Requisitos funcionales explícitos |
| `BackendSDD/Domain/nexusmarket-domain-model.md` | Línea base del dominio v2.0, invariantes, `DD-01`…`DD-14` |
| `BackendSDD/Domain/services/politica-elegibilidad-devolucion.md` | `DS-07`, `RET-01`…`RET-12` |
| `BackendSDD/Domain/services/politica-publicacion-catalogo.md` | Condiciones de publicación |
| `BackendSDD/Application/nexusmarket-input-ports.md` | `PI-01`, `PI-02`, `PI-05`, `PI-06`, `PI-21`, `PI-22` |
| `BackendSDD/Application/nexusmarket-output-ports.md` | `PO-05`, `PO-16`, `PO-22`, límites de imágenes |
| `BackendSDD/Application/nexusmarket-use-cases-checkout-query-order.md` | Snapshots con `varianteId` |
| `BackendSDD/Contracts/nexusmarket-contract-alignment.md` | `CT-01`…`CT-13` |
| `BackendSDD/DOCUMENTATION_STATUS.md` | Jerarquía, `D-01`…`D-30`, `L-01`…`L-27`, `DEC-BIZ-01`…`07` |
| `BackendSDD/Software Architecture/nexusmarket-arquitectura.md` | Arquitectura y §18 histórico |
| `docs/backend/w0/*` | Inventario, baseline, discrepancias y backlog |

### 2.2 Etiquetas usadas

| Etiqueta | Significado |
|---|---|
| `REQ_APROBADO` | Regla explícita en una fuente de autoridad reconocida |
| `DECISION_OWNER` | Decisión del propietario del proyecto |
| `DECISION_W1` | Decisión documental adoptada en `W1-02`/`W1-03`, trazada y reversible |
| `AUSENCIA` | No existe fuente suficiente; no se inventa la regla |
| `CONFLICTO` | Dos fuentes de autoridad comparable se contradicen |
| `LIMITE` | Brecha aceptada y registrada, sin regla inventada |

### 2.3 Jerarquía aplicada

1. Requisitos explícitos de negocio (`enunciado.md`).
2. Modelo de dominio v2.0 y `DD-01`…`DD-14`.
3. Decisiones documentales `D-01`…`D-30` y limitaciones `L-01`…`L-27`.
4. Puertos, casos de uso y contratos conceptuales.
5. Arquitectura (documento v1.0, propuesta).
6. Prompt operativo: exige contraste y no permite resolver unilateralmente.

La lista de la arquitectura §18 se trata como histórica en los puntos que el modelo 2.0 ya resolvió, conforme a `C-08`. Eso no convierte a la arquitectura en fuente de una decisión de alcance V1.

---

## 3. Resoluciones por identificador

### 3.1 `CON-001` — Variantes comerciales en V1

**Pregunta original:** ¿En V1 cada combinación vendible es un `Producto` independiente, o se mantiene `Producto` + `Variante` como unidad de SKU, precio e inventario?

#### Evidencia

| Fuente | Ubicación | Contenido | Clasificación |
|---|---|---|---|
| Prompt operativo | §6, línea 255 (histórica) | “En V1 no existen variantes comerciales…” | `CONFLICTO` / regla sin decisión de negocio |
| Especificación funcional | `enunciado.md` 147–149 | El catálogo incluye variantes (color, talla, modelo). | `REQ_APROBADO` |
| Modelo de dominio | 117–118 | `Producto` agrupa una o más `Variante`; la variante es la unidad vendible. | `REQ_APROBADO` |
| Modelo de dominio | 306–371 | `Producto`/`Variante`; SKU global, precio en la variante, atributos y estado. | `REQ_APROBADO` |
| Modelo de dominio | 327–328 (`CAT-02`/`CAT-03`) | Publicar exige al menos una variante, vendedor activo, datos y precio válidos. | `REQ_APROBADO` |
| Modelo de dominio | 1073–1074 (`DM-06`/`DM-07`) | Publicar sin variantes y SKU duplicado se rechazan. | `REQ_APROBADO` |
| Modelo de dominio | 1130 (`DD-04`) | Inventario por variante y bodega. | `REQ_APROBADO` |
| Puertos de entrada | `PI-05` 393–446 | Crear producto y variantes; `varianteIds`; SKU únicos. | `REQ_APROBADO` |
| Casos de uso | 275, 603 | Checkout y snapshots usan `varianteId`. | `REQ_APROBADO` |
| Arquitectura | §18, línea 881 | “Definir variantes…” figuraba como pendiente. | `LIMITE` histórico superado por `C-08` y el modelo 2.0 |

#### Decisión

**`DEC-W1-001` = A.** Se mantiene `Producto` + `Variante` en V1. La variante es la unidad de SKU, precio e inventario.

#### Justificación

El modelo 2.0 es la línea base declarada y define `Producto` + `Variante` con pruebas normativas. La regla del prompt no estaba respaldada por una decisión de negocio posterior ni por un documento de alcance V1; aplicarla exigía derogar `DD-04`, `CAT-02`/`CAT-03`, `DM-06`/`DM-07`, `PI-05`/`PI-06`, `PO-05`, los casos de uso, el esquema SQL y las pruebas. La alternativa A conserva la cadena aprobada y evita una reescritura de alto riesgo.

#### Alcance y consecuencias

- **Dominio:** `Producto`, `Variante`, `CAT-02`/`CAT-03`, `DM-06`/`DM-07`, `DD-04`; inventario por `(varianteId, bodegaId)`.
- **Contratos:** `PI-05`, `PI-06`, `PI-07`, `PO-05`, `CT-01`, `CT-02`, `CT-12`.
- **Persistencia:** tablas de producto/variante, SKU único global, precio en variante, inventario por variante/bodega.
- **Pruebas futuras:** `DM-06`, `DM-07`, publicación con variantes, snapshots con `varianteId`, concurrencia de inventario.
- **Límite:** no se implementa catálogo en W1; `W1-05` y sus gates siguen pendientes.

#### Trazabilidad

`enunciado.md` 147–149; modelo 117–118, 306–371, 327–328, 1073–1074, 1130; `PI-05`; casos de uso 275/603; `DEC-W1-001` en [`03-decisions.md`](03-decisions.md).

---

### 3.2 `CON-002` — Plazo de devolución

**Pregunta original:** ¿El plazo es exactamente 30 días desde la entrega o una política configurable sin cifra fijada?

#### Evidencia

| Fuente | Ubicación | Contenido | Clasificación |
|---|---|---|---|
| Prompt operativo | §6, línea 265 (histórica) | “30 días… según la regla de dominio disponible.” | `CONFLICTO` / cifra no respaldada |
| Modelo de dominio | 698, 712 | Devolución sobre entrega confirmada; período configurable, sin cifra. | `REQ_APROBADO` |
| Modelo de dominio | 1138 (`DD-12`) | Plazo configurable; no inventar cifra. | `REQ_APROBADO` |
| Modelo de dominio | 1146 (§28) | Política variable que debe suministrarse. | `REQ_APROBADO` |
| `DS-07` | 30, 49, 86, 100, 103, 126 | `RET-03`/`RET-06`: ventana configurable; valor no definido. | `REQ_APROBADO` + `AUSENCIA` del valor |
| Estado documental | `L-06`, `DEC-BIZ-02` | El plazo no estaba especificado. | `AUSENCIA` |
| `PI-21` | §4–§6 | Verifica propiedad, entrega, plazo, cantidades y motivo; no fija el valor. | `REQ_APROBADO` |

#### Decisión

**`DEC-W1-002` = B.** Política configurable, con **30 días** como valor inicial expresamente aprobado. Una sola política para la plataforma en V1; no se segmenta por categoría ni jurisdicción.

#### Justificación

`DD-12`, `L-06` y `DEC-BIZ-02` exigían una política configurable y prohibían inventar la cifra. El propietario aprobó 30 días como valor inicial. La configuración evita hardcodear y permite cambiar la política sin desplegar, conservando el valor aplicado a cada solicitud.

#### Alcance y consecuencias

- **Dominio:** `DS-07`, `RET-03`, `RET-06`, `Devolucion.solicitadaEn`, fecha de entrega.
- **Contratos:** `PI-21`, `PI-22`, `PO-12`, `CT-01`, `CT-12`.
- **Datos:** configuración versionada (valor vigente, vigencia, ámbito único) y snapshot del valor aplicado.
- **Pruebas futuras:** dentro/fuera de ventana; entrega no confirmada; entrega digital; cambio de política; límite del día; UTC; motivo inválido; cantidades excedidas.
- **Límite:** no cierra `L-10` (catálogo de motivos) ni implementa devoluciones; no bloquea `PI-01`.

#### Trazabilidad

Modelo 698, 712, 1138, 1146; `DS-07` 30, 49, 86, 100, 103, 126; `L-06`; `DEC-BIZ-02`; `DEC-W1-002` en [`03-decisions.md`](03-decisions.md).

---

### 3.3 `CON-003` — Imágenes obligatorias para publicar

**Pregunta original:** ¿Las imágenes son obligatorias para publicar un producto y dónde se almacenan?

#### Evidencia

| Fuente | Ubicación | Contenido | Clasificación |
|---|---|---|---|
| Prompt operativo | §6, líneas 257/259 (históricas) | Imágenes asociadas y requisito de publicación. | `AUSENCIA` de respaldo |
| Especificación funcional | 145–149 | Atributos del catálogo: tipo, variantes, estado; sin imágenes. | `AUSENCIA` |
| Modelo de dominio | 327–328 (`CAT-02`/`CAT-03`) | Publicación exige variante, vendedor, datos y precio; sin imágenes. | `REQ_APROBADO` |
| Modelo de dominio | 995–998 | Precondiciones de publicación sin imágenes. | `REQ_APROBADO` |
| `PI-05` | 440 | “No define imágenes o medios no modelados.” | `REQ_APROBADO` (límite) |
| `PO-05` | 376 | “No genera imágenes.” | `REQ_APROBADO` (límite) |
| Output Ports | §6.3 | `FileStorage` rechazado por falta de requisito. | `AUSENCIA` |
| Búsqueda en `BackendSDD/` | `imagen`/`foto` | Solo “imagen Docker”; ninguna regla de producto. | `AUSENCIA` |

#### Decisión

**`DEC-W1-003` = A.** Imágenes fuera del alcance de V1 y del primer vertical. No se añaden campos, upload, almacenamiento ni `FileStorage`; `ADR-011` no se crea.

#### Justificación

No existe requisito aprobado de imágenes. La publicación documentada se basa en SKU, variante, vendedor, datos y precio. Añadirlas obligaba a decidir almacenamiento, validación, límites, seguridad, backup y contrato; `FileStorage` había sido explícitamente rechazado por falta de requisito.

#### Alcance y consecuencias

- **Dominio:** no cambia `Producto` ni las condiciones de publicación.
- **Contratos:** no se añaden campos ni puertos; `PI-05`/`PO-05` siguen sin imágenes.
- **Infraestructura:** sin S3, cuotas, MIME, antivirus, URLs firmadas ni backup de imágenes.
- **Pruebas futuras:** no aplican a V1; si se incorporan después, requieren nueva decisión de alcance y un ADR de almacenamiento.
- **Límite:** el catálogo puede ser menos atractivo visualmente; es un trade-off aceptado.

#### Trazabilidad

Modelo 327–328, 995–998; `PI-05` 440; `PO-05` 376; Output Ports §6.3; `DEC-W1-003` en [`03-decisions.md`](03-decisions.md).

---

### 3.4 `CON-004` — Pago simulado en V1

**Pregunta original:** ¿V1 debe usar un proveedor de pago simulado y qué semántica tiene (éxito, rechazo, timeout, conciliación)?

#### Evidencia

| Fuente | Ubicación | Contenido | Clasificación |
|---|---|---|---|
| Prompt operativo | §6, líneas 262–264 (históricas) | “Pago simulado en V1”; rechazo ≠ timeout. | `AUSENCIA` de respaldo / alcance no ratificado |
| Modelo de dominio | 605, 620 | `Pago` como intento financiero; estados. | `REQ_APROBADO` |
| Modelo de dominio | 624 (`PAY-01`) | No `CAPTURADO` sin confirmación autenticada o conciliación autorizada. | `REQ_APROBADO` |
| Modelo de dominio | 625–630 (`PAY-02`…`PAY-07`) | Verificación, correlación, idempotencia, rechazo ≠ timeout, no doble captura, no datos de tarjeta. | `REQ_APROBADO` |
| `PO-16` | Contrato completo | `PaymentGateway` abstracto. | `REQ_APROBADO` |
| `D-18` | Estado documental 230 | Interacción abstracta sin captura en checkout ni datos de tarjeta. | `REQ_APROBADO` |
| `L-22` | Estado documental 189 | Protocolo del proveedor no definido. | `AUSENCIA` |
| Búsqueda en `BackendSDD/` | `simulad`, `sandbox`, `fake` | Sin pago simulado documentado. | `AUSENCIA` |

#### Decisión

**`DEC-W1-004` = A.** Sin pagos en `PI-01`; los dobles de pago se usan exclusivamente en pruebas. No se implementa adaptador de pago ni simulador de producción en el primer vertical.

#### Justificación

El modelo exige confirmación verificable (`PAY-01`…`PAY-07`) y `PO-16`/`D-18` mantienen el proveedor abstracto. Un simulador propio en producción no cumple `PAY-01`; el primer vertical es `PI-01`, que no toca pagos. Un doble de pruebas no es un adaptador de producción.

#### Alcance y consecuencias

- **Dominio:** `Pago`, `EstadoPago`, `PAY-01`…`PAY-07` no se implementan en `PI-01`.
- **Contratos:** `PO-16` sigue abstracto; `L-22` y `CT-04` siguen abiertos.
- **Adaptadores:** `ADOUT-07` no se implementa en el primer vertical; no se elige proveedor.
- **Pruebas futuras:** éxito, rechazo, timeout, resultado desconocido, webhook duplicado, reintento idempotente, reembolso, no doble captura (`DM-17`/`DM-18`).
- **Límite:** no demuestra checkout ni conciliación; no bloquea `PI-01`.

#### Trazabilidad

Modelo 605, 620, 624–632; `PO-16`; `D-18`; `L-22`; `DEC-W1-004` en [`03-decisions.md`](03-decisions.md).

---

### 3.5 `GAP-001` — Fuentes nombradas ausentes

**Descripción original:** el prompt ordena leer cinco fuentes que no existen en el árbol ni en el historial.

#### Verificación de equivalencias

| Fuente solicitada | ¿Existe? | Equivalente real | Evaluación | ¿Suficiente? |
|---|---|---|---|---|
| `00-LEEME-INDICE.md` | No | `README.md` | Índice real: tabla de contenidos, estado, alcance, stack, arquitectura, estructura y enlaces a `BackendSDD/`. | `EQUIVALENTE_SUFICIENTE` |
| `01-negocio/01-alcance-y-decisiones.md` | No | `BackendSDD/enunciado.md` + `DOCUMENTATION_STATUS.md` §9 + `README.md` | Cubre requisitos y decisiones abiertas; el alcance V1 se resolvió por Q1–Q4. | `EQUIVALENTE_PARCIAL` |
| `nexusmarket-domain-sdd.md` | No | `nexusmarket-domain-model.md` + `nexusmarket-domain-object-values.md` + `nexusmarket-domain-services.md` | El modelo 2.0 es más específico que un SDD único. | `EQUIVALENTE_SUFICIENTE` |
| `nexusmarket-arquitectura-go.md` | No | `BackendSDD/Software Architecture/nexusmarket-arquitectura.md` | Referencia Go sustituida por la arquitectura TypeScript/Node vigente. | `SUSTITUIDO_POR_ARQUITECTURA_VIGENTE` |
| `nexusmarket-prompt-maestro-agentes-concurrentes.md` | No | `BackendSDD/Prompt-maestro-documentacion.md` | Gobierno documental, no protocolo de agentes concurrentes; `prompt-orquestador-backend.md` cubre orquestación, pero no es la fuente nombrada. | `SIN_EQUIVALENTE` |

#### Evaluación y resolución

- Se corrige la trazabilidad: no se declaran equivalentes “por nombre parecido”. Tres casos son suficientes, uno es parcial y uno no tiene equivalente.
- No se crean archivos vacíos con los nombres faltantes.
- La ausencia del protocolo de agentes concurrentes es una brecha de proceso, no de implementación. Se acepta como límite explícito; no se inventa un protocolo.

`PARTIALLY_RESOLVED` — trazabilidad corregida; el residuo de agentes concurrentes queda aceptado como límite. No bloquea la implementación.

---

### 3.6 `GAP-002` — Contratos ejecutables y ADR inexistentes

**Descripción original:** `CT-01`…`CT-13` son conceptuales; `CT-01` es `SIN_EVIDENCIA`; no hay OpenAPI, migraciones ni ADR.

#### Evidencia

| Fuente | Ubicación | Contenido |
|---|---|---|
| Contract Alignment | 5–8 | Documento conceptual; no contiene OpenAPI, esquemas, SDKs, DTOs ni pruebas |
| Contract Alignment | 83–99 | Inventario `CT-01`…`CT-13`; solo `CT-13` está `ALINEADO`; `CT-01` es `SIN_EVIDENCIA` |
| Contract Alignment | 121 | Ningún flujo se marca `ALINEADO` por contratos/decisión externa pendiente |
| Estado documental | `D-28`, `D-30` | Contract Alignment no crea contratos ejecutables; `CT-01` queda como propuesta/sin evidencia |
| Árbol real | — | No existe `api/openapi.yaml`, migración, ADR ni esquema ejecutable |

#### Evaluación y resolución

`RESOLVED_AS_PLAN` — la brecha queda planificada; **no** se declara que los artefactos existan. W1 solo necesitaba decisiones de dominio y alcance. Los ADR son de W2; OpenAPI y DTOs de W3; migraciones y adaptadores de W4; contratos de pago/proveedor de W5 o posteriores. Cada artefacto, responsable, dependencia y gate está en [`02-artifact-register.md`](02-artifact-register.md).

- `GATE-W2` exige ADR y matriz de datos.
- `GATE-W3` exige OpenAPI, DTOs, errores y auth contractual.
- `GATE-W4` exige migración desde cero y Docker.
- `GATE-W5` exige contrato del primer vertical y pruebas.
- W1 no se bloquea por estos artefactos.

---

## 4. Decisiones registradas

| ID | Decisión | Estado | Autoridad | Evidencia | Artefactos afectados |
|---|---|---|---|---|---|
| `DEC-W1-001` | Mantener `Producto` + `Variante` en V1; variante = SKU, precio e inventario | `APPROVED` | Propietario | `CON-001`; modelo §7/§25; prompt §6.1 | Modelo, `PI-05`/`PI-06`, `PO-05`, SQL, pruebas |
| `DEC-W1-002` | Plazo configurable, 30 días iniciales, política única de plataforma | `APPROVED` | Propietario | `CON-002`; `DD-12`; `L-06`; `DEC-BIZ-02` | `DS-07`, `PI-21`/`PI-22`, `PO-12`, configuración |
| `DEC-W1-003` | Imágenes fuera de V1 y del primer vertical | `APPROVED` | Propietario | `CON-003`; `PI-05`; `PO-05` | Sin `Producto`/almacenamiento; prompt |
| `DEC-W1-004` | Sin pagos en `PI-01`; dobles solo en pruebas | `APPROVED` | Propietario | `CON-004`; `PAY-01`; `PO-16`; `L-22` | `Pago`, `PO-16`, `CT-04`, pruebas |
| `DEC-W1-005` | Aceptar la trazabilidad de `GAP-001` con las equivalencias evaluadas | `RESOLVED_DOCUMENTARY` | Orquestador | `GAP-001`; inventario §3.2 | Trazabilidad |
| `DEC-W1-006` | Registrar el plan de ADR/contratos de `GAP-002` | `RESOLVED_AS_PLAN` | Orquestador | `GAP-002`; `CT-01`…`CT-13` | `02-artifact-register.md` |
| `DEC-W1-007` | Estados iniciales de `Usuario`, `PerfilComprador`, `PerfilVendedor` y primera `Bodega` | `DONE_DOCUMENTAL` | Orquestador (W1-02) | `L-16`; `PI-01`/`PI-02`; modelo §6/§8 | Modelo, `PI-01`/`PI-02`, `PO-01`/`PO-03` |
| `DEC-W1-008` | Argon2id v=19, `m=19456`, `t=2`, `p=1`, PHC; contraseña 12–128 | `DONE_DOCUMENTAL` | Orquestador (W1-03) | `L-12`/`L-20`; `PO-22`; `VO` §6.4 | `PO-22`, `ADOUT-13`, `CT-08`, `VO` |

**Nota histórica (W1-01):** `DEC-W1-005` y `DEC-W1-006` son correcciones de trazabilidad/planificación, no decisiones de negocio. Cuando se cerró W1-01, `DEC-W1-007`/`008` eran decisiones documentales y no existía `backend/`. En el corte posterior del 2026-10-28 sí se ejecutaron pruebas funcionales de ambas en `PI-01` y en la suite PostgreSQL; el estado vigente está en [`../implementation/01-acceptance-and-unblock.md`](../implementation/01-acceptance-and-unblock.md).

---

## 5. Impacto en `U-001`…`U-008` y riesgos

### 5.1 Incertidumbres

| ID | Asunto | Estado | ¿Qué bloquea? | Cuándo resolver |
|---|---|---|---|---|
| `U-001` | Primer caso de uso vertical | `RESOLVED` por `DEC-IMPL-001` (`PI-01`) | — | Implementado en este corte |
| `U-002` | Estados iniciales (`L-16`) | `RESOLVED` por `DEC-W1-007` | — | Cerrado en W1-02 |
| `U-003` | Credenciales (`L-12`/`L-20`) | `RESOLVED` por `DEC-W1-008` | — | Cerrado en W1-03 |
| `U-004` | Dirección (`L-01`) | `OPEN` | `PI-02`, `PI-03`, `PI-08`, `PI-12` | W1-04; no bloquea `PI-01` |
| `U-005` | Framework/ORM/tests/auth | `RESOLVED_REVERSIBLE` por `DEC-IMPL-002`/`006` | ADR-001/002/004 formales | W2 |
| `U-006` | Matriz física de datos | `RESOLVED_REVERSIBLE` por `DEC-IMPL-003` | Matriz completa del resto | W2 |
| `U-007` | Layout `backend/` | `RESOLVED` por `DEC-IMPL-004` | Formalización ADR | W2 |
| `U-008` | Node LTS | `RESOLVED` por `DEC-IMPL-005` (Node 24) | ADR de runtime | W2 |

**Regla:** cerrar `CON-001`…`CON-004` no cerró `U-001`…`U-008` automáticamente. `U-002`/`U-003` se cerraron únicamente por sus tareas específicas `W1-02`/`W1-03`; `U-001` y `U-005`…`U-008` se cerraron reversiblemente en el corte de implementación; `U-004` sigue abierto. `PI-01` requiere `W1-02`/`W1-03`; `W1-04` no es requisito de `PI-01`.

### 5.2 Riesgos

| ID | Riesgo | Efecto W1-01 | Mitigación |
|---|---|---|---|
| `RISK-001` | Docker daemon inactivo | No afecta W1; bloquea W4/W6 | Iniciar Docker; verificar `docker info` | `RESOLVED` en este entorno; permanece como riesgo operativo |
| `RISK-002` | Sin clientes locales de bases | No afecta W1; bloquea W4/W6 | Compose con PostgreSQL/MongoDB | `PARTIALLY_RESOLVED`: `psql` del contenedor; cliente del host ausente |
| `RISK-003` | `L-27`: sin OpenAPI/auth | No afecta W1; bloquea W3/W5 | `PARTIAL`: contrato de tres rutas + contract test; auth sigue abierta |
| `RISK-004` | `DEC-BIZ-01`…`07` abiertas; `DEC-BIZ-02` ya resuelta | Quedan decisiones de negocio fuera de W1 | Cerrar por negocio; no inventar |
| `RISK-005` | Documentación sin código | Mitigado parcialmente: `PI-01` implementado; el resto sigue documental | Mantener estado honesto; vertical pequeño |
| `RISK-006` | Deriva modelo v2.0 vs prompt | Se materializó en `CON-001`; mitigada | `DEC-W1-001` y prompt corregido |

---

## 6. Estado del gate y tareas

### 6.1 Estado

| Elemento | Estado | Justificación |
|---|---|---|
| `W1-01` | `DONE` | Q1–Q4 decididas; `GAP-001` parcial y `GAP-002` planificado |
| `W1-02` | `DONE_DOCUMENTAL` + prueba funcional | `DEC-W1-007` propagada; flujo `PI-01` verifica estados |
| `W1-03` | `DONE_DOCUMENTAL` + prueba funcional | `DEC-W1-008` propagada; Argon2id verificado en unit test |
| `GATE-W1-01` | `PASS` | No quedan decisiones de negocio pendientes para la matriz |
| `GATE-W1` | `NOT_RUN` | Gate documental amplio; `W1-04`/`W1-07` pendientes para el resto |
| `GATE-PI01-CODE` | `PASS` | Typecheck, 29 pruebas, build y revisión independiente `PASS` |
| `GATE-PI01-CONTRACT` | `PASS_WITH_CONSTRAINTS` | Contrato y pruebas solo para `POST /api/v1/buyers`, `/health` y `/ready` |
| `GATE-PI01-POSTGRES` | `PASS` | Suite automatizada contra PostgreSQL 17.11: concurrencia, `409`, rollback y limpieza; CI pendiente |
| `GATE-W2`…`GATE-W8` | `NOT_RUN` | No se iniciaron formalmente |

### 6.2 Tareas y artefactos

| Tarea | Estado | Motivo |
|---|---|---|
| `W1-01` cierre definitivo | `DONE` | `DEC-W1-001`…`DEC-W1-006` |
| `W1-02` (`L-16`) | `DONE_DOCUMENTAL` + funcional | `DEC-W1-007`; flujo `PI-01` |
| `W1-03` (`L-12`/`L-20`) | `DONE_DOCUMENTAL` + funcional | `DEC-W1-008`; Argon2id verificado |
| `W1-04` (`L-01`) | `NOT_STARTED` | No es requisito de `PI-01`; sí de `PI-02` |
| `W1-05` (primer vertical) | `DONE` | `DEC-IMPL-001`: `PI-01` |
| Catálogo (`PI-05`/`PI-06`) | `NOT_STARTED` | `DEC-W1-001` resuelta; faltan gates de catálogo |
| Devoluciones (`DS-07`, `PI-21`/`PI-22`) | `NOT_STARTED` | `DEC-W1-002` resuelta; faltan `L-10` y gates |
| Pagos (`PO-16`, `CT-04`) | `NOT_STARTED` | `DEC-W1-004` excluye pagos de `PI-01`; `L-22` abierta |
| W2 ADR/datos | `PARTIAL` | Decisiones reversibles implementadas; ADR formales pendientes |
| W3 OpenAPI | `PARTIAL` | Contrato de tres rutas y contract test; sin validador semántico |
| W4 Fundación/Docker | `PARTIAL` | Memoria/HTTP, PostgreSQL 17.11/Docker y suite automatizada; CI pendiente |
| W5 `PI-01` | `PARTIAL` | Código, 29 pruebas, PostgreSQL automatizado y revisión independiente `PASS`; CI pendiente |
| W5–W8 resto | `NOT_STARTED` | Dependen de gates anteriores; `PI-02` bloqueado por `L-01` y `ADR-004` |

**Corte implementado:** se creó `backend/` con `PI-01` y se ejecutaron `npm run typecheck`, `npm test` (5 archivos/29 pruebas), `npm run test:postgres` (2 pruebas) y `npm run build`; el smoke HTTP devolvió `201`, `409`, `/health` y `/ready`. PostgreSQL 17.11 se verificó con migración, alta, duplicado, concurrencia, rollback y limpieza dirigida. Detalle en [`../implementation/01-acceptance-and-unblock.md`](../implementation/01-acceptance-and-unblock.md).

---

## 7. Documentos modificados y artefactos

| Documento | Cambio | Motivo |
|---|---|---|
| `docs/backend/w1/01-resolution-matrix.md` | Actualizado a resuelto | Cerrar `W1-01` con decisiones Q1–Q4 |
| `docs/backend/w1/02-artifact-register.md` | Actualizado | Reflejar decisiones y artefactos pendientes |
| `docs/backend/w1/03-decisions.md` | Creado | Registro de Q1–Q4, `DEC-W1-007`/`008` |
| `docs/backend/w0/03-discrepancies.md` | Estados actualizados | `CON-*` resueltos; `U-002`/`U-003` cerrados por sus tareas |
| `docs/backend/w0/04-backlog.md` | Estados actualizados | `W1-01`/`W1-02`/`W1-03`; estado posterior de `W1-05`/`W1-06` en §5.1 |
| `orchestrator-state.md` | Estado operativo actualizado | Reanudación verificable |
| `prompt-orquestador-backend.md` | §6 corregido | Eliminar reglas contradichas |
| `BackendSDD/enunciado.md` | Inventario por producto/variante | Alinear con `DEC-W1-001` |
| `BackendSDD/Domain/nexusmarket-domain-model.md` | Estados iniciales, plazo, DD-12, §28 | Alinear con `DEC-W1-001`/`002`/`007` |
| `BackendSDD/Domain/services/politica-elegibilidad-devolucion.md` | `RET-06`, entradas, estado | Alinear con `DEC-W1-002` |
| `BackendSDD/Domain/nexusmarket-domain-object-values.md` | `HashCredencial` | Alinear con `DEC-W1-008` |
| `BackendSDD/Application/nexusmarket-input-ports.md` | `PI-01`/`02`/`21`/`22`, límites | Alinear con `DEC-W1-002`/`007`/`008` |
| `BackendSDD/Application/nexusmarket-output-ports.md` | `PO-22`, `PO-12`/`PO-15`, límites | Alinear con `DEC-W1-002`/`008` |
| `BackendSDD/Contracts/nexusmarket-contract-alignment.md` | `CT-08`, `F-01`, `CT-13`, bloqueos | Alinear con `DEC-W1-002`/`007`/`008` |
| `BackendSDD/Adapters/nexusmarket-adapter-password-hasher.md` | Política Argon2id | Alinear con `DEC-W1-008` |
| `BackendSDD/Adapters/nexusmarket-adapters.md` | `ADOUT-13`, `L-12`/`L-20` | Alinear con `DEC-W1-008` |
| `BackendSDD/Adapters/nexusmarket-adapter-sql-identity-profiles.md` | Estados iniciales | Alinear con `DEC-W1-007` |
| `BackendSDD/Software Architecture/nexusmarket-arquitectura.md` | §18 | Retirar pendientes ya resueltos |
| `BackendSDD/DOCUMENTATION_STATUS.md` | `L-06`/`L-12`/`L-16`/`L-20`, `DEC-BIZ-02` | Alinear con las decisiones |
| `README.md` | Hoja de ruta y decisiones | Reflejar W1 y `DEC-BIZ-02` resuelta |

**En W1-01 no se crearon** ADR, OpenAPI, migraciones, dependencias ni código. **En el corte posterior del 2026-10-28 sí se creó** `backend/` con `PI-01`; ver [`../implementation/01-acceptance-and-unblock.md`](../implementation/01-acceptance-and-unblock.md). No se introdujo Go.

---

## 8. Trazabilidad de esta resolución

| Afirmación | Evidencia |
|---|---|
| El modelo 2.0 es línea base | `DOCUMENTATION_STATUS.md` 34, 49; modelo 1121–1123 |
| `Variante` es unidad de SKU/precio/inventario | Modelo 117–118, 355–371, 396–422, 1130 |
| Publicar sin variantes se rechaza | Modelo 327–328, 1073–1074 |
| El plazo es configurable y 30 días es el valor inicial | Modelo 712, 1138, 1146; `DS-07` 86, 103, 126; `DEC-W1-002` |
| El evento es entrega confirmada | Modelo 698, 712; `DS-07` 48–49, 121 |
| No hay requisito de imágenes | Modelo 327–328, 995–998; `PI-05` 440; `PO-05` 376; Output Ports §6.3 |
| No hay simulación de pago documentada | Modelo 624–632; `PO-16`; `D-18` 230; `L-22` 189 |
| Estados iniciales aprobados | `DEC-W1-007`; modelo §6.1/§6.3/§6.4/§8.1; `PI-01`/`PI-02` |
| Política de credenciales aprobada | `DEC-W1-008`; `VO` §6.4; `PO-22`; `CT-08` |
| `CT-01` no existe | Contract Alignment 83–99, 121; `D-28`/`D-30` |
| Las fuentes faltantes no existen | Inventario §3.2; `git ls-files`; historial Git |

---

**Fin de W1-01 (matriz).** `GATE-W1-01 = PASS`. En W1-01 no se iniciaron `W1-04` ni `W1-05`; el corte posterior seleccionó `PI-01` (`DEC-IMPL-001`) y lo implementó con las limitaciones declaradas. No se autoriza implementar catálogo, devoluciones, imágenes ni pagos hasta completar sus gates.
