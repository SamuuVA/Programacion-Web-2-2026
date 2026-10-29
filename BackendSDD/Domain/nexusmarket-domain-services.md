# NEXUSMARKET — Servicios y Políticas de Dominio (Domain Services)

**Documento:** catálogo canónico de servicios y políticas de dominio.
**Versión:** 1.0 — línea base 2.0.
**Fecha:** 26 de octubre de 2026.
**Idioma:** español técnico; nombres canónicos de dominio en español.
**Fuentes:** `[MOD]` = `nexusmarket-domain-model.md`; `[ENU]` = `enunciado.md`; `[ARQ]` = `nexusmarket-arquitectura.md`; `[PM]` = `Prompt-maestro-documentacion.md`; `[VO]` = `nexusmarket-domain-object-values.md`; `[DS]` = este documento.

---

## 1. Propósito y alcance

### 1.1 Qué documenta este documento

Este documento especifica los **servicios y políticas de dominio** de NexusMarket: las reglas de negocio que no pertenecen naturalmente a una sola entidad o agregado y que, por tanto, requieren comparar o coordinar varios conceptos del dominio.

Para cada servicio o política se documentan veinte puntos obligatorios:

1. Identificador y nombre canónico.
2. Definición de negocio.
3. Propósito.
4. Justificación como servicio o política de dominio.
5. Responsabilidad única.
6. Alcance: qué incluye.
7. Fuera de alcance: qué no incluye.
8. Actores y autorización.
9. Entradas conceptuales.
10. Salidas y resultados.
11. Precondiciones.
12. Reglas de negocio aplicadas.
13. Invariantes protegidas.
14. Flujo conceptual.
15. Casos límite y decisiones.
16. Errores y rechazos.
17. Efectos secundarios y eventos.
18. Consistencia y transaccionalidad.
19. Dependencias y relaciones.
20. Ejemplos, trazabilidad y estado.

### 1.2 Qué no documenta este documento

- No documenta casos de uso, servicios de aplicación ni puertos de entrada o salida.
- No documenta adaptadores, controladores HTTP, repositorios, esquemas SQL, colecciones MongoDB, DTOs ni contratos de API.
- No documenta entidades ni agregados en detalle; esos conceptos pertenecen a `[MOD]`.
- No documenta objetos de valor en detalle; su especificación canónica está en `[VO]`.
- No fija políticas de negocio variables: moneda, escala, redondeo, tasas, plazos, catálogos de motivos, formatos de dirección ni preferencia de bodega.
- No convierte en servicio de dominio una operación que solo coordina repositorios, transacciones o proveedores externos.

### 1.3 Relación con el modelo de dominio

`[MOD]` §18 enumera nueve servicios y políticas. Este documento los adopta como inventario canónico y los desarrolla sin cambiar sus nombres ni sus responsabilidades. Cuando `[MOD]` describe una regla dentro de un agregado, este documento la referencia y no la duplica.

La relación es la siguiente:

| Nivel | Documento | Responsabilidad |
|---|---|---|
| Reglas y estructura | `[MOD]` | Entidades, agregados, invariantes, estados y decisiones DD. |
| Tipos y valores | `[VO]` | Objetos de valor, catálogos controlados e invariantes de valor. |
| Reglas distribuidas | `[DS]` (este documento) | Servicios y políticas que comparan varios conceptos. |
| Coordinación | Futuros casos de uso | Orquestación de repositorios, transacciones y puertos. |
| Integración | Futuros puertos y adaptadores | Traducción al mundo externo. |

### 1.4 Criterio de distinción

Se aplican las definiciones de `[PM]` §5.3:

- **Servicio de dominio:** expresa una regla de negocio que no pertenece naturalmente a una sola entidad o agregado.
- **Servicio de aplicación o caso de uso:** coordina una operación; recupera y persiste estado mediante puertos, invoca dominio y coordina dependencias.
- **Adaptador:** traduce entre el mundo externo y el contrato de un puerto.
- **Puerto:** define una capacidad requerida u ofrecida en el límite de la aplicación.

Un servicio de dominio puede ser puro (solo decide) o puede aplicar un efecto sobre un agregado cuando la regla exige comparar varias posiciones. Nunca abre transacciones, no ejecuta SQL, no llama proveedores y no conoce HTTP.

### 1.5 Convenciones de este documento

- Los códigos de error son **identificadores documentales** para trazabilidad y pruebas. No son contratos de API ni mensajes definitivos de interfaz.
- Las políticas configurables se nombran como tales y remiten a `DEC-BIZ-*` cuando la decisión requiere aprobación externa.
- Las referencias `DS-01`…`DS-09` son estables.
- Las referencias a invariantes usan los códigos de `[MOD]` §21 y de `[VO]` §12.
- Cuando una regla no está confirmada, se marca como **decisión de diseño** o **parcialmente especificada**; no se presenta como requisito.
- **Numeración de invariantes de inventario:** `[MOD]` §8.2.1 y §21 enumeran `INV-01…INV-10` con contenidos distintos. Este documento adopta la numeración de §8.2.1, que es la sección normativa del agregado `Inventario`, y registra la discrepancia como `C-11` en `DOCUMENTATION_STATUS.md`.

---

## 2. Criterios de clasificación y descarte

### 2.1 Prueba de pertenencia

Un candidato se documenta como servicio o política de dominio solo si responde afirmativamente a estas preguntas:

| Pregunta | Si la respuesta es “no” |
|---|---|
| ¿La regla compara dos o más agregados, objetos de valor o estados? | Puede pertenecer a una entidad o agregado. |
| ¿La regla es estable aunque cambie el transporte, la base de datos o el proveedor? | Es un caso de uso o un adaptador. |
| ¿La regla puede expresarse sin abrir transacciones ni llamar servicios externos? | Es coordinación de aplicación. |
| ¿La regla tiene un nombre de negocio comprensible para un experto? | Probablemente es infraestructura. |
| ¿La regla necesita datos que el dominio ya posee o puede recibir como valores? | Si depende de detalles técnicos, no es dominio. |

### 2.2 Distinciones aplicadas a NexusMarket

| Concepto | Se clasifica como | Motivo |
|---|---|---|
| Evaluar rol, propiedad y estado de recurso | Política de dominio | Combina `Usuario`, rol y estado de varios agregados. |
| Decidir si un producto puede publicarse | Política de dominio | Combina producto, vendedor, variantes y precio. |
| Reservar, liberar o consumir stock | Servicio de dominio con efecto | Compara disponibilidad y aplica una transición sobre inventario y reserva. |
| Elegir bodegas para líneas físicas | Servicio de dominio de solo lectura | Compara disponibilidad y compatibilidad; no reserva. |
| Calcular subtotal, descuentos, impuestos y total | Servicio de dominio puro | Aplica reglas monetarias sobre varias líneas. |
| Validar una transición de pedido | Política de dominio | Compara estado del pedido, pago y envíos. |
| Evaluar elegibilidad de devolución | Política de dominio | Compara pedido, comprador, cantidades y plazo. |
| Verificar saldo reembolsable | Política de dominio | Compara pago, reembolsos y aprobación. |
| Construir un registro de auditoría | Servicio de dominio | Normaliza un hecho y aplica reglas de minimización. |
| Registrar un usuario | Caso de uso | Coordina persistencia, unicidad y eventos. |
| Enviar un correo | Adaptador | Traduce a un proveedor externo. |
| Cobrar con una pasarela | Caso de uso + adaptador | Coordina pago, idempotencia y red. |

### 2.3 Candidatos evaluados y descartados

| Candidato | Clasificación correcta | Razón del descarte como servicio de dominio |
|---|---|---|
| `UserManagementService` | Caso de uso + agregado `Usuario` + `DS-01` | La creación, unicidad y persistencia son coordinación; la autorización sí es política. |
| `CatalogService` | Agregados `Producto`/`Variante` + `DS-02` | La persistencia y los handlers no son dominio; la elegibilidad de publicación sí. |
| `InventoryService` | Agregados `Inventario`/`Reserva` + `DS-03`/`DS-04` | El servicio antiguo mezclaba consulta, reserva, ajuste y persistencia. |
| `OrderProcessingService` | Agregados `Pedido`/`Pago`/`Envio` + `DS-05`/`DS-06` | La orquestación del checkout es un caso de uso; el cálculo y la transición son dominio. |
| `AuditService` | `DS-09` + persistencia documental | La escritura durable y el outbox son infraestructura; la normalización es dominio. |
| `ServicioPago` | Caso de uso + puerto de salida | El protocolo del proveedor no pertenece al dominio; las reglas viven en `Pago`, `DS-06` y `DS-08`. |
| `ServicioFacturacion` | Agregado `Factura` + caso de uso | La emisión y numeración fiscal requieren coordinación y política externa. |
| `ServicioEnvio` | Agregado `Envio` + caso de uso | La asignación de transportista es integración; el estado pertenece al agregado. |
| `ServicioNotificaciones` | Adaptador | Es integración, no regla de negocio. |
| `ServicioPrecios` | `DS-05` | El cálculo monetario ya está cubierto; un servicio separado duplicaría la regla. |
| `ServicioCarrito` | Agregado `Carrito` | Las reglas de carrito pertenecen al agregado y al checkout. |
| `ServicioEntregaDigital` | Caso de uso + puerto | La ejecución de la entrega es integración; la evidencia pertenece al pedido. |

### 2.4 Regla de no duplicación

Ningún servicio redefine una regla que ya pertenece a un agregado o a un objeto de valor. Si un servicio necesita una regla nueva, se documenta en el servicio y se referencia; no se crea un segundo concepto con el mismo significado. Si un objeto de valor necesita una regla que el servicio no aplica, el servicio está incompleto.

---

## 3. Inventario canónico

| ID | Nombre canónico | Tipo | Responsabilidad de dominio | Agregados y VOs implicados | Reglas principales | Fuente | Estado |
|---|---|---|---|---|---|---|---|
| `DS-01` | `PoliticaAutorizacionDominio` | Política | Evaluar rol, propiedad, alcance y estado del recurso. | `Usuario`, perfiles, recursos; `RolSistema`, `EstadoUsuario`, `EstadoComercial`, `EstadoVendedor`, `EstadoProducto`, `EstadoBodega`, `EstadoPedido`. | RG-01…RG-03, USR-03, SUP-01, §19.1 | `[MOD]` §18, §19 | Confirmado |
| `DS-02` | `PoliticaPublicacionCatalogo` | Política | Decidir si producto, vendedor, variantes y precio cumplen publicación. | `Producto`, `Variante`, `PerfilVendedor`; `EstadoProducto`, `EstadoVendedor`, `EstadoVariante`, `SKU`, `Dinero`, `CategoriaProducto`, `TipoEntrega`. | CAT-01…CAT-07 | `[MOD]` §7, §18, §21 | Confirmado |
| `DS-03` | `ServicioReservaInventario` | Servicio con efecto | Validar disponibilidad y aplicar reserva, liberación, consumo o expiración. | `Inventario`, `ReservaInventario`, `MovimientoInventario`; `Cantidad`, `CantidadPositiva`, `EstadoReserva`, `TipoMovimientoInventario`, `IdempotencyKey`. | INV-01…INV-10, DD-04, DD-05 | `[MOD]` §8, §18 | Confirmado |
| `DS-04` | `ServicioAsignacionBodega` | Servicio de solo lectura | Seleccionar bodegas elegibles por disponibilidad y compatibilidad. | `Bodega`, `Inventario`, `Pedido`, `Envio`; `TipoBodega`, `EstadoBodega`, `TipoEntrega`, `CantidadPositiva`. | INV-02…INV-04, ORD-07, LOG-01 | `[MOD]` §8, §13, §18 | Confirmado; preferencia limitada |
| `DS-05` | `ServicioCalculoPedido` | Servicio puro | Calcular subtotal, descuentos, impuestos, envío y total con reglas monetarias. | `Pedido`, `ItemPedido`, `Carrito`; `Dinero`, `CantidadPositiva`. | §16.1, fórmula de total | `[MOD]` §10, §16.1, §18 | Confirmado; tasas limitadas |
| `DS-06` | `PoliticaTransicionPedido` | Política | Comprobar transiciones válidas y precondiciones de cumplimiento. | `Pedido`, `Pago`, `Envio`; `EstadoPedido`, `EstadoPago`, `EstadoEnvio`, `DireccionSnapshot`. | ORD-01…ORD-08, §10.3, §10.4 | `[MOD]` §10, §18 | Confirmado |
| `DS-07` | `PoliticaElegibilidadDevolucion` | Política | Evaluar plazo, propiedad, entrega, cantidades y condiciones. | `Devolucion`, `Pedido`, `PerfilComprador`; `EstadoPedido`, `EstadoDevolucion`, `MotivoDevolucion`, `CantidadPositiva`, `Instant`. | RET-01, RET-02, DD-12 | `[MOD]` §14.1, §18 | Confirmado; plazo limitado |
| `DS-08` | `PoliticaReembolso` | Política | Verificar saldo reembolsable, aprobación y límites por pago. | `Pago`, `Reembolso`, `Devolucion`; `EstadoPago`, `EstadoReembolso`, `Dinero`, `MotivoReembolso`, `IdempotencyKey`. | REF-01, PAY-05, §14.2 | `[MOD]` §14.2, §18 | Confirmado; moneda limitada |
| `DS-09` | `ServicioAuditoria` | Servicio | Construir eventos normalizados, sin secretos, con correlación y actor. | `RegistroAuditoria`; `CodigoEvento`, `GravedadAuditoria`, `ResultadoAuditoria`, `CorrelationId`, `AuditPayload`, `RolSistema`, `Instant`. | AUD-01…AUD-06, §15.1, §20 | `[MOD]` §15, §18 | Confirmado; catálogo limitado |

**Cobertura:** los nueve servicios de `[MOD]` §18 están representados. No se añaden servicios canónicos fuera de esa lista. Los candidatos descartados se registran en §2.3.

---

## 4. Especificación de servicios y políticas

Cada sección aplica los veinte puntos de §1.1. Los puntos se numeran para permitir verificación mecánica.

### 4.1 DS-01 — `PoliticaAutorizacionDominio`

**1. Identificador y nombre canónico.** `DS-01`, `PoliticaAutorizacionDominio`.

**2. Definición de negocio.** Política que decide si un actor puede ejecutar una capacidad de negocio sobre un recurso concreto, considerando su rol, su vínculo con el recurso y el estado actual de la cuenta y del recurso.

**3. Propósito.** Impedir que un actor opere fuera de su rol, de su alcance o sobre un recurso cuyo estado no permite la operación, sin depender exclusivamente del middleware HTTP.

**4. Justificación como política de dominio.** La decisión combina información de varios agregados —cuenta, perfil, producto, bodega, pedido, pago, devolución— y no puede vivir en una sola entidad. Además, la regla de separación de funciones y la de supervisor de solo lectura son reglas de negocio, no detalles de transporte.

**5. Responsabilidad única.** Producir una decisión de autorización de dominio con motivo y obligaciones asociadas.

**6. Alcance.**

- Verificar que la cuenta esté `ACTIVO`.
- Verificar que el rol permita la capacidad solicitada.
- Verificar propiedad, asignación operativa o autoridad administrativa sobre el recurso.
- Verificar que el estado del recurso permita la operación.
- Exigir motivo y auditoría en operaciones privilegiadas o excepcionales.
- Impedir la autoaprobación en conflictos de interés.
- Aplicar la restricción de solo lectura del Supervisor.

**7. Fuera de alcance.**

- Validar tokens, sesiones, firmas o credenciales.
- Leer encabezados HTTP, cookies o parámetros de transporte.
- Consultar directamente la base de datos.
- Autenticar al actor.
- Conceder permisos implícitos por conveniencia.
- Definir la matriz de capacidades; la matriz pertenece a `[MOD]` §19 y esta política la aplica.

**8. Actores y autorización.** Cualquier actor autenticado puede solicitar una decisión. La política no autentica: recibe la identidad y el rol ya establecidos por la capa de aplicación. Los actores previstos son Comprador, Vendedor, Operador logístico, Administrador, Supervisor y actores de sistema autorizados.

**9. Entradas conceptuales.**

| Entrada | Obligatoria | Uso |
|---|---:|---|
| Identidad del actor | Sí | Sujeto de la decisión. |
| `RolSistema` del actor | Sí | Capacidad nominal. |
| `EstadoUsuario` | Sí | Condición de acceso. |
| Capacidad solicitada | Sí | Acción de negocio a evaluar. |
| Tipo y referencia del recurso | Sí | Objeto de la operación. |
| Vínculo con el recurso | Condicional | Propietario, asignado, administrador o ninguno. |
| Estado del recurso | Condicional | Condición que habilita o bloquea. |
| Motivo declarado | Condicional | Obligatorio en operaciones privilegiadas. |

**10. Salidas y resultados.** Una decisión `PERMITIDA` o `DENEGADA`, un código de motivo estable y una lista de obligaciones: exigir motivo, registrar auditoría, aplicar separación de funciones o limitar a lectura. La salida no es un token ni una sesión.

**11. Precondiciones.** Identidad del actor disponible; rol conocido; recurso identificado; estado del recurso disponible o declarado como desconocido. Si falta un dato esencial, la política deniega por defecto.

**12. Reglas de negocio aplicadas.**

- `RG-01`: toda operación protegida requiere actor autenticado.
- `RG-02`: cada cuenta tiene exactamente un rol.
- `RG-03`: ningún actor opera fuera de su rol y alcance.
- `USR-03`: una cuenta inactiva o bloqueada no inicia operaciones protegidas.
- `SUP-01`: el Supervisor solo consulta.
- `[MOD]` §19: matriz de capacidades por rol.
- `[MOD]` §19.1: reglas transversales de autorización.

**13. Invariantes protegidas.**

- `INV-VO-ROL-01`: un rol por cuenta.
- `INV-VO-ROL-03`: el rol no concede acceso automático a todos los recursos.
- `INV-VO-EUSR-02`: una cuenta inactiva o bloqueada no opera.
- `INV-VO-ECOM-02`: un comprador `RESTRINGIDO` no crea pedidos nuevos.
- `INV-VO-EVEND-02`: un vendedor suspendido no publica ni inicia ventas nuevas.
- `INV-VO-EPROD-02`: un producto suspendido no se vende.
- `INV-VO-EBOD-02`: una bodega inactiva no recibe reservas.
- Separación de funciones: quien aprueba una devolución o un reembolso no debe ser el mismo actor que la solicitó o que tiene conflicto directo.

**14. Flujo conceptual.**

1. Rechazar si falta identidad o capacidad.
2. Verificar `EstadoUsuario = ACTIVO`; si no, denegar por cuenta no operativa.
3. Verificar que el rol figure como habilitado para la capacidad en la matriz.
4. Verificar el vínculo con el recurso: propietario, asignado o autoridad administrativa.
5. Verificar que el estado del recurso permita la operación.
6. Aplicar reglas especiales de conflicto y de solo lectura.
7. Determinar obligaciones: motivo, auditoría, doble control.
8. Devolver decisión y motivo.

**15. Casos límite y decisiones.**

- **Administrador sobre recurso propio:** la matriz permite intervención administrativa, pero las operaciones que exigen separación de funciones siguen bloqueadas. Es decisión de diseño aplicar la restricción más estricta.
- **Supervisor:** toda capacidad de escritura se deniega aunque el recurso sea propio.
- **Actor de sistema:** se identifica como actor autorizado y no como usuario humano; no puede aprobar conflictos comerciales.
- **Estado desconocido:** se deniega por defecto; no se asume habilitación.
- **Cambio de rol en el mismo flujo:** la decisión usa el rol vigente al momento de la evaluación; no se cachea entre operaciones.
- **Soporte excepcional de carrito:** se permite solo con motivo y auditoría, no como operación ordinaria.

**16. Errores y rechazos.**

| Código documental | Situación |
|---|---|
| `AUTH_ACTOR_REQUIRED` | Falta identidad de actor. |
| `AUTH_ACCOUNT_NOT_ACTIVE` | Cuenta inactiva o bloqueada. |
| `AUTH_ROLE_NOT_ALLOWED` | El rol no habilita la capacidad. |
| `AUTH_OUT_OF_SCOPE` | El actor no es propietario, asignado ni autoridad. |
| `AUTH_RESOURCE_STATE_BLOCKS` | El estado del recurso impide la operación. |
| `AUTH_SELF_APPROVAL_FORBIDDEN` | Conflicto de interés o autoaprobación. |
| `AUTH_MOTIVE_REQUIRED` | Operación privilegiada sin motivo. |
| `AUTH_READ_ONLY_ROLE` | El rol es de solo lectura. |

**17. Efectos secundarios y eventos.** La política no modifica estado. Puede exigir que el caso de uso registre auditoría; no escribe el registro por sí misma. No emite eventos de negocio.

**18. Consistencia y transaccionalidad.** Es una evaluación de solo lectura. La capa de aplicación debe proporcionar datos vigentes y volver a verificar dentro de la operación que muta estado para evitar carreras entre la decisión y la escritura.

**19. Dependencias y relaciones.**

- Depende de datos de dominio: identidad, rol, estados y vínculos.
- No depende de HTTP, tokens, repositorios concretos, ORM, MongoDB ni SDKs.
- Se relaciona con todos los agregados protegidos y con `DS-02`, `DS-03`, `DS-06`, `DS-07`, `DS-08` y `DS-09`.
- Consume los VOs `RolSistema`, `EstadoUsuario`, `EstadoComercial`, `EstadoVendedor`, `EstadoProducto`, `EstadoBodega`, `EstadoPedido`.

**20. Ejemplos, trazabilidad y estado.**

| Caso | Resultado |
|---|---|
| Vendedor publica un producto propio y está `ACTIVO`. | Permitido con auditoría. |
| Vendedor intenta publicar un producto de otro vendedor. | Denegado por alcance. |
| Supervisor intenta suspender un producto. | Denegado por rol de solo lectura. |
| Comprador `RESTRINGIDO` intenta crear pedido. | Denegado por estado comercial. |
| Administrador intenta aprobar su propia devolución. | Denegado por separación de funciones. |

**Trazabilidad:** `[MOD]` §18, §19, §19.1, §21 (RG-01…RG-03, USR-03, SUP-01); `[ENU]` RG-01…RG-03; `[VO]` §8.1, §8.5, §8.6, §8.7, §8.8, §8.10, §8.11.

**Estado:** **Confirmado por fuente**.

---

### 4.2 DS-02 — `PoliticaPublicacionCatalogo`

**1. Identificador y nombre canónico.** `DS-02`, `PoliticaPublicacionCatalogo`.

**2. Definición de negocio.** Política que decide si un producto, su vendedor, sus variantes y sus precios cumplen las condiciones para estar publicado y ser vendible.

**3. Propósito.** Evitar que se publique una oferta incompleta, incoherente o de un vendedor no habilitado, sin confundir publicación con disponibilidad de stock.

**4. Justificación como política de dominio.** La decisión compara el estado del producto, el estado del vendedor, la existencia y estado de las variantes, la unicidad del SKU y la validez del precio. Ninguno de esos datos pertenece a una sola entidad.

**5. Responsabilidad única.** Producir una decisión de elegibilidad de publicación con motivos.

**6. Alcance.**

- Verificar que el producto pertenezca a un vendedor.
- Verificar que el vendedor esté `ACTIVO`.
- Verificar datos obligatorios del producto.
- Verificar al menos una variante válida y activa.
- Verificar SKU no vacío y único en el ámbito de la plataforma.
- Verificar precio mayor que cero y moneda explícita.
- Verificar coherencia entre `TipoEntrega` y subtipo de producto.
- Verificar coherencia entre categoría y tipo cuando la política lo exija.

**7. Fuera de alcance.**

- Persistir el producto o cambiar su estado.
- Invocar handlers, eventos o adaptadores.
- Exigir stock positivo para publicar; la línea base permite publicar sin stock y exige disponibilidad al comprar.
- Reservar inventario.
- Definir el catálogo de categorías; pertenece al VO `CategoriaProducto`.
- Validar la identidad del vendedor; eso corresponde a `DS-01`.

**8. Actores y autorización.** La política es invocada por el caso de uso de publicación. El actor debe ser el vendedor propietario o un Administrador autorizado; esa verificación la realiza `DS-01` antes de invocar esta política.

**9. Entradas conceptuales.**

| Entrada | Obligatoria | Uso |
|---|---:|---|
| Producto | Sí | Estado, tipo, categoría, nombre, descripción. |
| Vendedor propietario | Sí | Estado del vendedor. |
| Variantes | Sí | Al menos una; estado, SKU, precio, atributos. |
| Moneda del precio | Sí | Coherencia monetaria. |
| Configuración de catálogo | Condicional | Reglas de categoría y tipo. |

**10. Salidas y resultados.** Decisión `PUBLICABLE` o `NO_PUBLICABLE`, lista de incumplimientos y, cuando aplique, la variante mínima que permite publicar. No devuelve una entidad persistida.

**11. Precondiciones.** Producto identificado; vendedor propietario conocido; variantes cargadas; precios con moneda. Si no hay variantes, la decisión es negativa.

**12. Reglas de negocio aplicadas.**

- `CAT-01`: un producto pertenece a un único vendedor.
- `CAT-02`: todo producto tiene al menos una variante antes de publicarse.
- `CAT-03`: la publicación exige vendedor `ACTIVO`, datos obligatorios válidos, variantes vendibles y precio válido.
- `CAT-04`: un producto suspendido no se ofrece para nuevas compras.
- `CAT-05`: un producto descontinuado no admite nuevas ventas ni retorno a `PUBLICADO`.
- `CAT-06`: modificar el catálogo no altera snapshots de pedidos confirmados.
- `CAT-07`: solo el vendedor propietario o un Administrador cambia el estado.
- `[MOD]` §22.2: la publicación no exige stock positivo; la compra sí exige disponibilidad.

**13. Invariantes protegidas.**

- `INV-VO-EPROD-01`: código de estado válido.
- `INV-VO-EPROD-04`: un producto publicado posee al menos una variante válida.
- `INV-VO-EPROD-03`: un producto descontinuado no vuelve a publicarse.
- `INV-VO-EVAR-01`: código de estado de variante válido.
- `INV-VO-SKU-01`: SKU no vacío.
- `INV-VO-SKU-02`: SKU único globalmente.
- - Precio mayor que cero (regla de `Variante`, `[MOD]` §7.4).
- `INV-VO-MON-01`: moneda explícita.
- `INV-VO-TENT-02`: `TipoEntrega` coherente con el subtipo.

**14. Flujo conceptual.**

1. Verificar que el producto tenga vendedor propietario.
2. Verificar que el vendedor esté `ACTIVO`.
3. Verificar datos obligatorios del producto.
4. Verificar que exista al menos una variante.
5. Verificar que al menos una variante esté `ACTIVA`.
6. Verificar SKU no vacío y no duplicado en el conjunto evaluado.
7. Verificar precio mayor que cero y moneda explícita.
8. Verificar coherencia de `TipoEntrega`, subtipo y categoría.
9. Si el producto está `DESCONTINUADO`, denegar cualquier reanudación.
10. Devolver decisión y motivos.

**15. Casos límite y decisiones.**

- **Producto sin stock:** puede publicarse; no puede comprarse hasta que exista disponibilidad. Es regla explícita de `[MOD]` §22.2.
- **Producto digital:** no requiere bodega ni stock; requiere recurso de entrega válido. La existencia y validez de ese recurso se verifica como condición de publicación, sin definir aquí su estructura.
- **Categoría `DIGITAL`:** no obliga por sí sola a que el producto sea digital; la coherencia se valida según la política del catálogo.
- **SKU duplicado:** la política lo detecta sobre los datos recibidos; la unicidad global se refuerza en persistencia.
- **Producto suspendido:** puede reanudarse si vuelve a cumplir todas las condiciones; no se reanuda automáticamente.
- **Precio cero o negativo:** se rechaza; no se admite “gratis” como precio de variante en la línea base.
- **Variante inactiva:** no cuenta como variante vendible para la publicación, aunque exista.

**16. Errores y rechazos.**

| Código documental | Situación |
|---|---|
| `CAT_NO_SELLER` | Producto sin vendedor propietario. |
| `CAT_SELLER_NOT_ACTIVE` | Vendedor no habilitado. |
| `CAT_MISSING_DATA` | Datos obligatorios incompletos. |
| `CAT_NO_VARIANTS` | Producto sin variantes. |
| `CAT_NO_ACTIVE_VARIANT` | Ninguna variante vendible. |
| `CAT_DUPLICATE_SKU` | SKU duplicado. |
| `CAT_INVALID_PRICE` | Precio no positivo o sin moneda. |
| `CAT_TYPE_MISMATCH` | Tipo de entrega incoherente con el subtipo. |
| `CAT_DISCONTINUED` | Intento de publicar o reanudar un producto descontinuado. |

**17. Efectos secundarios y eventos.** No cambia estado. Si la decisión es favorable, el agregado `Producto` aplica la transición y el caso de uso puede emitir `ProductoPublicado` y auditoría.

**18. Consistencia y transaccionalidad.** Es una evaluación de solo lectura sobre un conjunto coherente de datos. La unicidad de SKU y la transición de estado se confirman en la operación de persistencia; la política no sustituye la restricción transaccional.

**19. Dependencias y relaciones.**

- Depende de `Producto`, `Variante` y `PerfilVendedor`.
- No depende de persistencia, handlers ni stock.
- Se relaciona con `DS-01` (autorización), `DS-05` (precio y cálculo) y `DS-09` (auditoría).
- Consume `NombreProducto`, `NombreVariante`, `SKU`, `Dinero`, `CategoriaProducto`, `EstadoProducto`, `EstadoVendedor`, `EstadoVariante`, `TipoEntrega`.

**20. Ejemplos, trazabilidad y estado.**

| Caso | Resultado |
|---|---|
| Producto con una variante activa, SKU único y precio válido, vendedor activo. | `PUBLICABLE`. |
| Producto sin variantes. | `NO_PUBLICABLE` por `CAT_NO_VARIANTS`. |
| Variante con precio cero. | `NO_PUBLICABLE` por `CAT_INVALID_PRICE`. |
| Producto descontinuado que intenta reanudarse. | `NO_PUBLICABLE` por `CAT_DISCONTINUED`. |
| Producto físico sin stock. | `PUBLICABLE`; la compra se rechazará hasta reabastecer. |

**Trazabilidad:** `[MOD]` §7.1–§7.5, §18, §21 (CAT-01…CAT-07), §22.2; `[ENU]` Dominio 5; `[VO]` §8.2, §8.4, §8.7, §8.8, §8.9, §6.1, §6.5.

**Estado:** **Confirmado por fuente**.

---

### 4.3 DS-03 — `ServicioReservaInventario`

**1. Identificador y nombre canónico.** `DS-03`, `ServicioReservaInventario`.

**2. Definición de negocio.** Servicio que valida la disponibilidad de una variante en una bodega y aplica, de forma atómica e idempotente, una reserva, liberación, consumo o expiración sobre la posición de inventario y su reserva.

**3. Propósito.** Garantizar que ninguna unidad se comprometa dos veces y que el stock reservado, liberado o consumido quede reflejado en el saldo y en un movimiento auditable.

**4. Justificación como servicio de dominio.** La regla compara la posición de inventario, la reserva, la bodega, la variante y la clave de idempotencia. No pertenece a una sola entidad: la reserva y el saldo son conceptos distintos que deben coordinarse.

**5. Responsabilidad única.** Aplicar una operación de reserva, liberación, consumo o expiración respetando las invariantes de inventario.

**6. Alcance.**

- Calcular disponibilidad como `onHand - reserved - unavailable`.
- Crear una reserva `ACTIVA` cuando haya disponibilidad suficiente.
- Liberar una reserva `ACTIVA` una sola vez.
- Consumir una reserva `ACTIVA` una sola vez al despachar.
- Expirar una reserva y liberar sus cantidades mediante operación explícita.
- Registrar el movimiento de inventario correspondiente.
- Rechazar operaciones duplicadas por clave de idempotencia.
- Rechazar reservas sobre bodega inactiva o variante no vendible.

**7. Fuera de alcance.**

- Ejecutar SQL, abrir transacciones o gestionar conexiones.
- Elegir la bodega; esa decisión corresponde a `DS-04`.
- Cambiar el estado del pedido; corresponde a `DS-06`.
- Cobrar, reembolsar o facturar.
- Definir la política de expiración temporal; la recibe como dato.
- Decidir si el pedido es pagable; esa coordinación pertenece al caso de uso.

**8. Actores y autorización.** Lo invocan casos de uso de checkout, despacho, cancelación y devolución. El actor puede ser el sistema o un operador autorizado. La autorización de la operación se verifica con `DS-01` cuando hay un actor humano; las operaciones automáticas usan identidad de sistema autorizada.

**9. Entradas conceptuales.**

| Entrada | Obligatoria | Uso |
|---|---:|---|
| Tipo de operación | Sí | Reservar, liberar, consumir o expirar. |
| `pedidoId` | Sí | Referencia de negocio. |
| Líneas: `varianteId`, `bodegaId`, `cantidad` | Sí | Posiciones afectadas. |
| `IdempotencyKey` | Sí | Evita doble efecto. |
| Actor o identidad de sistema | Sí | Trazabilidad. |
| `Instant` de operación | Sí | Marca temporal. |
| `expiraEn` | Condicional | Obligatorio al crear una reserva. |
| Referencia de la reserva | Condicional | Obligatorio para liberar, consumir o expirar. |

**10. Salidas y resultados.** Resultado `APLICADA`, `YA_APLICADA` o `RECHAZADA`; estado final de cada reserva; cantidades resultantes de `onHand`, `reserved` y `unavailable`; referencia del movimiento generado. No devuelve filas de base de datos.

**11. Precondiciones.** Existe una posición de inventario para cada combinación variante-bodega; la bodega está `ACTIVA`; la variante es vendible; para liberar, consumir o expirar, la reserva existe y está `ACTIVA`; la clave de idempotencia está presente.

**12. Reglas de negocio aplicadas.**

- `INV-01`: `onHand`, `reserved` y `unavailable` no negativos.
- `INV-02`: `reserved + unavailable <= onHand`.
- `INV-03`: solo se reserva si `disponible >= cantidadSolicitada`.
- `INV-04`: solo se reserva stock de bodega `ACTIVA` y variante vendible.
- `INV-05`: toda mutación genera movimiento con cantidad, motivo, referencia, actor y timestamp.
- `INV-06`: un mismo comando no se aplica dos veces.
- `INV-07`: una reserva liberada o consumida no vuelve a procesarse como activa.
- `INV-08`: los ajustes requieren motivo y actor autorizado; no se edita el saldo.
- `INV-09`: las devoluciones no se suman automáticamente al stock vendible.
- `INV-10`: una sola posición lógica por variante-bodega.
- `DD-04`: la disponibilidad se deriva, no se almacena como fuente independiente.
- `DD-05`: la reserva se crea en checkout antes del pago y expira o se libera de forma idempotente.

**13. Invariantes protegidas.**

- `INV-VO-CAN-01`: cantidades enteras no negativas.
- `INV-VO-CANP-01`: cantidades de movimiento estrictamente positivas.
- `INV-VO-ERES-02`: consumo o liberación única.
- `INV-VO-ERES-03`: estados terminales no vuelven a `ACTIVA`.
- `INV-VO-ERES-04`: una reserva expirada no se consume.
- `INV-VO-IDK-01`: clave de idempotencia no vacía.
- `INV-VO-IDK-04`: la repetición del mismo comando no duplica efectos.
- `INV-VO-TMOV-06`: los movimientos no se editan ni eliminan.

**14. Flujo conceptual.**

1. Verificar la clave de idempotencia; si ya se aplicó el mismo comando, devolver `YA_APLICADA` sin mutar.
2. Cargar la posición de inventario y la reserva, si existe.
3. Verificar bodega `ACTIVA` y variante vendible.
4. Para reservar: calcular disponibilidad y comparar con la cantidad solicitada.
5. Para liberar, consumir o expirar: verificar que la reserva esté `ACTIVA`.
6. Aplicar la mutación de cantidades de forma condicional sobre la versión de inventario.
7. Crear o transicionar la reserva.
8. Registrar el movimiento de inventario con referencia, actor, timestamp y motivo cuando aplique.
9. Devolver el resultado y las cantidades finales.

**15. Casos límite y decisiones.**

- **Última unidad en dos checkouts concurrentes:** solo una operación obtiene la reserva; la otra recibe disponibilidad insuficiente. Es `DM-10`.
- **Reserva expirada:** no se consume; si se necesita stock, se crea una nueva reserva.
- **Liberación repetida:** la segunda operación no cambia cantidades y devuelve `YA_APLICADA` o rechazo idempotente, según el ámbito de la clave.
- **Fallo después de reservar:** la compensación libera las reservas de forma idempotente; no se deja un pedido pagable sin stock.
- **Múltiples líneas:** la operación debe ser atómica por posición; el caso de uso coordina el conjunto y compensa si una línea falla.
- **Devolución:** el reingreso usa `DEVOLUCION_VENDIBLE` o `DEVOLUCION_NO_VENDIBLE` después de inspección; no reutiliza la reserva original.
- **Ajuste:** no es una operación de este servicio; se registra como movimiento con motivo y autorización.

**16. Errores y rechazos.**

| Código documental | Situación |
|---|---|
| `INV_INSUFFICIENT_AVAILABLE` | Disponibilidad menor que la cantidad solicitada. |
| `INV_WAREHOUSE_INACTIVE` | Bodega no activa. |
| `INV_VARIANT_NOT_SELLABLE` | Variante inactiva o producto no vendible. |
| `INV_POSITION_NOT_FOUND` | No existe posición para variante-bodega. |
| `INV_RESERVATION_NOT_ACTIVE` | La reserva no está `ACTIVA`. |
| `INV_RESERVATION_TERMINAL` | Intento de reutilizar una reserva terminal. |
| `INV_IDEMPOTENCY_CONFLICT` | Misma clave con payload incompatible. |
| `INV_NEGATIVE_BALANCE` | La mutación dejaría saldo inválido. |
| `INV_MISSING_MOTIVE` | Ajuste o baja sin motivo. |

**17. Efectos secundarios y eventos.** Modifica `Inventario` y `ReservaInventario`; crea `MovimientoInventario`. Puede producir `InventarioReservado` o `ReservaLiberada`. No modifica el pedido ni el pago.

**18. Consistencia y transaccionalidad.** La reserva es atómica respecto de la posición de inventario. Se usa control de concurrencia optimista o equivalente. La coordinación de varias posiciones y la compensación pertenecen al caso de uso; el servicio no promete atomicidad distribuida.

**19. Dependencias y relaciones.**

- Depende de `Inventario`, `ReservaInventario` y `MovimientoInventario`.
- Recibe reloj, identificadores y acceso a posiciones como datos o colaboraciones abstraídas; no importa drivers.
- Se relaciona con `DS-04` (propuesta de bodega), `DS-06` (transición de pedido) y `DS-09` (auditoría).
- Consume `Cantidad`, `CantidadPositiva`, `EstadoReserva`, `TipoMovimientoInventario`, `IdempotencyKey`, `Instant`, `MotivoMovimiento`, `TipoReferencia`.

**20. Ejemplos, trazabilidad y estado.**

| Caso | Resultado |
|---|---|
| Reservar 2 unidades con 5 disponibles. | `APLICADA`; `reserved += 2`; movimiento `RESERVA`. |
| Reservar 6 unidades con 5 disponibles. | `RECHAZADA`; saldo sin cambios. |
| Consumir una reserva `ACTIVA` al despachar. | `APLICADA`; `onHand -= q`, `reserved -= q`; movimiento `SALIDA_VENTA`. |
| Consumir una reserva `EXPIRADA`. | `RECHAZADA`; no se consume. |
| Repetir el mismo comando de reserva. | `YA_APLICADA`; un solo efecto. |

**Trazabilidad:** `[MOD]` §8.2, §8.2.1, §8.2.2, §8.2.3, §8.3, §18, §21 (INV-01…INV-10), §22.3, §22.5, DD-04, DD-05; `[ENU]` Dominio 6; `[VO]` §6.6, §6.7, §8.17, §8.21, §7.5.

**Estado:** **Confirmado por fuente**.

---

### 4.4 DS-04 — `ServicioAsignacionBodega`

**1. Identificador y nombre canónico.** `DS-04`, `ServicioAsignacionBodega`.

**2. Definición de negocio.** Servicio que selecciona las bodegas elegibles para cubrir las líneas físicas de un pedido, comparando disponibilidad, compatibilidad y pertenencia, sin comprometer stock.

**3. Propósito.** Producir una propuesta de asignación verificable que el checkout pueda reservar después, evitando prometer disponibilidad que no existe o asignar bodegas incompatibles.

**4. Justificación como servicio de dominio.** La decisión compara varias posiciones de inventario, varias bodegas, el vendedor y el tipo de entrega. No pertenece a `Bodega` ni a `Inventario` por separado.

**5. Responsabilidad única.** Proponer una asignación factible de cantidades físicas a bodegas elegibles.

**6. Alcance.**

- Filtrar bodegas `ACTIVAS`.
- Verificar compatibilidad entre tipo de bodega, vendedor y líneas.
- Calcular disponibilidad por posición.
- Asignar cantidades por línea, permitiendo división entre bodegas cuando sea necesario.
- Informar cantidades no cubiertas.
- Devolver una propuesta que `DS-03` pueda reservar.

**7. Fuera de alcance.**

- Reservar, bloquear o descontar stock.
- Crear `Envio` o asignar transportista.
- Elegir la “mejor” bodega según costo, cercanía o prioridad comercial; esa preferencia no está definida.
- Validar la dirección de entrega.
- Cambiar el estado del pedido.
- Persistir la asignación.

**8. Actores y autorización.** Lo invoca el caso de uso de checkout o de preparación. No requiere un actor humano específico; la operación se ejecuta en el contexto autorizado del comprador o del operador logístico.

**9. Entradas conceptuales.**

| Entrada | Obligatoria | Uso |
|---|---:|---|
| Líneas físicas | Sí | Variante y cantidad solicitada. |
| Vendedor del pedido | Sí | Restricción de pertenencia. |
| Bodegas candidatas | Sí | Tipo, estado, propietario. |
| Posiciones de inventario | Sí | `onHand`, `reserved`, `unavailable`. |
| Regla de compatibilidad | Condicional | Tipo de bodega y tipo de entrega. |
| Preferencia operativa | No | Solo si una política aprobada la define. |

**10. Salidas y resultados.** Propuesta de asignación por línea: `varianteId`, `bodegaId`, `cantidad`; indicador de factibilidad; cantidades no cubiertas; motivo cuando no sea factible. No reserva ni persiste.

**11. Precondiciones.** Las líneas son físicas; existe al menos una bodega candidata; las posiciones de inventario están disponibles para consulta; el vendedor del pedido está identificado.

**12. Reglas de negocio aplicadas.**

- `INV-02`: `reserved + unavailable <= onHand`; el stock dañado no forma parte de `disponible`.
- `INV-03`: la asignación no supera la disponibilidad.
- `INV-04`: solo bodegas `ACTIVAS` y variantes vendibles.
- `ORD-07`: un pedido con productos físicos requiere cumplimiento logístico.
- `LOG-01`: un pedido digital no requiere envío físico.
- `[MOD]` §8.1: una bodega `INACTIVA` no acepta reservas.
- `[MOD]` §13.1: cada envío se asigna a una bodega de origen compatible.

**13. Invariantes protegidas.**

- `INV-VO-EBOD-01`: código de estado de bodega válido.
- `INV-VO-EBOD-02`: una bodega inactiva no recibe reservas.
- `INV-VO-TBOD-02`: una bodega de vendedor exige propietario.
- `INV-VO-TBOD-03`: una bodega marketplace no tiene propietario vendedor.
- `INV-VO-CANP-01`: cantidades asignadas estrictamente positivas.
- La suma asignada por línea no excede la cantidad solicitada ni la disponibilidad.

**14. Flujo conceptual.**

1. Separar líneas físicas de líneas digitales; las digitales no participan.
2. Filtrar bodegas `ACTIVAS`.
3. Filtrar bodegas compatibles con el vendedor y el tipo de entrega.
4. Calcular disponibilidad por posición.
5. Ordenar las bodegas según la política vigente, si existe.
6. Asignar cantidades hasta cubrir cada línea.
7. Verificar que no se exceda la disponibilidad ni la cantidad solicitada.
8. Devolver la propuesta y las cantidades no cubiertas.

**15. Casos límite y decisiones.**

- **Varias bodegas elegibles:** la preferencia no está definida. Se registra como `DEC-BIZ-04`; la propuesta debe ser factible, no “óptima”.
- **División entre bodegas:** se permite cuando ninguna bodega cubre la línea completa; puede generar varios envíos.
- **Sin cobertura total:** el checkout falla de forma controlada; no se crea un pedido pagable parcialmente.
- **Bodega de vendedor frente a marketplace:** la compatibilidad depende de la propiedad y del tipo; no se asigna stock de un vendedor a otro sin regla expresa.
- **Propuesta obsoleta:** entre la propuesta y la reserva, el stock puede cambiar; `DS-03` decide y puede rechazar. La propuesta no es una promesa.
- **Producto digital:** no se asigna bodega.

**16. Errores y rechazos.**

| Código documental | Situación |
|---|---|
| `WH_NO_ELIGIBLE` | No hay bodega activa compatible. |
| `WH_INSUFFICIENT_TOTAL` | La disponibilidad total no cubre la línea. |
| `WH_INCOMPATIBLE_TYPE` | Tipo de bodega incompatible con el vendedor o la entrega. |
| `WH_SELLER_MISMATCH` | Bodega de otro vendedor sin autorización. |
| `WH_INVALID_QUANTITY` | Cantidad no positiva. |
| `WH_PREFERENCE_UNDEFINED` | Hay varias propuestas y no existe política de desempate. |

**17. Efectos secundarios y eventos.** No modifica estado ni emite eventos. Su resultado habilita la reserva posterior.

**18. Consistencia y transaccionalidad.** Es una lectura consistente de posiciones. No garantiza exclusividad; la garantía la aporta `DS-03` al reservar. La propuesta debe revalidarse si media una escritura.

**19. Dependencias y relaciones.**

- Depende de `Bodega`, `Inventario`, `Pedido` y `Envio`.
- No depende de transportistas, costos ni geolocalización.
- Se relaciona con `DS-03` (reserva efectiva), `DS-06` (transición a preparación) y `DS-09` (auditoría de la asignación).
- Consume `TipoBodega`, `EstadoBodega`, `TipoEntrega`, `CantidadPositiva`, `Direccion` y `DireccionFisica` como contexto, sin definir sus campos.

**20. Ejemplos, trazabilidad y estado.**

| Caso | Resultado |
|---|---|
| Una bodega cubre toda la línea. | Propuesta con una asignación. |
| Dos bodegas cubren la línea en partes. | Propuesta dividida; puede generar dos envíos. |
| Bodega inactiva con stock. | Excluida de la propuesta. |
| Producto digital. | No participa; no se asigna bodega. |
| Stock cambia antes de reservar. | `DS-03` rechaza; la propuesta no era una promesa. |

**Trazabilidad:** `[MOD]` §8.1, §8.2, §13.1, §13.2, §18, §21 (INV-02…INV-04, ORD-07, LOG-01), §22.3, §22.5; `[ENU]` Dominios 4, 6 y 10; `[VO]` §8.2, §8.3, §8.10, §6.7, §7.1, §7.2.

**Estado:** **Confirmado por fuente**; la preferencia entre bodegas queda **parcialmente especificada** (`DEC-BIZ-04`, `L-07`).

---

### 4.5 DS-05 — `ServicioCalculoPedido`

**1. Identificador y nombre canónico.** `DS-05`, `ServicioCalculoPedido`.

**2. Definición de negocio.** Servicio que calcula el subtotal, los descuentos, los impuestos, el costo de envío y el total de un pedido, aplicando reglas monetarias explícitas y reproducibles.

**3. Propósito.** Producir importes consistentes y auditables antes de confirmar la compra, sin depender de aritmética binaria de punto flotante ni de decisiones manuales.

**4. Justificación como servicio de dominio.** La regla combina varias líneas, descuentos, impuestos y envío, y debe aplicar una política monetaria común. No pertenece a `ItemPedido` ni a `Pedido` por separado.

**5. Responsabilidad única.** Calcular y desglosar los importes de un pedido.

**6. Alcance.**

- Calcular el subtotal por línea y del pedido.
- Aplicar descuentos por línea o por pedido cuando la política los defina.
- Calcular impuestos según la política fiscal suministrada.
- Calcular o recibir el costo de envío.
- Calcular el total con la fórmula confirmada.
- Verificar que todos los importes compartan moneda.
- Aplicar una regla de redondeo reproducible.
- Devolver el desglose completo.

**7. Fuera de alcance.**

- Invocar al proveedor de pagos.
- Emitir facturas o numerar documentos fiscales.
- Definir tasas de impuestos, porcentajes de descuento o tarifas de envío.
- Reservar stock.
- Cambiar el estado del pedido.
- Persistir los importes; el agregado los conserva como snapshot.

**8. Actores y autorización.** Lo invoca el caso de uso de checkout o de recálculo autorizado. No requiere un rol específico; la autorización de la operación que lo contiene la resuelve `DS-01`.

**9. Entradas conceptuales.**

| Entrada | Obligatoria | Uso |
|---|---:|---|
| Líneas: cantidad, precio unitario, descuento unitario | Sí | Base de cálculo. |
| Moneda | Sí | Coherencia de todos los importes. |
| Política de impuestos | Sí | Tasa o importe por línea. |
| Costo de envío | Condicional | Cero para digital o envío gratuito. |
| Política de descuentos | Condicional | Reglas de aplicación. |
| Política de redondeo | Sí | Reproducibilidad. |

**10. Salidas y resultados.** `subtotal`, `descuentos`, `costoEnvio`, `impuestos`, `total`; desglose por línea con `totalLinea`; moneda; advertencias de redondeo. Todos los importes son `Dinero` con la misma moneda.

**11. Precondiciones.** Al menos una línea; cantidades positivas; precios mayores que cero; moneda explícita y única; política de impuestos y redondeo disponible. Si falta una política obligatoria, el cálculo se rechaza.

**12. Reglas de negocio aplicadas.**

- `[MOD]` §10.1: `total = subtotal - descuentos + costoEnvio + impuestos`.
- `[MOD]` §16.1: moneda explícita, decimal exacto o unidad menor, sumas solo entre monedas iguales, redondeo central reproducible, total calculado desde líneas.
- `[MOD]` §10.2: `totalLinea = cantidad × precioUnitario - descuento + impuesto`, según redondeo definido.
- `INV-VO-MON-01`: moneda explícita.
- `INV-VO-MON-02`: precisión exacta; no punto flotante binario sin política.
- `INV-VO-MON-03`: operaciones solo entre monedas compatibles.
- `INV-VO-MON-05`: el total no es negativo.

**13. Invariantes protegidas.**

- `INV-VO-MON-01`: moneda presente en cada importe.
- `INV-VO-MON-02`: exactitud decimal; no punto flotante binario sin política.
- `INV-VO-MON-03`: misma moneda en sumas y comparaciones.
- `INV-VO-MON-04`: redondeo reproducible.
- `INV-VO-MON-05`: total no negativo.
- `INV-VO-CANP-01`: cantidades estrictamente positivas.
- La suma de `totalLinea` es coherente con `subtotal`, descuentos e impuestos del pedido.

**14. Flujo conceptual.**

1. Verificar que todas las líneas tengan la misma moneda.
2. Validar cantidades y precios.
3. Calcular el importe bruto por línea.
4. Aplicar el descuento por línea según la política.
5. Calcular el impuesto por línea según la política.
6. Calcular `totalLinea` con la regla de redondeo.
7. Sumar el subtotal y los descuentos del pedido.
8. Añadir el costo de envío cuando corresponda.
9. Calcular el total y verificar que no sea negativo.
10. Devolver el desglose y la moneda.

**15. Casos límite y decisiones.**

- **Producto digital:** `costoEnvio = 0`; no se inventa una tarifa.
- **Descuento del 100 %:** permitido si la política lo autoriza; el total puede ser cero, pero no negativo.
- **Exención de impuestos:** se representa con tasa o importe cero según la política; no se omite el componente.
- **Múltiples tasas:** la política fiscal debe indicar la tasa aplicable por línea; el servicio no la inventa.
- **Diferencias de redondeo:** se concentran en el componente definido por la política y se documentan en el desglose.
- **Recálculo:** un pedido confirmado conserva sus snapshots; el recálculo solo aplica antes de confirmar o en un proceso autorizado con evidencia.
- **Moneda distinta:** se rechaza; no se convierte sin política de tipo de cambio, que no está definida.

**16. Errores y rechazos.**

| Código documental | Situación |
|---|---|
| `CALC_CURRENCY_MISMATCH` | Importes con monedas distintas. |
| `CALC_INVALID_QUANTITY` | Cantidad no positiva. |
| `CALC_INVALID_PRICE` | Precio no positivo. |
| `CALC_MISSING_TAX_POLICY` | Falta la política fiscal. |
| `CALC_MISSING_ROUNDING_POLICY` | Falta la regla de redondeo. |
| `CALC_NEGATIVE_TOTAL` | El total resultante sería negativo. |
| `CALC_LINE_INCONSISTENT` | El desglose de línea no cuadra con el total. |

**17. Efectos secundarios y eventos.** No modifica estado ni emite eventos. El caso de uso usa el resultado para crear los snapshots del pedido.

**18. Consistencia y transaccionalidad.** Es una función determinista dadas las entradas y la política. No requiere transacción. La persistencia del resultado se confirma con el agregado `Pedido`.

**19. Dependencias y relaciones.**

- Depende de `Dinero` y `CantidadPositiva`.
- No depende de pasarelas, facturación ni inventario.
- Se relaciona con `DS-02` (precio válido), `DS-06` (pedido pagable) y `DS-09` (auditoría del recálculo).
- Consume `Dinero`, `CantidadPositiva`; produce importes que el pedido conserva como snapshot.

**20. Ejemplos, trazabilidad y estado.**

| Caso | Resultado |
|---|---|
| Dos líneas de 2 × 50 y 1 × 30, sin descuentos ni impuestos, envío 10. | Subtotal 130; total 140. |
| Línea con descuento 10 y precio 100. | Total de línea 90 antes de impuesto. |
| Líneas en monedas distintas. | Rechazo por `CALC_CURRENCY_MISMATCH`. |
| Pedido digital. | `costoEnvio = 0`. |
| Total negativo por descuento mal configurado. | Rechazo por `CALC_NEGATIVE_TOTAL`. |

**Trazabilidad:** `[MOD]` §10.1, §10.2, §16.1, §18, §22.3; `[ENU]` Dominio 7; `[VO]` §6.5, §6.7; decisiones `DEC-BIZ-05`, limitación `L-05`.

**Estado:** **Confirmado por fuente**; tasas, descuentos y moneda efectiva quedan **parcialmente especificados** (`DEC-BIZ-05`, `L-05`).

---

### 4.6 DS-06 — `PoliticaTransicionPedido`

**1. Identificador y nombre canónico.** `DS-06`, `PoliticaTransicionPedido`.

**2. Definición de negocio.** Política que decide si un pedido puede pasar de su estado actual al siguiente, verificando las precondiciones de pago, cumplimiento y cierre.

**3. Propósito.** Evitar saltos de estado, pedidos pagados sin confirmación, preparación antes del pago, entregas parciales declaradas completas y reescritura de pedidos cerrados.

**4. Justificación como política de dominio.** La decisión compara el estado del pedido con el estado del pago y de los envíos. No pertenece a `Pedido` solo, porque el pago y el envío son agregados separados.

**5. Responsabilidad única.** Autorizar o denegar una transición de estado del pedido y declarar sus precondiciones.

**6. Alcance.**

- Validar pares estado-evento contra la tabla confirmada.
- Verificar pago confirmado antes de preparar.
- Verificar reservas vigentes cuando la preparación lo exija.
- Verificar que todos los envíos requeridos estén entregados antes de `ENTREGADO`.
- Verificar el cierre operativo antes de `CERRADO`.
- Impedir modificaciones posteriores al cierre.
- Impedir cancelación directa después de `PAGADO`.
- Exigir motivo y actor en cancelaciones autorizadas.

**7. Fuera de alcance.**

- Modificar pagos o inventario directamente.
- Ejecutar la reserva o el consumo; corresponde a `DS-03`.
- Calcular importes; corresponde a `DS-05`.
- Emitir facturas.
- Asignar transportista.
- Reescribir líneas o snapshots.

**8. Actores y autorización.** Lo invocan casos de uso de pago, preparación, despacho, entrega, cancelación y cierre. Los actores son el sistema, el Operador logístico asignado, el Comprador en cancelaciones autorizadas y el Administrador en operaciones de contingencia. `DS-01` verifica el alcance.

**9. Entradas conceptuales.**

| Entrada | Obligatoria | Uso |
|---|---:|---|
| Estado actual del pedido | Sí | Origen de la transición. |
| Evento solicitado | Sí | Destino pretendido. |
| `EstadoPago` | Condicional | Precondición de `PAGADO` y preparación. |
| Estados de los envíos | Condicional | Precondición de `ENTREGADO`. |
| Evidencia de entrega digital | Condicional | Pedidos digitales. |
| Actor y motivo | Condicional | Cancelaciones y operaciones privilegiadas. |
| Versión del pedido | Sí | Control de concurrencia. |

**10. Salidas y resultados.** Decisión `PERMITIDA` o `DENEGADA`; estado resultante; precondiciones incumplidas; obligaciones (liberar reserva, registrar auditoría, conservar motivo). No aplica la transición por sí misma.

**11. Precondiciones.** Estado actual conocido; evento conocido; datos de pago y envío disponibles cuando la transición los requiera; pedido no eliminado.

**12. Reglas de negocio aplicadas.**

- `ORD-01`: solo las transiciones de la tabla son válidas.
- `ORD-02`: el pedido no pasa a `PAGADO` por la sola solicitud de pago.
- `ORD-03`: el alistamiento no comienza antes de confirmar el pago.
- `ORD-04`: `ENTREGADO` y `CERRADO` son distintos; un pedido entregado o cerrado no se modifica retroactivamente.
- `ORD-05`: los cambios registran actor, timestamp, estado previo, estado nuevo y referencia causal.
- `ORD-06`: una notificación duplicada no duplica la transición.
- `ORD-07`: pedido físico exige dirección y cumplimiento; digital no crea envío físico.
- `ORD-08`: `ENTREGADO` global exige todos los envíos entregados.
- `[MOD]` §10.4: después de `PAGADO` no se cancela directamente; se tramita como devolución, reembolso o anulación financiera autorizada.

**13. Invariantes protegidas.**

- `INV-VO-EPED-02`: solo transiciones válidas.
- `INV-VO-EPED-03`: `CARRITO` no es estado de pedido.
- `INV-VO-EPED-04`: `ENTREGADO` y `CERRADO` son distintos.
- `INV-VO-EPED-05`: un pedido `ENTREGADO` o `CERRADO` no se modifica retroactivamente.
- `INV-VO-EPED-06`: `ENTREGADO` exige todos los envíos requeridos.
- `INV-VO-EPAG-02`: no se declara captura sin confirmación.
- `INV-VO-EPAG-06`: una confirmación de pago activa la transición una sola vez.

**14. Flujo conceptual.**

1. Verificar que el par estado-evento exista en la tabla.
2. Si el destino es `PAGADO`, exigir pago confirmado e idempotente.
3. Si el destino es `EN_PREPARACION`, exigir pago confirmado y reservas vigentes cuando apliquen.
4. Si el destino es `DESPACHADO`, exigir salida de inventario registrada.
5. Si el destino es `ENTREGADO`, exigir evidencia de todos los envíos o de la entrega digital.
6. Si el destino es `CERRADO`, exigir cumplimiento completo y ausencia de tareas pendientes.
7. Si el origen es `CERRADO`, denegar cualquier modificación.
8. Si el evento es cancelación y el pedido está `PAGADO`, denegar la vía directa y señalar el proceso de posventa.
9. Devolver decisión, estado resultante y obligaciones.

**15. Casos límite y decisiones.**

- **Pedido digital:** puede pasar de `PAGADO` a `ENTREGADO` sin `EN_PREPARACION` ni `DESPACHADO`, con evidencia de entrega digital.
- **Envíos múltiples:** el pedido no pasa a `ENTREGADO` hasta que todos estén entregados; un envío fallido no equivale a devolución.
- **Pago duplicado:** la segunda notificación no repite la transición.
- **Pago tardío tras cancelación:** no reanuda el pedido; se crea uno nuevo si el comprador lo desea.
- **Cancelación tras pago:** se rechaza la vía directa; se deriva a devolución, reembolso o anulación autorizada.
- **Cierre sin entrega:** no se permite; el cierre exige cumplimiento completo.
- **Estado desconocido:** se deniega por defecto.

**16. Errores y rechazos.**

| Código documental | Situación |
|---|---|
| `ORD_INVALID_TRANSITION` | Par estado-evento no permitido. |
| `ORD_PAYMENT_NOT_CONFIRMED` | Se intenta pagar o preparar sin confirmación. |
| `ORD_RESERVATION_NOT_ACTIVE` | Preparación sin reserva vigente. |
| `ORD_SHIPMENTS_INCOMPLETE` | Entrega global con envíos pendientes. |
| `ORD_ORDER_CLOSED` | Modificación de un pedido cerrado. |
| `ORD_CANCELLATION_REQUIRES_POSTSALE` | Cancelación directa después de pagado. |
| `ORD_MISSING_EVIDENCE` | Entrega sin evidencia válida. |
| `ORD_DUPLICATE_EVENT` | Evento ya aplicado. |

**17. Efectos secundarios y eventos.** No modifica estado; el agregado `Pedido` aplica la transición. Puede exigir liberación de reserva, consumo de reserva o auditoría. Los eventos posibles incluyen `PedidoCreado`, `PagoConfirmado`, `PedidoDespachado` y `EntregaConfirmada`, emitidos por el caso de uso.

**18. Consistencia y transaccionalidad.** Es una evaluación de solo lectura sobre el estado vigente. La transición se aplica con control de versión en el agregado; la coordinación con pago e inventario pertenece al caso de uso y no promete atomicidad distribuida.

**19. Dependencias y relaciones.**

- Depende de `Pedido`, `Pago` y `Envio`.
- No modifica pagos ni inventario.
- Se relaciona con `DS-03` (reserva y consumo), `DS-05` (importes), `DS-07` (posventa) y `DS-09` (auditoría).
- Consume `EstadoPedido`, `EstadoPago`, `EstadoEnvio`, `DireccionSnapshot`, `Instant`.

**20. Ejemplos, trazabilidad y estado.**

| Caso | Resultado |
|---|---|
| `PENDIENTE_DE_PAGO` + pago confirmado. | Permitido; `PAGADO`. |
| `PENDIENTE_DE_PAGO` + solicitud de pago sin confirmación. | Denegado. |
| `PAGADO` + iniciar preparación con reserva activa. | Permitido; `EN_PREPARACION`. |
| `DESPACHADO` + entrega con un envío pendiente. | Denegado por `ORD_SHIPMENTS_INCOMPLETE`. |
| `PAGADO` + cancelación directa. | Denegado; se deriva a posventa. |
| `CERRADO` + cambio de líneas. | Denegado. |

**Trazabilidad:** `[MOD]` §10.1–§10.4, §18, §21 (ORD-01…ORD-08), §22.3, §22.5, DD-06, DD-11; `[ENU]` Dominio 7; `[VO]` §8.11, §8.12, §8.14.

**Estado:** **Confirmado por fuente**.

---

### 4.7 DS-07 — `PoliticaElegibilidadDevolucion`

**1. Identificador y nombre canónico.** `DS-07`, `PoliticaElegibilidadDevolucion`.

**2. Definición de negocio.** Política que decide si un comprador puede solicitar la devolución de un pedido o de parte de sus líneas, verificando propiedad, entrega, plazo, cantidades y condiciones.

**3. Propósito.** Evitar devoluciones de pedidos no entregados, de terceros, fuera de plazo o por cantidades superiores a las entregadas, sin reescribir el pedido original.

**4. Justificación como política de dominio.** La decisión compara el pedido, el comprador, las cantidades entregadas, las devoluciones previas y el plazo configurable. No pertenece a `Devolucion`, que aún no existe al evaluar.

**5. Responsabilidad única.** Producir una decisión de elegibilidad y las cantidades devolvibles por línea.

**6. Alcance.**

- Verificar que el actor sea el comprador propietario.
- Verificar que el pedido esté `ENTREGADO` o que la entrega digital esté confirmada.
- Verificar que la solicitud esté dentro del plazo configurable.
- Calcular la cantidad devolvible por línea.
- Verificar que el motivo pertenezca al catálogo.
- Distinguir producto físico de digital.
- Impedir reabrir una devolución `RESUELTA`.

**7. Fuera de alcance.**

- Procesar dinero o aprobar el reembolso; corresponde a `DS-08`.
- Llamar transportistas o gestionar logística inversa.
- Recibir o inspeccionar el producto.
- Cambiar el estado del pedido.
- Definir el plazo o el catálogo de motivos.
- Aprobar la devolución; la aprobación es un acto posterior de un actor autorizado.

**8. Actores y autorización.** El actor inicial es el Comprador propietario. La revisión y aprobación corresponden a un Administrador o rol autorizado, con separación de funciones. `DS-01` verifica que el actor no apruebe su propia solicitud.

**9. Entradas conceptuales.**

| Entrada | Obligatoria | Uso |
|---|---:|---|
| `pedidoId` | Sí | Pedido de origen. |
| `compradorId` | Sí | Propiedad. |
| Estado del pedido y fecha de entrega | Sí | Elegibilidad temporal. |
| Líneas entregadas | Sí | Base de cantidades. |
| Cantidades ya devueltas o solicitadas | Sí | Descuento de elegibilidad. |
| Motivo | Sí | Pertenencia al catálogo. |
| `Instant` de solicitud | Sí | Comparación con el plazo. |
| Plazo vigente | Sí | Política configurable. |
| Tipo de entrega | Sí | Física o digital. |

**10. Salidas y resultados.** Decisión `ELEGIBLE` o `NO_ELEGIBLE`; cantidades elegibles por línea; motivo del rechazo; indicación de si requiere revisión o aprobación. No crea la devolución.

**11. Precondiciones.** Pedido existente; comprador identificado; estado de entrega conocido; cantidades entregadas disponibles; plazo vigente configurado.

**12. Reglas de negocio aplicadas.**

- `RET-01`: solo el comprador propietario solicita la devolución de su pedido.
- `RET-02`: las cantidades devueltas no exceden las entregadas ni las ya procesadas.
- `[MOD]` §14.1: la solicitud se acepta sobre una entrega confirmada dentro del período configurable.
- `[MOD]` §14.1: la aprobación requiere motivo válido, elegibilidad temporal, cantidades disponibles y revisión de rol autorizado.
- `[MOD]` §14.1: el comprador no aprueba su propia solicitud.
- `DD-12`: el plazo es configurable; no se fija una cifra.
- `[MOD]` §14.3: una devolución `RESUELTA` no se reabre.

**13. Invariantes protegidas.**

- `INV-VO-EDEV-02`: solo el comprador propietario solicita.
- `INV-VO-EDEV-03`: cantidades no exceden las entregadas ni las ya solicitadas o aprobadas.
- `INV-VO-EDEV-04`: el comprador no aprueba su propia solicitud.
- `INV-VO-EDEV-05`: una devolución `RESUELTA` no se reabre.
- `INV-VO-EDEV-06`: en producto físico, la recepción e inspección preceden al reingreso vendible.
- `INV-VO-EDEV-07`: en producto digital, la devolución puede implicar revocación y no genera inventario físico.
- `INV-VO-MOTD-01`: el motivo es obligatorio y pertenece al catálogo.

**14. Flujo conceptual.**

1. Verificar que el actor sea el comprador propietario del pedido.
2. Verificar que el pedido esté `ENTREGADO` o la entrega digital confirmada.
3. Verificar que la solicitud esté dentro del plazo vigente.
4. Verificar que no exista una devolución `RESUELTA` para el mismo alcance.
5. Calcular, por línea, la cantidad entregada menos la ya devuelta o solicitada.
6. Verificar que la cantidad solicitada sea positiva y no exceda la elegible.
7. Verificar que el motivo pertenezca al catálogo.
8. Distinguir el flujo físico del digital.
9. Devolver elegibilidad, cantidades y motivo.

**15. Casos límite y decisiones.**

- **Entrega parcial:** solo las líneas efectivamente entregadas son elegibles.
- **Devoluciones sucesivas:** cada solicitud descuenta las anteriores; no se puede devolver dos veces la misma unidad.
- **Producto digital:** la elegibilidad puede depender de la revocación de acceso; no genera inventario físico.
- **Plazo vencido:** se rechaza; el plazo no se prorroga sin política expresa.
- **Pedido no entregado:** se rechaza; una entrega fallida no equivale a devolución aceptada.
- **Devolución ya resuelta:** se rechaza la reapertura; una controversia nueva genera un caso relacionado.
- **Motivo fuera de catálogo:** se rechaza; el catálogo no está enumerado en la fuente.

**16. Errores y rechazos.**

| Código documental | Situación |
|---|---|
| `RET_NOT_OWNER` | El actor no es el comprador propietario. |
| `RET_ORDER_NOT_DELIVERED` | Pedido no entregado o entrega digital no confirmada. |
| `RET_OUTSIDE_WINDOW` | Solicitud fuera del plazo. |
| `RET_QUANTITY_EXCEEDED` | Cantidad mayor que la elegible. |
| `RET_INVALID_QUANTITY` | Cantidad no positiva. |
| `RET_INVALID_REASON` | Motivo ausente o fuera del catálogo. |
| `RET_ALREADY_RESOLVED` | Devolución ya resuelta para el alcance. |
| `RET_WINDOW_UNDEFINED` | No hay plazo configurado. |

**17. Efectos secundarios y eventos.** No modifica estado. Si la decisión es favorable, el caso de uso crea la `Devolucion` en estado `SOLICITADA` y puede emitir `DevolucionSolicitada` y auditoría.

**18. Consistencia y transaccionalidad.** Es una evaluación de solo lectura. La creación de la devolución debe confirmar las cantidades en una operación consistente para evitar solicitudes concurrentes que excedan lo entregado.

**19. Dependencias y relaciones.**

- Depende de `Pedido`, `Devolucion` y `PerfilComprador`.
- No depende de dinero, transportistas ni proveedores de pago.
- Se relaciona con `DS-01` (propiedad y separación de funciones), `DS-08` (reembolso) y `DS-09` (auditoría).
- Consume `EstadoPedido`, `EstadoDevolucion`, `MotivoDevolucion`, `CantidadPositiva`, `Instant`.

**20. Ejemplos, trazabilidad y estado.**

| Caso | Resultado |
|---|---|
| Comprador propietario solicita 1 de 2 unidades entregadas dentro del plazo. | `ELEGIBLE` por 1. |
| Tercero solicita la devolución. | `NO_ELEGIBLE` por `RET_NOT_OWNER`. |
| Pedido en `DESPACHADO` sin entrega confirmada. | `NO_ELEGIBLE`. |
| Solicitud de 3 unidades con 2 entregadas. | `NO_ELEGIBLE` por cantidad. |
| Segunda devolución de la misma unidad ya resuelta. | `NO_ELEGIBLE`. |

**Trazabilidad:** `[MOD]` §14.1, §14.3, §18, §21 (RET-01, RET-02), §22.6, DD-12; `[ENU]` Dominio 11; `[VO]` §8.15, §9.2, §6.7; decisiones `DEC-W1-002` (plazo inicial 30 días, configurable) y `DEC-BIZ-03`; limitación `L-10`.

**Estado:** **Confirmado por fuente**; el plazo y el catálogo de motivos quedan **parcialmente especificados**.

---

### 4.8 DS-08 — `PoliticaReembolso`

**1. Identificador y nombre canónico.** `DS-08`, `PoliticaReembolso`.

**2. Definición de negocio.** Política que verifica si un reembolso es elegible, calcula el saldo reembolsable de un pago y comprueba la aprobación y los límites acumulados.

**3. Propósito.** Evitar reembolsos superiores a lo capturado, reembolsos duplicados y ejecuciones sin aprobación autorizada.

**4. Justificación como política de dominio.** La decisión compara el pago, los reembolsos completados y en curso, la devolución de origen y el aprobador. No pertenece a `Reembolso` ni a `Pago` por separado.

**5. Responsabilidad única.** Producir una decisión de elegibilidad de reembolso y el saldo disponible.

**6. Alcance.**

- Verificar que el pago esté `CAPTURADO`, `REEMBOLSO_PARCIAL` o `REEMBOLSADO`.
- Calcular el importe capturado menos reembolsos completados y en curso.
- Verificar que el importe solicitado sea positivo y no exceda el saldo.
- Verificar que la moneda coincida.
- Verificar que el aprobador sea un Administrador o rol de finanzas autorizado.
- Verificar la idempotencia de la solicitud.
- Vincular el reembolso al pago y, cuando corresponda, a la devolución.

**7. Fuera de alcance.**

- Ejecutar llamadas de red al proveedor de pagos.
- Cambiar el estado del pago o del reembolso por sí misma.
- Aprobar la devolución física; corresponde a `DS-07` y al actor autorizado.
- Definir la moneda, la escala o la política de redondeo.
- Reembolsar sin pago capturado.
- Calcular impuestos o facturas.

**8. Actores y autorización.** La solicitud puede originarse en una devolución aprobada o en un ajuste autorizado. La aprobación corresponde a un Administrador o rol de finanzas autorizado por política. `DS-01` verifica el rol y la separación de funciones.

**9. Entradas conceptuales.**

| Entrada | Obligatoria | Uso |
|---|---:|---|
| `pagoId` | Sí | Pago de origen. |
| Importe capturado | Sí | Base del saldo. |
| Reembolsos completados y en curso | Sí | Consumo del saldo. |
| Importe solicitado | Sí | Comparación. |
| Moneda | Sí | Coherencia. |
| `devolucionId` | Condicional | Obligatorio si se origina en devolución. |
| Aprobador | Sí | Autorización. |
| `IdempotencyKey` | Sí | Evita duplicados. |
| `MotivoReembolso` | Sí | Justificación. |

**10. Salidas y resultados.** Decisión `ELEGIBLE` o `NO_ELEGIBLE`; saldo reembolsable; importe máximo aprobable; motivo del rechazo; obligaciones de aprobación y auditoría. No ejecuta el reembolso.

**11. Precondiciones.** Pago existente y capturado; importe solicitado conocido; moneda conocida; aprobador identificado; clave de idempotencia presente.

**12. Reglas de negocio aplicadas.**

- `REF-01`: el reembolso acumulado no supera los fondos capturados.
- `PAY-05`: el total capturado y los reembolsos acumulados no exceden el importe capturado.
- `[MOD]` §14.2: el importe es mayor que cero y no excede el saldo; solo se procesa una vez por clave idempotente; un fallo externo no marca `COMPLETADO`; la aprobación y el resultado se auditan.
- `[MOD]` §14.2: la aprobación corresponde a un Administrador o rol de finanzas autorizado.
- `DD-12`: la recepción física puede ocurrir antes o después del reembolso según la política.

**13. Invariantes protegidas.**

- `INV-VO-EREE-02`: importe positivo y acotado al saldo.
- `INV-VO-EREE-03`: aprobación por actor autorizado.
- `INV-VO-EREE-04`: un fallo externo no equivale a completado.
- `INV-VO-EREE-05`: una sola ejecución por clave idempotente.
- `INV-VO-EREE-06`: no se supera el capturado menos reembolsos completados o en curso.
- `INV-VO-EPAG-05`: el reembolso no excede el importe capturado.
- `INV-VO-MON-03`: misma moneda.

**14. Flujo conceptual.**

1. Verificar que el pago exista y esté capturado o parcialmente reembolsado.
2. Verificar que el importe solicitado sea positivo.
3. Verificar que la moneda coincida con la del pago.
4. Calcular el saldo: capturado menos reembolsos completados y en curso.
5. Comparar el importe solicitado con el saldo.
6. Verificar la aprobación del actor autorizado.
7. Verificar la idempotencia de la solicitud.
8. Verificar el vínculo con la devolución cuando corresponda.
9. Devolver decisión, saldo e importe máximo.

**15. Casos límite y decisiones.**

- **Reembolsos parciales sucesivos:** cada uno consume saldo; el acumulado nunca excede lo capturado.
- **Reembolso en curso:** compromete saldo aunque aún no esté completado, para evitar sobre-reembolso concurrente.
- **Reembolso sin devolución:** permitido solo como ajuste autorizado y auditado; `devolucionId` puede ser nulo.
- **Fallo del proveedor:** el reembolso queda `FALLIDO`; no se marca `COMPLETADO` ni se libera el saldo sin decisión.
- **Moneda distinta:** se rechaza; no se convierte sin política de tipo de cambio.
- **Aprobador no autorizado:** se rechaza; no se admite autoaprobación.
- **Reembolso duplicado:** la misma clave no se procesa dos veces.

**16. Errores y rechazos.**

| Código documental | Situación |
|---|---|
| `REF_PAYMENT_NOT_CAPTURED` | Pago no capturado. |
| `REF_INVALID_AMOUNT` | Importe no positivo. |
| `REF_EXCEEDS_BALANCE` | Importe mayor que el saldo. |
| `REF_CURRENCY_MISMATCH` | Moneda distinta. |
| `REF_UNAUTHORIZED_APPROVER` | Aprobador sin autorización. |
| `REF_DUPLICATE_IDEMPOTENCY` | Solicitud duplicada. |
| `REF_MISSING_MOTIVE` | Motivo ausente. |
| `REF_INVALID_LINK` | Devolución o pago incompatible. |

**17. Efectos secundarios y eventos.** No modifica estado ni llama al proveedor. Si la decisión es favorable, el caso de uso crea el `Reembolso`, ejecuta la operación externa y emite `ReembolsoCompletado` solo con confirmación.

**18. Consistencia y transaccionalidad.** La evaluación debe ejecutarse dentro de la operación que compromete el saldo o con una reserva durable equivalente, para que dos solicitudes concurrentes no superen el capturado.

**19. Dependencias y relaciones.**

- Depende de `Pago`, `Reembolso` y `Devolucion`.
- No depende del proveedor de pagos concreto ni de la red.
- Se relaciona con `DS-07` (elegibilidad de devolución), `DS-06` (estado del pedido) y `DS-09` (auditoría).
- Consume `EstadoPago`, `EstadoReembolso`, `Dinero`, `MotivoReembolso`, `IdempotencyKey`.

**20. Ejemplos, trazabilidad y estado.**

| Caso | Resultado |
|---|---|
| Pago capturado de 100, sin reembolsos, solicitud de 40. | `ELEGIBLE`; saldo 100. |
| Pago capturado de 100, reembolsado 80, solicitud de 30. | `NO_ELEGIBLE`; saldo 20. |
| Segunda solicitud con la misma clave. | Rechazo idempotente. |
| Aprobador sin rol financiero. | `NO_ELEGIBLE`. |
| Reembolso en curso de 50 y nueva solicitud de 60 sobre 100. | `NO_ELEGIBLE`; saldo comprometido 50. |

**Trazabilidad:** `[MOD]` §11.1, §14.2, §18, §21 (REF-01, PAY-05), §22.6, DD-12; `[ENU]` Dominio 11; `[VO]` §8.12, §8.16, §9.3, §6.5, §7.5; decisión `DEC-BIZ-05`.

**Estado:** **Confirmado por fuente**; moneda y redondeo quedan **parcialmente especificados**.

---

### 4.9 DS-09 — `ServicioAuditoria`

**1. Identificador y nombre canónico.** `DS-09`, `ServicioAuditoria`.

**2. Definición de negocio.** Servicio que construye registros de auditoría normalizados para acciones relevantes, con actor, recurso, resultado, gravedad, correlación y causalidad, excluyendo secretos y datos personales innecesarios.

**3. Propósito.** Permitir responder quién actuó, qué hizo, sobre qué recurso, cuándo, con qué resultado y bajo qué referencia, sin convertir la auditoría en una segunda fuente de verdad del negocio.

**4. Justificación como servicio de dominio.** La construcción aplica reglas de minimización, coherencia entre resultado y gravedad, y obligatoriedad de correlación y actor. Esas reglas son transversales y no pertenecen a un agregado concreto.

**5. Responsabilidad única.** Producir un `RegistroAuditoria` válido y minimizado a partir de un hecho de negocio.

**6. Alcance.**

- Validar el código de evento.
- Exigir actor humano o identidad de sistema.
- Exigir correlación.
- Asignar resultado y gravedad coherentes.
- Minimizar el payload y excluir secretos.
- Vincular recurso, referencia causal y timestamp.
- Preparar el registro para escritura append-only.

**7. Fuera de alcance.**

- Persistir el registro, abrir transacciones o implementar outbox.
- Definir el catálogo completo de eventos.
- Modificar o eliminar registros existentes.
- Reemplazar los registros de negocio.
- Decidir la autorización de la operación auditada.
- Almacenar contraseñas, tokens, datos completos de tarjetas o secretos.

**8. Actores y autorización.** Lo invocan los casos de uso y, cuando corresponde, los propios servicios de dominio para exigir evidencia. El actor del registro es quien inició la operación; las operaciones automáticas usan identidad de sistema. Ningún actor puede modificar un registro existente.

**9. Entradas conceptuales.**

| Entrada | Obligatoria | Uso |
|---|---:|---|
| `CodigoEvento` | Sí | Tipo de hecho. |
| Tipo y referencia del recurso | Sí | Objeto afectado. |
| Actor o identidad de sistema | Sí | Autoría. |
| `RolSistema` del actor | Condicional | Contexto de autorización. |
| `Instant` | Sí | Momento UTC. |
| `CorrelationId` | Sí | Flujo de negocio. |
| `causationId` | Condicional | Evento causante. |
| `ResultadoAuditoria` | Sí | Éxito, rechazo o error. |
| `GravedadAuditoria` | Sí | Importancia. |
| Detalles | Sí | Payload mínimo. |

**10. Salidas y resultados.** Un `RegistroAuditoria` validado con todos sus campos obligatorios y un payload minimizado; o un rechazo si falta un dato esencial o se detecta información prohibida.

**11. Precondiciones.** Código de evento válido; actor identificado; correlación presente; resultado y gravedad conocidos; payload disponible.

**12. Reglas de negocio aplicadas.**

- `AUD-01`: los registros son append-only.
- `AUD-02`: todo movimiento de inventario produce evidencia correlacionada.
- `AUD-03`: se auditan cambios de estado relevantes, incorporación de vendedor, ajustes de inventario y acciones privilegiadas.
- `AUD-04`: no se almacenan contraseñas, tokens, datos completos de tarjetas ni secretos.
- `AUD-05`: la auditoría no reemplaza los registros de negocio.
- `AUD-06`: los errores y rechazos relevantes también pueden auditarse.
- `[MOD]` §20: los eventos incluyen identificador, fecha UTC, versión de esquema, correlación, causalidad y referencias.

**13. Invariantes protegidas.**

- `INV-VO-CODEV-01`: código no vacío.
- `INV-VO-CODEV-02`: código perteneciente a un catálogo versionado.
- `INV-VO-CODEV-03`: el significado de un código no cambia sin versión.
- `INV-VO-AUDP-01`: sin secretos.
- `INV-VO-AUDP-02`: payload mínimo.
- `INV-VO-AUDP-03`: inmutable.
- `INV-VO-CORR-01`: correlación no vacía.
- `INV-VO-GRAV-02`: la gravedad no sustituye el resultado.

**14. Flujo conceptual.**

1. Verificar que el código de evento exista y esté versionado.
2. Verificar que el actor o la identidad de sistema estén presentes.
3. Verificar que la correlación esté presente.
4. Verificar la coherencia entre resultado y gravedad.
5. Construir el payload mínimo.
6. Excluir secretos y datos personales innecesarios.
7. Vincular recurso, causalidad y timestamp.
8. Devolver el registro validado.

**15. Casos límite y decisiones.**

- **Actor de sistema:** se registra como identidad de sistema, no como usuario humano.
- **Evento de rechazo:** se audita con resultado `RECHAZO`; no se confunde con `ERROR`.
- **Evento crítico:** exige correlación y actor; se marca `CRITICO`.
- **Payload con datos sensibles:** se rechaza o se minimiza antes de construir el registro; nunca se almacena completo.
- **Catálogo incompleto:** el código debe pertenecer a una convención versionada; el catálogo completo no está enumerado en la fuente.
- **Fallo de persistencia:** la escritura crítica requiere outbox o mecanismo equivalente; el servicio no declara éxito sin evidencia durable.

**16. Errores y rechazos.**

| Código documental | Situación |
|---|---|
| `AUD_INVALID_EVENT_CODE` | Código ausente o no registrado. |
| `AUD_MISSING_ACTOR` | Falta actor o identidad de sistema. |
| `AUD_MISSING_CORRELATION` | Falta correlación. |
| `AUD_INVALID_RESULT` | Resultado fuera del catálogo. |
| `AUD_INVALID_SEVERITY` | Gravedad fuera del catálogo. |
| `AUD_SENSITIVE_DATA` | Payload con secreto o dato prohibido. |
| `AUD_INCONSISTENT_EVENT` | Resultado y gravedad incoherentes. |

**17. Efectos secundarios y eventos.** No modifica el agregado auditado. Su salida se persiste de forma append-only; la escritura durable y el outbox pertenecen a la capa de aplicación o infraestructura.

**18. Consistencia y transaccionalidad.** La auditoría crítica debe confirmarse junto con la mutación de negocio mediante outbox transaccional o mecanismo equivalente. La auditoría no participa en la transacción como sustituto de la verdad del negocio.

**19. Dependencias y relaciones.**

- Depende de `RegistroAuditoria` y de los VOs de auditoría.
- No depende de HTTP, mensajería, MongoDB ni SDKs.
- Se relaciona con todos los servicios; en particular, `DS-03` exige evidencia de movimientos y `DS-06`, `DS-07` y `DS-08` exigen evidencia de cambios y aprobaciones.
- Consume `CodigoEvento`, `GravedadAuditoria`, `ResultadoAuditoria`, `CorrelationId`, `AuditPayload`, `RolSistema`, `Instant`.

**20. Ejemplos, trazabilidad y estado.**

| Caso | Resultado |
|---|---|
| Cambio de estado de pedido con actor y correlación. | Registro válido con resultado `ÉXITO`. |
| Rechazo de reserva por falta de stock. | Registro con resultado `RECHAZO` y gravedad informativa o advertencia. |
| Payload con número completo de tarjeta. | Rechazo por `AUD_SENSITIVE_DATA`. |
| Evento crítico sin correlación. | Rechazo por `AUD_MISSING_CORRELATION`. |
| Intento de editar un registro existente. | Prohibido por `AUD-01`. |

**Trazabilidad:** `[MOD]` §15.1, §18, §20, §21 (AUD-01…AUD-06), DD-10; `[ENU]` OBJ-12; `[VO]` §8.18, §8.19, §8.20, §9.6, §7.6, §7.4; limitaciones `L-11`, `L-14`.

**Estado:** **Confirmado por fuente**; la composición del payload y el catálogo de eventos quedan **parcialmente especificados**.

---

## 5. Interacciones entre servicios

Esta sección describe colaboraciones conceptuales. **No es un caso de uso** ni un contrato de aplicación; la orquestación, la persistencia y las transacciones pertenecen a la capa de aplicación.

### 5.1 Checkout de productos físicos

1. `DS-01` autoriza al comprador y verifica su estado comercial.
2. `DS-02` confirma que cada producto y variante son vendibles.
3. `DS-04` propone bodegas elegibles para las líneas físicas.
4. `DS-05` calcula subtotal, descuentos, impuestos, envío y total.
5. `DS-03` reserva las cantidades propuestas de forma atómica e idempotente.
6. `DS-06` valida la creación del pedido en `PENDIENTE_DE_PAGO`.
7. `DS-09` registra la evidencia de la operación.
8. Si falla la reserva o la creación, el caso de uso compensa liberando reservas.

**Resultado:** pedido pendiente de pago con snapshots y reservas activas; nunca un pedido pagable sin stock físico.

### 5.2 Confirmación de pago y preparación

1. El caso de uso recibe la confirmación verificable del pago.
2. `DS-06` valida la transición a `PAGADO`.
3. `DS-06` valida la transición a `EN_PREPARACION` cuando las reservas siguen activas.
4. `DS-09` audita el cambio y la confirmación.

**Resultado:** pedido pagado y preparable; el pago no se declara capturado sin confirmación.

### 5.3 Despacho y entrega

1. `DS-04` confirma la bodega de origen y la compatibilidad.
2. `DS-03` consume la reserva y registra `SALIDA_VENTA`.
3. `DS-06` valida `DESPACHADO` y, cuando todos los envíos estén entregados, `ENTREGADO`.
4. `DS-09` audita la salida y la entrega.

**Resultado:** saldo actualizado y pedido entregado solo con evidencia completa.

### 5.4 Devolución y reembolso

1. `DS-07` evalúa propiedad, entrega, plazo y cantidades.
2. El actor autorizado aprueba o rechaza; `DS-01` impide la autoaprobación.
3. Para producto físico, la recepción e inspección preceden al reingreso; para digital, se revoca el acceso cuando corresponda.
4. `DS-08` verifica saldo, moneda, aprobación e idempotencia.
5. `DS-09` audita la solicitud, la aprobación y el resultado.

**Resultado:** devolución resuelta y reembolso que nunca excede lo capturado.

### 5.5 Regla de orden

El orden anterior es una guía de dependencias, no una obligación rígida. Un caso de uso puede omitir pasos que no apliquen —por ejemplo, `DS-04` y `DS-03` en un pedido digital— siempre que respete las precondiciones y las invariantes.

---

## 6. Matriz de reglas e invariantes por servicio

| Servicio | Reglas de negocio | Invariantes principales | Agregados afectados |
|---|---|---|---|
| `DS-01` | RG-01…RG-03, USR-03, SUP-01, §19.1 | Rol único, cuenta activa, alcance, no autoaprobación | `Usuario`, perfiles, recursos |
| `DS-02` | CAT-01…CAT-07 | Variante válida, SKU único, precio válido, no reanudar descontinuado | `Producto`, `Variante`, `PerfilVendedor` |
| `DS-03` | INV-01…INV-10, DD-04, DD-05 | Saldo no negativo, disponibilidad, reserva única, idempotencia | `Inventario`, `ReservaInventario`, `MovimientoInventario` |
| `DS-04` | INV-02…INV-04, ORD-07, LOG-01 | Bodega activa, compatibilidad, no exceder disponibilidad | `Bodega`, `Inventario`, `Pedido`, `Envio` |
| `DS-05` | §16.1, fórmula de total | Moneda única, exactitud, total no negativo, redondeo reproducible | `Pedido`, `ItemPedido`, `Carrito` |
| `DS-06` | ORD-01…ORD-08, §10.4 | Transición válida, pago confirmado, entrega completa, cierre inmutable | `Pedido`, `Pago`, `Envio` |
| `DS-07` | RET-01, RET-02, DD-12 | Propiedad, entrega, plazo, cantidades, no reapertura | `Devolucion`, `Pedido`, `PerfilComprador` |
| `DS-08` | REF-01, PAY-05, §14.2 | Saldo, moneda, aprobación, idempotencia, fallo≠completado | `Pago`, `Reembolso`, `Devolucion` |
| `DS-09` | AUD-01…AUD-06, §20 | Append-only, minimización, correlación, sin secretos | `RegistroAuditoria` |

---

## 7. Matriz de trazabilidad

| Requisito/regla | Servicio/política | Agregados | Objetos de valor | Fuente | Estado |
|---|---|---|---|---|---|
| RG-01/RG-02/RG-03 autorización | `DS-01` | `Usuario`, perfiles, recursos | `RolSistema`, `EstadoUsuario` | `[ENU]` RG; `[MOD]` §19 | Alineado |
| CAT-01…CAT-07 publicación | `DS-02` | `Producto`, `Variante`, `PerfilVendedor` | `SKU`, `Dinero`, `EstadoProducto`, `EstadoVendedor`, `EstadoVariante` | `[MOD]` §7, §21 | Alineado |
| INV-01…INV-10 inventario | `DS-03` | `Inventario`, `ReservaInventario`, `MovimientoInventario` | `Cantidad`, `CantidadPositiva`, `EstadoReserva`, `TipoMovimientoInventario`, `IdempotencyKey` | `[MOD]` §8, §21 | Alineado |
| ORD-07/LOG-01 asignación física | `DS-04` | `Bodega`, `Inventario`, `Pedido`, `Envio` | `TipoBodega`, `EstadoBodega`, `TipoEntrega` | `[MOD]` §8, §13, §21 | Alineado; preferencia limitada |
| Cálculo monetario | `DS-05` | `Pedido`, `ItemPedido` | `Dinero`, `CantidadPositiva` | `[MOD]` §10, §16.1 | Alineado; tasas limitadas |
| ORD-01…ORD-08 transiciones | `DS-06` | `Pedido`, `Pago`, `Envio` | `EstadoPedido`, `EstadoPago`, `EstadoEnvio`, `DireccionSnapshot` | `[MOD]` §10, §21 | Alineado |
| RET-01/RET-02 devolución | `DS-07` | `Devolucion`, `Pedido`, `PerfilComprador` | `EstadoDevolucion`, `MotivoDevolucion`, `CantidadPositiva`, `Instant` | `[MOD]` §14.1, §21 | Alineado; plazo limitado |
| REF-01/PAY-05 reembolso | `DS-08` | `Pago`, `Reembolso`, `Devolucion` | `EstadoPago`, `EstadoReembolso`, `Dinero`, `MotivoReembolso`, `IdempotencyKey` | `[MOD]` §14.2, §21 | Alineado; moneda limitada |
| AUD-01…AUD-06 auditoría | `DS-09` | `RegistroAuditoria` | `CodigoEvento`, `GravedadAuditoria`, `ResultadoAuditoria`, `CorrelationId`, `AuditPayload` | `[MOD]` §15, §21 | Alineado; catálogo limitado |
| OBJ-01 Administrar usuarios | `DS-01`, `DS-09` | `Usuario` | `RolSistema`, `EstadoUsuario`, identificadores | `[ENU]` OBJ-01 | Alineado |
| OBJ-04 Controlar bodegas | `DS-01`, `DS-03`, `DS-04` | `Bodega`, `Inventario` | `TipoBodega`, `EstadoBodega`, `DireccionFisica` | `[ENU]` Dominio 4 | Alineado |
| OBJ-05 Gestionar catálogo | `DS-02`, `DS-05` | `Producto`, `Variante` | `SKU`, `Dinero`, `CategoriaProducto`, `EstadoProducto` | `[ENU]` Dominio 5 | Alineado |
| OBJ-06 Administrar inventario | `DS-03`, `DS-04` | `Inventario`, `ReservaInventario` | `Cantidad`, `EstadoReserva`, `TipoMovimientoInventario` | `[ENU]` Dominio 6 | Alineado |
| OBJ-08 Controlar pedidos | `DS-05`, `DS-06` | `Pedido`, `Pago`, `Envio` | `EstadoPedido`, `EstadoPago`, `EstadoEnvio` | `[ENU]` Dominio 7 | Alineado |
| OBJ-10 Gestionar logística | `DS-04`, `DS-06` | `Envio`, `Bodega` | `EstadoEnvio`, `DireccionSnapshot` | `[ENU]` Dominio 10 | Alineado |
| OBJ-11 Devoluciones y reembolsos | `DS-07`, `DS-08` | `Devolucion`, `Reembolso` | `EstadoDevolucion`, `EstadoReembolso`, `MotivoDevolucion`, `MotivoReembolso` | `[ENU]` Dominio 11 | Alineado |
| OBJ-12 Información administrativa | `DS-09` | `RegistroAuditoria` | `CodigoEvento`, `GravedadAuditoria`, `ResultadoAuditoria` | `[ENU]` OBJ-12 | Alineado |

---

## 8. Equivalencias con los servicios legados

El README y los documentos anteriores describen cinco servicios. No son canónicos en la línea base 2.0, pero se conserva su intención mediante la siguiente equivalencia.

| Servicio legado | Equivalencia vigente | Contenido que se conserva | Contenido que se descarta |
|---|---|---|---|
| `UserManagementService` | `DS-01` + agregado `Usuario` + casos de uso de registro e incorporación | Rol único, estado de cuenta, autorización por alcance | CRUD genérico, gestión de sesiones y persistencia dentro del servicio. |
| `CatalogService` | `DS-02` + agregados `Producto` y `Variante` | Publicación válida, SKU único, precio válido, estado del vendedor | Consultas de catálogo y handlers de persistencia. |
| `InventoryService` | `DS-03` + `DS-04` + agregados `Inventario`, `ReservaInventario` y `MovimientoInventario` | Disponibilidad, reserva, liberación, consumo, movimientos | Consultas SQL directas y ajustes sin motivo. |
| `OrderProcessingService` | `DS-05` + `DS-06` + agregados `Pedido`, `Pago` y `Envio` | Cálculo, transiciones, precondiciones de pago y entrega | Orquestación del checkout y llamadas al proveedor de pagos. |
| `AuditService` | `DS-09` + persistencia documental | Registro normalizado, correlación, minimización | Mutación de registros y acoplamiento a MongoDB dentro del dominio. |

**Decisión:** los cinco nombres legados no se reintroducen como servicios canónicos. Si un documento futuro los menciona, debe mapearlos a esta tabla.

---

## 9. Verificación del documento

### 9.1 Lista de comprobación

- [x] El propósito y el alcance están delimitados.
- [x] Se distingue servicio de dominio, política, caso de uso, puerto y adaptador.
- [x] Los nueve servicios de `[MOD]` §18 están documentados.
- [x] Cada servicio tiene los veinte puntos obligatorios.
- [x] Cada servicio tiene identificador estable y nombre canónico.
- [x] Las reglas se referencian por código y no se inventan.
- [x] Las invariantes se cruzan con `[MOD]` §21 y `[VO]` §12.
- [x] Los candidatos descartados están justificados.
- [x] Los servicios legados están mapeados.
- [x] No se fijan moneda, tasas, plazos, catálogos ni preferencias sin evidencia.
- [x] Las limitaciones se registran como tales.
- [x] No se introducen puertos, adaptadores, contratos ni código.

### 9.2 Verificación cruzada con Domain Object Values

| Comprobación | Resultado |
|---|---|
| Los nombres de VOs usados en `[DS]` coinciden con `[VO]`. | Alineado. |
| `DS-03` usa `EstadoReserva` y las invariantes `INV-VO-ERES-01…05`. | Alineado. |
| `DS-05` usa `Dinero` y las reglas monetarias de `[VO]` §6.5. | Alineado. |
| `DS-06` usa `EstadoPedido`, `EstadoPago` y `EstadoEnvio` con los códigos canónicos. | Alineado. |
| `DS-07` y `DS-08` usan `EstadoDevolucion`, `EstadoReembolso`, `MotivoDevolucion` y `MotivoReembolso`. | Alineado. |
| `DS-09` usa `CodigoEvento`, `GravedadAuditoria`, `ResultadoAuditoria`, `CorrelationId` y `AuditPayload`. | Alineado. |
| Ningún servicio redefine un VO con otro nombre. | Verificado. |
| Ningún VO crea una regla que contradiga un servicio. | Verificado. |

### 9.3 Riesgos residuales

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Preferencia de bodega no definida. | `DS-04` puede producir propuestas distintas ante el mismo caso. | `DEC-BIZ-04`; la propuesta debe ser factible, no óptima. |
| Tasas, descuentos y moneda no definidos. | `DS-05` no puede producir importes definitivos sin política. | `DEC-BIZ-05`; el servicio exige la política como entrada. |
| Catálogo de motivos no definido; plazo ya aprobado. | `DS-07` no puede validar el motivo; el plazo se valida con el valor vigente (`DEC-W1-002`). | `DEC-BIZ-03`/`L-10`; se exige el catálogo como entrada. |
| Catálogo de eventos incompleto. | `DS-09` no puede validar todos los códigos. | `L-14`; se exige un catálogo versionado. |
| Composición del payload de auditoría no definida. | `DS-09` no puede fijar un esquema cerrado. | `L-11`; se aplica minimización y se remite al contrato. |
| Transiciones de algunos estados no completas. | `DS-06` solo puede validar las confirmadas. | `L-09`; las transiciones no listadas se rechazan. |
| Concurrencia entre propuesta y reserva. | `DS-04` no garantiza exclusividad. | `DS-03` decide y puede rechazar; el caso de uso compensa. |
| Reembolso concurrente. | `DS-08` podría autorizar dos reembolsos que en conjunto excedan el saldo. | La evaluación debe comprometer saldo en la misma operación o con reserva durable. |

---

## 10. Registro de decisiones locales

| ID | Decisión | Justificación | Consecuencia |
|---|---|---|---|
| `DS-D-01` | Distinguir políticas puras de servicios con efecto. | Evita que una decisión de solo lectura abra transacciones o mute estado. | `DS-01`, `DS-02`, `DS-06`, `DS-07` y `DS-08` deciden; `DS-03` aplica el efecto. |
| `DS-D-02` | `DS-04` es de solo lectura y nunca reserva. | La reserva efectiva requiere control de concurrencia y pertenece a `DS-03`. | La propuesta no es una promesa de stock. |
| `DS-D-03` | `DS-05` recibe la política fiscal, de descuentos y de redondeo. | No hay evidencia para fijar tasas ni moneda. | El servicio es determinista solo con la política suministrada. |
| `DS-D-04` | `DS-06` no modifica pagos ni inventario. | Esos agregados tienen sus propios ciclos y servicios. | La coordinación pertenece al caso de uso. |
| `DS-D-05` | `DS-08` evalúa el saldo pero no llama al proveedor. | La red y el protocolo son infraestructura. | La ejecución y confirmación pertenecen al caso de uso y al adaptador. |
| `DS-D-06` | `DS-09` construye el registro; la persistencia y el outbox son externos. | El dominio no debe depender de MongoDB ni de transacciones distribuidas. | La durabilidad se garantiza en aplicación/infraestructura. |
| `DS-D-07` | Los cinco servicios legados no se reintroducen. | El modelo 2.0 separa dominio de aplicación. | Se documentan equivalencias y descartes. |
| `DS-D-08` | No se fijan valores numéricos de política. | Sería inventar reglas de negocio. | Se remite a `DEC-BIZ-*` y a políticas configurables. |
| `DS-D-09` | Los códigos de error son documentales. | Evitan convertir este documento en un contrato de API. | Los contratos futuros podrán mapearlos. |

---

## 11. Cierre

Este documento es la referencia canónica de servicios y políticas de dominio para NexusMarket en la línea base 2.0. Cualquier cambio futuro debe actualizar simultáneamente:

1. Este documento.
2. `[MOD]` si cambia el modelo o una regla.
3. `[VO]` si cambia un objeto de valor o una invariante.
4. Los futuros casos de uso, puertos, adaptadores y contratos que consuman el servicio.
5. `DOCUMENTATION_STATUS.md`.

No se considera completo un cambio que introduzca un servicio sin trazabilidad, que duplique una regla existente, que convierta coordinación de aplicación en servicio de dominio o que fije una política de negocio no aprobada.

