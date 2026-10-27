# NEXUSMARKET — Contract Alignment

**Identificador documental:** `ENT-CA`  
**Versión:** 1.0  
**Estado:** `COMPLETO` con contratos ejecutables pendientes  
**Última actualización:** 26 de octubre de 2026  
**Raíz documental:** `BackendSDD/`  
**Ámbito:** verificación de la cadena requisito → regla de negocio → dominio → caso de uso → puerto de entrada → puertos de salida → adaptador → contrato externo/persistencia. No contiene código, OpenAPI ejecutable, esquemas de eventos, SDKs, DTOs implementados ni pruebas.

---

## 1. Propósito y límites

Este documento responde si cada flujo importante de NexusMarket está alineado de extremo a extremo y, cuando no lo está, qué falta exactamente para estarlo. No sustituye al modelo, a los puertos, a los casos de uso ni a los adaptadores: los verifica y registra la corrección mínima.

**No hace:**

- No fija rutas, métodos HTTP, códigos de estado, autenticación concreta, versionado ni límites de tasa (`L-27`).
- No elige proveedor de pagos, logística, notificaciones ni entrega digital (`L-22`, `L-23`, `L-24`, `L-18`).
- No elige algoritmo de hashing, parámetros de credenciales ni formato de identificadores (`L-12`, `L-20`, `L-13`).
- No define numeración fiscal, catálogo de reportes ni asignación de operador (`L-17`, `L-19`, `L-26`).
- No crea contratos ejecutables ni presenta propuestas como decisiones aprobadas.

**Sí hace:**

- Verifica la cadena completa y detecta eslabones ausentes o contradictorios.
- Propone contratos conceptuales cuando la arquitectura y los puertos ya permiten derivarlos.
- Corrige desalineaciones documentales entre puertos y adaptadores.
- Separa lo que está alineado de lo que solo está propuesto y de lo que carece de evidencia.

---

## 2. Fuentes y autoridad

| Abreviatura | Fuente | Uso |
|---|---|---|
| `[ARQ]` | [`nexusmarket-arquitectura.md`](../Software%20Architecture/nexusmarket-arquitectura.md) | Capas, límites, HTTP, persistencia, transacciones y composición. |
| `[PI]` | [`nexusmarket-input-ports.md`](../Application/nexusmarket-input-ports.md) | Contratos de entrada, contexto, errores y autorización. |
| `[PO]` | [`nexusmarket-output-ports.md`](../Application/nexusmarket-output-ports.md) | Contratos de salida, estados, errores e invariantes. |
| `[MOD]` | [`nexusmarket-domain-model.md`](../Domain/nexusmarket-domain-model.md) | Agregados, invariantes, eventos y propiedad de datos. |
| `[VO]` | [`nexusmarket-domain-object-values.md`](../Domain/nexusmarket-domain-object-values.md) | Tipos, estados y valores normalizados. |
| `[DS]` | [`nexusmarket-domain-services.md`](../Domain/nexusmarket-domain-services.md) | Reglas que no deben trasladarse a contratos de infraestructura. |
| `[UC]` | [`nexusmarket-use-cases-checkout-query-order.md`](../Application/nexusmarket-use-cases-checkout-query-order.md) | `UC-01` y `UC-02`: actores, flujos, idempotencia y transacciones. |
| `[AD]` | [`nexusmarket-adapters.md`](../Adapters/nexusmarket-adapters.md) | Inventario y límites de los 14 adaptadores. |
| `[PM]` | [`Prompt-maestro-documentacion.md`](../Prompt-maestro-documentacion.md) | Regla de Contract Alignment (§5.8) y calidad documental. |
| `[EST]` | [`DOCUMENTATION_STATUS.md`](../DOCUMENTATION_STATUS.md) | Decisiones, conflictos y limitaciones vigentes. |

**Jerarquía aplicada:** instrucción actual del usuario > arquitectura y puertos aprobados > modelo/VOs/servicios > casos de uso y adaptadores > propuestas de este documento. Una propuesta no cierra una limitación ni sustituye una aprobación externa.

---

## 3. Método y estados

### 3.1 Cadena verificada

Para cada flujo se contrastan estos eslabones:

1. Requisito de origen (`OBJ-xx` del enunciado).
2. Regla de negocio e invariantes (`RG`, `INV`, `ORD`, `PAY`, `AUD`, `DS-xx`).
3. Concepto de dominio y VO.
4. Caso de uso y puerto de entrada (`PI-xx`).
5. Puertos de salida (`PO-xx`).
6. Adaptador que implementa o invoca (`ADIN-01`, `ADOUT-xx`).
7. Contrato externo o de persistencia (`CT-xx`).
8. Errores, escenarios alternativos y consistencia.

### 3.2 Estados

| Estado | Significado |
|---|---|
| `ALINEADO` | Todos los eslabones críticos están definidos y no se contradicen. |
| `ALINEADO_CON_PROPUESTA` | La frontera y la cadena son coherentes, pero existe una propuesta conceptual o una decisión externa pendiente que impide cerrar el contrato ejecutable. |
| `DESALINEADO` | Hay una contradicción o un eslabón crítico ausente que exige corrección. |
| `SIN_EVIDENCIA` | No existe fuente suficiente para afirmar la alineación. |
| `NO_APLICA` | El flujo no usa ese tipo de contrato. |

**Regla de honestidad:** un flujo no se marca `ALINEADO` si falta el contrato público, el protocolo del proveedor, el esquema de persistencia o una decisión de negocio crítica. En esos casos se usa `ALINEADO_CON_PROPUESTA` o `SIN_EVIDENCIA`.

---

## 4. Inventario de contratos

| ID | Contrato | Frontera | Puertos | Adaptador(es) | Estado | Bloqueo |
|---|---|---|---|---|---|---|
| `CT-01` | HTTP/OpenAPI | Cliente → aplicación | `PI-01`…`PI-25` | `ADIN-01` | `SIN_EVIDENCIA` | `L-27`: no hay OpenAPI aprobado; la frontera está alineada, el contrato público no. |
| `CT-02` | Eventos de dominio y outbox | Aplicación → outbox → consumidores | `PO-23` | `ADOUT-04` | `ALINEADO_CON_PROPUESTA` | `L-14`: catálogo y payloads incompletos. |
| `CT-03` | Auditoría | Aplicación → repositorio append-only | `PO-14` | `ADOUT-05` | `ALINEADO_CON_PROPUESTA` | `L-11`, `L-15`: composición, gravedad y retención abiertas. |
| `CT-04` | Pago | Aplicación → proveedor de pago | `PO-16` | `ADOUT-07` | `ALINEADO_CON_PROPUESTA` | `L-22`: protocolo, autorización/captura, webhooks y reintentos. |
| `CT-05` | Logística | Aplicación → proveedor logístico | `PO-17` | `ADOUT-08` | `ALINEADO_CON_PROPUESTA` | `L-23`: proveedor, tracking, evidencia y reintentos. |
| `CT-06` | Notificaciones | Aplicación → proveedor de mensajes | `PO-18` | `ADOUT-09` | `ALINEADO_CON_PROPUESTA` | `L-24`: canales, plantillas y consentimiento. |
| `CT-07` | Entrega digital | Aplicación → mecanismo de acceso/licencia | `PO-19` | `ADOUT-10` | `ALINEADO_CON_PROPUESTA` | `L-18`: modelo de acceso, licencia y evidencia. |
| `CT-08` | Credenciales | Aplicación → hashing | `PO-22` | `ADOUT-13` | `ALINEADO_CON_PROPUESTA` | `L-12`, `L-20`: algoritmo, parámetros y política. |
| `CT-09` | Identificadores | Aplicación → generador | `PO-21` | `ADOUT-12` | `ALINEADO_CON_PROPUESTA` | `L-13`: formato físico y estrategia de unicidad. |
| `CT-10` | Facturación | Aplicación → persistencia fiscal | `PO-10` | `ADOUT-03` | `ALINEADO_CON_PROPUESTA` | `L-17`: numeración, serie y jurisdicción. |
| `CT-11` | Reportes | Aplicación → consulta de lectura | `PO-24` | `ADOUT-06` | `ALINEADO_CON_PROPUESTA` | `L-19`: catálogo, filtros, fórmulas y límites. |
| `CT-12` | Persistencia SQL/MongoDB | Aplicación → repositorios y unidad de trabajo | `PO-01`…`PO-15`, `PO-24` | `ADOUT-01`…`ADOUT-06` | `ALINEADO_CON_PROPUESTA` | Esquemas físicos, índices y migraciones no definidos; propiedad de datos sí alineada. |
| `CT-13` | Tiempo del sistema | Aplicación → reloj UTC | `PO-20` | `ADOUT-11` | `ALINEADO` | Sin bloqueo de contrato; los plazos de negocio siguen en `L-06`. |

**Cobertura:** 24 `PO` y 25 `PI` quedan representados. Los contratos `CT-01`…`CT-12` no están cerrados como artefactos ejecutables; `CT-13` es el único contrato técnico completo.

---

## 5. Matriz de alineación por flujo

| Flujo | Requisito | Regla/dominio | UC/PI | PO | Adaptador | Contrato | Persistencia | Errores/consistencia | Resultado |
|---|---|---|---|---|---|---|---|---|---|
| `F-01` Registro de comprador/vendedor | OBJ-01, OBJ-02, OBJ-03 | Unicidad de correo/documento; rol; estado inicial `L-16`; credencial no reversible | `PI-01`, `PI-02`, `PI-03`, `PI-04` | `PO-01`…`PO-04`, `PO-20`, `PO-21`, `PO-22`, `PO-23` | `ADIN-01`; `ADOUT-01`, `ADOUT-04`, `ADOUT-11`…`ADOUT-13` | `CT-01`, `CT-08`, `CT-09`, `CT-12` | SQL; outbox para eventos críticos | `CONFLICTO_UNICIDAD`, `DATOS_INVALIDOS`, `NO_DISPONIBLE`; sin credencial en claro | `ALINEADO_CON_PROPUESTA` |
| `F-02` Publicación de catálogo | OBJ-05 | Producto/variante válidos; propiedad del vendedor; SKU único; estado publicado | `PI-05`, `PI-06`, `PI-07` | `PO-05`, `PO-06`, `PO-23`, `PO-20`, `PO-21` | `ADIN-01`; `ADOUT-02`, `ADOUT-04`, `ADOUT-11`, `ADOUT-12` | `CT-01`, `CT-02`, `CT-12` | SQL; evento `ProductoPublicado` | `CONFLICTO_UNICIDAD`, `REGLA_NEGOCIO_INCUMPLIDA`; evento en misma transacción | `ALINEADO_CON_PROPUESTA` |
| `F-03` Reserva/liberación de inventario | OBJ-06, OBJ-08 | Saldo no negativo; reserva atómica; idempotencia | `PI-09`, `PI-12`, `PI-14`, `PI-15`, `PI-22` | `PO-06`, `PO-08`, `PO-09`, `PO-15`, `PO-23` | `ADIN-01`; `ADOUT-02`, `ADOUT-03`, `ADOUT-04` | `CT-01`, `CT-02`, `CT-12` | SQL transaccional; outbox | `CONFLICTO_CONCURRENCIA`, `REGLA_NEGOCIO_INCUMPLIDA`; sin saldo negativo | `ALINEADO_CON_PROPUESTA` |
| `F-04` Checkout | OBJ-07, OBJ-08 | Cálculo de totales; multi-vendedor; una reserva/pago por pedido; idempotencia | `PI-11`, `PI-12` (`UC-01`) | `PO-02`, `PO-05`…`PO-09`, `PO-15`, `PO-16`, `PO-18`, `PO-19`, `PO-20`, `PO-21`, `PO-23` | `ADIN-01`; `ADOUT-01`…`ADOUT-04`, `ADOUT-07`, `ADOUT-09`…`ADOUT-12` | `CT-01`, `CT-02`, `CT-04`, `CT-06`, `CT-07`, `CT-12` | SQL; outbox; proveedor externo | `IDEMPOTENCIA_CONFLICTO`, `FALLO_PROVEEDOR`; no captura en checkout (`D-18`) | `ALINEADO_CON_PROPUESTA` |
| `F-05` Confirmación de pago | OBJ-08, OBJ-09 | Pago confirmado verificable; transición de pedido; reserva/inventario; auditoría | `PI-15` | `PO-08`, `PO-09`, `PO-11`, `PO-12`, `PO-16`, `PO-18`, `PO-19`, `PO-23` | `ADIN-01`; `ADOUT-03`, `ADOUT-04`, `ADOUT-07`, `ADOUT-09`, `ADOUT-10` | `CT-02`, `CT-04`, `CT-06`, `CT-07`, `CT-12` | SQL + outbox; webhook verificado antes de `PI-15` (`D-26`) | `FALLO_PROVEEDOR`, `IDEMPOTENCIA_CONFLICTO`; no confirmar sin evidencia | `ALINEADO_CON_PROPUESTA` |
| `F-06` Despacho | OBJ-10 | Envío preparado; guía/tracking; evidencia; transición válida | `PI-16`, `PI-17` | `PO-11`, `PO-17`, `PO-18`, `PO-23` | `ADIN-01`; `ADOUT-03`, `ADOUT-04`, `ADOUT-08`, `ADOUT-09` | `CT-02`, `CT-05`, `CT-06`, `CT-12` | SQL; proveedor logístico; outbox | `TRANSICION_INVALIDA`, `FALLO_PROVEEDOR`; no despacho sin preparación | `ALINEADO_CON_PROPUESTA` |
| `F-07` Entrega física/digital | OBJ-10 | Evidencia de entrega; transición; no doble entrega; revocación si aplica | `PI-18`, `PI-22` | `PO-11`, `PO-17`, `PO-18`, `PO-19`, `PO-23` | `ADIN-01`; `ADOUT-03`, `ADOUT-04`, `ADOUT-08`…`ADOUT-10` | `CT-02`, `CT-05`, `CT-06`, `CT-07`, `CT-12` | SQL; proveedor; Mongo/outbox para evidencia | `FALLO_PROVEEDOR`, `OPERACION_NO_SOPORTADA`; no entrega sin evidencia | `ALINEADO_CON_PROPUESTA` |
| `F-08` Devolución y reembolso | OBJ-11 | Elegibilidad; reembolso no excede capturado; no doble reembolso | `PI-21`, `PI-22`, `PI-23` | `PO-09`, `PO-12`, `PO-13`, `PO-16`, `PO-18`, `PO-23` | `ADIN-01`; `ADOUT-03`, `ADOUT-04`, `ADOUT-07`, `ADOUT-09` | `CT-02`, `CT-04`, `CT-06`, `CT-12` | SQL; proveedor de pago; outbox | `REGLA_NEGOCIO_INCUMPLIDA`, `FALLO_PROVEEDOR`; idempotencia | `ALINEADO_CON_PROPUESTA` |
| `F-09` Consulta de pedido | OBJ-08, OBJ-12 | Autorización por alcance; no divulgación de existencia; solo lectura | `PI-13` (`UC-02`) | `PO-08`…`PO-13` | `ADIN-01`; `ADOUT-03` | `CT-01`, `CT-10`, `CT-12` | SQL; snapshots | `NO_ENCONTRADO`/`NO_AUTORIZADO`; `L-17`, `L-23`, `L-26` | `ALINEADO_CON_PROPUESTA` |
| `F-10` Auditoría | OBJ-12; AUD-01…AUD-06 | Append-only; actor, recurso, resultado, correlación; sin secretos | `PI-25` y mutaciones críticas | `PO-14`, `PO-23` | `ADIN-01`; `ADOUT-04`, `ADOUT-05` | `CT-02`, `CT-03`, `CT-12` | MongoDB append-only; outbox crítico | `FALLO_PERSISTENCIA`; auditoría no sustituye negocio | `ALINEADO_CON_PROPUESTA` |
| `F-11` Reportes administrativos | OBJ-12 | Solo lectura; alcance autorizado; no mutación | `PI-24` | `PO-24` | `ADIN-01`; `ADOUT-06` | `CT-11`, `CT-12` | SQL como fuente inicial (`D-25`) | `OPERACION_NO_SOPORTADA`, `LIMITE_EXCEDIDO`; `L-19` | `ALINEADO_CON_PROPUESTA` |
| `F-12` Notificaciones | OBJ-01…OBJ-12 | Contenido minimizado; no cambia estado; consentimiento `L-24` | `PI-01`, `PI-02`, `PI-12`, `PI-15`, `PI-17`…`PI-23` | `PO-18` | `ADOUT-09` | `CT-06` | Proveedor externo; sin transacción distribuida | `FALLO_PROVEEDOR`, `LIMITE_EXCEDIDO`; idempotencia condicional | `ALINEADO_CON_PROPUESTA` |
| `F-13` Entrega digital | OBJ-08, OBJ-10 | Solo tras pago; una provisión; evidencia; revocación | `PI-15`, `PI-18`, `PI-22` | `PO-19` | `ADIN-01`; `ADOUT-10` | `CT-07`, `CT-12` | Proveedor digital; evidencia | `FALLO_PROVEEDOR`, `OPERACION_NO_SOPORTADA`; `L-18` | `ALINEADO_CON_PROPUESTA` |

**Lectura:** ningún flujo se marca `ALINEADO` porque todos dependen de un contrato público o de una decisión externa todavía abierta. La cadena de dominio, puertos y adaptadores sí está alineada; lo pendiente es el contrato ejecutable o el protocolo concreto.

---

## 6. Contratos por familia

### 6.1 `CT-01` — HTTP/OpenAPI

| Aspecto | Definición |
|---|---|
| Frontera | Cliente/actor → `ADIN-01` → `PI-01`…`PI-25`. |
| Estado | `SIN_EVIDENCIA` para el contrato público; frontera `ALINEADO_CON_PROPUESTA`. |
| Regla de derivación | El actor se resuelve en el contexto autenticado, nunca en el cuerpo; el adaptador valida forma y tipos; las reglas de negocio permanecen en aplicación/dominio. |
| Errores | El cuerpo debe transportar el código del puerto y la correlación; el mapeo a códigos HTTP no está aprobado. |
| Seguridad | Autenticación y autorización previas a la invocación; no se exponen secretos, SQL, stack traces ni datos de tarjeta. |
| Pendiente | Rutas, métodos, códigos de estado, autenticación concreta, versionado, esquemas públicos y límites de tasa (`L-27`). |
| Corrección | Aprobar un OpenAPI que asigne cada operación pública a su `PI`, defina el sobre de error, la autenticación, el versionado y los límites. No se crea aquí. |

**No se fija** una ruta ni un método. La única alineación verificable es que el adapter HTTP invoca los `PI` y no implementa puertos de salida.

### 6.2 `CT-02` — Eventos de dominio y outbox

| Aspecto | Definición |
|---|---|
| Frontera | Aplicación → `PO-23` → outbox → relay/consumidores. |
| Estado | `ALINEADO_CON_PROPUESTA`. |
| Catálogo base | Los 16 eventos de `[MOD]` §20: `CompradorRegistrado`, `VendedorIncorporado`, `ProductoPublicado`, `ProductoSuspendido`, `InventarioRecibido`, `InventarioReservado`, `ReservaLiberada`, `PedidoCreado`, `PagoConfirmado`, `PagoRechazado`, `PedidoDespachado`, `EntregaConfirmada`, `FacturaEmitida`, `DevolucionSolicitada`, `DevolucionResuelta`, `ReembolsoCompletado`. |
| Sobre propuesto | `eventId`, `eventType`, `eventVersion`, `occurredAt` UTC, `aggregateType`, `aggregateId`, `correlationId`, `causationId` opcional, `payload` minimizado e `idempotencyKey`. |
| Consistencia | El evento se escribe en la misma transacción SQL que la mutación; publicación al menos una vez; consumidores idempotentes; no se elimina al publicar; orden por agregado si se exige. |
| Errores | `DATOS_INVALIDOS`, `CONFLICTO_UNICIDAD`, `FALLO_PERSISTENCIA`, `FALLO_PROVEEDOR`, `LIMITE_EXCEDIDO`. |
| Pendiente | Catálogo completo, payloads versionados, política de reintento, retención y consumidores (`L-14`). |
| Corrección | Aprobar el catálogo y los esquemas de payload; el sobre propuesto no cierra `L-14`. |

### 6.3 `CT-03` — Auditoría

| Aspecto | Definición |
|---|---|
| Frontera | Aplicación/`DS-09` → `PO-14` → MongoDB append-only. |
| Estado | `ALINEADO_CON_PROPUESTA`. |
| Campos | `id`, `evento`, `recursoTipo`, `recursoId`, `actorId`, `rolActor?`, `ocurridoEn` UTC, `correlationId`, `causationId?`, `resultado`, `gravedad`, `detalles` minimizados. |
| Invariantes | Append-only; no secretos ni credenciales; no sustituye los registros de negocio; la auditoría crítica se coordina con outbox. |
| Errores | `FALLO_PERSISTENCIA`, `DATOS_INVALIDOS`, `LIMITE_EXCEDIDO`, `NO_ENCONTRADO`, `OPERACION_NO_SOPORTADA`. |
| Pendiente | Composición exacta, catálogo de gravedad, retención y política de fallo crítico (`L-11`, `L-15`). |
| Corrección | Cerrar `L-11`/`L-15` y definir la política de auditoría crítica antes de implementar. |

### 6.4 `CT-04` — Pago

| Aspecto | Definición |
|---|---|
| Frontera | Aplicación → `PO-16` → proveedor de pago. |
| Estado | `ALINEADO_CON_PROPUESTA`. |
| Operaciones | Iniciar, consultar, confirmar/capturar, cancelar intento y reembolsar. |
| Estados | `PENDIENTE`, `AUTORIZADO`, `CAPTURADO`, `RECHAZADO`, `EXPIRADO`, `REEMBOLSADO`. |
| Errores | `FALLO_PROVEEDOR`, `NO_DISPONIBLE`, `IDEMPOTENCIA_CONFLICTO`, `DATOS_INVALIDOS`, `OPERACION_NO_SOPORTADA`, `LIMITE_EXCEDIDO`. |
| Consistencia | Una captura por operación; no se declara pago sin confirmación verificable; webhooks verificados en el límite HTTP (`D-26`). |
| Pendiente | Proveedor, protocolo, autorización/captura, ventana de reintento, cancelación y firma de webhooks (`L-22`). |
| Corrección | Aprobar el contrato del proveedor y mapear sus estados/errores al puerto; no capturar en checkout (`D-18`). |

### 6.5 `CT-05` — Logística

| Aspecto | Definición |
|---|---|
| Frontera | Aplicación → `PO-17` → proveedor logístico. |
| Estado | `ALINEADO_CON_PROPUESTA`. |
| Operaciones | Asignar transporte, crear guía, consultar estado, recibir evento y cancelar. |
| Estados | `PREPARADO`, `EN_TRANSITO`, `ENTREGADO`, `FALLIDO`, `CANCELADO`. |
| Errores | `FALLO_PROVEEDOR`, `NO_DISPONIBLE`, `DATOS_INVALIDOS`, `IDEMPOTENCIA_CONFLICTO`, `OPERACION_NO_SOPORTADA`, `LIMITE_EXCEDIDO`. |
| Consistencia | El envío debe estar preparado; dirección minimizada; tracking correlacionado; entrega con evidencia. |
| Pendiente | Proveedor, eventos de tracking, formato de evidencia y reintentos (`L-23`). |
| Corrección | Aprobar el contrato logístico y el formato de evidencia; no declarar entrega sin prueba. |

### 6.6 `CT-06` — Notificaciones

| Aspecto | Definición |
|---|---|
| Frontera | Aplicación → `PO-18` → proveedor de correo/SMS/push. |
| Estado | `ALINEADO_CON_PROPUESTA`. |
| Campos | `destinatario`, `canal`, `codigoEvento`/`plantilla`, `variables`, `correlationId`, `idempotencyKey` condicional. |
| Errores | `DATOS_INVALIDOS`, `NO_DISPONIBLE`, `FALLO_PROVEEDOR`, `LIMITE_EXCEDIDO`, `IDEMPOTENCIA_CONFLICTO`. |
| Consistencia | No cambia estado de negocio; contenido minimizado; la aceptación no garantiza entrega final. |
| Pendiente | Canales, plantillas, consentimiento y preferencias (`L-24`). |
| Corrección | Aprobar catálogo de notificaciones y consentimiento antes de implementar. |

### 6.7 `CT-07` — Entrega digital

| Aspecto | Definición |
|---|---|
| Frontera | Aplicación → `PO-19` → mecanismo de acceso/licencia. |
| Estado | `ALINEADO_CON_PROPUESTA`. |
| Operaciones | `PROVISIONAR`, `CONSULTAR`, `REVOCAR`. |
| Estados | `PROVISIONADO`, `FALLIDO`, `REVOCADO`. |
| Errores | `FALLO_PROVEEDOR`, `NO_DISPONIBLE`, `DATOS_INVALIDOS`, `IDEMPOTENCIA_CONFLICTO`, `OPERACION_NO_SOPORTADA`. |
| Consistencia | Solo después del pago; una provisión por línea; evidencia; revocación sin borrar historial. |
| Pendiente | Modelo de acceso/licencia, vigencia y evidencia (`L-18`). |
| Corrección | Aprobar el mecanismo de entrega y el formato de evidencia; no añadir estados no declarados por `PO-19`. |

### 6.8 `CT-08` — Credenciales

| Aspecto | Definición |
|---|---|
| Frontera | Aplicación → `PO-22` → biblioteca/servicio de hashing. |
| Estado | `ALINEADO_CON_PROPUESTA`. |
| Entrada/salida | Credencial en claro solo en memoria → `HashCredencial` opaco con metadatos de verificación. |
| Errores | `DATOS_INVALIDOS`, `NO_DISPONIBLE`, `OPERACION_NO_SOPORTADA`. |
| Invariantes | No reversible; no se registra la credencial; comparación de tiempo constante si existe verificación. |
| Pendiente | Algoritmo, parámetros, fortaleza y política (`L-12`, `L-20`). |
| Corrección | Aprobar algoritmo/parámetros; no usar códigos ajenos a `PO-22`. |

### 6.9 `CT-09` — Identificadores

| Aspecto | Definición |
|---|---|
| Frontera | Aplicación → `PO-21` → generador. |
| Estado | `ALINEADO_CON_PROPUESTA`. |
| Entrada/salida | Tipo nominal → identificador opaco, único y tipado. |
| Errores | `NO_DISPONIBLE`, `DATOS_INVALIDOS`, `CONFLICTO_UNICIDAD`. |
| Invariantes | Opacidad; no reutilización; no derivado de datos personales; unicidad reforzada en persistencia. |
| Pendiente | Formato físico y estrategia de unicidad (`L-13`). |
| Corrección | Aprobar UUID, ULID, secuencia u otro mecanismo; no confundir con números fiscales. |

### 6.10 `CT-10` — Facturación

| Aspecto | Definición |
|---|---|
| Frontera | Aplicación → `PO-10` → persistencia fiscal. |
| Estado | `ALINEADO_CON_PROPUESTA`. |
| Operaciones | Recuperar por id/pedido/número, guardar, verificar unicidad y listar. |
| Errores | `NO_ENCONTRADO`, `CONFLICTO_UNICIDAD`, `CONFLICTO_CONCURRENCIA`, `DATOS_INVALIDOS`, `FALLO_PERSISTENCIA`. |
| Invariantes | Factura emitida inmutable; snapshots; número único en serie; una factura por pedido en línea base. |
| Pendiente | Numeración, serie, jurisdicción y corrección (`L-17`). |
| Corrección | Aprobar numeración/serie y tratamiento de correcciones; no generar PDF ni almacenar artefacto en este contrato. |

### 6.11 `CT-11` — Reportes

| Aspecto | Definición |
|---|---|
| Frontera | Aplicación → `PO-24` → SQL (fuente inicial). |
| Estado | `ALINEADO_CON_PROPUESTA`. |
| Entrada/salida | Tipo, rango, filtros, agrupación, paginación y alcance → filas/agregados, totales, `generadoEn` y frescura. |
| Errores | `OPERACION_NO_SOPORTADA`, `DATOS_INVALIDOS`, `NO_DISPONIBLE`, `LIMITE_EXCEDIDO`. |
| Consistencia | Solo lectura; no muta estado; no amplía alcance; no sustituye la verdad transaccional. |
| Pendiente | Catálogo de reportes, fórmulas, filtros y límites (`L-19`). |
| Corrección | Aprobar catálogo y límites; una proyección MongoDB requiere justificación concreta (`D-25`). |

### 6.12 `CT-12` — Persistencia SQL/MongoDB

| Aspecto | Definición |
|---|---|
| Frontera | Aplicación → repositorios SQL/MongoDB y `PO-15`/`PO-23`. |
| Estado | `ALINEADO_CON_PROPUESTA`. |
| Propiedad | SQL es fuente de verdad transaccional; MongoDB es complementaria para auditoría/proyecciones justificadas. |
| Consistencia | Sin transacción distribuida; outbox para coordinar; operaciones idempotentes. |
| Errores | Los definidos por cada `PO`; no se inventan códigos transversales. |
| Pendiente | Esquemas físicos, índices, migraciones y retención; no se crean en este documento. |
| Corrección | Definir contratos de datos y migraciones en una ejecución de implementación; no duplicar la verdad transaccional. |

### 6.13 `CT-13` — Tiempo del sistema

| Aspecto | Definición |
|---|---|
| Frontera | Aplicación → `PO-20` → reloj del sistema. |
| Estado | `ALINEADO`. |
| Entrada/salida | Sin datos de negocio → `Instant` UTC con precisión suficiente. |
| Errores | `NO_DISPONIBLE`. |
| Invariantes | UTC; sin ambigüedad de zona; no decide plazos ni formatea fechas. |
| Pendiente | Los plazos de negocio (`L-06`) no forman parte de este contrato. |
| Corrección | Ninguna para el contrato técnico. |

---

## 7. Desalineaciones y correcciones

### 7.1 `C-21` — Códigos y estados de adaptadores

Contract Alignment detectó seis desalineaciones documentales entre adaptadores y puertos. Se corrigieron sin modificar los puertos ni el dominio:

| Adaptador | Desalineación | Corrección aplicada |
|---|---|---|
| `ADOUT-01` | Añadía `NO_DISPONIBLE`, no declarado por `PO-01`…`PO-04`. | Se eliminó; la indisponibilidad se expresa con `FALLO_PERSISTENCIA`. |
| `ADOUT-06` | Añadía `FALLO_PERSISTENCIA`, no declarado por `PO-24`. | Se eliminó; `NO_DISPONIBLE` cubre la fuente no disponible. |
| `ADOUT-10` | Usaba `PENDIENTE`/`PROVISTO`/`EXPIRADO` y añadía `LIMITE_EXCEDIDO`. | Se alineó a `PROVISIONADO`/`FALLIDO`/`REVOCADO`; se eliminó el código extra. |
| `ADOUT-11` | Añadía `OPERACION_NO_SOPORTADA`, no declarado por `PO-20`. | Se eliminó; solo queda `NO_DISPONIBLE`. |
| `ADOUT-12` | No usaba `DATOS_INVALIDOS`/`CONFLICTO_UNICIDAD` y añadía códigos ajenos. | Se alineó exactamente a `NO_DISPONIBLE`, `DATOS_INVALIDOS`, `CONFLICTO_UNICIDAD`. |
| `ADOUT-13` | Añadía `FALLO_PROVEEDOR`, no declarado por `PO-22`. | Se eliminó; quedan `DATOS_INVALIDOS`, `NO_DISPONIBLE`, `OPERACION_NO_SOPORTADA`. |

**Resultado:** `C-21` queda resuelto documentalmente. La regla `D-27` prohíbe añadir códigos o estados no declarados por el puerto.

### 7.2 `C-20` — Verificación de webhooks

`PO-16`/`PO-17` atribuyen la verificación al adaptador de integración; `PI-15`/`PI-18` exigen un evento ya verificado. `D-26` mantiene la verificación en el límite HTTP antes de invocar el puerto de entrada, sin crear un puerto nuevo ni invertir dependencias. El mecanismo concreto sigue bloqueado por `L-22`/`L-23`.

### 7.3 Desalineaciones abiertas

No se encontraron contradicciones nuevas entre dominio, puertos, adaptadores y casos de uso después de `C-21`. Las ausencias restantes son contratos externos no aprobados, no contradicciones internas. Se registran como limitaciones, no como reglas inventadas.

---

## 8. Decisiones de Contract Alignment

| ID | Decisión | Justificación | Consecuencia |
|---|---|---|---|
| `D-27` | Los adaptadores usan exactamente los códigos y estados del puerto. | Evita semántica no aprobada y mantiene la trazabilidad. | `C-21` corregido; no se añaden códigos sin actualizar el puerto. |
| `D-28` | Contract Alignment es un documento de verificación y propuesta, no un contrato ejecutable. | `L-27` y los protocolos externos siguen abiertos. | No se crean OpenAPI, esquemas, SDKs ni clientes en esta ejecución. |
| `D-29` | El sobre de eventos propuesto se limita a los campos ya exigidos por `[MOD]` §20 y `PO-23`; el catálogo de eventos y payloads queda en `L-14`. | Permite verificar la cadena sin inventar eventos ni formatos. | `CT-02` queda `ALINEADO_CON_PROPUESTA`. |
| `D-30` | `CT-01` se marca `SIN_EVIDENCIA` y los flujos que lo usan `ALINEADO_CON_PROPUESTA`, no `ALINEADO`. | No hay OpenAPI aprobado; marcar alineado ocultaría un eslabón crítico. | La corrección es aprobar el contrato HTTP, no inventar rutas. |

---

## 9. Bloqueos reales

| ID | Bloqueo | Contratos afectados | Qué falta |
|---|---|---|---|
| `L-27` | No hay contrato HTTP/OpenAPI aprobado. | `CT-01` | Rutas, métodos, códigos, autenticación, versionado, esquemas y límites de tasa. |
| `L-14` | Catálogo de eventos y payloads incompleto. | `CT-02` | Eventos restantes, versiones, payloads, consumidores y retención. |
| `L-11`, `L-15` | Composición de auditoría y gravedad no cerradas. | `CT-03` | Campos exactos, mapeo de gravedad y política de fallo crítico. |
| `L-22` | Protocolo de pago no definido. | `CT-04` | Proveedor, autorización/captura, webhooks, reintentos y cancelación. |
| `L-23` | Integración logística no definida. | `CT-05` | Proveedor, tracking, evidencia y reintentos. |
| `L-24` | Notificaciones, canales y consentimiento no definidos. | `CT-06` | Canales, plantillas, consentimiento y límites. |
| `L-18` | Entrega digital no definida. | `CT-07` | Acceso/licencia, vigencia y evidencia. |
| `L-12`, `L-20` | Credenciales no definidas. | `CT-08` | Algoritmo, parámetros, fortaleza y verificación. |
| `L-13` | Formato de identificadores no definido. | `CT-09` | UUID, ULID, secuencia u otro mecanismo. |
| `L-17` | Numeración/serie fiscal no definida. | `CT-10` | Serie, formato, jurisdicción y corrección. |
| `L-19` | Catálogo de reportes no definido. | `CT-11` | Reportes, fórmulas, filtros y límites. |
| `L-26` | Asignación de operador no modelada. | `F-09` | Alcance autorizado para operadores. |
| `DEC-BIZ-01`…`DEC-BIZ-07` | Políticas variables no aprobadas. | Varios flujos | Dirección, plazo, motivos, bodega, moneda, estado comercial y autorización financiera. |

`L-25` no aparece como bloqueo de Contract Alignment: está cerrada a nivel de diseño por `D-16`; sus valores numéricos son configurables.

---

## 10. Trazabilidad

| Elemento | Fuente |
|---|---|
| Requisitos | `enunciado.md` OBJ-01…OBJ-12 |
| Dominio e invariantes | `[MOD]` §6–§24; `[VO]` §6–§9; `[DS]` DS-01…DS-09 |
| Casos de uso | `[UC]` `UC-01`, `UC-02` |
| Puertos de entrada | `[PI]` §2–§5, §7.3 |
| Puertos de salida | `[PO]` §2–§5, §7.1 |
| Adaptadores | `[AD]` catálogo y 14 documentos |
| HTTP y persistencia | `[ARQ]` §8, §9, §11.2, §16 |
| Eventos y auditoría | `[MOD]` §15.1, §20, §24; `[PO]` `PO-14`, `PO-23` |
| Método | `[PM]` §5.8 |
| Estado y bloqueos | `[EST]` §7, §8, §9 |

---

## 11. Criterios de validación

- [x] La cadena requisito → regla → dominio → caso de uso → `PI` → `PO` → adaptador → contrato está representada para los flujos importantes.
- [x] Cada contrato `CT-01`…`CT-13` tiene frontera, puertos, adaptador, estado y bloqueo.
- [x] Los estados distinguen `ALINEADO`, `ALINEADO_CON_PROPUESTA`, `SIN_EVIDENCIA`, `DESALINEADO` y `NO_APLICA`.
- [x] Ningún flujo se marca `ALINEADO` si falta el contrato HTTP, el protocolo externo o una decisión crítica.
- [x] Las seis desalineaciones `C-21` fueron corregidas en los adaptadores.
- [x] No se modificaron dominio, VOs, servicios, puertos, arquitectura ni casos de uso.
- [x] No se inventaron rutas, métodos, códigos HTTP, protocolos, algoritmos, formatos fiscales ni reportes.
- [x] No se creó código, OpenAPI ejecutable, esquema de eventos, SDK, DTO implementado ni prueba.
- [x] Los enlaces relativos del documento resuelven.
