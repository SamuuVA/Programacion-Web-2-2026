# Observaciones arquitectónicas

## 0. Alcance y criterio

Este documento registra las **inconsistencias, vacíos y decisiones pendientes** detectados al
analizar la documentación de NexusMarket para diseñar la capa de adaptadores.

```text
Acción realizada sobre todo lo aquí documentado:
No se modificó ningún archivo original (dominio, servicios, Input Ports, Output Ports,
arquitectura, configuración, código fuente ni README) debido a las restricciones
establecidas para esta tarea. Los originales solo se leyeron.
```

Cada hallazgo sigue el formato solicitado:

```markdown
## Observación arquitectónica
## Impacto
## Recomendación
## Acción realizada
```

---

## O-01 — Devoluciones y reembolsos sin entidad, servicio ni puertos

### Observación arquitectónica

Se detectó que `Input-Ports.md` (§17 y §18) define `RequestReturnUseCase`, `ApproveReturnUseCase` y
`ProcessRefundUseCase`, y que `Input-Ports.md` (§26) menciona el error `ReturnNotAllowed`. Sin
embargo:

- `DomainModel .md` no define ninguna entidad de devolución.
- `Domain  Servicies.md` y `Services/*.md` no incluyen operaciones de devolución ni de reembolso.
- `Output-Ports.md` (§27) no declara ningún repositorio para devoluciones.
- `Services/OrderProcessingService.md` (§8) reconoce explícitamente que "devoluciones, reembolsos y
  reportes requieren especificación adicional".

### Impacto

Los adaptadores `ReturnController` y `RefundController` (E9) existen como adaptadores de entrada,
pero **no pueden trazarse** hasta un servicio ni hasta un adaptador de salida. El único enlace
documentado es `PaymentGateway` para el reembolso (`Input-Ports.md`, §18.1).

### Recomendación

Antes de implementar E9, definir: la entidad de devolución, el servicio que aplica sus reglas, el
estado del pedido asociado y el Output Port de persistencia correspondiente (`ReturnRepository` o
equivalente). Solo entonces podrá documentarse su adaptador SQL.

### Acción realizada

No se modificó ningún archivo original. No se creó un adaptador de persistencia de devoluciones para
no inventar entidades ni puertos. La trazabilidad incompleta se registra en `trazabilidad.md` (§2.8
y §7).

---

## O-02 — `Factura` y `Envio` ausentes del modelo de dominio

### Observación arquitectónica

Se detectó que `Output-Ports.md` declara `InvoiceRepository` (§9) y `ShipmentRepository` (§11), con
métodos que operan sobre `Factura` y `Envio`, pero `DomainModel .md` no describe esas entidades ni
sus atributos (las entidades documentadas son usuario, comprador, vendedor, operador logístico,
administrador, supervisor, producto, producto físico, producto digital, variante, bodega,
bodega marketplace, bodega vendedor, inventario, carrito, ítem de carrito, pedido, ítem de pedido,
movimiento de inventario y registro de auditoría).

### Impacto

`SQLInvoiceRepository` (S10) y `SQLShipmentRepository` (S11) solo pueden definirse a nivel de
contrato; no es posible documentar su mapeo de datos ni su DTO de respuesta sin inventar campos.

### Recomendación

Incorporar `Factura` y `Envio` al modelo de dominio (atributos, reglas y relaciones con el pedido)
antes de implementar estos adaptadores, o declarar explícitamente que su modelo no pertenece al
dominio de NexusMarket.

### Acción realizada

No se modificó `DomainModel .md`. Los adaptadores se documentan como contratos con campos marcados
como pendientes (`output/sql-adapters.md` §3.10 y §3.11; `input/response-dtos.md` §4.5).

---

## O-03 — Entrada conceptual ausente en cuatro casos de uso

### Observación arquitectónica

Se detectó que `Input-Ports.md` documenta entrada conceptual para la mayoría de casos de uso
(§9.1 a §20.1), pero no la define para:

```text
ConfirmOrderUseCase      (§14.1)
GetOrderUseCase          (§14.2)
UpdateOrderStatusUseCase (§14.3)
ApproveReturnUseCase     (§17.2)
```

### Impacto

Los Request DTOs y los mappers de entrada de estos casos de uso no pueden documentarse con campos
concretos; solo puede indicarse su existencia y la necesidad de un identificador de pedido.

### Recomendación

Completar la "Entrada conceptual" de esos cuatro casos de uso en `Input-Ports.md` (sin que este
diseño de adaptadores la invente).

### Acción realizada

No se modificó `Input-Ports.md`. Los DTOs correspondientes se declaran como **pendientes**
(`input/request-dtos.md`, §4.2) y la transformación se documenta de forma genérica
(`input/input-mappers.md`, §5).

---

## O-04 — `CreateWarehouseUseCase` sin servicio de dominio asignado

### Observación arquitectónica

Se detectó que `Input-Ports.md` (§10.1) define `CreateWarehouseUseCase` con la entrada
`{ nombre, ubicacion, tipoBodega }`, que `Output-Ports.md` (§5.5) declara `WarehouseRepository` con
`guardar`, `buscarPorId` y `listarPorVendedor(vendedorId)`, y que `InventoryService` incluye
`Warehouse` entre sus entidades principales (`Domain  Servicies.md`, §2). Sin embargo, ningún
servicio documenta una operación de creación de bodegas, y existe una regla que vincula la
incorporación de un vendedor con su primera bodega sin indicar qué servicio la ejecuta.

### Impacto

`WarehouseController` (E2) no puede trazarse hasta un servicio ni hasta un caso de uso existente; el
adaptador `SQLWarehouseRepository` (S5) sí está justificado por el puerto.

### Recomendación

Definir si la creación de bodegas pertenece a `CatalogService`, a `InventoryService` o a un servicio
nuevo, y documentar la operación correspondiente con sus precondiciones y auditoría.

### Acción realizada

No se modificó ningún archivo original. La trazabilidad de E2 se marca como pendiente
(`trazabilidad.md`, §2.2 y §7).

---

## O-05 — Tipos de identificadores contradictorios

### Observación arquitectónica

Se detectó una divergencia entre documentos:

| Documento | Tipo declarado |
|---|---|
| `DomainModel .md` (§5.1, §6.1, §6.4, §7.1, §7.2) | `id: int` / `Integer` |
| `Output-Ports.md` (firmas de ejemplo, §3 y §5.1) | `buscarPorId(id: string)` |
| `Input-Ports.md` (ejemplo, §4) | `POST /buyers` sin tipo declarado |

### Impacto

Los adaptadores y los mappers de persistencia no pueden fijar el tipo de los identificadores en las
firmas ni en los DTOs; los Request DTOs tampoco pueden tipar los identificadores de ruta.

### Recomendación

Definir un único tipo de identificador para el dominio y reflejarlo de forma consistente en las
firmas de los puertos y en los contratos HTTP.

### Acción realizada

No se modificó ningún archivo original. El diseño de adaptadores documenta la contradicción y deja
el formato como pendiente (`mappers/persistence-mappers.md`, §4 y §10).

---

## O-06 — `operatorId` en los comandos frente al `ExecutionContext`

### Observación arquitectónica

Se detectó que:

- `DispatchInventoryCommand` incluye `operatorId` (`Input-Ports.md`, §12.3).
- `ReplenishStockCommand` **no** incluye actor, aunque `InventoryService.replenishStock` recibe
  `operatorId` como primer argumento (`Services/InventoryService.md`, §4).
- El `ExecutionContext` ya transporta `{ userId, role }` (`Input-Ports.md`, §8).
- RG-01 exige que toda operación sea ejecutada por un usuario autenticado.

### Impacto

Existe riesgo de doble fuente de verdad sobre "quién ejecuta la operación": el cuerpo de la
solicitud (`operatorId`) y el contexto de seguridad. Un cliente podría intentar suplantar al actor.

### Recomendación

Alinear los comandos para que el actor provenga siempre del `ExecutionContext` y no del cuerpo de la
solicitud, y documentar la decisión en `Input-Ports.md`.

### Acción realizada

No se modificó ningún archivo original. El diseño de adaptadores aplica la regla segura (el actor
siempre proviene del contexto) y registra la divergencia (`input/rest-controllers.md`, §6.3;
`input/request-dtos.md`, §5).

---

## O-07 — Casos de uso internos frente a casos de uso expuestos

### Observación arquitectónica

Se detectó que `Input-Ports.md` (§21) asigna actores a los casos de uso, pero algunos no
corresponden a un actor humano externo:

```text
ReserveInventoryUseCase    → "Flujo de pedido"        (interno)
CreateInvoiceUseCase       → "Sistema"                (§15.2)
CreateShipmentUseCase      → "Sistema / Operador"     (§16.1)
DispatchInventoryUseCase   → incluye operatorId en el comando (§12.3)
```

### Impacto

Determinar cuántos endpoints HTTP existen realmente. Si todos los casos de uso se expusieran, se
crearían superficies de ataque innecesarias (por ejemplo, una reserva de inventario invocable
directamente o una facturación disparada por un cliente).

### Recomendación

Declarar explícitamente en `Input-Ports.md` qué casos de uso son expuestos por HTTP y cuáles son
internos (invocados por otros casos de uso), ya que `Input-Ports.md` (§33) deja abierta la
posibilidad de otros adaptadores de entrada.

### Acción realizada

No se modificó `Input-Ports.md`. El diseño de adaptadores trata `ReserveInventoryUseCase` como
interno y no le asigna controller (`input/rest-controllers.md`, §4 y §13).

---

## O-08 — Catálogo de endpoints no especificado

### Observación arquitectónica

Se detectó que la documentación **no define rutas, verbos, parámetros ni códigos de éxito**. El
único ejemplo explícito es `POST /buyers` (`Input-Ports.md`, §4).

### Impacto

Los adaptadores REST (E1–E11) no pueden cerrarse: faltan los contratos HTTP concretos y los códigos
de estado de éxito.

### Recomendación

Definir el catálogo de endpoints como documento propio (o sección de `Input-Ports.md`), manteniendo
la correspondencia uno a uno con los casos de uso expuestos.

### Acción realizada

No se modificó ningún archivo original. Los adaptadores no inventan rutas: solo documentan
convenciones y marcan el catálogo como pendiente (`input/rest-controllers.md`, §10).

---

## O-09 — Mecanismo de autenticación y verificación del estado del usuario

### Observación arquitectónica

Se detectó que la arquitectura exige usuario autenticado, rol único y alcance por rol (RG-01, RG-02,
RG-03) y que el `ExecutionContext{userId, role}` debe resolver identidad y rol, pero que el
mecanismo técnico queda explícitamente fuera de alcance (`Input-Ports.md`, §8 y §27). Además,
`Domain Object Value.md` (§5) establece que solo un usuario `ACTIVO` puede autenticarse y realizar
operaciones, mientras `INACTIVO` y `BLOQUEADO` quedan deshabilitados.

Verificar el estado requiere leer el usuario, y `Output-Ports.md` (§5.1) asigna a `UserRepository`
la capacidad de "recuperar estado y rol del usuario".

### Impacto

Si el adaptador de entrada verifica el estado operativo consultando `UserRepository`, un adaptador de
entrada accedería a un Output Port, lo que contradice la separación entrada/salida y el ejemplo
incorrecto de `Input-Ports.md` (§31).

### Recomendación

Mantener en el núcleo la verificación del estado operativo del usuario (el caso de uso dispone de
`UserRepository`) y limitar el adaptador de entrada a resolver identidad y rol.

### Acción realizada

No se modificó ningún archivo original. El diseño documenta ambas alternativas y recomienda la
verificación en el núcleo (`input/authentication-adapter.md`, §8).

---

## O-10 — `RegistroAuditoria` incompleto respecto a lo exigido por `AuditService`

### Observación arquitectónica

Se detectó una divergencia interna en la documentación de auditoría:

| Requisito | Fuente | ¿Atributo de `RegistroAuditoria`? |
|---|---|---|
| ¿Qué ocurrió? (operación) | `Services/AuditService.md` §6 | Sí (`tipoEvento`) |
| ¿Cuándo? | §6 | Sí (`marcaTiempo`) |
| ¿Quién? | §6 | Sí (`realizadoPorUsuario`, `rolUsuario`) |
| **¿Sobre qué? (entidad afectada)** | §6 | **No existe atributo** |
| **¿Resultado?** | §6 | **No existe atributo** |
| **¿Qué severidad?** | §6; `Domain Object Value.md` §13.1 | **No existe atributo** (existe el objeto de valor `GravedadAuditoria`) |

Además, `Output-Ports.md` (§12.1) declara `buscarPorEntidad(entidadTipo, entidadId)`, pero
`RegistroAuditoria` (`DomainModel .md`, §11) no tiene atributos de tipo de entidad ni de
identificador de entidad.

### Impacto

El adaptador `MongoAuditRepository` (S13) no puede construir ni indexar los campos que sus propios
métodos requieren, y `QueryAuditLogUseCase` (`Input-Ports.md`, §20.1) filtra por `eventType` y
`severity`, donde `severity` no tiene atributo documentado.

### Recomendación

Completar `RegistroAuditoria` con los atributos exigidos (entidad afectada, resultado, severidad) o
declarar formalmente que esa información vive dentro de `detalles` (`Map<String,Object>`), con un
contrato explícito de claves.

### Acción realizada

No se modificó `DomainModel .md` ni `Output-Ports.md`. El adaptador documenta únicamente los
atributos existentes y marca el resto como pendiente (`output/mongodb-adapters.md`, §6.1).

---

## O-11 — Consistencia entre la transacción SQL y la auditoría en MongoDB

### Observación arquitectónica

Se detectó que existen dos almacenes (SQL transaccional y MongoDB documental), que
`Output-Ports.md` (§5 y §17) prohíbe duplicar los datos transaccionales en MongoDB y que las reglas
AUD-01 y AUD-02 (`DomainModel .md`, §13) exigen que todo movimiento de inventario quede auditado y
que los registros sean inmutables. No se documenta ninguna estrategia de consistencia entre ambos.

### Impacto

Si la transacción SQL confirma y la escritura en MongoDB falla, existiría una operación de negocio
sin trazabilidad, lo que violaría AUD-01. Si se intentara una transacción distribuida, se
introduciría una complejidad no prevista.

### Recomendación

Documentar explícitamente la estrategia (por ejemplo: registrar la auditoría dentro de la transacción
transaccional como evento pendiente y confirmarla después, reintentos con idempotencia, o un patrón
de registro compensatorio), aclarando el nivel de garantía aceptado.

### Acción realizada

No se modificó ningún archivo original. El riesgo se documenta en
`output/persistence-adapters.md` (§9) y `output/mongodb-adapters.md` (§10).

---

## O-12 — Decisión de facturación abierta (S10 frente a S16)

### Observación arquitectónica

Se detectó que `Output-Ports.md` (§9) presenta `InvoiceRepository` como facturación propia y
`BillingGateway` como facturación externa "si aplica", sin decidir cuál se utiliza, mientras
`Input-Ports.md` (§15.2) define `CreateInvoiceUseCase` con actor "Sistema".

### Impacto

Los adaptadores `SQLInvoiceRepository` (S10) y `BillingGateway` (S16) son mutuamente excluyentes para
un mismo flujo; implementar ambos produciría dos fuentes de verdad para la facturación.

### Recomendación

Elegir una alternativa y documentarla. Si se opta por un proveedor externo, definir también si
NexusMarket conserva una copia local de la factura.

### Acción realizada

No se modificó ningún archivo original. El diseño documenta ambas variantes y marca la exclusión
mutua (`output/external-service-adapters.md`, §4.3).

---

## O-13 — Dos estructuras de proyecto propuestas

### Observación arquitectónica

Se detectó que:

- `Input-Ports.md` (§32) propone raíz `src/` con `application/ports/{input,output}`,
  `adapters/in/rest`, `adapters/out`, `domain/{models,valueobjects,services,ports,exceptions}` e
  `infrastructure/{config,database,security}`.
- `Output-Ports.md` (§15) propone raíz `src/main/typescript/` con `domain`, `application` y
  `adapters/out/{persistence/{sql,mongo},external/{payments,logistics}}`.

Las propuestas difieren en la raíz, en el nivel de detalle y en la enumeración de carpetas.

### Impacto

La ubicación real de los adaptadores queda ambigua, lo que afecta a las convenciones de importación y
a la organización del código.

### Recomendación

Adoptar una única estructura de referencia (por ejemplo, la de `Input-Ports.md` §32, ampliada con el
detalle de `Output-Ports.md` §15) y citarla desde ambos documentos.

### Acción realizada

No se modificó ningún archivo original. `architecture.md` (§9) documenta ambas propuestas y adopta
una ubicación conceptual compatible para esta capa de documentación.

---

## O-14 — `ReportingQuery` y la responsabilidad de autorización

### Observación arquitectónica

Se detectó que `Output-Ports.md` (§13.1) declara que la implementación de `ReportingQuery` "debe
respetar la autorización correspondiente al rol del usuario", mientras que la autorización se
atribuye al núcleo en el resto de la arquitectura (`Input-Ports.md`, §29 regla IP-09; RG-03).

### Impacto

Si el adaptador de consulta implementara reglas de autorización, se duplicarían decisiones de
negocio en la infraestructura y se rompería la separación de responsabilidades.

### Recomendación

Aclarar que el adaptador recibe filtros ya decididos por el núcleo y que la autorización se resuelve
en el caso de uso o servicio correspondiente.

### Acción realizada

No se modificó `Output-Ports.md`. El diseño documenta la aclaración y asigna la autorización al
núcleo (`output/persistence-adapters.md`, §8).

---

## O-15 — Nomenclatura mixta español/inglés y convenciones de nombres

### Observación arquitectónica

Se detectó mezcla de idiomas y de convenciones:

| Elemento | Ejemplo | Documento |
|---|---|---|
| Entidades en español | `Usuario`, `Comprador`, `Producto`, `Pedido` | `DomainModel .md` |
| Entidades en inglés en el mismo documento | `User`, `Buyer`, `Seller`, `Product`, `Warehouse` | `Domain  Servicies.md` §2 |
| Puertos en inglés | `UserRepository`, `PaymentGateway`, `ReportingQuery` | `Output-Ports.md` §27 |
| Métodos en español | `guardar`, `buscarPorId`, `buscarPorCorreo` | `Output-Ports.md` §5.1 |
| Métodos en inglés | `findUser` (ejemplo de lo incorrecto), `registerBuyer`, `onboardSeller` | `Output-Ports.md` §21; `Domain  Servicies.md` §4 |
| Casos de uso con patrón `AcciónObjetoUseCase` | `RegisterBuyerUseCase` | `Input-Ports.md` §7 |

### Impacto

Las firmas de los adaptadores y de los mappers podrían quedar inconsistentes según el documento que
se tome como referencia, dificultando la lectura y las revisiones de código.

### Recomendación

Fijar una convención explícita (por ejemplo: entidades de dominio en español según
`DomainModel .md`; puertos, DTOs y adaptadores en inglés según `Output-Ports.md`; métodos de puerto
en español tal como están documentados) y aplicarla de forma uniforme.

### Acción realizada

No se modificó ningún archivo original. El diseño respeta la nomenclatura existente (nombres de
adaptadores con prefijo tecnológico `SQL*`, `Mongo*`) y no renombra puertos ni entidades.

---

## O-16 — Sin puerto para notificaciones ni para entrega de productos digitales

### Observación arquitectónica

Se detectó que:

- `Output-Ports.md` (§1) lista los "servicios de notificación" entre las dependencias de las que el
  dominio debe mantenerse independiente, pero la matriz de puertos (§27) **no incluye** ningún puerto
  de notificación.
- `DomainModel .md` (§6.3 y §12) describe que los productos digitales se entregan de forma inmediata
  tras el pago confirmado y omiten inventario, empaque, despacho y transporte, pero no existe puerto
  ni caso de uso concreto para esa entrega.
- `Input-Ports.md` (§16.1) menciona que "los productos digitales utilizan el mecanismo de entrega
  correspondiente a su naturaleza", sin definirlo.

### Impacto

No puede diseñarse un adaptador de notificación ni de entrega digital sin contrato previo; hacerlo
constituiría invención de componentes.

### Recomendación

Declarar los Output Ports correspondientes (por ejemplo, `NotificationGateway` o
`DigitalDeliveryGateway`) en el núcleo antes de crear adaptadores, si el alcance del proyecto los
requiere.

### Acción realizada

No se modificó ningún archivo original ni se creó ningún adaptador para estos casos
(`architecture.md`, §5.4 y §13 Decisión 6).

---

## O-17 — `EstadoComercial` sin caso de uso que lo modifique

### Observación arquitectónica

Se detectó que `Domain Object Value.md` (§6) define los estados `HABILITADO` y `RESTRINGIDO` para el
comprador, con la regla "un comprador restringido no debe iniciar nuevas compras", pero:

- `Input-Ports.md` no define ningún caso de uso para cambiar el estado comercial.
- `UpdateUserAccessStatusUseCase` opera sobre `EstadoUsuario` (`ACTIVO`, `INACTIVO`, `BLOQUEADO`),
  no sobre `EstadoComercial`.
- `Services/UserManagementService.md` registra `CommercialStatus` entre las entidades relacionadas,
  sin operación asociada.

### Impacto

El estado `RESTRINGIDO` no podría alcanzarse por ninguna operación documentada, y las restricciones
del comprador asociadas a ese estado no podrían aplicarse desde los adaptadores.

### Recomendación

Definir el caso de uso y el servicio que modifican el estado comercial del comprador, o aclarar que
ese estado se gestiona por un proceso administrativo no incluido en el alcance actual.

### Acción realizada

No se modificó ningún archivo original. El diseño no crea operaciones ni endpoints para este estado
y lo registra como pendiente (`input/request-dtos.md`, §4.2 y §10).

---

## O-18 — Catálogo de errores conceptual y `ReturnNotAllowed`

### Observación arquitectónica

Se detectó que `Input-Ports.md` (§26) presenta el catálogo de errores como "ejemplos conceptuales" y
delega la transformación a códigos HTTP en el Input Adapter, sin fijar la correspondencia definitiva.
Además, uno de los errores (`ReturnNotAllowed`) presupone reglas de devolución que no están
documentadas (ver O-01), y `Input-Ports.md` (§28) incluye "Reglas de devolución" entre los escenarios
verificables de los casos de uso.

### Impacto

El catálogo definitivo de errores del adaptador no puede cerrarse; `ReturnNotAllowed` quedaría sin
origen verificable.

### Recomendación

Fijar el catálogo de errores con nombres estables, su semántica y su correspondencia con códigos
HTTP, y definir las reglas de devolución que producen `ReturnNotAllowed`.

### Acción realizada

No se modificó ningún archivo original. El diseño usa los nombres del catálogo existente y marca la
correspondencia HTTP como propuesta (`input/rest-controllers.md`, §9).

---

## 19. Resumen de observaciones

| # | Observación | Tipo | ¿Bloquea algún adaptador? |
|---|---|---|---|
| O-01 | Devoluciones y reembolsos sin entidad, servicio ni puerto | Vacío | Sí: E9 y su persistencia |
| O-02 | `Factura` y `Envio` ausentes del modelo de dominio | Vacío | Parcial: S10 y S11 (contrato sí, mapeo no) |
| O-03 | Entrada conceptual ausente en 4 casos de uso | Vacío | Sí: DTOs y mappers de esos casos |
| O-04 | `CreateWarehouseUseCase` sin servicio asignado | Vacío | Parcial: E2 sin trazabilidad hasta servicio |
| O-05 | Tipos de identificadores contradictorios | Inconsistencia | Parcial: firmas y DTOs |
| O-06 | `operatorId` frente al `ExecutionContext` | Inconsistencia | No (se aplica la regla segura) |
| O-07 | Casos de uso internos frente a expuestos | Ambigüedad | No (se decide no exponer `ReserveInventoryUseCase`) |
| O-08 | Catálogo de endpoints no especificado | Vacío | Sí: cierre de E1–E11 |
| O-09 | Mecanismo de autenticación y verificación de estado | Vacío | Parcial: E15 y S17 |
| O-10 | `RegistroAuditoria` incompleto frente a `AuditService` | Inconsistencia | Parcial: campos del documento de auditoría |
| O-11 | Consistencia SQL ↔ MongoDB | Vacío | No bloquea, pero exige estrategia |
| O-12 | Decisión de facturación abierta | Decisión pendiente | Sí: S10 o S16 |
| O-13 | Dos estructuras de proyecto propuestas | Inconsistencia | No (documental) |
| O-14 | Autorización en `ReportingQuery` | Ambigüedad | No (se asigna al núcleo) |
| O-15 | Nomenclatura mixta español/inglés | Inconsistencia | No (convención documentada) |
| O-16 | Sin puerto de notificaciones ni entrega digital | Vacío | No (no se crean adaptadores) |
| O-17 | `EstadoComercial` sin caso de uso que lo modifique | Vacío | No (no se crean operaciones) |
| O-18 | Catálogo de errores conceptual y `ReturnNotAllowed` | Ambigüedad | Parcial: mapeo HTTP propuesto |

---

## 20. Prioridad sugerida de resolución

```text
1. Modelo de negocio faltante        → O-01, O-02, O-17
2. Contratos de entrada/salida       → O-03, O-08, O-18
3. Seguridad                         → O-09
4. Consistencia de datos             → O-10, O-11
5. Decisiones tecnológicas           → O-12
6. Convenciones y organización       → O-05, O-07, O-13, O-14, O-15
7. Ampliaciones de alcance           → O-16
```

Resolver los grupos 1 y 2 permite cerrar la mayoría de adaptadores de entrada y de persistencia sin
introducir suposiciones.

---

## 21. Declaración de restricciones respetadas

```text
Archivos creados/modificados:  únicamente dentro de SDD/Adapters/
Modificaciones en SDD/Domain/:  ninguna
Modificaciones en servicios:    ninguna
Modificaciones en Input Ports:  ninguna
Modificaciones en Output Ports: ninguna
Modificaciones de código fuente: ninguna (no existe código en el repositorio)
Modificaciones de configuración o README raíz: ninguna
Dependencias instaladas:         ninguna
Código implementado:             ninguno (solo documentación .md)
```





