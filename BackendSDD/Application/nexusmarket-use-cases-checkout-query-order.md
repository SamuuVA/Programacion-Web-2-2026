# NEXUSMARKET — Casos de uso: checkout y consulta de pedido

**Código documental:** `NM-SDD-APP-UC-01-02`
**Versión:** 1.0
**Fecha:** 26 de octubre de 2026
**Estado del documento:** `COMPLETO`
**Estado de la definición:** checkout `Confirmado` con limitaciones de política; consulta `Inferido` con limitaciones de alcance y paginación.
**Responsable documental:** no registrado en las fuentes.
**Ámbito:** capa de aplicación de NEXUSMARKET; coordinación de los casos de uso `UC-01 Checkout` y `UC-02 QueryOrder`.
**Raíz documental:** `BackendSDD/`.
**Documentos hermanos:** [`nexusmarket-input-ports.md`](nexusmarket-input-ports.md) y [`nexusmarket-output-ports.md`](nexusmarket-output-ports.md).

> `COMPLETO` significa que el documento cubre el objetivo, distingue hechos, inferencias, decisiones de diseño y límites, y no omite secciones evitables. No significa que el negocio haya aprobado `DEC-BIZ-01`…`DEC-BIZ-07`, ni que los protocolos concretos de pago, facturación o logística estén cerrados.

---

## 1. Propósito y límites

### 1.1 Propósito

Definir, en lenguaje conceptual y verificable, cómo la capa de aplicación coordina:

1. **`UC-01 Checkout`**, expuesto por el puerto de entrada `PI-12`, para confirmar la compra de un carrito, crear uno o varios pedidos, reservar inventario físico, iniciar el pago y compensar fallos.
2. **`UC-02 QueryOrder`**, expuesto por el puerto de entrada `PI-13`, para consultar pedidos y sus resúmenes asociados según el alcance autorizado, sin mutar estado.

El documento toma `PI-11` (`ManageCart`) como capacidad upstream: el carrito y sus líneas son producidos por ese puerto y este documento no redefine su contrato. `PI-12` y `PI-13` son los contratos de entrada de los casos de uso aquí especificados.

### 1.2 Qué responde

- Quién puede iniciar cada caso de uso y sobre qué recurso.
- Qué datos conceptuales recibe y cómo se interpretan.
- Qué precondiciones, invariantes y reglas de dominio se preservan.
- Cuál es el flujo normal, los flujos alternativos y los fallos relevantes.
- Qué cambia y qué no cambia.
- Qué ocurre ante repetición, concurrencia, fallo parcial y dependencia externa caída.
- Qué puertos de salida se consumen y qué resultado observa el consumidor.
- Qué datos son históricos/inmutables y cuáles son proyecciones.
- Qué queda bloqueado por decisiones externas y qué puede implementarse sin inventar reglas.

### 1.3 Qué no responde

Este documento **no** define:

- rutas HTTP, controladores, DTOs de transporte, códigos HTTP ni esquemas OpenAPI;
- firmas TypeScript, clases, interfaces ejecutables, SQL, colecciones MongoDB, índices ni migraciones;
- el protocolo concreto de un proveedor de pagos o de un transportista;
- la numeración o serie fiscal de facturas;
- el proceso de cierre `ENTREGADO → CERRADO`, la cancelación posterior al pago, la devolución o el reembolso completos;
- la interfaz de usuario ni la política comercial de precios, impuestos, descuentos, envío o dirección.

Los casos de uso **no** contienen reglas de negocio duplicadas: invocan `DS-01`, `DS-03`, `DS-04`, `DS-05`, `DS-06` y `DS-09`, y usan los puertos de salida para persistir y consultar.

---

## 2. Autoridad, fuentes y convenciones

### 2.1 Jerarquía de fuentes

| Nivel | Fuente | Uso en este documento |
|---|---|---|
| Negocio y dominio | `[MOD]` y `[VO]` | Autoridad sobre agregados, invariantes, estados y objetos de valor. |
| Reglas de dominio | `[DS]` y definiciones `DS-01`…`DS-09` | Autoridad sobre autorización, reserva, asignación, cálculo, transiciones y auditoría. |
| Arquitectura | `[ARQ]` | Autoridad sobre capas, dependencias, transacciones y puertos. |
| Contratos de aplicación | `[PI]` y `[PO]` | Contratos de entrada y salida ya documentados; este documento no los redefine salvo las conciliaciones `C-16`/`C-19` y la precisión de lista/detalle `D-20`. |
| Requisitos | `[ENU]` | Objetivos y restricciones funcionales. |
| Gobierno documental | `[PM]` | Estados, calidad y plantilla. |
| Continuidad | `[EST]` | Decisiones, limitaciones y bloqueos vigentes. |

### 2.2 Fuentes consultadas

| Abreviatura | Documento | Secciones relevantes |
|---|---|---|
| `[ENU]` | [`../enunciado.md`](../enunciado.md) | OBJ-07, OBJ-08, OBJ-09, OBJ-10, OBJ-12; Dominios 6, 7, 9 y 10. |
| `[MOD]` | [`../Domain/nexusmarket-domain-model.md`](../Domain/nexusmarket-domain-model.md) | §9.1–§9.4, §10.1–§10.4, §11.1, §12.1, §13.1–§13.3, §14, §15.1, §18, §19, §22.3–§22.5, §24. |
| `[VO]` | [`../Domain/nexusmarket-domain-object-values.md`](../Domain/nexusmarket-domain-object-values.md) | §6.5, §6.7, §7.1, §7.3, §7.5, §8.11, §8.12, §8.14, §8.17, §8.18, §9.6. |
| `[DS]` | [`../Domain/nexusmarket-domain-services.md`](../Domain/nexusmarket-domain-services.md) | §3, §4.1, §4.3–§4.6, §4.9, §5.1, §5.3, §6 y §7. |
| `DS-01` | [`../Domain/services/politica-autorizacion-dominio.md`](../Domain/services/politica-autorizacion-dominio.md) | §5, §7, §8, §10 y §12. |
| `DS-03` | [`../Domain/services/servicio-reserva-inventario.md`](../Domain/services/servicio-reserva-inventario.md) | §5, §7, §8 y §10. |
| `DS-04` | [`../Domain/services/servicio-asignacion-bodega.md`](../Domain/services/servicio-asignacion-bodega.md) | §5, §7, §8 y §10. |
| `DS-05` | [`../Domain/services/servicio-calculo-pedido.md`](../Domain/services/servicio-calculo-pedido.md) | §5, §7, §8 y §10. |
| `DS-06` | [`../Domain/services/politica-transicion-pedido.md`](../Domain/services/politica-transicion-pedido.md) | §5, §7, §8 y §10. |
| `DS-09` | [`../Domain/services/servicio-auditoria.md`](../Domain/services/servicio-auditoria.md) | §5, §7, §8 y §10. |
| `[ARQ]` | [`../Software%20Architecture/nexusmarket-arquitectura.md`](../Software%20Architecture/nexusmarket-arquitectura.md) | §4, §5, §7, §9.4 y §16. |
| `[PI]` | [`nexusmarket-input-ports.md`](nexusmarket-input-ports.md) | §3, §5.4, §5.5, §7.3 y §9. |
| `[PO]` | [`nexusmarket-output-ports.md`](nexusmarket-output-ports.md) | §3, §5.1–§5.5, §7.1–§7.3 y §9. |
| `[PM]` | [`../Prompt-maestro-documentacion.md`](../Prompt-maestro-documentacion.md) | §4.2, §5.3, §5.4, §6 y §8. |
| `[EST]` | [`../DOCUMENTATION_STATUS.md`](../DOCUMENTATION_STATUS.md) | §6–§9 y §13. |

### 2.3 Convenciones

- Los nombres de puertos se mantienen en inglés; los conceptos de dominio, en español.
- `Confirmado`: respaldado directamente por una fuente.
- `Inferido`: derivado de responsabilidades y reglas documentadas; requiere validación al implementar.
- `Decisión de diseño`: elección técnica del agente dentro de su autoridad; no es una regla de negocio aprobada.
- `Limitado`: el caso de uso puede especificarse, pero una política o detalle externo no está definido.
- Los códigos `UC-01` y `UC-02` son identificadores documentales estables; no son rutas ni nombres de clases.
- Los nombres de eventos son ilustrativos: el catálogo normativo de eventos no está fijado (`L-14`).

### 2.4 Terminología canónica

| Término | Significado | Sinónimos prohibidos o legados |
|---|---|---|
| `Checkout` | Confirmación de compra de un carrito; coordinación, no entidad persistente. | «carrito» como estado de pedido. |
| `Pedido` | Compromiso comercial de un comprador con un solo vendedor. | `FINALIZADO` como estado; `CARRITO` como estado. |
| `Pago` | Intento u operación financiera asociada a un pedido. | `APROBADO` como equivalente de `CAPTURADO`. |
| `ReservaInventario` | Compromiso de cantidad por variante y bodega, con vigencia. | reserva como simple descuento de stock. |
| `checkoutGroupId` | Identificador que agrupa pedidos creados en una misma confirmación de carrito. | pedido único multi-vendedor. |
| `QueryOrder` | Consulta de pedidos y resúmenes asociados, solo lectura. | consulta de auditoría o reporte administrativo. |
| `EstadoPedido` | Ciclo comercial del pedido: `PENDIENTE_DE_PAGO`, `PAGADO`, `EN_PREPARACION`, `DESPACHADO`, `ENTREGADO`, `CANCELADO`, `CERRADO`. | `CARRITO`, `FINALIZADO`. |
| `EstadoPago` | Estado financiero: `PENDIENTE`, `AUTORIZADO`, `CAPTURADO`, `RECHAZADO`, `CANCELADO`, `REEMBOLSO_PARCIAL`, `REEMBOLSADO`. | `APROBADO`. |
| `EstadoComercial` | Condición del comprador: `HABILITADO`, `RESTRINGIDO`, etc. | estado de cuenta. |
| `TipoEntrega` | `FISICA` o `DIGITAL`, congelado en la compra. | `MetodoEntrega`. |

---

## 3. Contexto y responsabilidades

### 3.1 Posición en la arquitectura

`UC-01` y `UC-02` pertenecen al módulo lógico `orders` y a la capa de aplicación. Su responsabilidad es coordinar; no sustituyen al dominio ni a los adaptadores.

```text
Adaptador de entrada
        │
        ▼
PI-11 ManageCart ───────────────► Carrito
        │                              │
        │                              ▼
        └────────────────────────► PI-12 Checkout
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  ▼
                 Pedido(s)          Pago(s)          Reserva(s)
                    │
                    ▼
PI-13 QueryOrder ◄───────────── vista de pedido
```

### 3.2 Responsabilidades de la aplicación

1. Recibir el contexto autenticado y verificar autorización con `DS-01`.
2. Recuperar agregados mediante `[PO]`.
3. Revalidar datos volátiles antes de mutar.
4. Invocar los servicios de dominio en el orden correcto.
5. Delimitar la unidad de trabajo y la compensación.
6. Persistir cambios y registrar auditoría/outbox.
7. Traducir fallos técnicos a resultados de aplicación seguros.
8. Devolver un resultado conceptual, sin exponer detalles de persistencia ni del proveedor.

### 3.3 Separación respecto del dominio

- `DS-05` calcula importes; el caso de uso no suma precios por su cuenta.
- `DS-04` propone una asignación factible; el caso de uso no elige una bodega «óptima» sin política.
- `DS-03` decide y aplica la reserva; el caso de uso no modifica saldos directamente.
- `DS-06` decide transiciones; el caso de uso no cambia `EstadoPedido` por asignación directa.
- `DS-09` construye evidencia; el caso de uso la persiste y garantiza durabilidad crítica.
- `QueryOrder` no invoca servicios con efecto ni modifica agregados.

---

## 4. Inventario de casos de uso

| ID | Caso de uso | Puerto de entrada | Módulo | Actor principal | Resultado observable | Estado |
|---|---|---|---|---|---|---|
| `UC-01` | Confirmar compra (`Checkout`) | `PI-12` | `orders` | Comprador propietario | Pedidos, pagos y reservas creados; carrito convertido; pago pendiente | `Confirmado` con limitaciones |
| `UC-02` | Consultar pedido (`QueryOrder`) | `PI-13` | `orders` | Comprador, vendedor, Administrador, Supervisor u operador asignado | Vista de pedido(s) y resúmenes, sin mutación | `Inferido` con limitaciones |
| — | Gestionar carrito (upstream) | `PI-11` | `cart` | Comprador propietario | Carrito editable; no reserva stock ni garantiza precio | Fuera de alcance; contrato en `[PI]` |

**Relación:** `UC-01` consume el estado producido por `PI-11`; no reimplementa agregar, actualizar, quitar, vaciar o consultar líneas. `UC-02` puede consultar pedidos creados por `UC-01` y por los flujos posteriores de pago, despacho, facturación y posventa.

---

## 5. Contexto común

### 5.1 Actores y autorización

La autorización se evalúa con `DS-01` y con datos vigentes. El adaptador autentica y construye el contexto; el caso de uso no confía en identificadores de rol enviados en el cuerpo de la solicitud.

| Actor | `UC-01` | `UC-02` |
|---|---|---|
| `COMPRADOR` | Solo su propio carrito; cuenta `ACTIVO` y estado comercial `HABILITADO`. | Solo pedidos donde es `compradorId`; puede consultar su historial aunque esté `RESTRINGIDO`. |
| `VENDEDOR` | No inicia checkout. | Solo pedidos donde es `vendedorId`; no puede ampliar el alcance. |
| `ADMINISTRADOR` | No inicia checkout en nombre del comprador sin una decisión adicional. | Todos los pedidos; solo lectura. |
| `SUPERVISOR` | No inicia checkout. | Todos los pedidos; solo lectura; no modifica estados ni datos. |
| `OPERADOR_LOGISTICO` | No inicia checkout. | Solo pedidos/envíos asignados; la fuente de asignación no está modelada (`L-26`). |
| Cuenta `INACTIVO` o `BLOQUEADO` | Denegado. | Denegado. |

**Reglas aplicables:** `RG-01`, `RG-02`, `RG-03`, `USR-03`, `USR-04`, `SUP-01`, `AUT-01`…`AUT-07`. La decisión se revalida dentro de la operación que muta estado (`DS-01` §10).

### 5.2 Contexto de invocación

| Dato | Obligatorio | Uso |
|---|---:|---|
| `actorId` | Sí | Identidad autenticada. |
| `rolActor` | Sí | Rol único vigente. |
| `correlationId` | Sí | Trazabilidad de la operación y de la auditoría. |
| `idempotencyKey` | Solo `UC-01` | Evita duplicar pedidos, reservas y pagos por reintento. |
| `canal` / `origen` | No | Metadato de observabilidad; no es regla de negocio. |

### 5.3 Errores comunes

| Código | Significado | Uso |
|---|---|---|
| `NO_AUTORIZADO` | El actor no tiene la capacidad o el vínculo requerido. | Ambos casos. |
| `RECURSO_NO_ENCONTRADO` | El recurso no existe o no es visible para el actor. | Ambos casos; evita enumeración. |
| `VALIDACION_INVALIDA` | Datos de entrada inválidos. | Ambos casos. |
| `CONFLICTO_CONCURRENCIA` | El estado cambió desde la lectura. | `UC-01`; lectura no aplica. |
| `IDEMPOTENCIA_CONFLICTO` | La clave se usó con otro contenido. | `UC-01`. |
| `DEPENDENCIA_NO_DISPONIBLE` | Persistencia o proveedor no disponible. | `UC-01`; en `UC-02`, fallo de lectura. |
| `LIMITE_EXCEDIDO` | Se superó un límite de página o tiempo. | `UC-02`. |

### 5.4 Transacción y consistencia

- `UC-01` usa una unidad de trabajo SQL para los cambios relacionados: reservas, pedidos, pagos, auditoría y outbox. No incluye llamadas a proveedores externos.
- `UC-01` no intenta una transacción distribuida entre SQL, MongoDB y el proveedor de pagos.
- `UC-02` es solo lectura; no abre una unidad de trabajo de escritura.
- La auditoría crítica y el evento de outbox se escriben en la misma transacción que la mutación, cuando la política lo exige (`DS-09`, `PO-23`).
- La política concreta de aislamiento, timeout y reintento se registra en `D-16`.

### 5.5 Auditoría, outbox y observabilidad

| Elemento | `UC-01` | `UC-02` |
|---|---|---|
| Auditoría de negocio | Obligatoria para creación, reserva, compensación y fallo relevante. | No forma parte del contrato actual de `PI-13`; una auditoría de accesos requeriría una decisión adicional. |
| Outbox | Obligatorio para eventos críticos; se escribe en la misma transacción. | No aplica. |
| Logs | Sin datos de tarjeta, secretos ni payloads completos. | Sin datos personales innecesarios. |
| Métricas | Checkout iniciado, completado, rechazado, compensado, ambiguo. | Consultas, latencia, rechazos por alcance y página. |
| Correlación | Se propaga a puertos, auditoría y eventos. | Se propaga a la consulta y a los logs. |

---

## 6. UC-01 — Checkout

### 6.1 Identificación

| Campo | Valor |
|---|---|
| ID | `UC-01` |
| Nombre | Confirmar compra (`Checkout`) |
| Puerto de entrada | `PI-12` |
| Módulo | `orders` |
| Tipo | Caso de uso de comando con efecto |
| Resultado | Pedido(s) `PENDIENTE_DE_PAGO`, pago(s) `PENDIENTE`, reservas físicas `ACTIVA`, carrito convertido |
| Estado | `Confirmado` con limitaciones `L-01`, `L-04`, `L-05`, `L-07`, `L-22`, `L-25` |

### 6.2 Objetivo y resultado observable

Confirmar la compra de un carrito válido y dejar la operación lista para el pago, sin capturarlo. El comprador observa:

- un `checkoutGroupId`;
- uno o varios pedidos, uno por vendedor;
- un pago pendiente por pedido;
- las reservas de inventario creadas para líneas físicas;
- el carrito vacío o marcado como convertido;
- un resultado de confirmación, rechazo o error con correlación.

### 6.3 Actores y permisos

- **Actor iniciador:** comprador autenticado y propietario del carrito.
- **Precondiciones de identidad:** cuenta `ACTIVO`, rol `COMPRADOR`, estado comercial `HABILITADO`.
- **Denegaciones:** comprador `RESTRINGIDO` (`AUT-04`), cuenta inactiva/bloqueada (`USR-04`), carrito ajeno (`CAR-01`).
- **No permitido:** que un Administrador, Vendedor, Supervisor u Operador inicie el checkout en nombre del comprador sin una decisión de negocio adicional.

### 6.4 Disparador

El comprador confirma el carrito después de revisar el total. Si el total recalculado difiere del mostrado, la operación se detiene y devuelve `CONFIRMACION_REQUERIDA`; no cobra silenciosamente (`CAR-07`).

### 6.5 Precondiciones

| ID | Precondición | Fuente |
|---|---|---|
| `PRE-UC01-01` | Actor autenticado con rol `COMPRADOR`. | `RG-01`, `RG-02` |
| `PRE-UC01-02` | Cuenta `ACTIVO` y estado comercial `HABILITADO`. | `[MOD]` §9.4; `AUT-04`; `USR-04` |
| `PRE-UC01-03` | Carrito propio, activo y no vacío. | `CAR-01`, `CAR-04`; `[MOD]` §9.1–§9.3 |
| `PRE-UC01-04` | Variantes vendibles: producto publicado, variante activa, vendedor activo. | `CAR-02`, `CAR-05`; `DS-02` |
| `PRE-UC01-05` | Dirección válida y propia si hay al menos una línea física. | `ORD-07`; `[MOD]` §10.1 |
| `PRE-UC01-06` | Disponibilidad suficiente para todas las líneas físicas. | `INV-03`; `WH-06` |
| `PRE-UC01-07` | Referencia de instrumento de pago disponible; nunca datos completos de tarjeta. | `[MOD]` §11.1; `PAY-06` |
| `PRE-UC01-08` | Total confirmado si cambió desde la última consulta. | `CAR-07` |
| `PRE-UC01-09` | `idempotencyKey` presente y válida. | `PI-12`; `INV-VO-IDK-01` |
| `PRE-UC01-10` | Política de expiración de reserva disponible. | `DS-03` `PRE-DS03-06` |

### 6.6 Entrada conceptual

| Campo | Obligatorio | Tipo conceptual | Regla |
|---|---:|---|---|
| `actorId`, `rolActor`, `correlationId` | Sí | Contexto | Comprador autenticado. |
| `carritoId` | No | `CarritoId` | Si se omite, se usa el carrito activo del comprador. |
| `direccionEntregaId` | Condicional | Identificador de dirección | Obligatoria si hay productos físicos; debe pertenecer al comprador. |
| `referenciaInstrumentoPago` | Condicional | Referencia opaca | Necesaria para iniciar el pago; no contiene datos completos de tarjeta. |
| `confirmacionTotal` | No | Booleano o referencia | Requerida si el total recalculado difiere del mostrado. |
| `idempotencyKey` | Sí | `IdempotencyKey` | Evita duplicar pedidos, reservas y pagos. |

**Dependencia upstream `PI-11`:** las líneas, cantidades, precios referenciales y versión del carrito provienen de `ManageCart`. `UC-01` no agrega, modifica ni quita líneas; solo lee y revalida. El carrito no reserva stock ni garantiza precio (`CAR-06`).

### 6.7 Salida conceptual

| Resultado | Contenido | Condición |
|---|---|---|
| `EXITO` | `checkoutGroupId`; pedidos (`pedidoId`, `vendedorId`, `estado = PENDIENTE_DE_PAGO`, `total`); pagos (`pedidoId`, `pagoId`, `estado = PENDIENTE`); reservas creadas; carrito convertido | Checkout completo. |
| `CONFIRMACION_REQUERIDA` | Total recalculado, diferencias y referencia de confirmación | El precio cambió y se requiere aceptación (`CAR-07`). |
| `RECHAZO` | `codigo`, `mensaje`, `detalles` | Autorización, vendibilidad, dirección, stock o validación. |
| `ERROR` | `codigo`, `mensaje`, `correlationId`, estado de compensación | Fallo técnico o dependencia no disponible. |

**Conciliación `C-16`:** el modelo exige `Pago.pedidoId`; por tanto, un checkout multi-vendedor produce **un pago por pedido**, no un pago único por `checkoutGroupId`. La lista de pagos es parte del resultado. Un pago único para todo el grupo exigiría cambiar el modelo y no se adopta aquí.

### 6.8 Flujo principal

1. Recibir el contexto y verificar identidad, rol y estado de la cuenta.
2. Invocar `DS-01` para autorizar «crear pedido» sobre el carrito propio.
3. Resolver el carrito: por `carritoId` o por carrito activo del comprador. Verificar propiedad y versión.
4. Verificar que el carrito tenga al menos una línea (`CAR-04`).
5. Revalidar cada línea: producto publicado, variante activa, vendedor activo, cantidad positiva, tipo de entrega y precio vigente (`CAR-05`).
6. Si el precio o la composición cambiaron, recalcular y devolver `CONFIRMACION_REQUERIDA`; no persistir nada. Si el comprador confirma, repetir la operación con `confirmacionTotal`.
7. Validar la dirección de entrega cuando haya líneas físicas; verificar que pertenezca al comprador y que sea utilizable. Para carritos solo digitales, no exigir dirección (`ORD-07`, `LOG-01`).
8. Agrupar las líneas por `vendedorId`; generar `checkoutGroupId` y un `PedidoId` por grupo antes de reservar (`PO-21`).
9. Invocar `DS-05` por cada grupo de vendedor para calcular subtotal, descuentos, impuestos, envío y total, con moneda explícita y política de redondeo (`MON-01`…`MON-12`).
10. Para líneas físicas, invocar `DS-04` con bodegas y posiciones; obtener una propuesta factible. Si no hay cobertura total, rechazar sin crear pedido pagable parcial (`WH-06`).
11. Abrir la unidad de trabajo SQL. Revalidar la versión del carrito, la composición, el precio y la disponibilidad; si cambió el precio o la composición, abortar con `CONFIRMACION_REQUERIDA`; si cambió la versión o la disponibilidad, abortar con `CONFLICTO_CONCURRENCIA`.
12. Invocar `DS-03` para reservar cada posición física con clave idempotente y `expiraEn`; si una reserva falla, revertir la unidad y no crear pedidos.
13. Crear los pedidos con snapshots de nombre, SKU, vendedor, tipo de entrega, cantidad, precio, descuento, impuesto, total de línea, dirección y moneda; estado inicial `PENDIENTE_DE_PAGO`; `estadoPago = PENDIENTE` (`[MOD]` §10.1–§10.3).
14. Crear un `Pago` `PENDIENTE` por pedido, con importe, moneda, proveedor y clave idempotente de pago; escribir auditoría y eventos de outbox en la misma unidad de trabajo (`DS-09`, `PO-23`).
15. Confirmar la unidad de trabajo. Si falla la persistencia, revertir; si ya había reservas confirmadas, ejecutar compensación idempotente.
16. Solicitar la iniciación del pago al `PaymentGateway` por cada pedido, fuera de la transacción SQL, con la clave idempotente de pago derivada por pedido. No capturar el pago.
17. Si el proveedor acepta o deja el pago `PENDIENTE`, marcar el carrito como convertido/vacío de forma idempotente y registrar el evento. Si el proveedor rechaza de forma inequívoca, registrar el pago como `RECHAZADO`, compensar pedidos y reservas y devolver `DEPENDENCIA_NO_DISPONIBLE`.
18. Si la respuesta del proveedor es ambigua (timeout, error de red, respuesta no verificable), **no compensar a ciegas**: consultar por la clave idempotente/referencia. Si no se puede resolver, dejar el pago `PENDIENTE`, conservar las reservas y el carrito, y marcar la operación para conciliación; no declarar éxito ni liberar stock.
19. Devolver el resultado con pedidos, pagos, reservas y `checkoutGroupId`.

> **Secuencia de estados:** el checkout solo crea pedidos en `PENDIENTE_DE_PAGO`. No los pasa a `PAGADO`; eso ocurre en `PI-15 ConfirmPayment` cuando exista confirmación verificable (`ORD-02`, `PAY-01`). No emite factura, no despacha y no entrega bienes digitales.

### 6.9 Flujos alternativos y fallos

| ID | Situación | Resultado | Efecto |
|---|---|---|---|
| `ALT-UC01-01` | Carrito vacío | `RECHAZO` `REGLA_NEGOCIO_INCUMPLIDA` (`CAR-04`) | Sin cambios. |
| `ALT-UC01-02` | Comprador `RESTRINGIDO` o cuenta no activa | `NO_AUTORIZADO` | Sin cambios. |
| `ALT-UC01-03` | Carrito ajeno o inexistente | `NO_AUTORIZADO` o `RECURSO_NO_ENCONTRADO` | Sin cambios. |
| `ALT-UC01-04` | Variante no vendible, producto no publicado o vendedor inactivo | `RECHAZO` `REGLA_NEGOCIO_INCUMPLIDA` | Sin cambios. |
| `ALT-UC01-05` | Precio cambió | `CONFIRMACION_REQUERIDA` | Sin cambios; el comprador decide. |
| `ALT-UC01-06` | Falta dirección para línea física | `RECHAZO` `REGLA_NEGOCIO_INCUMPLIDA` | Sin cambios. |
| `ALT-UC01-07` | Stock insuficiente o bodega no elegible | `RECHAZO` `REGLA_NEGOCIO_INCUMPLIDA` / `CONFLICTO_CONCURRENCIA` | Sin pedido pagable parcial; sin reservas huérfanas. |
| `ALT-UC01-08` | Dos checkouts compiten por la última unidad | Uno gana; el otro `CONFLICTO_CONCURRENCIA` | Sin doble reserva. |
| `ALT-UC01-09` | Reintento con la misma clave y mismo contenido | Devuelve el mismo resultado (`YA_APLICADA`) | Sin duplicar pedidos, reservas ni pagos. |
| `ALT-UC01-10` | Reintento con la misma clave y contenido distinto | `IDEMPOTENCIA_CONFLICTO` | Sin cambios. |
| `ALT-UC01-11` | Falla la creación de pedido/pago después de reservar | `ERROR`; compensación idempotente | Reservas liberadas; sin pedido pagable parcial. |
| `ALT-UC01-12` | El proveedor de pago rechaza | `ERROR` `DEPENDENCIA_NO_DISPONIBLE`; compensación | Pago `RECHAZADO`; pedidos cancelados; reservas liberadas; carrito conservado. |
| `ALT-UC01-13` | El proveedor de pago no responde o la respuesta es ambigua | `ERROR`; pago `PENDIENTE`; operación marcada para conciliación | No se libera stock ni se declara éxito; carrito conservado; se reconcilia. |
| `ALT-UC01-14` | Falla la auditoría/outbox crítica | `ERROR`; rollback | No se confirma la mutación sin evidencia durable. |
| `ALT-UC01-15` | Falla el vaciado del carrito después de crear pedidos | `EXITO` con advertencia operativa; reintento idempotente | Los pedidos y pagos permanecen; el carrito se limpia después. |
| `ALT-UC01-16` | La reserva expira antes del pago | Fuera de `UC-01`; proceso de expiración/cancelación | `PI-14` o proceso programado libera y cancela; no se reutiliza la reserva. |

### 6.10 Comportamientos de dominio invocados

| Servicio | Uso en `UC-01` | Límite |
|---|---|---|
| `DS-01` | Autorizar comprador, propiedad del carrito y capacidad de crear pedido. | No autentica; el adaptador lo hace. |
| `DS-03` | Reservar, liberar y expirar inventario de forma atómica e idempotente. | No elige bodega ni crea pedido. |
| `DS-04` | Proponer asignación factible de líneas físicas a bodegas elegibles. | No reserva ni persiste; no decide preferencia comercial. |
| `DS-05` | Calcular importes y verificar moneda/redondeo. | No cobra, no factura, no reserva. |
| `DS-06` | Validar la creación en `PENDIENTE_DE_PAGO` y las transiciones posteriores. | No aplica la transición; la aplica el agregado. |
| `DS-09` | Construir evidencia de creación, reserva, compensación y rechazo. | No persiste; la aplicación lo hace. |

### 6.11 Invariantes

| ID | Invariante | Verificación |
|---|---|---|
| `INV-UC01-01` | Solo el comprador propietario confirma su carrito. | `CAR-01`, `DS-01`. |
| `INV-UC01-02` | No se confirma un carrito vacío. | `CAR-04`. |
| `INV-UC01-03` | Un carrito activo por comprador. | `[MOD]` §9.1; `PO-07`. |
| `INV-UC01-04` | Un pedido por vendedor; al menos una línea por pedido. | `[MOD]` §9.4, §10.1. |
| `INV-UC01-05` | Todos los pedidos del grupo comparten `checkoutGroupId`. | `[MOD]` §9.4. |
| `INV-UC01-06` | Los snapshots de pedido son inmutables y no se recalculan desde el catálogo actual. | `[MOD]` §10.1–§10.2; `CAT-06`. |
| `INV-UC01-07` | `total = subtotal - descuentos + costoEnvio + impuestos`; nunca negativo. | `MON-01`, `MON-07`. |
| `INV-UC01-08` | Un pedido físico exige dirección válida; uno digital no crea envío físico. | `ORD-07`, `LOG-01`. |
| `INV-UC01-09` | Las reservas físicas quedan `ACTIVA` y referencian el pedido; las digitales no reservan stock. | `DS-03`; `[MOD]` §8.2.3. |
| `INV-UC01-10` | No se crea un pedido pagable parcialmente por stock insuficiente. | `WH-06`, `[MOD]` §22.3. |
| `INV-UC01-11` | El pago queda `PENDIENTE`; no se marca `CAPTURADO` sin confirmación verificable. | `ORD-02`, `PAY-01`. |
| `INV-UC01-12` | Reintentos con la misma clave no duplican pedidos, reservas ni pagos. | `INV-06`; `[VO]` §7.5. |
| `INV-UC01-13` | No se almacenan datos completos de tarjeta ni secretos. | `PAY-06`. |
| `INV-UC01-14` | La auditoría/outbox crítica se escribe en la misma transacción que la mutación. | `DS-09`, `PO-23`. |

### 6.12 Cambios y no cambios

| Concepto | Cambia | Detalle |
|---|---|---|
| `Carrito` | Sí | Se marca convertido o se vacía después del éxito; no se modifica por un checkout rechazado. |
| `Pedido` | Sí | Se crea uno por vendedor en `PENDIENTE_DE_PAGO` con snapshots. |
| `ItemPedido` | Sí | Se crea con snapshots de nombre, SKU, vendedor, tipo de entrega, cantidad e importes. |
| `Pago` | Sí | Se crea uno por pedido en `PENDIENTE`; no se captura. |
| `ReservaInventario` | Sí | Se crea `ACTIVA` para líneas físicas; se libera si hay compensación. |
| `Inventario` | Sí | `reserved += cantidad` y movimiento `RESERVA` por posición. |
| `Factura` | No | No se emite; pertenece a `PI-19`/`PI-20` y a `L-17`. |
| `Envio` | No | No se crea; la preparación/despacho pertenece a `PI-16`/`PI-17`. |
| `Devolucion` / `Reembolso` | No | No se crean. |
| `EstadoPedido` posterior | No | Solo se crea el estado inicial; las transiciones posteriores usan `PI-15`…`PI-18`. |

### 6.13 Idempotencia y concurrencia

**Idempotencia**

- La clave se interpreta en el ámbito `comprador + operación + carrito`.
- Misma clave y mismo contenido: devolver el resultado ya producido, sin duplicar pedidos, reservas, pagos ni movimientos.
- Misma clave y contenido incompatible: `IDEMPOTENCIA_CONFLICTO`.
- Las claves de reserva, pago y evento son independientes y también idempotentes. La clave de pago se deriva por pedido a partir de la operación; el algoritmo exacto no se fija aquí. La clave de checkout sigue siendo la del reintento global.
- La compensación usa claves idempotentes; liberar dos veces la misma reserva no reduce el saldo dos veces (`INV-06`, `INV-07`).

**Concurrencia**

- El carrito tiene versión; si cambia entre la lectura y la confirmación, se aborta con `CONFLICTO_CONCURRENCIA`.
- El precio y la composición se revalidan antes de confirmar; un cambio exige `CONFIRMACION_REQUERIDA`.
- La reserva se aplica de forma atómica por posición; dos checkouts no pueden reservar la misma unidad (`DM-10`).
- La creación de pedidos y pagos usa restricciones de unicidad y control de versión.
- Una confirmación de pago duplicada no duplica la transición (`ORD-06`, `PAY-03`).

### 6.14 Transacción, compensación y consistencia

**Unidad de trabajo principal (`T1`)**

Incluye, de forma conceptual:

1. revalidación de la versión del carrito, la composición, el precio y la disponibilidad;
2. reservas físicas;
3. creación de pedidos y líneas;
4. creación de pagos `PENDIENTE`;
5. auditoría y eventos de outbox.

`T1` no incluye la llamada al proveedor de pagos. Si `T1` falla, se revierte completa; si alguna reserva ya se había confirmado por una operación previa, se compensa con `DS-03`.

**Llamada externa**

Se realiza después de `T1`, por cada pedido, con la clave idempotente de pago derivada por pedido. El proveedor no modifica directamente el dominio.

**Compensación (`T2`)**

Se ejecuta si el proveedor rechaza de forma inequívoca o si falla una etapa posterior a la reserva que impide continuar:

1. marcar el pago como `RECHAZADO`/`CANCELADO` según corresponda;
2. cancelar los pedidos creados;
3. liberar las reservas activas de forma idempotente;
4. registrar auditoría/outbox de la compensación;
5. conservar el carrito para que el comprador pueda reintentar.

**Respuesta ambigua**

Si el proveedor no responde o la respuesta no es verificable, no se compensa a ciegas. Se consulta por la clave idempotente/referencia; si persiste la duda, el pago queda `PENDIENTE` y la operación se marca para conciliación. No se declara éxito ni se libera stock sin evidencia.

**Expiración**

La reserva tiene `expiraEn`; la política temporal no está fijada. Si el pago no se confirma antes de la expiración, un proceso posterior (`PI-14` o programado) cancela el pedido y libera la reserva. `UC-01` no inventa el plazo.

### 6.15 Puertos de salida requeridos

La matriz `PI-12 → PO` de `[PI]` §7.3 se conserva:

| Puerto | Uso en `UC-01` |
|---|---|
| `PO-02 BuyerRepository` | Perfil, direcciones y estado comercial del comprador. |
| `PO-03 SellerRepository` | Estado y datos del vendedor; validación de vendedor activo. |
| `PO-04 WarehouseRepository` | Bodegas candidatas para `DS-04`. |
| `PO-05 ProductRepository` | Producto/variante, precio y tipo de entrega vigentes. |
| `PO-06 InventoryRepository` | Posiciones, reservas y movimientos atómicos. |
| `PO-07 CartRepository` | Carrito, líneas y versión. |
| `PO-08 OrderRepository` | Persistencia de pedidos y líneas. |
| `PO-09 PaymentRepository` | Persistencia de pagos e idempotencia. |
| `PO-14 AuditLogRepository` | Evidencia append-only. |
| `PO-15 TransactionManager` | Unidad de trabajo y compensación. |
| `PO-16 PaymentGateway` | Iniciación, consulta y cancelación de pago. |
| `PO-18 NotificationSender` | Notificación operativa cuando la política lo requiera (`L-24`). |
| `PO-20 Clock` | Timestamps UTC. |
| `PO-21 IdGenerator` | `checkoutGroupId`, `PedidoId`, `PagoId`, eventos. |
| `PO-23 DomainEventOutbox` | Eventos críticos en la misma transacción. |

**No se usan en `UC-01` (facturación, logística y reportes):** `PO-10 InvoiceRepository`, `PO-11 ShipmentRepository`, `PO-12 ReturnRepository`, `PO-13 RefundRepository`, `PO-17 ShippingProvider`, `PO-19 DigitalDeliveryProvider`, `PO-24 ReportingQuery`. La entrega digital y la facturación pertenecen a flujos posteriores.

### 6.16 Postcondiciones

- Existe un `checkoutGroupId` y uno o varios pedidos, uno por vendedor.
- Cada pedido tiene al menos una línea y snapshots inmutables.
- Cada pedido está en `PENDIENTE_DE_PAGO` y tiene un pago `PENDIENTE`.
- Las líneas físicas tienen reservas `ACTIVA`; las digitales no reservan stock.
- El carrito se vació o marcó como convertido solo después del éxito.
- La auditoría y los eventos críticos quedaron registrados de forma durable.
- No se emitió factura, no se despachó y no se capturó el pago.
- Si hubo fallo, las reservas se liberaron o quedaron explícitamente en conciliación; no hay pedido pagable parcial.

### 6.17 Seguridad y minimización

- El adaptador autentica; el caso de uso no acepta roles del cuerpo como prueba.
- No se almacenan datos completos de tarjeta, CVV, secretos del proveedor ni credenciales.
- La referencia del instrumento es opaca y se minimiza.
- La dirección se usa para la entrega y se congela como snapshot; no se expone a actores sin necesidad operativa.
- Los errores no revelan si un recurso ajeno existe.
- La auditoría no contiene payloads sensibles (`AUD-04`, `AUD-11`).

### 6.18 Auditoría y eventos

| Hecho | Resultado esperado | Evidencia |
|---|---|---|
| Checkout iniciado | Intento registrado; resultado aún no conocido | `RegistroAuditoria` con actor, correlación y carrito. |
| Checkout finalizado | `EXITO`, `RECHAZO` o `ERROR` | `RegistroAuditoria` con resultado y compensación, si aplica. |
| Reserva aplicada | `APLICADA`/`YA_APLICADA` | Movimiento de inventario y auditoría correlacionada (`AUD-02`). |
| Pedido creado | `PENDIENTE_DE_PAGO` | Auditoría y evento de outbox. |
| Pago iniciado | `PENDIENTE` | Auditoría y evento de outbox. |
| Checkout compensado | Reservas liberadas, pedidos cancelados | Auditoría y evento de compensación. |
| Checkout ambiguo | Pago `PENDIENTE`; operación marcada para conciliación | Auditoría y alerta operativa; no se declara éxito. |

Los nombres de evento son ilustrativos; el catálogo estable y versionado queda sujeto a `L-14`.

### 6.19 Criterios de aceptación documentales

1. Un comprador habilitado con carrito válido y stock suficiente obtiene pedidos, pagos y reservas consistentes.
2. Un comprador restringido, una cuenta inactiva o un carrito ajeno se rechazan sin mutación.
3. Un carrito vacío se rechaza con `CAR-04`.
4. Un cambio de precio produce `CONFIRMACION_REQUERIDA` y no un cobro silencioso.
5. Un carrito multi-vendedor produce un pedido por vendedor y un pago por pedido, unidos por `checkoutGroupId`.
6. Un carrito mixto exige dirección por las líneas físicas y no crea reserva para las digitales.
7. Un fallo de stock no crea un pedido pagable parcial ni deja reservas huérfanas.
8. Un reintento con la misma clave no duplica pedidos, reservas ni pagos.
9. Dos checkouts concurrentes no reservan la misma unidad.
10. Un fallo del proveedor de pago se compensa si es inequívoco; una respuesta ambigua queda en conciliación.
11. La auditoría y el outbox crítico se escriben en la misma transacción que la mutación.
12. No se emite factura, no se despacha y no se captura el pago en este caso de uso.

### 6.20 Límites y decisiones pendientes

| ID | Límite | Tratamiento en este documento |
|---|---|---|
| `L-01` / `DEC-BIZ-01` | Composición exacta de `Direccion`. | Se exige dirección válida y propia; los campos no se fijan. |
| `L-04` / `DEC-BIZ-05` | Moneda, escala y redondeo. | Se exige moneda explícita y política reproducible; no se fija el valor. |
| `L-05` | Tasas, descuentos y costo de envío. | `DS-05` los recibe como política; no se inventan valores. |
| `L-07` / `DEC-BIZ-04` | Preferencia entre bodegas elegibles. | `DS-04` devuelve una propuesta factible; no se declara óptima. |
| `L-22` | Protocolo del proveedor de pago. | Se define la interacción abstracta; el protocolo concreto queda fuera. |
| `L-25` | Aislamiento, timeout y reintento. | Se adopta `D-16`; los valores numéricos quedan configurables. |
| `C-16` | Pago único de grupo vs pago por pedido. | Se adopta un pago por pedido, conforme a `[MOD]` §11.1. |
| `L-24` | Notificaciones. | `PO-18` se usa solo si la política lo exige; el catálogo no se fija. |

---

## 7. UC-02 — QueryOrder

### 7.1 Identificación

| Campo | Valor |
|---|---|
| ID | `UC-02` |
| Nombre | Consultar pedido (`QueryOrder`) |
| Puerto de entrada | `PI-13` |
| Módulo | `orders` |
| Tipo | Caso de uso de consulta, solo lectura |
| Resultado | Pedido(s) con líneas, snapshots, estados, importes y resúmenes de pago, envío, factura y posventa |
| Estado | `Inferido` con limitaciones `L-17`, `L-19`, `L-23`, `L-26` |

### 7.2 Objetivo y resultado observable

Permitir que un actor autorizado consulte un pedido concreto o una lista filtrada, con la información histórica necesaria para atención, seguimiento o administración, sin modificar el pedido ni sus agregados asociados.

### 7.3 Actores y alcance

| Actor | Alcance | Restricciones |
|---|---|---|
| `COMPRADOR` | Pedidos donde `compradorId` es el suyo. | No puede consultar pedidos de otros compradores; puede consultar su historial aunque esté `RESTRINGIDO`. |
| `VENDEDOR` | Pedidos donde `vendedorId` es el suyo. | No puede consultar pedidos de otros vendedores; no inicia mutaciones. |
| `ADMINISTRADOR` | Todos los pedidos. | La consulta es de solo lectura; no cambia estados. |
| `SUPERVISOR` | Todos los pedidos. | Solo lectura (`SUP-01`). |
| `OPERADOR_LOGISTICO` | Pedidos/envíos asignados. | La asignación no está modelada; si el contexto no la aporta, se deniega (`L-26`). |
| Cuenta no activa | Ninguno. | `USR-04`. |

La autorización se evalúa con `DS-01`; el alcance no se amplía por filtros proporcionados por el cliente.

### 7.4 Disparador

El actor solicita un pedido por identificador o una lista con filtros. No hay mutación ni evento de negocio.

### 7.5 Precondiciones

| ID | Precondición | Fuente |
|---|---|---|
| `PRE-UC02-01` | Actor autenticado y cuenta `ACTIVO`. | `RG-01`, `USR-04` |
| `PRE-UC02-02` | Rol habilitado para consultar pedidos. | `DS-01`; `[MOD]` §19 |
| `PRE-UC02-03` | Alcance determinado sobre el pedido o la lista. | `RG-03` |
| `PRE-UC02-04` | Filtros y paginación válidos. | `PI-13`; `L-19` |
| `PRE-UC02-05` | Fuente de lectura disponible. | `PO-08`…`PO-13` |

### 7.6 Entrada conceptual

| Campo | Obligatorio | Tipo conceptual | Regla |
|---|---:|---|---|
| `actorId`, `rolActor`, `correlationId` | Sí | Contexto | Alcance autorizado. |
| `pedidoId` | Condicional | `PedidoId` | Activa el modo detalle; si se informa, no se combinan filtros de lista incompatibles. |
| `filtros` | No | `compradorId`, `vendedorId`, `estado`, `fechaDesde`, `fechaHasta`, `checkoutGroupId` | Solo se aplican dentro del alcance; un filtro no amplía permisos. |
| `paginacion` | No | `pagina`, `tamano` | El máximo lo fija la configuración aprobada; no se inventa un número (`L-19`). |

**Modos:**

- **Detalle:** `pedidoId` presente; devuelve un pedido con líneas y resúmenes.
- **Lista:** sin `pedidoId`; devuelve una página de pedidos con resumen de cabecera y paginación. El detalle se obtiene con una segunda consulta por `pedidoId`.

### 7.7 Salida conceptual

| Bloque | Contenido | Regla |
|---|---|---|
| Cabecera | `pedidoId`, `checkoutGroupId`, `compradorId`, `vendedorId`, `estado`, `estadoPago`, `subtotal`, `descuentos`, `costoEnvio`, `impuestos`, `total`, `moneda`, `creadoEn`, `pagadoEn`, `entregadoEn`, `version` | Importes y snapshots del pedido; no se recalculan desde el catálogo actual. |
| Líneas | `itemId`, `varianteId`, `productoNombreSnapshot`, `skuSnapshot`, `vendedorId`, `tipoEntrega`, `cantidad`, `precioUnitario`, `descuentoUnitario`, `impuesto`, `totalLinea` | Copia histórica; no se sustituye por el producto vigente. |
| Dirección | `DireccionSnapshot` cuando el pedido es físico | Se minimiza según el actor; no se expone a quien no la necesita. |
| Pago | `pagoId`, `estado`, `importe`, `moneda`, `proveedor`, referencia externa segura, número de intentos | Resumen; no se devuelven payloads crudos ni datos de tarjeta. |
| Envío | `envioId`, `estado`, `transportista`, `trackingNumber` enmascarado, evidencia presente, fechas | Resumen; el formato de evidencia es del proveedor (`L-23`). |
| Factura | `facturaId`, `numero`, `fechaEmision`, `estado`, `total` | Si no existe, ausencia explícita; la numeración no se genera aquí (`L-17`). |
| Posventa | Devoluciones y reembolsos: identificador, estado, importe, moneda, fechas | Resumen; no se procesan en esta consulta. |
| Paginación | `pagina`, `tamano`, `total`, `haySiguiente` | Solo en modo lista. |

**Ausencia de datos:** un pago, envío, factura o posventa inexistente se representa como ausencia explícita (`null`/lista vacía conceptual), no como error. Un pedido inexistente o fuera de alcance se trata como `RECURSO_NO_ENCONTRADO`.

**Modo lista vs detalle:** el contrato de `PI-13` exige pedidos con líneas y resúmenes; el modo detalle los incluye. El modo lista devuelve cabecera y resúmenes para evitar sobrecarga; si un consumidor necesita líneas en la lista, se considera una variante del contrato y no se inventa aquí (`D-20`).

### 7.8 Flujo principal

1. Recibir el contexto y verificar identidad, rol y estado de la cuenta.
2. Invocar `DS-01` para autorizar la consulta de pedidos.
3. Validar filtros y paginación; rechazar valores desconocidos o inconsistentes.
4. Determinar el alcance efectivo según el rol; ignorar o rechazar filtros que intenten ampliarlo.
5. Si hay `pedidoId`:
   1. recuperar el pedido con `PO-08`;
   2. verificar que el actor tenga alcance sobre él;
   3. recuperar pago(s), envío(s), factura y posventa con `PO-09`…`PO-13`;
   4. componer la vista de detalle;
   5. devolver sin mutar.
6. Si no hay `pedidoId`:
   1. listar pedidos con `PO-08` aplicando alcance, filtros y paginación;
   2. componer resúmenes de cabecera;
   3. devolver página y total.
7. Si una fuente de resumen falla, devolver `ERROR` seguro o una vista parcial declarada; no inventar datos.
8. No escribir auditoría, outbox ni estado.

### 7.9 Autorización y no divulgación

- La capacidad «consultar pedido» se evalúa contra el rol y el recurso (`DS-01`).
- Un `pedidoId` existente pero fuera de alcance se devuelve como `RECURSO_NO_ENCONTRADO`, no como `NO_AUTORIZADO`, para evitar enumeración.
- `NO_AUTORIZADO` se reserva para roles sin la capacidad o contextos inválidos.
- El Supervisor no puede usar esta consulta para modificar; cualquier intento de mutación se rechaza.
- El vendedor no ve datos de otros vendedores; el comprador no ve pedidos ajenos.
- El operador logístico solo ve lo asignado; la asignación debe venir del contexto autorizado (`L-26`). Si el contexto no aporta la asignación, se devuelve `NO_AUTORIZADO`; si el pedido existe pero no está asignado, se devuelve `RECURSO_NO_ENCONTRADO`.

### 7.10 Filtros, orden y paginación

| Aspecto | Regla |
|---|---|
| `compradorId` | El comprador lo tiene implícito; Administrador/Supervisor pueden filtrar; el vendedor no puede usarlo para ampliar alcance. |
| `vendedorId` | El vendedor lo tiene implícito; Administrador/Supervisor pueden filtrar; el comprador no puede usarlo para ver pedidos ajenos. |
| `estado` | Debe pertenecer a `EstadoPedido`; un valor desconocido produce `VALIDACION_INVALIDA`. |
| `fechaDesde` / `fechaHasta` | Se aplican sobre `creadoEn`; `desde` inclusivo y `hasta` exclusivo (decisión de diseño `D-20`). |
| `checkoutGroupId` | Devuelve los pedidos del grupo visibles para el actor. |
| `pagina` / `tamano` | `pagina` entero ≥ 1; `tamano` entero > 0 y no supera el máximo configurado; si se supera, `LIMITE_EXCEDIDO`. Si se omite, se aplica página 1 y el tamaño por defecto aprobado; el valor no se fija aquí. |
| Orden por defecto | `creadoEn DESC`, desempate por `pedidoId` (`D-20`). |
| Otros órdenes | Solo si están aprobados en configuración; no se inventan. |

### 7.11 Errores y resultados excepcionales

| Código | Significado | Cuándo |
|---|---|---|
| `NO_AUTORIZADO` | El rol no tiene la capacidad o el contexto es inválido. | `DS-01`. |
| `RECURSO_NO_ENCONTRADO` | El pedido no existe o no es visible. | Identificador inválido o fuera de alcance. |
| `VALIDACION_INVALIDA` | Filtro, fecha, estado o paginación inválidos. | Entrada. |
| `LIMITE_EXCEDIDO` | Se supera el tamaño de página. | `L-19`. |
| `ERROR` | Fallo técnico no clasificado, incluida la fuente de lectura no disponible. | Infraestructura. |

### 7.12 Invariantes

| ID | Invariante | Verificación |
|---|---|---|
| `INV-UC02-01` | La consulta no muta pedidos, pagos, envíos, facturas, devoluciones ni reembolsos. | Solo lectura. |
| `INV-UC02-02` | El alcance del actor no se amplía por filtros. | `DS-01`, `RG-03`. |
| `INV-UC02-03` | Los snapshots del pedido se devuelven tal como se compraron; no se recalculan. | `[MOD]` §10.1–§10.2; `CAT-06`. |
| `INV-UC02-04` | No se exponen pedidos fuera del alcance autorizado. | Alcance. |
| `INV-UC02-05` | No se exponen datos de tarjeta, secretos ni payloads crudos de proveedores. | `PAY-06`; `AUD-04`. |
| `INV-UC02-06` | La ausencia de pago/envío/factura/posventa es explícita, no inventada. | Contrato de salida. |
| `INV-UC02-07` | La consulta no sustituye la auditoría ni el reporte administrativo. | `[PO]` `PO-24`, punto 3. |

### 7.13 Consistencia y frescura

- La fuente por defecto es la verdad transaccional de pedidos, pagos, envíos, facturas y posventa.
- No se requiere una proyección de lectura para `UC-02`; si se añade una, debe declarar su frescura y no sustituir la fuente de verdad.
- `PO-24 ReportingQuery` no se usa: está reservado para reportes administrativos y no para consultas operativas de pedidos (`[PO]` `PO-24`, punto 3).
- Una lectura eventual no se usa para decidir una mutación; `UC-02` no muta.
- Si el pedido y el resumen de pago discrepan, se devuelven ambos y se reporta la inconsistencia; no se corrige en la consulta.

### 7.14 Puertos de salida requeridos

La matriz `PI-13 → PO` de `[PI]` §7.3 se conserva:

| Puerto | Uso en `UC-02` |
|---|---|
| `PO-08 OrderRepository` | Pedido, líneas, snapshots, estados e importes; listado por comprador/vendedor/estado/checkoutGroupId. |
| `PO-09 PaymentRepository` | Pago(s) e intentos por pedido; resumen seguro. |
| `PO-10 InvoiceRepository` | Factura por pedido, si existe; número y estado. |
| `PO-11 ShipmentRepository` | Envíos por pedido; estado, seguimiento y evidencia presente. |
| `PO-12 ReturnRepository` | Devoluciones por pedido; estado y resumen. |
| `PO-13 RefundRepository` | Reembolsos por pago/pedido; estado e importe. |

**No se usan en `UC-02` (escritura, efectos y reportes):** `PO-14 AuditLogRepository`, `PO-15 TransactionManager`, `PO-16 PaymentGateway`, `PO-17 ShippingProvider`, `PO-18 NotificationSender`, `PO-19 DigitalDeliveryProvider`, `PO-20 Clock`, `PO-21 IdGenerator`, `PO-23 DomainEventOutbox`, `PO-24 ReportingQuery`. La consulta no crea, no notifica y no audita por sí misma.

### 7.15 Seguridad y minimización

- El adaptador autentica y aporta el contexto; el caso de uso no confía en filtros de rol.
- Se devuelven solo los campos necesarios para la función del actor.
- El comprador ve sus datos; el vendedor ve lo necesario para su pedido; el operador ve lo necesario para la entrega; Administrador/Supervisor ven según su autoridad.
- Las referencias externas y los números de seguimiento se enmascaran cuando no son imprescindibles.
- Los errores no revelan la existencia de pedidos ajenos.
- La consulta no registra auditoría en el contrato actual; si la política exige auditar accesos, se añadirá un puerto/obligación explícita.

### 7.16 Criterios de aceptación documentales

1. Un comprador consulta solo sus pedidos y no puede ampliar el alcance con filtros.
2. Un vendedor consulta solo pedidos de su vendedor.
3. Un Administrador y un Supervisor pueden consultar todos los pedidos; el Supervisor no muta.
4. Un operador sin asignación explícita recibe `NO_AUTORIZADO`; si el pedido existe pero no está asignado, recibe `RECURSO_NO_ENCONTRADO`.
5. Un `pedidoId` ajeno devuelve `RECURSO_NO_ENCONTRADO`, no datos.
6. La consulta devuelve snapshots históricos y no precios actuales del catálogo.
7. Un pedido sin factura, envío o posventa devuelve ausencia explícita.
8. La paginación respeta el máximo configurado y devuelve metadatos de página.
9. Un filtro o estado inválido devuelve `VALIDACION_INVALIDA`.
10. La consulta no crea auditoría, outbox, pedidos, pagos ni reservas.

### 7.17 Límites y decisiones pendientes

| ID | Límite | Tratamiento |
|---|---|---|
| `L-17` | Numeración/serie fiscal. | La consulta devuelve la factura existente; no genera número. |
| `L-19` | Catálogo de filtros, orden y límites de paginación. | Se define el contrato conceptual; el máximo y los filtros aprobados quedan configurables, y el orden por defecto se fija en `D-20`. |
| `L-23` | Integración logística, tracking y evidencia. | Se devuelve un resumen; el formato y los eventos del proveedor quedan fuera. |
| `L-26` | Asignación de operador logístico. | El contexto de autorización debe aportarla; sin ella, se deniega. |
| Visibilidad de campos para vendedor/operador | No hay política field-level aprobada. | Se minimiza y se remite a la política de acceso; no se inventa una tabla. |
| Auditoría de lecturas | No está en `PI-13`. | Se mantiene fuera del contrato actual; una decisión futura podría añadirla. |

---

## 8. Trazabilidad

### 8.1 Requisito → dominio → servicio → caso de uso → puertos

| Requisito/regla | Dominio | Servicio | Caso de uso | Puerto de entrada | Puertos de salida | Estado |
|---|---|---|---|---|---|---|
| OBJ-08 confirmar compra | `Carrito`, `Pedido`, `Pago`, `ReservaInventario` | `DS-01`, `DS-03`, `DS-04`, `DS-05`, `DS-06`, `DS-09` | `UC-01` | `PI-12` | `PO-02`…`PO-09`, `PO-14`…`PO-16`, `PO-18`, `PO-20`, `PO-21`, `PO-23` | Alineado con límites |
| CAR-01/CAR-04/CAR-05/CAR-07 | `Carrito`, `ItemCarrito` | `DS-01`, `DS-05` | `UC-01` | `PI-12` (upstream `PI-11`) | `PO-05`, `PO-07`, `PO-08` | Alineado |
| ORD-07 / LOG-01 dirección y entrega | `Pedido`, `DireccionSnapshot`, `TipoEntrega` | `DS-04`, `DS-06` | `UC-01` | `PI-12` | `PO-02`, `PO-04`, `PO-08` | Alineado con `L-01` |
| INV-02…INV-07 reserva atómica | `Inventario`, `ReservaInventario`, `MovimientoInventario` | `DS-03`, `DS-04` | `UC-01` | `PI-12` | `PO-04`, `PO-06` | Alineado |
| MON-01…MON-12 cálculo | `Pedido`, `ItemPedido`, `Dinero` | `DS-05` | `UC-01` | `PI-12` | `PO-05`, `PO-08` | Alineado con `L-04`, `L-05` |
| ORD-01…ORD-08 transiciones | `Pedido`, `Pago`, `Envio` | `DS-06` | `UC-01` (creación) y flujos posteriores | `PI-12`, `PI-15`…`PI-18` | `PO-08`, `PO-09`, `PO-11` | Alineado; cierre en `L-21` |
| PAY-01…PAY-07 pago | `Pago` | `DS-06` | `UC-01` (inicio) y `PI-15` | `PI-12`, `PI-15` | `PO-09`, `PO-16` | Alineado con `L-22` |
| OBJ-08/OBJ-12 consulta | `Pedido`, `Pago`, `Envio`, `Factura`, `Devolucion`, `Reembolso` | `DS-01` | `UC-02` | `PI-13` | `PO-08`…`PO-13` | Inferido; `L-19`, `L-23`, `L-26` |
| AUD-01…AUD-12 auditoría | `RegistroAuditoria` | `DS-09` | `UC-01`; `UC-02` no audita | `PI-12`; `PI-13` | `PO-14`, `PO-23` (solo `UC-01`) | Alineado con `L-11`, `L-14`, `L-15` |

### 8.2 Matriz PI → PO de los casos de uso

| Caso de uso | PI | PO |
|---|---|---|
| `UC-01` | `PI-12` | `PO-02`, `PO-03`, `PO-04`, `PO-05`, `PO-06`, `PO-07`, `PO-08`, `PO-09`, `PO-14`, `PO-15`, `PO-16`, `PO-18`, `PO-20`, `PO-21`, `PO-23` |
| `UC-02` | `PI-13` | `PO-08`, `PO-09`, `PO-10`, `PO-11`, `PO-12`, `PO-13` |

**Nota:** `UC-01` depende upstream de `PI-11` para el estado del carrito, pero no consume sus puertos de salida como si fueran propios; el checkout vuelve a leer el carrito con `PO-07`.

---

## 9. Decisiones de diseño y cierre de limitaciones

### 9.1 Decisiones adoptadas

| ID | Decisión | Justificación | Consecuencia |
|---|---|---|---|
| `D-16` | Adoptar `READ COMMITTED` como aislamiento por defecto para `UC-01`, con actualizaciones condicionales/versión sobre inventario, pedido y pago; timeout y reintentos acotados y configurables; reintento solo de fallos transitorios, con la misma clave; nunca reintentar una captura externa sin consultar. | `L-25` no fija política; la arquitectura exige atomicidad y no transacciones distribuidas. | Cierra la política transaccional a nivel de diseño; los valores numéricos quedan en configuración. |
| `D-17` | Un pago por pedido, no un pago único por `checkoutGroupId`. | `[MOD]` §11.1 exige `Pago.pedidoId`; un grupo multi-vendedor produce varios pedidos. | `C-16`; la salida de `PI-12` se corrige a lista de pagos. |
| `D-18` | Definir la interacción de pago de forma abstracta: iniciar → estado normalizado → confirmar/consultar → cancelar si el proveedor lo permite; sin captura en checkout; sin datos de tarjeta. | `PO-16` ya expresa la abstracción; `L-22` solo bloquea el protocolo concreto. | `L-22` se acota; el proveedor y la ventana de reintento siguen abiertos. |
| `D-19` | `QueryOrder` usa los repositorios operativos, no `PO-24`; no requiere proyección ni auditoría de lecturas. | `PO-24` está reservado a reportes; `PI-13` no incluye `PO-14`. | Consulta operativa consistente con la fuente transaccional; auditoría de accesos queda como decisión futura. |
| `D-20` | En `QueryOrder`, el modo detalle usa `pedidoId`; el modo lista usa paginación; orden por defecto `creadoEn DESC` con desempate `pedidoId`; rango de fechas `[desde, hasta)`. | Evita respuestas ambiguas y sobrecarga; no fija límites numéricos. | Contrato conceptual estable; `L-19` sigue fijando el máximo y los filtros aprobados. |
| `D-21` | Un recurso existente pero fuera de alcance se devuelve como `RECURSO_NO_ENCONTRADO`; `NO_AUTORIZADO` se reserva para falta de capacidad/contexto. | Minimiza enumeración y filtración de existencia. | Seguridad por no divulgación. |
| `D-22` | Mantener un solo documento para `UC-01` y `UC-02`, con contratos separados y contexto común. | Ambos pertenecen a `orders`, comparten autorización, errores y trazabilidad; separarlos duplicaría contexto. | Un documento de dos casos de uso; futuros flujos (cancelación, cierre, facturación) se documentarán aparte. |
| `D-23` | Restaurar los catálogos de puertos en `BackendSDD/Application/` y corregir los enlaces relativos de los servicios. | El contenido, el estado y la arquitectura ya declaraban `Application/`; los archivos estaban físicamente en `Domain/`, y los servicios conservaban rutas de la estructura anidada anterior. | `C-17`; no hay copias duplicadas y todos los enlaces relativos resuelven. |

### 9.2 Estado de las limitaciones bloqueantes

| ID | Estado tras este documento | Alcance |
|---|---|---|
| `L-17` | **No bloquea este documento.** Sigue abierta para `PI-19`/`PI-20` y el contrato de facturación. | `QueryOrder` solo devuelve la factura existente; no numera. |
| `L-22` | **Acotada.** La interacción abstracta queda definida (`D-18`); el protocolo, proveedor, ventana de reintento y cancelación concreta siguen abiertos. | `UC-01` inicia pago; no captura. |
| `L-23` | **No bloquea este documento.** Sigue abierta para `PI-16`…`PI-18` y el contrato logístico. | `QueryOrder` devuelve resumen de envío; no integra tracking. |
| `L-25` | **Cerrada a nivel de diseño (`D-16`).** Los valores numéricos de timeout y el número máximo de reintentos quedan configurables. | `UC-01`; `UC-02` no escribe. |
| `L-26` | **Abierta.** El modelo no define asignación de operador; `UC-02` exige que el contexto la aporte o deniega. | Solo alcance del operador logístico. |

### 9.3 Decisiones de negocio que siguen abiertas

| ID | Efecto en estos casos de uso | Tratamiento |
|---|---|---|
| `DEC-BIZ-01` | Composición exacta de dirección. | `UC-01` exige dirección válida y propia; no fija campos. |
| `DEC-BIZ-02` | Plazo de devolución. | `UC-02` solo muestra devoluciones existentes; no evalúa elegibilidad. |
| `DEC-BIZ-03` | Catálogo de motivos. | `UC-02` muestra el motivo existente; no lo valida. |
| `DEC-BIZ-04` | Preferencia de bodega. | `DS-04` devuelve una propuesta factible; no se declara óptima. |
| `DEC-BIZ-05` | Moneda, escala y redondeo. | `DS-05` exige política; no se fija el valor. |
| `DEC-BIZ-06` | Proceso de cambio de `EstadoComercial`. | `UC-01` solo verifica `HABILITADO`; no cambia el estado. |
| `DEC-BIZ-07` | Aprobación financiera. | Fuera de `UC-01`/`UC-02`; pertenece a reembolsos. |

Ninguna de estas decisiones se marca como aprobada. El documento puede implementarse en su parte estructural, pero los valores y políticas concretos deben provenir de la decisión correspondiente.

### 9.4 Conciliaciones registradas

| ID | Hallazgo | Resolución | Estado |
|---|---|---|---|
| `C-16` | `PI-12` describía un `pagoId` singular, mientras `[MOD]` §11.1 exige `Pago.pedidoId` y un checkout multi-vendedor crea varios pedidos. | Un pago por pedido; la salida de `PI-12` se corrige a lista de pagos. Un pago único de grupo requeriría cambiar el modelo. | Resuelto por jerarquía del modelo |
| `C-17` | Los catálogos de puertos estaban físicamente en `BackendSDD/Domain/`, aunque su contenido, el estado y la arquitectura declaraban `BackendSDD/Application/`. | Se restauraron en `BackendSDD/Application/`; no hay copias duplicadas. | Resuelto por consistencia |
| `C-18` | `PI-13` menciona «operador asignado», pero el modelo no define una entidad de asignación de operador a pedido/envío. | El alcance del operador debe provenir del contexto de autorización; sin asignación explícita se deniega. Se registra `L-26`; no se inventa una entidad. | Acotado; limitación abierta |
| `C-19` | `PI-13` devolvía `NO_AUTORIZADO` cuando el actor no tenía alcance sobre un pedido; el caso de uso adopta no divulgación de existencia. | Se alinea `PI-13`: `NO_AUTORIZADO` para rol/contexto; `RECURSO_NO_ENCONTRADO` para recurso fuera de alcance (`D-21`). | Resuelto por decisión de seguridad |

---

## 10. Validación del documento

| Criterio | Resultado | Evidencia |
|---|---|---|
| Propósito y límites explícitos | Cumple | §1. |
| Autoridad y fuentes con secciones | Cumple | §2. |
| Terminología canónica | Cumple | §2.4. |
| Actores, permisos y alcance | Cumple | §5.1, §6.3, §7.3, §7.9. |
| Entradas, precondiciones y salidas | Cumple | §6.5–§6.7, §7.5–§7.7. |
| Flujo principal y alternativas | Cumple | §6.8–§6.9, §7.8. |
| Invariantes y efectos | Cumple | §6.11–§6.12, §7.12. |
| Idempotencia y concurrencia | Cumple | §6.13. |
| Transacción y compensación | Cumple | §6.14, `D-16`. |
| Puertos de entrada y salida | Cumple | §6.15, §7.14, §8.2. |
| Trazabilidad a requisitos y reglas | Cumple | §8.1. |
| Límites y decisiones externas | Cumple | §6.20, §7.17, §9.2–§9.3. |
| Sin código, endpoints, SQL, SDKs ni adaptadores | Cumple | Todo el documento es conceptual. |
| Sin inventar reglas de negocio | Cumple con decisiones marcadas | `D-16`…`D-23` son decisiones de diseño; `DEC-BIZ` siguen abiertas. |
| Enlaces relativos válidos | Cumple | Rutas verificadas desde `BackendSDD/Application/`. |

---

## 11. Impacto y documentos dependientes

| Documento | Impacto | Acción |
|---|---|---|
| [`nexusmarket-input-ports.md`](nexusmarket-input-ports.md) | `PI-12` corregido para pagos por pedido; `PI-13` limitado por `L-26`, con errores de alcance alineados (`C-19`) y salida de lista/detalle precisada (`D-20`). | Revisar al implementar adaptadores. |
| [`nexusmarket-output-ports.md`](nexusmarket-output-ports.md) | Sin cambios de contrato; se confirma el uso de `PO-08`…`PO-13` y `PO-02`…`PO-23`; se añadió `L-26` y la nota de cierre de `L-25`. | Mantener. |
| [`../DOCUMENTATION_STATUS.md`](../DOCUMENTATION_STATUS.md) | Nuevo entregable, `C-16`…`C-19`, `L-26`, `D-16`…`D-23`. | Actualizado en esta ejecución. |
| `../Domain/services/*.md` | Enlaces relativos corregidos. | Sin cambio de contenido normativo. |
| Futuros adaptadores HTTP | Deben mapear `PI-12`/`PI-13` sin agregar reglas. | Fuera de alcance. |
| Futuros contratos OpenAPI | Deben reflejar resultados y errores, no reglas de dominio. | Fuera de alcance. |
| Futuros casos de uso de pago, facturación, logística, cancelación y cierre | Deben reutilizar `L-17`, `L-21`, `L-22`, `L-23`, `L-26` y las decisiones abiertas. | Planificar por separado. |

---

**Cierre:** este documento especifica el checkout y la consulta de pedido con separación explícita entre hechos, inferencias, decisiones de diseño y límites. No crea adaptadores, endpoints, contratos ejecutables ni código. Las políticas de negocio no aprobadas permanecen abiertas y no se presentan como reglas confirmadas.
