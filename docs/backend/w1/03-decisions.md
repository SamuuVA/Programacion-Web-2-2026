# W1 — Registro de decisiones de negocio y de dominio

**Proyecto:** NexusMarket
**Ola:** W1 — Dominio y decisiones ejecutables
**Tareas:** `W1-01` (decisiones Q1–Q4), `W1-02` (`L-16`) y `W1-03` (`L-12`/`L-20`)
**Fecha:** 2026-10-28
**Commit de referencia:** `badf0b1993c927d6713d85cd7b44eee8b4259a46`
**Estado:** decisiones Q1–Q4 aprobadas por el propietario; `DEC-W1-007` y `DEC-W1-008` adoptadas dentro de la autorización de `W1-02`/`W1-03`.
**Actualización 2026-10-28 (posterior):** se implementó `PI-01`; la biblioteca de hash elegida es `@node-rs/argon2` 2.2.2 y la política `DEC-W1-008` se verificó con pruebas. Ver [`../implementation/01-acceptance-and-unblock.md`](../implementation/01-acceptance-and-unblock.md). El texto de W1-03 se conserva como registro histórico.

**Regla de lectura:** una decisión aprobada por el propietario se distingue de una decisión técnica adoptada por el orquestador. Cuando una fuente no fija un valor, se indica expresamente; no se atribuye a una fuente una regla que no contiene.

---

## 1. Decisiones de negocio Q1–Q4 (`W1-01`)

### 1.1 `DEC-W1-001` / `CON-001` — Variantes en V1

| Campo | Contenido |
|---|---|
| Decisión | **A. Mantener `Producto` + `Variante` en V1.** La variante sigue siendo la unidad de SKU, precio e inventario. |
| Autoridad | Propietario del proyecto, instrucción del 2026-10-28. |
| Justificación | Es la línea base del modelo 2.0 y de `CAT-02`/`CAT-03`, `DM-06`/`DM-07`, `DD-04`, `PI-05`, `PI-06` y los snapshots con `varianteId`. La regla del prompt que prohibía variantes no tenía una decisión de negocio que la respaldara y exigía derogar la cadena completa. |
| Alcance | Catálogo, inventario, carrito, pedido y contratos de V1. No cambia el modelo ni crea código en W1. |
| Consecuencias | Se corrige el prompt operativo. El inventario se entiende por `(varianteId, bodegaId)`. Catálogo/inventario siguen sujetos a `W1-05` y a sus gates; esta decisión no los implementa. |
| Trazabilidad | `enunciado.md` 147–149; modelo 117–118, 306–371, 327–328, 1073–1074, 1130; `PI-05`; casos de uso 275/603; matriz §3.1. |
| Documentos corregidos | `prompt-orquestador-backend.md` §6; `enunciado.md` Dominio 6 (inventario por producto/variante); arquitectura §18; matriz §3.1/§4/§5; discrepancias; backlog; estado. |

### 1.2 `DEC-W1-002` / `CON-002` — Plazo de devolución

| Campo | Contenido |
|---|---|
| Decisión | **B. Política configurable, con 30 días como valor inicial expresamente aprobado.** Una sola política para la plataforma en V1; no se segmenta por categoría ni jurisdicción. |
| Autoridad | Propietario del proyecto, instrucción del 2026-10-28. |
| Justificación | `DD-12`, `L-06` y `DEC-BIZ-02` exigían una política configurable y prohibían inventar la cifra. El propietario aprobó expresamente 30 días como valor inicial. |
| Alcance | `DS-07`, `RET-03`/`RET-06`, `PI-21`/`PI-22`; valor vigente y snapshot del valor aplicado. No se hardcodea en el dominio: se suministra como configuración versionada. |
| Consecuencias | La política queda configurable y operable con 30 días iniciales. Cambiar el valor no altera solicitudes pasadas si se conserva el snapshot. Siguen abiertos `L-10` (catálogo de motivos) y los contratos de devolución; no se implementa nada en W1. |
| Trazabilidad | Modelo 698, 712, 1138, 1146; `DS-07` 48–49, 86, 100, 103, 126; `L-06`; `DEC-BIZ-02`; matriz §3.2. |
| Documentos corregidos | `prompt-orquestador-backend.md` §6; modelo 712/1138/1146; `DS-07`; `DOCUMENTATION_STATUS.md`; matriz; discrepancias; backlog; estado. |

### 1.3 `DEC-W1-003` / `CON-003` — Imágenes

| Campo | Contenido |
|---|---|
| Decisión | **A. Imágenes fuera del alcance de V1 y del primer vertical.** No se agregan campos, upload, almacenamiento ni `FileStorage`. |
| Autoridad | Propietario del proyecto, instrucción del 2026-10-28. |
| Justificación | El modelo `CAT-02`/`CAT-03`, las precondiciones 995–998, `PI-05` y `PO-05` no exigen imágenes; no existe requisito funcional ni política de almacenamiento. |
| Alcance | Catálogo y publicación de V1. `ADR-011` no se crea. |
| Consecuencias | Se corrige el prompt. No se añade deuda de almacenamiento, MIME, antivirus, cuotas ni URLs. Si el negocio las incorpora después, requiere nueva decisión de alcance y un ADR de almacenamiento antes de tocar el catálogo. |
| Trazabilidad | Modelo 327–328, 995–998; `PI-05` 440; `PO-05` 376; Output Ports §6.3; matriz §3.3. |
| Documentos corregidos | `prompt-orquestador-backend.md` §6; matriz; discrepancias; backlog; estado. |

### 1.4 `DEC-W1-004` / `CON-004` — Pagos

| Campo | Contenido |
|---|---|
| Decisión | **A. Sin pagos en `PI-01`; los dobles de pago se usan exclusivamente en pruebas.** No se implementa adaptador de pago ni simulador de producción en el primer vertical. |
| Autoridad | Propietario del proyecto, instrucción del 2026-10-28. |
| Justificación | El modelo exige confirmación verificable (`PAY-01`…`PAY-07`) y `PO-16`/`D-18` mantienen el proveedor abstracto. Un simulador de producción no cumple `PAY-01`; el primer vertical es `PI-01`, que no toca pagos. |
| Alcance | `PI-01` y primer vertical. `PO-16` sigue siendo una frontera abstracta; `L-22` y `CT-04` siguen abiertos. |
| Consecuencias | Se corrige el prompt: no se declara “pago simulado en V1”. Los dobles de prueba no son un adaptador de producción. Checkout/pagos quedan para una ola posterior y sus gates. |
| Trazabilidad | Modelo 605, 620, 624–632; `PO-16`; `D-18`; `L-22`; matriz §3.4. |
| Documentos corregidos | `prompt-orquestador-backend.md` §6; matriz; discrepancias; backlog; estado. |

---

## 2. `W1-02` — `DEC-W1-007`: estados iniciales (`L-16`)

**Naturaleza de la decisión:** `L-16` no fijaba los estados. No existe una fuente que imponga uno de los valores; la decisión se adopta como política de creación para el primer vertical, dentro de la autorización de `W1-02`. No se presenta como requisito extraído de una fuente.

| Entidad | Estado inicial aprobado | Condición |
|---|---|---|
| `Usuario` (comprador o vendedor) | `ACTIVO` | Se crea con credencial ya hasheada y datos válidos. |
| `PerfilComprador` | `HABILITADO` | Se crea junto con el usuario comprador y su carrito. |
| `PerfilVendedor` | `ACTIVO` | La incorporación administrativa es el acto de aprobación; se crea junto con la primera bodega. |
| `BodegaVendedor` (primera) | `ACTIVA` | Se crea atómicamente con el vendedor. |

### 2.1 Justificación

- `PI-01` es registro público de comprador. Las fuentes no definen verificación de correo, activación por enlace ni aprobación administrativa del comprador; `PI-04` ya permite desactivar o bloquear una cuenta. Elegir `INACTIVO` introduciría un proceso de activación no documentado y dejaría el alta sin salida operativa.
- `PI-02` es una incorporación ejecutada por un Administrador y declara que “no aprueba ni activa vendedores si la política exige revisión”. No existe un puerto aprobado para activar un `PerfilVendedor`; `PI-04` cambia el estado de la cuenta, no el del perfil comercial. Elegir `EN_REVISION` dejaría al vendedor sin transición disponible en V1.
- La primera bodega debe quedar operativa para que el vendedor pueda administrar catálogo e inventario; no existe un puerto de activación de bodega en el primer vertical.
- El administrador debe verificar los datos antes de incorporar al vendedor; la decisión no elimina la revisión, la traslada al acto de incorporación.

### 2.2 Consecuencias y límites

- No hay verificación de correo ni revisión separada del vendedor en V1. Es un trade-off de seguridad/operación consciente; si se requiere, se añade un caso de uso y un puerto, y se revisa esta decisión.
- `PI-04` puede desactivar/bloquear la cuenta después del alta. Las transiciones restantes de `EstadoVendedor` siguen limitadas por `L-09`.
- `PI-02` sigue limitado por `L-01` (composición de dirección); `W1-02` no cierra `U-004`.
- No se decide aquí el estado inicial de `Producto` ni de `Variante`; pertenecen al catálogo y a `L-09`, fuera del alcance de `PI-01`.
- No se ha ejecutado código ni prueba funcional: no existe `backend/`.

### 2.3 Trazabilidad

`DOCUMENTATION_STATUS.md` `L-16`; modelo §6.1, §6.3, §6.4, §8.1; `PI-01` precondiciones/postcondiciones; `PI-02` §7/§8; `PI-04`; `L-08`/`L-09`; matriz §6.1.

---

## 3. `W1-03` — `DEC-W1-008`: política de credenciales (`L-12`/`L-20`)

**Naturaleza de la decisión:** `L-12`/`L-20` no fijaban algoritmo, parámetros, formato ni fortaleza. La siguiente es una decisión técnica de W1-03, no una regla ya contenida en el modelo. La biblioteca concreta y su versión se eligen en W4; no se instala nada ahora.

### 3.1 Algoritmo y parámetros

| Parámetro | Valor aprobado |
|---|---|
| Algoritmo | `Argon2id` (variante híbrida, resistente a GPU y side-channel). |
| Versión Argon2 | `19` (`0x13`). |
| Memoria (`m`) | `19456` KiB (19 MiB). |
| Iteraciones (`t`) | `2`. |
| Paralelismo (`p`) | `1`. |
| Sal | 16 bytes aleatorios criptográficamente seguros por credencial. |
| Salida | 32 bytes. |
| Formato almacenado | Cadena PHC: `$argon2id$v=19$m=19456,t=2,p=1$<sal-base64>$<hash-base64>`. |
| Pepper | No se usa en V1; si se añade, requiere decisión de gestión de secretos y ADR en W2. |

Los parámetros son la línea base. En W4 se calibran contra el hardware de despliegue; no se reducen por debajo de la línea base sin una decisión documentada. El formato PHC conserva los parámetros aplicados, lo que permite verificar hashes antiguos y rehashear tras un login exitoso si la política cambia.

### 3.2 Fortaleza de contraseña

| Regla | Valor |
|---|---|
| Longitud mínima | 12 caracteres Unicode. |
| Longitud máxima | 128 caracteres Unicode. |
| Composición obligatoria | Ninguna (no se exigen mayúsculas, dígitos ni símbolos). |
| Caracteres | Se permiten letras, dígitos, espacios y símbolos; no se truncan. |
| Valores rechazados | Vacío, solo espacios, o idéntico al correo/nombre completo del usuario. |
| Lista de contraseñas comunes/comprometidas | No se incorpora en W1; si se adopta, se hace con una lista versionada y una decisión de W4/W7. |
| Rotación periódica | No se exige. |
| Texto plano | Nunca se persiste, registra, audita, envía a logs ni devuelve al cliente. |

La política no normaliza el secreto: se procesa la secuencia Unicode recibida, codificada en UTF-8, sin recortes ni conversión de mayúsculas/minúsculas.

### 3.3 Verificación

- La verificación se realiza con la biblioteca Argon2id y comparación de tiempo constante; el dominio y la aplicación no comparan hashes con `===`.
- Un hash con parámetros distintos se verifica con los parámetros embebidos; si el login es exitoso, se rehashea con los parámetros vigentes y se actualiza el registro.
- Para un identificador inexistente, el servicio de autenticación debe usar un hash ficticio de coste equivalente para no revelar por tiempo si la cuenta existe. Esto es una obligación del futuro caso de autenticación, no de `PI-01`.
- Los errores de hashing se mapean a `NO_DISPONIBLE`/`OPERACION_NO_SOPORTADA` de `PO-22`; nunca incluyen la credencial.
- La política de bloqueo por intentos, rate limiting y recuperación de contraseña no forma parte de `L-20`; queda para el diseño de autenticación (`L-27`/W2/W4).

### 3.4 Consecuencias y dependencias

- `PO-22` sigue abstracto; la aplicación solo maneja `HashCredencial` y el adapter aplica Argon2id.
- W4 deberá elegir una biblioteca Argon2id compatible con Node.js/TypeScript, verificar su mantenimiento y ejecutar vectores de prueba. No se elige ni se instala aquí.
- `HashCredencial` se almacena como texto PHC, nunca como contraseña; el esquema físico y la longitud de columna se definen en `CT-12`/W2.
- `CT-08` y `ADR-009` quedan con decisión registrada, pero el contrato ejecutable y el ADR formal pertenecen a W2/W3; no se crean en W1.
- No se ha ejecutado código ni prueba funcional.

### 3.5 Trazabilidad

`DOCUMENTATION_STATUS.md` `L-12`, `L-20`; modelo §6.1/§16; `VO` §6.4; `PI-01`/`PI-02`; `PO-22`; `ADOUT-13`; `CT-08`; matriz §6.1.

---

## 4. Verificación documental de esta ejecución

| Comprobación | Resultado |
|---|---|
| Q1–Q4 registradas con justificación, alcance, consecuencias y trazabilidad | Sí, §1. |
| `CON-001`…`CON-004` actualizados a resueltos en matriz y discrepancias | Sí; ver §5. |
| Prompt corregido (variantes, inventario, imágenes, pagos, plazo) | Sí, `prompt-orquestador-backend.md` §6. |
| Modelo/`DS-07`/`VO`/puertos/contratos alineados con las decisiones | Sí; cambios puntuales, sin crear artefactos ejecutables. |
| `README.md` alineado con la hoja de ruta y el estado W1 | Sí; `DEC-BIZ-02`, `CT-04`, `CT-08` y limitaciones actualizadas. |
| `L-16` y `L-12`/`L-20` cerrados con decisión explícita | Sí, `DEC-W1-007`/`DEC-W1-008`. |
| `U-002`/`U-003` cerrados por W1-02/W1-03, no por Q1–Q4 | Sí; ver §5. |
| `U-001`, `U-004`…`U-008` y los riesgos no mitigados siguen abiertos **al cierre de W1** | Sí en W1-03; posteriormente `U-001`/`U-005`…`U-008` se cerraron reversiblemente en el corte de implementación. |
| Sin código, migraciones, dependencias, OpenAPI ni ADR **en W1** | Sí; el corte posterior del 2026-10-28 creó `backend/`, migración y OpenAPI mínimo, pero no ADR formales. |
| Sin Go | Sí; stack documentado TypeScript/Node.js. |

---

## 5. Estado de bloqueos y trazabilidad de cierre

| ID | Estado tras W1 | Evidencia |
|---|---|---|
| `CON-001` | `RESOLVED` (`DEC-W1-001`) | §1.1; matriz §3.1; discrepancias §8. |
| `CON-002` | `RESOLVED` (`DEC-W1-002`) | §1.2; `DS-07`; modelo 712/1138/1146. |
| `CON-003` | `RESOLVED` (`DEC-W1-003`) | §1.3; prompt §6. |
| `CON-004` | `RESOLVED` (`DEC-W1-004`) | §1.4; prompt §6. |
| `U-001` | `RESOLVED` posteriormente (`DEC-IMPL-001`: `PI-01`) | Reporte de implementación. |
| `U-002` | `RESOLVED` (`DEC-W1-007`) | §2; `L-16` cerrada. |
| `U-003` | `RESOLVED` (`DEC-W1-008`) | §3; `L-12`/`L-20` cerradas. |
| `U-004` | `OPEN` | `L-01`; `PI-02` aún requiere dirección. |
| `U-005`…`U-008` | `RESOLVED_REVERSIBLE` posteriormente (`DEC-IMPL-002`…`005`) | Reporte de implementación §3; ADR formales pendientes. |
| `RISK-001`…`RISK-006` | `RISK-001` resuelto en el entorno de verificación; `RISK-006` mitigado; el resto `OPEN` o `PARTIAL` | Docker/PostgreSQL verificados el 2026-10-28 y suite PostgreSQL automatizada; siguen abiertos clientes del host, `L-27` fuera de tres rutas, decisiones de negocio restantes y CI. |

**Regla:** este cierre no aprobó `W1-05` en W1, no inició W2 y no autorizó implementar catálogo, devoluciones, imágenes ni pagos. El corte posterior del 2026-10-28 seleccionó `PI-01` e implementó solo ese vertical, sin reabrir las decisiones de negocio.

---

## 6. Próximo paso exacto

`W1-04` (`L-01`) y `W1-05` (primer vertical) no se inician automáticamente. Antes de `PI-01`, el propietario debe aprobar el primer vertical (`U-001`); `W1-04` no es requisito de `PI-01`, pero sí de `PI-02` mientras la dirección no esté definida.
