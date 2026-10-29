<div align="center">

<h1>NexusMarket</h1>

<p><strong>Marketplace multi-vendedor con arquitectura DDD y hexagonal</strong></p>

<p>Especificación técnica, modelo de dominio, puertos, adaptadores y alineación de contratos<br />para un backend en TypeScript + Node.js + PostgreSQL + MongoDB.</p>

<p>
  <img src="https://img.shields.io/badge/estado-documentaci%C3%B3n%20completa-2ea043?style=flat-square" alt="Estado: documentación completa" />
  <img src="https://img.shields.io/badge/implementaci%C3%B3n-PI--01%20ejecutable-2ea043?style=flat-square" alt="Implementación: PI-01 ejecutable" />
  <img src="https://img.shields.io/badge/licencia-MIT-yellow?style=flat-square" alt="Licencia MIT" />
  <img src="https://img.shields.io/github/last-commit/SamuuVA/Programacion-Web-2-2026?style=flat-square&color=blue" alt="Último commit" />
</p>

<p>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/DDD-Domain--Driven%20Design-6f42c1?style=flat-square" alt="Domain-Driven Design" />
  <img src="https://img.shields.io/badge/arquitectura-hexagonal-0a66c2?style=flat-square" alt="Arquitectura hexagonal" />
</p>

</div>

> **Estado actual:** la documentación de diseño está completa y el **primer vertical ejecutable `PI-01 RegisterBuyer`** ya existe en `backend/` (TypeScript/Node.js, Fastify y PostgreSQL/memoria). Está verificado con typecheck, 29 pruebas, build, smoke HTTP y **PostgreSQL 17.11 local**: migración aplicada, alta `201`, duplicado `409`, concurrencia con un solo ganador, rollback y auditoría/outbox atómicos. La prueba PostgreSQL está automatizada en `npm run test:postgres`, el contrato de las tres rutas existentes está probado y la revisión independiente terminó en `PASS`; CI, autenticación y el resto del sistema siguen pendientes y no se presentan como implementados.

---

## Tabla de contenidos

- [Descripción general](#descripción-general)
- [Estado del proyecto](#estado-del-proyecto)
- [Primer vertical implementado](#primer-vertical-implementado)
- [Alcance funcional](#alcance-funcional)
- [Stack tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
- [Modelo de dominio](#modelo-de-dominio)
- [Capa de aplicación](#capa-de-aplicación)
- [Adaptadores](#adaptadores)
- [Contratos e integración](#contratos-e-integración)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Documentación](#documentación)
- [Cómo empezar](#cómo-empezar)
- [Convenciones de identificadores](#convenciones-de-identificadores)
- [Hoja de ruta](#hoja-de-ruta)
- [Decisiones y limitaciones abiertas](#decisiones-y-limitaciones-abiertas)
- [Contribución](#contribución)
- [Licencia y autoría](#licencia-y-autoría)

---

## Descripción general

**NexusMarket** es una plataforma digital que actúa como intermediario comercial entre compradores y vendedores. El sistema administra de forma integral el ciclo de negocio: registro de usuarios, incorporación de vendedores, gestión de bodegas, catálogo de productos físicos y digitales, inventario distribuido, carrito, pedidos, pagos, facturación, logística, devoluciones, reembolsos y reportes administrativos.

El diseño sigue tres ideas rectoras:

1. **El dominio manda.** Las reglas de negocio viven en entidades, objetos de valor, agregados, políticas y servicios de dominio; no en controladores, tablas ni proveedores externos.
2. **Las dependencias apuntan hacia el núcleo.** La arquitectura hexagonal aísla el dominio de HTTP, SQL, MongoDB y servicios de terceros mediante puertos y adaptadores.
3. **Nada se inventa.** Los requisitos confirmados se separan de las decisiones de diseño, las inferencias y las propuestas pendientes de aprobación. Las limitaciones reales quedan registradas con identificador estable en lugar de disfrazarse de reglas.

El proyecto se desarrolla como un **monolito modular**: una sola unidad desplegable, organizada en módulos de negocio con límites explícitos y preparada para separarse en el futuro solo si existe una necesidad real.

---

## Estado del proyecto

### Resumen documental

| Área | Artefacto | Estado |
|---|---|---|
| Especificación funcional | [`enunciado.md`](BackendSDD/enunciado.md) | Transcripción completa del PDF fuente |
| Modelo de dominio | [`nexusmarket-domain-model.md`](BackendSDD/Domain/nexusmarket-domain-model.md) | Versión 2.0 · línea base |
| Objetos de valor | [`nexusmarket-domain-object-values.md`](BackendSDD/Domain/nexusmarket-domain-object-values.md) | Completo · 47 entradas |
| Servicios y políticas de dominio | [`nexusmarket-domain-services.md`](BackendSDD/Domain/nexusmarket-domain-services.md) + [`services/`](BackendSDD/Domain/services) | Completo · `DS-01`…`DS-09` |
| Puertos de entrada | [`nexusmarket-input-ports.md`](BackendSDD/Application/nexusmarket-input-ports.md) | Completo · `PI-01`…`PI-25` |
| Puertos de salida | [`nexusmarket-output-ports.md`](BackendSDD/Application/nexusmarket-output-ports.md) | Completo · `PO-01`…`PO-24` |
| Casos de uso | [`nexusmarket-use-cases-checkout-query-order.md`](BackendSDD/Application/nexusmarket-use-cases-checkout-query-order.md) | Completo · `UC-01`, `UC-02` |
| Adaptadores | [`nexusmarket-adapters.md`](BackendSDD/Adapters/nexusmarket-adapters.md) + 14 documentos | Completo · `ADIN-01`, `ADOUT-01`…`ADOUT-13` |
| Alineación de contratos | [`nexusmarket-contract-alignment.md`](BackendSDD/Contracts/nexusmarket-contract-alignment.md) | Completo · `CT-01`…`CT-13` |
| Código de aplicación | [`backend/`](backend/) · [`backend/README.md`](backend/README.md) | **PI-01 implementado**; PostgreSQL 17.11 y suite automatizada; contrato de tres rutas probado |

### Indicadores de la especificación

| Servicios de dominio | Puertos de entrada | Puertos de salida | Adaptadores | Contratos | Casos de uso |
|:---:|:---:|:---:|:---:|:---:|:---:|
| **9** | **25** | **24** | **14** | **13** | **2** |

> `COMPLETO` significa que el documento cumple su objetivo, distingue hechos de decisiones y no tiene omisiones evitables. **No significa que exista implementación ni que el negocio haya aprobado todas las propuestas.**

### Qué incluye y qué no incluye todavía

**Incluye**

- Especificación funcional del negocio y restricciones críticas.
- Modelo de dominio con contextos, agregados, invariantes, estados y eventos.
- Catálogo de objetos de valor, servicios y políticas.
- Puertos de entrada y salida con contratos conceptuales.
- Casos de uso de checkout y consulta de pedido.
- Especificación de 14 adaptadores y verificación de la cadena completa.
- Registro de decisiones, conflictos, limitaciones y trazabilidad.
- Primer vertical ejecutable `PI-01 RegisterBuyer` con Fastify, Argon2id, adaptador en memoria/PostgreSQL, migración, contrato OpenAPI de tres rutas, 29 pruebas y suite PostgreSQL automatizada.

**No incluye todavía**

- Autenticación, sesiones y autorización.
- Catálogo, inventario, direcciones, pedidos, pagos, facturación, logística, devoluciones, imágenes y frontend.
- `PI-02 RegisterSeller` (bloqueado por autenticación administrativa, `L-01` y contrato de ruta).
- SDKs, clientes, integraciones reales ni credenciales.
- CI/CD, ejecución de PostgreSQL en pipeline y observabilidad de release candidate.

---

## Primer vertical implementado

**`PI-01 RegisterBuyer`** permite registrar una cuenta de comprador y demuestra el estilo arquitectónico completo sin implementar el resto del marketplace.

| Elemento | Implementación |
|---|---|
| Alcance | `Usuario` ACTIVO, `PerfilComprador` HABILITADO, `Carrito` vacío, auditoría y outbox en la misma transacción |
| Endpoints | `POST /api/v1/buyers`, `/health`, `/ready` (`L-27` cerrada solo para estas rutas) |
| Persistencia | PostgreSQL autoritativo (`backend/migrations/001_initial.sql`) y adaptador en memoria para desarrollo/pruebas |
| Credenciales | Argon2id PHC `m=19456,t=2,p=1`, sal de 16 bytes (`DEC-W1-008`) |
| Contrato | [`backend/openapi.yaml`](backend/openapi.yaml) y `backend/tests/contract/openapi.test.ts` |
| Pruebas | `npm run typecheck`, `npm test` (5 archivos/29 pruebas), `npm run test:postgres` (2 pruebas) y `npm run build` aprobados; smoke HTTP real con `201`, `409`, `/health` y `/ready` |
| Evidencia y límites | [`docs/backend/implementation/01-acceptance-and-unblock.md`](docs/backend/implementation/01-acceptance-and-unblock.md) |

**Verificado:** `docker compose config`, PostgreSQL 17.11, migración `001_initial.sql`, alta `201`, duplicado `409`, concurrencia con un único ganador, rollback y auditoría/outbox atómicos. La prueba PostgreSQL está automatizada con `TEST_DATABASE_URL`, exige una base local terminada en `_test` y limpia solo sus propios registros. **Límite:** no se ejecuta en CI; autenticación, versionado general y rutas futuras siguen fuera del contrato. Las instrucciones están en [`backend/README.md`](backend/README.md).

---

## Alcance funcional

La especificación original define doce objetivos estratégicos (`OBJ-01`…`OBJ-12`), agrupados en las siguientes capacidades:

| Capacidad | Objetivos | Descripción |
|---|---|---|
| Identidad y usuarios | `OBJ-01` | Cuentas, roles, estado operativo y unicidad de correo/documento |
| Vendedores y compradores | `OBJ-02`, `OBJ-03` | Incorporación administrativa de vendedores y perfiles de comprador |
| Bodegas | `OBJ-04` | Bodegas del marketplace y de vendedores |
| Catálogo | `OBJ-05` | Productos físicos/digitales, variantes, categorías y publicación |
| Inventario | `OBJ-06` | Existencias por producto/bodega, reservas y movimientos |
| Carrito | `OBJ-07` | Selección provisional de productos y cantidades |
| Pedidos | `OBJ-08` | Ciclo de vida comercial completo y snapshots inmutables |
| Facturación | `OBJ-09` | Emisión y corrección de facturas |
| Logística | `OBJ-10` | Preparación, despacho, transporte y entrega |
| Posventa | `OBJ-11` | Devoluciones y reembolsos como procesos separados |
| Reportes | `OBJ-12` | Consultas administrativas y auditoría |

### Participantes

| Participante | Función |
|---|---|
| **Comprador** | Adquiere productos publicados y gestiona sus propios pedidos |
| **Vendedor** | Registra y administra sus productos e inventario autorizado |
| **Operador logístico** | Ejecuta la operación física de bodegas y despachos |
| **Administrador** | Incorpora vendedores, administra bodegas y supervisa la operación |
| **Supervisor** | Perfil de consulta y seguimiento operativo |

### Reglas de negocio transversales

- Toda operación requiere un usuario autenticado y autorizado (`RG-01`).
- Cada usuario tiene un único rol (`RG-02`) y no puede administrar información fuera de su ámbito (`RG-03`).
- El correo electrónico y el documento de identidad son únicos.
- No se permite inventario negativo ni reservar existencias inexistentes o dañadas.
- Los estados del pedido solo cambian mediante transiciones válidas.
- Un pedido `ENTREGADO` o `CERRADO` no se modifica retroactivamente.
- Devoluciones y reembolsos son procesos propios, no ediciones del pedido.
- La autorización considera **rol y alcance sobre el recurso**, no solo el rol.

---

## Stack tecnológico

| Área | Tecnología / decisión | Estado |
|---|---|---|
| Lenguaje | TypeScript 5.9 con `strict: true` | Implementado |
| Runtime | Node.js 24 LTS (`>=24 <25`) | Implementado |
| API | REST | Implementado para `PI-01` |
| Framework HTTP | Fastify 5 | Implementado |
| Contrato de API | OpenAPI 3.1 de `POST /api/v1/buyers`, `/health` y `/ready` | Cerrado para tres rutas; contract test sin validador semántico |
| Persistencia relacional | PostgreSQL + `pg` con SQL directo (sin ORM en `PI-01`) | Implementado y verificado con PostgreSQL 17.11 local y suite automatizada |
| Persistencia documental | MongoDB (auditoría y documentos justificados) | No usada en `PI-01`; decisión futura |
| Arquitectura | DDD + Hexagonal (Ports & Adapters) | Implementada en el vertical |
| Estilo | Monolito modular | Implementado en el vertical |
| Contenedores | Docker + Docker Compose | `compose.yaml` validado; PostgreSQL 17.11 levantado |
| Pruebas | Vitest 5 | Implementado; 29 pruebas + 2 PostgreSQL |
| Validación de entrada | Zod 4 en el borde HTTP | Implementado |
| Hash de credenciales | `@node-rs/argon2` 2.2.2 | Implementado y probado |

> MySQL y Go aparecen únicamente en documentación histórica y **no forman parte del stack vigente**.

---

## Arquitectura

### Vista de capas

```mermaid
flowchart TB
    A["Clientes / actores"] --> B["Adaptador de entrada HTTP<br/>rutas · middleware · DTOs"]
    B --> C["Puertos de entrada<br/>PI-01…PI-25"]
    C --> D["Capa de aplicación<br/>casos de uso · autorización · transacciones"]
    D --> E["Dominio<br/>entidades · VOs · agregados · políticas"]
    D --> F["Puertos de salida<br/>PO-01…PO-24"]
    F --> G["Adaptadores de salida"]
    G --> H[("PostgreSQL<br/>datos transaccionales")]
    G --> I[("MongoDB<br/>auditoría documental")]
    G --> J["Proveedores externos<br/>pago · logística · notificaciones · entrega digital"]
```

### Principios no negociables

1. El dominio no importa Node.js, frameworks HTTP, drivers SQL/MongoDB ni SDKs externos.
2. Los casos de uso no ejecutan consultas SQL ni acceden directamente a colecciones.
3. Los adaptadores implementan puertos definidos por sus consumidores.
4. La autorización verifica identidad, rol, permiso, alcance del recurso y estado de la cuenta.
5. SQL y MongoDB no son dos fuentes de verdad para la misma entidad operativa.
6. Los cambios de estado se realizan mediante comportamientos y transiciones del dominio.
7. La infraestructura no sustituye las reglas del dominio.
8. No se crean paquetes vacíos, interfaces especulativas ni microservicios por anticipación.

### Módulos previstos

| Módulo | Responsabilidad |
|---|---|
| `identity` | Usuario, rol, estado de cuenta e identidad operativa |
| `buyers` | Perfil de comprador, direcciones y estado comercial |
| `sellers` | Incorporación administrativa y perfil del vendedor |
| `warehouses` | Datos y clasificación de bodegas |
| `catalog` | Productos, variantes, categorías y publicación |
| `inventory` | Existencias, reservas y movimientos |
| `cart` | Selección provisional y líneas |
| `orders` | Pedido y ciclo de vida comercial |
| `payments` | Registro y coordinación del pago |
| `billing` | Facturas y datos fiscales |
| `shipping` | Preparación, despacho, transporte y entrega |
| `returns` | Solicitudes y resolución de devoluciones |
| `refunds` | Autorización y seguimiento de reembolsos |
| `reporting` | Consultas e indicadores de lectura |

### Persistencia y consistencia

- **PostgreSQL** es la fuente principal de verdad transaccional: relaciones, restricciones e invariantes.
- **MongoDB** se reserva para auditoría y documentos cuyo esquema lo justifique; no duplica pedidos, inventario o pagos sin estrategia explícita.
- Una transacción SQL **no** cubre MongoDB ni proveedores externos; los flujos que cruzan fronteras usan idempotencia, estados intermedios, compensación y, cuando aplica, **Transactional Outbox**.
- Las restricciones de unicidad y las operaciones de inventario se protegen también en base de datos; una comprobación previa en código no basta ante concurrencia.

---

## Modelo de dominio

El modelo vigente es la **versión 2.0** y constituye la línea base del negocio. Se organiza en contextos delimitados que son límites de lenguaje y consistencia, **no microservicios**.

### Contextos delimitados

| Contexto | Responsabilidad | Persistencia propuesta |
|---|---|---|
| Identidad y acceso | Cuenta, unicidad, estado y rol | SQL |
| Compradores | Perfil, estado comercial y direcciones | SQL |
| Vendedores | Incorporación, datos comerciales y titularidad | SQL |
| Catálogo | Productos, categorías, variantes, precios y publicación | SQL |
| Bodegas e inventario | Ubicaciones, cantidades, reservas y movimientos | SQL transaccional |
| Compra | Carrito, checkout, snapshots y pedido | SQL |
| Pagos | Intentos, confirmación, captura y referencia externa | SQL + evidencia del proveedor |
| Facturación | Emisión, numeración y datos fiscales | SQL + archivo si aplica |
| Logística | Preparación, paquetes, tracking y entrega | SQL |
| Posventa | Devoluciones, resolución y reembolsos | SQL |
| Auditoría y consulta | Registro inmutable y proyecciones de lectura | MongoDB + SQL transaccional |

### Agregados principales

| Agregado | Raíz | Invariantes principales |
|---|---|---|
| Cuenta de usuario | `Usuario` | Correo/documento únicos, rol único, transición válida |
| Perfil comprador | `PerfilComprador` | Estado comercial y propiedad del perfil |
| Perfil vendedor | `PerfilVendedor` | Incorporación administrativa, estado y propiedad |
| Producto | `Producto` | SKU único, variante válida, publicación válida |
| Inventario | `Inventario` | Cantidades no negativas, reserva única, consumo/liberación única |
| Carrito | `Carrito` | Un carrito activo por comprador, cantidades válidas |
| Pedido | `Pedido` | Total consistente, transición válida, snapshots inmutables |
| Pago | `Pago` | Idempotencia, resultado verificable, límites de captura/reembolso |
| Factura | `Factura` | Numeración única, documento emitido inmutable |
| Envío | `Envio` | Cantidades asignadas válidas, transición logística válida |
| Devolución | `Devolucion` | Propiedad del pedido, elegibilidad y límites |
| Reembolso | `Reembolso` | Importe reembolsable, autorización e idempotencia |
| Auditoría | `RegistroAuditoria` | Append-only, integridad y ausencia de secretos |

### Ciclo de vida del pedido

```text
PENDIENTE_DE_PAGO → PAGADO → EN_PREPARACION → DESPACHADO → ENTREGADO → CERRADO
        │
        └── pago rechazado / cancelación autorizada → CANCELADO

Productos digitales: PAGADO → ENTREGADO
```

`CARRITO` **no** es un estado del pedido: carrito y pedido son conceptos distintos. `FINALIZADO` se normaliza como `CERRADO`, posterior a la entrega y al cierre operativo.

### Servicios y políticas de dominio

| ID | Nombre | Tipo | Responsabilidad |
|---|---|---|---|
| `DS-01` | `PoliticaAutorizacionDominio` | Política | Evaluar rol, propiedad, alcance y estado del recurso |
| `DS-02` | `PoliticaPublicacionCatalogo` | Política | Validar producto, vendedor, variantes y precio antes de publicar |
| `DS-03` | `ServicioReservaInventario` | Servicio con efecto | Validar disponibilidad; reservar, liberar, consumir o expirar |
| `DS-04` | `ServicioAsignacionBodega` | Servicio de lectura | Seleccionar bodegas elegibles por disponibilidad y compatibilidad |
| `DS-05` | `ServicioCalculoPedido` | Servicio puro | Calcular subtotal, descuentos, impuestos, envío y total |
| `DS-06` | `PoliticaTransicionPedido` | Política | Verificar transiciones y precondiciones de cumplimiento |
| `DS-07` | `PoliticaElegibilidadDevolucion` | Política | Evaluar plazo, propiedad, entrega, cantidades y condiciones |
| `DS-08` | `PoliticaReembolso` | Política | Verificar saldo reembolsable, aprobación y límites por pago |
| `DS-09` | `ServicioAuditoria` | Servicio | Construir eventos normalizados, con correlación y sin secretos |

Cada servicio dispone de una definición individual autocontenida en [`BackendSDD/Domain/services/`](BackendSDD/Domain/services), con reglas, invariantes, escenarios y trazabilidad.

### Objetos de valor destacados

- Identificadores tipados (`UsuarioId`, `ProductoId`, `PedidoId`, …) que envuelven un valor opaco.
- `CorreoElectronico`, `DocumentoIdentidad`, `NombreCompleto`.
- `Dinero` con moneda explícita, aritmética exacta y redondeo reproducible por política.
- `Direccion`, `DireccionSnapshot`, `TipoEntrega`.
- Catálogos de estado (`EstadoPedido`, `EstadoPago`, `EstadoEnvio`, `EstadoDevolucion`, `EstadoReembolso`).
- `IdempotencyKey`, `CorrelationId`, `Instant`, `AuditPayload`.

---

## Capa de aplicación

### Casos de uso documentados

| ID | Caso de uso | Objetivo | Puertos de salida principales |
|---|---|---|---|
| `UC-01` | **Checkout** | Confirmar la compra, calcular totales, crear pedidos por vendedor, reservar inventario e iniciar el pago | `PO-02`, `PO-05`…`PO-09`, `PO-15`, `PO-16`, `PO-18`…`PO-21`, `PO-23` |
| `UC-02` | **QueryOrder** | Consultar pedidos en modo detalle o lista según el alcance autorizado | `PO-08`…`PO-13` |

Ambos comparten contexto de autorización, errores, idempotencia y trazabilidad. `UC-01` **no captura el pago**: inicia la interacción y deja la captura fuera del checkout (`D-18`). `UC-02` usa los repositorios operativos, no la consulta de reportes (`D-19`).

### Puertos de entrada (`PI-01`…`PI-25`)

<details>
<summary><strong>Ver catálogo completo de puertos de entrada</strong></summary>

| ID | Puerto | Módulo | Propósito |
|---|---|---|---|
| `PI-01` | `RegisterBuyer` | `buyers` | Registrar comprador, perfil y carrito inicial |
| `PI-02` | `RegisterSeller` | `sellers` | Incorporar vendedor y primera bodega |
| `PI-03` | `ManageOwnProfile` | `identity` | Consultar y actualizar el perfil propio |
| `PI-04` | `ManageUser` | `identity` | Activar, desactivar, bloquear o desbloquear cuentas |
| `PI-05` | `CreateProduct` | `catalog` | Crear producto y variantes no publicadas |
| `PI-06` | `ManageProductPublication` | `catalog` | Publicar, suspender, reanudar o descontinuar |
| `PI-07` | `QueryCatalog` | `catalog` | Consultar catálogo público o administrativo |
| `PI-08` | `ManageWarehouse` | `warehouses` | Crear, actualizar o desactivar bodegas |
| `PI-09` | `AdjustInventory` | `inventory` | Registrar ingreso, ajuste o baja de existencias |
| `PI-10` | `QueryInventory` | `inventory` | Consultar posiciones de inventario |
| `PI-11` | `ManageCart` | `cart` | Agregar, modificar, quitar y consultar el carrito |
| `PI-12` | `Checkout` | `orders` | Confirmar la compra y crear pedidos/pago |
| `PI-13` | `QueryOrder` | `orders` | Consultar pedidos según alcance autorizado |
| `PI-14` | `CancelOrder` | `orders` | Cancelar antes de confirmar el pago |
| `PI-15` | `ConfirmPayment` | `payments` | Registrar el resultado verificado de un pago |
| `PI-16` | `PrepareShipment` | `shipping` | Asignar bodega y preparar el envío |
| `PI-17` | `DispatchOrder` | `shipping` | Despachar, consumir reservas y registrar salida |
| `PI-18` | `ConfirmDelivery` | `shipping` | Registrar entrega o fallo de entrega |
| `PI-19` | `IssueInvoice` | `billing` | Emitir la factura de un pedido pagado |
| `PI-20` | `CorrectInvoice` | `billing` | Anular o corregir una factura emitida |
| `PI-21` | `RequestReturn` | `returns` | Solicitar una devolución elegible |
| `PI-22` | `ResolveReturn` | `returns` | Revisar, aprobar, rechazar, recibir y resolver |
| `PI-23` | `ProcessRefund` | `refunds` | Solicitar, aprobar y ejecutar un reembolso |
| `PI-24` | `GenerateAdministrativeReport` | `reporting` | Generar reportes administrativos autorizados |
| `PI-25` | `QueryAuditLog` | `reporting` | Consultar registros de auditoría autorizados |

</details>

### Puertos de salida (`PO-01`…`PO-24`)

<details>
<summary><strong>Ver catálogo completo de puertos de salida</strong></summary>

| ID | Puerto | Módulo | Responsabilidad |
|---|---|---|---|
| `PO-01` | `UserRepository` | `identity` | Persistencia y recuperación de `Usuario` |
| `PO-02` | `BuyerRepository` | `buyers` | Persistencia y recuperación de `PerfilComprador` |
| `PO-03` | `SellerRepository` | `sellers` | Persistencia y recuperación de `PerfilVendedor` |
| `PO-04` | `WarehouseRepository` | `warehouses` | Persistencia y recuperación de `Bodega` |
| `PO-05` | `ProductRepository` | `catalog` | Persistencia y recuperación de `Producto`/`Variante` |
| `PO-06` | `InventoryRepository` | `inventory` | Posiciones, reservas y movimientos con atomicidad |
| `PO-07` | `CartRepository` | `cart` | Persistencia y recuperación de `Carrito` |
| `PO-08` | `OrderRepository` | `orders` | Persistencia y recuperación de `Pedido` |
| `PO-09` | `PaymentRepository` | `payments` | Persistencia y recuperación de `Pago` |
| `PO-10` | `InvoiceRepository` | `billing` | Persistencia y recuperación de `Factura` |
| `PO-11` | `ShipmentRepository` | `shipping` | Persistencia y recuperación de `Envio` |
| `PO-12` | `ReturnRepository` | `returns` | Persistencia y recuperación de `Devolucion` |
| `PO-13` | `RefundRepository` | `refunds` | Persistencia y recuperación de `Reembolso` |
| `PO-14` | `AuditLogRepository` | `reporting` | Append y consulta de `RegistroAuditoria` |
| `PO-15` | `TransactionManager` | `shared` | Unidad de trabajo y límite transaccional |
| `PO-16` | `PaymentGateway` | `payments` | Iniciar, confirmar, cancelar y reembolsar pagos |
| `PO-17` | `ShippingProvider` | `shipping` | Asignar transporte, tracking y eventos |
| `PO-18` | `NotificationSender` | `shared` | Enviar notificaciones a actores |
| `PO-19` | `DigitalDeliveryProvider` | `shared` | Provisionar o revocar entrega digital |
| `PO-20` | `Clock` | `shared` | Obtener el instante UTC |
| `PO-21` | `IdGenerator` | `shared` | Generar identificadores tipados |
| `PO-22` | `PasswordHasher` | `identity` | Producir `HashCredencial` |
| `PO-23` | `DomainEventOutbox` | `shared` | Registrar eventos en la misma transacción |
| `PO-24` | `ReportingQuery` | `reporting` | Consultas de lectura consolidadas |

</details>

---

## Adaptadores

La especificación documenta **un adaptador de entrada HTTP** y **trece adaptadores de salida**. Los repositorios SQL se agrupan por familia de contexto para evitar duplicar reglas de traducción, errores y transacciones; cada puerto conserva su implementación separada y **no se crea un repositorio universal**.

| ID | Adaptador | Tipo | Puertos |
|---|---|---|---|
| `ADIN-01` | Entrada HTTP | Entrada | Invoca `PI-01`…`PI-25` |
| `ADOUT-01` | Repositorios SQL de identidad y perfiles | Salida / persistencia | `PO-01`…`PO-04` |
| `ADOUT-02` | Repositorios SQL de catálogo, inventario y carrito | Salida / persistencia | `PO-05`…`PO-07` |
| `ADOUT-03` | Repositorios SQL del ciclo de pedido | Salida / persistencia | `PO-08`…`PO-13` |
| `ADOUT-04` | Unidad de trabajo y outbox SQL | Salida / transacción y eventos | `PO-15`, `PO-23` |
| `ADOUT-05` | Repositorio MongoDB de auditoría | Salida / persistencia documental | `PO-14` |
| `ADOUT-06` | Consultas SQL de reportes | Salida / lectura | `PO-24` |
| `ADOUT-07` | Pasarela de pagos | Salida / integración externa | `PO-16` |
| `ADOUT-08` | Proveedor logístico | Salida / integración externa | `PO-17` |
| `ADOUT-09` | Envío de notificaciones | Salida / integración externa | `PO-18` |
| `ADOUT-10` | Entrega digital | Salida / integración externa | `PO-19` |
| `ADOUT-11` | Reloj del sistema | Salida / capacidad técnica | `PO-20` |
| `ADOUT-12` | Generador de identificadores | Salida / capacidad técnica | `PO-21` |
| `ADOUT-13` | Hashing de credenciales | Salida / capacidad técnica | `PO-22` |

Regla de alineación (`D-27`): los adaptadores usan **exactamente** los códigos de error y estados normalizados declarados por su puerto. Cualquier código o estado adicional se considera una desalineación documental.

---

## Contratos e integración

El documento de *Contract Alignment* verifica la cadena completa:

```text
Requisito → regla → entidad/VO/servicio → caso de uso → puerto de entrada
          → puertos de salida → adaptador → contrato externo/persistencia
```

<details>
<summary><strong>Ver inventario de contratos CT-01…CT-13</strong></summary>

| ID | Contrato | Adaptador | Estado | Bloqueo principal |
|---|---|---|---|---|
| `CT-01` | HTTP/OpenAPI | `ADIN-01` | `PARCIAL` (tres rutas implementadas) | `L-27` cerrada solo para `POST /api/v1/buyers`, `/health` y `/ready`; auth y rutas futuras abiertas |
| `CT-02` | Eventos de dominio y outbox | `ADOUT-04` | `ALINEADO_CON_PROPUESTA` | `L-14`: catálogo y payloads incompletos |
| `CT-03` | Auditoría | `ADOUT-05` | `ALINEADO_CON_PROPUESTA` | `L-11`, `L-15`: composición y retención |
| `CT-04` | Pago | `ADOUT-07` | `ALINEADO_CON_PROPUESTA` (diferido; sin pagos en `PI-01`) | `L-22`: protocolo y webhooks |
| `CT-05` | Logística | `ADOUT-08` | `ALINEADO_CON_PROPUESTA` | `L-23`: proveedor, tracking y evidencia |
| `CT-06` | Notificaciones | `ADOUT-09` | `ALINEADO_CON_PROPUESTA` | `L-24`: canales y consentimiento |
| `CT-07` | Entrega digital | `ADOUT-10` | `ALINEADO_CON_PROPUESTA` | `L-18`: acceso, licencia y evidencia |
| `CT-08` | Credenciales | `ADOUT-13` | `ALINEADO_CON_PROPUESTA`; política decidida (`DEC-W1-008`) | Contrato ejecutable en W3; biblioteca en W4 |
| `CT-09` | Identificadores | `ADOUT-12` | `ALINEADO_CON_PROPUESTA` | `L-13`: formato físico y unicidad |
| `CT-10` | Facturación | `ADOUT-03` | `ALINEADO_CON_PROPUESTA` | `L-17`: numeración, serie y jurisdicción |
| `CT-11` | Reportes | `ADOUT-06` | `ALINEADO_CON_PROPUESTA` | `L-19`: catálogo, filtros y límites |
| `CT-12` | Persistencia SQL/MongoDB | `ADOUT-01`…`ADOUT-06` | `ALINEADO_CON_PROPUESTA` | Esquemas, índices y migraciones no definidos |
| `CT-13` | Tiempo del sistema | `ADOUT-11` | `ALINEADO` | Sin bloqueo de contrato |

</details>

**Lectura:** la cadena de dominio, puertos y adaptadores está alineada; lo pendiente es el contrato ejecutable o el protocolo concreto de cada proveedor. Ningún flujo se marca `ALINEADO` mientras dependa de una decisión externa abierta.

### Flujos verificados

`F-01` Registro · `F-02` Publicación de catálogo · `F-03` Reserva/liberación de inventario · `F-04` Checkout · `F-05` Confirmación de pago · `F-06` Despacho · `F-07` Entrega física/digital · `F-08` Devolución y reembolso · `F-09` Consulta de pedido · `F-10` Auditoría · `F-11` Reportes · `F-12` Notificaciones · `F-13` Entrega digital.

---

## Estructura del repositorio

```text
Programacion-Web-2-2026/
├── BackendSDD/                              # Documentación fuente
│   ├── enunciado.md                        # Especificación funcional del negocio
│   ├── Prompt-maestro-documentacion.md     # Gobierno y criterios documentales
│   ├── DOCUMENTATION_STATUS.md             # Registro de continuidad, decisiones y límites
│   ├── Software Architecture/
│   │   └── nexusmarket-arquitectura.md     # Arquitectura DDD + hexagonal + Docker
│   ├── Domain/
│   │   ├── nexusmarket-domain-model.md     # Modelo de dominio v2.0
│   │   ├── nexusmarket-domain-object-values.md
│   │   ├── nexusmarket-domain-services.md
│   │   └── services/                       # DS-01…DS-09 (un archivo por servicio)
│   ├── Application/
│   │   ├── nexusmarket-input-ports.md      # PI-01…PI-25
│   │   ├── nexusmarket-output-ports.md     # PO-01…PO-24
│   │   └── nexusmarket-use-cases-checkout-query-order.md
│   ├── Adapters/
│   │   ├── nexusmarket-adapters.md         # Catálogo de adaptadores
│   │   └── nexusmarket-adapter-*.md        # 14 documentos individuales
│   └── Contracts/
│       └── nexusmarket-contract-alignment.md
├── backend/                                # Primer vertical ejecutable
│   ├── src/                                # Dominio, aplicación, adaptadores y bootstrap
│   ├── tests/                              # Unitarias e integración HTTP
│   ├── migrations/001_initial.sql          # Esquema PostgreSQL
│   ├── openapi.yaml                        # Contrato de las tres rutas de PI-01
│   ├── compose.yaml                        # PostgreSQL local validado
│   └── README.md                           # Instalación, ejecución y límites
├── docs/backend/                           # Auditoría, decisiones y estado de implementación
├── orchestrator-state.md                   # Estado operativo
├── README.md
├── LICENSE
└── .gitignore
```

> La carpeta `BackendSDD/` es la **raíz documental vigente**. La antigua carpeta `SDD/` solo existe en el historial de Git y no debe reintroducirse.

---

## Documentación

| Documento | Contenido |
|---|---|
| [Especificación funcional](BackendSDD/enunciado.md) | Objetivos, dominios, participantes, reglas y restricciones del negocio |
| [Backend ejecutable](backend/README.md) | Instalación, ejecución, pruebas, PostgreSQL y límites del primer vertical |
| [Aceptación y desbloqueo de PI-01](docs/backend/implementation/01-acceptance-and-unblock.md) | Auditoría, decisiones `DEC-IMPL-*`, evidencia, gates y cierre acotado de `L-27` |
| [Reconciliación de fuentes operativas](docs/backend/implementation/02-operational-source-reconciliation.md) | Contradicciones del prompt, fuentes reales y correcciones sin editar las fuentes originales |
| [Evaluación de PI-02](docs/backend/implementation/03-pi02-evaluation.md) | Requisitos, bloqueos, opciones y preguntas para `RegisterSeller` |
| [Arquitectura](BackendSDD/Software%20Architecture/nexusmarket-arquitectura.md) | Capas, módulos, persistencia, Docker, seguridad, pruebas y flujos transaccionales |
| [Modelo de dominio](BackendSDD/Domain/nexusmarket-domain-model.md) | Contextos, agregados, entidades, invariantes, estados, eventos y escenarios |
| [Objetos de valor](BackendSDD/Domain/nexusmarket-domain-object-values.md) | Catálogo canónico de VOs, familias, validación e invariantes |
| [Servicios de dominio](BackendSDD/Domain/nexusmarket-domain-services.md) | Catálogo de `DS-01`…`DS-09`, interacciones y matrices de reglas |
| [Definiciones de servicios](BackendSDD/Domain/services) | Nueve documentos autocontenidos con plantilla de diecisiete secciones |
| [Puertos de entrada](BackendSDD/Application/nexusmarket-input-ports.md) | 25 capacidades de entrada, descartes y trazabilidad `OBJ → PI` |
| [Puertos de salida](BackendSDD/Application/nexusmarket-output-ports.md) | 24 capacidades de salida, consumidores y criterios de atomicidad |
| [Casos de uso](BackendSDD/Application/nexusmarket-use-cases-checkout-query-order.md) | `UC-01 Checkout` y `UC-02 QueryOrder` |
| [Catálogo de adaptadores](BackendSDD/Adapters/nexusmarket-adapters.md) | Inventario, agrupaciones, relaciones puerto → adaptador y bloqueos |
| [Alineación de contratos](BackendSDD/Contracts/nexusmarket-contract-alignment.md) | Verificación de la cadena completa y estado de `CT-01`…`CT-13` |
| [Estado documental](BackendSDD/DOCUMENTATION_STATUS.md) | Fuentes, decisiones, conflictos, limitaciones, trazabilidad y relevo |
| [Prompt maestro](BackendSDD/Prompt-maestro-documentacion.md) | Gobierno documental, reglas de calidad y método de trabajo |

### Adaptadores individuales

<details>
<summary><strong>Ver los 14 documentos de adaptadores</strong></summary>

- [`ADIN-01` Adaptador de entrada HTTP](BackendSDD/Adapters/nexusmarket-adapter-http-input.md)
- [`ADOUT-01` Repositorios SQL de identidad y perfiles](BackendSDD/Adapters/nexusmarket-adapter-sql-identity-profiles.md)
- [`ADOUT-02` Repositorios SQL de catálogo, inventario y carrito](BackendSDD/Adapters/nexusmarket-adapter-sql-catalog-inventory-cart.md)
- [`ADOUT-03` Repositorios SQL del ciclo de pedido](BackendSDD/Adapters/nexusmarket-adapter-sql-order-lifecycle.md)
- [`ADOUT-04` Unidad de trabajo y outbox SQL](BackendSDD/Adapters/nexusmarket-adapter-sql-unit-of-work-outbox.md)
- [`ADOUT-05` Repositorio MongoDB de auditoría](BackendSDD/Adapters/nexusmarket-adapter-mongodb-audit.md)
- [`ADOUT-06` Consultas SQL de reportes](BackendSDD/Adapters/nexusmarket-adapter-sql-reporting-query.md)
- [`ADOUT-07` Pasarela de pagos](BackendSDD/Adapters/nexusmarket-adapter-payment-gateway.md)
- [`ADOUT-08` Proveedor logístico](BackendSDD/Adapters/nexusmarket-adapter-shipping-provider.md)
- [`ADOUT-09` Envío de notificaciones](BackendSDD/Adapters/nexusmarket-adapter-notification-sender.md)
- [`ADOUT-10` Entrega digital](BackendSDD/Adapters/nexusmarket-adapter-digital-delivery.md)
- [`ADOUT-11` Reloj del sistema](BackendSDD/Adapters/nexusmarket-adapter-system-clock.md)
- [`ADOUT-12` Generador de identificadores](BackendSDD/Adapters/nexusmarket-adapter-id-generator.md)
- [`ADOUT-13` Hashing de credenciales](BackendSDD/Adapters/nexusmarket-adapter-password-hasher.md)

</details>

---

## Cómo empezar

Para clonar el repositorio:

```bash
git clone https://github.com/SamuuVA/Programacion-Web-2-2026.git
cd Programacion-Web-2-2026
```

Para ejecutar y probar el primer vertical:

```powershell
cd backend
npm install
Copy-Item .env.example .env
$env:PERSISTENCE = "memory"
npm run dev
```

Verificación:

```powershell
npm run typecheck
npm test
npm run build

$env:TEST_DATABASE_URL = "postgresql://nexusmarket:nexusmarket@127.0.0.1:5432/nexusmarket_test"
npm run test:postgres
```

El detalle del endpoint, PostgreSQL y los límites está en [`backend/README.md`](backend/README.md). PostgreSQL 17.11 se levantó con Compose y la suite automatizada exige una base local cuyo nombre termine en `_test`; si no está disponible, el comando falla y el gate queda `BLOCKED`.

### Ruta de lectura recomendada

1. Lee la [especificación funcional](BackendSDD/enunciado.md) para entender el negocio.
2. Revisa la [arquitectura](BackendSDD/Software%20Architecture/nexusmarket-arquitectura.md) para conocer las capas y restricciones.
3. Estudia el [modelo de dominio](BackendSDD/Domain/nexusmarket-domain-model.md) y sus [objetos de valor](BackendSDD/Domain/nexusmarket-domain-object-values.md).
4. Consulta los [servicios y políticas](BackendSDD/Domain/nexusmarket-domain-services.md).
5. Sigue los [puertos de entrada](BackendSDD/Application/nexusmarket-input-ports.md) y [salida](BackendSDD/Application/nexusmarket-output-ports.md).
6. Lee los [casos de uso](BackendSDD/Application/nexusmarket-use-cases-checkout-query-order.md).
7. Revisa los [adaptadores](BackendSDD/Adapters/nexusmarket-adapters.md).
8. Cierra con la [alineación de contratos](BackendSDD/Contracts/nexusmarket-contract-alignment.md) y el [estado documental](BackendSDD/DOCUMENTATION_STATUS.md).
9. Para el corte implementado, lee el [informe de aceptación](docs/backend/implementation/01-acceptance-and-unblock.md) y `orchestrator-state.md`.

> Si vas a retomar el trabajo, **empieza por `orchestrator-state.md`** y por el [informe de aceptación](docs/backend/implementation/01-acceptance-and-unblock.md): contienen el estado real, la evidencia ejecutada, los bloqueos y la siguiente acción exacta.

---

## Convenciones de identificadores

| Prefijo | Significado | Ejemplo |
|---|---|---|
| `OBJ-` | Objetivo funcional del negocio | `OBJ-08` |
| `RG-` | Restricción general | `RG-01` |
| `INV-`, `ORD-`, `RET-`, `REF-`, `AUD-` | Reglas de inventario, pedido, devolución, reembolso y auditoría | `INV-05` |
| `UC-` | Caso de uso | `UC-01` |
| `DS-` | Servicio o política de dominio | `DS-03` |
| `PI-` | Puerto de entrada | `PI-12` |
| `PO-` | Puerto de salida | `PO-16` |
| `ADIN-` / `ADOUT-` | Adaptador de entrada / salida | `ADIN-01`, `ADOUT-07` |
| `CT-` | Contrato verificado | `CT-04` |
| `DEC-BIZ-` | Decisión de negocio pendiente de aprobación | `DEC-BIZ-05` |
| `D-` | Decisión de diseño adoptada por el equipo documental | `D-27` |
| `L-` | Limitación real detectada | `L-27` |
| `C-` | Conflicto entre fuentes | `C-21` |
| `F-` | Flujo verificado en Contract Alignment | `F-04` |

---

## Hoja de ruta

| Fase | Entregable | Estado |
|---|---|---|
| **0. Especificación** | Modelo, VOs, servicios, puertos, casos de uso, adaptadores y contratos | Completada |
| **1. Decisiones de negocio** | Resolver `DEC-BIZ-01`…`DEC-BIZ-07` y las limitaciones bloqueantes | Parcial: `CON-001`…`CON-004`, `DEC-W1-007`/`008` y `DEC-IMPL-001`…`009` cerrados; restan `DEC-BIZ-01`, `03`…`07`, `L-01`, `L-22` y `L-10`. `L-27` está acotada a tres rutas; auth/versionado general siguen abiertos |
| **2. Contratos ejecutables** | OpenAPI, esquemas de eventos, contratos de proveedor y migraciones | Parcial: contrato de tres rutas con contract test y migración de `PI-01`; sin validador semántico ni CI |
| **3. Implementación vertical** | Primer módulo completo: dominio + caso de uso + puerto + adaptador + pruebas | **`PI-01` implementado y verificado en memoria y PostgreSQL 17.11**, con suite PostgreSQL automatizada y revisión independiente `PASS` |
| **4. Integraciones** | Pago, logística, notificaciones y entrega digital con idempotencia | Pendiente |
| **5. Calidad y despliegue** | CI, Docker multi-stage, observabilidad, backups y seguridad | Pendiente |

La implementación debe comenzar por un **flujo vertical pequeño y verificable**, no creando todas las carpetas vacías. El orden recomendado está en la [arquitectura §17](BackendSDD/Software%20Architecture/nexusmarket-arquitectura.md#17-orden-recomendado-de-implementación).

---

## Decisiones y limitaciones

Antes de implementar las políticas variables, el negocio debe aprobar las que siguen abiertas; se incluye `DEC-BIZ-02` como referencia de cierre:

| ID | Decisión requerida |
|---|---|
| `DEC-BIZ-01` | Campos y formato exacto de `Direccion` |
| `DEC-BIZ-02` | **Resuelta (`DEC-W1-002`)**: plazo configurable con 30 días como valor inicial |
| `DEC-BIZ-03` | Catálogo de motivos de devolución y reembolso |
| `DEC-BIZ-04` | Política de selección cuando hay varias bodegas elegibles |
| `DEC-BIZ-05` | Moneda, escala decimal y regla de redondeo |
| `DEC-BIZ-06` | Proceso y actor que cambian `EstadoComercial` |
| `DEC-BIZ-07` | Atribución de la aprobación financiera |

Las limitaciones que bloquean contratos ejecutables están registradas en [`DOCUMENTATION_STATUS.md` §7](BackendSDD/DOCUMENTATION_STATUS.md#7-limitaciones-reales-detectadas-no-convertidas-en-requisitos). Las principales:

- `L-27` — contrato HTTP/OpenAPI, autenticación, versionado y límites de tasa. **Acotada:** cerrada solo para `POST /api/v1/buyers`, `/health` y `/ready`; el resto sigue abierto.
- `L-22` — protocolo del proveedor de pago, autorización/captura y webhooks.
- `L-23` — integración logística, tracking y evidencia de entrega.
- `L-24` — canales, plantillas y consentimiento de notificaciones.
- `L-17` — numeración, serie fiscal y corrección de facturas.
- `L-18` — mecanismo de entrega digital y licencias.
- `L-13` — formato físico de los identificadores.
- `L-19` — catálogo de reportes, filtros y paginación.
- `L-26` — asignación de operador logístico a pedidos o envíos.
- `L-11`, `L-14`, `L-15` — composición de payloads, catálogo de eventos y gravedad de auditoría.

> Estas limitaciones **no se convierten en requisitos por conveniencia**. Se registran con alternativas, impacto y recomendación para que la persona responsable decida. `L-06`, `L-12`, `L-16` y `L-20` quedaron cerradas por `DEC-W1-002`, `DEC-W1-008` y `DEC-W1-007`; las decisiones están en [`docs/backend/w1/03-decisions.md`](docs/backend/w1/03-decisions.md).

---

## Contribución

Mientras el repositorio permanezca en fase documental, se aplican estas reglas:

1. **Solo documentación Markdown.** No se introducen archivos `.ts`, `.js`, `.sql`, `.yaml`, `.json` ni código ejecutable.
2. **Una sola fuente de verdad por regla.** Las demás referencias apuntan por ruta, sección o identificador.
3. **No inventar reglas de negocio.** Los vacíos se resuelven con evidencia o se registran como decisión/limitación con identificador estable.
4. **Mantener la trazabilidad.** Todo cambio debe conservar la cadena requisito → dominio → servicio → caso de uso → puerto → adaptador → contrato.
5. **Actualizar el estado.** Cualquier cambio documental exige actualizar [`DOCUMENTATION_STATUS.md`](BackendSDD/DOCUMENTATION_STATUS.md) en la misma tanda.
6. **Respetar la jerarquía de fuentes.** Instrucción del usuario → requisitos aprobados → modelo/arquitectura → documentación especializada → inferencias.
7. **No reintroducir legado.** `SDD/`, los cinco servicios antiguos y las tecnologías Go/MySQL no son canónicos.
8. **No añadir códigos o estados no declarados por un puerto** (`D-27`).

---

## Licencia y autoría

Distribuido bajo licencia **MIT**. Consulta el archivo [`LICENSE`](LICENSE) para más detalles.

**Autor:** [SamuuVA](https://github.com/SamuuVA) · 2026

**Proyecto:** NexusMarket — Programación Web II (2026-2)

---

<div align="center">
  <sub>Documentación primero. Código después, sin inventar reglas.</sub>
</div>
