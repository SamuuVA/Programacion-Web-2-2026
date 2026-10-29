# NEXUSMARKET — Output Ports

**Propósito:** definir los contratos de salida de la capa de aplicación de NEXUSMARKET, es decir, las capacidades externas que los casos de uso necesitan y que los adaptadores implementan, manteniendo la independencia respecto de la persistencia, los proveedores y los detalles tecnológicos.

**Ámbito:** exclusivamente Output Ports. Este documento no define adaptadores, repositorios concretos, esquemas SQL, colecciones MongoDB, clientes HTTP, SDKs, controladores, casos de uso implementados ni código. Tampoco sustituye al Domain Model, a los Domain Services ni a la arquitectura.

**Estado:** `COMPLETO`, con las limitaciones de fuente registradas en §9. La marca `COMPLETO` significa que el inventario está justificado, que cada puerto tiene sus diez puntos y que las decisiones y vacíos están diferenciados; no significa que el negocio haya aprobado las políticas pendientes.

**Última actualización:** 26 de octubre de 2026.

**Raíz documental:** `BackendSDD/`.

**Documento hermano:** `BackendSDD/Application/nexusmarket-input-ports.md`.

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

- Los nombres canónicos de los puertos se expresan en inglés, como en `[ARQ]` §7.3; las descripciones, contratos y relaciones se expresan en español técnico.
- Cada puerto tiene un identificador estable `PO-01`…`PO-24` y una sección propia con los diez puntos solicitados.
- Los estados de cada puerto se clasifican como `Confirmado` (respaldado directamente por una fuente), `Inferido` (derivado de responsabilidades y reglas documentadas) o `Limitado` (el contrato existe, pero una política o detalle externo no está definido).
- Los contratos son conceptuales. No se prescriben firmas TypeScript, clases, tablas, colecciones, rutas, SDKs ni estructuras de persistencia.
- Las referencias a rutas de código son ubicaciones arquitectónicas propuestas, no archivos creados por esta tarea.
- Las operaciones se describen por su semántica; no son métodos obligatorios ni una lista cerrada de firmas.

---

## 1. Alcance y límites

Este documento responde a una sola pregunta: **¿qué capacidades externas necesita la aplicación, quién las consume, qué datos intercambian, qué fallos deben contemplarse, qué invariantes preservan y qué queda fuera del contrato?**

No responde a:

- qué tabla, colección, índice o consulta usa un adaptador;
- qué SDK o protocolo emplea un proveedor;
- cómo se configura una conexión;
- cómo se implementa un repositorio;
- qué reglas de negocio pertenecen al dominio.

La arquitectura `[ARQ]` §7.3 exige que las interfaces expresen necesidades reales, que no exista un repositorio universal y que no se expongan tipos de persistencia en las firmas. Este documento aplica esa regla: cada puerto tiene un consumidor identificable y un límite conceptual claro.

---

## 2. Ubicación y reglas de dependencia

### 2.1 Ubicación documental

Los dos catálogos de puertos se ubican en `BackendSDD/Application/` porque la arquitectura asigna los puertos a la capa de aplicación y porque `BackendSDD/` es la raíz documental vigente. No existe una carpeta `Application/` previa; se crea como ubicación de esta familia documental, sin mover ni duplicar documentos de dominio.

### 2.2 Ubicación arquitectónica propuesta

| Tipo de puerto | Ubicación propuesta | Fundamento |
|---|---|---|
| Repositorio de un módulo | `src/modules/<módulo>/application/ports/<nombre>.port.ts` | `[ARQ]` §4 y §7.3; el puerto pertenece a la capa que lo consume. |
| Repositorio compartido | `src/shared/application/ports/<nombre>.port.ts` | `[ARQ]` §4 reserva `shared/application/ports/`. |
| Adaptador de persistencia | `src/modules/<módulo>/adapters/persistence/` | `[ARQ]` §9.3; no forma parte de este documento. |
| Proveedor externo | `src/modules/<módulo>/application/ports/` o `src/shared/application/ports/` | `[ARQ]` §7.3; el consumidor decide la ubicación. |
| Adaptador de proveedor | `src/modules/<módulo>/adapters/` o `src/shared/infrastructure/` | `[ARQ]` §7.3; no forma parte de este documento. |

**Decisión de ubicación:** se adopta `application/ports/` para los puertos, conforme a `[ARQ]` §4, §7 y §16. El ejemplo de `[ARQ]` §9.3 que muestra `modules/catalog/domain/product-repository.ts` se considera ilustrativo y no se adopta como regla: un repositorio es un puerto de salida consumido por la aplicación, no una dependencia del dominio. Esta discrepancia se registra como `C-15` en `DOCUMENTATION_STATUS.md`; no se modifica la arquitectura.

### 2.3 Dirección de dependencias

1. La aplicación depende de los puertos de salida; los adaptadores los implementan.
2. El dominio no conoce los puertos de salida ni los adaptadores.
3. Los puertos no exponen filas, documentos, DTOs de persistencia, clientes HTTP ni tipos de proveedor.
4. Los adaptadores traducen entre el contrato conceptual y la tecnología concreta.
5. El punto de composición inyecta las implementaciones.
6. Una transacción de base de datos no cubre automáticamente MongoDB ni un proveedor externo; la aplicación debe definir el límite de consistencia.

---

## 3. Inventario canónico

| ID | Puerto | Módulo | Capacidad abstraída | Consumidores principales | Estado |
|---|---|---|---|---|---|
| `PO-01` | `UserRepository` | `identity` | Persistencia y recuperación de `Usuario`. | `PI-01`, `PI-02`, `PI-03`, `PI-04` | Confirmado |
| `PO-02` | `BuyerRepository` | `buyers` | Persistencia y recuperación de `PerfilComprador`. | `PI-01`, `PI-03`, `PI-12`, `PI-21` | Confirmado |
| `PO-03` | `SellerRepository` | `sellers` | Persistencia y recuperación de `PerfilVendedor`. | `PI-02`, `PI-03`, `PI-05`, `PI-06`, `PI-08`, `PI-11`, `PI-12` | Confirmado |
| `PO-04` | `WarehouseRepository` | `warehouses` | Persistencia y recuperación de `Bodega`. | `PI-02`, `PI-08`, `PI-09`, `PI-10`, `PI-12`, `PI-16` | Confirmado |
| `PO-05` | `ProductRepository` | `catalog` | Persistencia y recuperación de `Producto`/`Variante`. | `PI-05`, `PI-06`, `PI-07`, `PI-09`, `PI-10`, `PI-11`, `PI-12` | Confirmado |
| `PO-06` | `InventoryRepository` | `inventory` | Posiciones, reservas y movimientos con atomicidad. | `PI-09`, `PI-10`, `PI-12`, `PI-14`, `PI-15`, `PI-16`, `PI-17`, `PI-22` | Confirmado |
| `PO-07` | `CartRepository` | `cart` | Persistencia y recuperación de `Carrito`. | `PI-01`, `PI-11`, `PI-12` | Confirmado |
| `PO-08` | `OrderRepository` | `orders` | Persistencia y recuperación de `Pedido`. | `PI-12`–`PI-19`, `PI-21`–`PI-23` | Confirmado |
| `PO-09` | `PaymentRepository` | `payments` | Persistencia y recuperación de `Pago`. | `PI-12`, `PI-13`, `PI-14`, `PI-15`, `PI-19`, `PI-23` | Confirmado |
| `PO-10` | `InvoiceRepository` | `billing` | Persistencia y recuperación de `Factura`. | `PI-13`, `PI-19`, `PI-20` | Confirmado |
| `PO-11` | `ShipmentRepository` | `shipping` | Persistencia y recuperación de `Envio`. | `PI-13`, `PI-16`, `PI-17`, `PI-18` | Confirmado |
| `PO-12` | `ReturnRepository` | `returns` | Persistencia y recuperación de `Devolucion`. | `PI-13`, `PI-21`, `PI-22`, `PI-23` | Confirmado |
| `PO-13` | `RefundRepository` | `refunds` | Persistencia y recuperación de `Reembolso`. | `PI-13`, `PI-22`, `PI-23` | Confirmado |
| `PO-14` | `AuditLogRepository` | `reporting` | Append y consulta de `RegistroAuditoria`. | Todos los puertos que auditan; `PI-25` | Confirmado |
| `PO-15` | `TransactionManager` | `shared` | Unidad de trabajo y límite transaccional. | Operaciones multiagregado | Confirmado |
| `PO-16` | `PaymentGateway` | `payments` | Iniciar, confirmar, cancelar y reembolsar pagos. | `PI-12`, `PI-14`, `PI-15`, `PI-23` | Confirmado; limitado por L-22 |
| `PO-17` | `ShippingProvider` | `shipping` | Asignar transporte, tracking y eventos. | `PI-17`, `PI-18` | Confirmado; limitado por L-23 |
| `PO-18` | `NotificationSender` | `shared` | Enviar notificaciones a actores. | Varios puertos de entrada | Confirmado; limitado por L-24 |
| `PO-19` | `DigitalDeliveryProvider` | `shared` | Provisionar/revocar entrega digital. | `PI-15`, `PI-18`, `PI-22` | Inferido; limitado por L-18 |
| `PO-20` | `Clock` | `shared` | Obtener el instante UTC. | Todos los que crean/marcan recursos | Inferido |
| `PO-21` | `IdGenerator` | `shared` | Generar identificadores tipados. | Todos los que crean agregados/eventos | Inferido |
| `PO-22` | `PasswordHasher` | `identity` | Producir `HashCredencial`. | `PI-01`, `PI-02` | Confirmado; política `DEC-W1-008`; biblioteca en W4 |
| `PO-23` | `DomainEventOutbox` | `shared` | Registrar eventos en la misma transacción. | Mutaciones críticas; `DS-09` | Confirmado por `[MOD]` §24 y `[ARQ]` §9.4 |
| `PO-24` | `ReportingQuery` | `reporting` | Consultas de lectura consolidadas. | `PI-24` | Confirmado; limitado por L-19 |

**Cobertura:** los dieciséis nombres candidatos de `[ARQ]` §7.3 están representados o explícitamente subsumidos. Se añaden los puertos necesarios para perfiles de comprador, bodegas, entrega digital, reloj, identificadores, hashing, outbox y consultas de reporte, con justificación en §6.

---

## 4. Convenciones de contrato

### 4.1 Operaciones conceptuales

Los puertos de persistencia pueden requerir operaciones como recuperar por identificador, recuperar por criterio único, verificar existencia o unicidad, guardar, listar con filtros y participar en una unidad de trabajo. No se prescribe una interfaz concreta ni una operación por tabla. Las operaciones exactas se derivan del consumidor y de las invariantes que el puerto debe preservar.

Los puertos de integración pueden requerir operaciones como iniciar, consultar, confirmar, cancelar, enviar, provisionar, revocar o generar. La semántica se define en cada sección.

### 4.2 Resultados y ausencia

| Resultado | Significado |
|---|---|
| Encontrado | Se devuelve el agregado o dato solicitado, reconstruido como objeto válido. |
| No encontrado | Se devuelve ausencia explícita; no se inventa un objeto vacío ni se lanza una excepción de negocio por una búsqueda normal. |
| Lista vacía | Una consulta sin coincidencias devuelve una colección vacía, no un error. |
| Conflicto | La operación no puede completarse por unicidad, concurrencia o idempotencia; se informa de forma tipada. |
| Fallo | La dependencia no está disponible o devolvió un error técnico; el adaptador lo traduce a un error de aplicación seguro. |

### 4.3 Catálogo común de fallos

| Código | Significado | Uso típico |
|---|---|---|
| `NO_ENCONTRADO` | El recurso solicitado no existe. | Recuperación por identificador. |
| `CONFLICTO_UNICIDAD` | Ya existe un valor único. | Correo, documento, SKU, número de factura, clave idempotente. |
| `CONFLICTO_CONCURRENCIA` | La versión cambió o la operación compite con otra. | Actualización optimista, reserva de stock. |
| `IDEMPOTENCIA_CONFLICTO` | La misma clave se usó con datos distintos. | Pagos, reembolsos, movimientos, eventos. |
| `DATOS_INVALIDOS` | El agregado o los parámetros no son válidos para el puerto. | Reconstrucción o escritura inválida. |
| `FALLO_PERSISTENCIA` | La persistencia no está disponible o falló. | Conexión, transacción, restricción. |
| `FALLO_PROVEEDOR` | El proveedor externo falló, rechazó o no respondió. | Pago, transporte, notificación, entrega digital. |
| `NO_DISPONIBLE` | La capacidad no está configurada o está temporalmente fuera de servicio. | Adaptador sin credenciales o proveedor caído. |
| `OPERACION_NO_SOPORTADA` | La operación solicitada no pertenece al contrato. | Acción desconocida. |
| `LIMITE_EXCEDIDO` | Se superó un límite de página, tamaño o tiempo. | Consultas y proveedores. |

Los adaptadores traducen estos fallos a errores de aplicación; no filtran mensajes internos, SQL, stack traces ni datos del proveedor.

### 4.4 Atomicidad, idempotencia y concurrencia

- **Repositorios:** participan en la unidad de trabajo cuando la operación lo requiere. `PO-15` define el límite. Una escritura de agregado debe ser atómica respecto de sus invariantes y restricciones de unicidad.
- **Inventario:** `PO-06` debe permitir reservar, liberar y consumir de forma atómica y con control de concurrencia; una comprobación previa en aplicación no basta.
- **Idempotencia:** `PO-06`, `PO-09`, `PO-13`, `PO-16`, `PO-23` preservan claves de idempotencia y no duplican efectos ante reintentos.
- **Outbox:** `PO-23` registra el evento en la misma transacción que la mutación crítica; la publicación posterior es al menos una vez y los consumidores deben ser idempotentes.
- **Proveedores externos:** no participan en la transacción SQL. La aplicación registra el estado intermedio y reconcilia; no se declara éxito de negocio por una respuesta no confirmada.

### 4.5 Paginación, filtros y orden

Las operaciones de listado aceptan filtros y paginación conceptuales. Los límites numéricos, el orden por defecto y la semántica exacta de búsqueda no están fijados por las fuentes; se registran como `L-19` y pertenecen al contrato externo, no al dominio.

### 4.6 Datos que nunca deben cruzar el puerto

- Contraseñas en texto plano, tokens, secretos y claves de proveedor.
- Datos completos de tarjeta o instrumentos de pago.
- Filas, documentos, columnas, identificadores de base de datos y tipos de driver.
- Payloads crudos de proveedores con datos personales innecesarios.
- Mensajes internos, stack traces o detalles de infraestructura.

---

## 5. Especificaciones

Las secciones se agrupan por capacidad. El orden no implica prioridad de implementación. Cada puerto declara su ubicación documental (esta sección) y su ubicación arquitectónica propuesta.

### 5.1 Repositorios de agregados

#### PO-01 — `UserRepository`

**1. Identificación.** `PO-01`, `UserRepository`, módulo `identity`. Documentación: §5.1. Ubicación propuesta: `src/modules/identity/application/ports/user-repository.port.ts`. Propósito: persistir y reconstruir la entidad `Usuario` y verificar la unicidad de correo y documento.

**2. Responsabilidad.** Recuperar un `Usuario` por identificador, correo normalizado o documento; verificar existencia y unicidad; guardar el agregado con control de concurrencia. Abstrae la persistencia transaccional de identidad.

**3. Componente consumidor.** `PI-01` (`RegisterBuyer`), `PI-02` (`RegisterSeller`), `PI-03` (`ManageOwnProfile`), `PI-04` (`ManageUser`). También puede ser usado por un futuro caso de autenticación, fuera de este alcance.

**4. Contrato de entrada.**

| Operación conceptual | Datos | Regla |
|---|---|---|
| Recuperar por identificador | `UsuarioId` | Devuelve el agregado o ausencia. |
| Recuperar por correo | `CorreoElectronico` normalizado | Búsqueda de unicidad/autenticación. |
| Recuperar por documento | `DocumentoIdentidad` normalizado | Búsqueda de unicidad. |
| Verificar existencia | Correo o documento | Devuelve booleano; no revela datos. |
| Guardar | `Usuario` completo y versión esperada | Inserción o actualización; control de concurrencia. |

**5. Contrato de salida.** El agregado `Usuario` reconstruido y válido, o ausencia explícita; confirmación de guardado; resultado de unicidad. No se devuelven filas ni columnas.

**6. Errores y fallos.**

| Código | Significado | Cuándo |
|---|---|---|
| `NO_ENCONTRADO` | No existe el usuario solicitado. | Recuperación por identificador. |
| `CONFLICTO_UNICIDAD` | Correo o documento ya existe. | Inserción/actualización. |
| `CONFLICTO_CONCURRENCIA` | La versión cambió. | Actualización concurrente. |
| `DATOS_INVALIDOS` | El agregado no es válido para persistir. | Reconstrucción/escritura. |
| `FALLO_PERSISTENCIA` | La persistencia no está disponible. | Conexión/transacción. |

**7. Restricciones e invariantes.** No persiste credenciales en claro; solo `HashCredencial`. Preserva USR-01…USR-06. Refuerza la unicidad en persistencia, no solo en aplicación. No permite guardar un `Usuario` con rol ausente o estado inválido. La escritura participa en la unidad de trabajo cuando corresponde.

**8. Dependencia externa abstracta.** Persistencia transaccional. `[MOD]` §24.1 asigna la identidad a SQL como fuente de verdad; el contrato no prescribe SQL ni MongoDB.

**9. Límites del contrato.** El adaptador traduce el agregado a su representación persistente y refuerza restricciones. El repositorio no hashea contraseñas, no autentica, no decide transiciones de estado, no autoriza y no gestiona sesiones. No expone datos de otras cuentas.

**10. Trazabilidad.** `[ARQ]` §7.3, §9.3; `[MOD]` §6.1, §24; `[VO]` §6.2–§6.4, §8.5; `[DS]` DS-01, DS-09.

**Estado:** `Confirmado`.

---

#### PO-02 — `BuyerRepository`

**1. Identificación.** `PO-02`, `BuyerRepository`, módulo `buyers`. Documentación: §5.1. Ubicación propuesta: `src/modules/buyers/application/ports/buyer-repository.port.ts`. Propósito: persistir y reconstruir el `PerfilComprador`, incluidas sus direcciones y su estado comercial.

**2. Responsabilidad.** Recuperar un perfil por identificador o por `UsuarioId`; guardar el perfil con sus direcciones; verificar la correspondencia con una cuenta de rol `COMPRADOR`. Abstrae la persistencia del perfil comercial del comprador.

**3. Componente consumidor.** `PI-01` (`RegisterBuyer`), `PI-03` (`ManageOwnProfile`), `PI-12` (`Checkout`), `PI-21` (`RequestReturn`).

**4. Contrato de entrada.**

| Operación conceptual | Datos | Regla |
|---|---|---|
| Recuperar por identificador | `CompradorId` | Devuelve perfil o ausencia. |
| Recuperar por usuario | `UsuarioId` | Relación única con la cuenta. |
| Guardar | `PerfilComprador` y versión esperada | Inserción/actualización. |
| Verificar existencia | `CompradorId`/`UsuarioId` | Booleano. |

**5. Contrato de salida.** `PerfilComprador` reconstruido con `estadoComercial` y direcciones, o ausencia; confirmación de guardado.

**6. Errores y fallos.**

| Código | Significado | Cuándo |
|---|---|---|
| `NO_ENCONTRADO` | No existe el perfil. | Recuperación. |
| `CONFLICTO_UNICIDAD` | Ya existe un perfil para el usuario. | Inserción. |
| `CONFLICTO_CONCURRENCIA` | El perfil cambió. | Actualización. |
| `DATOS_INVALIDOS` | Dirección o estado inválido. | Guardado. |
| `FALLO_PERSISTENCIA` | Persistencia no disponible. | Conexión/transacción. |

**7. Restricciones e invariantes.** Un perfil por usuario con rol `COMPRADOR`; direcciones válidas según la política (L-01); `estadoComercial` obligatorio; `RESTRINGIDO` no borra historial; no se mezclan datos de compradores. La escritura participa en la unidad de trabajo.

**8. Dependencia externa abstracta.** Persistencia transaccional; `[MOD]` §24.1 asigna perfiles a SQL.

**9. Límites del contrato.** No crea el `Usuario` ni el `Carrito`; no autentica; no autoriza; no decide el estado comercial (el proceso no está definido, DEC-BIZ-06); no gestiona pedidos.

**10. Trazabilidad.** `[ARQ]` §7.3, §9.3; `[MOD]` §6.3, §24; `[VO]` §6.3, §7.1, §8.6; `[DS]` DS-01.

**Estado:** `Confirmado`; `Limitado` por L-01 (dirección) y L-08 (proceso de estado comercial).

---

#### PO-03 — `SellerRepository`

**1. Identificación.** `PO-03`, `SellerRepository`, módulo `sellers`. Documentación: §5.1. Ubicación propuesta: `src/modules/sellers/application/ports/seller-repository.port.ts`. Propósito: persistir y reconstruir el `PerfilVendedor` y verificar su relación con la cuenta y sus recursos.

**2. Responsabilidad.** Recuperar un vendedor por identificador o `UsuarioId`; guardar el perfil con su estado; verificar la propiedad de productos y bodegas cuando la consulta lo requiera. Abstrae la persistencia del perfil comercial del vendedor.

**3. Componente consumidor.** `PI-02` (`RegisterSeller`), `PI-03` (`ManageOwnProfile`, datos comerciales del vendedor), `PI-05` (`CreateProduct`), `PI-06` (`ManageProductPublication`), `PI-08` (`ManageWarehouse`, propietario), `PI-11` (`ManageCart`, para validar vendedor activo), `PI-12` (`Checkout`).

**4. Contrato de entrada.**

| Operación conceptual | Datos | Regla |
|---|---|---|
| Recuperar por identificador | `VendedorId` | Devuelve perfil o ausencia. |
| Recuperar por usuario | `UsuarioId` | Relación única con la cuenta. |
| Guardar | `PerfilVendedor` y versión esperada | Inserción/actualización. |
| Verificar propiedad | `VendedorId` + recurso | Booleano; no expone el recurso. |

**5. Contrato de salida.** `PerfilVendedor` con `estado`, `razonSocial` e `incorporadoPor`, o ausencia; confirmación de guardado; resultado de propiedad.

**6. Errores y fallos.**

| Código | Significado | Cuándo |
|---|---|---|
| `NO_ENCONTRADO` | No existe el vendedor. | Recuperación. |
| `CONFLICTO_UNICIDAD` | Ya existe un perfil para el usuario. | Inserción. |
| `CONFLICTO_CONCURRENCIA` | El perfil cambió. | Actualización. |
| `DATOS_INVALIDOS` | Estado o razón social inválidos. | Guardado. |
| `FALLO_PERSISTENCIA` | Persistencia no disponible. | Conexión/transacción. |

**7. Restricciones e invariantes.** Un perfil por usuario con rol `VENDEDOR`; `estado` del catálogo; `incorporadoPor` debe ser un Administrador; un vendedor suspendido no publica ni inicia ventas nuevas; no se mezclan datos de vendedores. La escritura participa en la unidad de trabajo.

**8. Dependencia externa abstracta.** Persistencia transaccional; `[MOD]` §24.1 asigna perfiles a SQL.

**9. Límites del contrato.** No crea el `Usuario` ni la primera `Bodega`; no autentica; no autoriza; no define transiciones completas de `EstadoVendedor` (L-09); no persiste productos.

**10. Trazabilidad.** `[ARQ]` §7.3, §9.3; `[MOD]` §6.4, §24; `[VO]` §8.7; `[DS]` DS-01, DS-02.

**Estado:** `Confirmado`; `Limitado` por L-09 (transiciones). El estado inicial está aprobado en `DEC-W1-007` y lo aplica la aplicación, no el repositorio.

---

#### PO-04 — `WarehouseRepository`

**1. Identificación.** `PO-04`, `WarehouseRepository`, módulo `warehouses`. Documentación: §5.1. Ubicación propuesta: `src/modules/warehouses/application/ports/warehouse-repository.port.ts`. Propósito: persistir y reconstruir las bodegas del marketplace y de los vendedores.

**2. Responsabilidad.** Recuperar bodegas por identificador, propietario, tipo o estado; guardar una bodega con su clasificación y ubicación. Abstrae la persistencia de la bodega, no su inventario.

**3. Componente consumidor.** `PI-02` (`RegisterSeller`), `PI-08` (`ManageWarehouse`), `PI-09` (`AdjustInventory`), `PI-10` (`QueryInventory`), `PI-12` (`Checkout`, para asignación), `PI-16` (`PrepareShipment`).

**4. Contrato de entrada.**

| Operación conceptual | Datos | Regla |
|---|---|---|
| Recuperar por identificador | `BodegaId` | Devuelve bodega o ausencia. |
| Listar por propietario/tipo/estado | `VendedorId`, `TipoBodega`, `EstadoBodega` | Filtros de consulta. |
| Guardar | `Bodega` y versión esperada | Inserción/actualización. |
| Verificar propiedad | `BodegaId` + `VendedorId` | Booleano. |

**5. Contrato de salida.** `Bodega` reconstruida con tipo, estado, propietario y ubicación, o ausencia; lista filtrada; confirmación de guardado.

**6. Errores y fallos.**

| Código | Significado | Cuándo |
|---|---|---|
| `NO_ENCONTRADO` | No existe la bodega. | Recuperación. |
| `CONFLICTO_CONCURRENCIA` | La bodega cambió. | Actualización. |
| `DATOS_INVALIDOS` | Tipo/propietario/ubicación inválidos. | Guardado. |
| `FALLO_PERSISTENCIA` | Persistencia no disponible. | Conexión/transacción. |

**7. Restricciones e invariantes.** `MARKETPLACE` no tiene vendedor propietario; `VENDEDOR` tiene exactamente uno; una bodega inactiva no recibe reservas; no se elimina una bodega con historial sin resolver existencias; no se mezclan bodegas de vendedores. La escritura participa en la unidad de trabajo.

**8. Dependencia externa abstracta.** Persistencia transaccional; `[MOD]` §24.1 asigna bodegas a SQL.

**9. Límites del contrato.** No mueve, ajusta ni reserva stock; no elige la bodega preferida (DS-04); no define la política de cierre con stock; no persiste inventario.

**10. Trazabilidad.** `[ARQ]` §7.3, §9.3; `[MOD]` §8.1, §24; `[VO]` §8.10; `[DS]` DS-01, DS-04.

**Estado:** `Confirmado`; `Limitado` por L-01 (dirección) y L-07 (preferencia de bodega).

---

#### PO-05 — `ProductRepository`

**1. Identificación.** `PO-05`, `ProductRepository`, módulo `catalog`. Documentación: §5.1. Ubicación propuesta: `src/modules/catalog/application/ports/product-repository.port.ts`. Propósito: persistir y reconstruir productos y variantes, y verificar la unicidad global del SKU.

**2. Responsabilidad.** Recuperar productos por identificador, vendedor, categoría o estado; recuperar variantes por identificador o SKU; guardar el agregado `Producto` con sus variantes; verificar unicidad de SKU. Abstrae la persistencia del catálogo.

**3. Componente consumidor.** `PI-05` (`CreateProduct`), `PI-06` (`ManageProductPublication`), `PI-07` (`QueryCatalog`), `PI-09` (`AdjustInventory`, para validar la variante), `PI-10` (`QueryInventory`, para resolver producto/variante), `PI-11` (`ManageCart`), `PI-12` (`Checkout`).

**4. Contrato de entrada.**

| Operación conceptual | Datos | Regla |
|---|---|---|
| Recuperar producto | `ProductoId` | Devuelve agregado o ausencia. |
| Recuperar variante | `VarianteId`/`SKU` | Devuelve variante o ausencia. |
| Listar catálogo | Filtros y paginación | Solo lectura; alcance del consumidor. |
| Guardar | `Producto` y versión esperada | Inserción/actualización. |
| Verificar SKU | `SKU` | Booleano de unicidad. |

**5. Contrato de salida.** `Producto` con variantes reconstruidas, o ausencia; lista filtrada; confirmación de guardado; resultado de unicidad.

**6. Errores y fallos.**

| Código | Significado | Cuándo |
|---|---|---|
| `NO_ENCONTRADO` | No existe producto/variante. | Recuperación. |
| `CONFLICTO_UNICIDAD` | SKU ya existe. | Inserción/actualización. |
| `CONFLICTO_CONCURRENCIA` | El producto cambió. | Actualización. |
| `DATOS_INVALIDOS` | Producto/variante inválidos. | Guardado. |
| `FALLO_PERSISTENCIA` | Persistencia no disponible. | Conexión/transacción. |

**7. Restricciones e invariantes.** SKU único globalmente y no reutilizable; producto con al menos una variante antes de publicar; precio de variante mayor que cero; categoría controlada; tipo de entrega coherente; los snapshots de pedidos no se reescriben (CAT-06). La escritura participa en la unidad de trabajo.

**8. Dependencia externa abstracta.** Persistencia transaccional; `[MOD]` §24.1 asigna catálogo a SQL cuando se requieren relaciones y restricciones. Una proyección de lectura puede complementar, pero no sustituye la fuente de verdad.

**9. Límites del contrato.** No publica (la transición la decide `PI-06`), no reserva stock, no calcula disponibilidad, no genera imágenes y no modifica pedidos históricos.

**10. Trazabilidad.** `[ARQ]` §7.3, §9.3; `[MOD]` §7.1–§7.5, §24; `[VO]` §6.1, §6.5, §8.3, §8.8, §8.9; `[DS]` DS-02.

**Estado:** `Confirmado`.

#### PO-06 — `InventoryRepository`

**1. Identificación.** `PO-06`, `InventoryRepository`, módulo `inventory`. Documentación: §5.1. Ubicación propuesta: `src/modules/inventory/application/ports/inventory-repository.port.ts`. Propósito: persistir posiciones de inventario, reservas y movimientos, y ejecutar las operaciones atómicas de reserva, liberación y consumo.

**2. Responsabilidad.** Recuperar posiciones por variante/bodega; listar inventario; reservar, liberar y consumir cantidades de forma atómica; registrar movimientos; recuperar reservas por pedido. Abstrae la persistencia y la atomicidad del inventario.

**3. Componente consumidor.** `PI-09` (`AdjustInventory`), `PI-10` (`QueryInventory`), `PI-12` (`Checkout`), `PI-14` (`CancelOrder`), `PI-15` (`ConfirmPayment`), `PI-16` (`PrepareShipment`, disponibilidad/reserva), `PI-17` (`DispatchOrder`), `PI-22` (`ResolveReturn`).

**4. Contrato de entrada.**

| Operación conceptual | Datos | Regla |
|---|---|---|
| Recuperar posición | `VarianteId` + `BodegaId` | Devuelve posición o ausencia. |
| Listar posiciones | Filtros y paginación | Solo lectura. |
| Reservar | Variante, bodega, cantidad, pedido, clave idempotente | Atómica; falla si no hay disponible. |
| Liberar reserva | Reserva, cantidad, clave idempotente | Solo si está `ACTIVA`; no duplica. |
| Consumir reserva | Reserva, cantidad, pedido, clave idempotente | Solo si está `ACTIVA`; registra salida. |
| Registrar movimiento | Posición, tipo, cantidad, referencia, actor, motivo | Append-only; preserva invariantes. |
| Recuperar reservas | `PedidoId` | Devuelve reservas del pedido. |

**5. Contrato de salida.** Posición con `onHand`, `reserved`, `unavailable`, `disponible` y versión; reserva con estado; movimiento registrado; confirmación de la operación atómica; lista filtrada.

**6. Errores y fallos.**

| Código | Significado | Cuándo |
|---|---|---|
| `NO_ENCONTRADO` | No existe la posición o reserva. | Recuperación. |
| `REGLA_NEGOCIO_INCUMPLIDA` | Disponibilidad insuficiente, bodega inactiva o variante no vendible. | INV-02–INV-04. |
| `CONFLICTO_CONCURRENCIA` | La posición cambió o dos operaciones compiten. | DM-10. |
| `IDEMPOTENCIA_CONFLICTO` | La clave se usó con otros datos. | DM-11, DM-12. |
| `DATOS_INVALIDOS` | Cantidad, tipo o referencia inválidos. | Escritura. |
| `FALLO_PERSISTENCIA` | La transacción no se pudo completar. | Conexión/restricción. |

**7. Restricciones e invariantes.** Preserva INV-01…INV-10; `reserved + unavailable <= onHand`; toda mutación genera movimiento; una reserva terminal no vuelve a activa; las operaciones son idempotentes; los movimientos no se editan ni eliminan; la reserva/consumo es atómica respecto de la posición; no se reserva stock de bodega inactiva ni variante no vendible.

**8. Dependencia externa abstracta.** Persistencia transaccional con control de concurrencia. `[MOD]` §24.1/§24.4 asigna inventario, reservas y movimientos a SQL; MongoDB no es fuente autoritativa del saldo.

**9. Límites del contrato.** No elige la bodega (DS-04), no calcula importes (DS-05), no decide el estado del pedido (DS-06) y no autoriza (DS-01). El adaptador implementa la atomicidad; el repositorio no sustituye las reglas de dominio.

**10. Trazabilidad.** `[ARQ]` §7.3, §9.4; `[MOD]` §8.2–§8.3, §24; `[VO]` §6.6, §6.7, §8.17; `[DS]` DS-03, DS-04.

**Estado:** `Confirmado`.

---

#### PO-07 — `CartRepository`

**1. Identificación.** `PO-07`, `CartRepository`, módulo `cart`. Documentación: §5.1. Ubicación propuesta: `src/modules/cart/application/ports/cart-repository.port.ts`. Propósito: persistir y recuperar el carrito activo de un comprador.

**2. Responsabilidad.** Recuperar el carrito por identificador o por comprador; guardar el carrito con sus líneas y versión; verificar que exista un solo carrito activo por comprador. Abstrae la persistencia del carrito.

**3. Componente consumidor.** `PI-01` (`RegisterBuyer`), `PI-11` (`ManageCart`), `PI-12` (`Checkout`).

**4. Contrato de entrada.**

| Operación conceptual | Datos | Regla |
|---|---|---|
| Recuperar por identificador | `CarritoId` | Devuelve carrito o ausencia. |
| Recuperar activo por comprador | `CompradorId` | Devuelve el carrito activo. |
| Guardar | `Carrito` y versión esperada | Inserción/actualización. |
| Verificar carrito activo | `CompradorId` | Booleano/identificador. |

**5. Contrato de salida.** `Carrito` reconstruido con líneas, precios referenciales y versión, o ausencia; confirmación de guardado.

**6. Errores y fallos.**

| Código | Significado | Cuándo |
|---|---|---|
| `NO_ENCONTRADO` | No existe carrito. | Recuperación. |
| `CONFLICTO_UNICIDAD` | Ya existe un carrito activo para el comprador. | Inserción. |
| `CONFLICTO_CONCURRENCIA` | El carrito cambió. | Actualización. |
| `DATOS_INVALIDOS` | Línea o cantidad inválida. | Guardado. |
| `FALLO_PERSISTENCIA` | Persistencia no disponible. | Conexión/transacción. |

**7. Restricciones e invariantes.** Un carrito activo por comprador; una línea por variante; cantidades positivas; el precio es referencial; el carrito no reserva stock; la versión controla la concurrencia. La escritura participa en la unidad de trabajo.

**8. Dependencia externa abstracta.** Persistencia transaccional; `[MOD]` §24.1 asigna carritos a SQL.

**9. Límites del contrato.** No reserva stock, no garantiza precios, no calcula el total final, no crea pedidos y no aplica descuentos.

**10. Trazabilidad.** `[ARQ]` §7.3; `[MOD]` §9.1–§9.3, §24; `[VO]` §6.5, §6.7; `[DS]` DS-01.

**Estado:** `Confirmado`.

---

#### PO-08 — `OrderRepository`

**1. Identificación.** `PO-08`, `OrderRepository`, módulo `orders`. Documentación: §5.1. Ubicación propuesta: `src/modules/orders/application/ports/order-repository.port.ts`. Propósito: persistir y reconstruir pedidos y sus líneas, y aplicar transiciones de estado con control de concurrencia.

**2. Responsabilidad.** Recuperar pedidos por identificador, comprador, vendedor o `checkoutGroupId`; guardar el agregado con snapshots; aplicar una transición de estado con versión esperada; listar pedidos para consulta. Abstrae la persistencia del pedido.

**3. Componente consumidor.** `PI-12` (`Checkout`), `PI-13` (`QueryOrder`), `PI-14` (`CancelOrder`), `PI-15` (`ConfirmPayment`), `PI-16` (`PrepareShipment`), `PI-17` (`DispatchOrder`), `PI-18` (`ConfirmDelivery`), `PI-19` (`IssueInvoice`), `PI-21` (`RequestReturn`), `PI-22` (`ResolveReturn`), `PI-23` (`ProcessRefund`).

**4. Contrato de entrada.**

| Operación conceptual | Datos | Regla |
|---|---|---|
| Recuperar por identificador | `PedidoId` | Devuelve agregado o ausencia. |
| Listar por comprador/vendedor/estado | Filtros y paginación | Solo lectura. |
| Recuperar por grupo de checkout | `CheckoutGroupId` | Devuelve pedidos del grupo. |
| Guardar | `Pedido` y versión esperada | Inserción/actualización. |
| Aplicar transición | `PedidoId`, estado nuevo, versión, referencia causal | Valida la transición y persiste una sola vez. |

**5. Contrato de salida.** `Pedido` reconstruido con líneas, snapshots, estados e importes, o ausencia; lista filtrada; confirmación de guardado/transición.

**6. Errores y fallos.**

| Código | Significado | Cuándo |
|---|---|---|
| `NO_ENCONTRADO` | No existe el pedido. | Recuperación. |
| `CONFLICTO_CONCURRENCIA` | El pedido cambió. | Transición concurrente. |
| `TRANSICION_INVALIDA` | El estado nuevo no es alcanzable. | ORD-01. |
| `DATOS_INVALIDOS` | Snapshots, líneas o totales inconsistentes. | Guardado. |
| `FALLO_PERSISTENCIA` | Persistencia no disponible. | Conexión/transacción. |

**7. Restricciones e invariantes.** Un solo vendedor por pedido; al menos una línea; snapshots inmutables; totales consistentes; no se reescribe un pedido `ENTREGADO`/`CERRADO`; no se elimina el pedido; la transición registra actor, timestamp, estado previo, estado nuevo y referencia causal (ORD-05); la versión controla la concurrencia.

**8. Dependencia externa abstracta.** Persistencia transaccional; `[MOD]` §24.1 asigna pedidos a SQL.

**9. Límites del contrato.** No captura pagos, no despacha, no calcula importes, no autoriza, no emite facturas y no procesa devoluciones. El adaptador reconstruye el agregado; el dominio decide la transición.

**10. Trazabilidad.** `[ARQ]` §7.3, §9.4; `[MOD]` §10.1–§10.4, §24; `[VO]` §6.5, §7.3, §8.11; `[DS]` DS-06.

**Estado:** `Confirmado`.

---

#### PO-09 — `PaymentRepository`

**1. Identificación.** `PO-09`, `PaymentRepository`, módulo `payments`. Documentación: §5.1. Ubicación propuesta: `src/modules/payments/application/ports/payment-repository.port.ts`. Propósito: persistir y recuperar pagos, intentos y referencias externas, preservando la idempotencia.

**2. Responsabilidad.** Recuperar pagos por identificador, pedido o referencia del proveedor; guardar el pago con su estado; verificar la unicidad de la clave idempotente y de la referencia externa; listar intentos. Abstrae la persistencia del pago, no la integración con el proveedor.

**3. Componente consumidor.** `PI-12` (`Checkout`), `PI-13` (`QueryOrder`, resumen de pago), `PI-14` (`CancelOrder`), `PI-15` (`ConfirmPayment`), `PI-19` (`IssueInvoice`), `PI-23` (`ProcessRefund`).

**4. Contrato de entrada.**

| Operación conceptual | Datos | Regla |
|---|---|---|
| Recuperar por identificador | `PagoId` | Devuelve pago o ausencia. |
| Recuperar por pedido | `PedidoId` | Devuelve intentos del pedido. |
| Recuperar por referencia externa | Referencia del proveedor | Única cuando existe. |
| Guardar | `Pago` y versión esperada | Inserción/actualización. |
| Verificar idempotencia | `IdempotencyKey` | Booleano/registro asociado. |

**5. Contrato de salida.** `Pago` reconstruido con estado, importe, moneda, proveedor y referencia, o ausencia; lista de intentos; confirmación de guardado; resultado de idempotencia.

**6. Errores y fallos.**

| Código | Significado | Cuándo |
|---|---|---|
| `NO_ENCONTRADO` | No existe el pago. | Recuperación. |
| `CONFLICTO_UNICIDAD` | Clave idempotente o referencia externa duplicada. | Inserción. |
| `CONFLICTO_CONCURRENCIA` | El pago cambió. | Actualización. |
| `DATOS_INVALIDOS` | Importe, moneda o estado inválidos. | Guardado. |
| `FALLO_PERSISTENCIA` | Persistencia no disponible. | Conexión/transacción. |

**7. Restricciones e invariantes.** No almacena datos completos de tarjeta ni secretos (PAY-06); un pago no se marca `CAPTURADO` sin confirmación verificable; una operación no se captura dos veces; el historial de intentos no se sobrescribe; la suma capturada y los reembolsos no exceden el importe; la clave idempotente es única en su ámbito.

**8. Dependencia externa abstracta.** Persistencia transaccional; `[MOD]` §24.1 asigna pagos a SQL. La comunicación con el proveedor pertenece a `PO-16`.

**9. Límites del contrato.** No inicia ni captura pagos (PO-16), no decide el estado del pedido (DS-06), no emite facturas y no procesa reembolsos (PO-13/PO-16).

**10. Trazabilidad.** `[ARQ]` §7.3, §9.4; `[MOD]` §11.1, §24; `[VO]` §6.5, §8.12; `[DS]` DS-06, DS-08.

**Estado:** `Confirmado`.

---

#### PO-10 — `InvoiceRepository`

**1. Identificación.** `PO-10`, `InvoiceRepository`, módulo `billing`. Documentación: §5.1. Ubicación propuesta: `src/modules/billing/application/ports/invoice-repository.port.ts`. Propósito: persistir y recuperar facturas, preservar la inmutabilidad de la factura emitida y verificar la unicidad del número y del pedido.

**2. Responsabilidad.** Recuperar facturas por identificador, pedido o número; guardar la factura con sus snapshots y líneas; verificar unicidad de número en la serie y de la factura por pedido; listar facturas para consulta. Abstrae la persistencia documental/fiscal.

**3. Componente consumidor.** `PI-13` (`QueryOrder`, resumen de factura), `PI-19` (`IssueInvoice`), `PI-20` (`CorrectInvoice`).

**4. Contrato de entrada.**

| Operación conceptual | Datos | Regla |
|---|---|---|
| Recuperar por identificador | `FacturaId` | Devuelve factura o ausencia. |
| Recuperar por pedido | `PedidoId` | Devuelve factura o ausencia. |
| Recuperar por número | `NumeroFactura` + serie | Único en la serie. |
| Guardar | `Factura` y versión esperada | Inserción/actualización controlada. |
| Verificar unicidad | Número/pedido | Booleano. |

**5. Contrato de salida.** `Factura` reconstruida con snapshots, líneas, importes y estado, o ausencia; lista filtrada; confirmación de guardado; resultado de unicidad.

**6. Errores y fallos.**

| Código | Significado | Cuándo |
|---|---|---|
| `NO_ENCONTRADO` | No existe la factura. | Recuperación. |
| `CONFLICTO_UNICIDAD` | Número o pedido ya facturado. | Inserción. |
| `CONFLICTO_CONCURRENCIA` | La factura cambió. | Corrección concurrente. |
| `DATOS_INVALIDOS` | Snapshots, líneas o importes inconsistentes. | Guardado. |
| `FALLO_PERSISTENCIA` | Persistencia no disponible. | Conexión/transacción. |

**7. Restricciones e invariantes.** La factura `EMITIDA` no se edita silenciosamente; las correcciones se vinculan mediante anulación o documento correctivo; los snapshots son inmutables; el número es único en la serie; la línea base admite una factura por pedido; no se elimina una factura emitida. La escritura participa en la unidad de trabajo.

**8. Dependencia externa abstracta.** Persistencia transaccional/documental según la política fiscal. `[MOD]` §24.1 asigna facturas a SQL; el contrato no prescribe el almacenamiento del artefacto.

**9. Límites del contrato.** No define numeración, serie ni jurisdicción (L-17); no genera el PDF ni almacena el artefacto; no corrige por sí mismo (PI-20); no modifica el pedido.

**10. Trazabilidad.** `[ARQ]` §7.3, §9.3; `[MOD]` §12.1, §24; `[VO]` §8.13, §9.5, §9.6; `[DS]` DS-09.

**Estado:** `Confirmado`; `Limitado` por L-17 (numeración/serie) y L-11 (snapshots).

#### PO-11 — `ShipmentRepository`

**1. Identificación.** `PO-11`, `ShipmentRepository`, módulo `shipping`. Documentación: §5.1. Ubicación propuesta: `src/modules/shipping/application/ports/shipment-repository.port.ts`. Propósito: persistir y reconstruir envíos, sus líneas, estados, evidencias y datos de seguimiento.

**2. Responsabilidad.** Recuperar envíos por identificador, pedido o número de seguimiento; guardar el envío con sus líneas y estado; listar envíos de un pedido; preservar la evidencia de despacho y entrega. Abstrae la persistencia logística, no la integración con el transportista.

**3. Componente consumidor.** `PI-13` (`QueryOrder`), `PI-16` (`PrepareShipment`), `PI-17` (`DispatchOrder`), `PI-18` (`ConfirmDelivery`).

**4. Contrato de entrada.**

| Operación conceptual | Datos | Regla |
|---|---|---|
| Recuperar por identificador | `EnvioId` | Devuelve envío o ausencia. |
| Recuperar por pedido | `PedidoId` | Devuelve todos los envíos del pedido. |
| Recuperar por seguimiento | Número de seguimiento | Único cuando existe. |
| Guardar | `Envio` y versión esperada | Inserción/actualización. |
| Aplicar transición | `EnvioId`, estado nuevo, evidencia, versión | Valida la transición y persiste una vez. |

**5. Contrato de salida.** `Envio` reconstruido con líneas, estado, transportista, seguimiento y evidencias, o ausencia; lista de envíos; confirmación de guardado/transición.

**6. Errores y fallos.**

| Código | Significado | Cuándo |
|---|---|---|
| `NO_ENCONTRADO` | No existe el envío. | Recuperación. |
| `CONFLICTO_CONCURRENCIA` | El envío cambió. | Transición concurrente. |
| `TRANSICION_INVALIDA` | El estado nuevo no es alcanzable. | §13.2. |
| `DATOS_INVALIDOS` | Líneas, cantidades o evidencia inválidas. | Guardado. |
| `CONFLICTO_UNICIDAD` | Número de seguimiento duplicado. | Inserción/actualización. |
| `FALLO_PERSISTENCIA` | Persistencia no disponible. | Conexión/transacción. |

**7. Restricciones e invariantes.** Un pedido puede tener varios envíos; las cantidades no exceden lo comprado ni lo reservado; un envío no se marca `ENTREGADO` sin evidencia; un envío `ENTREGADO` o `FALLIDO` no se reabre; el seguimiento se correlaciona con el proveedor; no se elimina el historial. La escritura participa en la unidad de trabajo.

**8. Dependencia externa abstracta.** Persistencia transaccional; `[MOD]` §24.1 asigna envíos a SQL. La comunicación con el transportista pertenece a `PO-17`.

**9. Límites del contrato.** No elige transportista (PO-17), no consume inventario (PO-06), no decide el estado global del pedido (DS-06) y no procesa devoluciones. El adaptador reconstruye el agregado; el dominio decide la transición.

**10. Trazabilidad.** `[ARQ]` §7.3, §9.4; `[MOD]` §13.1–§13.3, §24; `[VO]` §8.14; `[DS]` DS-06.

**Estado:** `Confirmado`; `Limitado` por L-23 (eventos/tracking del proveedor).

---

#### PO-12 — `ReturnRepository`

**1. Identificación.** `PO-12`, `ReturnRepository`, módulo `returns`. Documentación: §5.1. Ubicación propuesta: `src/modules/returns/application/ports/return-repository.port.ts`. Propósito: persistir y reconstruir solicitudes de devolución, sus líneas, estados, motivos e inspecciones.

**2. Responsabilidad.** Recuperar devoluciones por identificador, pedido o comprador; guardar la devolución con sus líneas y estado; verificar cantidades elegibles; aplicar transiciones de estado con control de concurrencia. Abstrae la persistencia de posventa.

**3. Componente consumidor.** `PI-13` (`QueryOrder`, resumen de posventa), `PI-21` (`RequestReturn`), `PI-22` (`ResolveReturn`), `PI-23` (`ProcessRefund`).

**4. Contrato de entrada.**

| Operación conceptual | Datos | Regla |
|---|---|---|
| Recuperar por identificador | `DevolucionId` | Devuelve devolución o ausencia. |
| Recuperar por pedido | `PedidoId` | Devuelve devoluciones del pedido. |
| Listar por comprador/estado | Filtros y paginación | Solo lectura. |
| Guardar | `Devolucion` y versión esperada | Inserción/actualización. |
| Aplicar transición | `DevolucionId`, estado nuevo, motivo/inspección, versión | Valida la transición. |
| Verificar cantidades | Líneas y cantidades | No exceden lo entregado ni lo ya solicitado. |

**5. Contrato de salida.** `Devolucion` reconstruida con líneas, estado, motivo, inspección y vínculo al pedido, o ausencia; lista filtrada; confirmación de guardado/transición; resultado de elegibilidad.

**6. Errores y fallos.**

| Código | Significado | Cuándo |
|---|---|---|
| `NO_ENCONTRADO` | No existe la devolución. | Recuperación. |
| `CONFLICTO_CONCURRENCIA` | La devolución cambió. | Transición concurrente. |
| `TRANSICION_INVALIDA` | El estado nuevo no es alcanzable. | §14.3. |
| `DATOS_INVALIDOS` | Motivo, inspección o cantidades inválidas. | Guardado. |
| `REGLA_NEGOCIO_INCUMPLIDA` | Cantidad excedida o devolución no elegible. | RET-02. |
| `FALLO_PERSISTENCIA` | Persistencia no disponible. | Conexión/transacción. |

**7. Restricciones e invariantes.** Las cantidades no exceden lo entregado menos lo ya solicitado/aprobado; una devolución `RESUELTA` o `RECHAZADA` no se reabre; el motivo pertenece al catálogo; la inspección es obligatoria para el reingreso físico; la devolución no modifica inventario por sí misma; no se elimina el historial. La escritura participa en la unidad de trabajo.

**8. Dependencia externa abstracta.** Persistencia transaccional; `[MOD]` §24.1 asigna devoluciones a SQL.

**9. Límites del contrato.** No aprueba ni rechaza (DS-07), no mueve inventario (PO-06), no reembolsa (PO-13), no define el valor del plazo (aprobado en `DEC-W1-002`) ni el catálogo de motivos (L-10).

**10. Trazabilidad.** `[ARQ]` §7.3, §9.4; `[MOD]` §14.1, §14.3, §24; `[VO]` §8.15; `[DS]` DS-07.

**Estado:** `Confirmado`; plazo aprobado (`DEC-W1-002`); `Limitado` por L-10 (motivos).

---

#### PO-13 — `RefundRepository`

**1. Identificación.** `PO-13`, `RefundRepository`, módulo `refunds`. Documentación: §5.1. Ubicación propuesta: `src/modules/refunds/application/ports/refund-repository.port.ts`. Propósito: persistir y reconstruir reembolsos, su estado, importe, vínculo al pago y clave de idempotencia.

**2. Responsabilidad.** Recuperar reembolsos por identificador, pago, pedido o devolución; guardar el reembolso con su estado; verificar la suma reembolsada contra el pago capturado; preservar la idempotencia. Abstrae la persistencia financiera, no la llamada al proveedor.

**3. Componente consumidor.** `PI-13` (`QueryOrder`, resumen de posventa), `PI-22` (`ResolveReturn`, coordinación), `PI-23` (`ProcessRefund`).

**4. Contrato de entrada.**

| Operación conceptual | Datos | Regla |
|---|---|---|
| Recuperar por identificador | `ReembolsoId` | Devuelve reembolso o ausencia. |
| Recuperar por pago/pedido | `PagoId`/`PedidoId` | Devuelve reembolsos asociados. |
| Guardar | `Reembolso` y versión esperada | Inserción/actualización. |
| Verificar saldo | `PagoId` + importe | No excede capturado menos reembolsos comprometidos. |
| Verificar idempotencia | `IdempotencyKey` | Única en su ámbito. |

**5. Contrato de salida.** `Reembolso` reconstruido con estado, importe, moneda, pago y referencia externa, o ausencia; lista; confirmación de guardado; resultado de saldo/idempotencia.

**6. Errores y fallos.**

| Código | Significado | Cuándo |
|---|---|---|
| `NO_ENCONTRADO` | No existe el reembolso. | Recuperación. |
| `CONFLICTO_UNICIDAD` | Clave idempotente duplicada. | Inserción. |
| `CONFLICTO_CONCURRENCIA` | El reembolso cambió. | Actualización. |
| `REGLA_NEGOCIO_INCUMPLIDA` | Importe excesivo, moneda incompatible o pago no capturado. | REF-01, PAY-05. |
| `TRANSICION_INVALIDA` | El estado nuevo no es alcanzable. | §14.2. |
| `FALLO_PERSISTENCIA` | Persistencia no disponible. | Conexión/transacción. |

**7. Restricciones e invariantes.** Importe mayor que cero; moneda compatible con el pago; la suma de reembolsos no excede lo capturado; un reembolso no se marca `COMPLETADO` sin confirmación del proveedor; el historial no se sobrescribe; la aprobación y la ejecución se registran por separado; la clave idempotente es única. La escritura participa en la unidad de trabajo.

**8. Dependencia externa abstracta.** Persistencia transaccional; `[MOD]` §24.1 asigna reembolsos a SQL. La ejecución externa pertenece a `PO-16`.

**9. Límites del contrato.** No invoca al proveedor (PO-16), no aprueba por sí mismo (DS-08), no modifica el pago (PO-09), no define el rol aprobador (DEC-BIZ-07) ni la escala monetaria (L-04).

**10. Trazabilidad.** `[ARQ]` §7.3, §9.4; `[MOD]` §14.2, §24; `[VO]` §8.16; `[DS]` DS-08.

**Estado:** `Confirmado`; `Limitado` por L-04 y DEC-BIZ-07.

---

#### PO-14 — `AuditLogRepository`

**1. Identificación.** `PO-14`, `AuditLogRepository`, módulo `reporting`. Documentación: §5.1. Ubicación propuesta: `src/modules/reporting/application/ports/audit-log-repository.port.ts`. Propósito: registrar de forma append-only los eventos de auditoría y consultarlos con filtros autorizados.

**2. Responsabilidad.** Añadir un `RegistroAuditoria` con actor, acción, recurso, resultado, severidad, correlación y timestamp; consultar registros por filtros; preservar la inmutabilidad y la minimización de datos. Abstrae el almacenamiento de auditoría.

**3. Componente consumidor.** Todos los puertos que invocan `DS-09` (de forma directa o mediante outbox) y `PI-25` (`QueryAuditLog`). Los casos de uso no escriben directamente en MongoDB ni en SQL.

**4. Contrato de entrada.**

| Operación conceptual | Datos | Regla |
|---|---|---|
| Añadir registro | `RegistroAuditoria` | Append-only; datos minimizados. |
| Consultar por filtros | Evento, recurso, actor, fecha, resultado, gravedad, correlación | Solo lectura; paginación. |
| Recuperar por identificador | `AuditoriaId` | Devuelve registro o ausencia. |

**5. Contrato de salida.** Confirmación de append; registros reconstruidos y paginados; ausencia explícita. No se devuelven documentos crudos ni secretos.

**6. Errores y fallos.**

| Código | Significado | Cuándo |
|---|---|---|
| `FALLO_PERSISTENCIA` | No se pudo registrar/leer la auditoría. | Almacén no disponible. |
| `DATOS_INVALIDOS` | Registro sin actor, acción o correlación. | Append inválido. |
| `LIMITE_EXCEDIDO` | Se supera el tamaño de página. | Consulta. |
| `NO_ENCONTRADO` | No existe el registro. | Recuperación por identificador. |
| `OPERACION_NO_SOPORTADA` | Se intenta modificar o eliminar. | El contrato es append-only. |

**7. Restricciones e invariantes.** Append-only: no se actualiza ni elimina un registro; todo evento crítico incluye actor, acción, recurso, resultado, timestamp y correlación; no se registran secretos, credenciales, datos completos de tarjeta ni datos personales innecesarios; la auditoría no sustituye el registro de negocio (AUD-05); un fallo de auditoría crítica debe impedir o marcar la operación según la política (AUD-06). La escritura crítica participa en la misma transacción que la mutación mediante outbox (PO-23).

**8. Dependencia externa abstracta.** Almacenamiento documental/append-only. `[ARQ]` §9.2 y `[MOD]` §24.2 señalan MongoDB como adecuado para auditoría/eventos; el contrato no prescribe el motor ni el esquema.

**9. Límites del contrato.** El adaptador decide la representación y la consulta; el repositorio no define el catálogo de eventos, el payload ni la severidad (L-11, L-14, L-15); no reemplaza los registros de pedidos, pagos o inventario; no autoriza (DS-01).

**10. Trazabilidad.** `[ARQ]` §7.3, §9.2, §9.3; `[MOD]` §15.1, §20, §24; `[VO]` §8.18–§8.20; `[DS]` DS-09.

**Estado:** `Confirmado`; `Limitado` por L-11, L-14 y L-15.

### 5.2 Transacciones y eventos

#### PO-15 — `TransactionManager`

**1. Identificación.** `PO-15`, `TransactionManager`, módulo `shared`. Documentación: §5.2. Ubicación propuesta: `src/shared/application/ports/transaction-manager.port.ts`. Propósito: delimitar y ejecutar una unidad de trabajo atómica sobre los recursos transaccionales que la aplicación coordina.

**2. Responsabilidad.** Iniciar, confirmar o revertir una unidad de trabajo; propagar el contexto transaccional a los repositorios; garantizar que las escrituras relacionadas se confirmen o se reviertan juntas. No coordina transacciones distribuidas.

**3. Componente consumidor.** Casos de uso que modifican más de un agregado o que requieren atomicidad entre negocio y outbox: `PI-01`, `PI-02`, `PI-03`, `PI-04`, `PI-05`, `PI-06`, `PI-08`, `PI-09`, `PI-11`, `PI-12`, `PI-14`, `PI-15`, `PI-16`, `PI-17`, `PI-18`, `PI-19`, `PI-20`, `PI-21`, `PI-22`, `PI-23`.

**4. Contrato de entrada.** Una operación conceptual de unidad de trabajo que agrupa lecturas/escrituras de repositorios; el contexto de correlación; la política de aislamiento o reintento cuando esté definida.

**5. Contrato de salida.** Confirmación (`commit`) o reversión (`rollback`) de la unidad; el resultado de la operación; el error original propagado de forma segura. No se devuelve una conexión ni un objeto de driver.

**6. Errores y fallos.**

| Código | Significado | Cuándo |
|---|---|---|
| `FALLO_PERSISTENCIA` | No se pudo iniciar, confirmar o revertir. | Conexión, transacción o restricción. |
| `CONFLICTO_CONCURRENCIA` | La transacción compite con otra y no puede completarse. | Deadlock/serialización. |
| `LIMITE_EXCEDIDO` | Se superó el tiempo de espera. | Timeout. |
| `OPERACION_NO_SOPORTADA` | Se intenta una transacción anidada o distribuida. | Uso indebido. |

**7. Restricciones e invariantes.** Solo cubre recursos transaccionales; no incluye llamadas a proveedores externos ni MongoDB salvo que el adaptador lo soporte explícitamente; el outbox crítico se escribe en la misma transacción que el cambio de negocio; una reversión no deja efectos parciales en los recursos cubiertos; no se simula una transacción distribuida.

**8. Dependencia externa abstracta.** Gestión de transacciones de la persistencia relacional. `[ARQ]` §9.4 y `[MOD]` §24.5 limitan la transacción a lo que realmente puede garantizar.

**9. Límites del contrato.** El adaptador gestiona conexión, aislamiento y rollback; la aplicación define el límite; la política de reintentos, el aislamiento exacto y el timeout no están fijados por las fuentes. No decide reglas de negocio ni compensaciones externas.

**10. Trazabilidad.** `[ARQ]` §9.4, §16; `[MOD]` §24.5; `[PM]` §5.5.

**Estado:** `Confirmado`; `Limitado` por la ausencia de política de aislamiento/reintento.

---

#### PO-23 — `DomainEventOutbox`

**1. Identificación.** `PO-23`, `DomainEventOutbox`, módulo `shared`. Documentación: §5.2. Ubicación propuesta: `src/shared/application/ports/domain-event-outbox.port.ts`. Propósito: registrar eventos de dominio/integración en la misma transacción que la mutación crítica y permitir su publicación confiable posterior.

**2. Responsabilidad.** Añadir un evento con código, agregado, referencia, payload minimizado, timestamp, correlación y clave idempotente; recuperar eventos pendientes; marcar publicados o fallidos; evitar duplicados. Es el mecanismo de consistencia entre negocio, auditoría y consumidores externos.

**3. Componente consumidor.** Casos de uso que producen eventos críticos (`PI-01`, `PI-02`, `PI-03`, `PI-04`, `PI-05`, `PI-06`, `PI-08`, `PI-09`, `PI-11`, `PI-12`, `PI-14`, `PI-15`, `PI-16`, `PI-17`, `PI-18`, `PI-19`, `PI-20`, `PI-21`, `PI-22`, `PI-23`) y el proceso de publicación/relay. `DS-09` puede usar el outbox para auditoría crítica.

**4. Contrato de entrada.**

| Operación conceptual | Datos | Regla |
|---|---|---|
| Registrar evento | Código, agregado, referencia, payload minimizado, correlación, clave idempotente | Se escribe en la transacción actual. |
| Recuperar pendientes | Límite/lote | Solo eventos no publicados o reintentables. |
| Marcar publicado | Identificador del evento | Una sola vez; no borra el evento. |
| Marcar fallido | Identificador, error seguro, siguiente intento | Conserva el evento para reintento. |

**5. Contrato de salida.** Identificador del evento registrado; lote de eventos pendientes; confirmación de estado. No se devuelven payloads crudos de proveedores ni secretos.

**6. Errores y fallos.**

| Código | Significado | Cuándo |
|---|---|---|
| `DATOS_INVALIDOS` | Evento sin código, agregado o correlación. | Registro inválido. |
| `CONFLICTO_UNICIDAD` | La clave idempotente ya existe. | Reintento del mismo evento. |
| `FALLO_PERSISTENCIA` | No se pudo escribir/leer el outbox. | Almacén no disponible. |
| `FALLO_PROVEEDOR` | El relay no pudo publicar. | Consumidor externo caído. |
| `LIMITE_EXCEDIDO` | Se superó el lote o el tiempo. | Publicación. |

**7. Restricciones e invariantes.** El evento se registra en la misma transacción que la mutación; la publicación es al menos una vez; los consumidores deben ser idempotentes; un evento no se elimina al publicarse; el payload se minimiza y no contiene secretos; el orden por agregado, si se exige, debe preservarse; un fallo de publicación no revierte la mutación ya confirmada.

**8. Dependencia externa abstracta.** Persistencia transaccional del outbox y un relay/publicador. `[ARQ]` §9.4 y `[MOD]` §24.5 exigen outbox/inbox o equivalente para coordinar SQL, MongoDB y proveedores.

**9. Límites del contrato.** El adaptador/relay implementa la publicación; el puerto no define el catálogo de eventos (L-14), la política de reintentos ni el broker. No sustituye la auditoría ni la notificación al usuario.

**10. Trazabilidad.** `[ARQ]` §9.4; `[MOD]` §15.1, §24.5; `[DS]` DS-09; `[PM]` §5.5.

**Estado:** `Confirmado` por las fuentes; `Limitado` por L-14 (catálogo de eventos) y por la política de reintentos no definida.

---

### 5.3 Proveedores externos

#### PO-16 — `PaymentGateway`

**1. Identificación.** `PO-16`, `PaymentGateway`, módulo `payments`. Documentación: §5.3. Ubicación propuesta: `src/modules/payments/application/ports/payment-gateway.port.ts`. Propósito: abstraer la iniciación, confirmación, cancelación, consulta y reembolso de pagos con un proveedor externo.

**2. Responsabilidad.** Enviar al proveedor la solicitud de pago con importe, moneda y referencia opaca del instrumento; devolver una referencia y un estado normalizado; consultar el estado; solicitar la cancelación o el reembolso; verificar la autenticidad de eventos en el adaptador. No decide el estado del pedido.

**3. Componente consumidor.** `PI-12` (`Checkout`, iniciación), `PI-14` (`CancelOrder`, cancelación de intento), `PI-15` (`ConfirmPayment`, consulta/confirmación), `PI-23` (`ProcessRefund`, reembolso).

**4. Contrato de entrada.**

| Operación conceptual | Datos | Regla |
|---|---|---|
| Iniciar pago | `PagoId`, `PedidoId`, importe, moneda, referencia opaca del instrumento, clave idempotente | No incluye datos completos de tarjeta. |
| Consultar pago | Referencia del proveedor o `PagoId` | Devuelve estado normalizado. |
| Confirmar/capturar | Referencia, importe, moneda, clave idempotente | Una sola captura por operación. |
| Cancelar intento | Referencia, motivo, clave idempotente | Solo si el proveedor lo permite. |
| Reembolsar | Referencia del pago, importe, moneda, clave idempotente | No excede lo capturado. |

**5. Contrato de salida.** Referencia del proveedor; estado normalizado (`PENDIENTE`, `AUTORIZADO`, `CAPTURADO`, `RECHAZADO`, `EXPIRADO`, `REEMBOLSADO`); importe autorizado/capturado; código de rechazo seguro; datos de seguimiento opcionales. No se devuelven payloads crudos con datos sensibles.

**6. Errores y fallos.**

| Código | Significado | Cuándo |
|---|---|---|
| `FALLO_PROVEEDOR` | El proveedor rechazó, falló o no respondió. | Pago/reembolso. |
| `NO_DISPONIBLE` | El proveedor no está configurado o está caído. | Integración. |
| `IDEMPOTENCIA_CONFLICTO` | La clave se usó con otro importe/pago. | Reintento. |
| `DATOS_INVALIDOS` | Importe, moneda o referencia inválidos. | Solicitud. |
| `OPERACION_NO_SOPORTADA` | El proveedor no permite la operación. | Cancelación/reembolso. |
| `LIMITE_EXCEDIDO` | Timeout o límite del proveedor. | Solicitud. |

**7. Restricciones e invariantes.** No se almacenan datos completos de tarjeta ni secretos (PAY-06); el importe y la moneda deben coincidir con el pago; las operaciones son idempotentes; un pago no se declara capturado sin confirmación verificable (PAY-01); los estados del proveedor se normalizan; el adaptador verifica firmas/autenticidad de webhooks; el proveedor no modifica directamente el dominio.

**8. Dependencia externa abstracta.** Proveedor de pagos externo. `[ARQ]` §7.3 lo menciona como integración externa; el contrato no prescribe protocolo, SDK ni credenciales.

**9. Límites del contrato.** El adaptador gestiona protocolo, credenciales, webhooks y reintentos técnicos; la aplicación decide la transición del pedido y la auditoría; el modelo autorización/captura, la ventana de reintento y la cancelación no están definidos (L-22). No emite facturas ni envía notificaciones.

**10. Trazabilidad.** `[ARQ]` §7.3, §9.4; `[MOD]` §11.1; `[VO]` §8.12; `[DS]` DS-06, DS-08; `[ENU]` OBJ-08, OBJ-09.

**Estado:** `Confirmado`; `Limitado` por L-22.

---

#### PO-17 — `ShippingProvider`

**1. Identificación.** `PO-17`, `ShippingProvider`, módulo `shipping`. Documentación: §5.3. Ubicación propuesta: `src/modules/shipping/application/ports/shipping-provider.port.ts`. Propósito: abstraer la asignación de transporte, la creación de guías, el seguimiento y la recepción de eventos del operador logístico.

**2. Responsabilidad.** Solicitar la asignación de un transportista/servicio; crear la guía o el identificador de seguimiento; consultar el estado; recibir eventos de tránsito/entrega; cancelar cuando el proveedor lo permita. No decide el estado interno del envío.

**3. Componente consumidor.** `PI-17` (`DispatchOrder`, guía/seguimiento), `PI-18` (`ConfirmDelivery`, eventos de entrega/fallo).

**4. Contrato de entrada.**

| Operación conceptual | Datos | Regla |
|---|---|---|
| Asignar transporte | `EnvioId`, origen, destino, líneas/cantidades, servicio, clave idempotente | Dirección minimizada. |
| Crear guía | `EnvioId`, transportista/servicio | Devuelve seguimiento. |
| Consultar estado | Seguimiento/`EnvioId` | Estado normalizado. |
| Recibir evento | Evento verificado del proveedor | Correlación con envío. |
| Cancelar | Seguimiento/`EnvioId`, motivo | Solo si el proveedor lo permite. |

**5. Contrato de salida.** Transportista, servicio, número de seguimiento, estado normalizado (`PREPARADO`, `EN_TRANSITO`, `ENTREGADO`, `FALLIDO`, `CANCELADO`), evidencia/fecha, referencia de guía. No se devuelven datos personales innecesarios.

**6. Errores y fallos.**

| Código | Significado | Cuándo |
|---|---|---|
| `FALLO_PROVEEDOR` | El transportista rechazó o falló. | Asignación/guía. |
| `NO_DISPONIBLE` | El proveedor no está configurado o está caído. | Integración. |
| `DATOS_INVALIDOS` | Dirección, líneas o servicio inválidos. | Solicitud. |
| `IDEMPOTENCIA_CONFLICTO` | La clave se usó con otro envío. | Reintento. |
| `OPERACION_NO_SOPORTADA` | El proveedor no permite cancelar/consultar. | Operación. |
| `LIMITE_EXCEDIDO` | Timeout o límite del proveedor. | Solicitud. |

**7. Restricciones e invariantes.** El envío debe estar preparado antes de crear la guía; la dirección se minimiza; el seguimiento se correlaciona con un envío; los eventos del proveedor se verifican en el adaptador; una entrega no se declara sin evidencia; el proveedor no modifica directamente el dominio; las operaciones son idempotentes.

**8. Dependencia externa abstracta.** Operador logístico/transportista externo. `[ARQ]` §7.3 lo menciona como integración externa; el contrato no prescribe protocolo ni SDK.

**9. Límites del contrato.** El adaptador gestiona protocolo, credenciales y webhooks; la aplicación decide las transiciones y la evidencia; los eventos, el tracking y el formato de prueba no están definidos (L-23). No consume inventario ni confirma pagos.

**10. Trazabilidad.** `[ARQ]` §7.3, §9.4; `[MOD]` §13.1–§13.3; `[VO]` §8.14; `[DS]` DS-06; `[ENU]` OBJ-10.

**Estado:** `Confirmado`; `Limitado` por L-23.

---

#### PO-18 — `NotificationSender`

**1. Identificación.** `PO-18`, `NotificationSender`, módulo `shared`. Documentación: §5.3. Ubicación propuesta: `src/shared/application/ports/notification-sender.port.ts`. Propósito: enviar notificaciones a actores por canales externos, sin acoplar la aplicación a un proveedor concreto.

**2. Responsabilidad.** Entregar una notificación con destinatario, canal, plantilla/código de evento y variables; devolver aceptación/rechazo y un identificador de mensaje; no modificar el estado de negocio. Es una capacidad de salida, no una capacidad de entrada.

**3. Componente consumidor.** `PI-01`, `PI-02`, `PI-12`, `PI-15`, `PI-17`, `PI-18`, `PI-19`, `PI-20`, `PI-21`, `PI-22`, `PI-23` cuando la política de comunicación lo requiera.

**4. Contrato de entrada.**

| Campo | Obligatorio | Tipo conceptual | Regla |
|---|---:|---|---|
| `destinatario` | Sí | Correo/teléfono/identificador de usuario | Minimizado; no se registra en claro innecesariamente. |
| `canal` | Sí | `CORREO` \| `SMS` \| `PUSH` u otro autorizado | Catálogo no fijado (L-24). |
| `codigoEvento`/`plantilla` | Sí | Código estable | Catálogo no fijado (L-24). |
| `variables` | Condicional | Pares de datos | Sin secretos ni datos sensibles innecesarios. |
| `correlationId` | Sí | `CorrelationId` | Trazabilidad. |
| `idempotencyKey` | Condicional | `IdempotencyKey` | Evita duplicados en reintentos. |

**5. Contrato de salida.** Aceptación/rechazo del proveedor; identificador de mensaje; estado de entrega si el proveedor lo reporta. La aceptación no garantiza la entrega final.

**6. Errores y fallos.**

| Código | Significado | Cuándo |
|---|---|---|
| `DATOS_INVALIDOS` | Destinatario, canal o plantilla inválidos. | Solicitud. |
| `NO_DISPONIBLE` | Canal/proveedor no configurado o caído. | Integración. |
| `FALLO_PROVEEDOR` | El proveedor rechazó el envío. | Entrega. |
| `LIMITE_EXCEDIDO` | Rate limit o timeout. | Envío. |
| `IDEMPOTENCIA_CONFLICTO` | La clave se usó con otro mensaje. | Reintento. |

**7. Restricciones e invariantes.** No se envían secretos, credenciales ni datos completos de pago; el contenido se minimiza; el envío no cambia el estado de negocio; los reintentos son idempotentes cuando la clave existe; el consentimiento y las preferencias no están definidos (L-24); el adaptador no decide la plantilla de negocio.

**8. Dependencia externa abstracta.** Proveedor de correo/SMS/push. `[ARQ]` §7.3 lo menciona como integración externa; el contrato no prescribe proveedor.

**9. Límites del contrato.** El adaptador gestiona protocolo, credenciales y rate limits; la aplicación decide cuándo notificar; el catálogo de plantillas, canales y consentimiento no está definido (L-24). No sustituye la auditoría ni el outbox.

**10. Trazabilidad.** `[ARQ]` §7.3; `[ENU]` OBJ-01…OBJ-12 (comunicación operativa); `[PM]` §5.5.

**Estado:** `Confirmado`; `Limitado` por L-24.

---

#### PO-19 — `DigitalDeliveryProvider`

**1. Identificación.** `PO-19`, `DigitalDeliveryProvider`, módulo `shared`. Documentación: §5.3. Ubicación propuesta: `src/shared/application/ports/digital-delivery-provider.port.ts`. Propósito: abstraer la provisión, consulta y revocación de acceso a bienes digitales.

**2. Responsabilidad.** Entregar el recurso digital o la licencia asociada a una línea digital; devolver una referencia y evidencia; consultar el estado; revocar el acceso cuando una devolución o corrección lo exija. No sustituye el inventario físico ni el pago.

**3. Componente consumidor.** `PI-15` (`ConfirmPayment`, tras captura), `PI-18` (`ConfirmDelivery`, evidencia digital), `PI-22` (`ResolveReturn`, revocación cuando aplique).

**4. Contrato de entrada.**

| Campo | Obligatorio | Tipo conceptual | Regla |
|---|---:|---|---|
| `pedidoId` | Sí | `PedidoId` | Pedido pagado. |
| `lineaId`/`varianteId` | Sí | Identificador | Línea digital. |
| `compradorId` | Sí | `CompradorId` | Destinatario autorizado. |
| `recursoDigital` | Condicional | Referencia opaca | Recurso/licencia a provisionar. |
| `accion` | Sí | `PROVISIONAR` \| `CONSULTAR` \| `REVOCAR` | Operación. |
| `idempotencyKey` | Sí | `IdempotencyKey` | Evita duplicar la entrega. |

**5. Contrato de salida.** Referencia de entrega, estado (`PROVISIONADO`, `FALLIDO`, `REVOCADO`), evidencia y datos opacos de acceso. No se devuelven secretos de licencia innecesarios.

**6. Errores y fallos.**

| Código | Significado | Cuándo |
|---|---|---|
| `FALLO_PROVEEDOR` | No se pudo provisionar/revocar. | Servicio digital. |
| `NO_DISPONIBLE` | Servicio no configurado o caído. | Integración. |
| `DATOS_INVALIDOS` | Pedido/línea/recurso inválidos. | Solicitud. |
| `IDEMPOTENCIA_CONFLICTO` | La clave se usó con otra línea. | Reintento. |
| `OPERACION_NO_SOPORTADA` | El proveedor no permite la acción. | Revocación/consulta. |

**7. Restricciones e invariantes.** No se entrega antes de la confirmación del pago; una línea digital no se provisiona dos veces; la entrega deja evidencia; la revocación no borra la evidencia histórica; no se usan datos de tarjeta; el acceso se limita al comprador autorizado; el adaptador no decide el estado del pedido.

**8. Dependencia externa abstracta.** Servicio de activos/licencias digitales. `[MOD]` §7.3 y §13.3 exigen un mecanismo de entrega digital; el contrato no prescribe el proveedor.

**9. Límites del contrato.** El adaptador gestiona el mecanismo y las credenciales; la aplicación decide cuándo entregar/revocar; el modelo de recursos, licencias y evidencia no está definido (L-18). No sustituye el inventario físico ni la facturación.

**10. Trazabilidad.** `[MOD]` §7.3, §13.3, §22.4; `[VO]` §8.3; `[DS]` DS-06; `[ENU]` OBJ-08, OBJ-10.

**Estado:** `Inferido`; `Limitado` por L-18.

### 5.4 Capacidades transversales

#### PO-20 — `Clock`

**1. Identificación.** `PO-20`, `Clock`, módulo `shared`. Documentación: §5.4. Ubicación propuesta: `src/shared/application/ports/clock.port.ts`. Propósito: proporcionar el instante actual en UTC para que la aplicación y el dominio generen marcas temporales deterministas y testeables.

**2. Responsabilidad.** Devolver un `Instant` UTC. No interpreta zonas horarias, no formatea fechas y no decide plazos de negocio; solo entrega el instante que la aplicación usará en los agregados, movimientos, auditoría y eventos.

**3. Componente consumidor.** Todos los casos de uso que crean o marcan recursos: `PI-01`, `PI-02`, `PI-03`, `PI-04`, `PI-05`, `PI-06`, `PI-08`, `PI-09`, `PI-11`, `PI-12`, `PI-14`, `PI-15`, `PI-16`, `PI-17`, `PI-18`, `PI-19`, `PI-20`, `PI-21`, `PI-22`, `PI-23`.

**4. Contrato de entrada.** Ninguno. El adaptador no recibe datos de negocio.

**5. Contrato de salida.** Un `Instant` en UTC, con precisión suficiente para ordenar eventos y comparar plazos.

**6. Errores y fallos.**

| Código | Significado | Cuándo |
|---|---|---|
| `NO_DISPONIBLE` | El reloj del sistema no está disponible. | Fallo excepcional de infraestructura. |

No se usan errores de negocio: el tiempo no es una regla de dominio por sí mismo.

**7. Restricciones e invariantes.** UTC; sin ambigüedad de zona horaria; el instante se obtiene una vez por operación cuando la coherencia lo requiera; no se garantiza monotonía estricta entre llamadas; no se usa para decidir reglas que dependan de la zona del usuario sin una política explícita.

**8. Dependencia externa abstracta.** Reloj del sistema. El contrato no prescribe `Date`, una biblioteca ni un servicio de tiempo.

**9. Límites del contrato.** El adaptador obtiene el tiempo; la aplicación decide qué timestamp asignar; el dominio valida las relaciones temporales. La política de plazos de devolución tiene valor inicial 30 días y es configurable (`DEC-W1-002`); este puerto no la aplica. No formatea ni presenta fechas.

**10. Trazabilidad.** `[MOD]` §16, §24; `[VO]` §7.2 (`Instant`); `[ARQ]` §16; `[PM]` §5.5.

**Estado:** `Inferido` de la necesidad documentada de timestamps; no es un candidato explícito de `[ARQ]` §7.3.

---

#### PO-21 — `IdGenerator`

**1. Identificación.** `PO-21`, `IdGenerator`, módulo `shared`. Documentación: §5.4. Ubicación propuesta: `src/shared/application/ports/id-generator.port.ts`. Propósito: generar identificadores tipados, opacos y únicos para agregados, entidades y eventos.

**2. Responsabilidad.** Producir un identificador nuevo del tipo solicitado (`UsuarioId`, `PedidoId`, `PagoId`, `EventoId`, etc.), sin significado de negocio y sin reutilización. La aplicación lo asigna al agregado antes de persistir.

**3. Componente consumidor.** Todos los casos de uso que crean agregados o eventos: `PI-01`, `PI-02`, `PI-05`, `PI-08`, `PI-09`, `PI-12`, `PI-16`, `PI-19`, `PI-20`, `PI-21`, `PI-22`, `PI-23`.

**4. Contrato de entrada.** El tipo nominal del identificador o un espacio de nombres equivalente. No recibe datos personales ni reglas de negocio.

**5. Contrato de salida.** Un identificador nuevo, opaco, único y del tipo solicitado.

**6. Errores y fallos.**

| Código | Significado | Cuándo |
|---|---|---|
| `NO_DISPONIBLE` | El generador no está disponible. | Fallo de infraestructura. |
| `DATOS_INVALIDOS` | El tipo solicitado no está soportado. | Uso indebido. |
| `CONFLICTO_UNICIDAD` | Colisión detectada por el adaptador. | Reintento excepcional. |

**7. Restricciones e invariantes.** Unicidad en el ámbito; opacidad; no reutilización; tipo nominal correcto; no se deriva de datos personales; no se expone el algoritmo. La persistencia refuerza la unicidad.

**8. Dependencia externa abstracta.** Mecanismo de generación de identificadores. El formato físico (UUID, secuencia, ULID u otro) no está fijado por las fuentes (L-13).

**9. Límites del contrato.** El adaptador elige el mecanismo y garantiza la unicidad; la aplicación asigna el identificador; el dominio no depende del formato. No genera números fiscales ni claves de negocio (L-17).

**10. Trazabilidad.** `[MOD]` §16, §24; `[VO]` §3.2 (`IdentificadorTipado`); `[ARQ]` §16; `[PM]` §5.5.

**Estado:** `Inferido` de la necesidad documentada de identificadores; `Limitado` por L-13.

---

#### PO-22 — `PasswordHasher`

**1. Identificación.** `PO-22`, `PasswordHasher`, módulo `identity`. Documentación: §5.4. Ubicación propuesta: `src/modules/identity/application/ports/password-hasher.port.ts`. Propósito: transformar una credencial en texto plano en un `HashCredencial` seguro, sin que la aplicación o la persistencia conserven el valor original.

**2. Responsabilidad.** Producir un hash no reversible con el algoritmo y los parámetros aprobados; opcionalmente verificar una credencial contra un hash para un futuro caso de autenticación. No valida reglas de negocio de identidad ni emite tokens.

**3. Componente consumidor.** `PI-01` (`RegisterBuyer`) y `PI-02` (`RegisterSeller`). Un futuro caso de autenticación usaría la verificación, pero no forma parte de este alcance.

**4. Contrato de entrada.** Credencial en texto plano (solo en memoria) y, si la política lo exige, parámetros de algoritmo. La credencial nunca se registra, audita ni persiste.

**5. Contrato de salida.** `HashCredencial` con el hash y los metadatos necesarios para verificar (algoritmo, sal/parámetros), sin exponer la credencial original.

**6. Errores y fallos.**

| Código | Significado | Cuándo |
|---|---|---|
| `DATOS_INVALIDOS` | Credencial ausente o no válida para el algoritmo. | Registro. |
| `NO_DISPONIBLE` | El servicio criptográfico no está disponible. | Fallo de infraestructura. |
| `OPERACION_NO_SOPORTADA` | Algoritmo no aprobado. | Configuración. |

**7. Restricciones e invariantes.** Nunca se almacena ni registra la credencial en claro; el hash es no reversible; el algoritmo debe ser aprobado; la verificación, si existe, es de tiempo constante; no se exponen sales/parámetros innecesarios; el hash no se usa como identificador.

**8. Dependencia externa abstracta.** Biblioteca o servicio criptográfico. La política aprobada en `DEC-W1-008` fija Argon2id v=19, `m=19456` KiB, `t=2`, `p=1`, sal de 16 bytes, salida de 32 bytes y formato PHC; la biblioteca concreta se elige en W4.

**9. Límites del contrato.** El adaptador implementa el algoritmo; la aplicación decide cuándo hashear. La política de fortaleza, algoritmo y verificación está registrada en `DEC-W1-008`; el adaptador no autentica, no autoriza, no emite sesiones y no decide rate limiting ni recuperación de contraseña (fuera de esta política).

**10. Trazabilidad.** `[MOD]` §6.1; `[VO]` §6.4 (`HashCredencial`); `[DS]` DS-01; `[ARQ]` §16; `[PM]` §5.5; `DEC-W1-008`.

**Estado:** `Confirmado`; política de credenciales aprobada (`DEC-W1-008`); implementación/dependencia en W4.

---

### 5.5 Consultas de lectura

#### PO-24 — `ReportingQuery`

**1. Identificación.** `PO-24`, `ReportingQuery`, módulo `reporting`. Documentación: §5.5. Ubicación propuesta: `src/modules/reporting/application/ports/reporting-query.port.ts`. Propósito: proporcionar consultas de lectura consolidadas para reportes administrativos, sin acoplar los casos de uso a SQL, MongoDB ni a una proyección concreta.

**2. Responsabilidad.** Ejecutar consultas de solo lectura por tipo de reporte, rango de fechas, filtros, agrupación y paginación; devolver filas/agregados, totales e indicador de frescura. Abstrae la composición de datos entre módulos.

**3. Componente consumidor.** `PI-24` (`GenerateAdministrativeReport`). No se usa para consultas operativas de pedidos, inventario o auditoría, que tienen sus propios puertos.

**4. Contrato de entrada.**

| Campo | Obligatorio | Tipo conceptual | Regla |
|---|---:|---|---|
| `tipoReporte` | Sí | Catálogo | Valores no enumerados (L-19). |
| `rangoFechas` | Condicional | Desde/hasta | Según el reporte. |
| `filtros` | No | Dimensiones | Según el reporte. |
| `agrupacion` | No | Dimensión | Según el reporte. |
| `paginacion` | No | Página/tamaño | Límites no fijados (L-19). |
| `alcance` | Sí | Contexto autorizado | El adaptador no amplía el alcance. |

**5. Contrato de salida.** Filas/agregados, totales, `generadoEn` y un indicador de frescura/consistencia eventual cuando aplique. No se devuelven datos sensibles innecesarios.

**6. Errores y fallos.**

| Código | Significado | Cuándo |
|---|---|---|
| `OPERACION_NO_SOPORTADA` | El tipo de reporte no existe. | Catálogo no definido. |
| `DATOS_INVALIDOS` | Filtro, rango o agrupación inválidos. | Consulta. |
| `NO_DISPONIBLE` | La fuente de lectura no está disponible. | SQL/MongoDB/proyección. |
| `LIMITE_EXCEDIDO` | Se supera el tamaño de página o el tiempo. | Consulta. |

**7. Restricciones e invariantes.** Solo lectura; respeta el alcance autorizado; no muta estado; no expone datos personales innecesarios; tolera consistencia eventual si la proyección lo indica; no reemplaza la fuente de verdad transaccional; no se usa para decisiones que exijan lectura fuerte sin declararlo.

**8. Dependencia externa abstracta.** Fuente de lectura SQL, MongoDB o una combinación controlada, conforme a `[ARQ]` §9.3. El contrato no prescribe el motor ni el esquema.

**9. Límites del contrato.** El adaptador elige y compone la fuente; la aplicación define el reporte y su presentación; el catálogo, las fórmulas, los filtros y los límites no están definidos (L-19). No autoriza por sí mismo (DS-01).

**10. Trazabilidad.** `[ARQ]` §7.3, §9.3; `[ENU]` OBJ-12; `[DS]` DS-01; `[PM]` §5.5.

**Estado:** `Confirmado`; `Limitado` por L-19.

---

## 6. Candidatos, agrupaciones y descartes

### 6.1 Candidatos de `[ARQ]` §7.3

| Candidato | Disposición | Puerto resultante | Motivo |
|---|---|---|---|
| `UserRepository` | Retenido | `PO-01` | Identidad y unicidad de cuenta. |
| `SellerRepository` | Retenido | `PO-03` | Perfil comercial del vendedor. |
| `ProductRepository` | Retenido | `PO-05` | Producto, variantes y SKU. |
| `InventoryRepository` | Retenido y ampliado | `PO-06` | Incluye posiciones, reservas y movimientos por atomicidad. |
| `CartRepository` | Retenido | `PO-07` | Carrito activo del comprador. |
| `OrderRepository` | Retenido | `PO-08` | Pedido, líneas y transiciones. |
| `PaymentRepository` | Retenido | `PO-09` | Pago, intentos e idempotencia. |
| `InvoiceRepository` | Retenido | `PO-10` | Factura y snapshots. |
| `ShipmentRepository` | Retenido | `PO-11` | Envío, seguimiento y evidencias. |
| `ReturnRepository` | Retenido | `PO-12` | Devolución y estados. |
| `RefundRepository` | Retenido | `PO-13` | Reembolso y saldo. |
| `AuditLogRepository` | Retenido | `PO-14` | Append y consulta de auditoría. |
| `TransactionManager` | Retenido | `PO-15` | Unidad de trabajo. |
| `PaymentGateway` | Retenido | `PO-16` | Integración de pagos. |
| `ShippingProvider` | Retenido | `PO-17` | Integración logística. |
| `NotificationSender` | Retenido | `PO-18` | Notificaciones. |

### 6.2 Puertos añadidos y justificación

| Puerto | Por qué se añade | Fuente |
|---|---|---|
| `PO-02 BuyerRepository` | `PerfilComprador` es un agregado distinto de `Usuario`; la arquitectura lista `SellerRepository` pero no un repositorio de comprador, y el registro/checkout/devolución lo requieren. | `[MOD]` §6.3; `[ARQ]` §5, §7.3 |
| `PO-04 WarehouseRepository` | `Bodega` es un agregado con tipo, propietario y estado; inventario y logística lo necesitan. | `[MOD]` §8.1; `[ARQ]` §5 |
| `PO-19 DigitalDeliveryProvider` | El modelo exige entrega de productos digitales mediante un mecanismo externo; sin este puerto, `ConfirmPayment`/`ConfirmDelivery` no podrían completar una línea digital. | `[MOD]` §7.3, §13.3; `[ENU]` OBJ-08/OBJ-10 |
| `PO-20 Clock` | La aplicación necesita timestamps UTC para agregados, movimientos y auditoría; se infiere para evitar dependencia oculta del reloj. | `[MOD]` §16, §24; `[VO]` §7.2 |
| `PO-21 IdGenerator` | La aplicación necesita identificadores tipados antes de persistir; se infiere para mantener el dominio independiente del formato. | `[MOD]` §16, §24; `[VO]` §3.2 |
| `PO-22 PasswordHasher` | El registro requiere producir `HashCredencial` sin que la aplicación persista la credencial en claro. | `[MOD]` §6.1; `[VO]` §6.4 |
| `PO-23 DomainEventOutbox` | `[MOD]` §24.5 y `[ARQ]` §9.4 exigen outbox/inbox o equivalente para coordinar SQL, MongoDB y proveedores. | `[MOD]` §24.5; `[ARQ]` §9.4 |
| `PO-24 ReportingQuery` | Los reportes no deben ejecutar SQL/MongoDB directamente; la arquitectura permite una consulta de lectura controlada. | `[ARQ]` §9.3; `[ENU]` OBJ-12 |

### 6.3 Agrupaciones y descartes

| Candidato | Disposición | Motivo |
|---|---|---|
| `InventoryReservationRepository` separado | Agrupado en `PO-06` | La reserva debe validar y modificar la posición de forma atómica; separarla abriría una ventana de inconsistencia. |
| `InventoryMovementRepository` separado | Agrupado en `PO-06` | El movimiento es append-only y debe registrarse en la misma transacción que la mutación de la posición. |
| `AuditLogWriter` + `AuditLogReader` | Agrupado en `PO-14` | Un solo contrato con append y consulta; no se exige CQRS. Si la carga lo justifica, puede separarse en el futuro. |
| `UnitOfWork` | Sustituido por `PO-15` | `TransactionManager` ya expresa el límite transaccional. |
| `EmailSender`, `SmsSender`, `PushSender` | Agrupado en `PO-18` | Los canales son detalles del adaptador; la aplicación expresa una intención de notificación. |
| `DocumentStorage`, `InvoicePdfGenerator` | Rechazado | No hay requisito documentado de generación/almacenamiento de artefactos; `documentoUri` es opcional. Si se aprueba, se añadirá un puerto específico. |
| `TokenService`, `SessionStore` | Rechazado | Autenticación y sesiones están fuera del modelo de dominio y de los objetivos; pertenecen a infraestructura/adaptador. |
| `Cache`, `Logger`, `Metrics` | Rechazado | Son preocupaciones transversales de infraestructura (`shared/infrastructure`), no capacidades de aplicación. |
| `ConfigProvider` | Rechazado | La configuración se resuelve en composición/infraestructura; no es un puerto de negocio. |
| `PaymentWebhookVerifier` | Rechazado como puerto separado | La verificación de autenticidad pertenece al adaptador de `PO-16`. |
| `ShippingWebhookVerifier` | Rechazado como puerto separado | La verificación de eventos pertenece al adaptador de `PO-17`. |
| `InvoiceNumberGenerator` | Rechazado por falta de política | La numeración/serie fiscal no está definida (L-17); crear el puerto obligaría a inventar una regla. |
| `ReportExporter` | Rechazado | El formato de exportación (PDF/CSV) no está documentado; es una preocupación de presentación. |
| `FileStorage` | Rechazado | No hay requisito de carga/almacenamiento de archivos en el modelo. |
| `SearchIndex` | Rechazado | La búsqueda del catálogo no está especificada; `PO-05` cubre consultas básicas. Si se aprueba un índice dedicado, se añadirá. |
| `NotificationTemplateRepository` | Rechazado | El catálogo de plantillas no está definido (L-24); pertenece a configuración/adaptador. |
| `AuditSeverityPolicy` | Rechazado | Es una política de dominio (`DS-09`), no una capacidad externa. |

---

## 7. Trazabilidad

### 7.1 Puertos de entrada → puertos de salida

La matriz completa está en `BackendSDD/Application/nexusmarket-input-ports.md` §7.3. Resumen por bloque:

| Bloque | Puertos de salida |
|---|---|
| Registro y perfiles | `PO-01`, `PO-02`, `PO-03`, `PO-07`, `PO-14`, `PO-15`, `PO-18`, `PO-20`, `PO-21`, `PO-22`, `PO-23` |
| Catálogo | `PO-03`, `PO-05`, `PO-14`, `PO-15`, `PO-20`, `PO-23` |
| Bodegas e inventario | `PO-03`, `PO-04`, `PO-05`, `PO-06`, `PO-14`, `PO-15`, `PO-20`, `PO-21`, `PO-23` |
| Carrito y checkout | `PO-02`, `PO-03`, `PO-04`, `PO-05`, `PO-06`, `PO-07`, `PO-08`, `PO-09`, `PO-14`, `PO-15`, `PO-16`, `PO-18`, `PO-20`, `PO-21`, `PO-23` |
| Pedidos y pagos | `PO-06`, `PO-08`, `PO-09`, `PO-14`, `PO-15`, `PO-16`, `PO-18`, `PO-19`, `PO-20`, `PO-23` |
| Logística | `PO-04`, `PO-06`, `PO-08`, `PO-11`, `PO-14`, `PO-15`, `PO-17`, `PO-18`, `PO-19`, `PO-20`, `PO-21`, `PO-23` |
| Facturación | `PO-08`, `PO-09`, `PO-10`, `PO-14`, `PO-15`, `PO-18`, `PO-20`, `PO-21`, `PO-23` |
| Devoluciones y reembolsos | `PO-02`, `PO-06`, `PO-08`, `PO-09`, `PO-12`, `PO-13`, `PO-14`, `PO-15`, `PO-16`, `PO-18`, `PO-19`, `PO-20`, `PO-21`, `PO-23` |
| Reportes y auditoría | `PO-14`, `PO-24` |

### 7.2 Puerto de salida → consumidores

| Puerto | Consumidores principales |
|---|---|
| `PO-01 UserRepository` | `PI-01`, `PI-02`, `PI-03`, `PI-04` |
| `PO-02 BuyerRepository` | `PI-01`, `PI-03`, `PI-12`, `PI-21` |
| `PO-03 SellerRepository` | `PI-02`, `PI-03`, `PI-05`, `PI-06`, `PI-08`, `PI-11`, `PI-12` |
| `PO-04 WarehouseRepository` | `PI-02`, `PI-08`, `PI-09`, `PI-10`, `PI-12`, `PI-16` |
| `PO-05 ProductRepository` | `PI-05`, `PI-06`, `PI-07`, `PI-09`, `PI-10`, `PI-11`, `PI-12` |
| `PO-06 InventoryRepository` | `PI-09`, `PI-10`, `PI-12`, `PI-14`, `PI-15`, `PI-16`, `PI-17`, `PI-22` |
| `PO-07 CartRepository` | `PI-01`, `PI-11`, `PI-12` |
| `PO-08 OrderRepository` | `PI-12`–`PI-19`, `PI-21`–`PI-23` |
| `PO-09 PaymentRepository` | `PI-12`, `PI-13`, `PI-14`, `PI-15`, `PI-19`, `PI-23` |
| `PO-10 InvoiceRepository` | `PI-13`, `PI-19`, `PI-20` |
| `PO-11 ShipmentRepository` | `PI-13`, `PI-16`, `PI-17`, `PI-18` |
| `PO-12 ReturnRepository` | `PI-13`, `PI-21`, `PI-22`, `PI-23` |
| `PO-13 RefundRepository` | `PI-13`, `PI-22`, `PI-23` |
| `PO-14 AuditLogRepository` | Todos los que auditan; `PI-25` |
| `PO-15 TransactionManager` | Operaciones multiagregado: `PI-01`, `PI-02`, `PI-03`, `PI-04`, `PI-05`, `PI-06`, `PI-08`, `PI-09`, `PI-11`, `PI-12`, `PI-14`, `PI-15`, `PI-16`, `PI-17`, `PI-18`, `PI-19`, `PI-20`, `PI-21`, `PI-22`, `PI-23` |
| `PO-16 PaymentGateway` | `PI-12`, `PI-14`, `PI-15`, `PI-23` |
| `PO-17 ShippingProvider` | `PI-17`, `PI-18` |
| `PO-18 NotificationSender` | `PI-01`, `PI-02`, `PI-12`, `PI-15`, `PI-17`, `PI-18`, `PI-19`, `PI-20`, `PI-21`, `PI-22`, `PI-23` |
| `PO-19 DigitalDeliveryProvider` | `PI-15`, `PI-18`, `PI-22` |
| `PO-20 Clock` | Todos los que crean/marcan recursos |
| `PO-21 IdGenerator` | Todos los que crean agregados/eventos |
| `PO-22 PasswordHasher` | `PI-01`, `PI-02` |
| `PO-23 DomainEventOutbox` | Mutaciones críticas; `DS-09`; relay |
| `PO-24 ReportingQuery` | `PI-24` |

### 7.3 Servicios de dominio → puertos de salida

| Servicio | Puertos que apoyan su ejecución |
|---|---|
| `DS-01 PoliticaAutorizacionDominio` | `PO-01`, `PO-02`, `PO-03`, `PO-04`, `PO-08`, `PO-10`, `PO-14` |
| `DS-02 PoliticaPublicacionCatalogo` | `PO-03`, `PO-05` |
| `DS-03 ServicioReservaInventario` | `PO-04`, `PO-06` |
| `DS-04 ServicioAsignacionBodega` | `PO-04`, `PO-06` |
| `DS-05 ServicioCalculoPedido` | `PO-05`, `PO-08` |
| `DS-06 PoliticaTransicionPedido` | `PO-08`, `PO-09`, `PO-11` |
| `DS-07 PoliticaElegibilidadDevolucion` | `PO-08`, `PO-12` |
| `DS-08 PoliticaReembolso` | `PO-09`, `PO-13` |
| `DS-09 ServicioAuditoria` | `PO-14`, `PO-23` |

---

## 8. Validación del documento

| Criterio | Resultado | Evidencia |
|---|---|---|
| Inventario derivado de fuentes, no de una lista arbitraria | Cumple | §3, §6 y §7; cada puerto tiene candidato o justificación. |
| Cobertura de los candidatos de `[ARQ]` §7.3 | Cumple | §6.1; los dieciséis están representados. |
| Diez puntos por puerto | Cumple | §5.1–§5.5; cada sección numera 1–10. |
| Sin repositorio universal | Cumple | §3 y §6; cada repositorio tiene un agregado/consumidor identificable. |
| Sin duplicados equivalentes | Cumple | §6.3; reservas/movimientos y auditoría se agrupan por atomicidad/coherencia. |
| Contratos coherentes con el Domain Model y los VOs | Cumple con limitaciones | Nombres y estados tomados de `[MOD]` y `[VO]`; limitaciones en §9. |
| Dependencias en la dirección correcta | Cumple | §2.3; la aplicación depende de los puertos, los adaptadores los implementan. |
| Sin código, SQL, colecciones, SDKs ni adaptadores | Cumple | Solo se describen operaciones conceptuales y dependencias abstractas. |
| Errores, invariantes y límites definidos | Cumple | Punto 6/7/9 de cada puerto. |
| Atomicidad, idempotencia y concurrencia donde aplica | Cumple | §4.4 y puntos 6/7 de inventario, pagos, reembolsos y outbox. |
| Trazabilidad a fuentes | Cumple | Punto 10 de cada puerto; §7. |
| Vacíos reales registrados | Cumple | §6.3 y §9. |
| Referencias y rutas válidas | Cumple | Las fuentes citadas existen; las rutas de código se marcan como propuestas. |

---

## 9. Limitaciones y bloqueos reales

Las limitaciones `L-01`…`L-15` están definidas en `DOCUMENTATION_STATUS.md` §7. Las nuevas `L-16`…`L-26` se registran aquí y en el estado documental.

| ID | Limitación | Puertos afectados | Impacto | Información que falta |
|---|---|---|---|---|
| L-01 | Composición de `Direccion`/`DireccionFisica`. | `PO-02`, `PO-04`, `PO-11` | El contrato de dirección queda abstracto. | Campos, formatos y validaciones. |
| L-04 | Moneda, escala y redondeo. | `PO-05`, `PO-08`, `PO-09`, `PO-10`, `PO-13` | Importes y comparaciones no pueden fijarse con precisión. | Moneda del despliegue, escala y redondeo. |
| L-07 | Preferencia entre bodegas elegibles. | `PO-04`, `PO-06` | La selección final no pertenece al repositorio. | Política de selección. |
| L-11 | Composición de snapshots y payload de auditoría. | `PO-08`, `PO-10`, `PO-14` | El esquema exacto queda abstracto. | Campos y formato cerrado. |
| L-12 | **CERRADA (`DEC-W1-008`)**: Argon2id y PHC aprobados. | `PO-22` | Sin bloqueo de algoritmo. | Biblioteca/adaptador ejecutable en W4. |
| L-13 | Formato físico de identificadores. | `PO-21` | El mecanismo de generación queda abstracto. | UUID, secuencia u otro. |
| L-14 | Catálogo de eventos y `TipoReferencia`. | `PO-14`, `PO-23` | El contrato de eventos no enumera códigos. | Catálogo completo y versionado. |
| L-15 | Gravedad de auditoría por evento. | `PO-14` | La asignación de severidad no está cerrada. | Tabla evento → gravedad. |
| L-16 | **CERRADA (`DEC-W1-007`)**: estados iniciales aprobados. | `PO-01`, `PO-03` | El repositorio no decide el estado inicial; lo recibe de la aplicación. | `Usuario ACTIVO`, comprador `HABILITADO`, vendedor `ACTIVO`, bodega `ACTIVA`. |
| L-17 | Numeración, serie fiscal y corrección. | `PO-10` | No puede definirse el número ni el documento correctivo. | Serie, formato, jurisdicción. |
| L-18 | Mecanismo y modelo de entrega digital. | `PO-19` | El contrato de provisión/revocación queda abstracto. | Modelo de licencias/accesos y evidencia. |
| L-19 | Catálogo de reportes, filtros y paginación. | `PO-24` | El contrato de lectura no fija tipos ni límites. | Reportes aprobados y parámetros. |
| L-20 | **CERRADA (`DEC-W1-008`)**: política de credenciales aprobada. | `PO-22` | Sin bloqueo de fortaleza/algoritmo. | 12–128 caracteres, Argon2id y verificación de tiempo constante. |
| L-21 | Cierre `ENTREGADO → CERRADO`. | `PO-08`, `PO-11` | No hay transición de cierre expuesta. | Actor y proceso. |
| L-22 | Protocolo del proveedor de pago. | `PO-09`, `PO-16` | El contrato de pago queda abstracto. | Autorización/captura, reintentos, cancelación. |
| L-23 | Integración logística y tracking. | `PO-11`, `PO-17` | El contrato de transporte queda abstracto. | Proveedor, eventos y evidencia. |
| L-24 | Catálogo de notificaciones y canales. | `PO-18` | El contrato de notificación queda abstracto. | Canales, plantillas y consentimiento. |
| L-25 | Política de aislamiento, timeout y reintento transaccional. | `PO-15` | El adaptador no puede fijar el comportamiento sin una decisión. | Nivel de aislamiento, timeout y reintentos. |
| L-26 | Asignación de operador logístico a pedidos/envíos. | `PO-08`, `PO-11` | El alcance del operador no se deriva del modelo. | Modelo/proceso de asignación. |

**Bloqueos que impiden cerrar un contrato por completo:** L-17 (facturación), L-22 (pagos), L-23 (logística) y L-26 (alcance del operador). `L-25` se cierra a nivel de diseño con `D-16` en los casos de uso; los valores numéricos quedan configurables. Los demás limitan detalles, pero no impiden definir la responsabilidad, las invariantes y los efectos principales.

---

## 10. Registro de cambios

| Fecha | Cambio |
|---|---|
| 2026-10-26 | Creación del catálogo de Output Ports con 24 puertos, inventario, convenciones, contratos de diez puntos, descartes, trazabilidad, validación y limitaciones. |
| 2026-10-26 | Se adopta `application/ports/` como ubicación arquitectónica y se registra `C-15` por la discrepancia con el ejemplo de `[ARQ]` §9.3. |
| 2026-10-26 | Se agrupan reservas y movimientos en `PO-06` por atomicidad, y auditoría de escritura/lectura en `PO-14`; se rechazan puertos sin necesidad documentada. |
| 2026-10-26 | Se registra `L-26` (asignación de operador) y se precisa que `L-25` se cierra a nivel de diseño con `D-16`; no se crean puertos nuevos. |

---

**Cierre:** el inventario cubre los dieciséis candidatos de `[ARQ]` §7.3 y añade las capacidades externas necesarias para perfiles de comprador, bodegas, entrega digital, reloj, identificadores, hashing, outbox y reportes. Las capacidades que no pueden definirse sin una decisión de negocio o de proveedor se registran en §6.3 y §9; no se presentan como contratos cerrados.

