# NEXUSMARKET — Objetos de Valor del Dominio (Domain Object Values)

**Identificador:** NM-SDD-DOM-VO-001
**Versión:** 1.0
**Estado:** línea base derivada del Modelo de Dominio 2.0
**Fecha:** 26 de octubre de 2026
**Documento fuente principal:** [`nexusmarket-domain-model.md`](./nexusmarket-domain-model.md) (en adelante `[MOD]`)
**Documento relacionado:** [`nexusmarket-domain-services.md`](./nexusmarket-domain-services.md) (en adelante `[DS]`)
**Fuentes complementarias:** [`enunciado.md`](../enunciado.md) (`[ENU]`), [`nexusmarket-arquitectura.md`](../Software%20Architecture/nexusmarket-arquitectura.md) (`[ARQ]`), [`Prompt-maestro-documentacion.md`](../Prompt-maestro-documentacion.md) (`[PM]`).

---

## 1. Propósito y alcance

### 1.1 Qué documenta este documento

Este documento define el catálogo canónico de **objetos de valor** (Value Objects, VO) del dominio NexusMarket: conceptos cuyo significado de negocio depende de sus valores, que no tienen identidad propia y que se validan al construirse. Para cada uno se documentan su semántica, composición conceptual, reglas de igualdad, invariantes, validaciones, condiciones de creación y rechazo, operaciones permitidas, inmutabilidad, relaciones y trazabilidad.

El catálogo cubre:

- Identificadores tipados que dan identidad a entidades y agregados.
- Nombres y textos con significado de negocio.
- Correo electrónico, documento de identidad y credencial hasheada.
- Dinero y cantidades.
- Direcciones de entrega, direcciones físicas y snapshots.
- Marcas temporales y claves de trazabilidad.
- Catálogos cerrados de roles, estados, tipos, categorías, movimientos y auditoría.
- Objetos de valor auxiliares de motivos, referencias, datos fiscales congelados y payload de auditoría.

### 1.2 Qué no documenta

No forman parte de este documento:

- La especificación individual de entidades y agregados; pertenece a `[MOD]` y a los documentos por agregado.
- La especificación de servicios y políticas de dominio; pertenece a `[DS]`.
- Casos de uso, servicios de aplicación, puertos de entrada o salida, adaptadores, contratos HTTP, DTOs, esquemas de persistencia, índices, transacciones o migraciones.
- La implementación en TypeScript, JavaScript, Go o cualquier otro lenguaje.
- La definición de políticas comerciales no respaldadas por las fuentes, como plazos, tasas, moneda del despliegue, límites de longitud o formatos de identificación.

### 1.3 Relación con el Modelo de Dominio

`[MOD]` es la fuente principal. Su sección 16 enumera los objetos de valor y tipos controlados; las secciones 6 a 15 describen las entidades que los utilizan y las reglas que los rodean. Este documento **no reemplaza** el modelo: lo desglosa, clasifica y completa en los puntos que el modelo deja a la validación de entrada o a la política configurable.

Cuando una regla no está expresamente definida en `[MOD]`, se indica como **inferencia**, **decisión de diseño** o **limitación por fuente**. No se presenta como requisito confirmado.

### 1.4 Relación con el documento de servicios

`[DS]` documenta los servicios y políticas que operan sobre estos objetos de valor. Las referencias a servicios en este documento son conceptuales; no definen firmas, puertos ni contratos.

---

## 2. Criterios de clasificación

### 2.1 Criterios generales aplicados

Un concepto se documenta como objeto de valor cuando cumple, de forma conjunta, lo siguiente:

1. **No tiene identidad propia:** dos instancias con los mismos valores representan el mismo concepto de negocio.
2. **Es inmutable:** una vez construido, su valor no cambia; los cambios se expresan reemplazando el objeto completo.
3. **Se valida al construirse:** no existe un estado inválido representable.
4. **Tiene semántica de negocio:** no es un contenedor genérico ni una estructura de transporte.
5. **Encapsula una regla o un significado:** evita que un valor se represente como cadena, número o booleano sin restricciones.

### 2.2 Distinciones aplicadas a NexusMarket

| Concepto a distinguir | Criterio | Ejemplo en NexusMarket | Clasificación |
|---|---|---|---|
| Entidad con identidad propia | Tiene identidad estable y ciclo de vida; dos instancias con los mismos atributos pueden ser distintas. | `Usuario`, `Pedido`, `Pago`, `Envio`, `Devolucion`, `Reembolso`. | Entidad / agregado. No es VO. |
| Identificador | Identifica una entidad; no tiene significado comercial por sí mismo, pero su tipo evita confusiones. | `UsuarioId`, `PedidoId`, `PagoId`. | Objeto de valor de identidad tipada. |
| Atributo primitivo | No tiene invariante ni semántica que justifique un tipo propio. | Un contador técnico de reintentos, un booleano de configuración. | Atributo primitivo. No es VO. |
| DTO | Estructura de transporte entre capas o hacia el exterior; no protege invariantes de negocio. | Un objeto de respuesta HTTP con campos de pedido. | DTO. No es VO. |
| Estructura de persistencia | Representa filas, documentos o columnas; depende del motor. | Un documento BSON de auditoría, una fila de tabla de inventario. | Persistencia. No es VO. |
| Objeto de infraestructura | Representa conexiones, clientes, SDKs, configuración o mensajes. | Un cliente de pasarela de pago, una conexión SQL. | Infraestructura. No es VO. |
| Catálogo controlado | Conjunto cerrado de códigos con significado de negocio. | `EstadoPedido`, `TipoEntrega`, `CategoriaProducto`. | Objeto de valor enumerado. |
| Estructura compuesta de dominio | Agrupa varios valores con una semántica común y reglas propias. | `Dinero`, `DireccionSnapshot`, `DocumentoIdentidad`. | Objeto de valor compuesto. |

### 2.3 Aplicación de los criterios a conceptos reales

| Concepto | Por qué es o no es VO | Destino |
|---|---|---|
| `Usuario` | Tiene identidad, credencial, rol y ciclo de vida. | Entidad; `[MOD]` §6.1. |
| `UsuarioId` | Identifica al usuario; no tiene identidad propia. | VO de identidad tipada. |
| `nombreCompleto` | Es un texto con regla de no vacío y normalización. | VO `NombreCompleto`. |
| `creadoEn` | Es una marca temporal inequívoca. | VO `Instant`. |
| `estado` de un pedido | Es un código de un catálogo cerrado con transiciones. | VO `EstadoPedido`. |
| `ItemCarrito` | Tiene ciclo de vida dentro del carrito; el modelo no le exige identidad de negocio, pero tampoco es un valor inmutable. | Entidad interna del agregado `Carrito`; no es VO. |
| `ItemPedido` | Tiene identidad estable dentro del pedido y snapshots comerciales. | Entidad interna del agregado `Pedido`; no es VO. |
| `ReservaInventario` | Tiene identidad, estado y ciclo de vida. | Entidad; `[MOD]` §8.2.3. |
| `MovimientoInventario` | Registra un hecho pasado con identidad y actor. | Entidad; `[MOD]` §8.3. |
| `RegistroAuditoria` | Registro inmutable con identidad y payload. | Entidad; `[MOD]` §15.1. |
| `LineaFactura`, `LineaDevolucion`, `ItemEnvio` | Son líneas internas de agregados con cantidades y referencias; no se documentan como VO independientes. | Entidades internas; `[MOD]` §12, §14, §13. |
| `DatosFacturacion`, `Paquete`, `EventoEnvio`, `TransaccionPago` | Aparecen mencionados en el mapa de contextos, pero el modelo no los define con atributos ni reglas completas. | Conceptos no completamente modelados; no se inventa su estructura. |
| `ProveedorPago` | Identifica una configuración externa; no expresa una regla de negocio central. | Atributo técnico de `Pago`; no es VO de negocio. |
| `VersionInventario` | Es un token de concurrencia. | Atributo técnico; no es VO. |
| `UriDocumento` | Es una ubicación de artefacto generado; el modelo indica que no es regla de negocio. | Atributo técnico; no es VO. |
| `MetodoEntrega` | Sinónimo legado de `TipoEntrega` en la documentación anterior. | No se crea un VO duplicado; se documenta como sinónimo legado. |
| `SystemRole` | Sinónimo legado de `RolSistema`. | No se crea un VO duplicado; se documenta como sinónimo legado. |

### 2.4 Regla de no duplicación

No se admiten dos objetos de valor con el mismo significado bajo nombres distintos. Cuando las fuentes usan nombres diferentes, este documento establece un nombre canónico y registra el sinónimo como legado. Los códigos de los catálogos no se traducen ni se renombran.

---

## 3. Inventario canónico

### 3.1 Convenciones de estado

| Estado | Significado |
|---|---|
| **Confirmado por fuente** | El concepto, sus valores o sus reglas están expresamente en `[MOD]` o `[ENU]`. |
| **Derivado** | Es una consecuencia lógica necesaria para que una regla confirmada sea comprobable. |
| **Decisión de diseño** | Es una elección técnica o de modelado adoptada para cerrar un vacío, justificada y reversible. |
| **Parcialmente especificado** | El concepto está confirmado, pero algún componente, catálogo o límite no está definido en las fuentes. |
| **No aplica** | El concepto no corresponde al alcance de objetos de valor. |

### 3.2 Tabla de inventario

| ID | Nombre canónico | Significado de negocio | Componentes conceptuales | Entidades/agregados que lo utilizan | Reglas e invariantes principales | Fuente | Estado |
|---|---|---|---|---|---|---|---|
| VO-ID-01 | `IdentificadorTipado` | Identidad estable y opaca de una entidad o agregado, tipada para evitar mezclas. | Valor opaco + tipo nominal. | Todas las entidades. | No vacío, inmutable, único en su ámbito, no reutilizado, no intercambiable entre tipos. | `[MOD]` §16, §24 | Confirmado; formato físico limitado |
| VO-NOM-01 | `NombreCompleto` | Nombre oficial de una persona. | Texto normalizado. | `Usuario`. | No vacío; espacios normalizados; sin unicidad. | `[MOD]` §6.1, §16 | Confirmado; límite de longitud limitado |
| VO-NOM-02 | `NombreComercial` | Razón social o nombre comercial del vendedor. | Texto normalizado. | `PerfilVendedor`. | No vacío; sin unicidad. | `[MOD]` §6.4, §16 | Confirmado; límite limitado |
| VO-NOM-03 | `NombreProducto` | Nombre comercial del producto. | Texto normalizado. | `Producto`. | No vacío; longitud acotada por validación de entrada; sin unicidad. | `[MOD]` §7.1, §16 | Confirmado; límite limitado |
| VO-NOM-04 | `NombreVariante` | Nombre de la presentación vendible. | Texto normalizado. | `Variante`. | No vacío; sin unicidad. | `[MOD]` §7.4, §16 | Confirmado; límite limitado |
| VO-NOM-05 | `NombreBodega` | Nombre de la ubicación física de almacenamiento. | Texto normalizado. | `Bodega`. | No vacío; sin unicidad. | `[MOD]` §8.1, §16 | Confirmado; límite limitado |
| VO-TXT-01 | `SKU` | Identificador comercial único de una variante vendible. | Cadena normalizada. | `Variante`, `ItemPedido` (snapshot). | No vacío; único globalmente; no se reutiliza tras descontinuar. | `[MOD]` §7.4, §16 | Confirmado |
| VO-TXT-02 | `CorreoElectronico` | Medio principal de acceso y comunicación del usuario. | Cadena con formato válido y normalización consistente. | `Usuario`. | Formato válido; único tras normalización. | `[MOD]` §6.1, §16 | Confirmado; formato exacto limitado |
| VO-TXT-03 | `DocumentoIdentidad` | Documento que identifica a una persona en la plataforma. | Tipo, país y número normalizados. | `Usuario`. | Único en la plataforma; dato protegido. | `[MOD]` §6.1, §16 | Confirmado; formato limitado |
| VO-SEC-01 | `HashCredencial` | Resultado de un algoritmo aprobado de hashing de contraseña. | Hash y metadatos del algoritmo. | `Usuario`. | No contiene contraseña original; no reversible; nunca se registra en auditoría. | `[MOD]` §6.1, §16 | Confirmado; algoritmo limitado |
| VO-MON-01 | `Dinero` | Importe monetario con moneda explícita. | Importe exacto + moneda. | `Variante`, `ItemCarrito`, `Pedido`, `ItemPedido`, `Pago`, `Factura`, `Reembolso`. | Moneda explícita; aritmética exacta; solo monedas compatibles; redondeo reproducible. | `[MOD]` §16, §16.1 | Confirmado; escala/moneda limitadas |
| VO-CAN-01 | `Cantidad` | Cantidad entera no negativa de unidades. | Entero no negativo. | `Inventario`, `ItemCarrito`, `ItemPedido`, `MovimientoInventario`, `ReservaInventario`, `LineaDevolucion`. | Entero; nunca negativo; sin fracciones salvo tipo futuro. | `[MOD]` §8.2, §16 | Confirmado |
| VO-CAN-02 | `CantidadPositiva` | Cantidad entera estrictamente positiva. | Entero mayor que cero. | `ItemCarrito`, `ItemPedido`, `MovimientoInventario`, `ReservaInventario`, `LineaDevolucion`. | Entero; mayor que cero; sin fracciones. | `[MOD]` §8.3, §10.2, §16 | Confirmado |
| VO-DIR-01 | `Direccion` | Dirección de entrega editable del comprador. | Campos requeridos de una dirección válida (no fijados por la fuente). | `PerfilComprador`. | Válida según campos requeridos; puede haber varias; una principal. | `[MOD]` §6.3, §16 | Parcialmente especificado |
| VO-DIR-02 | `DireccionFisica` | Ubicación física de una bodega. | Dirección/ubicación normalizada (composición no fijada). | `Bodega`. | No vacía; normalizada; no es dirección de entrega. | `[MOD]` §8.1 | Parcialmente especificado |
| VO-DIR-03 | `DireccionSnapshot` | Copia inmutable de la dirección usada en una compra. | Copia de los datos de `Direccion` al confirmar. | `Pedido`, `Envio`. | Inmutable; cambios posteriores del perfil no la alteran; obligatoria para pedido físico. | `[MOD]` §10.1, §13.1, §16 | Confirmado |
| VO-TMP-01 | `Instant` | Marca temporal inequívoca. | Fecha y hora en UTC. | Todas las entidades con marcas temporales. | Válida; inequívoca; UTC; ordenable. | `[MOD]` §16 | Confirmado; formato limitado |
| VO-TRZ-01 | `IdempotencyKey` | Clave que evita aplicar dos veces una solicitud o evento. | Valor opaco + ámbito de operación. | `Pago`, `MovimientoInventario`, `ReservaInventario`, `Reembolso`. | Única en su ámbito; inmutable; mismo efecto ante repetición. | `[MOD]` §8.3, §8.2.3, §11.1, §14.2, §16 | Confirmado; conflicto de payload derivado |
| VO-TRZ-02 | `CorrelationId` | Identificador que agrupa registros de un mismo flujo de negocio. | Valor opaco. | `RegistroAuditoria`, eventos. | No vacío; agrupa; no sustituye la identidad del registro. | `[MOD]` §15.1, §16 | Confirmado |
| VO-ENM-00 | `RolSistema` | Rol único de una cuenta. | Catálogo cerrado. | `Usuario`. | Exactamente un rol por cuenta; no concede acceso automático a todo recurso. | `[MOD]` §6.2, §16 | Confirmado |
| VO-ENM-01 | `TipoEntrega` | Naturaleza física o digital de la entrega. | Catálogo cerrado. | `Producto`, `ItemPedido`. | Coherente con el subtipo de producto; físico exige inventario/envío; digital no. | `[MOD]` §7.1, §16 | Confirmado |
| VO-ENM-02 | `TipoBodega` | Propiedad y administración de una bodega. | Catálogo cerrado. | `Bodega`. | `VENDEDOR` exige un vendedor propietario; `MARKETPLACE` la administra el Administrador. | `[MOD]` §8.1, §16 | Confirmado |
| VO-ENM-03 | `CategoriaProducto` | Clasificación comercial del producto. | Catálogo controlado ampliable. | `Producto`. | Código válido; `DIGITAL` no obliga por sí solo a producto digital. | `[MOD]` §7.5, §16 | Confirmado |
| VO-ENM-04 | `EstadoUsuario` | Condición operativa de acceso de una cuenta. | Catálogo cerrado. | `Usuario`. | Transiciones válidas; cuenta inactiva/bloqueada no opera. | `[MOD]` §6.1, §16 | Confirmado |
| VO-ENM-05 | `EstadoComercial` | Condición del comprador para nuevas compras. | Catálogo cerrado. | `PerfilComprador`. | `RESTRINGIDO` impide nuevos pedidos; no borra historial. | `[MOD]` §6.3, §16 | Confirmado; proceso de cambio limitado |
| VO-ENM-06 | `EstadoVendedor` | Etapa administrativa y operativa del vendedor. | Catálogo cerrado. | `PerfilVendedor`. | Suspendido no publica ni inicia ventas nuevas; obligaciones existentes se resuelven. | `[MOD]` §6.4, §16 | Confirmado; transiciones parciales |
| VO-ENM-07 | `EstadoProducto` | Estado de publicación del producto. | Catálogo cerrado. | `Producto`. | Transiciones válidas; descontinuado no vuelve a publicarse. | `[MOD]` §7.1, §16 | Confirmado |
| VO-ENM-08 | `EstadoVariante` | Disponibilidad comercial de la variante. | Catálogo cerrado. | `Variante`. | Inactiva no se vende. | `[MOD]` §7.4, §16 | Confirmado; transiciones limitadas |
| VO-ENM-09 | `EstadoBodega` | Condición operativa de la bodega. | Catálogo cerrado. | `Bodega`. | Inactiva no acepta ingresos ni reservas; stock debe resolverse. | `[MOD]` §8.1, §16 | Confirmado; transiciones limitadas |
| VO-ENM-10 | `EstadoPedido` | Estado del ciclo comercial del pedido. | Catálogo cerrado. | `Pedido`. | Solo transiciones válidas; `CARRITO` no es estado; `ENTREGADO` y `CERRADO` son distintos. | `[MOD]` §10.3, §16 | Confirmado |
| VO-ENM-11 | `EstadoPago` | Estado financiero de un pago. | Catálogo cerrado. | `Pago`; proyección en `Pedido`. | Independiente del estado logístico; no se declara capturado sin confirmación. | `[MOD]` §11.1, §16 | Confirmado |
| VO-ENM-12 | `EstadoFactura` | Estado documental de la factura. | Catálogo cerrado. | `Factura`. | Emitida no se edita; corrección/anulación con documento relacionado. | `[MOD]` §12.1, §16 | Confirmado |
| VO-ENM-13 | `EstadoEnvio` | Estado logístico del envío. | Catálogo cerrado. | `Envio`. | Solo pedidos pagados se preparan/despachan; entrega con evidencia; fallo no es devolución. | `[MOD]` §13.1, §16 | Confirmado; transiciones parciales |
| VO-ENM-14 | `EstadoDevolucion` | Estado del proceso de devolución. | Catálogo cerrado. | `Devolucion`. | Transiciones válidas; no se reabre una devolución resuelta. | `[MOD]` §14.1, §14.3, §16 | Confirmado |
| VO-ENM-15 | `EstadoReembolso` | Estado del proceso de reembolso. | Catálogo cerrado. | `Reembolso`. | Fallo externo no equivale a completado; idempotencia. | `[MOD]` §14.2, §16 | Confirmado |
| VO-ENM-16 | `TipoMovimientoInventario` | Tipo de operación que afecta existencias. | Catálogo cerrado. | `MovimientoInventario`. | Efecto sobre cantidades definido; no deja saldos inválidos. | `[MOD]` §8.2.2, §16 | Confirmado |
| VO-ENM-17 | `EstadoReserva` | Condición del ciclo de vida de una reserva de existencias. | Catálogo cerrado. | `ReservaInventario`. | `ACTIVA` se consume o libera una sola vez; `EXPIRADA` no se consume; una reserva terminal no vuelve a activa. | `[MOD]` §8.2.3, §16 | Confirmado |
| VO-AUD-01 | `GravedadAuditoria` | Importancia del evento de auditoría. | Catálogo cerrado. | `RegistroAuditoria`. | Valor válido; no sustituye el resultado. | `[MOD]` §15.1, §16 | Confirmado |
| VO-AUD-02 | `ResultadoAuditoria` | Resultado de la acción auditada. | Catálogo cerrado. | `RegistroAuditoria`. | `ÉXITO`, `RECHAZO` o `ERROR`. | `[MOD]` §15.1 | Confirmado |
| VO-AUD-03 | `CodigoEvento` | Código estable del evento auditado. | Código de catálogo versionado. | `RegistroAuditoria`. | Código estable; catálogo versionado; valores no enumerados por la fuente. | `[MOD]` §15.1 | Parcialmente especificado |
| VO-AUD-04 | `AuditPayload` | Datos mínimos y estructurados del evento, sin secretos. | Estructura abierta y minimizada. | `RegistroAuditoria`. | Sin secretos ni datos sensibles innecesarios; inmutable. | `[MOD]` §15.1 | Parcialmente especificado |
| VO-MOT-01 | `MotivoMovimiento` | Razón de un ajuste o baja de inventario. | Texto o código de catálogo. | `MovimientoInventario`. | Obligatorio en ajustes y bajas; no vacío. | `[MOD]` §8.3 | Parcialmente especificado |
| VO-MOT-02 | `MotivoDevolucion` | Causa de una solicitud de devolución. | Catálogo controlado. | `Devolucion`. | Obligatorio; debe pertenecer al catálogo; valores no enumerados. | `[MOD]` §14.1 | Parcialmente especificado |
| VO-MOT-03 | `MotivoReembolso` | Razón de un reembolso. | Texto o código de catálogo. | `Reembolso`. | Obligatorio; no vacío. | `[MOD]` §14.2 | Parcialmente especificado |
| VO-FIS-01 | `DatosEmisorSnapshot` | Datos del emisor congelados al emitir la factura. | Composición no especificada. | `Factura`. | Inmutable; no se recalcula tras emitir. | `[MOD]` §12.1 | Parcialmente especificado |
| VO-FIS-02 | `DatosReceptorSnapshot` | Datos del comprador congelados al emitir la factura. | Composición no especificada. | `Factura`. | Inmutable; no se recalcula tras emitir. | `[MOD]` §12.1 | Parcialmente especificado |
| VO-REF-01 | `TipoReferencia` | Tipo de proceso que origina un movimiento de inventario. | Catálogo controlado. | `MovimientoInventario`. | Valores permitidos: pedido, devolución, ajuste, recepción u otra referencia autorizada. | `[MOD]` §8.3 | Parcialmente especificado |

---

## 4. Especificación de la familia de identificadores

### 4.1 VO-ID-01 — `IdentificadorTipado`

#### 4.1.1 Definición de negocio

Un identificador tipado es un valor opaco que identifica de forma estable una entidad o agregado y cuyo tipo nominal expresa a qué concepto pertenece. No es un número, una cadena libre ni un identificador universal compartido por todos los conceptos.

#### 4.1.2 Propósito

Evitar que identificadores de conceptos distintos se intercambien accidentalmente, preservar la trazabilidad entre agregados y permitir que la representación física del identificador evolucione sin contaminar el dominio.

#### 4.1.3 Componentes

| Componente | Significado |
|---|---|
| Valor opaco | Cadena o representación uniforme que identifica la instancia. Su formato físico no lo fija el dominio. |
| Tipo nominal | Especialización que indica el concepto identificado (`UsuarioId`, `PedidoId`, `PagoId`, etc.). |

#### 4.1.4 Identidad conceptual y ausencia de identidad propia

El identificador no tiene identidad propia: dos valores iguales del mismo tipo representan la misma referencia. Su función es identificar a otro concepto, no ser un concepto con ciclo de vida.

#### 4.1.5 Criterios de igualdad

Dos identificadores son iguales si y solo si pertenecen al mismo tipo nominal y su valor opaco es exactamente igual. `PedidoId("A")` no es igual a `PagoId("A")`.

#### 4.1.6 Invariantes

- `INV-VO-ID-01`: el valor no puede estar vacío.
- `INV-VO-ID-02`: el identificador es inmutable.
- `INV-VO-ID-03`: un identificador no se reutiliza para una instancia distinta de la misma entidad.
- `INV-VO-ID-04`: un identificador de un tipo no se asigna a una referencia de otro tipo.
- `INV-VO-ID-05`: la unicidad se garantiza dentro del ámbito de la entidad correspondiente.

#### 4.1.7 Reglas de validación

- Rechazar cadenas vacías o compuestas solo por espacios.
- Rechazar valores que no cumplan el formato técnico adoptado para el despliegue, cuando ese formato se defina.
- No interpretar el contenido del identificador como dato de negocio.
- No derivar reglas de negocio del prefijo, longitud o patrón visual del identificador.

#### 4.1.8 Condiciones de creación válida

- Creación a partir de un generador confiable al crear una entidad nueva.
- Reconstrucción a partir de un valor persistido previamente validado.
- Creación a partir de un valor recibido en un límite de aplicación, después de validar su presencia y formato técnico.

#### 4.1.9 Condiciones de rechazo

- Valor ausente, vacío o solo con espacios.
- Valor con formato técnico inválido cuando el formato esté definido.
- Intento de usar un identificador de otro tipo.
- Intento de reutilizar un identificador para una instancia diferente.

#### 4.1.10 Operaciones conceptuales permitidas

- Comparar igualdad y desigualdad.
- Exponer el valor opaco para persistencia, trazabilidad o comunicación entre capas.
- Reconstruir el tipo a partir de un valor previamente validado.

#### 4.1.11 Resultados de las operaciones

Las comparaciones producen un resultado booleano; la exposición produce el valor opaco; la reconstrucción produce una instancia válida o un rechazo.

#### 4.1.12 Inmutabilidad esperada

El valor opaco y el tipo nominal no cambian después de la creación. Cambiar la identidad de una entidad no es una operación de negocio válida; si se requiere, se crea otra entidad.

#### 4.1.13 Relaciones con entidades y agregados

Todos los agregados usan identificadores tipados. La tabla siguiente enumera las especializaciones confirmadas por `[MOD]`.

#### 4.1.14 Identificadores concretos

| Identificador | Entidad/agregado | Ámbito | Fuente | Estado |
|---|---|---|---|---|
| `UsuarioId` | `Usuario` | Plataforma | `[MOD]` §6.1, §16 | Confirmado |
| `CompradorId` | `PerfilComprador` | Plataforma | `[MOD]` §6.3, §16 | Confirmado |
| `VendedorId` | `PerfilVendedor` | Plataforma | `[MOD]` §6.4, §16 | Confirmado |
| `ProductoId` | `Producto` | Catálogo | `[MOD]` §7.1, §16 | Confirmado |
| `VarianteId` | `Variante` | Catálogo | `[MOD]` §7.4, §16 | Confirmado |
| `BodegaId` | `Bodega` | Bodegas | `[MOD]` §8.1, §16 | Confirmado |
| `CarritoId` | `Carrito` | Compra | `[MOD]` §9.1 | Confirmado |
| `PedidoId` | `Pedido` | Compra | `[MOD]` §10.1, §16 | Confirmado |
| `CheckoutGroupId` | Grupo de pedidos de un mismo checkout | Compra | `[MOD]` §10.1 | Confirmado |
| `ItemPedidoId` | `ItemPedido` | Pedido | `[MOD]` §10.2 | Confirmado |
| `PagoId` | `Pago` | Pagos | `[MOD]` §11.1, §16 | Confirmado |
| `FacturaId` | `Factura` | Facturación | `[MOD]` §12.1 | Confirmado |
| `EnvioId` | `Envio` | Logística | `[MOD]` §13.1, §16 | Confirmado |
| `DevolucionId` | `Devolucion` | Posventa | `[MOD]` §14.1, §16 | Confirmado |
| `ReembolsoId` | `Reembolso` | Posventa | `[MOD]` §14.2, §16 | Confirmado |
| `InventarioId` | `Inventario` | Inventario | `[MOD]` §8.2 | Confirmado |
| `ReservaInventarioId` | `ReservaInventario` | Inventario | `[MOD]` §8.2.3 | Confirmado |
| `MovimientoId` | `MovimientoInventario` | Inventario | `[MOD]` §8.3 | Confirmado |
| `AuditId` | `RegistroAuditoria` | Auditoría | `[MOD]` §15.1, §16 | Confirmado |
| `EventId` | Evento de dominio causal | Auditoría/eventos | `[MOD]` §15.1 | Referenciado; modelo de eventos parcial |

**Nota:** `ItemCarrito` puede tener un identificador técnico para operaciones de interfaz, pero `[MOD]` §9.2 indica que no es obligatorio para el dominio. No se documenta como identificador de negocio canónico.

#### 4.1.15 Servicios de dominio que lo utilizan

Todos los servicios de `[DS]` reciben o devuelven identificadores tipados. Ningún servicio debe aceptar un identificador de un tipo donde se espera otro.

#### 4.1.16 Restricciones de dependencia

El identificador no depende de entidades, persistencia, HTTP ni frameworks. Su representación física se decide en el diseño técnico, fuera del dominio.

#### 4.1.17 Ejemplos válidos e inválidos

| Caso | Ejemplo | Resultado |
|---|---|---|
| Válido | Un `PedidoId` generado al crear el pedido. | Aceptado. |
| Válido | Reconstruir un `PagoId` desde un valor persistido. | Aceptado. |
| Inválido | Cadena vacía como `UsuarioId`. | Rechazado. |
| Inválido | Usar un `PedidoId` donde se espera un `PagoId`. | Rechazado por tipo. |
| Inválido | Reutilizar el `SKU` de una variante descontinuada como identificador de otra variante. | Rechazado por la regla de `SKU`; no es un identificador de entidad, pero ilustra la no reutilización. |

#### 4.1.18 Trazabilidad

`[MOD]` §16 (identificadores tipados), §24 (independencia del formato físico), entidades §6–§15.

#### 4.1.19 Estado de definición

**Confirmado por fuente** en cuanto a tipo y semántica; **limitado por fuente** en cuanto al formato físico, que se decide en el diseño técnico.

---

## 5. Especificación de la familia de nombres textuales

### 5.1 VO-NOM — Familia `NombreTextual`

#### 5.1.1 Definición de negocio

Un nombre textual es un valor que expresa el nombre oficial o comercial de un concepto del dominio. No es una cadena libre: debe ser no vacío, estar normalizado y respetar el límite de longitud que defina la validación de entrada.

#### 5.1.2 Propósito

Evitar nombres vacíos, con espacios inconsistentes o sin control de longitud, y preservar el significado del concepto nombrado sin confundirlo con un identificador único.

#### 5.1.3 Componentes

| Componente | Significado |
|---|---|
| Texto normalizado | Cadena resultante de eliminar espacios extremos y colapsar espacios internos repetidos. |
| Límite de longitud | Máximo definido por la validación de entrada; `[MOD]` no fija una cifra. |

#### 5.1.4 Identidad conceptual y ausencia de identidad propia

El nombre no tiene identidad propia. Dos nombres iguales pueden corresponder a conceptos distintos; la igualdad por valor no implica unicidad de negocio.

#### 5.1.5 Criterios de igualdad

Dos nombres son iguales si su texto normalizado es exactamente igual. La comparación es sensible a mayúsculas y minúsculas salvo que una política de presentación indique lo contrario; `[MOD]` no define unicidad de nombres.

#### 5.1.6 Invariantes

- `INV-VO-NOM-01`: el texto no puede estar vacío después de normalizar.
- `INV-VO-NOM-02`: el texto no puede estar compuesto solo por espacios.
- `INV-VO-NOM-03`: los espacios internos repetidos se colapsan en uno solo.
- `INV-VO-NOM-04`: el texto no se trunca silenciosamente; si excede el límite configurado, se rechaza.
- `INV-VO-NOM-05`: el nombre no se usa como identificador único.

#### 5.1.7 Reglas de validación

- Rechazar cadenas vacías o solo con espacios.
- Aplicar normalización de espacios antes de comparar o persistir.
- Rechazar valores que excedan el límite de entrada cuando exista.
- No imponer un formato de nombres personales, razón social o nombre comercial no definido en las fuentes.
- No imponer unicidad.

#### 5.1.8 Condiciones de creación válida

- Texto recibido en un límite de aplicación y validado.
- Texto reconstruido desde persistencia y revalidado.
- Texto generado por un proceso interno con las mismas reglas.

#### 5.1.9 Condiciones de rechazo

- Cadena vacía o solo con espacios.
- Texto que excede el límite configurado.
- Texto con un tipo de contenido incompatible con el concepto (por ejemplo, un SKU usado como nombre de producto).

#### 5.1.10 Operaciones conceptuales permitidas

- Comparar igualdad.
- Normalizar y mostrar.
- Reemplazar el nombre completo por otro valor válido cuando la entidad lo permita.

#### 5.1.11 Resultados de las operaciones

La comparación produce un booleano; la normalización produce un nuevo valor válido; el reemplazo produce una nueva instancia y no muta la anterior.

#### 5.1.12 Inmutabilidad esperada

El valor es inmutable. La entidad que lo contiene puede reemplazarlo por otro VO, pero no modificar su texto interno.

#### 5.1.13 Relaciones con entidades y agregados

| VO | Concepto nombrado | Entidad/agregado | Regla específica | Fuente |
|---|---|---|---|---|
| `NombreCompleto` | Nombre oficial de una persona. | `Usuario` | No vacío; espacios normalizados; sin unicidad. | `[MOD]` §6.1, §16 |
| `NombreComercial` | Razón social o nombre comercial. | `PerfilVendedor` | No vacío; sin unicidad. | `[MOD]` §6.4, §16 |
| `NombreProducto` | Nombre comercial del producto. | `Producto` | No vacío; longitud acotada por validación de entrada; sin unicidad. | `[MOD]` §7.1, §16 |
| `NombreVariante` | Nombre de la presentación vendible. | `Variante` | No vacío; sin unicidad. | `[MOD]` §7.4, §16 |
| `NombreBodega` | Nombre de la bodega. | `Bodega` | No vacío; sin unicidad. | `[MOD]` §8.1, §16 |

#### 5.1.14 Servicios de dominio que lo utilizan

`DS-02` valida que los nombres obligatorios estén presentes al publicar un producto. `DS-09` puede incluirlos en un payload de auditoría solo cuando sean necesarios y no sensibles. Ningún servicio usa nombres como clave de identidad.

#### 5.1.15 Restricciones de dependencia

La familia no depende de entidades, persistencia ni frameworks. El límite de longitud es una entrada de validación, no una constante inventada por el dominio.

#### 5.1.16 Ejemplos válidos e inválidos

| Caso | Ejemplo | Resultado |
|---|---|---|
| Válido | `"  Juan   Pérez  "` → `"Juan Pérez"` | Aceptado y normalizado. |
| Válido | `"Café Andino"` como nombre de producto. | Aceptado. |
| Inválido | `""` o `"   "`. | Rechazado. |
| Inválido | Un nombre de 10 000 caracteres cuando el límite configurado es menor. | Rechazado; no se trunca. |
| Inválido | Usar `"SKU-123"` como `NombreCompleto` si el contrato exige un nombre de persona. | Rechazado por validación de entrada; el VO por sí solo no puede distinguir la semántica. |

#### 5.1.17 Trazabilidad

`[MOD]` §16 (nombres), §6.1, §6.4, §7.1, §7.4, §8.1.

#### 5.1.18 Estado de definición

**Confirmado por fuente** en cuanto a no vacío y normalización; **decisión de diseño** en cuanto al colapso de espacios; **limitado por fuente** en cuanto a los límites máximos.

---

## 6. Objetos de valor de texto, identificación y credenciales

### 6.1 VO-TXT-01 — `SKU`

**Definición de negocio:** identificador comercial único de una variante vendible. Representa la unidad que se stockea, se vende y se rastrea en logística.

**Propósito:** evitar colisiones entre variantes, permitir trazabilidad de inventario y preservar el identificador comercial en los snapshots de pedido.

**Componentes:**

| Componente | Significado |
|---|---|
| Código | Cadena normalizada, no vacía, que identifica la variante. |

**Identidad conceptual y ausencia de identidad propia:** el SKU no es una entidad; es un valor que identifica comercialmente una variante. Su identidad es el propio código.

**Criterios de igualdad:** dos SKU son iguales si su código normalizado es exactamente igual. La unicidad es global en NexusMarket.

**Invariantes:**

- `INV-VO-SKU-01`: no puede estar vacío.
- `INV-VO-SKU-02`: es único globalmente en la plataforma.
- `INV-VO-SKU-03`: no se reutiliza para otra variante después de que la original se descontinúa.
- `INV-VO-SKU-04`: una vez asignado a una variante, no se reasigna a otra.

**Reglas de validación:**

- Rechazar cadena vacía o solo con espacios.
- Aplicar la normalización que defina el catálogo; `[MOD]` no fija conversión de mayúsculas/minúsculas.
- Verificar unicidad global; la comprobación en dominio no sustituye la restricción de persistencia.
- No derivar el SKU del nombre del producto ni de un identificador interno si ello genera colisiones.

**Condiciones de creación válida:**

- Código único, no vacío y normalizado, asignado a una variante antes de publicarla.
- Reconstrucción desde persistencia con revalidación de formato.

**Condiciones de rechazo:**

- Código vacío.
- Código ya usado por otra variante.
- Reutilización de un SKU de una variante descontinuada.
- Intento de cambiar el SKU de una variante ya vendida sin un proceso explícito; `[MOD]` no define ese cambio, por lo que se rechaza en la línea base.

**Operaciones conceptuales permitidas:** comparar igualdad, exponer el código y copiarlo como snapshot en `ItemPedido`.

**Resultados:** la comparación produce un booleano; la copia produce un valor histórico inmutable en la línea del pedido.

**Inmutabilidad esperada:** el SKU es inmutable una vez asignado. El snapshot en `ItemPedido` también es inmutable.

**Relaciones:** `Variante.sku`; `ItemPedido.skuSnapshot`; `DS-02` lo valida al publicar.

**Restricciones de dependencia:** no depende de persistencia ni de formato de base de datos. La unicidad global se refuerza en persistencia, pero la regla pertenece al dominio.

**Ejemplos:**

| Caso | Ejemplo | Resultado |
|---|---|---|
| Válido | `"CAM-ROJA-M"` único. | Aceptado. |
| Inválido | `""`. | Rechazado. |
| Inválido | `"CAM-ROJA-M"` ya asignado a otra variante. | Rechazado. |
| Inválido | Reutilizar `"CAM-ROJA-M"` después de descontinuar la variante original. | Rechazado. |

**Trazabilidad:** `[MOD]` §7.4, §10.2, §16; `[ENU]` Dominio 5 (variantes).

**Estado:** **Confirmado por fuente**; la normalización exacta queda **limitada por fuente**.

---

### 6.2 VO-TXT-02 — `CorreoElectronico`

**Definición de negocio:** dirección de correo que identifica el medio principal de acceso y comunicación de un usuario.

**Propósito:** garantizar un formato válido y una comparación consistente para la unicidad de la cuenta.

**Componentes:**

| Componente | Significado |
|---|---|
| Dirección | Cadena con formato de correo electrónico. |

**Identidad conceptual y ausencia de identidad propia:** es un valor; dos correos iguales representan el mismo medio de contacto.

**Criterios de igualdad:** igualdad por la forma normalizada. La línea base adopta recorte de espacios y conversión a minúsculas para comparar y persistir; esta es una **decisión de diseño** apoyada en el ejemplo de `[ARQ]` §6.3 y en la exigencia de normalización consistente de `[MOD]` §16.

**Invariantes:**

- `INV-VO-EMAIL-01`: formato válido.
- `INV-VO-EMAIL-02`: único después de normalización.
- `INV-VO-EMAIL-03`: no se almacena ni se muestra como credencial.

**Reglas de validación:**

- Rechazar cadena vacía o solo con espacios.
- Rechazar formatos sin estructura de correo válida.
- Normalizar antes de comparar y persistir.
- La verificación de propiedad del correo pertenece al flujo de identidad/aplicación, no al VO.

**Condiciones de creación válida:**

- Dirección con formato válido, normalizada y no duplicada.
- Cambio de correo solo mediante el comportamiento `Usuario.cambiarCorreo(correoVerificado)`, que exige un correo verificado.

**Condiciones de rechazo:**

- Cadena vacía.
- Formato inválido.
- Correo ya registrado por otro usuario.
- Intento de cambiar el correo sin verificación cuando el flujo lo exige.

**Operaciones conceptuales permitidas:** comparar igualdad, normalizar, exponer para comunicación y reconstruir desde persistencia.

**Resultados:** la normalización produce un nuevo valor; la comparación produce un booleano; la creación produce un VO válido o un rechazo.

**Inmutabilidad esperada:** el VO es inmutable. El usuario puede reemplazarlo por otro correo verificado.

**Relaciones:** `Usuario.correoElectronico`; `DS-01` puede usar el correo como dato de identidad, no como regla de autorización.

**Restricciones de dependencia:** no depende de un proveedor de correo ni de HTTP. La unicidad se refuerza en persistencia.

**Ejemplos:**

| Caso | Ejemplo | Resultado |
|---|---|---|
| Válido | `"  Ana.Perez@Example.com "` → `"ana.perez@example.com"`. | Aceptado y normalizado. |
| Inválido | `"ana.perez"`. | Rechazado. |
| Inválido | `"ana@example.com"` ya registrado. | Rechazado. |

**Trazabilidad:** `[MOD]` §6.1, §16; `[ENU]` Dominio 1 y validaciones críticas; `[ARQ]` §6.3 (ejemplo ilustrativo).

**Estado:** **Confirmado por fuente** en formato y unicidad; **decisión de diseño** en la normalización a minúsculas; el formato exacto queda **limitado por fuente**.

---

### 6.3 VO-TXT-03 — `DocumentoIdentidad`

**Definición de negocio:** documento que identifica a una persona en la plataforma, compuesto por tipo, país y número.

**Propósito:** garantizar unicidad de identidad y proteger un dato personal sensible.

**Componentes:**

| Componente | Significado |
|---|---|
| Tipo | Clase de documento (por ejemplo, documento nacional, pasaporte u otro tipo admitido). |
| País | Jurisdicción emisora. |
| Número | Valor identificador del documento. |

**Identidad conceptual y ausencia de identidad propia:** es un valor compuesto; dos documentos con los mismos componentes normalizados representan la misma identidad documental.

**Criterios de igualdad:** igualdad por la combinación normalizada de tipo, país y número. La unicidad es en el ámbito de la plataforma.

**Invariantes:**

- `INV-VO-DOC-01`: tipo, país y número están presentes.
- `INV-VO-DOC-02`: la combinación es única en la plataforma.
- `INV-VO-DOC-03`: el dato se trata como protegido y no se expone innecesariamente.
- `INV-VO-DOC-04`: no se registra completo en auditoría ni en logs.

**Reglas de validación:**

- Rechazar componentes vacíos.
- Aplicar la normalización que defina la política de identidad; `[MOD]` no fija un formato exacto.
- Verificar unicidad; la restricción de persistencia refuerza la regla.
- No inferir tipo o país a partir del número.

**Condiciones de creación válida:**

- Documento con componentes válidos y no duplicado.
- Reconstrucción desde persistencia con revalidación.

**Condiciones de rechazo:**

- Componente faltante o vacío.
- Documento duplicado.
- Formato inválido según la política de identidad, cuando exista.

**Operaciones conceptuales permitidas:** comparar igualdad, normalizar y exponer de forma controlada.

**Resultados:** la comparación produce un booleano; la exposición controlada produce una representación enmascarada o autorizada.

**Inmutabilidad esperada:** el VO es inmutable. Un cambio de documento es una operación administrativa sensible, no una mutación silenciosa.

**Relaciones:** `Usuario.documentoIdentidad`; `DS-01` puede usarlo para identificar al actor, nunca para decidir autorización por sí solo.

**Restricciones de dependencia:** no depende de un servicio externo de identidad. El formato y la verificación documental quedan fuera del alcance del VO.

**Ejemplos:**

| Caso | Ejemplo | Resultado |
|---|---|---|
| Válido | Tipo `"DNI"`, país `"CO"`, número `"12345678"`. | Aceptado si es único. |
| Inválido | Tipo vacío. | Rechazado. |
| Inválido | Mismo tipo, país y número ya registrado. | Rechazado. |

**Trazabilidad:** `[MOD]` §6.1, §16; `[ENU]` Dominio 1 y validaciones críticas.

**Estado:** **Confirmado por fuente** en componentes, unicidad y protección; **limitado por fuente** en formato y normalización exactos.

---

### 6.4 VO-SEC-01 — `HashCredencial`

**Definición de negocio:** resultado de aplicar un algoritmo aprobado de hashing a una contraseña. No contiene la contraseña original.

**Propósito:** permitir la verificación de credenciales sin almacenar secretos en texto plano.

**Componentes:**

| Componente | Significado |
|---|---|
| Hash | Resultado del algoritmo aprobado. |
| Metadatos del algoritmo | Identificación de la variante o parámetros necesarios para verificar; su formato no está fijado por `[MOD]`. |

**Identidad conceptual y ausencia de identidad propia:** es un valor; dos hashes iguales con el mismo algoritmo representan la misma credencial almacenada.

**Criterios de igualdad:** igualdad por el hash y los metadatos de algoritmo aplicables.

**Invariantes:**

- `INV-VO-HASH-01`: no contiene la contraseña original.
- `INV-VO-HASH-02`: no es reversible.
- `INV-VO-HASH-03`: nunca se registra en auditoría ni en logs.
- `INV-VO-HASH-04`: se produce con un algoritmo aprobado por la política de seguridad.

**Reglas de validación:**

- Rechazar valores vacíos.
- Rechazar valores que no correspondan al formato del algoritmo aprobado.
- No aceptar texto plano como sustituto.
- La verificación de contraseña pertenece al servicio de identidad/aplicación, no a la entidad.

**Condiciones de creación válida:**

- Producción por el mecanismo de seguridad autorizado.
- Reconstrucción desde persistencia sin exponer el valor.

**Condiciones de rechazo:**

- Valor vacío o con formato inválido.
- Intento de almacenar una contraseña en texto plano.
- Intento de incluir el hash en un payload de auditoría.

**Operaciones conceptuales permitidas:** comparar igualdad y verificar mediante el mecanismo de seguridad autorizado; el VO no implementa criptografía.

**Resultados:** la verificación produce un resultado booleano en el servicio de identidad; el VO solo representa el valor almacenado.

**Inmutabilidad esperada:** el hash es inmutable; un cambio de contraseña produce un nuevo hash.

**Relaciones:** `Usuario.credencial`; `DS-09` debe excluirlo de la auditoría.

**Restricciones de dependencia:** no depende de una biblioteca criptográfica dentro del dominio. El algoritmo es una decisión de seguridad externa al modelo.

**Ejemplos:**

| Caso | Ejemplo | Resultado |
|---|---|---|
| Válido | Hash producido por el mecanismo aprobado. | Aceptado. |
| Inválido | `"mi-contraseña"` en texto plano. | Rechazado. |
| Inválido | Hash incluido en un registro de auditoría. | Rechazado por la regla de no secretos. |

**Trazabilidad:** `[MOD]` §6.1, §15.1, §16; `[ENU]` Dominio 1.

**Estado:** **Confirmado por fuente** en semántica y prohibiciones; **limitado por fuente** en algoritmo y formato.

---

### 6.5 VO-MON-01 — `Dinero`

**Definición de negocio:** importe monetario con una moneda explícita. Representa precios, subtotales, descuentos, impuestos, costos de envío, totales, pagos y reembolsos.

**Propósito:** evitar aritmética ambigua, mezclar monedas y perder precisión por punto flotante.

**Componentes:**

| Componente | Significado |
|---|---|
| Importe | Cantidad decimal exacta o unidad monetaria menor. |
| Moneda | Código de la moneda del importe. |

**Identidad conceptual y ausencia de identidad propia:** es un valor; dos importes con el mismo importe y moneda son iguales.

**Criterios de igualdad:** igualdad por importe exacto y moneda. `10.00 COP` no es igual a `10.00 USD`.

**Invariantes:**

- `INV-VO-MON-01`: la moneda siempre está presente.
- `INV-VO-MON-02`: el importe se representa con precisión exacta; no se usa punto flotante binario sin política.
- `INV-VO-MON-03`: las operaciones solo se realizan entre monedas iguales.
- `INV-VO-MON-04`: el redondeo se aplica con una regla central reproducible.
- `INV-VO-MON-05`: el importe no es negativo en la línea base; los campos que exigen importe positivo lo validan adicionalmente.

**Reglas de validación:**

- Rechazar importe ausente, no numérico o con precisión no soportada.
- Rechazar moneda ausente.
- Rechazar operaciones entre monedas distintas.
- Rechazar resultados negativos en sumas, restas o totales.
- No fijar escala decimal ni moneda del despliegue sin política; `[MOD]` §16.1 indica que la línea base puede usar COP, pero el dominio no asume una moneda única.

**Condiciones de creación válida:**

- Importe exacto con moneda explícita.
- Importe cero permitido para descuentos, costo de envío o saldo; los campos que exigen `> 0` lo validan.
- Redondeo aplicado por la política configurada.

**Condiciones de rechazo:**

- Importe negativo.
- Moneda ausente o incompatible.
- Operación con monedas distintas.
- Precisión no representable por la política monetaria.
- División que produzca un resultado no exacto sin regla de redondeo.

**Operaciones conceptuales permitidas:**

- Sumar importes de la misma moneda.
- Restar importes de la misma moneda si el resultado no es negativo.
- Multiplicar por una cantidad entera positiva.
- Comparar importes de la misma moneda.
- Aplicar una regla de redondeo explícita.

**Resultados:** las operaciones producen un nuevo `Dinero` válido o un rechazo. Nunca mutan los operandos.

**Inmutabilidad esperada:** completamente inmutable.

**Relaciones:** `Variante.precio`, `ItemCarrito.precioReferencial`, `Pedido.subtotal/descuentos/costoEnvio/impuestos/total`, `ItemPedido.precioUnitario/descuentoUnitario/impuesto/totalLinea`, `Pago.importe`, `Factura` y `Reembolso.importe`.

**Servicios de dominio que lo utilizan:** `DS-05` (cálculo de pedido) y `DS-08` (límite reembolsable).

**Restricciones de dependencia:** no depende de una biblioteca de decimales concreta; la representación técnica se decide fuera del dominio.

**Ejemplos:**

| Caso | Ejemplo | Resultado |
|---|---|---|
| Válido | `100000 COP + 50000 COP = 150000 COP`. | Aceptado. |
| Inválido | `100000 COP + 10 USD`. | Rechazado. |
| Inválido | `-1 COP`. | Rechazado. |
| Inválido | `0.1 + 0.2` con representación binaria inexacta sin política. | Rechazado o redondeado según la política; nunca se acepta la imprecisión silenciosa. |

**Trazabilidad:** `[MOD]` §16, §16.1; `[ENU]` Dominio 5 y 7; `[DS]` `DS-05`, `DS-08`.

**Estado:** **Confirmado por fuente** en moneda explícita, exactitud e igualdad de moneda; **decisión de diseño** en no admitir importes negativos; **limitado por fuente** en escala, moneda del despliegue y redondeo.

---

### 6.6 VO-CAN-01 — `Cantidad`

**Definición de negocio:** número entero no negativo de unidades de un concepto (existencias, líneas, movimientos o cantidades solicitadas).

**Propósito:** evitar cantidades negativas o fraccionarias no soportadas y unificar la aritmética de inventario y pedido.

**Componentes:**

| Componente | Significado |
|---|---|
| Valor | Entero mayor o igual que cero. |

**Identidad conceptual y ausencia de identidad propia:** es un valor; dos cantidades con el mismo entero son iguales.

**Criterios de igualdad:** igualdad por valor entero.

**Invariantes:**

- `INV-VO-CAN-01`: es un entero.
- `INV-VO-CAN-02`: no es negativo.
- `INV-VO-CAN-03`: no admite fracciones salvo que un futuro tipo de producto lo requiera expresamente.

**Reglas de validación:**

- Rechazar valores no enteros.
- Rechazar valores negativos.
- No redondear silenciosamente una fracción; se rechaza.

**Condiciones de creación válida:**

- Entero no negativo proveniente de una operación válida.
- Reconstrucción desde persistencia con revalidación.

**Condiciones de rechazo:**

- Valor negativo.
- Valor fraccionario.
- Valor no numérico.

**Operaciones conceptuales permitidas:** sumar, restar si el resultado no es negativo, comparar y multiplicar por un entero no negativo cuando la semántica lo permita.

**Resultados:** un nuevo `Cantidad` válido o un rechazo; nunca una cantidad negativa.

**Inmutabilidad esperada:** inmutable.

**Relaciones:** `Inventario.onHand/reserved/unavailable`, `ItemCarrito.cantidad`, `ItemPedido.cantidad`, `MovimientoInventario.cantidad`, `ReservaInventario.cantidad`, `LineaDevolucion.cantidad`.

**Servicios de dominio que lo utilizan:** `DS-03`, `DS-04`, `DS-05`, `DS-07`.

**Restricciones de dependencia:** no depende de persistencia ni de unidades físicas; la unidad es la del concepto que la usa.

**Ejemplos:**

| Caso | Ejemplo | Resultado |
|---|---|---|
| Válido | `0` para `unavailable`. | Aceptado. |
| Válido | `5` unidades. | Aceptado. |
| Inválido | `-1`. | Rechazado. |
| Inválido | `1.5`. | Rechazado. |

**Trazabilidad:** `[MOD]` §8.2, §8.3, §10.2, §16.

**Estado:** **Confirmado por fuente**.

---

### 6.7 VO-CAN-02 — `CantidadPositiva`

**Definición de negocio:** número entero estrictamente positivo de unidades que se agregan, reservan, mueven, compran o devuelven.

**Propósito:** impedir operaciones sin efecto o ambiguas con cantidad cero en contextos donde la cantidad debe ser mayor que cero.

**Componentes:**

| Componente | Significado |
|---|---|
| Valor | Entero mayor que cero. |

**Identidad conceptual y ausencia de identidad propia:** es un valor; dos cantidades positivas con el mismo entero son iguales.

**Criterios de igualdad:** igualdad por valor entero.

**Invariantes:**

- `INV-VO-CANP-01`: es un entero.
- `INV-VO-CANP-02`: es estrictamente mayor que cero.
- `INV-VO-CANP-03`: no admite fracciones.

**Reglas de validación:**

- Rechazar cero.
- Rechazar negativos.
- Rechazar fracciones.

**Condiciones de creación válida:**

- Entero positivo proveniente de una operación válida.

**Condiciones de rechazo:**

- Cero, negativo, fraccionario o no numérico.

**Operaciones conceptuales permitidas:** comparar, sumar con otra cantidad positiva y restar solo si el resultado sigue siendo positivo; para resultados que pueden llegar a cero se usa `Cantidad`.

**Resultados:** un nuevo `CantidadPositiva` válido o un rechazo.

**Inmutabilidad esperada:** inmutable.

**Relaciones:** `ItemCarrito.cantidad`, `ItemPedido.cantidad`, `MovimientoInventario.cantidad`, `ReservaInventario.cantidad`, `LineaDevolucion.cantidad`.

**Servicios de dominio que lo utilizan:** `DS-03`, `DS-04`, `DS-05`, `DS-07`.

**Restricciones de dependencia:** ninguna adicional.

**Ejemplos:**

| Caso | Ejemplo | Resultado |
|---|---|---|
| Válido | `1`. | Aceptado. |
| Inválido | `0`. | Rechazado. |
| Inválido | `-2`. | Rechazado. |

**Trazabilidad:** `[MOD]` §8.3, §10.2, §16.

**Estado:** **Confirmado por fuente**.

---

## 7. Objetos de valor de dirección, tiempo y trazabilidad

### 7.1 VO-DIR-01 — `Direccion`

**Definición de negocio:** dirección de entrega editable que pertenece al perfil del comprador y se usa para compras físicas.

**Propósito:** representar una ubicación válida a la que se puede entregar un pedido físico, sin confundirla con la ubicación de una bodega.

**Componentes:**

| Componente | Significado | Estado |
|---|---|---|
| Campos requeridos de dirección | Datos necesarios para identificar una ubicación de entrega. | **No especificados en las fuentes.** `[MOD]` §16 solo exige que sea una dirección válida según campos requeridos. |

**Identidad conceptual y ausencia de identidad propia:** es un valor; dos direcciones con los mismos campos normalizados representan la misma ubicación de entrega. No tiene identidad propia.

**Criterios de igualdad:** igualdad por todos los campos normalizados que compongan la dirección. La composición exacta debe fijarse antes de implementar la igualdad.

**Invariantes:**

- `INV-VO-DIR-01`: debe ser una dirección válida según los campos requeridos.
- `INV-VO-DIR-02`: pertenece a un `PerfilComprador`.
- `INV-VO-DIR-03`: un comprador puede tener una dirección principal y direcciones adicionales.
- `INV-VO-DIR-04`: se requiere al menos una dirección válida para una compra física.
- `INV-VO-DIR-05`: es editable mientras no se haya congelado en un snapshot.

**Reglas de validación:**

- Rechazar direcciones incompletas según los campos requeridos.
- Rechazar direcciones sin ubicación identificable.
- Normalizar los campos que la política de direcciones defina; `[MOD]` no fija la normalización exacta.
- No validar la existencia real de la dirección mediante un servicio externo salvo que una política posterior lo exija.

**Condiciones de creación válida:**

- Dirección con todos los campos requeridos, válida y asociada a un comprador.
- Reconstrucción desde persistencia con revalidación.

**Condiciones de rechazo:**

- Campos requeridos ausentes.
- Dirección no identificable o inválida.
- Intento de usarla como dirección de una bodega.

**Operaciones conceptuales permitidas:** crear, actualizar, comparar y congelar como `DireccionSnapshot` al confirmar una compra.

**Resultados:** la actualización produce una nueva versión de la dirección; la congelación produce un snapshot inmutable.

**Inmutabilidad esperada:** el VO es inmutable; la dirección editable se reemplaza por una nueva instancia. El perfil conserva la referencia a la versión vigente.

**Relaciones:** `PerfilComprador.direcciones`; `Pedido.direccionEntrega` (snapshot); `Envio.direccionEntrega` (snapshot); `DS-04` y el checkout la usan para validar entregabilidad física.

**Restricciones de dependencia:** no depende de un proveedor de geolocalización ni de un formato de persistencia. La composición exacta es una decisión de negocio/contrato pendiente (`DEC-BIZ-01`).

**Ejemplos:**

| Caso | Ejemplo | Resultado |
|---|---|---|
| Válido | Dirección completa según el contrato de entrada. | Aceptado. |
| Inválido | Dirección sin los campos requeridos. | Rechazado. |
| Inválido | Usar una `DireccionFisica` de bodega como dirección de entrega. | Rechazado por tipo y semántica. |

**Trazabilidad:** `[MOD]` §6.3, §16; `[ENU]` Dominio 2; `DEC-BIZ-01`.

**Estado:** **Parcialmente especificado**: semántica y obligatoriedad confirmadas; composición exacta no definida.

---

### 7.2 VO-DIR-02 — `DireccionFisica`

**Definición de negocio:** ubicación física de una bodega, normalizada para identificar dónde se almacenan existencias.

**Propósito:** distinguir la ubicación de almacenamiento de la dirección de entrega del comprador.

**Componentes:**

| Componente | Significado | Estado |
|---|---|---|
| Ubicación normalizada | Datos que identifican el lugar físico de la bodega. | **Composición no especificada en las fuentes.** |

**Identidad conceptual y ausencia de identidad propia:** es un valor; dos ubicaciones con los mismos datos normalizados representan el mismo lugar físico.

**Criterios de igualdad:** igualdad por los campos normalizados de la ubicación.

**Invariantes:**

- `INV-VO-DIRF-01`: no puede estar vacía.
- `INV-VO-DIRF-02`: debe estar normalizada.
- `INV-VO-DIRF-03`: pertenece a una `Bodega`.
- `INV-VO-DIRF-04`: no se usa como dirección de entrega de un pedido.

**Reglas de validación:**

- Rechazar ubicación vacía.
- Aplicar la normalización que defina la política de bodegas.
- No confundirla con `Direccion` del comprador.

**Condiciones de creación válida:**

- Ubicación válida al crear o actualizar una bodega.

**Condiciones de rechazo:**

- Ubicación vacía o no identificable.
- Uso como dirección de entrega.

**Operaciones conceptuales permitidas:** crear, actualizar y comparar.

**Resultados:** una nueva ubicación válida o un rechazo.

**Inmutabilidad esperada:** el VO es inmutable; la bodega puede reemplazarlo por otro valor válido.

**Relaciones:** `Bodega.ubicacion`; `DS-04` la considera al evaluar compatibilidad operativa, sin usarla como dirección del comprador.

**Restricciones de dependencia:** no depende de geolocalización ni de persistencia.

**Ejemplos:**

| Caso | Ejemplo | Resultado |
|---|---|---|
| Válido | Ubicación completa de una bodega. | Aceptado. |
| Inválido | Cadena vacía. | Rechazado. |
| Inválido | Usar la dirección de entrega de un comprador como ubicación de bodega. | Rechazado por semántica. |

**Trazabilidad:** `[MOD]` §8.1.

**Estado:** **Parcialmente especificado**: tipo y semántica confirmados; composición no definida.

---

### 7.3 VO-DIR-03 — `DireccionSnapshot`

**Definición de negocio:** copia inmutable de la dirección usada en una compra, congelada al confirmar el pedido o al crear el envío.

**Propósito:** preservar la dirección histórica aunque el comprador modifique o elimine sus direcciones posteriores.

**Componentes:**

| Componente | Significado |
|---|---|
| Copia de los campos de `Direccion` | Valores válidos al momento de la compra. |
| Referencia temporal | `Instant` de congelación, cuando la entidad lo requiera. |

**Identidad conceptual y ausencia de identidad propia:** es un valor; dos snapshots con los mismos valores son iguales, pero su función es preservar un hecho histórico.

**Criterios de igualdad:** igualdad por los valores congelados. La igualdad no implica que dos pedidos compartan la misma dirección actual.

**Invariantes:**

- `INV-VO-DIRS-01`: es inmutable.
- `INV-VO-DIRS-02`: se crea solo a partir de una `Direccion` válida.
- `INV-VO-DIRS-03`: los cambios posteriores en el perfil no lo alteran.
- `INV-VO-DIRS-04`: es obligatorio para un pedido con productos físicos.
- `INV-VO-DIRS-05`: no se reemplaza retroactivamente en un pedido entregado o cerrado.

**Reglas de validación:**

- Rechazar la creación desde una dirección inválida o incompleta.
- Rechazar la modificación después de creado.
- Verificar que el pedido físico tenga snapshot antes de confirmar.

**Condiciones de creación válida:**

- Checkout de un pedido con al menos una línea física y una dirección válida.
- Creación de un envío a partir de la dirección confirmada.

**Condiciones de rechazo:**

- Dirección de origen inválida.
- Pedido físico sin dirección.
- Intento de actualizar el snapshot.

**Operaciones conceptuales permitidas:** leer y comparar; no se actualiza.

**Resultados:** la creación produce un snapshot inmutable; la lectura devuelve los valores congelados.

**Inmutabilidad esperada:** completamente inmutable.

**Relaciones:** `Pedido.direccionEntrega`, `Envio.direccionEntrega`; `DS-06` verifica su presencia para transiciones de cumplimiento.

**Restricciones de dependencia:** no depende del perfil actual ni de la persistencia de direcciones.

**Ejemplos:**

| Caso | Ejemplo | Resultado |
|---|---|---|
| Válido | Congelar la dirección al confirmar un pedido físico. | Aceptado. |
| Inválido | Pedido físico sin snapshot. | Rechazado en checkout. |
| Inválido | Cambiar la dirección del pedido después de entregado. | Rechazado. |

**Trazabilidad:** `[MOD]` §10.1, §13.1, §16, ORD-04, ORD-07.

**Estado:** **Confirmado por fuente**.

---

### 7.4 VO-TMP-01 — `Instant`

**Definición de negocio:** marca temporal inequívoca de un hecho del dominio, expresada en UTC.

**Propósito:** ordenar hechos, calcular ventanas temporales y preservar trazabilidad sin ambigüedad de zona horaria.

**Componentes:**

| Componente | Significado |
|---|---|
| Fecha y hora | Punto temporal inequívoco. |
| Zona | UTC, según `[MOD]` §16. |

**Identidad conceptual y ausencia de identidad propia:** es un valor; dos instantes con el mismo punto temporal son iguales.

**Criterios de igualdad:** igualdad por el instante exacto en UTC.

**Invariantes:**

- `INV-VO-INST-01`: representa un instante válido.
- `INV-VO-INST-02`: se almacena en UTC.
- `INV-VO-INST-03`: es ordenable y comparable.
- `INV-VO-INST-04`: no se interpreta como fecha local sin una zona explícita.

**Reglas de validación:**

- Rechazar fechas inválidas.
- Rechazar representaciones locales ambiguas sin zona.
- No fijar un formato textual específico; el formato pertenece al contrato o a la persistencia.

**Condiciones de creación válida:**

- Reloj del sistema o valor persistido previamente validado.
- Reconstrucción desde persistencia.

**Condiciones de rechazo:**

- Fecha inexistente.
- Valor sin zona cuando la representación lo requiera.
- Texto no interpretable como instante.

**Operaciones conceptuales permitidas:** comparar, ordenar, calcular duraciones con una política explícita y exponer para trazabilidad.

**Resultados:** comparaciones booleanas, duraciones y nuevos instantes calculados.

**Inmutabilidad esperada:** inmutable.

**Relaciones:** `creadoEn`, `actualizadoEn`, `pagadoEn`, `entregadoEn`, `solicitadaEn`, `resueltaEn`, `ocurridoEn`, `despachadoEn`, `confirmadoEn`, `expiraEn`.

**Servicios de dominio que lo utilizan:** `DS-07` (ventana de devolución) y `DS-09` (marca temporal de auditoría).

**Restricciones de dependencia:** el reloj es una dependencia de aplicación o un puerto; el VO no consulta la hora por sí mismo.

**Ejemplos:**

| Caso | Ejemplo | Resultado |
|---|---|---|
| Válido | `2026-10-26T15:00:00Z`. | Aceptado. |
| Inválido | `2026-02-30T10:00:00Z`. | Rechazado. |
| Inválido | `"26/10/2026 10:00"` sin zona. | Rechazado o interpretado solo si el contrato define la zona. |

**Trazabilidad:** `[MOD]` §16; entidades §6–§15.

**Estado:** **Confirmado por fuente**; formato textual **limitado por fuente**.

---

### 7.5 VO-TRZ-01 — `IdempotencyKey`

**Definición de negocio:** clave que identifica una solicitud o evento para evitar que se aplique dos veces.

**Propósito:** proteger pagos, reservas, movimientos de inventario y reembolsos frente a reintentos y notificaciones duplicadas.

**Componentes:**

| Componente | Significado |
|---|---|
| Valor | Cadena opaca que identifica la solicitud. |
| Ámbito | Operación o agregado dentro del cual la clave es única. |

**Identidad conceptual y ausencia de identidad propia:** es un valor; dos claves con el mismo valor y ámbito representan la misma solicitud.

**Criterios de igualdad:** igualdad por valor y ámbito.

**Invariantes:**

- `INV-VO-IDK-01`: no puede estar vacía.
- `INV-VO-IDK-02`: es única dentro de su ámbito.
- `INV-VO-IDK-03`: es inmutable.
- `INV-VO-IDK-04`: la repetición de la misma clave con la misma solicitud no duplica efectos.
- `INV-VO-IDK-05`: la repetición de la misma clave con una solicitud incompatible debe rechazarse como conflicto; esta regla es **derivada** de la finalidad de idempotencia y no está detallada en `[MOD]`.

**Reglas de validación:**

- Rechazar clave vacía.
- Rechazar clave duplicada en el mismo ámbito con payload incompatible.
- No reutilizar una clave para una operación distinta.

**Condiciones de creación válida:**

- Generación por el caso de uso o recepción desde el proveedor, con un valor no vacío.
- Registro junto con la operación que protege.

**Condiciones de rechazo:**

- Clave vacía.
- Clave ya usada para otra operación en el mismo ámbito.
- Clave reutilizada con datos incompatibles.

**Operaciones conceptuales permitidas:** comparar, asociar a una operación y consultar el resultado previo.

**Resultados:** la primera aplicación produce un efecto; las repeticiones compatibles devuelven el mismo resultado; las incompatibles se rechazan.

**Inmutabilidad esperada:** inmutable.

**Relaciones:** `Pago.idempotencyKey`, `MovimientoInventario.idempotencyKey`, `ReservaInventario.claveIdempotencia`, `Reembolso.idempotencyKey`.

**Servicios de dominio que lo utilizan:** `DS-03` y `DS-08`; `DS-06` la considera para no duplicar transiciones.

**Restricciones de dependencia:** no depende de un almacén de claves concreto; la persistencia de la clave es una responsabilidad de adaptadores.

**Ejemplos:**

| Caso | Ejemplo | Resultado |
|---|---|---|
| Válido | Misma clave `"pay-123"` para el mismo pago reintentado. | Un solo efecto. |
| Inválido | `"pay-123"` reutilizada para otro pago. | Conflicto. |
| Inválido | Clave vacía. | Rechazado. |

**Trazabilidad:** `[MOD]` §8.2.3, §8.3, §11.1, §14.2, §16; `[ENU]` validaciones críticas.

**Estado:** **Confirmado por fuente** en finalidad y unicidad; **derivado** en el conflicto por payload incompatible.

---

### 7.6 VO-TRZ-02 — `CorrelationId`

**Definición de negocio:** identificador que agrupa los registros y eventos de un mismo flujo de negocio.

**Propósito:** permitir reconstruir una operación completa a través de auditoría, eventos y trazas.

**Componentes:**

| Componente | Significado |
|---|---|
| Valor | Cadena opaca que identifica el flujo. |

**Identidad conceptual y ausencia de identidad propia:** es un valor; dos registros con el mismo `CorrelationId` pertenecen al mismo flujo.

**Criterios de igualdad:** igualdad por valor.

**Invariantes:**

- `INV-VO-CORR-01`: no puede estar vacío.
- `INV-VO-CORR-02`: agrupa registros de un mismo flujo.
- `INV-VO-CORR-03`: no sustituye el identificador propio del registro.
- `INV-VO-CORR-04`: es inmutable una vez asignado.

**Reglas de validación:**

- Rechazar valor vacío.
- No reutilizar un `CorrelationId` para un flujo distinto.

**Condiciones de creación válida:**

- Generación al iniciar un flujo de negocio.
- Propagación a los registros derivados.

**Condiciones de rechazo:**

- Valor vacío.
- Reutilización para un flujo no relacionado.

**Operaciones conceptuales permitidas:** comparar, propagar y consultar registros asociados.

**Resultados:** la consulta devuelve los registros del flujo; la comparación indica pertenencia.

**Inmutabilidad esperada:** inmutable.

**Relaciones:** `RegistroAuditoria.correlationId`; eventos de dominio; `DS-09`.

**Restricciones de dependencia:** no depende de un sistema de trazas concreto.

**Ejemplos:**

| Caso | Ejemplo | Resultado |
|---|---|---|
| Válido | Un `CorrelationId` para un checkout y todos sus registros. | Aceptado. |
| Inválido | Cadena vacía. | Rechazado. |

**Trazabilidad:** `[MOD]` §15.1, §16, §20.

**Estado:** **Confirmado por fuente**.

---

## 8. Catálogos controlados y enumeraciones de estado

### 8.1 VO-ENM-00 — `RolSistema`

**Definición de negocio:** rol único que expresa la clase de capacidades generales de una cuenta.

**Propósito:** clasificar al participante y establecer el punto de partida de la autorización, sin sustituir la verificación de propiedad y alcance del recurso.

**Valores:**

| Código | Nombre | Responsabilidad general |
|---|---|---|
| `COMPRADOR` | Comprador | Consulta catálogo, administra su carrito, crea pedidos y solicita posventa sobre sus compras. |
| `VENDEDOR` | Vendedor | Administra productos y bodegas de su propiedad; es incorporado por un Administrador. |
| `OPERADOR_LOGISTICO` | Operador logístico | Ejecuta operaciones físicas asignadas de preparación, empaque, despacho y movimientos permitidos. |
| `ADMINISTRADOR` | Administrador | Incorpora vendedores, administra usuarios y bodegas del marketplace y ejecuta operaciones privilegiadas. |
| `SUPERVISOR` | Supervisor | Consulta y seguimiento; no modifica datos comerciales ni ejecuta movimientos de negocio. |

**Identidad conceptual y ausencia de identidad propia:** es un valor de catálogo; dos instancias con el mismo código son iguales.

**Criterios de igualdad:** igualdad por código.

**Invariantes:**

- `INV-VO-ROL-01`: cada cuenta tiene exactamente un rol.
- `INV-VO-ROL-02`: el rol debe pertenecer al catálogo.
- `INV-VO-ROL-03`: el rol no concede acceso automático a todos los recursos de su clase.
- `INV-VO-ROL-04`: un cambio de rol es una operación administrativa privilegiada y debe auditarse.
- `INV-VO-ROL-05`: una cuenta no puede tener simultáneamente los roles `COMPRADOR` y `VENDEDOR`.

**Reglas de validación:**

- Rechazar códigos fuera del catálogo.
- Rechazar más de un rol por cuenta.
- No usar el rol como sustituto de la propiedad del recurso.

**Condiciones de creación válida:** asignación de un código válido al crear o actualizar una cuenta, con autorización administrativa cuando corresponda.

**Condiciones de rechazo:** código desconocido; múltiples roles; intento de asignar un rol sin autorización.

**Operaciones conceptuales permitidas:** comparar, interpretar y asignar mediante una operación autorizada.

**Resultados:** la comparación produce un booleano; la asignación produce una nueva configuración de la cuenta y un registro de auditoría.

**Inmutabilidad esperada:** el valor es inmutable; la cuenta puede cambiar de rol solo mediante una operación administrativa auditada.

**Relaciones:** `Usuario.rol`; `DS-01`.

**Restricciones de dependencia:** no depende de un proveedor de identidad. El rol es una regla de negocio, no un token.

**Ejemplos:**

| Caso | Ejemplo | Resultado |
|---|---|---|
| Válido | Cuenta con rol `COMPRADOR`. | Aceptado. |
| Inválido | Cuenta con roles `COMPRADOR` y `VENDEDOR`. | Rechazado. |
| Inválido | Rol `"ADMIN"` no perteneciente al catálogo. | Rechazado. |

**Trazabilidad:** `[MOD]` §6.2, §16, §19; `[ENU]` §5 y RG-02; `[DS]` `DS-01`.

**Estado:** **Confirmado por fuente**. `SystemRole` es sinónimo legado, no un VO distinto.

---

### 8.2 VO-ENM-01 — `TipoEntrega`

**Definición de negocio:** naturaleza física o digital de la entrega de un producto y de sus líneas de pedido.

**Propósito:** distinguir los productos que requieren inventario y logística de los que se entregan digitalmente tras el pago.

**Valores:**

| Código | Significado | Consecuencias |
|---|---|---|
| `FISICA` | Entrega mediante inventario, empaque, despacho y transporte. | Requiere stock, bodega, dirección y envío. |
| `DIGITAL` | Entrega mediante descarga o mecanismo digital autorizado. | No requiere stock físico, bodega, empaque ni envío físico; requiere recurso de entrega. |

**Identidad conceptual y ausencia de identidad propia:** es un valor de catálogo; igualdad por código.

**Criterios de igualdad:** igualdad por código.

**Invariantes:**

- `INV-VO-TENT-01`: el valor pertenece al catálogo.
- `INV-VO-TENT-02`: es coherente con el subtipo de producto.
- `INV-VO-TENT-03`: un pedido con líneas físicas requiere dirección y cumplimiento logístico.
- `INV-VO-TENT-04`: un pedido digital no crea envío físico.

**Reglas de validación:**

- Rechazar valores fuera del catálogo.
- Verificar coherencia con `ProductoFisico` o `ProductoDigital`.
- No deducir el tipo de entrega solo de la categoría `DIGITAL`.

**Condiciones de creación válida:** asignación a un producto o snapshot de línea desde el catálogo, con coherencia validada.

**Condiciones de rechazo:** código desconocido; producto físico marcado como digital o viceversa; categoría `DIGITAL` usada como prueba suficiente de entrega digital.

**Operaciones conceptuales permitidas:** comparar e interpretar.

**Resultados:** la comparación produce un booleano; la interpretación habilita o excluye flujos logísticos.

**Inmutabilidad esperada:** el valor es inmutable; el tipo congelado en `ItemPedido` no cambia.

**Relaciones:** `Producto.tipoEntrega`, `ItemPedido.tipoEntrega`; `DS-04`, `DS-06`.

**Restricciones de dependencia:** no depende de un proveedor logístico ni de un formato de entrega concreto.

**Ejemplos:**

| Caso | Ejemplo | Resultado |
|---|---|---|
| Válido | Producto físico con `FISICA`. | Aceptado. |
| Válido | Producto digital con `DIGITAL`. | Aceptado. |
| Inválido | Producto físico con `DIGITAL`. | Rechazado por incoherencia. |

**Trazabilidad:** `[MOD]` §7.1–§7.4, §10.2, §16, LOG-01; `[ENU]` Dominio 5.

**Estado:** **Confirmado por fuente**. `MetodoEntrega` (`ENVIO_FISICO`/`DESCARGA_DIGITAL`) es sinónimo legado; el nombre canónico es `TipoEntrega`.

---

### 8.3 VO-ENM-02 — `TipoBodega`

**Definición de negocio:** clasificación de una bodega según su propiedad y administración.

**Propósito:** distinguir las bodegas de la operación central de las bodegas privadas de un vendedor.

**Valores:**

| Código | Significado | Regla |
|---|---|---|
| `MARKETPLACE` | Bodega administrada por la operación central. | Su administración corresponde al Administrador. |
| `VENDEDOR` | Bodega propiedad de un vendedor. | Debe tener exactamente un `vendedorId` propietario. |

**Identidad conceptual y ausencia de identidad propia:** es un valor de catálogo; igualdad por código.

**Criterios de igualdad:** igualdad por código.

**Invariantes:**

- `INV-VO-TBOD-01`: el valor pertenece al catálogo.
- `INV-VO-TBOD-02`: `VENDEDOR` exige un vendedor propietario.
- `INV-VO-TBOD-03`: `MARKETPLACE` no se asigna a un vendedor como propietario.

**Reglas de validación:**

- Rechazar valores fuera del catálogo.
- Verificar la presencia o ausencia de propietario según el tipo.
- No cambiar el tipo de una bodega sin un proceso explícito; `[MOD]` no define ese cambio.

**Condiciones de creación válida:** asignación al crear la bodega, con propietario coherente.

**Condiciones de rechazo:** código desconocido; bodega `VENDEDOR` sin vendedor; bodega `MARKETPLACE` con propietario vendedor.

**Operaciones conceptuales permitidas:** comparar e interpretar.

**Resultados:** la comparación produce un booleano; la interpretación determina quién administra la bodega.

**Inmutabilidad esperada:** el valor es inmutable; un cambio de tipo requeriría un proceso no definido.

**Relaciones:** `Bodega.tipo`; `DS-01`, `DS-04`.

**Restricciones de dependencia:** ninguna adicional.

**Ejemplos:**

| Caso | Ejemplo | Resultado |
|---|---|---|
| Válido | Bodega `MARKETPLACE` administrada por el Administrador. | Aceptado. |
| Válido | Bodega `VENDEDOR` con `vendedorId`. | Aceptado. |
| Inválido | Bodega `VENDEDOR` sin propietario. | Rechazado. |

**Trazabilidad:** `[MOD]` §8.1, §16; `[ENU]` Dominio 4.

**Estado:** **Confirmado por fuente**.

---

### 8.4 VO-ENM-03 — `CategoriaProducto`

**Definición de negocio:** clasificación comercial del producto dentro del catálogo controlado.

**Propósito:** agrupar productos para consulta, publicación y reportes, sin sustituir el tipo de entrega.

**Valores iniciales:**

| Código | Alcance |
|---|---|
| `ELECTRONICA` | Electrónica y accesorios tecnológicos. |
| `ROPA` | Prendas, calzado y artículos de moda. |
| `HOGAR` | Artículos domésticos, muebles y utensilios. |
| `DIGITAL` | Software, licencias y contenido digital. |

**Identidad conceptual y ausencia de identidad propia:** es un valor de catálogo; igualdad por código.

**Criterios de igualdad:** igualdad por código.

**Invariantes:**

- `INV-VO-CAT-01`: el código pertenece al catálogo.
- `INV-VO-CAT-02`: la ampliación del catálogo es un cambio controlado y versionado.
- `INV-VO-CAT-03`: `DIGITAL` no obliga por sí sola a que el producto sea de tipo digital; la coherencia se valida en la política del catálogo.

**Reglas de validación:**

- Rechazar códigos fuera del catálogo.
- No crear categorías arbitrarias desde un producto.
- No traducir los códigos.

**Condiciones de creación válida:** asignación de un código válido al producto.

**Condiciones de rechazo:** código desconocido; categoría inventada; uso de la categoría como sustituto del tipo de entrega.

**Operaciones conceptuales permitidas:** comparar e interpretar.

**Resultados:** la comparación produce un booleano; la interpretación agrupa el producto.

**Inmutabilidad esperada:** el valor es inmutable; el catálogo puede ampliarse mediante un cambio controlado.

**Relaciones:** `Producto.categoria`; `DS-02`.

**Restricciones de dependencia:** no depende de una taxonomía externa.

**Ejemplos:**

| Caso | Ejemplo | Resultado |
|---|---|---|
| Válido | Producto de ropa con `ROPA`. | Aceptado. |
| Válido | Producto digital con `DIGITAL`. | Aceptado. |
| Inválido | Categoría `"JUGUETES"` no registrada. | Rechazado hasta ampliar el catálogo. |

**Trazabilidad:** `[MOD]` §7.5, §16; `[ENU]` Dominio 5.

**Estado:** **Confirmado por fuente**; el catálogo es ampliable por cambio controlado.

---

### 8.5 VO-ENM-04 — `EstadoUsuario`

**Definición de negocio:** condición operativa de acceso de una cuenta.

**Propósito:** impedir que cuentas inactivas o bloqueadas ejecuten operaciones protegidas.

**Valores:**

| Código | Significado |
|---|---|
| `ACTIVO` | La cuenta puede autenticarse y ejecutar operaciones permitidas. |
| `INACTIVO` | La cuenta está deshabilitada temporalmente. |
| `BLOQUEADO` | La cuenta está bloqueada por seguridad o administración. |

**Identidad conceptual y ausencia de identidad propia:** es un valor de catálogo; igualdad por código.

**Criterios de igualdad:** igualdad por código.

**Invariantes:**

- `INV-VO-EUSR-01`: el valor pertenece al catálogo.
- `INV-VO-EUSR-02`: una cuenta `INACTIVA` o `BLOQUEADA` no inicia nuevas sesiones ni ejecuta operaciones protegidas.
- `INV-VO-EUSR-03`: las transiciones solo son válidas según la tabla del modelo.
- `INV-VO-EUSR-04`: no existe un estado de eliminación lógica en este catálogo.

**Transiciones confirmadas:**

| Actual | Evento | Resultante | Actor/condición |
|---|---|---|---|
| `ACTIVO` | Desactivar | `INACTIVO` | Administrador; motivo registrado. |
| `ACTIVO` | Bloquear | `BLOQUEADO` | Administrador o política de seguridad; motivo y evidencia. |
| `INACTIVO` | Reactivar | `ACTIVO` | Administrador; sin bloqueo vigente. |
| `BLOQUEADO` | Desbloquear | `ACTIVO` | Administrador; resolución explícita. |
| `INACTIVO` | Bloquear | `BLOQUEADO` | Administrador; motivo y trazabilidad. |
| `BLOQUEADO` | Desactivar | No permitido | Resolver primero el bloqueo. |

**Reglas de validación:**

- Rechazar códigos fuera del catálogo.
- Rechazar transiciones no listadas.
- Exigir motivo en desactivación y bloqueo.
- El estado inicial de una cuenta nueva no está fijado explícitamente en `[MOD]`; la política de registro debe decidirlo. **Limitación por fuente.**

**Condiciones de creación válida:** asignación de un estado válido al crear la cuenta o mediante una transición autorizada.

**Condiciones de rechazo:** código desconocido; transición inválida; operación sin autorización o sin motivo cuando se exige.

**Operaciones conceptuales permitidas:** comparar, interpretar y aplicar transiciones autorizadas.

**Resultados:** la transición produce un nuevo estado y un registro de auditoría; la comparación produce un booleano.

**Inmutabilidad esperada:** el valor es inmutable; el estado de la cuenta cambia por transición, no por mutación del VO.

**Relaciones:** `Usuario.estado`; `DS-01`; `DS-09`.

**Restricciones de dependencia:** no depende del mecanismo de autenticación.

**Ejemplos:**

| Caso | Ejemplo | Resultado |
|---|---|---|
| Válido | `ACTIVO` → desactivar → `INACTIVO`. | Aceptado. |
| Inválido | `BLOQUEADO` → desactivar → `INACTIVO`. | Rechazado. |
| Inválido | Cuenta `BLOQUEADA` crea un pedido. | Rechazado por `DS-01`. |

**Trazabilidad:** `[MOD]` §6.1, §16, USR-04, DM-30; `[ENU]` Dominio 1.

**Estado:** **Confirmado por fuente**; estado inicial **limitado por fuente**.

---

### 8.6 VO-ENM-05 — `EstadoComercial`

**Definición de negocio:** condición del comprador para realizar nuevas compras.

**Propósito:** permitir restringir nuevas operaciones comerciales sin borrar el historial ni impedir la consulta de operaciones propias.

**Valores:**

| Código | Significado |
|---|---|
| `HABILITADO` | Puede realizar pedidos y continuar el proceso comercial. |
| `RESTRINGIDO` | No puede realizar nuevos pedidos. |

**Identidad conceptual y ausencia de identidad propia:** es un valor de catálogo; igualdad por código.

**Criterios de igualdad:** igualdad por código.

**Invariantes:**

- `INV-VO-ECOM-01`: el valor pertenece al catálogo.
- `INV-VO-ECOM-02`: `RESTRINGIDO` impide crear nuevos pedidos.
- `INV-VO-ECOM-03`: `RESTRINGIDO` no borra pedidos anteriores ni impide consultar operaciones propias, salvo restricción legal o de seguridad.
- `INV-VO-ECOM-04`: el estado es obligatorio en `PerfilComprador`.

**Reglas de validación:**

- Rechazar códigos fuera del catálogo.
- No confundir `EstadoComercial` con `EstadoUsuario`: una cuenta activa puede tener un comprador restringido.
- El proceso y actor que cambian el estado no están especificados en las fuentes; **limitación por fuente** (`DEC-BIZ-06`).

**Condiciones de creación válida:** asignación de un estado válido al crear el perfil o mediante el proceso administrativo que se defina.

**Condiciones de rechazo:** código desconocido; asignación sin autorización cuando el proceso se defina.

**Operaciones conceptuales permitidas:** comparar e interpretar.

**Resultados:** la comparación produce un booleano; la interpretación habilita o bloquea la creación de pedidos.

**Inmutabilidad esperada:** el valor es inmutable; el perfil cambia de estado por una operación autorizada.

**Relaciones:** `PerfilComprador.estadoComercial`; `DS-01`.

**Restricciones de dependencia:** no depende de un sistema de scoring ni de un proveedor externo.

**Ejemplos:**

| Caso | Ejemplo | Resultado |
|---|---|---|
| Válido | Comprador `HABILITADO` crea un pedido. | Aceptado si cumple las demás reglas. |
| Inválido | Comprador `RESTRINGIDO` crea un pedido. | Rechazado. |
| Válido | Comprador `RESTRINGIDO` consulta un pedido anterior. | Aceptado, salvo restricción legal o de seguridad. |

**Trazabilidad:** `[MOD]` §6.3, §16; `[ENU]` Dominio 2; histórico O-17.

**Estado:** **Confirmado por fuente** en valores y efecto; **limitado por fuente** en el proceso de cambio.

---

### 8.7 VO-ENM-06 — `EstadoVendedor`

**Definición de negocio:** etapa administrativa y operativa del vendedor dentro del marketplace.

**Propósito:** determinar si el vendedor puede publicar productos y sostener nuevas ventas.

**Valores:**

| Código | Significado |
|---|---|
| `EN_REVISION` | Vendedor incorporado, pendiente de revisión o activación. |
| `ACTIVO` | Vendedor habilitado para operar. |
| `SUSPENDIDO` | Vendedor temporalmente impedido de publicar e iniciar ventas nuevas. |
| `INACTIVO` | Vendedor deshabilitado. |

**Identidad conceptual y ausencia de identidad propia:** es un valor de catálogo; igualdad por código.

**Criterios de igualdad:** igualdad por código.

**Invariantes:**

- `INV-VO-EVEND-01`: el valor pertenece al catálogo.
- `INV-VO-EVEND-02`: un vendedor suspendido no publica nuevos productos ni inicia nuevas ventas.
- `INV-VO-EVEND-03`: las obligaciones existentes se resuelven, no se eliminan.
- `INV-VO-EVEND-04`: la incorporación se considera completa solo si el perfil y la primera bodega quedan creados consistentemente.
- `INV-VO-EVEND-05`: el vendedor no puede autorregistrarse.

**Reglas de validación:**

- Rechazar códigos fuera del catálogo.
- No permitir publicación si el estado no es `ACTIVO`.
- Las transiciones completas no están especificadas en `[MOD]`; **limitación por fuente**. Solo están confirmadas las consecuencias de `SUSPENDIDO` y la incorporación administrativa.

**Condiciones de creación válida:** incorporación por un Administrador, con perfil y primera bodega; estado inicial según la política de incorporación, no fijado explícitamente.

**Condiciones de rechazo:** código desconocido; autorregistro; incorporación sin bodega inicial; publicación en estado no activo.

**Operaciones conceptuales permitidas:** comparar, interpretar y aplicar transiciones autorizadas cuando se definan.

**Resultados:** la comparación produce un booleano; la transición produce un nuevo estado y auditoría.

**Inmutabilidad esperada:** el valor es inmutable; el perfil cambia de estado por operación administrativa.

**Relaciones:** `PerfilVendedor.estado`; `DS-01`, `DS-02`.

**Restricciones de dependencia:** no depende de un portal de vendedores ni de un proveedor externo.

**Ejemplos:**

| Caso | Ejemplo | Resultado |
|---|---|---|
| Válido | Vendedor `ACTIVO` publica un producto. | Aceptado si cumple catálogo. |
| Inválido | Vendedor `SUSPENDIDO` publica un producto. | Rechazado. |
| Inválido | Vendedor intenta autorregistrarse. | Rechazado; solo el Administrador lo incorpora. |

**Trazabilidad:** `[MOD]` §6.4, §16, SEL-01, SEL-02; `[ENU]` Dominio 3.

**Estado:** **Confirmado por fuente** en valores y reglas explícitas; **limitado por fuente** en transiciones completas y estado inicial.

---

### 8.8 VO-ENM-07 — `EstadoProducto`

**Definición de negocio:** estado de publicación comercial del producto.

**Propósito:** controlar si el producto se ofrece en el catálogo público y si admite nuevas ventas.

**Valores:**

| Código | Significado |
|---|---|
| `PUBLICADO` | Producto visible y disponible para nuevas compras, sujeto a stock y reglas. |
| `SUSPENDIDO` | Producto oculto para nuevas compras; se conserva para pedidos históricos. |
| `DESCONTINUADO` | Producto retirado definitivamente de nuevas ventas; no vuelve a publicarse. |

**Identidad conceptual y ausencia de identidad propia:** es un valor de catálogo; igualdad por código.

**Criterios de igualdad:** igualdad por código.

**Invariantes:**

- `INV-VO-EPROD-01`: el valor pertenece al catálogo.
- `INV-VO-EPROD-02`: `SUSPENDIDO` no se ofrece para nuevas compras.
- `INV-VO-EPROD-03`: `DESCONTINUADO` no admite nuevas ventas ni retorno a `PUBLICADO`.
- `INV-VO-EPROD-04`: un producto publicado tiene al menos una variante válida.
- `INV-VO-EPROD-05`: modificar el catálogo no altera los snapshots de pedidos confirmados.

**Transiciones confirmadas:**

| Actual | Evento | Resultante | Condición |
|---|---|---|---|
| Borrador/no publicado | Publicar | `PUBLICADO` | Datos, variantes, vendedor y precio válidos. |
| `PUBLICADO` | Suspender | `SUSPENDIDO` | Oculta la oferta; no cancela pedidos existentes. |
| `SUSPENDIDO` | Reanudar | `PUBLICADO` | Revalidar condiciones de publicación. |
| `PUBLICADO` | Descontinuar | `DESCONTINUADO` | Cierre definitivo. |
| `SUSPENDIDO` | Descontinuar | `DESCONTINUADO` | Cierre definitivo. |
| `DESCONTINUADO` | Publicar/Reanudar | No permitido | Crear un producto nuevo. |

**Reglas de validación:**

- Rechazar códigos fuera del catálogo.
- Rechazar transiciones no listadas.
- No tratar "borrador" como estado comercial público; es una fase de creación.
- Verificar autorización del vendedor propietario o Administrador.

**Condiciones de creación válida:** producto creado en fase no publicada; publicación solo tras validación.

**Condiciones de rechazo:** código desconocido; publicación sin variantes; transición desde `DESCONTINUADO`; cambio por actor no autorizado.

**Operaciones conceptuales permitidas:** comparar, interpretar y aplicar transiciones autorizadas.

**Resultados:** la transición produce un nuevo estado y auditoría; la comparación produce un booleano.

**Inmutabilidad esperada:** el valor es inmutable; el producto cambia de estado por comportamiento del agregado.

**Relaciones:** `Producto.estado`; `DS-02`.

**Restricciones de dependencia:** no depende de la vitrina ni del motor de búsqueda.

**Ejemplos:**

| Caso | Ejemplo | Resultado |
|---|---|---|
| Válido | Producto con variantes válidas pasa a `PUBLICADO`. | Aceptado. |
| Inválido | Producto sin variantes se publica. | Rechazado. |
| Inválido | Producto `DESCONTINUADO` vuelve a `PUBLICADO`. | Rechazado. |

**Trazabilidad:** `[MOD]` §7.1, §16, CAT-01…CAT-07; `[ENU]` Dominio 5.

**Estado:** **Confirmado por fuente**.

---

### 8.9 VO-ENM-08 — `EstadoVariante`

**Definición de negocio:** disponibilidad comercial de una variante vendible.

**Propósito:** impedir la venta de presentaciones inactivas aunque el producto esté publicado.

**Valores:**

| Código | Significado |
|---|---|
| `ACTIVA` | La variante puede venderse si se cumplen las demás condiciones. |
| `INACTIVA` | La variante no puede venderse. |

**Identidad conceptual y ausencia de identidad propia:** es un valor de catálogo; igualdad por código.

**Criterios de igualdad:** igualdad por código.

**Invariantes:**

- `INV-VO-EVAR-01`: el valor pertenece al catálogo.
- `INV-VO-EVAR-02`: una variante inactiva no se vende.
- `INV-VO-EVAR-03`: la variante debe pertenecer a un producto existente.

**Reglas de validación:**

- Rechazar códigos fuera del catálogo.
- No vender una variante inactiva aunque el producto esté `PUBLICADO`.
- Las transiciones completas no están especificadas en `[MOD]`; **limitación por fuente**.

**Condiciones de creación válida:** asignación de un estado válido al crear la variante.

**Condiciones de rechazo:** código desconocido; venta de variante inactiva.

**Operaciones conceptuales permitidas:** comparar e interpretar.

**Resultados:** la comparación produce un booleano; la interpretación habilita o bloquea la venta.

**Inmutabilidad esperada:** el valor es inmutable; la variante cambia de estado por comportamiento del agregado.

**Relaciones:** `Variante.estado`; `DS-02`, checkout.

**Restricciones de dependencia:** ninguna adicional.

**Ejemplos:**

| Caso | Ejemplo | Resultado |
|---|---|---|
| Válido | Variante `ACTIVA` de producto `PUBLICADO` con stock. | Vendible. |
| Inválido | Variante `INACTIVA`. | No vendible. |

**Trazabilidad:** `[MOD]` §7.4, §16; `[ENU]` Dominio 5.

**Estado:** **Confirmado por fuente** en valores y efecto; **limitado por fuente** en transiciones.

---

### 8.10 VO-ENM-09 — `EstadoBodega`

**Definición de negocio:** condición operativa de una bodega para recibir y comprometer existencias.

**Propósito:** impedir nuevas entradas y reservas en bodegas inactivas y obligar a resolver el stock existente antes del cierre definitivo.

**Valores:**

| Código | Significado |
|---|---|
| `ACTIVA` | La bodega acepta ingresos y reservas sujetas a las demás reglas. |
| `INACTIVA` | La bodega no acepta nuevos ingresos ni reservas. |

**Identidad conceptual y ausencia de identidad propia:** es un valor de catálogo; igualdad por código.

**Criterios de igualdad:** igualdad por código.

**Invariantes:**

- `INV-VO-EBOD-01`: el valor pertenece al catálogo.
- `INV-VO-EBOD-02`: una bodega inactiva no acepta nuevos ingresos ni reservas.
- `INV-VO-EBOD-03`: el stock existente debe trasladarse, liquidarse o ajustarse mediante movimientos trazables antes del cierre definitivo.
- `INV-VO-EBOD-04`: una bodega inactiva con stock no puede ignorarse; el cierre requiere resolver existencias.

**Reglas de validación:**

- Rechazar códigos fuera del catálogo.
- No reservar en bodega inactiva.
- Las transiciones completas no están especificadas en `[MOD]`; **limitación por fuente**.

**Condiciones de creación válida:** asignación de un estado válido al crear la bodega.

**Condiciones de rechazo:** código desconocido; reserva o ingreso en bodega inactiva.

**Operaciones conceptuales permitidas:** comparar e interpretar.

**Resultados:** la comparación produce un booleano; la interpretación habilita o bloquea operaciones.

**Inmutabilidad esperada:** el valor es inmutable; la bodega cambia de estado por operación autorizada.

**Relaciones:** `Bodega.estado`; `DS-03`, `DS-04`.

**Restricciones de dependencia:** ninguna adicional.

**Ejemplos:**

| Caso | Ejemplo | Resultado |
|---|---|---|
| Válido | Reserva en bodega `ACTIVA` con stock. | Aceptada si hay disponibilidad. |
| Inválido | Reserva en bodega `INACTIVA`. | Rechazada. |
| Inválido | Cerrar bodega con stock sin resolverlo. | Rechazado por invariante. |

**Trazabilidad:** `[MOD]` §8.1, §16, DM-29; `[ENU]` Dominio 6.

**Estado:** **Confirmado por fuente** en valores y efecto; **limitado por fuente** en transiciones.

---

### 8.11 VO-ENM-10 — `EstadoPedido`

**Definición de negocio:** estado del ciclo comercial del pedido, desde la espera de pago hasta el cierre operativo.

**Propósito:** gobernar las transiciones válidas del pedido y separar pago, preparación, despacho, entrega y cierre.

**Valores:**

| Código | Significado |
|---|---|
| `PENDIENTE_DE_PAGO` | Pedido creado, esperando confirmación financiera. |
| `PAGADO` | Pago confirmado; puede iniciar preparación. |
| `EN_PREPARACION` | Pedido en alistamiento. |
| `DESPACHADO` | Salida física registrada. |
| `ENTREGADO` | Entrega física o digital confirmada. |
| `CANCELADO` | Pedido anulado antes de la confirmación de pago o por fallo de pago. |
| `CERRADO` | Cumplimiento completo y cierre operativo. |

**Identidad conceptual y ausencia de identidad propia:** es un valor de catálogo; igualdad por código.

**Criterios de igualdad:** igualdad por código.

**Invariantes:**

- `INV-VO-EPED-01`: el valor pertenece al catálogo.
- `INV-VO-EPED-02`: solo son válidas las transiciones de la tabla del modelo.
- `INV-VO-EPED-03`: `CARRITO` no es un estado del pedido.
- `INV-VO-EPED-04`: `ENTREGADO` y `CERRADO` son estados distintos.
- `INV-VO-EPED-05`: un pedido `ENTREGADO` o `CERRADO` no se modifica retroactivamente.
- `INV-VO-EPED-06`: el estado global `ENTREGADO` exige que todos los envíos requeridos estén entregados.
- `INV-VO-EPED-07`: `FINALIZADO` es un sinónimo legado de `CERRADO`; no es un código canónico.

**Transiciones confirmadas:**

| Actual | Evento | Resultante | Condición |
|---|---|---|---|
| — | Crear pedido | `PENDIENTE_DE_PAGO` | Checkout válido y reservas físicas activas cuando apliquen. |
| `PENDIENTE_DE_PAGO` | Pago confirmado | `PAGADO` | Confirmación válida e idempotente. |
| `PENDIENTE_DE_PAGO` | Pago rechazado/expirado | `CANCELADO` | Liberar reserva y conservar motivo. |
| `PENDIENTE_DE_PAGO` | Cancelación autorizada | `CANCELADO` | Antes de confirmar pago; liberar reserva. |
| `PAGADO` | Iniciar preparación | `EN_PREPARACION` | Pago confirmado y reservas vigentes; digital puede saltar a entrega. |
| `EN_PREPARACION` | Despachar | `DESPACHADO` | Productos físicos empacados y salida de inventario registrada. |
| `DESPACHADO` | Confirmar entrega | `ENTREGADO` | Evidencia de entrega válida para todos los envíos requeridos. |
| `PAGADO` | Entrega digital confirmada | `ENTREGADO` | Pago confirmado y evidencia de entrega digital. |
| `ENTREGADO` | Cerrar operación | `CERRADO` | Cumplimiento completo; sin tareas operativas pendientes. |
| `CERRADO` | Modificar líneas/total/estado | No permitido | Solo posventa separada. |
| `CANCELADO` | Reanudar | No permitido | Crear un pedido nuevo. |

**Reglas de validación:**

- Rechazar códigos fuera del catálogo.
- Rechazar transiciones no listadas.
- No marcar `PAGADO` por la sola solicitud de pago.
- No iniciar preparación antes del pago.
- No marcar `ENTREGADO` sin evidencia de todos los envíos requeridos.
- No modificar un pedido `ENTREGADO` o `CERRADO`.

**Condiciones de creación válida:** creación en `PENDIENTE_DE_PAGO` desde un checkout válido.

**Condiciones de rechazo:** código desconocido; transición inválida; pago no confirmado; entrega incompleta; modificación de pedido cerrado.

**Operaciones conceptuales permitidas:** comparar, interpretar y aplicar transiciones autorizadas.

**Resultados:** la transición produce un nuevo estado, un registro de auditoría y, cuando corresponde, efectos en inventario o pago coordinados por casos de uso.

**Inmutabilidad esperada:** el valor es inmutable; el pedido cambia de estado por comportamiento del agregado.

**Relaciones:** `Pedido.estado`; `DS-06`, `DS-03`, `DS-08`.

**Restricciones de dependencia:** no depende del estado de pago ni del estado de envío como sustitutos; cada ciclo es separado.

**Ejemplos:**

| Caso | Ejemplo | Resultado |
|---|---|---|
| Válido | `PENDIENTE_DE_PAGO` → pago confirmado → `PAGADO`. | Aceptado. |
| Inválido | `PENDIENTE_DE_PAGO` → despachar. | Rechazado. |
| Inválido | Pedido con dos envíos, uno en tránsito, se marca `ENTREGADO`. | Rechazado. |
| Inválido | Modificar un pedido `CERRADO`. | Rechazado. |

**Trazabilidad:** `[MOD]` §10.3, §16, ORD-01…ORD-08; `[ENU]` Dominio 7.

**Estado:** **Confirmado por fuente**.

---

### 8.12 VO-ENM-11 — `EstadoPago`

**Definición de negocio:** estado financiero de un intento u operación de pago asociada a un pedido.

**Propósito:** representar el resultado financiero sin confundirlo con el estado logístico del pedido.

**Valores:**

| Código | Significado |
|---|---|
| `PENDIENTE` | Pago iniciado o esperado, aún no finalizado. |
| `AUTORIZADO` | Fondos autorizados, pendientes de captura. |
| `CAPTURADO` | Fondos capturados de forma verificable. |
| `RECHAZADO` | El proveedor rechazó el pago. |
| `CANCELADO` | El intento fue cancelado. |
| `REEMBOLSO_PARCIAL` | Se ha reembolsado una parte del importe capturado. |
| `REEMBOLSADO` | Se ha reembolsado el importe capturado. |

**Identidad conceptual y ausencia de identidad propia:** es un valor de catálogo; igualdad por código.

**Criterios de igualdad:** igualdad por código.

**Invariantes:**

- `INV-VO-EPAG-01`: el valor pertenece al catálogo.
- `INV-VO-EPAG-02`: no se marca `CAPTURADO` sin confirmación autenticada o conciliación autorizada.
- `INV-VO-EPAG-03`: una operación no se captura dos veces por reintentos.
- `INV-VO-EPAG-04`: un pago rechazado puede originar otro intento; el historial no se sobrescribe.
- `INV-VO-EPAG-05`: el total capturado y los reembolsos acumulados no exceden el importe capturado.
- `INV-VO-EPAG-06`: un pago confirmado activa la transición del pedido solo una vez.
- `INV-VO-EPAG-07`: `APROBADO` es un sinónimo legado; el código canónico es `CAPTURADO`.

**Reglas de validación:**

- Rechazar códigos fuera del catálogo.
- No declarar éxito sin confirmación verificable.
- No sobrescribir un pago rechazado para convertirlo en exitoso.
- No permitir que un reembolso exceda el saldo capturado.

**Condiciones de creación válida:** creación en `PENDIENTE` al iniciar la operación; transición a `AUTORIZADO` o `CAPTURADO` solo con resultado del proveedor o conciliación autorizada.

**Condiciones de rechazo:** código desconocido; captura sin confirmación; doble captura; reembolso por encima del saldo.

**Operaciones conceptuales permitidas:** comparar, interpretar y aplicar transiciones autorizadas.

**Resultados:** la transición produce un nuevo estado y auditoría; los reembolsos actualizan el estado a `REEMBOLSO_PARCIAL` o `REEMBOLSADO` cuando corresponda.

**Inmutabilidad esperada:** el valor es inmutable; el pago cambia de estado por comportamiento del agregado y confirmación externa.

**Relaciones:** `Pago.estado`; `Pedido.estadoPago` (proyección); `DS-06`, `DS-08`.

**Restricciones de dependencia:** no depende del protocolo del proveedor; el dominio define el resultado comercial.

**Ejemplos:**

| Caso | Ejemplo | Resultado |
|---|---|---|
| Válido | Pago `PENDIENTE` → confirmación → `CAPTURADO`. | Aceptado. |
| Inválido | Marcar `CAPTURADO` sin confirmación. | Rechazado. |
| Inválido | Reembolsar más que el importe capturado. | Rechazado. |

**Trazabilidad:** `[MOD]` §11.1, §16, PAY-01…PAY-07; `[ENU]` Dominio 7.

**Estado:** **Confirmado por fuente**.

---

### 8.13 VO-ENM-12 — `EstadoFactura`

**Definición de negocio:** estado documental de una factura asociada a un pedido.

**Propósito:** preservar la inmutabilidad del documento emitido y representar anulaciones o correcciones mediante documentos relacionados.

**Valores:**

| Código | Significado |
|---|---|
| `BORRADOR` | Factura en preparación, aún no emitida. |
| `EMITIDA` | Documento emitido y válido. |
| `ANULADA` | Documento anulado según política. |
| `CORREGIDA` | Documento corregido mediante un documento relacionado. |

**Identidad conceptual y ausencia de identidad propia:** es un valor de catálogo; igualdad por código.

**Criterios de igualdad:** igualdad por código.

**Invariantes:**

- `INV-VO-EFAC-01`: el valor pertenece al catálogo.
- `INV-VO-EFAC-02`: una factura `EMITIDA` no se edita silenciosamente.
- `INV-VO-EFAC-03`: `CORREGIDA` debe enlazar el documento original.
- `INV-VO-EFAC-04`: la emisión se habilita cuando el pago está confirmado, salvo política fiscal distinta.
- `INV-VO-EFAC-05`: la numeración es única dentro de la serie fiscal aplicable.

**Reglas de validación:**

- Rechazar códigos fuera del catálogo.
- No modificar una factura emitida.
- No marcar `CORREGIDA` sin documento relacionado.
- No inventar requisitos fiscales sin configurar jurisdicción, impuestos y numeración.

**Condiciones de creación válida:** creación en `BORRADOR`; emisión con pago confirmado y datos fiscales válidos.

**Condiciones de rechazo:** código desconocido; emisión sin condiciones; corrección sin vínculo; anulación no autorizada.

**Operaciones conceptuales permitidas:** comparar, interpretar y aplicar transiciones autorizadas.

**Resultados:** la transición produce un nuevo estado y auditoría; la corrección produce un documento relacionado.

**Inmutabilidad esperada:** el valor es inmutable; el documento emitido no se reescribe.

**Relaciones:** `Factura.estado`; `DS-06` (habilitación de emisión cuando corresponda).

**Restricciones de dependencia:** no depende de un proveedor de facturación electrónica.

**Ejemplos:**

| Caso | Ejemplo | Resultado |
|---|---|---|
| Válido | Factura `BORRADOR` → `EMITIDA` con pago confirmado. | Aceptado. |
| Inválido | Editar una factura `EMITIDA`. | Rechazado. |
| Inválido | Marcar `CORREGIDA` sin documento relacionado. | Rechazado. |

**Trazabilidad:** `[MOD]` §12.1, §16, BILL-01; `[ENU]` Dominio 9.

**Estado:** **Confirmado por fuente**.

---

### 8.14 VO-ENM-13 — `EstadoEnvio`

**Definición de negocio:** estado logístico de un envío de productos físicos.

**Propósito:** representar la preparación, el despacho, el tránsito y la entrega de un envío, separándolo del estado comercial del pedido.

**Valores:**

| Código | Significado |
|---|---|
| `PREPARACION` | Envío en alistamiento. |
| `EMPACADO` | Unidades empacadas. |
| `DESPACHADO` | Salida física registrada. |
| `EN_TRANSITO` | Envío en poder del transportista. |
| `ENTREGADO` | Entrega confirmada con evidencia. |
| `FALLIDO` | Intento de entrega fallido. |
| `DEVUELTO` | Envío devuelto al origen. |

**Identidad conceptual y ausencia de identidad propia:** es un valor de catálogo; igualdad por código.

**Criterios de igualdad:** igualdad por código.

**Invariantes:**

- `INV-VO-EENV-01`: el valor pertenece al catálogo.
- `INV-VO-EENV-02`: solo pedidos pagados pueden prepararse o despacharse.
- `INV-VO-EENV-03`: la salida física de inventario se registra al despachar.
- `INV-VO-EENV-04`: no se marca `ENTREGADO` sin evidencia o confirmación válida.
- `INV-VO-EENV-05`: una entrega fallida no equivale a una devolución aceptada.
- `INV-VO-EENV-06`: un envío pertenece a un único pedido y a una bodega de origen.

**Reglas de validación:**

- Rechazar códigos fuera del catálogo.
- No preparar/despachar pedidos no pagados.
- No marcar entrega sin evidencia.
- Las transiciones completas no están especificadas en `[MOD]`; **limitación por fuente**.

**Condiciones de creación válida:** creación de un envío para un pedido pagado con líneas físicas y bodega compatible.

**Condiciones de rechazo:** código desconocido; pedido no pagado; envío sin bodega o sin dirección; entrega sin evidencia.

**Operaciones conceptuales permitidas:** comparar, interpretar y aplicar transiciones autorizadas.

**Resultados:** la transición produce un nuevo estado, eventos de seguimiento y, al despachar, el consumo de reserva y la salida de inventario.

**Inmutabilidad esperada:** el valor es inmutable; el envío cambia de estado por comportamiento del agregado.

**Relaciones:** `Envio.estado`; `DS-03`, `DS-06`; `Pedido`.

**Restricciones de dependencia:** no depende del transportista concreto.

**Ejemplos:**

| Caso | Ejemplo | Resultado |
|---|---|---|
| Válido | Pedido pagado → envío `PREPARACION` → `EMPACADO` → `DESPACHADO`. | Aceptado. |
| Inválido | Preparar un envío de pedido no pagado. | Rechazado. |
| Inválido | Marcar `ENTREGADO` sin evidencia. | Rechazado. |
| Inválido | Tratar `FALLIDO` como devolución aceptada. | Rechazado. |

**Trazabilidad:** `[MOD]` §13.1, §16, LOG-01/LOG-02; `[ENU]` Dominio 10.

**Estado:** **Confirmado por fuente** en valores y reglas; **limitado por fuente** en transiciones completas.

---

### 8.15 VO-ENM-14 — `EstadoDevolucion`

**Definición de negocio:** estado del proceso de devolución de un pedido entregado o de una entrega digital completada.

**Propósito:** gobernar la solicitud, revisión, aprobación, recepción y resolución de una devolución sin reescribir el pedido original.

**Valores:**

| Código | Significado |
|---|---|
| `SOLICITADA` | El comprador creó la solicitud. |
| `EN_REVISION` | La solicitud fue asignada a revisión. |
| `APROBADA` | La devolución fue aprobada por un actor autorizado. |
| `RECHAZADA` | La devolución fue rechazada con motivo. |
| `EN_TRANSITO` | Producto físico en tránsito de retorno. |
| `RECIBIDA` | Producto físico recibido para inspección. |
| `RESUELTA` | Proceso finalizado. |

**Identidad conceptual y ausencia de identidad propia:** es un valor de catálogo; igualdad por código.

**Criterios de igualdad:** igualdad por código.

**Invariantes:**

- `INV-VO-EDEV-01`: el valor pertenece al catálogo.
- `INV-VO-EDEV-02`: solo el comprador propietario solicita la devolución.
- `INV-VO-EDEV-03`: las cantidades devueltas no exceden las entregadas ni las ya solicitadas/aprobadas.
- `INV-VO-EDEV-04`: el comprador no aprueba su propia solicitud.
- `INV-VO-EDEV-05`: una devolución `RESUELTA` no se reabre.
- `INV-VO-EDEV-06`: para producto físico, la recepción e inspección preceden al reingreso vendible.
- `INV-VO-EDEV-07`: para producto digital, la devolución puede implicar revocación de acceso y no genera ingreso a inventario físico.

**Transiciones confirmadas:**

| Actual | Evento | Resultante | Condición |
|---|---|---|---|
| `SOLICITADA` | Asignar a revisión | `EN_REVISION` | Solicitud válida. |
| `EN_REVISION` | Aprobar | `APROBADA` | Actor autorizado y motivo. |
| `EN_REVISION` | Rechazar | `RECHAZADA` | Actor autorizado y motivo. |
| `APROBADA` | Iniciar tránsito (físico) | `EN_TRANSITO` | Devolución física aprobada. |
| `EN_TRANSITO` | Confirmar recepción | `RECIBIDA` | Recepción física. |
| `RECIBIDA` | Resolver | `RESUELTA` | Inspección y resolución financiera/operativa. |
| `APROBADA` | Resolver (digital) | `RESUELTA` | Política digital y reembolso si corresponde. |

**Reglas de validación:**

- Rechazar códigos fuera del catálogo.
- Rechazar transiciones no listadas.
- Exigir motivo en aprobación y rechazo.
- No reabrir una devolución resuelta.
- No incrementar inventario vendible antes de recepción e inspección.

**Condiciones de creación válida:** solicitud de un comprador propietario sobre un pedido entregado, dentro de la ventana configurable y con cantidades elegibles.

**Condiciones de rechazo:** código desconocido; pedido no entregado; comprador no propietario; fuera de plazo; cantidades excedidas; autoaprobación.

**Operaciones conceptuales permitidas:** comparar, interpretar y aplicar transiciones autorizadas.

**Resultados:** la transición produce un nuevo estado y auditoría; la resolución puede habilitar reembolso y reingreso de inventario según corresponda.

**Inmutabilidad esperada:** el valor es inmutable; la devolución cambia de estado por comportamiento del agregado.

**Relaciones:** `Devolucion.estado`; `DS-07`, `DS-08`, `DS-03` (reingreso).

**Restricciones de dependencia:** no depende del transportista ni del proveedor de pagos.

**Ejemplos:**

| Caso | Ejemplo | Resultado |
|---|---|---|
| Válido | `SOLICITADA` → `EN_REVISION` → `APROBADA`. | Aceptado. |
| Inválido | Comprador aprueba su propia solicitud. | Rechazado. |
| Inválido | Devolución física aprobada incrementa stock vendible antes de recibir. | Rechazado. |
| Inválido | Reabrir una devolución `RESUELTA`. | Rechazado. |

**Trazabilidad:** `[MOD]` §14.1, §14.3, §16, RET-01/RET-02; `[ENU]` Dominio 11.

**Estado:** **Confirmado por fuente**.

---

### 8.16 VO-ENM-15 — `EstadoReembolso`

**Definición de negocio:** estado del proceso de devolución de dinero vinculado a un pago capturado.

**Propósito:** representar la solicitud, aprobación, ejecución y resultado de un reembolso sin confundirlo con la devolución física.

**Valores:**

| Código | Significado |
|---|---|
| `SOLICITADO` | Reembolso solicitado. |
| `APROBADO` | Reembolso aprobado por actor autorizado. |
| `EN_PROCESO` | Ejecución externa en curso. |
| `COMPLETADO` | Reembolso confirmado por el proveedor o mecanismo autorizado. |
| `FALLIDO` | La ejecución externa falló. |

**Identidad conceptual y ausencia de identidad propia:** es un valor de catálogo; igualdad por código.

**Criterios de igualdad:** igualdad por código.

**Invariantes:**

- `INV-VO-EREE-01`: el valor pertenece al catálogo.
- `INV-VO-EREE-02`: el importe es mayor que cero y no excede el saldo reembolsable.
- `INV-VO-EREE-03`: la aprobación corresponde a un Administrador o rol de finanzas autorizado.
- `INV-VO-EREE-04`: un fallo externo no marca el reembolso como `COMPLETADO`.
- `INV-VO-EREE-05`: solo se procesa una vez por clave idempotente.
- `INV-VO-EREE-06`: el reembolso no supera el importe capturado menos reembolsos ya completados o en curso que comprometan saldo.

**Reglas de validación:**

- Rechazar códigos fuera del catálogo.
- Rechazar importe no positivo o superior al saldo.
- Rechazar aprobación por actor no autorizado.
- No marcar `COMPLETADO` sin confirmación externa o mecanismo autorizado.

**Condiciones de creación válida:** solicitud vinculada a un pago capturado, con motivo y aprobación cuando corresponda.

**Condiciones de rechazo:** código desconocido; importe inválido; saldo insuficiente; falta de aprobación; duplicado por idempotencia.

**Operaciones conceptuales permitidas:** comparar, interpretar y aplicar transiciones autorizadas.

**Resultados:** la transición produce un nuevo estado y auditoría; `COMPLETADO` actualiza el estado del pago a `REEMBOLSO_PARCIAL` o `REEMBOLSADO` cuando corresponda.

**Inmutabilidad esperada:** el valor es inmutable; el reembolso cambia de estado por comportamiento del agregado y confirmación externa.

**Relaciones:** `Reembolso.estado`; `Pago.estado`; `DS-08`.

**Restricciones de dependencia:** no depende del proveedor de pagos concreto.

**Ejemplos:**

| Caso | Ejemplo | Resultado |
|---|---|---|
| Válido | `SOLICITADO` → `APROBADO` → `EN_PROCESO` → `COMPLETADO`. | Aceptado. |
| Inválido | `FALLIDO` tratado como `COMPLETADO`. | Rechazado. |
| Inválido | Reembolso mayor al saldo capturado. | Rechazado. |

**Trazabilidad:** `[MOD]` §14.2, §16, REF-01, PAY-05; `[ENU]` Dominio 11.

**Estado:** **Confirmado por fuente**.

---

### 8.17 VO-ENM-16 — `TipoMovimientoInventario`

**Definición de negocio:** tipo de operación que incrementa, disminuye, reserva, libera o reclasifica existencias.

**Propósito:** expresar de forma explícita y auditable el efecto de cada movimiento sobre el inventario.

**Valores y efectos:**

| Código | Efecto conceptual | Uso y restricción |
|---|---|---|
| `INGRESO` | `onHand += q` | Recepción o carga inicial; requiere referencia y autorización. |
| `RESERVA` | `reserved += q` | Reserva para pedido; disminuye disponible. |
| `LIBERACION_RESERVA` | `reserved -= q` | Libera una reserva activa por cancelación, fallo de pago o expiración autorizada. |
| `SALIDA_VENTA` | `onHand -= q`, `reserved -= q` | Consumo físico al despachar; exige reserva activa suficiente. |
| `AJUSTE_POSITIVO` | `onHand += q` | Corrección documentada o hallazgo físico. |
| `AJUSTE_NEGATIVO` | Reduce `onHand` y/o reclasifica a `unavailable` | Nunca deja `onHand < reserved + unavailable`; exige motivo y autorización. |
| `DEVOLUCION_VENDIBLE` | `onHand += q` | Reingreso tras inspección y aprobación. |
| `DEVOLUCION_NO_VENDIBLE` | `onHand += q`, `unavailable += q` | Unidad recibida pero no vendible. |
| `BAJA_DANIO` | `onHand -= q`, `unavailable -= q` | Retiro definitivo de unidades dañadas/no vendibles. |

**Identidad conceptual y ausencia de identidad propia:** es un valor de catálogo; igualdad por código.

**Criterios de igualdad:** igualdad por código.

**Invariantes:**

- `INV-VO-TMOV-01`: el valor pertenece al catálogo.
- `INV-VO-TMOV-02`: la cantidad es positiva.
- `INV-VO-TMOV-03`: todo movimiento tiene referencia de negocio, actor, timestamp y clave de idempotencia.
- `INV-VO-TMOV-04`: los ajustes y bajas exigen motivo.
- `INV-VO-TMOV-05`: ningún movimiento deja cantidades negativas ni `reserved + unavailable > onHand`.
- `INV-VO-TMOV-06`: los movimientos no se editan ni eliminan; se compensan con otro movimiento.

**Reglas de validación:**

- Rechazar códigos fuera del catálogo.
- Rechazar cantidad cero o negativa.
- Rechazar el movimiento si el efecto viola las invariantes de inventario.
- Rechazar ajustes sin motivo o autorización.

**Condiciones de creación válida:** operación de inventario autorizada, con posición, cantidad, referencia, actor y clave de idempotencia.

**Condiciones de rechazo:** código desconocido; cantidad inválida; efecto que deja saldo inválido; falta de motivo; duplicado por idempotencia.

**Operaciones conceptuales permitidas:** comparar, interpretar y aplicar el efecto correspondiente en el agregado de inventario.

**Resultados:** un nuevo estado de inventario y un movimiento registrado; nunca una mutación sin movimiento.

**Inmutabilidad esperada:** el valor es inmutable; el movimiento es un hecho pasado y no se modifica.

**Relaciones:** `MovimientoInventario.tipo`; `Inventario`; `DS-03`.

**Restricciones de dependencia:** no depende del motor de persistencia.

**Ejemplos:**

| Caso | Ejemplo | Resultado |
|---|---|---|
| Válido | `INGRESO` de 10 unidades. | `onHand += 10`. |
| Válido | `RESERVA` de 3 unidades con disponible 5. | `reserved += 3`. |
| Inválido | `SALIDA_VENTA` sin reserva activa suficiente. | Rechazado. |
| Inválido | `AJUSTE_NEGATIVO` que deja `reserved + unavailable > onHand`. | Rechazado. |

**Trazabilidad:** `[MOD]` §8.2.2, §8.2.3, §16, INV-01…INV-10; `[ENU]` Dominio 6.

**Estado:** **Confirmado por fuente**.

---

### 8.18 VO-AUD-01 — `GravedadAuditoria`

**Definición de negocio:** importancia o severidad de un evento de auditoría.

**Propósito:** permitir clasificar y filtrar eventos según su relevancia operativa o de control.

**Valores:**

| Código | Significado |
|---|---|
| `INFORMACION` | Operación normal registrada. |
| `ADVERTENCIA` | Evento que requiere atención. |
| `ERROR` | Operación que produjo una condición anómala. |
| `CRITICO` | Evento de alta importancia operativa o de control. |

**Identidad conceptual y ausencia de identidad propia:** es un valor de catálogo; igualdad por código.

**Criterios de igualdad:** igualdad por código.

**Invariantes:**

- `INV-VO-GRAV-01`: el valor pertenece al catálogo.
- `INV-VO-GRAV-02`: la gravedad no sustituye el resultado de la operación.
- `INV-VO-GRAV-03`: un evento crítico debe conservar correlación y actor.

**Reglas de validación:** rechazar códigos fuera del catálogo; no inferir gravedad a partir del resultado sin una política.

**Condiciones de creación válida:** asignación por el productor del evento según la política de auditoría.

**Condiciones de rechazo:** código desconocido.

**Operaciones conceptuales permitidas:** comparar e interpretar.

**Resultados:** la comparación produce un booleano; la interpretación clasifica el evento.

**Inmutabilidad esperada:** inmutable.

**Relaciones:** `RegistroAuditoria.gravedad`; `DS-09`.

**Restricciones de dependencia:** no depende de un sistema de logs concreto.

**Ejemplos:** `INFORMACION` para un inicio de sesión exitoso; `CRITICO` para un cambio de rol privilegiado. Los ejemplos son ilustrativos, no una política cerrada.

**Trazabilidad:** `[MOD]` §15.1, §16.

**Estado:** **Confirmado por fuente** en valores; la asignación concreta por evento queda sujeta a la política de auditoría.

---

### 8.19 VO-AUD-02 — `ResultadoAuditoria`

**Definición de negocio:** resultado de la acción registrada en auditoría.

**Propósito:** distinguir operaciones exitosas, rechazos de negocio y errores.

**Valores:**

| Código | Significado |
|---|---|
| `ÉXITO` | La operación se completó. |
| `RECHAZO` | La operación fue rechazada por una regla de negocio o autorización. |
| `ERROR` | La operación falló por una condición técnica o inesperada. |

**Identidad conceptual y ausencia de identidad propia:** es un valor de catálogo; igualdad por código.

**Criterios de igualdad:** igualdad por código.

**Invariantes:**

- `INV-VO-RES-01`: el valor pertenece al catálogo.
- `INV-VO-RES-02`: un rechazo de negocio no se registra como error técnico.
- `INV-VO-RES-03`: un error no se registra como éxito.

**Reglas de validación:** rechazar códigos fuera del catálogo; no confundir resultado con gravedad.

**Condiciones de creación válida:** asignación por el productor del evento según el resultado real.

**Condiciones de rechazo:** código desconocido.

**Operaciones conceptuales permitidas:** comparar e interpretar.

**Resultados:** la comparación produce un booleano; la interpretación clasifica el evento.

**Inmutabilidad esperada:** inmutable.

**Relaciones:** `RegistroAuditoria.resultado`; `DS-09`.

**Restricciones de dependencia:** ninguna adicional.

**Ejemplos:** `RECHAZO` por falta de stock; `ERROR` por fallo de conexión; `ÉXITO` por reserva completada.

**Trazabilidad:** `[MOD]` §15.1.

**Estado:** **Confirmado por fuente**.

---

### 8.20 VO-AUD-03 — `CodigoEvento`

**Definición de negocio:** código estable y versionado que identifica el tipo de evento auditado.

**Propósito:** permitir consultas, filtros y reconciliación sin depender de textos libres.

**Componentes:**

| Componente | Significado |
|---|---|
| Código | Identificador del evento, perteneciente a un catálogo o convención versionada. |
| Versión | Versión del esquema o del catálogo, cuando aplique. |

**Identidad conceptual y ausencia de identidad propia:** es un valor; igualdad por código y versión.

**Criterios de igualdad:** igualdad por código y versión.

**Invariantes:**

- `INV-VO-CODEV-01`: el código no está vacío.
- `INV-VO-CODEV-02`: pertenece a un catálogo o convención versionada.
- `INV-VO-CODEV-03`: no se cambia el significado de un código existente; se versiona.

**Reglas de validación:** rechazar códigos vacíos o no registrados; no usar texto libre como código.

**Condiciones de creación válida:** asignación desde el catálogo versionado.

**Condiciones de rechazo:** código desconocido o vacío.

**Operaciones conceptuales permitidas:** comparar e interpretar.

**Resultados:** la comparación produce un booleano; la interpretación identifica el tipo de evento.

**Inmutabilidad esperada:** inmutable.

**Relaciones:** `RegistroAuditoria.evento`; `DS-09`.

**Restricciones de dependencia:** no depende de un sistema de mensajería.

**Ejemplos:** un código para `PedidoCreado` o `PagoConfirmado`; los valores concretos no están enumerados en `[MOD]`.

**Trazabilidad:** `[MOD]` §15.1, §20.

**Estado:** **Parcialmente especificado**: semántica confirmada; catálogo de valores no enumerado.

---

### 8.21 VO-ENM-17 — `EstadoReserva`

**Definición de negocio:** condición del ciclo de vida de una reserva de existencias asociada a un pedido, una variante y una bodega.

**Propósito:** impedir que una misma reserva se consuma o libere más de una vez y distinguir el stock comprometido del stock disponible.

**Valores:**

| Código | Significado |
|---|---|
| `ACTIVA` | La reserva compromete existencias y puede consumirse o liberarse. |
| `CONSUMIDA` | La reserva se aplicó al despacho; el stock físico y el reservado disminuyeron. |
| `LIBERADA` | La reserva se anuló por cancelación, fallo de pago o expiración autorizada. |
| `EXPIRADA` | La reserva venció sin consumirse ni liberarse explícitamente. |

**Identidad conceptual y ausencia de identidad propia:** es un valor de catálogo; igualdad por código.

**Criterios de igualdad:** igualdad por código.

**Invariantes:**

- `INV-VO-ERES-01`: el valor pertenece al catálogo.
- `INV-VO-ERES-02`: una reserva `ACTIVA` puede consumirse una sola vez o liberarse una sola vez.
- `INV-VO-ERES-03`: `CONSUMIDA`, `LIBERADA` y `EXPIRADA` son terminales; ninguna vuelve a `ACTIVA`.
- `INV-VO-ERES-04`: una reserva `EXPIRADA` no puede consumirse; si todavía se necesita stock, se crea una nueva reserva.
- `INV-VO-ERES-05`: la reserva solo existe para un pedido, una variante y una bodega elegibles, con cantidad positiva y disponibilidad suficiente.

**Transiciones confirmadas:**

| Actual | Evento | Resultante | Condición |
|---|---|---|---|
| `ACTIVA` | Consumir al despachar | `CONSUMIDA` | Reserva activa suficiente y salida de venta autorizada. |
| `ACTIVA` | Liberar | `LIBERADA` | Cancelación, fallo de pago o liberación autorizada. |
| `ACTIVA` | Expirar | `EXPIRADA` | Se alcanza `expiraEn` sin consumo. |

**Reglas de validación:**

- Rechazar códigos fuera del catálogo.
- Rechazar transiciones no listadas.
- Rechazar consumo o liberación de una reserva no `ACTIVA`.
- Rechazar cantidad no positiva o superior a la disponible al crear la reserva.
- Rechazar reserva sobre bodega inactiva o variante no vendible.

**Condiciones de creación válida:** checkout con disponibilidad suficiente en una bodega `ACTIVA`, variante vendible y cantidad positiva, dentro de una operación idempotente.

**Condiciones de rechazo:** código desconocido; cantidad no positiva; disponibilidad insuficiente; bodega inactiva; variante no vendible; reutilización de una reserva terminal; doble consumo o doble liberación.

**Operaciones conceptuales permitidas:** comparar, interpretar y aplicar transiciones autorizadas.

**Resultados:** la transición produce un nuevo estado, un movimiento de inventario y auditoría; el consumo reduce `onHand` y `reserved`; la liberación reduce solo `reserved`; la expiración deja el stock disponible sin movimiento de salida.

**Inmutabilidad esperada:** el valor es inmutable; la reserva cambia de estado por comportamiento del agregado.

**Relaciones:** `ReservaInventario.estado`; `DS-03`, `DS-06`; `INV-03`, `INV-04`, `INV-06`, `INV-07`.

**Restricciones de dependencia:** no depende del transportista ni del proveedor de pagos.

**Ejemplos:**

| Caso | Ejemplo | Resultado |
|---|---|---|
| Válido | `ACTIVA` → `CONSUMIDA` al despachar. | Aceptado. |
| Válido | `ACTIVA` → `LIBERADA` por fallo de pago. | Aceptado. |
| Válido | `ACTIVA` → `EXPIRADA` al vencer sin pago. | Aceptado. |
| Inválido | Consumir una reserva `EXPIRADA`. | Rechazado. |
| Inválido | Volver de `LIBERADA` a `ACTIVA`. | Rechazado. |
| Inválido | Liberar dos veces la misma reserva. | Rechazado; la segunda no cambia cantidades. |

**Trazabilidad:** `[MOD]` §8.2.3, §16, INV-03, INV-04, INV-06, INV-07; `[ENU]` Dominio 6.

**Estado:** **Confirmado por fuente**.

---

## 9. Objetos de valor auxiliares

### 9.1 VO-MOT-01 — `MotivoMovimiento`

**Definición de negocio:** razón documentada de un ajuste positivo, ajuste negativo o baja de inventario.

**Propósito:** impedir correcciones de stock sin justificación y preservar la trazabilidad del cambio.

**Componentes:**

| Componente | Significado | Estado |
|---|---|---|
| Motivo | Texto no vacío o código de un catálogo controlado. | Valores no enumerados en `[MOD]`. |

**Identidad conceptual y ausencia de identidad propia:** es un valor; dos motivos con el mismo contenido representan la misma razón.

**Criterios de igualdad:** igualdad por el contenido normalizado o por el código, según el catálogo que se adopte.

**Invariantes:**

- `INV-VO-MOTM-01`: es obligatorio en ajustes y bajas.
- `INV-VO-MOTM-02`: no puede estar vacío.
- `INV-VO-MOTM-03`: no sustituye la referencia de negocio ni la autorización.

**Reglas de validación:** rechazar vacío; exigir pertenencia al catálogo si se adopta uno; no aceptar texto libre si la política exige catálogo.

**Condiciones de creación válida:** asignación al registrar un movimiento que requiere motivo.

**Condiciones de rechazo:** motivo vacío; motivo no perteneciente al catálogo cuando exista.

**Operaciones conceptuales permitidas:** comparar e interpretar.

**Resultados:** la comparación produce un booleano; la interpretación clasifica el movimiento.

**Inmutabilidad esperada:** inmutable; el movimiento no se edita.

**Relaciones:** `MovimientoInventario.motivo`; `DS-03`, `DS-09`.

**Restricciones de dependencia:** no depende de un catálogo externo.

**Ejemplos:** `"Conteo físico"` para un ajuste; `"Unidad dañada"` para una baja. Los ejemplos son ilustrativos.

**Trazabilidad:** `[MOD]` §8.3, INV-08.

**Estado:** **Parcialmente especificado**: obligatoriedad confirmada; catálogo no definido.

---

### 9.2 VO-MOT-02 — `MotivoDevolucion`

**Definición de negocio:** causa declarada por el comprador para solicitar una devolución, perteneciente a un catálogo controlado.

**Propósito:** clasificar las devoluciones, permitir su revisión y evitar texto libre no analizable.

**Componentes:**

| Componente | Significado | Estado |
|---|---|---|
| Código de motivo | Valor del catálogo controlado. | Valores no enumerados en `[MOD]`. |

**Identidad conceptual y ausencia de identidad propia:** es un valor de catálogo; igualdad por código.

**Criterios de igualdad:** igualdad por código.

**Invariantes:**

- `INV-VO-MOTD-01`: es obligatorio.
- `INV-VO-MOTD-02`: pertenece al catálogo de motivos.
- `INV-VO-MOTD-03`: no se usa para decidir por sí solo la aprobación; la elegibilidad la evalúa `DS-07`.

**Reglas de validación:** rechazar vacío; rechazar códigos fuera del catálogo; no aceptar texto libre si el catálogo es cerrado.

**Condiciones de creación válida:** selección de un código válido al solicitar la devolución.

**Condiciones de rechazo:** motivo vacío o desconocido.

**Operaciones conceptuales permitidas:** comparar e interpretar.

**Resultados:** la comparación produce un booleano; la interpretación clasifica la solicitud.

**Inmutabilidad esperada:** inmutable.

**Relaciones:** `Devolucion.motivo`; `DS-07`.

**Restricciones de dependencia:** no depende de un proveedor externo.

**Ejemplos:** un código de "producto defectuoso" o "producto no corresponde"; los valores concretos deben aprobarse (`DEC-BIZ-03`).

**Trazabilidad:** `[MOD]` §14.1.

**Estado:** **Parcialmente especificado**: obligatoriedad y carácter controlado confirmados; catálogo no definido.

---

### 9.3 VO-MOT-03 — `MotivoReembolso`

**Definición de negocio:** razón documentada de un reembolso.

**Propósito:** justificar la devolución de dinero y preservar la trazabilidad financiera.

**Componentes:**

| Componente | Significado | Estado |
|---|---|---|
| Motivo | Texto no vacío o código de catálogo. | Valores no enumerados. |

**Identidad conceptual y ausencia de identidad propia:** es un valor; igualdad por contenido o código.

**Criterios de igualdad:** igualdad por contenido normalizado o código.

**Invariantes:**

- `INV-VO-MOTR-01`: es obligatorio.
- `INV-VO-MOTR-02`: no puede estar vacío.
- `INV-VO-MOTR-03`: no sustituye la aprobación ni el cálculo del saldo reembolsable.

**Reglas de validación:** rechazar vacío; exigir catálogo si la política lo define.

**Condiciones de creación válida:** asignación al solicitar o aprobar un reembolso.

**Condiciones de rechazo:** motivo vacío o no permitido.

**Operaciones conceptuales permitidas:** comparar e interpretar.

**Resultados:** la comparación produce un booleano; la interpretación clasifica el reembolso.

**Inmutabilidad esperada:** inmutable.

**Relaciones:** `Reembolso.motivo`; `DS-08`.

**Restricciones de dependencia:** ninguna adicional.

**Ejemplos:** `"Devolución aprobada"` o `"Ajuste autorizado"`. Los ejemplos son ilustrativos.

**Trazabilidad:** `[MOD]` §14.2.

**Estado:** **Parcialmente especificado**: obligatoriedad confirmada; catálogo no definido.

---

### 9.4 VO-FIS-01 — `DatosEmisorSnapshot`

**Definición de negocio:** datos del emisor de la factura congelados en el momento de la emisión.

**Propósito:** preservar la identidad fiscal del emisor aunque sus datos maestros cambien después.

**Componentes:**

| Componente | Significado | Estado |
|---|---|---|
| Datos fiscales del emisor | Composición no especificada en `[MOD]`. | **Limitado por fuente.** |

**Identidad conceptual y ausencia de identidad propia:** es un valor compuesto; dos snapshots con los mismos datos son iguales, pero su función es histórica.

**Criterios de igualdad:** igualdad por los valores congelados.

**Invariantes:**

- `INV-VO-EMIS-01`: es inmutable.
- `INV-VO-EMIS-02`: se crea al emitir la factura.
- `INV-VO-EMIS-03`: no se recalcula si cambian los datos del emisor.

**Reglas de validación:** rechazar la emisión sin los datos requeridos por la política fiscal; no inventar campos.

**Condiciones de creación válida:** emisión de factura con datos fiscales válidos.

**Condiciones de rechazo:** datos faltantes; intento de actualización posterior.

**Operaciones conceptuales permitidas:** leer y comparar.

**Resultados:** la lectura devuelve los valores congelados.

**Inmutabilidad esperada:** completamente inmutable.

**Relaciones:** `Factura.emisor`.

**Restricciones de dependencia:** no depende de un proveedor de facturación electrónica.

**Ejemplos:** un snapshot con la identificación fiscal vigente al emitir; los campos concretos deben definirse con la política fiscal.

**Trazabilidad:** `[MOD]` §12.1.

**Estado:** **Parcialmente especificado**: semántica confirmada; composición no definida.

---

### 9.5 VO-FIS-02 — `DatosReceptorSnapshot`

**Definición de negocio:** datos del comprador congelados en el momento de la emisión de la factura.

**Propósito:** preservar la identidad fiscal del receptor aunque sus datos cambien después.

**Componentes:**

| Componente | Significado | Estado |
|---|---|---|
| Datos fiscales del receptor | Composición no especificada en `[MOD]`. | **Limitado por fuente.** |

**Identidad conceptual y ausencia de identidad propia:** es un valor compuesto; igualdad por los valores congelados.

**Criterios de igualdad:** igualdad por los valores congelados.

**Invariantes:**

- `INV-VO-RECEP-01`: es inmutable.
- `INV-VO-RECEP-02`: se crea al emitir la factura.
- `INV-VO-RECEP-03`: no se recalcula si cambian los datos del comprador.

**Reglas de validación:** rechazar la emisión sin los datos requeridos por la política fiscal; no inventar campos.

**Condiciones de creación válida:** emisión de factura con datos fiscales válidos.

**Condiciones de rechazo:** datos faltantes; intento de actualización posterior.

**Operaciones conceptuales permitidas:** leer y comparar.

**Resultados:** la lectura devuelve los valores congelados.

**Inmutabilidad esperada:** completamente inmutable.

**Relaciones:** `Factura.receptor`.

**Restricciones de dependencia:** no depende de un proveedor de facturación electrónica.

**Ejemplos:** un snapshot con los datos fiscales del comprador al emitir; los campos concretos deben definirse con la política fiscal.

**Trazabilidad:** `[MOD]` §12.1.

**Estado:** **Parcialmente especificado**: semántica confirmada; composición no definida.

---

### 9.6 VO-AUD-04 — `AuditPayload`

**Definición de negocio:** conjunto mínimo, estructurado y no sensible de datos que describe el evento auditado.

**Propósito:** permitir reconstruir qué ocurrió sin almacenar secretos ni datos personales innecesarios.

**Componentes:**

| Componente | Significado | Estado |
|---|---|---|
| Datos estructurados | Pares o estructura de detalles del evento. | Esquema no fijado en `[MOD]`. |

**Identidad conceptual y ausencia de identidad propia:** es un valor compuesto; dos payloads con el mismo contenido representan el mismo detalle.

**Criterios de igualdad:** igualdad por contenido estructurado, si el esquema lo permite.

**Invariantes:**

- `INV-VO-AUDP-01`: no contiene contraseñas, tokens, datos completos de tarjeta ni secretos.
- `INV-VO-AUDP-02`: contiene solo los datos necesarios para reconstruir el evento.
- `INV-VO-AUDP-03`: es inmutable.
- `INV-VO-AUDP-04`: no se usa como sustituto del estado transaccional.

**Reglas de validación:** rechazar secretos; minimizar datos personales; no incluir objetos de infraestructura ni DTOs completos.

**Condiciones de creación válida:** construcción por `DS-09` a partir de datos autorizados.

**Condiciones de rechazo:** presencia de secretos o datos innecesarios; intento de mutación.

**Operaciones conceptuales permitidas:** leer y comparar.

**Resultados:** la lectura devuelve el detalle; la comparación indica igualdad de contenido.

**Inmutabilidad esperada:** completamente inmutable.

**Relaciones:** `RegistroAuditoria.detalles`; `DS-09`.

**Restricciones de dependencia:** no depende de MongoDB ni de un formato de documento.

**Ejemplos:** un payload con identificadores de pedido, resultado y motivo, sin datos de tarjeta.

**Trazabilidad:** `[MOD]` §15.1, AUD-04, AUD-06.

**Estado:** **Parcialmente especificado**: reglas de minimización confirmadas; esquema no definido.

---

### 9.7 VO-REF-01 — `TipoReferencia`

**Definición de negocio:** tipo de proceso de negocio que origina un movimiento de inventario.

**Propósito:** permitir reconstruir por qué se produjo un movimiento y vincularlo con su proceso de origen.

**Componentes:**

| Componente | Significado | Estado |
|---|---|---|
| Código | Tipo de referencia permitido. | Valores parcialmente enumerados: pedido, devolución, ajuste, recepción u otra referencia permitida. |

**Identidad conceptual y ausencia de identidad propia:** es un valor de catálogo; igualdad por código.

**Criterios de igualdad:** igualdad por código.

**Invariantes:**

- `INV-VO-TREF-01`: pertenece al catálogo de referencias permitidas.
- `INV-VO-TREF-02`: se acompaña de `referenciaId`.
- `INV-VO-TREF-03`: no se usa para sustituir el tipo de movimiento.

**Reglas de validación:** rechazar códigos desconocidos; exigir referencia cuando el movimiento la requiera.

**Condiciones de creación válida:** asignación al registrar un movimiento con proceso de origen identificable.

**Condiciones de rechazo:** código desconocido; ausencia de referencia.

**Operaciones conceptuales permitidas:** comparar e interpretar.

**Resultados:** la comparación produce un booleano; la interpretación vincula el movimiento con su origen.

**Inmutabilidad esperada:** inmutable.

**Relaciones:** `MovimientoInventario.referenciaTipo`; `DS-03`.

**Restricciones de dependencia:** ninguna adicional.

**Ejemplos:** referencia de tipo pedido para una reserva; referencia de devolución para un reingreso.

**Trazabilidad:** `[MOD]` §8.3.

**Estado:** **Parcialmente especificado**: semántica confirmada; catálogo completo no enumerado.

---

## 10. Validación y normalización

### 10.1 Cuatro conceptos que no deben confundirse

| Concepto | Qué es | Dónde se aplica | Ejemplo en NexusMarket |
|---|---|---|---|
| Validación de regla de negocio | Comprueba una condición del dominio. | En el VO, la entidad, el agregado o el servicio de dominio. | No reservar más que el disponible; no reutilizar un SKU; no reembolsar más que lo capturado. |
| Normalización de representación | Transforma una representación válida a una forma canónica para comparar o persistir. | En el VO o en el límite de entrada, según la regla. | Recortar espacios de un nombre; convertir un correo a minúsculas para comparar. |
| Formato de entrada o presentación | Define cómo se recibe o se muestra un valor. | En el contrato de entrada, el DTO o la interfaz. | Formato textual de una fecha; máscara de un documento; formato de moneda. |
| Restricción de persistencia | Garantiza unicidad, integridad o concurrencia en el almacenamiento. | En el adaptador y el esquema de persistencia. | Índice único de correo, SKU o documento; control de versión del inventario. |

Una regla de negocio no se vuelve válida solo porque exista una restricción de base de datos, y una restricción de base de datos no sustituye la validación de dominio. La validación de dominio debe poder ejecutarse sin base de datos.

### 10.2 Normalizaciones adoptadas y su procedencia

| VO | Normalización | Procedencia | Límite |
|---|---|---|---|
| Nombres textuales | Recorte de espacios extremos y colapso de espacios internos. | **Decisión de diseño** compatible con "espacios normalizados" de `[MOD]` §16. | No se fija límite máximo ni conversión de mayúsculas. |
| `CorreoElectronico` | Recorte y conversión a minúsculas para comparar y persistir. | **Decisión de diseño** apoyada en `[ARQ]` §6.3 y en la exigencia de normalización consistente. | El formato exacto y la política de mayúsculas del dominio local no están fijados. |
| `SKU` | Recorte de espacios; no se altera el caso salvo que el catálogo lo defina. | **Limitación por fuente**: `[MOD]` solo dice "cadena normalizada". | No se fija patrón ni longitud. |
| `DocumentoIdentidad` | Normalización por tipo, país y número según la política de identidad. | **Limitación por fuente**: `[MOD]` no detalla el formato. | No se inventa una regla de mayúsculas ni de dígitos verificadores. |
| `Dinero` | Representación decimal exacta o unidad monetaria menor; redondeo por política central. | **Confirmado por fuente** en exactitud y moneda; **limitado** en escala y redondeo. | No se fija número de decimales ni moneda del despliegue. |
| `Instant` | Representación en UTC. | **Confirmado por fuente**. | No se fija formato textual. |
| `IdentificadorTipado` | Valor opaco; formato definido por el diseño técnico. | **Confirmado por fuente** en opacidad; **limitado** en formato. | No se fija UUID, serial ni longitud. |
| `MotivoMovimiento`, `MotivoReembolso` | Recorte de espacios; catálogo si la política lo define. | **Parcialmente especificado**. | Valores no enumerados. |
| `MotivoDevolucion` | Pertenencia a catálogo controlado. | **Confirmado por fuente** en carácter controlado; **limitado** en valores. | Catálogo no enumerado. |

### 10.3 Reglas que no se inventan

Este documento no fija, sin evidencia:

- Límites máximos de longitud de nombres.
- Formato exacto de correo, documento, SKU o identificador.
- Moneda obligatoria del despliegue, escala decimal o regla de redondeo.
- Zona horaria local o formato textual de fechas.
- Catálogo de motivos de devolución o reembolso.
- Campos exactos de una dirección.
- Tasas de impuestos, descuentos o costo de envío.
- Plazo de devolución.
- Algoritmo de hashing.
- Preferencia entre bodegas.

Cuando una de estas reglas sea necesaria para implementar, debe provenir de una decisión de negocio o de un contrato de entrada aprobado; no de este documento.

---

## 11. Relaciones y uso

### 11.1 Mapa de uso por entidad

| Entidad/agregado | Objetos de valor principales |
|---|---|
| `Usuario` | `UsuarioId`, `NombreCompleto`, `CorreoElectronico`, `DocumentoIdentidad`, `HashCredencial`, `RolSistema`, `EstadoUsuario`, `Instant`. |
| `PerfilComprador` | `CompradorId`, `UsuarioId`, `EstadoComercial`, `Direccion`, `Instant`. |
| `PerfilVendedor` | `VendedorId`, `UsuarioId`, `NombreComercial`, `EstadoVendedor`, `UsuarioId` (incorporado por), `Instant`. |
| `Producto` | `ProductoId`, `VendedorId`, `NombreProducto`, `CategoriaProducto`, `EstadoProducto`, `TipoEntrega`, `Instant`. |
| `Variante` | `VarianteId`, `ProductoId`, `SKU`, `NombreVariante`, `Dinero`, `EstadoVariante`. |
| `Bodega` | `BodegaId`, `NombreBodega`, `DireccionFisica`, `TipoBodega`, `EstadoBodega`, `Instant`; `VendedorId` cuando es bodega de vendedor. |
| `Inventario` | `InventarioId`, `VarianteId`, `BodegaId`, `Cantidad`, `Instant`. |
| `ReservaInventario` | `ReservaInventarioId`, `PedidoId`, `VarianteId`, `BodegaId`, `Cantidad`, `EstadoReserva`, `Instant`, `IdempotencyKey`. |
| `MovimientoInventario` | `MovimientoId`, `InventarioId`, `TipoMovimientoInventario`, `CantidadPositiva`, `TipoReferencia`, `UsuarioId` o identidad de sistema, `MotivoMovimiento`, `Instant`, `IdempotencyKey`. |
| `Carrito` | `CarritoId`, `CompradorId`, `Instant`. |
| `ItemCarrito` | `VarianteId`, `CantidadPositiva`, `Dinero`, `Instant`. |
| `Pedido` | `PedidoId`, `CheckoutGroupId`, `CompradorId`, `VendedorId`, `EstadoPedido`, `EstadoPago` (proyección), `Dinero`, `DireccionSnapshot`, `Instant`. |
| `ItemPedido` | `ItemPedidoId`, `VarianteId`, `SKU`, `VendedorId`, `TipoEntrega`, `CantidadPositiva`, `Dinero`. |
| `Pago` | `PagoId`, `PedidoId`, `Dinero`, `EstadoPago`, `IdempotencyKey`, `Instant`. |
| `Factura` | `FacturaId`, `PedidoId`, `Dinero`, `EstadoFactura`, `DatosEmisorSnapshot`, `DatosReceptorSnapshot`, `Instant`. |
| `Envio` | `EnvioId`, `PedidoId`, `BodegaId`, `DireccionSnapshot`, `EstadoEnvio`, `Instant`. |
| `Devolucion` | `DevolucionId`, `PedidoId`, `CompradorId`, `MotivoDevolucion`, `EstadoDevolucion`, `Instant`, `UsuarioId` (resuelta por). |
| `Reembolso` | `ReembolsoId`, `PagoId`, `PedidoId`, `DevolucionId`, `Dinero`, `EstadoReembolso`, `MotivoReembolso`, `UsuarioId` (aprobado por), `IdempotencyKey`. |
| `RegistroAuditoria` | `AuditId`, `CodigoEvento`, `UsuarioId` o identidad de sistema, `RolSistema`, `Instant`, `CorrelationId`, `EventId`, `ResultadoAuditoria`, `GravedadAuditoria`, `AuditPayload`. |

### 11.2 Dónde se aplican las reglas

| Regla | Lugar de autoridad | No debe duplicarse en |
|---|---|---|
| Formato y no vacío de nombres | VO `NombreTextual` y validación de entrada. | Servicios de aplicación o adaptadores con reglas distintas. |
| Unicidad de correo, documento y SKU | VO + restricción de persistencia. | Servicios que asuman unicidad sin comprobar conflicto. |
| Aritmética monetaria | VO `Dinero` y `DS-05`. | Entidades que sumen números sueltos o adaptadores que redondeen de otra forma. |
| Disponibilidad de inventario | Agregado `Inventario` y `DS-03`. | `DS-04` no debe prometer disponibilidad sin reservar; los adaptadores no deben calcularla. |
| Transiciones de pedido | Agregado `Pedido` y `DS-06`. | `DS-03` o `DS-08` no deben cambiar el estado del pedido. |
| Elegibilidad de devolución | `DS-07`. | El adaptador HTTP no debe decidir plazo o cantidades. |
| Saldo reembolsable | `DS-08` y agregado `Pago`. | El adaptador de pagos no debe autorizar por sí solo. |
| Auditoría append-only | `DS-09` y agregado `RegistroAuditoria`. | Ningún servicio debe modificar un registro existente. |

### 11.3 Relación con servicios de dominio

| Servicio | Objetos de valor que consume | Objetos de valor que produce o valida |
|---|---|---|
| `DS-01` | `RolSistema`, `EstadoUsuario`, `EstadoComercial`, `EstadoVendedor`, `EstadoProducto`, `EstadoBodega`, identificadores. | Decisión de autorización; no crea VOs de estado. |
| `DS-02` | `NombreProducto`, `NombreVariante`, `SKU`, `Dinero`, `CategoriaProducto`, `EstadoProducto`, `EstadoVendedor`, `TipoEntrega`. | Elegibilidad de publicación. |
| `DS-03` | `Cantidad`, `CantidadPositiva`, `TipoMovimientoInventario`, `EstadoReserva`, `IdempotencyKey`, `Instant`, `MotivoMovimiento`, `TipoReferencia`. | Nuevo estado de inventario, reserva y movimiento. |
| `DS-04` | `CantidadPositiva`, `EstadoBodega`, `TipoBodega`, `TipoEntrega`, `Direccion`. | Asignación de bodegas. |
| `DS-05` | `Dinero`, `CantidadPositiva`. | Importes calculados. |
| `DS-06` | `EstadoPedido`, `EstadoPago`, `EstadoEnvio`, `DireccionSnapshot`, `Instant`. | Transición válida. |
| `DS-07` | `EstadoDevolucion`, `MotivoDevolucion`, `CantidadPositiva`, `Instant`, `EstadoPedido`. | Elegibilidad de devolución. |
| `DS-08` | `EstadoReembolso`, `EstadoPago`, `Dinero`, `MotivoReembolso`, `IdempotencyKey`. | Saldo reembolsable y elegibilidad. |
| `DS-09` | `CodigoEvento`, `GravedadAuditoria`, `ResultadoAuditoria`, `CorrelationId`, `AuditPayload`, `Instant`, `RolSistema`. | Registro de auditoría normalizado. |

### 11.4 Regla de consistencia entre documentos

`[DS]` y este documento deben usar los mismos nombres y las mismas reglas. Si un servicio necesita una regla que no está en el VO, la regla se documenta en el servicio y se referencia; no se crea un segundo VO con el mismo significado. Si un VO necesita una regla que el servicio no aplica, el servicio está incompleto y debe corregirse.

---

## 12. Catálogo de invariantes

La siguiente matriz consolida las invariantes de los objetos de valor. Las invariantes de entidades y agregados que no pertenecen al VO se referencian, pero no se duplican aquí.

| Identificador | VO afectado | Regla exacta | Momento de verificación | Consecuencia de incumplimiento | Fuente | Estado |
|---|---|---|---|---|---|---|
| `INV-VO-ID-01…05` | `IdentificadorTipado` | No vacío; inmutable; no reutilizado; no intercambiable entre tipos; único en su ámbito. | Creación, reconstrucción y asignación. | Rechazo de creación o conflicto de identidad. | `[MOD]` §16, §24 | Confirmado; formato limitado |
| `INV-VO-NOM-01…05` | Nombres textuales | No vacío tras normalizar; no solo espacios; espacios colapsados; no truncamiento silencioso; no unicidad. | Creación y normalización. | Rechazo del valor. | `[MOD]` §16 | Confirmado; límites limitados |
| `INV-VO-SKU-01…04` | `SKU` | No vacío; único global; no reutilizado tras descontinuar; no reasignado. | Creación de variante y publicación. | Rechazo o conflicto de unicidad. | `[MOD]` §7.4, §16 | Confirmado |
| `INV-VO-EMAIL-01…03` | `CorreoElectronico` | Formato válido; único tras normalizar; no es credencial. | Registro y cambio de correo. | Rechazo o conflicto. | `[MOD]` §6.1, §16 | Confirmado; formato limitado |
| `INV-VO-DOC-01…04` | `DocumentoIdentidad` | Componentes presentes; combinación única; dato protegido; no auditado completo. | Registro y auditoría. | Rechazo o incidente de privacidad. | `[MOD]` §6.1, §16 | Confirmado; formato limitado |
| `INV-VO-HASH-01…04` | `HashCredencial` | Sin contraseña original; no reversible; no auditado; algoritmo aprobado. | Creación y auditoría. | Rechazo o incidente de seguridad. | `[MOD]` §6.1, §15.1, §16 | Confirmado; algoritmo limitado |
| `INV-VO-MON-01…05` | `Dinero` | Moneda presente; exactitud; misma moneda; redondeo reproducible; no negativo en línea base. | Creación y cada operación. | Rechazo de operación. | `[MOD]` §16, §16.1 | Confirmado; escala limitada |
| `INV-VO-CAN-01…03` | `Cantidad` | Entero; no negativo; sin fracciones. | Creación y operaciones. | Rechazo. | `[MOD]` §8.2, §16 | Confirmado |
| `INV-VO-CANP-01…03` | `CantidadPositiva` | Entero; mayor que cero; sin fracciones. | Creación y operaciones. | Rechazo. | `[MOD]` §8.3, §10.2, §16 | Confirmado |
| `INV-VO-DIR-01…05` | `Direccion` | Válida; pertenece al comprador; principal/adicional; requerida para compra física; editable hasta snapshot. | Registro y checkout. | Rechazo de compra física. | `[MOD]` §6.3, §16 | Parcialmente especificado |
| `INV-VO-DIRF-01…04` | `DireccionFisica` | No vacía; normalizada; pertenece a bodega; no es dirección de entrega. | Creación de bodega. | Rechazo. | `[MOD]` §8.1 | Parcialmente especificado |
| `INV-VO-DIRS-01…05` | `DireccionSnapshot` | Inmutable; creado desde dirección válida; no alterado por cambios posteriores; obligatorio en pedido físico; no reemplazado retroactivamente. | Checkout, envío y consulta histórica. | Rechazo o inconsistencia histórica. | `[MOD]` §10.1, §13.1, §16 | Confirmado |
| `INV-VO-INST-01…04` | `Instant` | Válido; UTC; ordenable; no local ambiguo. | Creación y comparación. | Rechazo. | `[MOD]` §16 | Confirmado; formato limitado |
| `INV-VO-IDK-01…05` | `IdempotencyKey` | No vacía; única en ámbito; inmutable; repetición compatible sin duplicar; repetición incompatible rechazada. | Inicio de operación y reintento. | Duplicación o conflicto. | `[MOD]` §8.2.3, §8.3, §11.1, §14.2, §16 | Confirmado; conflicto derivado |
| `INV-VO-CORR-01…04` | `CorrelationId` | No vacío; agrupa; no sustituye identidad; inmutable. | Inicio y propagación de flujo. | Pérdida de trazabilidad. | `[MOD]` §15.1, §16 | Confirmado |
| `INV-VO-ROL-01…05` | `RolSistema` | Un rol por cuenta; código válido; no concede todo; cambio auditado; no comprador+vendedor. | Creación y cambio de rol. | Rechazo o incidente de autorización. | `[MOD]` §6.2, §16, §19 | Confirmado |
| `INV-VO-TENT-01…04` | `TipoEntrega` | Código válido; coherente con subtipo; físico exige logística; digital no crea envío. | Creación de producto y checkout. | Rechazo o flujo incorrecto. | `[MOD]` §7.1–§7.4, §10.2, §16 | Confirmado |
| `INV-VO-TBOD-01…03` | `TipoBodega` | Código válido; vendedor exige propietario; marketplace no tiene propietario vendedor. | Creación de bodega. | Rechazo. | `[MOD]` §8.1, §16 | Confirmado |
| `INV-VO-CAT-01…03` | `CategoriaProducto` | Código válido; ampliación controlada; `DIGITAL` no fuerza tipo digital. | Creación de producto y publicación. | Rechazo. | `[MOD]` §7.5, §16 | Confirmado |
| `INV-VO-EUSR-01…04` | `EstadoUsuario` | Código válido; inactivo/bloqueado no opera; transiciones válidas; sin eliminación lógica. | Cambio de estado y autorización. | Rechazo o incidente de acceso. | `[MOD]` §6.1, §16 | Confirmado; estado inicial limitado |
| `INV-VO-ECOM-01…04` | `EstadoComercial` | Código válido; restringido no crea pedidos; no borra historial; obligatorio. | Checkout y consulta. | Rechazo de pedido. | `[MOD]` §6.3, §16 | Confirmado; proceso limitado |
| `INV-VO-EVEND-01…05` | `EstadoVendedor` | Código válido; suspendido no publica/inicia ventas; obligaciones se resuelven; incorporación con bodega; sin autorregistro. | Incorporación, publicación y venta. | Rechazo o incumplimiento operativo. | `[MOD]` §6.4, §16 | Confirmado; transiciones limitadas |
| `INV-VO-EPROD-01…05` | `EstadoProducto` | Código válido; suspendido no se vende; descontinuado no vuelve; publicado con variante; snapshots inmutables. | Publicación, venta y consulta histórica. | Rechazo. | `[MOD]` §7.1, §16 | Confirmado |
| `INV-VO-EVAR-01…03` | `EstadoVariante` | Código válido; inactiva no se vende; pertenece a producto. | Venta. | Rechazo. | `[MOD]` §7.4, §16 | Confirmado; transiciones limitadas |
| `INV-VO-EBOD-01…04` | `EstadoBodega` | Código válido; inactiva no recibe/reserva; stock debe resolverse; no se ignora stock. | Reserva, ingreso y cierre. | Rechazo. | `[MOD]` §8.1, §16 | Confirmado; transiciones limitadas |
| `INV-VO-EPED-01…07` | `EstadoPedido` | Código válido; transiciones válidas; `CARRITO` no es estado; `ENTREGADO`≠`CERRADO`; cerrado inmutable; entrega global completa; `FINALIZADO` legado. | Cada transición. | Rechazo o estado imposible. | `[MOD]` §10.3, §16 | Confirmado |
| `INV-VO-EPAG-01…07` | `EstadoPago` | Código válido; captura verificada; no doble captura; rechazo no se sobrescribe; reembolso no excede; transición única; `APROBADO` legado. | Pago, confirmación y reembolso. | Rechazo o inconsistencia financiera. | `[MOD]` §11.1, §16 | Confirmado |
| `INV-VO-EFAC-01…05` | `EstadoFactura` | Código válido; emitida inmutable; corrección enlazada; emisión tras pago salvo política; numeración única. | Emisión, anulación y corrección. | Rechazo o inconsistencia documental. | `[MOD]` §12.1, §16 | Confirmado |
| `INV-VO-EENV-01…06` | `EstadoEnvio` | Código válido; solo pedido pagado; salida al despachar; entrega con evidencia; fallo≠devolución; un pedido y una bodega. | Preparación, despacho y entrega. | Rechazo o inconsistencia logística. | `[MOD]` §13.1, §16 | Confirmado; transiciones limitadas |
| `INV-VO-EDEV-01…07` | `EstadoDevolucion` | Código válido; propiedad; cantidades; no autoaprobación; no reapertura; recepción antes de reingreso; digital sin inventario. | Solicitud, revisión y resolución. | Rechazo o inconsistencia posventa. | `[MOD]` §14.1, §14.3, §16 | Confirmado |
| `INV-VO-EREE-01…06` | `EstadoReembolso` | Código válido; importe positivo y acotado; aprobación autorizada; fallo≠completado; idempotencia; no excede capturado. | Solicitud, aprobación y ejecución. | Rechazo o inconsistencia financiera. | `[MOD]` §14.2, §16 | Confirmado |
| `INV-VO-TMOV-01…06` | `TipoMovimientoInventario` | Código válido; cantidad positiva; referencia/actor/timestamp/idempotencia; motivo en ajustes; no saldo inválido; no edición. | Cada movimiento. | Rechazo o inconsistencia de stock. | `[MOD]` §8.2.2, §16 | Confirmado |
| `INV-VO-ERES-01…05` | `EstadoReserva` | Código válido; consumo/liberación única; estados terminales; expirada no se consume; solo sobre bodega/variante elegibles. | Creación, consumo, liberación y expiración. | Rechazo o inconsistencia de stock. | `[MOD]` §8.2.3, §16 | Confirmado |
| `INV-VO-GRAV-01…03` | `GravedadAuditoria` | Código válido; no sustituye resultado; crítico con correlación y actor. | Registro de auditoría. | Evento mal clasificado. | `[MOD]` §15.1, §16 | Confirmado; asignación por política |
| `INV-VO-RES-01…03` | `ResultadoAuditoria` | Código válido; rechazo≠error; error≠éxito. | Registro de auditoría. | Evento mal clasificado. | `[MOD]` §15.1 | Confirmado |
| `INV-VO-CODEV-01…03` | `CodigoEvento` | No vacío; catálogo versionado; significado estable. | Registro de auditoría. | Evento no consultable. | `[MOD]` §15.1 | Parcialmente especificado |
| `INV-VO-MOTM-01…03` | `MotivoMovimiento` | Obligatorio en ajustes/bajas; no vacío; no sustituye referencia ni autorización. | Ajuste o baja. | Rechazo. | `[MOD]` §8.3 | Parcialmente especificado |
| `INV-VO-MOTD-01…03` | `MotivoDevolucion` | Obligatorio; catálogo; no decide por sí solo. | Solicitud de devolución. | Rechazo. | `[MOD]` §14.1 | Parcialmente especificado |
| `INV-VO-MOTR-01…03` | `MotivoReembolso` | Obligatorio; no vacío; no sustituye aprobación/saldo. | Solicitud o aprobación. | Rechazo. | `[MOD]` §14.2 | Parcialmente especificado |
| `INV-VO-EMIS-01…03` | `DatosEmisorSnapshot` | Inmutable; creado al emitir; no recalculado. | Emisión de factura. | Inconsistencia documental. | `[MOD]` §12.1 | Parcialmente especificado |
| `INV-VO-RECEP-01…03` | `DatosReceptorSnapshot` | Inmutable; creado al emitir; no recalculado. | Emisión de factura. | Inconsistencia documental. | `[MOD]` §12.1 | Parcialmente especificado |
| `INV-VO-AUDP-01…04` | `AuditPayload` | Sin secretos; mínimo; inmutable; no sustituye estado. | Construcción de auditoría. | Incidente de seguridad o pérdida de trazabilidad. | `[MOD]` §15.1 | Parcialmente especificado |
| `INV-VO-TREF-01…03` | `TipoReferencia` | Código permitido; con `referenciaId`; no sustituye tipo de movimiento. | Movimiento de inventario. | Rechazo o trazabilidad incompleta. | `[MOD]` §8.3 | Parcialmente especificado |

---

## 13. Matriz de trazabilidad

| Requisito/objetivo | Concepto del modelo | Objetos de valor | Servicios relacionados | Fuente | Estado |
|---|---|---|---|---|---|
| OBJ-01 Administrar usuarios | `Usuario`, `RolSistema`, `EstadoUsuario` | `UsuarioId`, `NombreCompleto`, `CorreoElectronico`, `DocumentoIdentidad`, `HashCredencial`, `RolSistema`, `EstadoUsuario`, `Instant` | `DS-01`, `DS-09` | `[ENU]` OBJ-01; `[MOD]` §6.1–§6.2 | Alineado |
| OBJ-02/03 Compradores y vendedores | `PerfilComprador`, `PerfilVendedor` | `CompradorId`, `VendedorId`, `EstadoComercial`, `NombreComercial`, `EstadoVendedor`, `Direccion` | `DS-01`, `DS-02`, `DS-07` | `[ENU]` Dominios 2 y 3; `[MOD]` §6.3–§6.4 | Alineado |
| OBJ-04 Controlar bodegas | `Bodega`, `BodegaMarketplace`, `BodegaVendedor` | `BodegaId`, `NombreBodega`, `DireccionFisica`, `TipoBodega`, `EstadoBodega` | `DS-01`, `DS-03`, `DS-04` | `[ENU]` Dominio 4; `[MOD]` §8.1 | Alineado; composición de dirección limitada |
| OBJ-05 Gestionar catálogo | `Producto`, `Variante` | `ProductoId`, `NombreProducto`, `CategoriaProducto`, `EstadoProducto`, `TipoEntrega`, `VarianteId`, `NombreVariante`, `SKU`, `EstadoVariante`, `Dinero` | `DS-02`, `DS-05` | `[ENU]` Dominio 5; `[MOD]` §7 | Alineado |
| OBJ-06 Administrar inventario | `Inventario`, `ReservaInventario`, `MovimientoInventario` | `InventarioId`, `Cantidad`, `CantidadPositiva`, `EstadoReserva`, `TipoMovimientoInventario`, `MotivoMovimiento`, `TipoReferencia`, `IdempotencyKey` | `DS-03`, `DS-04` | `[ENU]` Dominio 6; `[MOD]` §8 | Alineado |
| OBJ-07 Gestionar carrito | `Carrito`, `ItemCarrito` | `CarritoId`, `CantidadPositiva`, `Dinero` | `DS-05` | `[ENU]` Dominio 7; `[MOD]` §9 | Alineado |
| OBJ-08 Controlar pedidos | `Pedido`, `ItemPedido` | `PedidoId`, `CheckoutGroupId`, `ItemPedidoId`, `EstadoPedido`, `EstadoPago`, `Dinero`, `DireccionSnapshot`, `Instant` | `DS-05`, `DS-06` | `[ENU]` Dominio 7; `[MOD]` §10 | Alineado |
| OBJ-09 Administrar facturación | `Factura` | `FacturaId`, `EstadoFactura`, `DatosEmisorSnapshot`, `DatosReceptorSnapshot`, `Dinero` | `DS-06` | `[ENU]` Dominio 9; `[MOD]` §12 | Alineado; composición fiscal limitada |
| OBJ-10 Gestionar logística | `Envio` | `EnvioId`, `EstadoEnvio`, `DireccionSnapshot`, `Instant` | `DS-04`, `DS-06` | `[ENU]` Dominio 10; `[MOD]` §13 | Alineado |
| OBJ-11 Devoluciones y reembolsos | `Devolucion`, `Reembolso` | `DevolucionId`, `EstadoDevolucion`, `MotivoDevolucion`, `ReembolsoId`, `EstadoReembolso`, `MotivoReembolso`, `Dinero`, `IdempotencyKey` | `DS-07`, `DS-08` | `[ENU]` Dominio 11; `[MOD]` §14 | Alineado; catálogos de motivos limitados |
| OBJ-12 Información administrativa | `RegistroAuditoria` | `AuditId`, `CodigoEvento`, `GravedadAuditoria`, `ResultadoAuditoria`, `CorrelationId`, `AuditPayload`, `Instant` | `DS-09` | `[ENU]` OBJ-12; `[MOD]` §15 | Alineado |
| RG-01/RG-02/RG-03 Autorización | `Usuario`, roles y recursos | `RolSistema`, `EstadoUsuario`, `EstadoComercial`, `EstadoVendedor`, `EstadoProducto`, `EstadoBodega`, identificadores | `DS-01` | `[ENU]` RG-01–RG-03; `[MOD]` §19 | Alineado |
| CAT-01…CAT-07 Catálogo | `Producto`, `Variante` | `SKU`, `Dinero`, `EstadoProducto`, `EstadoVariante`, `TipoEntrega`, `CategoriaProducto` | `DS-02` | `[MOD]` §7.1, §21 | Alineado |
| INV-01…INV-10 Inventario | `Inventario`, `ReservaInventario`, `MovimientoInventario` | `Cantidad`, `CantidadPositiva`, `EstadoReserva`, `TipoMovimientoInventario`, `IdempotencyKey`, `MotivoMovimiento` | `DS-03` | `[MOD]` §8.2, §21 | Alineado |
| ORD-01…ORD-08 Pedido | `Pedido`, `Pago`, `Envio` | `EstadoPedido`, `EstadoPago`, `EstadoEnvio`, `DireccionSnapshot` | `DS-06` | `[MOD]` §10.3, §21 | Alineado |
| RET-01/RET-02 Devolución | `Devolucion`, `Pedido` | `EstadoDevolucion`, `MotivoDevolucion`, `CantidadPositiva` | `DS-07` | `[MOD]` §14.1, §21 | Alineado |
| REF-01 Reembolso | `Reembolso`, `Pago` | `EstadoReembolso`, `Dinero`, `IdempotencyKey`, `MotivoReembolso` | `DS-08` | `[MOD]` §14.2, §21 | Alineado |
| AUD-01…AUD-06 Auditoría | `RegistroAuditoria` | `CodigoEvento`, `GravedadAuditoria`, `ResultadoAuditoria`, `CorrelationId`, `AuditPayload` | `DS-09` | `[MOD]` §15, §21 | Alineado |

---

## 14. Verificación del documento

### 14.1 Lista de comprobación

- [x] El propósito y el alcance están delimitados.
- [x] Se distingue objeto de valor de entidad, identificador, atributo primitivo, DTO, persistencia e infraestructura.
- [x] Cada objeto de valor tiene identificador estable y nombre canónico.
- [x] Cada objeto de valor tiene definición, propósito, componentes, igualdad, invariantes, validación, creación, rechazo, operaciones, inmutabilidad, relaciones, servicios, dependencias, ejemplos, trazabilidad y estado.
- [x] Los identificadores se agrupan en una familia con especializaciones nominales y no se duplican.
- [x] Los nombres se agrupan en una familia con semántica por campo y no se duplican.
- [x] Los catálogos controlados usan los códigos del modelo y no se traducen.
- [x] `TipoEntrega` se usa como nombre canónico; `MetodoEntrega` se identifica como legado.
- [x] `RolSistema` se usa como nombre canónico; `SystemRole` se identifica como legado.
- [x] `EstadoPedido` excluye `CARRITO` y normaliza `FINALIZADO` como `CERRADO`.
- [x] `EstadoPago` usa `AUTORIZADO`/`CAPTURADO` y no `APROBADO`.
- [x] `EstadoReserva` documenta `ACTIVA`, `CONSUMIDA`, `LIBERADA` y `EXPIRADA` con consumo/liberación única.
- [x] No se fijan límites, monedas, plazos, tasas, formatos o catálogos sin evidencia.
- [x] Las limitaciones están registradas y separadas de los requisitos.
- [x] No se introducen puertos, adaptadores, contratos ni código.
- [x] Las relaciones con entidades y servicios están explicadas.
- [x] La matriz de invariantes usa identificadores estables.
- [x] La matriz de trazabilidad cubre los objetivos funcionales y las reglas principales.
- [x] Los enlaces relativos apuntan a archivos existentes o a decisiones registradas.

### 14.2 Verificación cruzada con Domain Services

| Comprobación | Resultado |
|---|---|
| Los nombres de VOs usados en `[DS]` coinciden con este catálogo. | Alineado; verificado contra `nexusmarket-domain-services.md` §9.2. |
| Las reglas de `DS-03` sobre inventario coinciden con `Cantidad`, `CantidadPositiva`, `EstadoReserva`, `TipoMovimientoInventario` e `IdempotencyKey`. | Alineado. |
| Las reglas de `DS-05` sobre dinero coinciden con `Dinero`. | Alineado. |
| Las reglas de `DS-06` sobre pedido coinciden con `EstadoPedido`, `EstadoPago` y `EstadoEnvio`. | Alineado. |
| Las reglas de `DS-07` y `DS-08` coinciden con `EstadoDevolucion`, `EstadoReembolso`, `MotivoDevolucion` y `MotivoReembolso`. | Alineado. |
| Las reglas de `DS-09` coinciden con `CodigoEvento`, `GravedadAuditoria`, `ResultadoAuditoria`, `CorrelationId` y `AuditPayload`. | Alineado. |
| Ningún servicio redefine un VO con otro nombre. | Verificado en ambos documentos; sin duplicados. |

### 14.3 Riesgos residuales

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Composición de `Direccion` no definida. | No puede implementarse una validación completa ni una igualdad exacta. | `DEC-BIZ-01`; el contrato de entrada debe fijar los campos. |
| Escala, moneda y redondeo no definidos. | Cálculos no reproducibles entre implementaciones. | `DEC-BIZ-05`; `DS-05` debe recibir la política. |
| Catálogos de motivos no definidos. | Devoluciones y reembolsos no pueden validar pertenencia. | `DEC-BIZ-03`. |
| Límites de longitud no definidos. | Validación de nombres incompleta. | El contrato de entrada debe fijarlos; el VO rechaza truncamientos. |
| Formatos de documento e identificador no definidos. | Validación técnica incompleta. | Decisión de arquitectura/persistencia; el dominio mantiene opacidad. |
| Estado inicial de varias entidades no definido. | Puede implementarse un estado inicial inconsistente. | La política de registro/incorporación debe fijarlo; se registra como limitación. |

---

## 15. Registro de decisiones locales

| ID | Decisión | Justificación | Consecuencia |
|---|---|---|---|
| `VO-D-01` | Agrupar identificadores en `IdentificadorTipado` con especializaciones. | Evita duplicación y conserva la seguridad de tipos. | Tabla de identificadores concretos. |
| `VO-D-02` | Agrupar nombres en una familia con reglas compartidas. | Comparten invariantes y difieren en semántica. | Tabla por campo y reglas específicas. |
| `VO-D-03` | Adoptar recorte y colapso de espacios en nombres. | `[MOD]` exige espacios normalizados. | Normalización uniforme; no se fija límite. |
| `VO-D-04` | Adoptar recorte y minúsculas en correo. | `[ARQ]` muestra la práctica y `[MOD]` exige normalización consistente. | Unicidad comparable; no se fija formato exacto. |
| `VO-D-05` | No admitir importes negativos en `Dinero`. | El modelo no usa importes negativos y los totales nunca son negativos. | Los campos que requieren `> 0` lo validan; los reembolsos usan importes positivos con tipo. |
| `VO-D-06` | Tratar `MetodoEntrega` y `SystemRole` como sinónimos legados. | El modelo 2.0 usa `TipoEntrega` y `RolSistema`. | No se crean VOs duplicados. |
| `VO-D-07` | No definir composición de direcciones, datos fiscales ni payload de auditoría. | No hay evidencia suficiente. | Se documentan como parcialmente especificados. |

---

## 16. Cierre

Este catálogo es la referencia canónica de objetos de valor para NexusMarket en la línea base 2.0. Cualquier cambio futuro en un VO debe actualizar simultáneamente:

1. Este documento.
2. `[MOD]` si cambia el modelo.
3. `[DS]` si cambia una regla aplicada por un servicio.
4. Los futuros casos de uso, puertos y contratos que consuman el VO.
5. `DOCUMENTATION_STATUS.md`.

No se considera completo un cambio que introduzca un VO nuevo sin trazabilidad, que duplique un concepto existente o que fije una política de negocio no aprobada.

