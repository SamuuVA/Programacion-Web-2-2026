# NEXUSMARKET — Input Ports

**Propósito:** definir los contratos de entrada de la capa de aplicación de NEXUSMARKET, es decir, las capacidades que los adaptadores de entrada pueden invocar y que la aplicación implementa coordinando dominio, puertos de salida y transacciones.

**Ámbito:** exclusivamente Input Ports. Este documento no define endpoints HTTP, controladores, DTOs de transporte, adaptadores, casos de uso implementados, servicios de aplicación concretos ni código. Tampoco sustituye al Domain Model, a los Domain Services ni a la arquitectura.

**Estado:** `COMPLETO`, con las limitaciones de fuente registradas en §9. La marca `COMPLETO` significa que el inventario está justificado, que cada puerto tiene sus diez puntos y que las decisiones y vacíos están diferenciados; no significa que el negocio haya aprobado las políticas pendientes.

**Última actualización:** 26 de octubre de 2026.

**Raíz documental:** `BackendSDD/`.

**Documento hermano:** `BackendSDD/Application/nexusmarket-output-ports.md`.

**Fuentes y abreviaturas:**

| Abreviatura | Fuente | Uso en este documento |
|---|---|---|
| `[ENU]` | `BackendSDD/enunciado.md` | Objetivos funcionales OBJ-01…OBJ-12 y restricciones del negocio. |
| `[MOD]` | `BackendSDD/Domain/nexusmarket-domain-model.md` | Agregados, invariantes, estados, escenarios y reglas. |
| `[VO]` | `BackendSDD/Domain/nexusmarket-domain-object-values.md` | Objetos de valor, catálogos e invariantes. |
| `[DS]` | `BackendSDD/Domain/nexusmarket-domain-services.md` | Servicios y políticas de dominio DS-01…DS-09. |
| `[ARQ]` | `BackendSDD/Software Architecture/nexusmarket-arquitectura.md` | Capas, módulos, puertos, dependencias y persistencia. |
| `[PM]` | `BackendSDD/Prompt-maestro-documentacion.md` | Criterios documentales y de calidad. |

**Convenciones:**

- Los nombres canónicos de los puertos se expresan en inglés, como en `[ARQ]` §7.2; las descripciones, contratos y relaciones se expresan en español técnico.
- Cada puerto tiene un identificador estable `PI-01`…`PI-25` y una sección propia con los diez puntos solicitados.
- Los estados de cada puerto se clasifican como `Confirmado` (respaldado directamente por una fuente), `Inferido` (derivado de responsabilidades y reglas documentadas) o `Limitado` (el contrato existe, pero una política o detalle externo no está definido).
- Los contratos son conceptuales. No se prescriben firmas TypeScript, clases, rutas HTTP, códigos HTTP ni estructuras de persistencia.
- Las referencias a rutas de código son ubicaciones arquitectónicas propuestas, no archivos creados por esta tarea.

---

## 1. Alcance y límites

Este documento responde a una sola pregunta: **¿qué capacidades de aplicación puede solicitar un actor o adaptador de entrada, con qué datos, resultados, errores, precondiciones y límites?**

No responde a:

- qué ruta HTTP, comando de consola o mensaje externo invoca cada capacidad;
- cómo se implementa el caso de uso;
- cómo se almacenan los datos;
- cómo se integra un proveedor concreto;
- qué reglas de negocio pertenecen al dominio (esas reglas se invocan, no se duplican).

La capa de aplicación, según `[ARQ]` §7.1, recibe el comando o consulta, verifica identidad y autorización, recupera entidades mediante puertos de salida, invoca comportamiento de dominio, coordina la transacción, persiste e integra, y devuelve un resultado o error significativo. Los puertos de entrada son la frontera de esa coordinación.

---

## 2. Ubicación y reglas de dependencia

### 2.1 Ubicación documental

Los dos catálogos de puertos se ubican en `BackendSDD/Application/` porque la arquitectura asigna los puertos a la capa de aplicación y porque `BackendSDD/` es la raíz documental vigente. No existe una carpeta `Application/` previa; se crea como ubicación de esta familia documental, sin mover ni duplicar documentos de dominio.

### 2.2 Ubicación arquitectónica propuesta

| Tipo de puerto | Ubicación propuesta | Fundamento |
|---|---|---|
| Puerto de entrada de un módulo | `src/modules/<módulo>/application/ports/<nombre>.port.ts` | `[ARQ]` §4 organiza cada módulo con `domain`, `application` y `adapters`; §7.2 ubica los casos de uso en la capa de aplicación. |
| Puerto de entrada compartido | `src/shared/application/ports/<nombre>.port.ts` | `[ARQ]` §4 reserva `shared/application/ports/` para capacidades transversales. |
| Implementación del caso de uso | `src/modules/<módulo>/application/use-cases/` | `[ARQ]` §7.1; no forma parte de este documento. |
| Adaptador de entrada | `src/modules/<módulo>/adapters/http/` u otro adaptador | `[ARQ]` §8; no forma parte de este documento. |

**Decisión de ubicación:** se adopta `application/ports/` para los puertos, conforme a `[ARQ]` §4, §7 y §16. El ejemplo de `[ARQ]` §9.3 que muestra `modules/catalog/domain/product-repository.ts` se considera ilustrativo y no se adopta como regla: un repositorio es un puerto de salida consumido por la aplicación, no una dependencia del dominio. Esta discrepancia se registra como `C-15` en `DOCUMENTATION_STATUS.md`; no se modifica la arquitectura.

### 2.3 Dirección de dependencias

1. Los adaptadores de entrada dependen de los puertos de entrada.
2. Los casos de uso implementan los puertos de entrada y dependen del dominio y de los puertos de salida.
3. El dominio no depende de puertos, adaptadores, DTOs ni infraestructura.
4. Los adaptadores de salida implementan los puertos de salida.
5. El punto de composición construye las implementaciones concretas.
6. Un puerto de entrada no contiene SQL, consultas documentales, llamadas HTTP ni reglas de negocio duplicadas.

---

## 3. Inventario canónico

| ID | Puerto | Módulo | Capacidad | Origen | Estado |
|---|---|---|---|---|---|
| `PI-01` | `RegisterBuyer` | `buyers` | Registrar comprador, perfil y carrito inicial. | `[ARQ]` §7.2; `[MOD]` §6.1, §6.3, §9.1 | Confirmado; estados y credenciales aprobados (`DEC-W1-007`/`DEC-W1-008`) |
| `PI-02` | `RegisterSeller` | `sellers` | Incorporar vendedor y primera bodega. | `[ARQ]` §7.2; `[MOD]` §6.4, §22.1 | Confirmado; estados/credenciales aprobados; limitado por L-01 (dirección) |
| `PI-03` | `ManageOwnProfile` | `identity` | Consultar y actualizar el perfil propio. | Inferido de `[ENU]` OBJ-01…OBJ-03; `[MOD]` §6.1–§6.4 | Inferido; limitado por L-01 |
| `PI-04` | `ManageUser` | `identity` | Activar, desactivar, bloquear o desbloquear cuentas. | `[MOD]` §6.1; `[ENU]` OBJ-01 | Confirmado |
| `PI-05` | `CreateProduct` | `catalog` | Crear producto y variantes en estado no publicado. | `[ARQ]` §7.2; `[MOD]` §7.1, §7.4 | Confirmado |
| `PI-06` | `ManageProductPublication` | `catalog` | Publicar, suspender, reanudar o descontinuar. | `[ARQ]` §7.2 (`PublishProduct`); `[MOD]` §7.1 | Confirmado |
| `PI-07` | `QueryCatalog` | `catalog` | Consultar catálogo público o administrativo. | `[ENU]` OBJ-05; `[MOD]` §7.1 | Inferido |
| `PI-08` | `ManageWarehouse` | `warehouses` | Crear, actualizar o desactivar bodegas. | `[ENU]` OBJ-04; `[MOD]` §8.1 | Inferido; limitado por L-01 |
| `PI-09` | `AdjustInventory` | `inventory` | Registrar ingreso, ajuste o baja de existencias. | `[ARQ]` §7.2; `[MOD]` §8.2 | Confirmado |
| `PI-10` | `QueryInventory` | `inventory` | Consultar posiciones de inventario. | `[ENU]` OBJ-06; `[MOD]` §8.2 | Inferido |
| `PI-11` | `ManageCart` | `cart` | Agregar, modificar, quitar y consultar el carrito. | `[ARQ]` §7.2 (`AddCartItem`); `[MOD]` §9.1–§9.3 | Confirmado; agrupado |
| `PI-12` | `Checkout` | `orders` | Confirmar la compra y crear pedidos/pago. | `[ARQ]` §7.2; `[MOD]` §9.4, §22.3–§22.4 | Confirmado; limitado por L-01, L-04, L-05, L-07, L-22 |
| `PI-13` | `QueryOrder` | `orders` | Consultar pedidos según alcance autorizado. | `[ENU]` OBJ-08, OBJ-12; `[MOD]` §10 | Inferido |
| `PI-14` | `CancelOrder` | `orders` | Cancelar un pedido antes de confirmar el pago. | `[MOD]` §10.3–§10.4 | Confirmado |
| `PI-15` | `ConfirmPayment` | `payments` | Registrar el resultado verificado de un pago. | `[ARQ]` §7.2; `[MOD]` §11.1 | Confirmado; limitado por L-22 |
| `PI-16` | `PrepareShipment` | `shipping` | Asignar bodega y preparar/empacar un envío. | `[MOD]` §13.1–§13.2 | Inferido |
| `PI-17` | `DispatchOrder` | `shipping` | Despachar, consumir reservas y registrar salida. | `[ARQ]` §7.2; `[MOD]` §13.2 | Confirmado |
| `PI-18` | `ConfirmDelivery` | `shipping` | Registrar entrega o fallo de entrega. | `[MOD]` §13.1–§13.2 | Inferido |
| `PI-19` | `IssueInvoice` | `billing` | Emitir la factura de un pedido pagado. | `[ENU]` OBJ-09; `[MOD]` §12.1 | Inferido; limitado por L-17, L-11 |
| `PI-20` | `CorrectInvoice` | `billing` | Anular o corregir una factura emitida. | `[MOD]` §12.1; `[VO]` §8.13 | Inferido; limitado por L-17 |
| `PI-21` | `RequestReturn` | `returns` | Solicitar una devolución elegible. | `[ARQ]` §7.2; `[MOD]` §14.1 | Confirmado; plazo aprobado (`DEC-W1-002`); limitado por L-10 |
| `PI-22` | `ResolveReturn` | `returns` | Revisar, aprobar, rechazar, recibir y resolver. | `[MOD]` §14.1, §14.3 | Inferido; plazo aprobado (`DEC-W1-002`); limitado por L-10, L-18 |
| `PI-23` | `ProcessRefund` | `refunds` | Solicitar, aprobar y ejecutar un reembolso. | `[ARQ]` §7.2; `[MOD]` §14.2 | Confirmado; limitado por L-04, DEC-BIZ-07 |
| `PI-24` | `GenerateAdministrativeReport` | `reporting` | Generar reportes administrativos autorizados. | `[ARQ]` §7.2; `[ENU]` OBJ-12 | Confirmado; limitado por L-19 |
| `PI-25` | `QueryAuditLog` | `reporting` | Consultar registros de auditoría autorizados. | `[MOD]` §15.1; `[ENU]` OBJ-12 | Inferido; limitado por L-11, L-14, L-15 |

**Cobertura:** los doce objetivos funcionales de `[ENU]` tienen al menos un puerto de entrada. Los trece nombres candidatos de `[ARQ]` §7.2 están representados o explícitamente subsumidos; los descartes se justifican en §6.

---

## 4. Convenciones de contrato

### 4.1 Contexto de invocación

Todo puerto protegido recibe, además de sus datos propios, un contexto de invocación que el adaptador de entrada construye a partir de la identidad ya autenticada:

| Dato | Obligatorio | Uso |
|---|---:|---|
| `actorId` | Sí, salvo registro público | Identidad del actor que solicita la capacidad. |
| `rolActor` | Sí, salvo registro público | `RolSistema` del actor. |
| `correlationId` | Sí | Agrupa la operación y su auditoría. |
| `motivo` | Condicional | Obligatorio en operaciones privilegiadas o excepcionales. |
| `idempotencyKey` | Condicional | Obligatorio en las capacidades marcadas en §4.4. |
| `versionEsperada` | Condicional | Control de concurrencia en agregados versionados. |

El puerto no autentica, no valida tokens, no lee encabezados HTTP y no crea sesiones. La autenticación pertenece al adaptador de entrada y a la infraestructura de identidad; la autorización de negocio se decide con `DS-01`.

### 4.2 Resultado de aplicación

Los puertos devuelven un resultado conceptual con tres desenlaces:

| Resultado | Contenido | Significado |
|---|---|---|
| `EXITO` | Datos de salida del puerto. | La operación se completó y sus efectos son los declarados. |
| `RECHAZO` | `codigo`, `mensaje` seguro, `detalles` opcionales. | Una regla de negocio, validación, autorización, estado o conflicto impidió la operación; no se aplicaron efectos parciales. |
| `ERROR` | `codigo`, `mensaje` seguro, `correlationId`. | Fallo técnico o de dependencia; no se exponen detalles internos al cliente. |

Un `RECHAZO` no es un fallo técnico. Un `ERROR` no se usa para ocultar una regla de negocio. Los adaptadores traducen ambos a su protocolo, pero el puerto no prescribe códigos HTTP.

### 4.3 Catálogo común de errores

| Código | Significado | Uso típico |
|---|---|---|
| `VALIDACION_INVALIDA` | Un dato obligatorio falta o no cumple su tipo/regla. | Campos vacíos, cantidades no positivas, filtros inválidos. |
| `IDENTIDAD_AUSENTE` | No se recibió identidad de actor en una capacidad protegida. | Invocación directa sin contexto. |
| `NO_AUTORIZADO` | El actor no puede ejecutar la capacidad o no tiene alcance sobre el recurso. | `DS-01` deniega. |
| `RECURSO_NO_ENCONTRADO` | El recurso referido no existe o no es visible para el actor. | Identificador inexistente. |
| `CONFLICTO_UNICIDAD` | Ya existe otro recurso con el mismo valor único. | Correo, documento, SKU, número de factura. |
| `CONFLICTO_CONCURRENCIA` | El recurso cambió desde la versión leída. | Dos operaciones simultáneas. |
| `TRANSICION_INVALIDA` | El estado actual no permite la operación. | Cancelar un pedido pagado, publicar un descontinuado. |
| `REGLA_NEGOCIO_INCUMPLIDA` | Una invariante o política de dominio impide la operación. | Stock insuficiente, reembolso excesivo. |
| `IDEMPOTENCIA_CONFLICTO` | La misma clave se usó con datos distintos. | Reintento con otro importe. |
| `DEPENDENCIA_NO_DISPONIBLE` | Un puerto de salida o proveedor externo no respondió. | Pago, transporte, persistencia. |
| `OPERACION_NO_SOPORTADA` | La acción solicitada no pertenece al contrato. | Acción desconocida. |
| `LIMITE_EXCEDIDO` | Se superó un límite documentado o configurado. | Paginación o cantidades fuera de rango. |

Los errores específicos de cada puerto se añaden en su punto 6 y reutilizan estos códigos cuando aplica.

### 4.4 Autorización, idempotencia y concurrencia

- **Autorización:** toda capacidad protegida invoca `DS-01` con actor, rol, estado de cuenta, capacidad, recurso y vínculo. El Supervisor es de solo lectura. Las operaciones privilegiadas exigen motivo y auditoría.
- **Idempotencia obligatoria:** `PI-09` (`AdjustInventory`), `PI-12` (`Checkout`), `PI-15` (`ConfirmPayment`), `PI-17` (`DispatchOrder`), `PI-18` (`ConfirmDelivery`), `PI-23` (`ProcessRefund`). La repetición con los mismos datos devuelve el mismo resultado sin duplicar efectos; con datos distintos devuelve `IDEMPOTENCIA_CONFLICTO`.
- **Concurrencia:** `PI-09`, `PI-11`, `PI-12`, `PI-14`, `PI-15`, `PI-17`, `PI-18`, `PI-22` y `PI-23` usan versión esperada o control equivalente. Un conflicto devuelve `CONFLICTO_CONCURRENCIA` y no aplica efectos parciales.
- **Transacciones:** las operaciones que afectan varios agregados se ejecutan en una unidad de trabajo; los efectos externos no se incluyen en la transacción de base de datos y se coordinan con outbox o compensación.

### 4.5 Consultas, paginación y filtros

`PI-07`, `PI-10`, `PI-13`, `PI-24` y `PI-25` son consultas: no mutan estado. Aceptan filtros y paginación conceptuales. Los límites numéricos de página, tamaño máximo y orden por defecto no están fijados por las fuentes; se registran como `L-19` y deben definirse en el contrato externo, no en el dominio.

---

## 5. Especificaciones

Las secciones se agrupan por módulo. El orden no implica prioridad de implementación. Cada puerto declara su ubicación documental (esta sección) y su ubicación arquitectónica propuesta.

### 5.1 Módulo `identity` y registro de perfiles

#### PI-01 — `RegisterBuyer`

**1. Identificación.** `PI-01`, `RegisterBuyer`, módulo `buyers`. Documentación: §5.1 de este documento. Ubicación propuesta: `src/modules/buyers/application/ports/register-buyer.port.ts`. Propósito: registrar una cuenta de comprador y crear, de forma consistente, su perfil comercial y su carrito activo.

**2. Responsabilidad.** Validar la unicidad de correo y documento, crear un `Usuario` con rol `COMPRADOR`, crear un `PerfilComprador` y un `Carrito` vacío, registrar la auditoría y encolar el evento correspondiente. Satisface OBJ-03 y el escenario de registro de comprador.

**3. Consumidores previstos.** Adaptador de registro público (actor no autenticado); adaptadores de prueba. Un Administrador no usa este puerto para crear compradores: la administración de cuentas existentes corresponde a `PI-04`.

**4. Contrato de entrada.**

| Campo | Obligatorio | Tipo conceptual | Regla |
|---|---:|---|---|
| `nombreCompleto` | Sí | `NombreCompleto` | No vacío; espacios normalizados; longitud máxima no fijada (L-02). |
| `correoElectronico` | Sí | `CorreoElectronico` | Formato válido; único tras normalización (USR-01). |
| `documentoIdentidad` | Sí | `DocumentoIdentidad` | Único en la plataforma (USR-02); formato exacto limitado (L-03). |
| `credencial` | Sí | Texto secreto de entrada | Solo se usa para producir `HashCredencial`; nunca se persiste, registra ni audita en claro. |
| `correlationId` | Sí | `CorrelationId` | Agrupa el registro y su auditoría. |

No se exige dirección en el registro: `PerfilComprador.direcciones` puede estar vacío al crear la cuenta. La dirección se gestiona en `PI-03`.

**5. Contrato de salida.**

| Resultado | Contenido | Condición |
|---|---|---|
| `EXITO` | `usuarioId`, `compradorId`, `carritoId`, `estadoUsuario`, `estadoComercial`, `correoNormalizado` | Cuenta, perfil y carrito creados consistentemente. |
| `RECHAZO` | `codigo`, `mensaje`, `detalles` | Validación, unicidad o política de registro. |
| `ERROR` | `codigo`, `mensaje`, `correlationId` | Fallo técnico; no se deja una cuenta parcial. |

**6. Errores y resultados excepcionales.**

| Código | Significado | Cuándo |
|---|---|---|
| `VALIDACION_INVALIDA` | Dato faltante o inválido. | Nombre vacío, correo mal formado, credencial ausente. |
| `CONFLICTO_UNICIDAD` | Correo o documento ya registrado. | USR-01/USR-02. |
| `DEPENDENCIA_NO_DISPONIBLE` | Fallo de persistencia, hashing o auditoría. | No se puede completar la unidad de trabajo. |
| `REGLA_NEGOCIO_INCUMPLIDA` | La política de registro impide crear la cuenta. | Registro deshabilitado por política. |

**7. Precondiciones y postcondiciones.**

- Precondiciones: datos válidos; correo y documento únicos; estados iniciales aprobados (`DEC-W1-007`: `Usuario ACTIVO`, `PerfilComprador HABILITADO`); política de credencial aprobada (`DEC-W1-008`).
- Postcondiciones: `Usuario`, `PerfilComprador` y `Carrito` existen y son consistentes; la credencial almacenada es solo `HashCredencial`; la auditoría y el evento quedan registrados; no se emite sesión ni token.

**8. Responsabilidades y límites.** El puerto garantiza la creación consistente y la minimización de la credencial. No autentica, no emite tokens, no define la política de contraseñas, no crea direcciones y no decide restricciones comerciales. La unicidad se refuerza en persistencia; el dominio valida las invariantes.

**9. Relaciones y flujo.** OBJ-03; `[MOD]` §6.1, §6.3, §9.1; `[DS]` DS-09; `[ARQ]` §7.2. Conceptos: `Usuario`, `PerfilComprador`, `Carrito`, `RolSistema`, `EstadoUsuario`, `EstadoComercial`, `HashCredencial`, `CorreoElectronico`, `DocumentoIdentidad`. Flujo: validar datos → verificar unicidad → hashear credencial → crear usuario/perfil/carrito → registrar auditoría y evento → confirmar.

**10. Trazabilidad.** `[ENU]` OBJ-03; `[MOD]` §6.1, §6.3, §9.1, §25 (DM-01, DM-02); `[VO]` §6.2, §6.3, §6.4, §8.5, §8.6; `[DS]` DS-09; `[ARQ]` §7.2.

**Estado:** `Confirmado` por arquitectura y modelo; estados y credenciales aprobados (`DEC-W1-007`, `DEC-W1-008`).

---

#### PI-02 — `RegisterSeller`

**1. Identificación.** `PI-02`, `RegisterSeller`, módulo `sellers`. Documentación: §5.1. Ubicación propuesta: `src/modules/sellers/application/ports/register-seller.port.ts`. Propósito: incorporar administrativamente un vendedor y crear su primera bodega de forma atómica.

**2. Responsabilidad.** Crear el `Usuario` con rol `VENDEDOR`, el `PerfilVendedor` y la primera `BodegaVendedor`, validando unicidad, autoridad del Administrador y coherencia de la bodega. Satisface OBJ-02 y SEL-01/SEL-02.

**3. Consumidores previstos.** Adaptador administrativo autenticado con rol `ADMINISTRADOR`; adaptadores de prueba. El vendedor no puede autorregistrarse.

**4. Contrato de entrada.**

| Campo | Obligatorio | Tipo conceptual | Regla |
|---|---:|---|---|
| `actorId`, `rolActor`, `correlationId` | Sí | Contexto | El rol debe ser `ADMINISTRADOR` y la cuenta debe estar operativa. |
| `nombreCompleto` | Sí | `NombreCompleto` | Datos del usuario vendedor. |
| `correoElectronico` | Sí | `CorreoElectronico` | Único tras normalización. |
| `documentoIdentidad` | Sí | `DocumentoIdentidad` | Único en la plataforma. |
| `credencial` | Sí | Texto secreto de entrada | Solo para producir `HashCredencial`. |
| `razonSocial` | Sí | `NombreComercial` | No vacía. |
| `nombreBodega` | Sí | `NombreBodega` | No vacío. |
| `ubicacionBodega` | Sí | `DireccionFisica` | Composición exacta no fijada (L-01). |
| `motivo` | Condicional | Texto | Obligatorio si la política administrativa lo exige; la incorporación es privilegiada y se audita. |

**5. Contrato de salida.**

| Resultado | Contenido | Condición |
|---|---|---|
| `EXITO` | `usuarioId`, `vendedorId`, `bodegaId`, `estadoUsuario`, `estadoVendedor` | Incorporación completa. |
| `RECHAZO` | `codigo`, `mensaje`, `detalles` | Autorización, unicidad, datos o política. |
| `ERROR` | `codigo`, `mensaje`, `correlationId` | Fallo técnico; no queda vendedor sin bodega. |

**6. Errores y resultados excepcionales.**

| Código | Significado | Cuándo |
|---|---|---|
| `NO_AUTORIZADO` | El actor no es Administrador o la cuenta no opera. | SEL-01, DS-01. |
| `CONFLICTO_UNICIDAD` | Correo o documento duplicado. | USR-01/USR-02. |
| `VALIDACION_INVALIDA` | Datos comerciales o de bodega inválidos. | Razón social vacía, bodega sin ubicación. |
| `REGLA_NEGOCIO_INCUMPLIDA` | La política de incorporación impide crear al vendedor. | Incorporación deshabilitada por política. |
| `DEPENDENCIA_NO_DISPONIBLE` | Fallo transaccional o de auditoría. | No se completa la incorporación. |

**7. Precondiciones y postcondiciones.**

- Precondiciones: actor Administrador activo; datos válidos; correo/documento únicos; estados iniciales aprobados (`DEC-W1-007`: `Usuario ACTIVO`, `PerfilVendedor ACTIVO`, primera `BodegaVendedor ACTIVA`); ubicación de bodega válida según la política (L-01).
- Postcondiciones: usuario, perfil y primera bodega existen consistentemente; el vendedor queda `ACTIVO` y la bodega `ACTIVA`; la auditoría y el evento quedan registrados. Si falla la bodega, no se considera completa la incorporación.

**8. Responsabilidades y límites.** Garantiza la incorporación atómica y la creación de la primera bodega. La incorporación administrativa es el acto de aprobación en V1: crea el perfil `ACTIVO` y la bodega `ACTIVA` (`DEC-W1-007`); no implementa una revisión separada ni define las transiciones completas de `EstadoVendedor`; no crea productos; no administra stock. La autorización y la auditoría se delegan en DS-01 y DS-09.

**9. Relaciones y flujo.** OBJ-02; `[MOD]` §6.4, §8.1, §22.1; `[DS]` DS-01, DS-09; `[ARQ]` §7.2. Conceptos: `Usuario`, `PerfilVendedor`, `BodegaVendedor`, `RolSistema`, `EstadoVendedor`, `TipoBodega`, `DireccionFisica`. Flujo: autorizar → validar datos/unicidad → crear usuario → crear perfil → crear primera bodega → auditar/encolar → confirmar.

**10. Trazabilidad.** `[ENU]` OBJ-02; `[MOD]` §6.4, §8.1, §22.1, §25 (DM-04, DM-05); `[VO]` §8.7, §8.10; `[DS]` DS-01, DS-09; `[ARQ]` §7.2.

**Estado:** `Confirmado` por arquitectura y modelo; estados/credenciales aprobados (`DEC-W1-007`/`DEC-W1-008`); `Limitado` por L-01 (composición de dirección).

---

#### PI-03 — `ManageOwnProfile`

**1. Identificación.** `PI-03`, `ManageOwnProfile`, módulo `identity`. Documentación: §5.1. Ubicación propuesta: `src/modules/identity/application/ports/manage-own-profile.port.ts`. Propósito: permitir que un actor autenticado consulte y actualice los datos de su propio perfil, incluidas las direcciones del comprador, sin acceder a perfiles ajenos.

**2. Responsabilidad.** Coordinar la consulta y actualización de datos básicos del `Usuario` y del perfil comercial del actor, con validación de propiedad y de unicidad. Es una capacidad de autoservicio, no una capacidad administrativa global.

**3. Consumidores previstos.** Adaptadores autenticados de comprador, vendedor, operador logístico, administrador y supervisor para su propio perfil. Ningún actor puede usar este puerto para modificar el perfil de otro.

**4. Contrato de entrada.**

| Campo | Obligatorio | Tipo conceptual | Regla |
|---|---:|---|---|
| `actorId`, `rolActor`, `correlationId` | Sí | Contexto | Identidad autenticada. |
| `accion` | Sí | `CONSULTAR` \| `ACTUALIZAR_DATOS` \| `GESTIONAR_DIRECCION` | Acción solicitada. |
| `nombreCompleto` | Condicional | `NombreCompleto` | Requerido en `ACTUALIZAR_DATOS` si se modifica. |
| `correoElectronico` | Condicional | `CorreoElectronico` | Requiere verificación previa; el mecanismo no está especificado. |
| `direccion` | Condicional | `Direccion` | Solo comprador; composición exacta limitada (L-01). |
| `direccionId` | Condicional | Identificador de dirección | Para actualizar o eliminar una dirección existente. |
| `versionEsperada` | Condicional | Versión del perfil | Control de concurrencia en actualizaciones. |

**5. Contrato de salida.**

| Resultado | Contenido | Condición |
|---|---|---|
| `EXITO` | Datos del perfil propio; direcciones del comprador cuando aplique. | Consulta o actualización completada. |
| `RECHAZO` | `codigo`, `mensaje`, `detalles` | Autorización, validación o conflicto. |
| `ERROR` | `codigo`, `mensaje`, `correlationId` | Fallo técnico. |

**6. Errores y resultados excepcionales.**

| Código | Significado | Cuándo |
|---|---|---|
| `NO_AUTORIZADO` | El actor intenta acceder a un perfil ajeno. | DS-01. |
| `VALIDACION_INVALIDA` | Dato inválido o dirección incompleta. | L-01. |
| `CONFLICTO_UNICIDAD` | Correo ya usado por otra cuenta. | USR-01. |
| `CONFLICTO_CONCURRENCIA` | El perfil cambió desde la versión leída. | Actualización concurrente. |
| `REGLA_NEGOCIO_INCUMPLIDA` | Cambio de correo sin verificación. | Mecanismo no especificado. |

**7. Precondiciones y postcondiciones.**

- Precondiciones: actor autenticado y operativo; el recurso es el perfil propio; datos válidos; para cambio de correo, verificación previa.
- Postcondiciones: el perfil actualizado conserva las invariantes; no se alteran pedidos históricos ni snapshots; la auditoría registra el cambio.

**8. Responsabilidades y límites.** Garantiza la propiedad del perfil y la validación de datos. No permite cambiar roles, estados de cuenta, estados comerciales ni datos de otros perfiles; no define la verificación de correo; no define la composición exacta de `Direccion`. La actualización de datos comerciales del vendedor puede requerir una política administrativa no definida.

**9. Relaciones y flujo.** OBJ-01…OBJ-03; `[MOD]` §6.1–§6.4; `[DS]` DS-01, DS-09; `[VO]` §6.1–§6.3, §7.1. Conceptos: `Usuario`, `PerfilComprador`, `PerfilVendedor`, `Direccion`, `CorreoElectronico`. Flujo: autorizar propiedad → validar → aplicar cambio → persistir → auditar → devolver perfil.

**10. Trazabilidad.** `[ENU]` OBJ-01, OBJ-02, OBJ-03; `[MOD]` §6.1–§6.4; `[VO]` §6.2, §6.3, §7.1; `[DS]` DS-01, DS-09.

**Estado:** `Inferido` de los objetivos y del modelo; `Limitado` por L-01 (dirección) y por la ausencia de política de verificación de correo y de edición de datos comerciales. Los estados iniciales están aprobados (`DEC-W1-007`).

---

#### PI-04 — `ManageUser`

**1. Identificación.** `PI-04`, `ManageUser`, módulo `identity`. Documentación: §5.1. Ubicación propuesta: `src/modules/identity/application/ports/manage-user.port.ts`. Propósito: ejecutar las transiciones administrativas confirmadas del estado de una cuenta.

**2. Responsabilidad.** Permitir que un Administrador active, desactive, bloquee o desbloquee una cuenta, con motivo cuando la transición lo exige, preservando el historial y la auditoría. Satisface OBJ-01.

**3. Consumidores previstos.** Adaptador administrativo autenticado con rol `ADMINISTRADOR`. El Supervisor no puede invocarlo (solo lectura).

**4. Contrato de entrada.**

| Campo | Obligatorio | Tipo conceptual | Regla |
|---|---:|---|---|
| `actorId`, `rolActor`, `correlationId` | Sí | Contexto | Rol `ADMINISTRADOR`; cuenta operativa. |
| `usuarioId` | Sí | `UsuarioId` | Cuenta objetivo. |
| `accion` | Sí | `ACTIVAR` \| `DESACTIVAR` \| `BLOQUEAR` \| `DESBLOQUEAR` | Debe corresponder a una transición confirmada. |
| `motivo` | Condicional | Texto | Obligatorio en desactivación y bloqueo; también en desbloqueo si la política lo exige. |
| `evidencia` | Condicional | Referencia opaca | Para bloqueo, cuando la política de seguridad lo requiera. |
| `versionEsperada` | Condicional | Versión de la cuenta | Control de concurrencia. |

**5. Contrato de salida.**

| Resultado | Contenido | Condición |
|---|---|---|
| `EXITO` | `usuarioId`, `estadoAnterior`, `estadoNuevo`, `actualizadoEn` | Transición aplicada y auditada. |
| `RECHAZO` | `codigo`, `mensaje`, `detalles` | Autorización, transición o motivo. |
| `ERROR` | `codigo`, `mensaje`, `correlationId` | Fallo técnico. |

**6. Errores y resultados excepcionales.**

| Código | Significado | Cuándo |
|---|---|---|
| `NO_AUTORIZADO` | El actor no es Administrador. | DS-01. |
| `RECURSO_NO_ENCONTRADO` | La cuenta no existe. | Identificador inválido. |
| `TRANSICION_INVALIDA` | La transición no está en la tabla de `[MOD]` §6.1. | Por ejemplo, bloquear una cuenta ya bloqueada o desactivar una bloqueada. |
| `VALIDACION_INVALIDA` | Falta el motivo exigido. | Desactivación o bloqueo sin motivo. |
| `CONFLICTO_CONCURRENCIA` | La cuenta cambió desde la lectura. | Actualización concurrente. |

**7. Precondiciones y postcondiciones.**

- Precondiciones: actor Administrador operativo; cuenta objetivo existente; transición válida; motivo/evidencia cuando corresponda.
- Postcondiciones: el estado cambia una sola vez; se conserva el historial; se registra auditoría; las sesiones existentes no se gestionan aquí (pertenecen a infraestructura de identidad).

**8. Responsabilidades y límites.** Garantiza la transición administrativa y la auditoría. No autentica, no invalida tokens, no elimina cuentas, no cambia roles. El cambio de rol es una operación privilegiada mencionada por USR-06, pero su proceso y autorización no están definidos; se excluye de este contrato y se registra como limitación.

**9. Relaciones y flujo.** OBJ-01; `[MOD]` §6.1, §19.1; `[DS]` DS-01, DS-09; `[VO]` §8.5. Conceptos: `Usuario`, `EstadoUsuario`, `RolSistema`. Flujo: autorizar → recuperar cuenta → validar transición y motivo → aplicar comportamiento de dominio → persistir → auditar → devolver estado.

**10. Trazabilidad.** `[ENU]` OBJ-01; `[MOD]` §6.1, §19.1, §25 (DM-30); `[VO]` §8.5; `[DS]` DS-01, DS-09; `[ARQ]` §16.

**Estado:** `Confirmado` para las transiciones de estado; `Limitado` por la ausencia de proceso de cambio de rol (USR-06). Los estados iniciales están aprobados (`DEC-W1-007`).

### 5.2 Módulo `catalog`

#### PI-05 — `CreateProduct`

**1. Identificación.** `PI-05`, `CreateProduct`, módulo `catalog`. Documentación: §5.2. Ubicación propuesta: `src/modules/catalog/application/ports/create-product.port.ts`. Propósito: crear la ficha de un producto y sus variantes vendibles en estado no publicado.

**2. Responsabilidad.** Validar los datos del producto y de sus variantes, verificar la propiedad del vendedor y la unicidad global del SKU, y persistir el producto sin publicarlo. Satisface OBJ-05 y el primer paso del escenario de publicación.

**3. Consumidores previstos.** Adaptador autenticado con rol `VENDEDOR` propietario; un Administrador puede usar la capacidad solo si la política de soporte lo autoriza, lo que no está definido. Adaptadores de prueba.

**4. Contrato de entrada.**

| Campo | Obligatorio | Tipo conceptual | Regla |
|---|---:|---|---|
| `actorId`, `rolActor`, `correlationId` | Sí | Contexto | Vendedor autenticado y propietario. |
| `nombre` | Sí | `NombreProducto` | No vacío; longitud máxima no fijada (L-02). |
| `descripcion` | Sí | `DescripcionProducto` | Obligatoria en la línea base; puede admitir vacío solo por política. |
| `categoria` | Sí | `CategoriaProducto` | Código del catálogo controlado. |
| `tipoEntrega` | Sí | `TipoEntrega` | `FISICA` o `DIGITAL`; coherente con la categoría y el subtipo. |
| `variantes` | No | Lista de variantes | Puede estar vacía al crear; se exige al menos una para publicar (CAT-02). |
| `variantes[].sku` | Condicional | `SKU` | Único globalmente; no reutilizable tras descontinuar. |
| `variantes[].nombre` | Condicional | `NombreVariante` | No vacío. |
| `variantes[].atributos` | Condicional | Pares normalizados | Claves únicas dentro de la variante. |
| `variantes[].precio` | Condicional | `Dinero` | Mayor que cero; moneda explícita (L-04). |
| `variantes[].estado` | No | `EstadoVariante` | Si se omite, se aplica el estado inicial que defina la política; no fijado por la fuente. |

**5. Contrato de salida.**

| Resultado | Contenido | Condición |
|---|---|---|
| `EXITO` | `productoId`, `varianteIds`, `estadoProducto` (no publicado) | Producto y variantes persistidos. |
| `RECHAZO` | `codigo`, `mensaje`, `detalles` | Autorización, validación o unicidad. |
| `ERROR` | `codigo`, `mensaje`, `correlationId` | Fallo técnico. |

**6. Errores y resultados excepcionales.**

| Código | Significado | Cuándo |
|---|---|---|
| `NO_AUTORIZADO` | El actor no es el vendedor propietario o no está habilitado. | DS-01. |
| `VALIDACION_INVALIDA` | Categoría, tipo, nombre, descripción o precio inválidos. | Datos fuera de catálogo o precio no positivo. |
| `CONFLICTO_UNICIDAD` | SKU ya existente. | CAT-02, DM-07. |
| `REGLA_NEGOCIO_INCUMPLIDA` | La coherencia categoría/tipo o el estado del vendedor impide crear. | Política de catálogo. |
| `DEPENDENCIA_NO_DISPONIBLE` | Fallo de persistencia o auditoría. | Unidad de trabajo no completada. |

**7. Precondiciones y postcondiciones.**

- Precondiciones: vendedor existente y propietario; datos válidos; SKU únicos; precio y moneda válidos; política de estado inicial de variante definida.
- Postcondiciones: producto y variantes persisten en estado no publicado; no se altera el catálogo público; no se crea inventario; la auditoría y el evento quedan registrados.

**8. Responsabilidades y límites.** Garantiza la creación y la unicidad del SKU. No publica, no reserva stock, no genera existencias, no define imágenes o medios no modelados y no altera pedidos históricos. La publicación se realiza con `PI-06` y las existencias con `PI-09`.

**9. Relaciones y flujo.** OBJ-05; `[MOD]` §7.1, §7.4, §22.2; `[DS]` DS-02 (solo en la publicación), DS-09; `[ARQ]` §7.2. Conceptos: `Producto`, `Variante`, `SKU`, `Dinero`, `CategoriaProducto`, `TipoEntrega`, `EstadoVariante`. Flujo: autorizar propiedad → validar producto/variantes → verificar SKU → persistir → auditar/encolar → devolver identificadores.

**10. Trazabilidad.** `[ENU]` OBJ-05; `[MOD]` §7.1, §7.4, §22.2, §25 (DM-06, DM-07); `[VO]` §6.1, §6.5, §8.3, §8.9; `[DS]` DS-02, DS-09; `[ARQ]` §7.2.

**Estado:** `Confirmado`; los estados iniciales de `Producto`/`Variante` no se deciden en `W1-02` y siguen sujetos a `L-09` (transiciones y publicación de catálogo).

---

#### PI-06 — `ManageProductPublication`

**1. Identificación.** `PI-06`, `ManageProductPublication`, módulo `catalog`. Documentación: §5.2. Ubicación propuesta: `src/modules/catalog/application/ports/manage-product-publication.port.ts`. Propósito: ejecutar las transiciones confirmadas de publicación de un producto.

**2. Responsabilidad.** Publicar, suspender, reanudar o descontinuar un producto, aplicando las condiciones de catálogo y preservando los pedidos históricos. Subsume el candidato `PublishProduct` de `[ARQ]` §7.2 y añade las transiciones que el modelo confirma.

**3. Consumidores previstos.** Adaptador autenticado del vendedor propietario o de un Administrador autorizado (CAT-07). Adaptadores de prueba.

**4. Contrato de entrada.**

| Campo | Obligatorio | Tipo conceptual | Regla |
|---|---:|---|---|
| `actorId`, `rolActor`, `correlationId` | Sí | Contexto | Propietario o Administrador. |
| `productoId` | Sí | `ProductoId` | Producto existente. |
| `accion` | Sí | `PUBLICAR` \| `SUSPENDER` \| `REANUDAR` \| `DESCONTINUAR` | Transición solicitada. |
| `versionEsperada` | Condicional | Versión del producto | Control de concurrencia. |
| `motivo` | No | Texto | No exigido por la fuente; si se recibe, se conserva en auditoría. |

**5. Contrato de salida.**

| Resultado | Contenido | Condición |
|---|---|---|
| `EXITO` | `productoId`, `estadoAnterior`, `estadoNuevo`, `actualizadoEn` | Transición aplicada. |
| `RECHAZO` | `codigo`, `mensaje`, `detalles` | Autorización, estado o condiciones. |
| `ERROR` | `codigo`, `mensaje`, `correlationId` | Fallo técnico. |

**6. Errores y resultados excepcionales.**

| Código | Significado | Cuándo |
|---|---|---|
| `NO_AUTORIZADO` | El actor no es propietario ni Administrador. | CAT-07, DS-01. |
| `RECURSO_NO_ENCONTRADO` | El producto no existe. | Identificador inválido. |
| `TRANSICION_INVALIDA` | La transición no está permitida. | Reanudar un descontinuado, publicar un publicado. |
| `REGLA_NEGOCIO_INCUMPLIDA` | No se cumplen las condiciones de publicación. | Sin variantes, vendedor no ACTIVO, precio inválido, categoría/tipo incoherente. |
| `CONFLICTO_CONCURRENCIA` | El producto cambió desde la lectura. | Actualización concurrente. |

**7. Precondiciones y postcondiciones.**

- Precondiciones: producto existente; actor autorizado; estado actual permite la transición; para `PUBLICAR` o `REANUDAR`, revalidar CAT-02/CAT-03 con DS-02.
- Postcondiciones: el estado cambia una sola vez; el catálogo público refleja el cambio; los pedidos históricos conservan sus snapshots; la auditoría y el evento quedan registrados.

**8. Responsabilidades y límites.** Garantiza la transición y la revalidación de publicación. No edita datos del producto, no modifica precios, no reserva stock, no cancela pedidos y no reabre un producto descontinuado. La suspensión no elimina obligaciones existentes.

**9. Relaciones y flujo.** OBJ-05; `[MOD]` §7.1, §22.2; `[DS]` DS-02, DS-09; `[ARQ]` §7.2. Conceptos: `Producto`, `Variante`, `EstadoProducto`, `EstadoVendedor`, `SKU`, `Dinero`. Flujo: autorizar → recuperar producto → validar transición → revalidar publicación si aplica → aplicar comportamiento → persistir → auditar/encolar.

**10. Trazabilidad.** `[ENU]` OBJ-05; `[MOD]` §7.1, §22.2, §25 (DM-06); `[VO]` §8.8; `[DS]` DS-02, DS-09; `[ARQ]` §7.2 (`PublishProduct`).

**Estado:** `Confirmado`.

---

#### PI-07 — `QueryCatalog`

**1. Identificación.** `PI-07`, `QueryCatalog`, módulo `catalog`. Documentación: §5.2. Ubicación propuesta: `src/modules/catalog/application/ports/query-catalog.port.ts`. Propósito: consultar el catálogo público o administrativo con filtros y paginación.

**2. Responsabilidad.** Devolver productos y variantes según el alcance autorizado, sin mutar estado. El catálogo público solo muestra productos `PUBLICADO`; el alcance de propietario o administrativo puede incluir otros estados.

**3. Consumidores previstos.** Adaptador público (sin autenticación) para el catálogo publicado; adaptadores autenticados de vendedor propietario, Administrador y Supervisor para consultas de alcance autorizado.

**4. Contrato de entrada.**

| Campo | Obligatorio | Tipo conceptual | Regla |
|---|---:|---|---|
| `alcance` | Sí | `PUBLICO` \| `PROPIETARIO` \| `ADMINISTRATIVO` | `PUBLICO` no requiere identidad; los demás sí. |
| `texto` | No | Texto de búsqueda | Búsqueda conceptual por nombre/SKU; el comportamiento exacto no está especificado. |
| `categoria` | No | `CategoriaProducto` | Filtro por categoría. |
| `tipoEntrega` | No | `TipoEntrega` | Filtro por tipo. |
| `vendedorId` | Condicional | `VendedorId` | Obligatorio en alcance `PROPIETARIO`. |
| `estadoProducto` | No | `EstadoProducto` | Solo visible en alcances no públicos. |
| `paginacion` | No | Página/tamaño | Límites no fijados (L-19). |

**5. Contrato de salida.**

| Resultado | Contenido | Condición |
|---|---|---|
| `EXITO` | Lista paginada de productos con variantes, precios y estados visibles. | Consulta válida. |
| `RECHAZO` | `codigo`, `mensaje`, `detalles` | Alcance no autorizado o filtro inválido. |
| `ERROR` | `codigo`, `mensaje`, `correlationId` | Fallo técnico. |

**6. Errores y resultados excepcionales.**

| Código | Significado | Cuándo |
|---|---|---|
| `NO_AUTORIZADO` | Se solicita un alcance restringido sin permiso. | DS-01. |
| `VALIDACION_INVALIDA` | Filtro o paginación inválidos. | Categoría desconocida, página negativa. |
| `LIMITE_EXCEDIDO` | Se supera el tamaño de página permitido. | Límite no fijado (L-19). |
| `DEPENDENCIA_NO_DISPONIBLE` | Fallo de lectura. | Persistencia no disponible. |

**7. Precondiciones y postcondiciones.** Precondiciones: para `PUBLICO`, ninguna identidad; para los demás alcances, actor autorizado. Postcondiciones: no se muta estado; no se exponen productos no publicados al alcance público; no se exponen datos de otros vendedores fuera de su alcance.

**8. Responsabilidades y límites.** Garantiza la lectura filtrada y el aislamiento por alcance. No calcula disponibilidad de inventario, no reserva, no publica, no modifica precios y no sustituye a `PI-10` para existencias.

**9. Relaciones y flujo.** OBJ-05; `[MOD]` §7.1, §7.5; `[DS]` DS-01; `[ARQ]` §5 (`catalog`), §7.3. Conceptos: `Producto`, `Variante`, `EstadoProducto`, `CategoriaProducto`, `TipoEntrega`. Flujo: determinar alcance → validar filtros → consultar puerto de lectura → paginar → devolver.

**10. Trazabilidad.** `[ENU]` OBJ-05; `[MOD]` §7.1, §7.5; `[VO]` §8.3, §8.8, §8.9; `[DS]` DS-01; `[ARQ]` §5, §7.3.

**Estado:** `Inferido` de OBJ-05 y de la arquitectura del módulo `catalog`; `Limitado` por L-19 (paginación y búsqueda).

---

### 5.3 Módulo `warehouses` e inventario

#### PI-08 — `ManageWarehouse`

**1. Identificación.** `PI-08`, `ManageWarehouse`, módulo `warehouses`. Documentación: §5.3. Ubicación propuesta: `src/modules/warehouses/application/ports/manage-warehouse.port.ts`. Propósito: administrar los datos y el estado de las bodegas del marketplace y de los vendedores.

**2. Responsabilidad.** Crear, actualizar o desactivar una bodega, validando el tipo, la propiedad y la ubicación. Satisface OBJ-04.

**3. Consumidores previstos.** Adaptador administrativo para bodegas `MARKETPLACE`; adaptador del vendedor propietario para bodegas `VENDEDOR`; adaptadores de prueba. La primera bodega del vendedor se crea en `PI-02`.

**4. Contrato de entrada.**

| Campo | Obligatorio | Tipo conceptual | Regla |
|---|---:|---|---|
| `actorId`, `rolActor`, `correlationId` | Sí | Contexto | Administrador o vendedor propietario. |
| `accion` | Sí | `CREAR` \| `ACTUALIZAR` \| `DESACTIVAR` | Acción solicitada. |
| `bodegaId` | Condicional | `BodegaId` | Requerido en actualización/desactivación. |
| `tipo` | Condicional | `TipoBodega` | `MARKETPLACE` o `VENDEDOR`; requerido al crear. |
| `vendedorId` | Condicional | `VendedorId` | Obligatorio y único para `VENDEDOR`; prohibido para `MARKETPLACE`. |
| `nombre` | Condicional | `NombreBodega` | No vacío; requerido al crear. |
| `ubicacion` | Condicional | `DireccionFisica` | Composición exacta limitada (L-01). |
| `versionEsperada` | Condicional | Versión de la bodega | Control de concurrencia. |

**5. Contrato de salida.**

| Resultado | Contenido | Condición |
|---|---|---|
| `EXITO` | `bodegaId`, `tipo`, `estado`, `vendedorId` cuando aplique | Operación completada. |
| `RECHAZO` | `codigo`, `mensaje`, `detalles` | Autorización, validación o estado. |
| `ERROR` | `codigo`, `mensaje`, `correlationId` | Fallo técnico. |

**6. Errores y resultados excepcionales.**

| Código | Significado | Cuándo |
|---|---|---|
| `NO_AUTORIZADO` | El actor no puede administrar esa bodega. | DS-01. |
| `VALIDACION_INVALIDA` | Tipo, propietario, nombre o ubicación inválidos. | `VENDEDOR` sin vendedor, `MARKETPLACE` con vendedor. |
| `RECURSO_NO_ENCONTRADO` | La bodega no existe. | Actualización/desactivación. |
| `CONFLICTO_CONCURRENCIA` | La bodega cambió desde la lectura. | Actualización concurrente. |
| `REGLA_NEGOCIO_INCUMPLIDA` | Se intenta una transición no permitida. | Reactivar una bodega sin resolver existencias, si la política lo exige. |

**7. Precondiciones y postcondiciones.**

- Precondiciones: actor autorizado; datos válidos; coherencia tipo/propietario; ubicación válida según L-01; para desactivar, política de resolución de stock definida.
- Postcondiciones: la bodega persiste con su estado; no se mueve stock; la auditoría y el evento quedan registrados.

**8. Responsabilidades y límites.** Garantiza la administración de la bodega y la coherencia de propiedad. No mueve, ajusta ni reserva existencias; no elige la bodega preferida (DS-04); no elimina bodegas con historial. La desactivación no resuelve por sí sola el stock existente.

**9. Relaciones y flujo.** OBJ-04; `[MOD]` §8.1; `[DS]` DS-01, DS-04, DS-09; `[ARQ]` §5. Conceptos: `Bodega`, `BodegaMarketplace`, `BodegaVendedor`, `TipoBodega`, `EstadoBodega`, `DireccionFisica`. Flujo: autorizar → validar tipo/propietario → validar datos → aplicar → persistir → auditar.

**10. Trazabilidad.** `[ENU]` OBJ-04; `[MOD]` §8.1, §25 (DM-29); `[VO]` §8.10; `[DS]` DS-01, DS-04, DS-09; `[ARQ]` §5.

**Estado:** `Inferido` de OBJ-04 y del agregado `Bodega`; `Limitado` por L-01 (dirección). La primera bodega nace `ACTIVA` (`DEC-W1-007`); las transiciones restantes siguen en `L-09`.

---

#### PI-09 — `AdjustInventory`

**1. Identificación.** `PI-09`, `AdjustInventory`, módulo `inventory`. Documentación: §5.3. Ubicación propuesta: `src/modules/inventory/application/ports/adjust-inventory.port.ts`. Propósito: registrar movimientos autorizados de ingreso, ajuste o baja sobre una posición de inventario.

**2. Responsabilidad.** Aplicar de forma atómica un movimiento que modifica `onHand` o `unavailable`, registrar el `MovimientoInventario` correspondiente y preservar las invariantes de inventario. Satisface OBJ-06 y el candidato `AdjustInventory` de `[ARQ]` §7.2.

**3. Consumidores previstos.** Adaptador administrativo; adaptador del operador logístico asignado; adaptador del vendedor propietario cuando la política lo permita. El Supervisor no puede invocarlo.

**4. Contrato de entrada.**

| Campo | Obligatorio | Tipo conceptual | Regla |
|---|---:|---|---|
| `actorId`, `rolActor`, `correlationId` | Sí | Contexto | Actor autorizado. |
| `varianteId` | Sí | `VarianteId` | Variante existente. |
| `bodegaId` | Sí | `BodegaId` | Bodega activa y compatible. |
| `tipoMovimiento` | Sí | `INGRESO` \| `AJUSTE_POSITIVO` \| `AJUSTE_NEGATIVO` \| `BAJA_DANIO` | Solo movimientos de ajuste; reserva, liberación, consumo y devolución pertenecen a otros flujos. |
| `cantidad` | Sí | `CantidadPositiva` | Entero mayor que cero. |
| `motivo` | Condicional | `MotivoMovimiento` | Obligatorio en ajustes y bajas; también en ingreso si la política lo exige. |
| `referenciaTipo` | Sí | `TipoReferencia` | Origen del movimiento. |
| `referenciaId` | Sí | Texto opaco | Identificador del proceso origen. |
| `idempotencyKey` | Sí | `IdempotencyKey` | Evita duplicar el movimiento. |
| `versionEsperada` | Condicional | `VersionInventario` | Requerido si la posición ya existe. |

**5. Contrato de salida.**

| Resultado | Contenido | Condición |
|---|---|---|
| `EXITO` | `inventarioId`, `movimientoId`, `onHand`, `reserved`, `unavailable`, `disponible` | Movimiento aplicado. |
| `RECHAZO` | `codigo`, `mensaje`, `detalles` | Autorización, invariante o estado. |
| `ERROR` | `codigo`, `mensaje`, `correlationId` | Fallo técnico. |

**6. Errores y resultados excepcionales.**

| Código | Significado | Cuándo |
|---|---|---|
| `NO_AUTORIZADO` | El actor no puede ajustar esa posición. | DS-01, DM-23. |
| `VALIDACION_INVALIDA` | Tipo, cantidad o motivo inválidos. | Cantidad no positiva, motivo ausente en ajuste. |
| `RECURSO_NO_ENCONTRADO` | Variante o bodega inexistente. | Identificador inválido. |
| `REGLA_NEGOCIO_INCUMPLIDA` | El movimiento dejaría saldos inválidos. | INV-01, INV-02, INV-08. |
| `CONFLICTO_CONCURRENCIA` | La posición cambió desde la lectura. | Control optimista. |
| `IDEMPOTENCIA_CONFLICTO` | La clave se usó con otros datos. | Reintento con distinta cantidad. |
| `TRANSICION_INVALIDA` | Se intenta un movimiento interno por este puerto. | Reserva, consumo o liberación. |

**7. Precondiciones y postcondiciones.**

- Precondiciones: actor autorizado; variante y bodega válidas; bodega activa; motivo cuando corresponde; para posiciones existentes, versión esperada.
- Postcondiciones: la mutación es atómica; se registra un movimiento append-only; las invariantes `INV-01`…`INV-10` se preservan; la auditoría y el evento quedan registrados. Un ingreso puede crear la posición si no existe, según la política de inventario.

**8. Responsabilidades y límites.** Garantiza el ajuste atómico y trazable. No reserva, no libera, no consume reservas, no vende, no elige bodega y no corrige el historial editando movimientos. Las operaciones de reserva/consumo/liberación pertenecen a `DS-03` y se invocan desde `Checkout`, `CancelOrder`, `DispatchOrder` y los flujos de devolución.

**9. Relaciones y flujo.** OBJ-06; `[MOD]` §8.2, §8.2.1, §8.2.2, §8.3; `[DS]` DS-03, DS-09; `[ARQ]` §7.2. Conceptos: `Inventario`, `MovimientoInventario`, `TipoMovimientoInventario`, `CantidadPositiva`, `MotivoMovimiento`, `IdempotencyKey`, `VersionInventario`. Flujo: autorizar → validar → recuperar posición → aplicar movimiento → registrar movimiento → persistir → auditar/encolar.

**10. Trazabilidad.** `[ENU]` OBJ-06; `[MOD]` §8.2–§8.3, §25 (DM-14, DM-25); `[VO]` §6.6, §6.7, §8.17, §9.1, §9.3; `[DS]` DS-03, DS-09; `[ARQ]` §7.2.

**Estado:** `Confirmado`.

---

#### PI-10 — `QueryInventory`

**1. Identificación.** `PI-10`, `QueryInventory`, módulo `inventory`. Documentación: §5.3. Ubicación propuesta: `src/modules/inventory/application/ports/query-inventory.port.ts`. Propósito: consultar posiciones de inventario y disponibilidad calculada según el alcance autorizado.

**2. Responsabilidad.** Devolver posiciones por variante, bodega o vendedor, con `onHand`, `reserved`, `unavailable` y `disponible`, sin mutar estado. Satisface OBJ-06.

**3. Consumidores previstos.** Adaptadores autenticados de Administrador, Supervisor (solo lectura), vendedor propietario y operador asignado. El comprador no consulta inventario interno; la disponibilidad de compra se valida en `Checkout`.

**4. Contrato de entrada.**

| Campo | Obligatorio | Tipo conceptual | Regla |
|---|---:|---|---|
| `actorId`, `rolActor`, `correlationId` | Sí | Contexto | Alcance autorizado. |
| `varianteId` | No | `VarianteId` | Filtro. |
| `bodegaId` | No | `BodegaId` | Filtro. |
| `vendedorId` | Condicional | `VendedorId` | Obligatorio para el alcance del vendedor. |
| `soloDisponibles` | No | Booleano | Filtro de disponibilidad. |
| `paginacion` | No | Página/tamaño | Límites no fijados (L-19). |

**5. Contrato de salida.**

| Resultado | Contenido | Condición |
|---|---|---|
| `EXITO` | Lista paginada de posiciones con cantidades y versión. | Consulta válida. |
| `RECHAZO` | `codigo`, `mensaje`, `detalles` | Alcance o filtro inválido. |
| `ERROR` | `codigo`, `mensaje`, `correlationId` | Fallo técnico. |

**6. Errores y resultados excepcionales.**

| Código | Significado | Cuándo |
|---|---|---|
| `NO_AUTORIZADO` | El actor no tiene alcance sobre la posición. | DS-01. |
| `VALIDACION_INVALIDA` | Filtro o paginación inválidos. | Identificador mal formado. |
| `LIMITE_EXCEDIDO` | Se supera el tamaño de página. | L-19. |
| `DEPENDENCIA_NO_DISPONIBLE` | Fallo de lectura. | Persistencia no disponible. |

**7. Precondiciones y postcondiciones.** Precondiciones: actor autorizado; filtros válidos. Postcondiciones: lectura sin mutación; el vendedor solo ve sus bodegas; el operador solo ve el alcance asignado; no se exponen datos de otros vendedores.

**8. Responsabilidades y límites.** Garantiza la lectura y el cálculo de `disponible`. No reserva, no ajusta, no elige bodega y no sustituye la validación transaccional de `Checkout`.

**9. Relaciones y flujo.** OBJ-06; `[MOD]` §8.2; `[DS]` DS-01, DS-04; `[ARQ]` §5. Conceptos: `Inventario`, `Cantidad`, `VersionInventario`, `Bodega`, `Variante`. Flujo: autorizar alcance → validar filtros → consultar → calcular disponible → paginar → devolver.

**10. Trazabilidad.** `[ENU]` OBJ-06; `[MOD]` §8.2; `[VO]` §6.6; `[DS]` DS-01, DS-04; `[ARQ]` §5.

**Estado:** `Inferido` de OBJ-06 y del agregado `Inventario`; `Limitado` por L-19 (paginación).

### 5.4 Módulo `cart`

#### PI-11 — `ManageCart`

**1. Identificación.** `PI-11`, `ManageCart`, módulo `cart`. Documentación: §5.4. Ubicación propuesta: `src/modules/cart/application/ports/manage-cart.port.ts`. Propósito: permitir que un comprador agregue, modifique, quite y consulte las líneas de su carrito activo.

**2. Responsabilidad.** Mantener el carrito del comprador, validando la vendibilidad de la variante y la cantidad, sin reservar stock ni garantizar el precio final. Subsume el candidato `AddCartItem` de `[ARQ]` §7.2 y agrupa las operaciones del mismo agregado.

**3. Consumidores previstos.** Adaptador autenticado con rol `COMPRADOR`; adaptadores de prueba. El comprador solo accede a su propio carrito.

**4. Contrato de entrada.**

| Campo | Obligatorio | Tipo conceptual | Regla |
|---|---:|---|---|
| `actorId`, `rolActor`, `correlationId` | Sí | Contexto | Comprador autenticado y propietario. |
| `accion` | Sí | `AGREGAR` \| `ACTUALIZAR` \| `QUITAR` \| `VACIAR` \| `CONSULTAR` | Operación solicitada. |
| `varianteId` | Condicional | `VarianteId` | Requerido en agregar/actualizar/quitar. |
| `cantidad` | Condicional | `CantidadPositiva` | Requerido en agregar/actualizar; entero mayor que cero. |
| `versionEsperada` | Condicional | Versión del carrito | Control de concurrencia. |

**5. Contrato de salida.**

| Resultado | Contenido | Condición |
|---|---|---|
| `EXITO` | `carritoId`, líneas con `varianteId`, `cantidad`, `precioReferencial`, `subtotalReferencial`, versión | Operación completada. |
| `RECHAZO` | `codigo`, `mensaje`, `detalles` | Autorización, vendibilidad o cantidad. |
| `ERROR` | `codigo`, `mensaje`, `correlationId` | Fallo técnico. |

**6. Errores y resultados excepcionales.**

| Código | Significado | Cuándo |
|---|---|---|
| `NO_AUTORIZADO` | El actor no es el comprador propietario. | CAR-01, DS-01. |
| `RECURSO_NO_ENCONTRADO` | La variante no existe. | Identificador inválido. |
| `REGLA_NEGOCIO_INCUMPLIDA` | La variante no es vendible. | Producto no publicado, variante inactiva, vendedor no activo (CAR-02). |
| `VALIDACION_INVALIDA` | Cantidad no positiva. | CAR-03. |
| `CONFLICTO_CONCURRENCIA` | El carrito cambió desde la lectura. | Actualización concurrente. |

**7. Precondiciones y postcondiciones.**

- Precondiciones: comprador autenticado; carrito propio; para agregar/actualizar, variante vendible y cantidad positiva; versión esperada en mutaciones.
- Postcondiciones: el carrito persiste con una línea por variante; agregar la misma variante incrementa la cantidad; no se reserva stock; el precio es referencial; la versión se incrementa.

**8. Responsabilidades y límites.** Garantiza la edición del carrito y la validación de vendibilidad. No reserva stock, no garantiza el precio, no aplica descuentos, no crea pedidos y no sustituye la revalidación de `Checkout`. Un comprador `RESTRINGIDO` puede gestionar su carrito, pero no confirmar la compra.

**9. Relaciones y flujo.** OBJ-07; `[MOD]` §9.1–§9.3; `[DS]` DS-01; `[ARQ]` §7.2 (`AddCartItem`). Conceptos: `Carrito`, `ItemCarrito`, `CantidadPositiva`, `Dinero`, `Variante`. Flujo: autorizar propiedad → recuperar carrito → validar variante/cantidad → aplicar operación → persistir → devolver carrito.

**10. Trazabilidad.** `[ENU]` OBJ-07; `[MOD]` §9.1–§9.3, §25 (DM-08); `[VO]` §6.5, §6.7; `[DS]` DS-01; `[ARQ]` §7.2.

**Estado:** `Confirmado`; agrupación justificada en §6.2.

---

### 5.5 Módulo `orders`

#### PI-12 — `Checkout`

**1. Identificación.** `PI-12`, `Checkout`, módulo `orders`. Documentación: §5.5. Ubicación propuesta: `src/modules/orders/application/ports/checkout.port.ts`. Propósito: confirmar la compra de un carrito, crear uno o varios pedidos y dejar el pago en estado pendiente, con reservas de inventario cuando corresponda.

**2. Responsabilidad.** Coordinar la revalidación de precios, productos, vendedores y disponibilidad; calcular importes; asignar bodegas y reservar stock físico; crear pedidos por vendedor con snapshots; iniciar una operación de pago por pedido; vaciar el carrito solo si el pedido se crea correctamente; compensar si falla una etapa posterior a la reserva. Satisface OBJ-08 y los escenarios de checkout físico y digital.

**3. Consumidores previstos.** Adaptador autenticado con rol `COMPRADOR`; adaptadores de prueba. El comprador solo puede confirmar su propio carrito.

**4. Contrato de entrada.**

| Campo | Obligatorio | Tipo conceptual | Regla |
|---|---:|---|---|
| `actorId`, `rolActor`, `correlationId` | Sí | Contexto | Comprador autenticado. |
| `carritoId` | No | `CarritoId` | Si se omite, se usa el carrito activo del comprador. |
| `direccionEntregaId` | Condicional | Identificador de dirección | Obligatoria si el carrito contiene productos físicos. |
| `referenciaInstrumentoPago` | Condicional | Referencia opaca del proveedor | Necesaria para iniciar el pago; nunca contiene datos completos de tarjeta. |
| `confirmacionTotal` | No | Booleano o referencia de confirmación | Requerida si el total recalculado difiere del mostrado (CAR-07). |
| `idempotencyKey` | Sí | `IdempotencyKey` | Evita duplicar pedidos, reservas y pagos por reintento. |

**5. Contrato de salida.**

| Resultado | Contenido | Condición |
|---|---|---|
| `EXITO` | `checkoutGroupId`, lista de pedidos (`pedidoId`, `vendedorId`, `estado`, `total`), lista de pagos (`pedidoId`, `pagoId`, `estado = PENDIENTE`) —uno por pedido—, reservas creadas | Checkout completo. |
| `CONFIRMACION_REQUERIDA` | Total recalculado, diferencias y referencia de confirmación | El precio cambió y se requiere aceptación (CAR-07). |
| `RECHAZO` | `codigo`, `mensaje`, `detalles` | Regla, stock, autorización o validación. |
| `ERROR` | `codigo`, `mensaje`, `correlationId` | Fallo técnico; se aplica compensación si hubo reservas. |

**6. Errores y resultados excepcionales.**

| Código | Significado | Cuándo |
|---|---|---|
| `NO_AUTORIZADO` | El comprador no está activo o está `RESTRINGIDO`. | USR-04, `INV-VO-ECOM-02`. |
| `REGLA_NEGOCIO_INCUMPLIDA` | Carrito vacío, producto no vendible, precio no confirmado, dirección inválida o stock insuficiente. | CAR-04, CAR-05, CAR-07, ORD-07, INV-03. |
| `RECURSO_NO_ENCONTRADO` | Carrito, dirección o variante inexistente. | Identificador inválido. |
| `CONFLICTO_CONCURRENCIA` | Dos checkouts compiten por la última unidad o el carrito cambió. | DM-10. |
| `IDEMPOTENCIA_CONFLICTO` | La clave se usó con otro carrito o contenido. | Reintento con datos distintos. |
| `DEPENDENCIA_NO_DISPONIBLE` | Fallo de pago, persistencia o proveedor. | Se compensan las reservas. |

**7. Precondiciones y postcondiciones.**

- Precondiciones: comprador activo y `HABILITADO`; carrito no vacío; productos/variantes vendibles; dirección válida para productos físicos; disponibilidad suficiente; referencia de pago disponible; total confirmado si cambió.
- Postcondiciones: se crea un pedido por vendedor con `estado = PENDIENTE_DE_PAGO`; las reservas físicas quedan `ACTIVA`; cada pedido tiene un pago `PENDIENTE` (uno por pedido); el carrito se vacía o marca como convertido solo tras el éxito; si falla una etapa posterior a la reserva, se libera de forma idempotente; la auditoría y el evento quedan registrados.

**8. Responsabilidades y límites.** Garantiza la coordinación transaccional y la compensación. No captura el pago, no despacha, no emite factura, no elige la bodega por preferencia comercial (DS-04 valida factibilidad), no almacena datos de tarjeta y no crea pedidos parcialmente pagables. Un carrito multi-vendedor genera varios pedidos, unidos por `checkoutGroupId`.

**9. Relaciones y flujo.** OBJ-08; `[MOD]` §9.4, §10.1, §22.3–§22.4; `[DS]` DS-03, DS-04, DS-05, DS-06, DS-09; `[ARQ]` §7.2. Conceptos: `Carrito`, `Pedido`, `ItemPedido`, `Pago`, `ReservaInventario`, `DireccionSnapshot`, `Dinero`, `CheckoutGroupId`. Flujo: autorizar → leer carrito → revalidar catálogo/precio → calcular → asignar bodega/reservar → crear pedidos → iniciar pago por pedido → vaciar carrito → auditar/encolar.

**10. Trazabilidad.** `[ENU]` OBJ-08; `[MOD]` §9.4, §10.1–§10.4, §22.3–§22.4, §25 (DM-08, DM-09, DM-10, DM-15, DM-16, DM-17); `[VO]` §6.5, §6.7, §7.1, §7.3, §8.11, §8.12, §8.17; `[DS]` DS-03, DS-04, DS-05, DS-06, DS-09; `[ARQ]` §7.2.

**Estado:** `Confirmado`; `Limitado` por L-01 (dirección), L-04/L-05 (moneda, tasas), L-07 (preferencia de bodega) y L-22 (protocolo de pago). La política transaccional `L-25` se cierra a nivel de diseño en `D-16` (casos de uso); los valores numéricos quedan configurables.

**Conciliación C-16:** `[MOD]` §11.1 exige `Pago.pedidoId`, por lo que un checkout multi-vendedor genera un pago por pedido, no un pago único por `checkoutGroupId`. La salida anterior en singular se interpreta como el caso de un solo pedido; el contrato corregido devuelve la lista de pagos. Un pago único para todo el grupo exigiría una decisión de modelo y no se adopta aquí.

---

#### PI-13 — `QueryOrder`

**1. Identificación.** `PI-13`, `QueryOrder`, módulo `orders`. Documentación: §5.5. Ubicación propuesta: `src/modules/orders/application/ports/query-order.port.ts`. Propósito: consultar pedidos y su estado según el alcance autorizado.

**2. Responsabilidad.** Devolver pedidos, líneas, estados, importes y resúmenes de pago, envío y posventa, sin mutar estado. Satisface OBJ-08 y parte de OBJ-12.

**3. Consumidores previstos.** Adaptadores autenticados de comprador propietario, vendedor propietario, Administrador, Supervisor (solo lectura) y operador asignado. Cada uno ve solo su alcance.

**4. Contrato de entrada.**

| Campo | Obligatorio | Tipo conceptual | Regla |
|---|---:|---|---|
| `actorId`, `rolActor`, `correlationId` | Sí | Contexto | Alcance autorizado. |
| `pedidoId` | Condicional | `PedidoId` | Si se consulta un pedido concreto. |
| `filtros` | No | Comprador, vendedor, estado, fecha, `checkoutGroupId` | Filtros de lista. |
| `paginacion` | No | Página/tamaño | Límites no fijados (L-19). |

**5. Contrato de salida.**

| Resultado | Contenido | Condición |
|---|---|---|
| `EXITO` | En modo detalle: pedido con líneas, snapshots, estados, importes y resúmenes de pago, envío, factura y posventa. En modo lista: página de pedidos con cabecera y resúmenes, sin líneas salvo que el contrato lo exija. | Consulta válida. |
| `RECHAZO` | `codigo`, `mensaje`, `detalles` | Alcance o filtro inválido. |
| `ERROR` | `codigo`, `mensaje`, `correlationId` | Fallo técnico. |

**6. Errores y resultados excepcionales.**

| Código | Significado | Cuándo |
|---|---|---|
| `NO_AUTORIZADO` | El rol no tiene la capacidad o el contexto es inválido. | DS-01. |
| `RECURSO_NO_ENCONTRADO` | El pedido no existe o está fuera del alcance del actor. | Identificador inválido o alcance; evita enumeración. |
| `VALIDACION_INVALIDA` | Filtro o paginación inválidos. | Fechas o estados desconocidos. |
| `LIMITE_EXCEDIDO` | Se supera el tamaño de página. | L-19. |
| `ERROR` | Fallo técnico no clasificado, incluida la fuente de lectura no disponible. | Infraestructura. |

**7. Precondiciones y postcondiciones.** Precondiciones: actor autorizado; filtros válidos. Postcondiciones: lectura sin mutación; no se exponen pedidos fuera del alcance autorizado; los datos sensibles se minimizan.

**8. Responsabilidades y límites.** Garantiza la consulta y el aislamiento por alcance. No modifica estados, no cancela, no reembolsa y no sustituye la consulta de auditoría. El modelo no define una entidad de asignación de operador logístico; el alcance del operador debe provenir del contexto de autorización y, si falta, la consulta se deniega (L-26).

**9. Relaciones y flujo.** OBJ-08, OBJ-12; `[MOD]` §10, §12.1, §14; `[DS]` DS-01; `[ARQ]` §5 (`orders`). Conceptos: `Pedido`, `ItemPedido`, `EstadoPedido`, `EstadoPago`, `EstadoEnvio`, `Factura`, `Devolucion`, `Reembolso`, `Dinero`. Flujo: autorizar alcance → validar filtros → consultar → componer resumen → paginar → devolver.

**10. Trazabilidad.** `[ENU]` OBJ-08, OBJ-12; `[MOD]` §10; `[VO]` §8.11, §8.12, §8.14; `[DS]` DS-01; `[ARQ]` §5.

**Estado:** `Inferido` de OBJ-08/OBJ-12; `Limitado` por L-19 y L-26.

**Conciliación C-19:** el contrato anterior devolvía `NO_AUTORIZADO` cuando el actor no tenía alcance; para no divulgar la existencia, un pedido existente pero fuera de alcance se devuelve como `RECURSO_NO_ENCONTRADO`. `NO_AUTORIZADO` queda para falta de rol/capacidad o contexto inválido.

---

#### PI-14 — `CancelOrder`

**1. Identificación.** `PI-14`, `CancelOrder`, módulo `orders`. Documentación: §5.5. Ubicación propuesta: `src/modules/orders/application/ports/cancel-order.port.ts`. Propósito: cancelar un pedido antes de la confirmación del pago, liberando sus reservas y terminando los intentos de pago cancelables.

**2. Responsabilidad.** Aplicar la transición `PENDIENTE_DE_PAGO → CANCELADO`, liberar reservas activas una sola vez y cancelar intentos de pago cuando el proveedor lo permita. No se usa para pedidos ya pagados.

**3. Consumidores previstos.** Adaptador autenticado del comprador propietario; adaptador administrativo autorizado. El vendedor y el operador no cancelan pedidos pagados por este puerto.

**4. Contrato de entrada.**

| Campo | Obligatorio | Tipo conceptual | Regla |
|---|---:|---|---|
| `actorId`, `rolActor`, `correlationId` | Sí | Contexto | Comprador propietario o Administrador. |
| `pedidoId` | Sí | `PedidoId` | Pedido existente. |
| `motivo` | Sí | Texto | Motivo de cancelación. |
| `versionEsperada` | Condicional | Versión del pedido | Control de concurrencia. |
| `idempotencyKey` | Sí | `IdempotencyKey` | Evita liberar dos veces. |

**5. Contrato de salida.**

| Resultado | Contenido | Condición |
|---|---|---|
| `EXITO` | `pedidoId`, `estado = CANCELADO`, reservas liberadas, intentos de pago cancelados | Cancelación completa. |
| `RECHAZO` | `codigo`, `mensaje`, `detalles` | Autorización, estado o pago. |
| `ERROR` | `codigo`, `mensaje`, `correlationId` | Fallo técnico; se registra el estado real. |

**6. Errores y resultados excepcionales.**

| Código | Significado | Cuándo |
|---|---|---|
| `NO_AUTORIZADO` | El actor no es propietario ni Administrador. | DS-01. |
| `RECURSO_NO_ENCONTRADO` | El pedido no existe. | Identificador inválido. |
| `TRANSICION_INVALIDA` | El pedido no está `PENDIENTE_DE_PAGO`. | Pedido pagado, despachado o cerrado. |
| `DEPENDENCIA_NO_DISPONIBLE` | El proveedor de pago no permite cancelar el intento. | Se conserva el estado y se reintenta. |
| `CONFLICTO_CONCURRENCIA` | El pedido cambió desde la lectura. | Pago confirmado en paralelo. |

**7. Precondiciones y postcondiciones.**

- Precondiciones: pedido `PENDIENTE_DE_PAGO`; actor autorizado; motivo; reservas identificables; versión esperada.
- Postcondiciones: pedido `CANCELADO`; reservas liberadas una sola vez; intentos de pago cancelados cuando sea posible; se conserva el motivo y la auditoría. Un pago ya confirmado no se cancela por este puerto.

**8. Responsabilidades y límites.** Garantiza la cancelación previa al pago y la liberación idempotente. No cancela pedidos pagados, no reembolsa, no elimina el pedido, no revierte una entrega y no sustituye el flujo de devolución/reembolso.

**9. Relaciones y flujo.** OBJ-08; `[MOD]` §10.3–§10.4; `[DS]` DS-03, DS-06, DS-09; `[ARQ]` §5 (`orders`). Conceptos: `Pedido`, `EstadoPedido`, `ReservaInventario`, `Pago`, `IdempotencyKey`. Flujo: autorizar → recuperar pedido → validar estado → liberar reservas → cancelar intentos → persistir → auditar/encolar.

**10. Trazabilidad.** `[ENU]` OBJ-08; `[MOD]` §10.3–§10.4, §25 (DM-17); `[VO]` §8.11, §8.12, §8.17; `[DS]` DS-03, DS-06, DS-09.

**Estado:** `Confirmado`; `Limitado` por L-22 (cancelación en el proveedor de pago).

---

### 5.6 Módulo `payments`

#### PI-15 — `ConfirmPayment`

**1. Identificación.** `PI-15`, `ConfirmPayment`, módulo `payments`. Documentación: §5.6. Ubicación propuesta: `src/modules/payments/application/ports/confirm-payment.port.ts`. Propósito: registrar el resultado verificado de un pago y aplicar, una sola vez, sus efectos sobre el pedido y las reservas.

**2. Responsabilidad.** Correlacionar un evento o resultado del proveedor con un `Pago` y un `Pedido`, actualizar el estado del pago, confirmar o cancelar el pedido según el resultado, liberar reservas si corresponde e iniciar la entrega digital cuando el pago queda confirmado. Satisface OBJ-08/OBJ-09 y el candidato `ConfirmPayment`.

**3. Consumidores previstos.** Adaptador de webhook o conciliación del proveedor de pago, con autenticidad ya verificada; adaptador administrativo de conciliación autorizado. No es un puerto para que el comprador declare su propio pago.

**4. Contrato de entrada.**

| Campo | Obligatorio | Tipo conceptual | Regla |
|---|---:|---|---|
| `paymentId` o `referenciaExterna` | Sí | Identificador | Debe correlacionar con un pago existente. |
| `resultadoProveedor` | Sí | `AUTORIZADO` \| `CAPTURADO` \| `RECHAZADO` \| `EXPIRADO` | Resultado normalizado. |
| `importe` | Sí | `Dinero` | Debe coincidir con el importe solicitado. |
| `ocurridoEn` | Sí | `Instant` | Momento del proveedor. |
| `idempotencyKey` | Sí | `IdempotencyKey` | Evita doble efecto. |
| `correlationId` | Sí | `CorrelationId` | Trazabilidad del evento. |

**5. Contrato de salida.**

| Resultado | Contenido | Condición |
|---|---|---|
| `EXITO` | `pagoId`, `estadoPago`, `pedidoId`, `estadoPedido`, reservas liberadas/consumidas, entrega digital iniciada | Evento aplicado una vez. |
| `RECHAZO` | `codigo`, `mensaje`, `detalles` | Correlación, importe o transición inválida. |
| `ERROR` | `codigo`, `mensaje`, `correlationId` | Fallo técnico; el evento queda pendiente de reintento. |

**6. Errores y resultados excepcionales.**

| Código | Significado | Cuándo |
|---|---|---|
| `RECURSO_NO_ENCONTRADO` | No existe pago o pedido correlacionable. | Referencia desconocida. |
| `VALIDACION_INVALIDA` | Importe, moneda o resultado inválido. | No coincide con el pago. |
| `TRANSICION_INVALIDA` | El pago o el pedido no admiten el resultado. | Pedido ya cancelado/cerrado. |
| `IDEMPOTENCIA_CONFLICTO` | El mismo evento se repite con datos distintos. | Reintento con otro importe. |
| `DEPENDENCIA_NO_DISPONIBLE` | Fallo al persistir, auditar o entregar digitalmente. | Se reintenta de forma idempotente. |

**7. Precondiciones y postcondiciones.**

- Precondiciones: evento autenticado y verificado por el adaptador; pago y pedido existentes; importe/moneda coincidentes; pedido en estado compatible.
- Postcondiciones: el pago cambia una sola vez; el pedido pasa a `PAGADO` o `CANCELADO` según el resultado; las reservas se conservan o liberan; la entrega digital se inicia si aplica; la auditoría y el evento quedan registrados. Un webhook duplicado no duplica la transición (DM-18).

**8. Responsabilidades y límites.** Garantiza la idempotencia y la correlación. No verifica firmas (lo hace el adaptador), no almacena datos de tarjeta, no define el protocolo del proveedor, no emite factura y no despacha. La confirmación de pago no sustituye la conciliación financiera cuando la política la exija.

**9. Relaciones y flujo.** OBJ-08, OBJ-09; `[MOD]` §11.1, §22.3–§22.4; `[DS]` DS-03, DS-06, DS-09; `[ARQ]` §7.2. Conceptos: `Pago`, `EstadoPago`, `Pedido`, `EstadoPedido`, `ReservaInventario`, `IdempotencyKey`. Flujo: recibir evento verificado → correlacionar → validar importe → actualizar pago → aplicar transición del pedido → liberar/consumir reservas → iniciar entrega digital → auditar/encolar.

**10. Trazabilidad.** `[ENU]` OBJ-08, OBJ-09; `[MOD]` §11.1, §22.3–§22.4, §25 (DM-17, DM-18); `[VO]` §8.12; `[DS]` DS-03, DS-06, DS-09; `[ARQ]` §7.2.

**Estado:** `Confirmado`; `Limitado` por L-22 (protocolo del proveedor y modelo autorización/captura).

### 5.7 Módulo `shipping`

#### PI-16 — `PrepareShipment`

**1. Identificación.** `PI-16`, `PrepareShipment`, módulo `shipping`. Documentación: §5.7. Ubicación propuesta: `src/modules/shipping/application/ports/prepare-shipment.port.ts`. Propósito: asignar bodega y preparar/empacar las unidades de un pedido pagado antes del despacho.

**2. Responsabilidad.** Crear o actualizar un `Envio` con las líneas y cantidades asignadas, validar que las reservas sigan activas y llevar el envío a `PREPARACION` o `EMPACADO`, dejando el pedido en `EN_PREPARACION`. Satisface OBJ-10.

**3. Consumidores previstos.** Adaptador autenticado del operador logístico asignado; adaptador administrativo autorizado. El comprador y el vendedor no preparan envíos.

**4. Contrato de entrada.**

| Campo | Obligatorio | Tipo conceptual | Regla |
|---|---:|---|---|
| `actorId`, `rolActor`, `correlationId` | Sí | Contexto | Operador asignado o Administrador. |
| `pedidoId` | Sí | `PedidoId` | Pedido pagado. |
| `bodegaId` | Sí | `BodegaId` | Bodega activa y compatible. |
| `items` | Sí | Líneas/cantidades | No exceden lo comprado ni lo reservado. |
| `transportista` | No | Texto | Puede completarse al asignar el operador externo. |
| `versionEsperada` | Condicional | Versión del pedido/envío | Control de concurrencia. |

**5. Contrato de salida.**

| Resultado | Contenido | Condición |
|---|---|---|
| `EXITO` | `envioId`, `estadoEnvio`, `pedidoId`, `estadoPedido` | Envío preparado/empacado. |
| `RECHAZO` | `codigo`, `mensaje`, `detalles` | Autorización, estado, cantidades o bodega. |
| `ERROR` | `codigo`, `mensaje`, `correlationId` | Fallo técnico. |

**6. Errores y resultados excepcionales.**

| Código | Significado | Cuándo |
|---|---|---|
| `NO_AUTORIZADO` | El actor no está asignado. | DS-01. |
| `TRANSICION_INVALIDA` | El pedido no está pagado o el envío no admite preparación. | ORD-03. |
| `REGLA_NEGOCIO_INCUMPLIDA` | Reserva inactiva, cantidades excesivas o bodega incompatible. | INV-04, ORD-07. |
| `CONFLICTO_CONCURRENCIA` | El pedido/envío cambió desde la lectura. | Preparación concurrente. |
| `DEPENDENCIA_NO_DISPONIBLE` | Fallo de persistencia o auditoría. | Unidad de trabajo no completada. |

**7. Precondiciones y postcondiciones.**

- Precondiciones: pedido `PAGADO` o `EN_PREPARACION`; reservas activas y correspondientes; bodega activa; cantidades asignables; actor autorizado.
- Postcondiciones: el envío existe en `PREPARACION` o `EMPACADO`; el pedido queda `EN_PREPARACION`; no se consume inventario todavía; la auditoría y el evento quedan registrados.

**8. Responsabilidades y límites.** Garantiza la preparación y la coherencia de cantidades. No despacha, no consume reservas, no confirma entrega, no elige la bodega por preferencia comercial y no procesa devoluciones. El transporte externo se integra en `PI-17`.

**9. Relaciones y flujo.** OBJ-10; `[MOD]` §13.1–§13.2; `[DS]` DS-04, DS-06, DS-09; `[ARQ]` §5 (`shipping`). Conceptos: `Pedido`, `Envio`, `ItemEnvio`, `EstadoEnvio`, `Bodega`, `ReservaInventario`. Flujo: autorizar → validar pedido/reservas → asignar bodega/líneas → crear/actualizar envío → cambiar estados → persistir → auditar.

**10. Trazabilidad.** `[ENU]` OBJ-10; `[MOD]` §13.1–§13.2, §22.5; `[VO]` §8.14; `[DS]` DS-04, DS-06, DS-09; `[ARQ]` §5.

**Estado:** `Inferido` del modelo logístico; `Limitado` por L-07 (preferencia de bodega) y L-23 (eventos del proveedor logístico).

---

#### PI-17 — `DispatchOrder`

**1. Identificación.** `PI-17`, `DispatchOrder`, módulo `shipping`. Documentación: §5.7. Ubicación propuesta: `src/modules/shipping/application/ports/dispatch-order.port.ts`. Propósito: despachar un envío preparado, consumir la reserva y registrar la salida física del inventario.

**2. Responsabilidad.** Validar que el pedido esté pagado y el envío preparado, consumir la reserva activa, registrar `SALIDA_VENTA`, cambiar el envío a `DESPACHADO` y el pedido a `DESPACHADO`, y registrar el seguimiento cuando exista. Satisface OBJ-10 y el candidato `DispatchOrder`.

**3. Consumidores previstos.** Adaptador autenticado del operador logístico asignado; adaptador administrativo autorizado. El transportista externo puede reportar el evento, pero la aplicación conserva la decisión de estado.

**4. Contrato de entrada.**

| Campo | Obligatorio | Tipo conceptual | Regla |
|---|---:|---|---|
| `actorId`, `rolActor`, `correlationId` | Sí | Contexto | Operador asignado o Administrador. |
| `pedidoId` o `envioId` | Sí | Identificador | Envío preparado. |
| `transportista` | Condicional | Texto | Puede requerirse para el despacho. |
| `trackingNumber` | No | Texto | Se completa si el proveedor lo entrega. |
| `evidenciaDespacho` | Condicional | Referencia opaca | Si la política operativa la exige. |
| `idempotencyKey` | Sí | `IdempotencyKey` | Evita consumir dos veces la reserva. |
| `versionEsperada` | Condicional | Versión | Control de concurrencia. |

**5. Contrato de salida.**

| Resultado | Contenido | Condición |
|---|---|---|
| `EXITO` | `envioId`, `estadoEnvio = DESPACHADO`, `pedidoId`, `estadoPedido`, `movimientoId`, saldos | Despacho completo. |
| `RECHAZO` | `codigo`, `mensaje`, `detalles` | Autorización, estado, reserva o cantidades. |
| `ERROR` | `codigo`, `mensaje`, `correlationId` | Fallo técnico; no se duplica la salida. |

**6. Errores y resultados excepcionales.**

| Código | Significado | Cuándo |
|---|---|---|
| `NO_AUTORIZADO` | El actor no está asignado. | DS-01. |
| `TRANSICION_INVALIDA` | El pedido no está pagado o el envío no está preparado. | DM-19. |
| `REGLA_NEGOCIO_INCUMPLIDA` | La reserva no está activa o no cubre la cantidad. | INV-03, INV-07. |
| `CONFLICTO_CONCURRENCIA` | El envío o la reserva cambiaron. | Despacho concurrente. |
| `IDEMPOTENCIA_CONFLICTO` | La clave se usó con otro envío. | Reintento con datos distintos. |
| `DEPENDENCIA_NO_DISPONIBLE` | Fallo del proveedor logístico o de persistencia. | Se conserva el estado real. |

**7. Precondiciones y postcondiciones.**

- Precondiciones: pedido `PAGADO` o `EN_PREPARACION`; envío `PREPARACION` o `EMPACADO`; reserva activa suficiente; cantidades empacadas; actor autorizado.
- Postcondiciones: la reserva pasa a `CONSUMIDA`; se registra `SALIDA_VENTA` con reducción atómica de `onHand` y `reserved`; el envío queda `DESPACHADO`; el pedido queda `DESPACHADO`; el seguimiento se registra si existe; la auditoría y el evento quedan registrados.

**8. Responsabilidades y límites.** Garantiza el consumo atómico y la transición. No confirma entrega, no cierra el pedido, no procesa devoluciones, no elige bodega y no sustituye la integración con el transportista. Un fallo externo no revierte por sí solo la salida ya confirmada; se resuelve con el flujo operativo correspondiente.

**9. Relaciones y flujo.** OBJ-10; `[MOD]` §13.1–§13.2, §22.5; `[DS]` DS-03, DS-06, DS-09; `[ARQ]` §7.2. Conceptos: `Envio`, `EstadoEnvio`, `Pedido`, `EstadoPedido`, `ReservaInventario`, `MovimientoInventario`, `TipoMovimientoInventario`. Flujo: autorizar → validar pedido/envío/reserva → consumir reserva → registrar salida → cambiar estados → persistir → auditar/encolar.

**10. Trazabilidad.** `[ENU]` OBJ-10; `[MOD]` §13.1–§13.2, §22.5, §25 (DM-13, DM-19); `[VO]` §8.14, §8.17; `[DS]` DS-03, DS-06, DS-09; `[ARQ]` §7.2.

**Estado:** `Confirmado`; `Limitado` por L-23 (eventos/tracking del proveedor).

---

#### PI-18 — `ConfirmDelivery`

**1. Identificación.** `PI-18`, `ConfirmDelivery`, módulo `shipping`. Documentación: §5.7. Ubicación propuesta: `src/modules/shipping/application/ports/confirm-delivery.port.ts`. Propósito: registrar el resultado de una entrega —entregada o fallida— con evidencia válida.

**2. Responsabilidad.** Aplicar la transición del envío a `ENTREGADO` o `FALLIDO`, y llevar el pedido a `ENTREGADO` solo cuando todos sus envíos requeridos estén entregados. Para productos digitales, registrar la evidencia de entrega digital. Satisface OBJ-10.

**3. Consumidores previstos.** Adaptador del operador logístico asignado; adaptador de webhook del transportista con autenticidad verificada; adaptador administrativo autorizado. El comprador no confirma por este puerto salvo que una política futura lo defina.

**4. Contrato de entrada.**

| Campo | Obligatorio | Tipo conceptual | Regla |
|---|---:|---|---|
| `actorId`, `rolActor`, `correlationId` | Sí | Contexto | Operador, transportista verificado o Administrador. |
| `envioId` | Sí | `EnvioId` | Envío despachado o en tránsito. |
| `resultado` | Sí | `ENTREGADO` \| `FALLIDO` | Resultado de la entrega. |
| `evidencia` | Sí | Referencia/tipo/fecha | Obligatoria para `ENTREGADO`; para `FALLIDO`, motivo y evidencia si existen. |
| `idempotencyKey` | Sí | `IdempotencyKey` | Evita duplicar la transición. |
| `versionEsperada` | Condicional | Versión | Control de concurrencia. |

**5. Contrato de salida.**

| Resultado | Contenido | Condición |
|---|---|---|
| `EXITO` | `envioId`, `estadoEnvio`, `pedidoId`, `estadoPedido`, evidencia registrada | Resultado aplicado. |
| `RECHAZO` | `codigo`, `mensaje`, `detalles` | Autorización, estado o evidencia. |
| `ERROR` | `codigo`, `mensaje`, `correlationId` | Fallo técnico. |

**6. Errores y resultados excepcionales.**

| Código | Significado | Cuándo |
|---|---|---|
| `NO_AUTORIZADO` | El actor no está asignado o el webhook no es válido. | DS-01. |
| `TRANSICION_INVALIDA` | El envío no está despachado/en tránsito. | Estado incompatible. |
| `VALIDACION_INVALIDA` | Falta evidencia o el resultado es desconocido. | Entrega sin prueba. |
| `CONFLICTO_CONCURRENCIA` | El envío cambió desde la lectura. | Eventos concurrentes. |
| `IDEMPOTENCIA_CONFLICTO` | La clave se usó con otro resultado. | Reintento con datos distintos. |

**7. Precondiciones y postcondiciones.**

- Precondiciones: envío `DESPACHADO` o `EN_TRANSITO`; evidencia válida para entrega; actor autorizado; para pedido global, todos los envíos requeridos identificados.
- Postcondiciones: el envío queda `ENTREGADO` o `FALLIDO`; el pedido pasa a `ENTREGADO` solo si todos los envíos requeridos están entregados (LOG-02); la evidencia queda registrada; la auditoría y el evento quedan registrados. Un fallo de entrega no equivale a devolución aceptada.

**8. Responsabilidades y límites.** Garantiza la transición y la evidencia. No cierra el pedido (`CERRADO`), no procesa devoluciones, no reembolsa, no modifica inventario por un fallo y no sustituye el flujo de logística inversa. La entrega digital se apoya en el proveedor correspondiente.

**9. Relaciones y flujo.** OBJ-10; `[MOD]` §13.1–§13.3, §22.5; `[DS]` DS-06, DS-09; `[ARQ]` §5 (`shipping`). Conceptos: `Envio`, `EstadoEnvio`, `Pedido`, `EstadoPedido`, `DireccionSnapshot`. Flujo: autorizar/verificar evento → recuperar envío → validar estado/evidencia → aplicar resultado → evaluar todos los envíos → actualizar pedido → auditar/encolar.

**10. Trazabilidad.** `[ENU]` OBJ-10; `[MOD]` §13.1–§13.3, §22.5, §25 (DM-20); `[VO]` §8.14; `[DS]` DS-06, DS-09; `[ARQ]` §5.

**Estado:** `Inferido` del modelo logístico; `Limitado` por L-23 (eventos del proveedor) y por la ausencia de una política de confirmación por parte del comprador.

---

### 5.8 Módulo `billing`

#### PI-19 — `IssueInvoice`

**1. Identificación.** `PI-19`, `IssueInvoice`, módulo `billing`. Documentación: §5.8. Ubicación propuesta: `src/modules/billing/application/ports/issue-invoice.port.ts`. Propósito: emitir la factura de un pedido con pago confirmado, con snapshots inmutables de emisor, receptor y líneas.

**2. Responsabilidad.** Verificar que el pedido esté pagado, construir los snapshots y las líneas facturadas, asignar el número de la serie fiscal y persistir la factura en estado `EMITIDA`. Satisface OBJ-09.

**3. Consumidores previstos.** Adaptador de sistema posterior a la confirmación del pago; adaptador administrativo/financiero autorizado. El comprador no emite su propia factura.

**4. Contrato de entrada.**

| Campo | Obligatorio | Tipo conceptual | Regla |
|---|---:|---|---|
| `actorId`, `rolActor`, `correlationId` | Sí | Contexto | Sistema autorizado o Administrador/finanzas. |
| `pedidoId` | Sí | `PedidoId` | Pedido con pago confirmado. |
| `datosFiscalesReceptor` | Condicional | Datos del comprador | Si la política fiscal exige datos adicionales; composición limitada (L-11). |
| `idempotencyKey` | Sí | `IdempotencyKey` | Evita duplicar la factura. |
| `versionEsperada` | Condicional | Versión | Control de concurrencia. |

**5. Contrato de salida.**

| Resultado | Contenido | Condición |
|---|---|---|
| `EXITO` | `facturaId`, `numero`, `estado = EMITIDA`, `fechaEmision`, `documentoUri` opcional | Factura emitida. |
| `RECHAZO` | `codigo`, `mensaje`, `detalles` | Pago, datos, numeración o duplicado. |
| `ERROR` | `codigo`, `mensaje`, `correlationId` | Fallo técnico. |

**6. Errores y resultados excepcionales.**

| Código | Significado | Cuándo |
|---|---|---|
| `NO_AUTORIZADO` | El actor no puede emitir. | DS-01. |
| `TRANSICION_INVALIDA` | El pedido no tiene pago confirmado. | `[MOD]` §12.1. |
| `CONFLICTO_UNICIDAD` | Ya existe factura para el pedido o número duplicado. | Línea base una factura por pedido; serie fiscal. |
| `REGLA_NEGOCIO_INCUMPLIDA` | Faltan datos fiscales o no hay política de numeración. | L-11, L-17. |
| `IDEMPOTENCIA_CONFLICTO` | La clave se usó con otro pedido. | Reintento con datos distintos. |

**7. Precondiciones y postcondiciones.**

- Precondiciones: pedido con pago confirmado; no existe factura previa para el pedido en la línea base; datos fiscales disponibles; política de numeración/serie definida (L-17).
- Postcondiciones: factura `EMITIDA` con snapshots inmutables; número único en su serie; la factura no se edita después; la auditoría y el evento quedan registrados; el pedido no se modifica.

**8. Responsabilidades y límites.** Garantiza la emisión y la inmutabilidad. No define requisitos legales, series, numeración ni formato del documento (L-17); no genera el artefacto PDF (no hay puerto de almacenamiento documental justificado); no corrige ni anula (PI-20); no modifica el pedido.

**9. Relaciones y flujo.** OBJ-09; `[MOD]` §12.1; `[DS]` DS-09; `[ARQ]` §5 (`billing`). Conceptos: `Factura`, `EstadoFactura`, `NumeroFactura`, `DatosEmisorSnapshot`, `DatosReceptorSnapshot`, `LineaFactura`, `Dinero`. Flujo: autorizar → validar pago → verificar no duplicado → construir snapshots/líneas → asignar número → persistir → auditar/encolar.

**10. Trazabilidad.** `[ENU]` OBJ-09; `[MOD]` §12.1; `[VO]` §8.13, §9.5, §9.6; `[DS]` DS-09; `[ARQ]` §5.

**Estado:** `Inferido` de OBJ-09 y del agregado `Factura`; `Limitado` por L-17 (numeración/serie fiscal) y L-11 (composición de snapshots).

---

#### PI-20 — `CorrectInvoice`

**1. Identificación.** `PI-20`, `CorrectInvoice`, módulo `billing`. Documentación: §5.8. Ubicación propuesta: `src/modules/billing/application/ports/correct-invoice.port.ts`. Propósito: anular o corregir una factura emitida sin editarla silenciosamente, mediante un documento relacionado.

**2. Responsabilidad.** Aplicar la anulación o corrección de una factura `EMITIDA`, conservando el original y vinculando el documento correctivo. Satisface OBJ-09 y BILL-01.

**3. Consumidores previstos.** Adaptador administrativo/financiero autorizado. El comprador y el vendedor no corrigen facturas.

**4. Contrato de entrada.**

| Campo | Obligatorio | Tipo conceptual | Regla |
|---|---:|---|---|
| `actorId`, `rolActor`, `correlationId` | Sí | Contexto | Administrador/finanzas autorizado. |
| `facturaId` | Sí | `FacturaId` | Factura existente. |
| `accion` | Sí | `ANULAR` \| `CORREGIR` | Operación solicitada. |
| `motivo` | Sí | Texto | Motivo de la anulación/corrección. |
| `datosCorreccion` | Condicional | Datos/líneas corregidas | Requerido en `CORREGIR`. |
| `idempotencyKey` | Sí | `IdempotencyKey` | Evita duplicar el documento. |

**5. Contrato de salida.**

| Resultado | Contenido | Condición |
|---|---|---|
| `EXITO` | `facturaId`, `estadoAnterior`, `estadoNuevo`, `documentoCorrectivoId`/`numero` | Corrección aplicada. |
| `RECHAZO` | `codigo`, `mensaje`, `detalles` | Autorización, estado o datos. |
| `ERROR` | `codigo`, `mensaje`, `correlationId` | Fallo técnico. |

**6. Errores y resultados excepcionales.**

| Código | Significado | Cuándo |
|---|---|---|
| `NO_AUTORIZADO` | El actor no puede corregir. | DS-01. |
| `TRANSICION_INVALIDA` | La factura no está `EMITIDA`. | Ya anulada/corregida. |
| `VALIDACION_INVALIDA` | Falta motivo o datos de corrección. | Corrección incompleta. |
| `CONFLICTO_UNICIDAD` | El número del documento correctivo ya existe. | Serie fiscal. |
| `REGLA_NEGOCIO_INCUMPLIDA` | No hay política fiscal aplicable. | L-17. |

**7. Precondiciones y postcondiciones.**

- Precondiciones: factura `EMITIDA`; actor autorizado; motivo; datos de corrección cuando aplique; política fiscal/numeración definida.
- Postcondiciones: la factura original no se edita; su estado pasa a `ANULADA` o `CORREGIDA`; el documento correctivo queda vinculado; la auditoría y el evento quedan registrados.

**8. Responsabilidades y límites.** Garantiza la trazabilidad documental y la no edición silenciosa. No define la legislación fiscal ni la numeración (L-17); no elimina la factura original; no modifica el pedido ni el pago.

**9. Relaciones y flujo.** OBJ-09; `[MOD]` §12.1; `[DS]` DS-09; `[ARQ]` §5. Conceptos: `Factura`, `EstadoFactura`, `NumeroFactura`, `LineaFactura`. Flujo: autorizar → recuperar factura → validar estado → registrar motivo → crear vínculo correctivo → persistir → auditar/encolar.

**10. Trazabilidad.** `[ENU]` OBJ-09; `[MOD]` §12.1, §25 (BILL-01); `[VO]` §8.13; `[DS]` DS-09; `[ARQ]` §5.

**Estado:** `Inferido` de BILL-01 y del catálogo `EstadoFactura`; `Limitado` por L-17.

### 5.9 Módulo `returns` y `refunds`

#### PI-21 — `RequestReturn`

**1. Identificación.** `PI-21`, `RequestReturn`, módulo `returns`. Documentación: §5.9. Ubicación propuesta: `src/modules/returns/application/ports/request-return.port.ts`. Propósito: registrar una solicitud de devolución elegible sobre un pedido entregado.

**2. Responsabilidad.** Verificar propiedad, entrega, plazo, cantidades y motivo; crear la `Devolucion` en estado `SOLICITADA` o `EN_REVISION`; no modificar inventario ni ejecutar reembolso. Satisface OBJ-11 y el candidato `RequestReturn`.

**3. Consumidores previstos.** Adaptador autenticado del comprador propietario del pedido. El vendedor y el operador no solicitan devoluciones en nombre del comprador.

**4. Contrato de entrada.**

| Campo | Obligatorio | Tipo conceptual | Regla |
|---|---:|---|---|
| `actorId`, `rolActor`, `correlationId` | Sí | Contexto | Comprador propietario. |
| `pedidoId` | Sí | `PedidoId` | Pedido entregado o con entrega digital completada. |
| `items` | Sí | Líneas/cantidades | No exceden lo entregado ni lo ya solicitado/aprobado. |
| `motivo` | Sí | `MotivoDevolucion` | Debe pertenecer al catálogo; valores no enumerados (L-10). |
| `evidencia` | No | Referencia opaca | Puede ser exigida por la política de revisión. |
| `idempotencyKey` | Sí | `IdempotencyKey` | Evita duplicar la solicitud. |

**5. Contrato de salida.**

| Resultado | Contenido | Condición |
|---|---|---|
| `EXITO` | `devolucionId`, `estado`, `items`, `solicitadaEn` | Solicitud registrada. |
| `RECHAZO` | `codigo`, `mensaje`, `detalles` | Propiedad, plazo, cantidades o motivo. |
| `ERROR` | `codigo`, `mensaje`, `correlationId` | Fallo técnico. |

**6. Errores y resultados excepcionales.**

| Código | Significado | Cuándo |
|---|---|---|
| `NO_AUTORIZADO` | El actor no es el comprador propietario. | RET-01, DS-01. |
| `TRANSICION_INVALIDA` | El pedido no está entregado. | Devolución antes de entrega. |
| `REGLA_NEGOCIO_INCUMPLIDA` | Fuera de plazo, cantidad excedida o motivo inválido. | RET-02, RET-03/RET-06, L-10. |
| `RECURSO_NO_ENCONTRADO` | Pedido o línea inexistente. | Identificador inválido. |
| `IDEMPOTENCIA_CONFLICTO` | La clave se usó con otra solicitud. | Reintento con datos distintos. |

**7. Precondiciones y postcondiciones.**

- Precondiciones: pedido entregado; comprador propietario; dentro del plazo configurable; cantidades elegibles; motivo válido.
- Postcondiciones: la devolución persiste en `SOLICITADA` o `EN_REVISION`; no se altera inventario; no se ejecuta reembolso; la auditoría y el evento quedan registrados.

**8. Responsabilidades y límites.** Garantiza la solicitud y la elegibilidad inicial. No aprueba, no rechaza, no recibe, no inspecciona, no reingresa inventario y no reembolsa. El plazo tiene valor inicial 30 días y es configurable (`DEC-W1-002`); el catálogo de motivos sigue limitado (`L-10`).

**9. Relaciones y flujo.** OBJ-11; `[MOD]` §14.1, §22.6; `[DS]` DS-07, DS-09; `[ARQ]` §7.2. Conceptos: `Devolucion`, `LineaDevolucion`, `EstadoDevolucion`, `MotivoDevolucion`, `Pedido`, `Comprador`. Flujo: autorizar propiedad → validar entrega/plazo → validar cantidades/motivo → crear devolución → persistir → auditar/encolar.

**10. Trazabilidad.** `[ENU]` OBJ-11; `[MOD]` §14.1, §22.6, §25 (DM-27); `[VO]` §8.15, §9.2; `[DS]` DS-07, DS-09; `[ARQ]` §7.2.

**Estado:** `Confirmado`; plazo aprobado (`DEC-W1-002`); `Limitado` por L-10 (catálogo de motivos).

---

#### PI-22 — `ResolveReturn`

**1. Identificación.** `PI-22`, `ResolveReturn`, módulo `returns`. Documentación: §5.9. Ubicación propuesta: `src/modules/returns/application/ports/resolve-return.port.ts`. Propósito: ejecutar las etapas de revisión, aprobación, rechazo, recepción, inspección y resolución de una devolución.

**2. Responsabilidad.** Aplicar las transiciones de `EstadoDevolucion`, verificar separación de funciones y, para productos físicos, registrar la recepción e inspección con los movimientos de inventario correspondientes. Para productos digitales, coordinar la revocación del acceso o licencia cuando la política lo permita, sin registrar ingreso a inventario físico. Coordina con `PI-23` cuando la resolución exige reembolso, pero no ejecuta el dinero por sí mismo.

**3. Consumidores previstos.** Adaptador autenticado de Administrador o rol autorizado para devoluciones; adaptador del operador logístico para recepción; adaptadores de prueba. El comprador no aprueba su propia solicitud.

**4. Contrato de entrada.**

| Campo | Obligatorio | Tipo conceptual | Regla |
|---|---:|---|---|
| `actorId`, `rolActor`, `correlationId` | Sí | Contexto | Actor autorizado; no el solicitante cuando hay conflicto. |
| `devolucionId` | Sí | `DevolucionId` | Devolución existente. |
| `accion` | Sí | `REVISAR` \| `APROBAR` \| `RECHAZAR` \| `RECIBIR` \| `RESOLVER` | Etapa solicitada. |
| `motivoDecision` | Condicional | Texto | Obligatorio en rechazo y resolución. |
| `inspeccion` | Condicional | Resultado vendible/no vendible | Obligatoria al recibir productos físicos. |
| `items` | Condicional | Líneas/cantidades | Para recepción o resolución parcial. |
| `idempotencyKey` | Sí | `IdempotencyKey` | Evita duplicar movimientos/transiciones. |
| `versionEsperada` | Condicional | Versión | Control de concurrencia. |

**5. Contrato de salida.**

| Resultado | Contenido | Condición |
|---|---|---|
| `EXITO` | `devolucionId`, `estadoAnterior`, `estadoNuevo`, movimientos de inventario, `requiereReembolso` | Etapa aplicada. |
| `RECHAZO` | `codigo`, `mensaje`, `detalles` | Autorización, transición, inspección o cantidades. |
| `ERROR` | `codigo`, `mensaje`, `correlationId` | Fallo técnico. |

**6. Errores y resultados excepcionales.**

| Código | Significado | Cuándo |
|---|---|---|
| `NO_AUTORIZADO` | El actor no puede resolver o es el solicitante. | DS-01, separación de funciones. |
| `TRANSICION_INVALIDA` | La etapa no corresponde al estado actual. | §14.3. |
| `VALIDACION_INVALIDA` | Falta motivo, inspección o cantidades. | Resolución incompleta. |
| `REGLA_NEGOCIO_INCUMPLIDA` | La inspección o el reingreso violan inventario. | INV-09. |
| `CONFLICTO_CONCURRENCIA` | La devolución cambió desde la lectura. | Resolución concurrente. |
| `IDEMPOTENCIA_CONFLICTO` | La clave se usó con otra etapa. | Reintento con datos distintos. |

**7. Precondiciones y postcondiciones.**

- Precondiciones: devolución existente; actor autorizado y sin conflicto; estado permite la etapa; para recepción física, inspección; para resolución, reembolso resuelto si aplica.
- Postcondiciones: la devolución avanza una sola vez; el inventario solo se incrementa después de recepción e inspección (`DEVOLUCION_VENDIBLE` o `DEVOLUCION_NO_VENDIBLE`); para productos digitales, la revocación se registra si aplica y no se crea movimiento de inventario físico; una devolución `RESUELTA` no se reabre; la auditoría y el evento quedan registrados.

**8. Responsabilidades y límites.** Garantiza las transiciones y la inspección. No ejecuta el reembolso (PI-23), no define el valor del plazo (aprobado en `DEC-W1-002`) ni los motivos (`L-10`), no reabre una devolución resuelta y no sustituye la decisión financiera. La revocación digital se delega en la capacidad de entrega digital (PO-19); la aprobación y el reembolso se separan por funciones.

**9. Relaciones y flujo.** OBJ-11; `[MOD]` §14.1, §14.3, §22.6; `[DS]` DS-07, DS-03, DS-09; `[ARQ]` §5 (`returns`). Conceptos: `Devolucion`, `EstadoDevolucion`, `LineaDevolucion`, `MovimientoInventario`, `TipoMovimientoInventario`, revocación digital. Flujo: autorizar → recuperar devolución → validar etapa → aplicar decisión → recibir/inspeccionar (físico) o revocar acceso (digital) → registrar movimientos/evidencia → resolver → auditar/encolar.

**10. Trazabilidad.** `[ENU]` OBJ-11; `[MOD]` §14.1, §14.3, §22.6, §25 (DM-27); `[VO]` §8.15, §8.17; `[DS]` DS-03, DS-07, DS-09; `[ARQ]` §5.

**Estado:** `Inferido` del ciclo de posventa; plazo aprobado (`DEC-W1-002`); `Limitado` por L-10, L-18 y la atribución del rol financiero (DEC-BIZ-07).

---

#### PI-23 — `ProcessRefund`

**1. Identificación.** `PI-23`, `ProcessRefund`, módulo `refunds`. Documentación: §5.9. Ubicación propuesta: `src/modules/refunds/application/ports/process-refund.port.ts`. Propósito: solicitar, aprobar y ejecutar un reembolso vinculado a un pago capturado, respetando el saldo reembolsable y la separación de funciones.

**2. Responsabilidad.** Coordinar el ciclo `SOLICITADO → APROBADO → EN_PROCESO → COMPLETADO` o `FALLIDO`, verificar el saldo capturado menos reembolsos comprometidos, invocar al proveedor de pago de forma idempotente y actualizar el estado del pago. Satisface OBJ-11 y el candidato `ProcessRefund`.

**3. Consumidores previstos.** Adaptador del comprador o Administrador para solicitar; adaptador del aprobador financiero autorizado para aprobar; adaptador de sistema/finanzas para ejecutar. La misma persona no puede solicitar y aprobar cuando existe conflicto.

**4. Contrato de entrada.**

| Campo | Obligatorio | Tipo conceptual | Regla |
|---|---:|---|---|
| `actorId`, `rolActor`, `correlationId` | Sí | Contexto | Rol y autorización según la etapa. |
| `accion` | Sí | `SOLICITAR` \| `APROBAR` \| `EJECUTAR` | Etapa del reembolso. |
| `pagoId` | Sí | `PagoId` | Pago capturado. |
| `pedidoId` | Sí | `PedidoId` | Pedido asociado. |
| `devolucionId` | Condicional | `DevolucionId` | Obligatorio si se origina en una devolución. |
| `importe` | Condicional | `Dinero` | Mayor que cero; no excede el saldo reembolsable. |
| `motivo` | Sí | `MotivoReembolso` | Obligatorio; valores no enumerados (L-10). |
| `idempotencyKey` | Sí | `IdempotencyKey` | Evita duplicar el reembolso. |
| `versionEsperada` | Condicional | Versión | Control de concurrencia. |

**5. Contrato de salida.**

| Resultado | Contenido | Condición |
|---|---|---|
| `EXITO` | `reembolsoId`, `estado`, `importe`, `referenciaExterna` cuando exista | Etapa aplicada. |
| `RECHAZO` | `codigo`, `mensaje`, `detalles` | Autorización, saldo, estado o moneda. |
| `ERROR` | `codigo`, `mensaje`, `correlationId` | Fallo técnico; el reembolso no se marca completado. |

**6. Errores y resultados excepcionales.**

| Código | Significado | Cuándo |
|---|---|---|
| `NO_AUTORIZADO` | El actor no puede ejecutar la etapa o hay conflicto de interés. | DS-01, DS-08, DEC-BIZ-07. |
| `REGLA_NEGOCIO_INCUMPLIDA` | Importe excesivo, moneda incompatible o pago no capturado. | REF-01, PAY-05. |
| `TRANSICION_INVALIDA` | La etapa no corresponde al estado. | Aprobar un completado. |
| `IDEMPOTENCIA_CONFLICTO` | La clave se usó con otro importe/pago. | Reintento con datos distintos. |
| `DEPENDENCIA_NO_DISPONIBLE` | El proveedor de pago falla o no responde. | Estado `FALLIDO`, no `COMPLETADO`. |

**7. Precondiciones y postcondiciones.**

- Precondiciones: pago capturado; saldo reembolsable suficiente; motivo; actor autorizado según etapa; separación de funciones; moneda compatible.
- Postcondiciones: el reembolso persiste y avanza una sola vez; el proveedor se invoca de forma idempotente; el pago pasa a `REEMBOLSO_PARCIAL` o `REEMBOLSADO` cuando corresponde; un fallo externo no se marca como completado; la auditoría y el evento quedan registrados.

**8. Responsabilidades y límites.** Garantiza el saldo, la idempotencia y la separación de funciones. No aprueba devoluciones (PI-22), no modifica totales del pedido, no define el rol financiero (DEC-BIZ-07) ni la escala monetaria (L-04), y no sustituye la conciliación del proveedor.

**9. Relaciones y flujo.** OBJ-11; `[MOD]` §14.2, §22.6; `[DS]` DS-08, DS-09; `[ARQ]` §7.2. Conceptos: `Reembolso`, `EstadoReembolso`, `Pago`, `EstadoPago`, `Dinero`, `MotivoReembolso`, `IdempotencyKey`. Flujo: autorizar etapa → validar pago/saldo/moneda → crear/aprobar reembolso → invocar proveedor → actualizar estado → auditar/encolar.

**10. Trazabilidad.** `[ENU]` OBJ-11; `[MOD]` §14.2, §22.6, §25 (DM-22); `[VO]` §6.5, §8.12, §8.16; `[DS]` DS-08, DS-09; `[ARQ]` §7.2.

**Estado:** `Confirmado`; `Limitado` por L-04 (moneda/escala), L-10 (motivos), DEC-BIZ-07 (aprobador financiero) y L-22 (protocolo del proveedor).

---

### 5.10 Módulo `reporting`

#### PI-24 — `GenerateAdministrativeReport`

**1. Identificación.** `PI-24`, `GenerateAdministrativeReport`, módulo `reporting`. Documentación: §5.10. Ubicación propuesta: `src/modules/reporting/application/ports/generate-administrative-report.port.ts`. Propósito: generar reportes e indicadores de lectura para perfiles administrativos autorizados.

**2. Responsabilidad.** Consultar datos consolidados de ventas, pedidos, inventario, devoluciones, reembolsos u otros dominios autorizados, aplicar filtros y devolver el resultado sin mutar estado. Satisface OBJ-12 y el candidato homónimo.

**3. Consumidores previstos.** Adaptador autenticado de Administrador y de Supervisor en modo solo lectura. Otros roles solo si una política futura lo autoriza.

**4. Contrato de entrada.**

| Campo | Obligatorio | Tipo conceptual | Regla |
|---|---:|---|---|
| `actorId`, `rolActor`, `correlationId` | Sí | Contexto | Administrador o Supervisor. |
| `tipoReporte` | Sí | Catálogo de reportes | Valores no enumerados por la fuente (L-19). |
| `rangoFechas` | Condicional | Desde/hasta | Según el reporte. |
| `filtros` | No | Vendedor, comprador, estado, categoría, etc. | Según el reporte. |
| `agrupacion` | No | Dimensión | Según el reporte. |
| `paginacion` | No | Página/tamaño | Límites no fijados (L-19). |

**5. Contrato de salida.**

| Resultado | Contenido | Condición |
|---|---|---|
| `EXITO` | Filas/agregados, totales, `generadoEn`, indicador de frescura | Reporte generado. |
| `RECHAZO` | `codigo`, `mensaje`, `detalles` | Autorización, tipo o filtros. |
| `ERROR` | `codigo`, `mensaje`, `correlationId` | Fallo de lectura. |

**6. Errores y resultados excepcionales.**

| Código | Significado | Cuándo |
|---|---|---|
| `NO_AUTORIZADO` | El actor no puede consultar el reporte. | DS-01, SUP-01. |
| `OPERACION_NO_SOPORTADA` | El tipo de reporte no existe. | Catálogo no definido (L-19). |
| `VALIDACION_INVALIDA` | Rango, filtro o agrupación inválidos. | Fechas inconsistentes. |
| `DEPENDENCIA_NO_DISPONIBLE` | Fuente de lectura no disponible. | SQL/MongoDB/proyección. |

**7. Precondiciones y postcondiciones.** Precondiciones: actor autorizado; catálogo de reportes definido; filtros válidos. Postcondiciones: lectura sin mutación; se respeta el alcance; se indica la frescura si la proyección es eventual.

**8. Responsabilidades y límites.** Garantiza la consulta autorizada y la composición del reporte. No define el catálogo ni las fórmulas (L-19), no muta estado, no expone datos sensibles innecesarios y no sustituye la consulta operativa de pedidos o auditoría.

**9. Relaciones y flujo.** OBJ-12; `[ARQ]` §5 (`reporting`), §9.3; `[DS]` DS-01. Conceptos: indicadores de ventas, pedidos, inventario, devoluciones y reembolsos. Flujo: autorizar → validar tipo/filtros → consultar read model → agregar → paginar → devolver.

**10. Trazabilidad.** `[ENU]` OBJ-12; `[ARQ]` §5, §7.2, §9.3; `[DS]` DS-01; `[PM]` §5.4.

**Estado:** `Confirmado`; `Limitado` por L-19 (catálogo, parámetros y paginación).

---

#### PI-25 — `QueryAuditLog`

**1. Identificación.** `PI-25`, `QueryAuditLog`, módulo `reporting`. Documentación: §5.10. Ubicación propuesta: `src/modules/reporting/application/ports/query-audit-log.port.ts`. Propósito: consultar registros de auditoría autorizados sin modificarlos.

**2. Responsabilidad.** Devolver registros de auditoría filtrados por evento, recurso, actor, fecha, resultado, gravedad o correlación, con paginación y minimización de datos. Satisface OBJ-12 y el requisito de trazabilidad.

**3. Consumidores previstos.** Adaptador autenticado de Administrador y Supervisor en modo solo lectura. Otros roles solo si una política futura lo autoriza.

**4. Contrato de entrada.**

| Campo | Obligatorio | Tipo conceptual | Regla |
|---|---:|---|---|
| `actorId`, `rolActor`, `correlationId` | Sí | Contexto | Administrador o Supervisor. |
| `evento` | No | `CodigoEvento` | Filtro; catálogo no enumerado (L-14). |
| `recursoTipo`, `recursoId` | No | Texto/identificador | Filtro por recurso. |
| `actorFiltro` | No | `UsuarioId` | Filtro por actor. |
| `rangoFechas` | No | Desde/hasta | Filtro temporal. |
| `resultado`, `gravedad` | No | Catálogos | Filtros. |
| `correlationIdFiltro` | No | `CorrelationId` | Filtro por flujo. |
| `paginacion` | No | Página/tamaño | Límites no fijados (L-19). |

**5. Contrato de salida.**

| Resultado | Contenido | Condición |
|---|---|---|
| `EXITO` | Registros minimizados y paginados | Consulta válida. |
| `RECHAZO` | `codigo`, `mensaje`, `detalles` | Autorización o filtros. |
| `ERROR` | `codigo`, `mensaje`, `correlationId` | Fallo de lectura. |

**6. Errores y resultados excepcionales.**

| Código | Significado | Cuándo |
|---|---|---|
| `NO_AUTORIZADO` | El actor no puede consultar auditoría. | DS-01, SUP-01. |
| `VALIDACION_INVALIDA` | Filtro o paginación inválidos. | Catálogo desconocido. |
| `LIMITE_EXCEDIDO` | Se supera el tamaño de página. | L-19. |
| `DEPENDENCIA_NO_DISPONIBLE` | Almacén de auditoría no disponible. | MongoDB/proyección. |

**7. Precondiciones y postcondiciones.** Precondiciones: actor autorizado; filtros válidos. Postcondiciones: lectura sin mutación; no se exponen secretos ni datos personales innecesarios; no se altera el registro append-only.

**8. Responsabilidades y límites.** Garantiza la consulta y la minimización. No escribe auditoría (DS-09 lo hace), no modifica ni elimina registros, no define el catálogo de eventos, el payload ni la gravedad (L-11, L-14, L-15) y no sustituye los registros de negocio (AUD-05).

**9. Relaciones y flujo.** OBJ-12; `[MOD]` §15.1; `[DS]` DS-09; `[ARQ]` §9.3. Conceptos: `RegistroAuditoria`, `CodigoEvento`, `GravedadAuditoria`, `ResultadoAuditoria`, `CorrelationId`. Flujo: autorizar → validar filtros → consultar → minimizar → paginar → devolver.

**10. Trazabilidad.** `[ENU]` OBJ-12; `[MOD]` §15.1, §20; `[VO]` §8.18–§8.20; `[DS]` DS-09; `[ARQ]` §9.3.

**Estado:** `Inferido` de OBJ-12 y del agregado `RegistroAuditoria`; `Limitado` por L-11, L-14, L-15 y L-19.

---

## 6. Candidatos, agrupaciones y descartes

### 6.1 Candidatos de `[ARQ]` §7.2

| Candidato | Disposición | Puerto resultante | Motivo |
|---|---|---|---|
| `RegisterSeller` | Retenido | `PI-02` | Capacidad administrativa confirmada por SEL-01/SEL-02. |
| `RegisterBuyer` | Retenido | `PI-01` | Registro de comprador confirmado por OBJ-03. |
| `CreateProduct` | Retenido | `PI-05` | Creación separada de la publicación. |
| `PublishProduct` | Agrupado | `PI-06` | La publicación es una transición del mismo ciclo que suspender/reanudar/descontinuar. |
| `AdjustInventory` | Retenido y acotado | `PI-09` | Solo ingresos, ajustes y bajas; reserva/consumo/liberación son internos. |
| `ReserveInventory` | Rechazado como puerto de entrada | — | Es una operación de `DS-03` invocada por `Checkout`/`CancelOrder`/`DispatchOrder`; exponerla permitiría saltarse las invariantes del pedido y del pago. Se conserva como operación de `PO-06`. |
| `AddCartItem` | Agrupado | `PI-11` | Agregar, actualizar, quitar y consultar comparten agregado, actor e invariantes. |
| `Checkout` | Retenido | `PI-12` | Capacidad central de OBJ-08. |
| `ConfirmPayment` | Retenido | `PI-15` | Resultado verificado del proveedor, no autodeclaración del comprador. |
| `DispatchOrder` | Retenido | `PI-17` | Consumo de reserva y salida física. |
| `RequestReturn` | Retenido | `PI-21` | Solicitud del comprador propietario. |
| `ProcessRefund` | Retenido y ampliado | `PI-23` | Incluye solicitud, aprobación y ejecución como etapas del mismo ciclo. |
| `GenerateAdministrativeReport` | Retenido | `PI-24` | Reportes de solo lectura para perfiles autorizados. |

### 6.2 Agrupaciones justificadas

| Puerto | Operaciones agrupadas | Por qué no se separan |
|---|---|---|
| `PI-04 ManageUser` | Activar, desactivar, bloquear, desbloquear | Comparten actor, recurso, tabla de transiciones y obligación de auditoría. |
| `PI-06 ManageProductPublication` | Publicar, suspender, reanudar, descontinuar | Comparten CAT-01…CAT-07 y el mismo agregado `Producto`. |
| `PI-11 ManageCart` | Agregar, actualizar, quitar, vaciar, consultar | Comparten `Carrito`, propietario e invariantes; separarlas produciría un puerto por método. |
| `PI-03 ManageOwnProfile` | Consultar, actualizar datos, gestionar direcciones | Comparten la propiedad del perfil y la autorización por alcance. |
| `PI-22 ResolveReturn` | Revisar, aprobar, rechazar, recibir, resolver | Son etapas de un mismo ciclo de posventa, con transiciones y separación de funciones. |
| `PI-23 ProcessRefund` | Solicitar, aprobar, ejecutar | Son etapas de un mismo ciclo financiero; la autorización se valida por etapa. |

### 6.3 Descartes por pertenecer a otro componente

| Candidato rechazado | Motivo | Dónde pertenece |
|---|---|---|
| `Login`, `Authenticate`, `IssueToken` | La autenticación y las sesiones no están en el modelo de dominio ni en los objetivos; `[ARQ]` §8 las ubica en el adaptador/middleware. | Infraestructura de identidad y adaptador de entrada. |
| `Authorize` | Es una decisión de dominio de `DS-01`, no una capacidad de aplicación independiente. | Invocación interna de cada puerto protegido. |
| `ReserveStock`, `ReleaseStock`, `ConsumeStock` | Operaciones internas de `DS-03` y `PO-06`; no son intenciones de un actor externo. | `Checkout`, `CancelOrder`, `DispatchOrder`, flujos de devolución. |
| `AssignWarehouse` | Es una consulta de dominio de `DS-04` usada por checkout/preparación. | `PI-12`, `PI-16`. |
| `CalculateOrder` | Es un cálculo puro de `DS-05` usado por checkout. | `PI-12`. |
| `ValidateReturnEligibility` | Es una política de `DS-07` usada por la solicitud/revisión. | `PI-21`, `PI-22`. |
| `AuditOperation` | Es una responsabilidad de `DS-09`; los casos de uso la invocan, no la exponen como capacidad externa. | `PO-14`, `PO-23`. |
| `SendNotification` | Es una capacidad de salida, no una intención de entrada. | `PO-18`. |
| `GenerateInvoicePdf` | No hay requisito documentado de generación/almacenamiento de artefactos; `documentoUri` es opcional y no es regla de negocio. | Futuro puerto de almacenamiento documental, si se aprueba. |
| `ManageAddress` separado | Es una operación del perfil propio. | `PI-03`. |
| `CreateShipment` separado | Es la preparación del envío. | `PI-16`. |

### 6.4 Vacíos que no se convirtieron en puertos

| Capacidad no creada | Motivo | Información que falta |
|---|---|---|
| `CloseOrder` (`ENTREGADO → CERRADO`) | La transición está en `[MOD]` §10.3, pero no se define actor, proceso ni criterio operativo de cierre. Crear el puerto obligaría a inventar un actor. | Definir si el cierre es automático tras la última entrega, una tarea administrativa o un proceso programado; indicar precondiciones y evidencia. |
| `RetryPayment` | PAY-04 permite otro intento, pero la tabla de pedidos lleva el rechazo a `CANCELADO`; no está claro si el reintento ocurre antes de cancelar, si crea un nuevo pedido o si es automático. | Definir la ventana de reintento, el actor y la relación con la cancelación. |
| `ChangeRole` | USR-06 exige auditoría, pero no define autorización ni proceso. | Definir quién aprueba, qué roles son intercambiables y qué ocurre con los perfiles comerciales. |
| `ChangeCommercialStatus` | `EstadoComercial` existe, pero el proceso y el actor no están definidos (DEC-BIZ-06, L-08). | Definir el proceso administrativo y su evidencia. |
| Consultas de detalle de usuarios, vendedores y bodegas | No hay caso de uso aprobado; `PI-24` cubre vistas agregadas y `PI-03` cubre el perfil propio. | Aprobar el caso de uso y sus filtros antes de crear un puerto de consulta. |

---

## 7. Trazabilidad

### 7.1 Objetivos funcionales → puertos de entrada

| Objetivo | Puertos |
|---|---|
| OBJ-01 Administrar usuarios | `PI-03`, `PI-04` |
| OBJ-02 Gestionar vendedores | `PI-02`, `PI-03` |
| OBJ-03 Administrar compradores | `PI-01`, `PI-03` |
| OBJ-04 Controlar bodegas | `PI-08` |
| OBJ-05 Gestionar catálogo | `PI-05`, `PI-06`, `PI-07` |
| OBJ-06 Administrar inventario | `PI-09`, `PI-10` |
| OBJ-07 Gestionar carrito | `PI-11` |
| OBJ-08 Controlar pedidos | `PI-12`, `PI-13`, `PI-14`, `PI-15`, `PI-16`, `PI-17`, `PI-18` |
| OBJ-09 Administrar facturación | `PI-15`, `PI-19`, `PI-20` |
| OBJ-10 Gestionar logística | `PI-16`, `PI-17`, `PI-18` |
| OBJ-11 Devoluciones y reembolsos | `PI-21`, `PI-22`, `PI-23` |
| OBJ-12 Información administrativa | `PI-13`, `PI-24`, `PI-25` |

### 7.2 Reglas y servicios → puertos de entrada

| Regla/servicio | Puertos que la aplican |
|---|---|
| RG-01…RG-03, USR-03/USR-04, SUP-01, `DS-01` | Todos los puertos protegidos; de forma directa `PI-04`, `PI-08`, `PI-09`, `PI-24`, `PI-25`. |
| CAT-01…CAT-07, `DS-02` | `PI-05`, `PI-06`, `PI-07`. |
| INV-01…INV-10, `DS-03` | `PI-09`, `PI-12`, `PI-14`, `PI-17`, `PI-22`. |
| `DS-04` asignación de bodega | `PI-12`, `PI-16`. |
| `DS-05` cálculo de pedido | `PI-12`. |
| ORD-01…ORD-08, `DS-06` | `PI-12`, `PI-13`, `PI-14`, `PI-15`, `PI-16`, `PI-17`, `PI-18`. |
| RET-01/RET-02, `DS-07` | `PI-21`, `PI-22`. |
| REF-01/PAY-05, `DS-08` | `PI-23`. |
| AUD-01…AUD-06, `DS-09` | `PI-04`, `PI-06`, `PI-09`, `PI-15`, `PI-17`, `PI-18`, `PI-19`, `PI-20`, `PI-22`, `PI-23`, `PI-25`. |

### 7.3 Puertos de entrada → puertos de salida principales

| Puerto de entrada | Puertos de salida principales |
|---|---|
| `PI-01` | `PO-01`, `PO-02`, `PO-07`, `PO-14`, `PO-15`, `PO-18`, `PO-20`, `PO-21`, `PO-22`, `PO-23` |
| `PI-02` | `PO-01`, `PO-03`, `PO-04`, `PO-14`, `PO-15`, `PO-18`, `PO-20`, `PO-21`, `PO-22`, `PO-23` |
| `PI-03` | `PO-01`, `PO-02`, `PO-03`, `PO-14`, `PO-15`, `PO-20`, `PO-23` |
| `PI-04` | `PO-01`, `PO-14`, `PO-15`, `PO-20`, `PO-23` |
| `PI-05` | `PO-03`, `PO-05`, `PO-14`, `PO-15`, `PO-20`, `PO-21`, `PO-23` |
| `PI-06` | `PO-03`, `PO-05`, `PO-14`, `PO-15`, `PO-20`, `PO-23` |
| `PI-07` | `PO-05` |
| `PI-08` | `PO-03`, `PO-04`, `PO-14`, `PO-15`, `PO-20`, `PO-21`, `PO-23` |
| `PI-09` | `PO-04`, `PO-05`, `PO-06`, `PO-14`, `PO-15`, `PO-20`, `PO-21`, `PO-23` |
| `PI-10` | `PO-04`, `PO-05`, `PO-06` |
| `PI-11` | `PO-03`, `PO-05`, `PO-07`, `PO-14`, `PO-15`, `PO-20`, `PO-23` |
| `PI-12` | `PO-02`, `PO-03`, `PO-04`, `PO-05`, `PO-06`, `PO-07`, `PO-08`, `PO-09`, `PO-14`, `PO-15`, `PO-16`, `PO-18`, `PO-20`, `PO-21`, `PO-23` |
| `PI-13` | `PO-08`, `PO-09`, `PO-10`, `PO-11`, `PO-12`, `PO-13` |
| `PI-14` | `PO-06`, `PO-08`, `PO-09`, `PO-14`, `PO-15`, `PO-16`, `PO-20`, `PO-23` |
| `PI-15` | `PO-06`, `PO-08`, `PO-09`, `PO-14`, `PO-15`, `PO-16`, `PO-18`, `PO-19`, `PO-20`, `PO-23` |
| `PI-16` | `PO-04`, `PO-06`, `PO-08`, `PO-11`, `PO-14`, `PO-15`, `PO-20`, `PO-21`, `PO-23` |
| `PI-17` | `PO-06`, `PO-08`, `PO-11`, `PO-14`, `PO-15`, `PO-17`, `PO-18`, `PO-20`, `PO-23` |
| `PI-18` | `PO-08`, `PO-11`, `PO-14`, `PO-15`, `PO-17`, `PO-18`, `PO-19`, `PO-20`, `PO-23` |
| `PI-19` | `PO-08`, `PO-09`, `PO-10`, `PO-14`, `PO-15`, `PO-18`, `PO-20`, `PO-21`, `PO-23` |
| `PI-20` | `PO-10`, `PO-14`, `PO-15`, `PO-18`, `PO-20`, `PO-21`, `PO-23` |
| `PI-21` | `PO-02`, `PO-08`, `PO-12`, `PO-14`, `PO-15`, `PO-18`, `PO-20`, `PO-21`, `PO-23` |
| `PI-22` | `PO-06`, `PO-08`, `PO-12`, `PO-13`, `PO-14`, `PO-15`, `PO-18`, `PO-19`, `PO-20`, `PO-21`, `PO-23` |
| `PI-23` | `PO-08`, `PO-09`, `PO-12`, `PO-13`, `PO-14`, `PO-15`, `PO-16`, `PO-18`, `PO-20`, `PO-21`, `PO-23` |
| `PI-24` | `PO-24` |
| `PI-25` | `PO-14` |

**Nota:** la matriz identifica los puertos de salida necesarios para el contrato principal; un adaptador puede usar un subconjunto según la etapa. `PO-20` (reloj) y `PO-21` (identificadores) aplican a toda operación que cree o marque un recurso; `PO-23` (outbox) aplica a toda mutación crítica.

---

## 8. Validación del documento

| Criterio | Resultado | Evidencia |
|---|---|---|
| Inventario derivado de fuentes, no de una lista arbitraria | Cumple | §3, §6 y §7.1; cada puerto tiene origen o justificación. |
| Cobertura de OBJ-01…OBJ-12 | Cumple | §7.1. |
| Diez puntos por puerto | Cumple | §5.1–§5.10; cada sección numera 1–10. |
| Sin duplicados equivalentes | Cumple | §6.2; las agrupaciones evitan puertos por método. |
| Contratos coherentes con el Domain Model y los VOs | Cumple con limitaciones | Nombres y estados tomados de `[MOD]` y `[VO]`; limitaciones en §9. |
| Dependencias en la dirección correcta | Cumple | §2.3; los puertos de entrada no dependen de adaptadores. |
| Sin código, endpoints, controladores ni adaptadores | Cumple | No se incluyen firmas ni rutas HTTP; las rutas de código son ubicaciones propuestas. |
| Errores, precondiciones y postcondiciones definidos | Cumple | §4.3 y punto 6/7 de cada puerto. |
| Idempotencia y concurrencia donde aplica | Cumple | §4.4 y puntos 6/7 de los puertos afectados. |
| Trazabilidad a fuentes | Cumple | Punto 10 de cada puerto; §7. |
| Vacíos reales registrados | Cumple | §6.4 y §9. |
| Referencias y rutas válidas | Cumple | Las fuentes citadas existen; las rutas de código se marcan como propuestas. |

---

## 9. Limitaciones y bloqueos reales

Las limitaciones `L-01`…`L-15` están definidas en `DOCUMENTATION_STATUS.md` §7. Afectan a los puertos así:

| ID | Limitación | Puertos afectados | Qué puede definirse | Qué falta |
|---|---|---|---|---|
| L-01 | Composición exacta de `Direccion`/`DireccionFisica`. | `PI-01`, `PI-02`, `PI-03`, `PI-08`, `PI-12` | Semántica, obligatoriedad para compra física, snapshot inmutable. | Campos, formatos y validaciones exactas. |
| L-02 | Límites de longitud de nombres. | `PI-01`, `PI-02`, `PI-05`, `PI-08` | No vacío y normalización. | Máximos numéricos. |
| L-03 | Formato de `DocumentoIdentidad`. | `PI-01`, `PI-02` | Unicidad y protección. | Formato y normalización. |
| L-04 | Moneda, escala y redondeo. | `PI-05`, `PI-12`, `PI-19`, `PI-23` | Moneda explícita, aritmética exacta, igualdad de moneda. | Moneda del despliegue, escala y redondeo. |
| L-05 | Tasas de impuestos, descuentos y envío. | `PI-12` | Fórmula e invariantes. | Tasas y política de cálculo. |
| L-06 | **CERRADA (`DEC-W1-002`)**: plazo configurable con 30 días iniciales. | `PI-21`, `PI-22` | Ventana configurable y elegibilidad. | Sin bloqueo; snapshot/configuración en W5. |
| L-07 | Preferencia entre bodegas elegibles. | `PI-12`, `PI-16` | Factibilidad y bodegas activas. | Política de selección. |
| L-08 | Proceso de cambio de `EstadoComercial`. | `PI-01`, `PI-03` | Valores y efecto de `RESTRINGIDO`. | Actor, proceso y autorización. |
| L-09 | Transiciones completas de estados de vendedor, variante, bodega y envío. | `PI-02`, `PI-06`, `PI-08`, `PI-16`, `PI-18` | Valores y transiciones confirmadas. | Tabla completa. |
| L-10 | Catálogo de motivos de devolución y reembolso. | `PI-21`, `PI-22`, `PI-23` | Obligatoriedad y pertenencia a catálogo. | Valores válidos. |
| L-11 | Composición de snapshots y `AuditPayload`. | `PI-19`, `PI-20`, `PI-25` | Inmutabilidad, minimización y ausencia de secretos. | Esquema cerrado. |
| L-12 | **CERRADA (`DEC-W1-008`)**: Argon2id y formato PHC aprobados. | `PI-01`, `PI-02` | No texto plano, no reversible, creación fuera del dominio. | Sin bloqueo; biblioteca en W4. |
| L-13 | Formato físico de identificadores. | Todos | Tipo nominal, opacidad, unicidad. | UUID, serial u otro. |
| L-14 | Catálogo de eventos y `TipoReferencia`. | `PI-09`, `PI-25` | Código estable y versionado. | Valores completos. |
| L-15 | Gravedad de auditoría por evento. | `PI-25` | Valores del catálogo y coherencia mínima. | Asignación por evento. |

Nuevas limitaciones detectadas al definir los puertos:

| ID | Limitación | Puertos afectados | Impacto | Información que falta |
|---|---|---|---|---|
| L-16 | **CERRADA (`DEC-W1-007`)**: estados iniciales de `Usuario`, `PerfilComprador`, `PerfilVendedor` y primera `Bodega` aprobados. | `PI-01`, `PI-02`, `PI-03`, `PI-04` | Sin bloqueo para el alta. | `Usuario ACTIVO`, comprador `HABILITADO`, vendedor `ACTIVO`, bodega `ACTIVA`. |
| L-17 | Numeración, serie fiscal y política de corrección de facturas. | `PI-19`, `PI-20` | No puede definirse el número ni el documento correctivo. | Serie, formato, unicidad, jurisdicción y regla de corrección. |
| L-18 | Mecanismo y modelo de recursos de entrega digital. | `PI-15`, `PI-18`, `PI-22` | El contrato de entrega digital queda abstracto. | Cómo se provisiona/revoca una licencia o acceso y qué evidencia se registra. |
| L-19 | Catálogo de reportes, parámetros, búsqueda y límites de paginación. | `PI-07`, `PI-10`, `PI-13`, `PI-24`, `PI-25` | Los contratos de consulta no fijan tipos ni límites. | Reportes aprobados, filtros, orden y tamaño máximo. |
| L-20 | **CERRADA (`DEC-W1-008`)**: política de credenciales aprobada. | `PI-01`, `PI-02` | Sin bloqueo de fortaleza/algoritmo. | 12–128 caracteres, Argon2id y verificación de tiempo constante. |
| L-21 | Actor y proceso de cierre `ENTREGADO → CERRADO`. | `PI-18` | El estado `CERRADO` no tiene puerto de entrada. | Definir si es automático, administrativo o programado. |
| L-22 | Protocolo del proveedor de pago, modelo autorización/captura, reintentos y cancelación. | `PI-12`, `PI-14`, `PI-15`, `PI-23` | Los contratos de pago quedan abstractos. | Contrato del proveedor y semántica de reintento. |
| L-23 | Integración logística, eventos de tracking y formato de evidencia de entrega. | `PI-16`, `PI-17`, `PI-18` | El contrato de transporte queda abstracto. | Proveedor, eventos, evidencia y reintentos. |
| L-24 | Catálogo de notificaciones, canales y consentimiento. | `PI-01`, `PI-02`, `PI-12`, `PI-15`, `PI-17`, `PI-18`, `PI-19`, `PI-20`, `PI-21`, `PI-22`, `PI-23` | El contrato de notificación queda abstracto. | Canales, plantillas y política de consentimiento. |
| L-25 | Política de aislamiento, timeout y reintento transaccional. | `PI-12`, `PI-14`, `PI-15`, `PI-17`, `PI-21`, `PI-23` | El adaptador no puede fijar el comportamiento sin una decisión. | Nivel de aislamiento, timeout y reintentos. |
| L-26 | Asignación de operador logístico a pedidos/envíos. | `PI-13` | El alcance del operador no se deriva del modelo. | Modelo/proceso de asignación. |

**Bloqueos que impiden cerrar un contrato por completo:** L-17, L-21, L-22 y L-26. `L-16`, `L-12`, `L-20` y `L-06` quedaron cerradas por `DEC-W1-007`, `DEC-W1-008` y `DEC-W1-002`. `L-25` se cierra a nivel de diseño con `D-16` en los casos de uso; los valores numéricos quedan configurables. Los demás limitan detalles, pero no impiden definir la intención, las precondiciones y los efectos principales.

---

## 10. Registro de cambios

| Fecha | Cambio |
|---|---|
| 2026-10-26 | Creación del catálogo de Input Ports con 25 puertos, inventario, convenciones, contratos de diez puntos, descartes, trazabilidad, validación y limitaciones. |
| 2026-10-26 | Se adopta `BackendSDD/Application/` como ubicación documental y `application/ports/` como ubicación arquitectónica; se registra `C-15` por la discrepancia con el ejemplo de `[ARQ]` §9.3. |
| 2026-10-26 | Corrección de `PI-12` para devolver una lista de pagos, uno por pedido (`C-16`); `PI-13` limitado por `L-26`, con errores de alcance alineados (`C-19`, `D-21`) y salida de lista/detalle precisada (`D-20`); se registran `L-25` y `L-26` en §9. |

---

**Cierre:** el inventario cubre los doce objetivos funcionales y los candidatos de `[ARQ]` §7.2, con agrupaciones explícitas y descartes justificados. Las capacidades que no pueden definirse sin una decisión de negocio se registran en §6.4 y §9; no se presentan como contratos cerrados.

