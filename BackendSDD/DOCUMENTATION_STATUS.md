# NEXUSMARKET — Estado de la documentación

**Propósito:** registro de continuidad para que cualquier agente pueda reanudar el trabajo documental sin reconstruir el contexto desde cero.

**Última actualización:** 26 de octubre de 2026.
**Raíz documental vigente:** `BackendSDD/`.
**Idioma:** español técnico; nombres canónicos de dominio en español y términos arquitectónicos asentados en inglés.
**Ejecución vigente (cerrada):** actualización integral de `README.md`, alineada con `BackendSDD/`; se mantiene cerrado Contract Alignment en `BackendSDD/Contracts/nexusmarket-contract-alignment.md`, que verificó la cadena requisito → regla → dominio → caso de uso → puerto de entrada → puertos de salida → adaptador → contrato externo/persistencia, sin crear contratos ejecutables.

**Ejecuciones anteriores cerradas:** documentación de los 14 adaptadores en `BackendSDD/Adapters/`; casos de uso `UC-01 Checkout` y `UC-02 QueryOrder` en `BackendSDD/Application/nexusmarket-use-cases-checkout-query-order.md`; catálogos de Input Ports y Output Ports en `BackendSDD/Application/nexusmarket-input-ports.md` y `BackendSDD/Application/nexusmarket-output-ports.md`; las definiciones individuales de los nueve Domain Services permanecen en `BackendSDD/Domain/services/<nombre-canónico>.md`.

---

## 1. Stack tecnológico objetivo

| Área | Tecnología oficial |
|---|---|
| Lenguaje | TypeScript |
| Runtime | Node.js |
| Persistencia relacional | PostgreSQL |
| Persistencia documental | MongoDB |
| Enfoque | DDD + Arquitectura Hexagonal (Ports & Adapters) |
| Estilo inicial | Monolito modular |

**Nota:** MySQL y Go no son tecnologías vigentes. Cualquier mención en fuentes antiguas se trata como contenido legado.

---

## 2. Fuentes de verdad detectadas

| Fuente | Ruta | Autoridad | Estado de lectura |
|---|---|---|---|
| Especificación funcional | `BackendSDD/enunciado.md` | Requisitos funcionales explícitos | Leída completa |
| Modelo de dominio (SDD) | `BackendSDD/Domain/nexusmarket-domain-model.md` | Línea base del dominio, versión 2.0 | Leída completa |
| Arquitectura | `BackendSDD/Software Architecture/nexusmarket-arquitectura.md` | Restricciones y responsabilidades arquitectónicas | Leída completa |
| Prompt maestro documental | `BackendSDD/Prompt-maestro-documentacion.md` | Procedimiento, estados y calidad documental | Leído completo |
| README del repositorio | `README.md` | Vista general del proyecto; actualizado a la estructura vigente `BackendSDD/` el 2026-10-26 | Leído completo |
| Versiones anteriores de documentos de dominio | `SDD/Domain/Domain Object Value.md` y `SDD/Domain/Domain  Servicies.md` (solo en historial Git) | Documentación previa, no vigente | Consultadas como fuente complementaria |

**Decisión de ubicación:** el repositorio migró de `SDD/` a `BackendSDD/`. Los archivos `SDD/...` aparecen eliminados en el árbol de trabajo y sus versiones antiguas solo son recuperables desde Git. Se adopta `BackendSDD/` como raíz documental vigente y no se resucitan los archivos antiguos. El estado se guarda en `BackendSDD/DOCUMENTATION_STATUS.md` porque el proyecto no tiene una carpeta `docs/documentation/` y `BackendSDD/` es la ubicación establecida de documentación.

---

## 3. Documentos existentes y función

| Documento | Ruta | Versión/estado | Función |
|---|---|---|---|
| README del repositorio | `README.md` | 1.0 / alineado | Vista general, estado, arquitectura, índices de documentación, convenciones y hoja de ruta. |
| Modelo de dominio | `BackendSDD/Domain/nexusmarket-domain-model.md` | 2.0 / línea base | Entidades, agregados, invariantes, estados, servicios candidatos y decisiones DD-01…DD-14. |
| Arquitectura | `BackendSDD/Software Architecture/nexusmarket-arquitectura.md` | 1.0 / propuesta | Capas, dependencias, módulos, persistencia y flujos transaccionales. |
| Especificación funcional | `BackendSDD/enunciado.md` | Transcripción del PDF | Objetivos, dominios funcionales y restricciones explícitas. |
| Prompt maestro | `BackendSDD/Prompt-maestro-documentacion.md` | 1.0 | Gobierno documental y criterios de calidad. |
| Objetos de valor | `BackendSDD/Domain/nexusmarket-domain-object-values.md` | 1.0 / completo | Catálogo canónico de VOs, invariantes y trazabilidad. |
| Servicios y políticas | `BackendSDD/Domain/nexusmarket-domain-services.md` | 1.0 / completo | Catálogo de nueve servicios/políticas con veinte puntos cada uno y equivalencias legadas. |
| Definiciones individuales de servicios | `BackendSDD/Domain/services/<nombre-canónico>.md` | 1.0 / completo | Nueve definiciones autocontenidas, una por servicio, con la plantilla de diecisiete secciones. |
| Input Ports | `BackendSDD/Application/nexusmarket-input-ports.md` | 1.0 / completo | Catálogo de 25 capacidades de entrada con diez puntos cada una, inventario, descartes, trazabilidad y limitaciones. |
| Output Ports | `BackendSDD/Application/nexusmarket-output-ports.md` | 1.0 / completo | Catálogo de 24 capacidades de salida con diez puntos cada una, inventario, descartes, trazabilidad y limitaciones. |
| Casos de uso checkout/consulta | `BackendSDD/Application/nexusmarket-use-cases-checkout-query-order.md` | 1.0 / completo | `UC-01 Checkout` y `UC-02 QueryOrder`: actores, entradas, flujos, errores, invariantes, transacciones, puertos, trazabilidad y límites. |
| Catálogo de adaptadores | `BackendSDD/Adapters/nexusmarket-adapters.md` | `COMPLETO` | Inventario, agrupaciones justificadas, relaciones puerto→adaptador, bloqueos y criterios de validación. |
| Adaptadores individuales | `BackendSDD/Adapters/nexusmarket-adapter-*.md` | `COMPLETO` | 14 documentos individuales: un adaptador de entrada HTTP y trece adaptadores de salida. Cada uno contiene identificación, propósito, límites, puertos, flujo, traducción, errores, dependencias, trazabilidad y validación. |
| Contract Alignment | `BackendSDD/Contracts/nexusmarket-contract-alignment.md` | `COMPLETO` | Verificación de la cadena completa, inventario de contratos `CT-01`…`CT-13`, matriz por flujo, desalineaciones, correcciones y bloqueos. |

### 3.1 Inventario de definiciones individuales

| ID | Servicio | Documento | Estado | Última validación |
|---|---|---|---|---|
| `DS-01` | `PoliticaAutorizacionDominio` | `Domain/services/politica-autorizacion-dominio.md` | `COMPLETO` | 2026-10-26; contrastado con `[DS]` §4.1, `[MOD]` §19 y `[VO]` §8. |
| `DS-02` | `PoliticaPublicacionCatalogo` | `Domain/services/politica-publicacion-catalogo.md` | `COMPLETO` | 2026-10-26; contrastado con `[DS]` §4.2, `[MOD]` §7 y `[VO]` §6, §8. |
| `DS-03` | `ServicioReservaInventario` | `Domain/services/servicio-reserva-inventario.md` | `COMPLETO` | 2026-10-26; contrastado con `[DS]` §4.3, `[MOD]` §8 y `[VO]` §6.6, §6.7, §8.21. |
| `DS-04` | `ServicioAsignacionBodega` | `Domain/services/servicio-asignacion-bodega.md` | `COMPLETO` | 2026-10-26; contrastado con `[DS]` §4.4, `[MOD]` §8, §13 y `[VO]` §8.2, §8.3, §8.10. |
| `DS-05` | `ServicioCalculoPedido` | `Domain/services/servicio-calculo-pedido.md` | `COMPLETO` | 2026-10-26; contrastado con `[DS]` §4.5, `[MOD]` §10, §16.1 y `[VO]` §6.5. |
| `DS-06` | `PoliticaTransicionPedido` | `Domain/services/politica-transicion-pedido.md` | `COMPLETO` | 2026-10-26; contrastado con `[DS]` §4.6, `[MOD]` §10.3, §10.4 y `[VO]` §8.11, §8.12, §8.14. |
| `DS-07` | `PoliticaElegibilidadDevolucion` | `Domain/services/politica-elegibilidad-devolucion.md` | `COMPLETO` | 2026-10-26; contrastado con `[DS]` §4.7, `[MOD]` §14.1, DD-12 y `[VO]` §8.15, §9.2, §9.4, §9.5. |
| `DS-08` | `PoliticaReembolso` | `Domain/services/politica-reembolso.md` | `COMPLETO` | 2026-10-26; contrastado con `[DS]` §4.8, `[MOD]` §11.1, §14.2, §22.6 y `[VO]` §8.12, §8.16, §9.3. |
| `DS-09` | `ServicioAuditoria` | `Domain/services/servicio-auditoria.md` | `COMPLETO` | 2026-10-26; contrastado con `[DS]` §4.9, `[MOD]` §15.1, §20, DD-10 y `[VO]` §7.6, §8.18, §8.19, §8.20, §9.6. |

**Convención de archivos:** un archivo plano por servicio, con el nombre canónico en minúsculas y guiones. El prefijo `DS-xx` permanece como identificador estable dentro del documento y del catálogo, no en la ruta. Esta convención corrige la descripción anterior de carpetas anidadas, que no coincidía con el árbol real.

---

## 4. Entregables de esta ejecución

| ID | Documento | Ruta objetivo | Estado | Fuentes principales | Dependencias |
|---|---|---|---|---|---|
| ENT-DS | Domain Services | `BackendSDD/Domain/nexusmarket-domain-services.md` | `COMPLETO` | Modelo de dominio §18, §19, §21; enunciado; arquitectura | Modelo de dominio, Domain Object Values |
| ENT-VO | Domain Object Values | `BackendSDD/Domain/nexusmarket-domain-object-values.md` | `COMPLETO` | Modelo de dominio §16, entidades §6–§15; enunciado | Modelo de dominio, Domain Services |
| ENT-DS-IND | Definiciones individuales de Domain Services | `BackendSDD/Domain/services/<nombre-canónico>.md` | `COMPLETO` | Catálogo de servicios §3–§8; modelo §6–§21; VOs §6–§9; arquitectura §3, §6, §9, §12 | Modelo de dominio, Domain Object Values, Domain Services |
| ENT-PI | Input Ports | `BackendSDD/Application/nexusmarket-input-ports.md` | `COMPLETO` | Enunciado OBJ-01…OBJ-12; modelo §6–§15, §22, §24; VOs §6–§9; servicios DS-01…DS-09; arquitectura §4, §5, §7, §9, §16 | Modelo de dominio, Domain Services, arquitectura |
| ENT-PO | Output Ports | `BackendSDD/Application/nexusmarket-output-ports.md` | `COMPLETO` | Arquitectura §4, §5, §7, §9, §16; modelo §6–§15, §24; VOs §6–§9; servicios DS-01…DS-09; enunciado OBJ-01…OBJ-12 | Modelo de dominio, Domain Services, arquitectura, Input Ports |
| ENT-UC | Casos de uso checkout/consulta | `BackendSDD/Application/nexusmarket-use-cases-checkout-query-order.md` | `COMPLETO` | Enunciado OBJ-08, OBJ-12; modelo §9–§15, §18, §22.3–§22.5; VOs §6–§9; servicios DS-01, DS-03, DS-04, DS-05, DS-06, DS-09; arquitectura §4, §7, §9.4, §16; Input Ports `PI-11`–`PI-13`; Output Ports `PO-02`–`PO-23` | Modelo de dominio, Domain Services, arquitectura, Input Ports, Output Ports |
| ENT-AD | Adaptadores | `BackendSDD/Adapters/nexusmarket-adapters.md` y 14 documentos individuales | `COMPLETO` | Arquitectura §3.3–§3.5, §4, §7, §8, §9, §11.2, §12, §16; Input Ports §2–§5; Output Ports §2–§5; casos de uso `UC-01`/`UC-02`; Prompt maestro §5.6–§5.7 y §12 | Arquitectura, Input Ports, Output Ports, casos de uso, modelo/VO cuando la traducción lo exige |
| ENT-CA | Contract Alignment | `BackendSDD/Contracts/nexusmarket-contract-alignment.md` | `COMPLETO` | Arquitectura §8, §9, §11.2, §16; Input Ports §4; Output Ports §2–§5; catálogo y documentos de adaptadores; modelo §20, §24; VOs §6–§9; casos de uso `UC-01`/`UC-02`; Prompt maestro §5.8 | Adaptadores, puertos, arquitectura, modelo/VO y casos de uso |

**Documentos relacionados que deben contrastarse:** modelo de dominio, arquitectura, README, versiones anteriores de servicios y objetos de valor, y los casos de uso ya creados. Los catálogos de puertos y los casos de uso de checkout/consulta están creados. La ejecución vigente creó exclusivamente documentos Markdown de adaptadores; no creó código, endpoints, contratos ejecutables ni pruebas.

---

## 5. Matriz de documentos requeridos (alcance de esta ejecución)

| ID | Documento | Tipo | Estado | Cobertura | Vacíos/conflictos | Próxima acción |
|---|---|---|---|---|---|---|
| ENT-VO | `nexusmarket-domain-object-values.md` | Catálogo de VOs | `COMPLETO` | 47 entradas de inventario, familias de identificadores y nombres, VOs escalares, dirección/tiempo/trazabilidad, catálogos de estado, VOs auxiliares, validación, invariantes y trazabilidad | Composición de `Direccion`, límites de longitud, formato de `DocumentoIdentidad`, escala/redondeo de `Dinero`, catálogo de motivos | Mantenimiento; sin acciones pendientes en esta ejecución |
| ENT-DS | `nexusmarket-domain-services.md` | Catálogo de servicios/políticas | `COMPLETO` | Nueve servicios/políticas con veinte puntos cada uno, interacciones, matrices de reglas e invariantes, trazabilidad y equivalencias legadas | Preferencia de bodega, tasas/impuestos, plazo de devolución | Mantenimiento; sin acciones pendientes en esta ejecución |
| ENT-DS-IND | `Domain/services/<nombre-canónico>.md` | Nueve definiciones individuales | `COMPLETO` | Identificación, propósito, justificación DDD, contexto, reglas, entradas, resultado, invariantes, conceptos, flujo, estado, colaboraciones, escenarios, dependencias, trazabilidad y validación | Rol financiero no enumerado (`DEC-BIZ-07`); catálogo de eventos, payload y gravedad (`L-11`, `L-14`, `L-15`) | Mantenimiento; sin acciones pendientes en esta ejecución |
| ENT-PI | Input Ports | Catálogo de puertos de entrada | `COMPLETO` | 25 puertos `PI-01`…`PI-25` con diez puntos, inventario, descartes, matrices OBJ→PI y PI→PO, validación y limitaciones `L-16`…`L-26` (L-16/L-20 cerradas por `DEC-W1-007`/`DEC-W1-008`) | Casos de uso de checkout/consulta creados, no aprobados por negocio; granularidad derivada de OBJ y arquitectura; limitaciones restantes `L-16`…`L-26` | Mantenimiento; usar como entrada para adaptadores |
| ENT-PO | Output Ports | Catálogo de puertos de salida | `COMPLETO` | 24 puertos `PO-01`…`PO-24` con diez puntos, inventario, descartes, consumidores, validación y limitaciones `L-01`…`L-26` | `L-17`, `L-22` y `L-23` condicionan facturación, pago y logística; `L-25` se cierra a nivel de diseño en `D-16`; `L-26` afecta el alcance del operador | Mantenimiento; los adaptadores ya están documentados en `BackendSDD/Adapters/` |
| ENT-UC | Casos de uso checkout/consulta | Especificación de `UC-01` y `UC-02` | `COMPLETO` | Contexto común, `UC-01 Checkout`, `UC-02 QueryOrder`, matrices PI→PO, trazabilidad, decisiones `D-16`…`D-23`, conciliaciones `C-16`…`C-19` y límites | `DEC-BIZ-01`…`DEC-BIZ-07` abiertas; `L-17`, `L-22`, `L-23` acotadas; `L-25` cerrada por diseño; `L-26` abierta | Mantenimiento; usar como entrada para adaptadores y contratos |
| ENT-AD | Catálogo e individuales de adaptadores | Catálogo y especificaciones de adaptadores | `COMPLETO` | Un adaptador de entrada HTTP y trece adaptadores de salida agrupados por límite arquitectónico; relaciones con `PI`/`PO`, traducción, errores, dependencias y trazabilidad | Protocolos externos y contrato HTTP no aprobados; se registran como `L-27` y límites ya existentes; no impiden documentar la frontera | Mantenimiento; usar como entrada para Contract Alignment |
| ENT-CA | Contract Alignment | Verificación de cadena y contratos | `COMPLETO` | Inventario `CT-01`…`CT-13`, matriz de flujos, estados de alineación, correcciones, bloqueos y criterios de aceptación | `L-27` y protocolos externos abiertos; se registran como límites, no se inventan | Mantenimiento; aprobar decisiones externas antes de crear contratos ejecutables |

### 5.1 Inventario final de adaptadores

| ID | Adaptador | Tipo | Puertos | Documento | Estado |
|---|---|---|---|---|---|
| `ADIN-01` | Adaptador de entrada HTTP | Entrada | Invoca `PI-01`…`PI-25` | `BackendSDD/Adapters/nexusmarket-adapter-http-input.md` | `COMPLETO` |
| `ADOUT-01` | Repositorios SQL de identidad y perfiles | Salida / persistencia | Implementa `PO-01`…`PO-04` | `BackendSDD/Adapters/nexusmarket-adapter-sql-identity-profiles.md` | `COMPLETO` |
| `ADOUT-02` | Repositorios SQL de catálogo, inventario y carrito | Salida / persistencia | Implementa `PO-05`…`PO-07` | `BackendSDD/Adapters/nexusmarket-adapter-sql-catalog-inventory-cart.md` | `COMPLETO` |
| `ADOUT-03` | Repositorios SQL del ciclo de pedido | Salida / persistencia | Implementa `PO-08`…`PO-13` | `BackendSDD/Adapters/nexusmarket-adapter-sql-order-lifecycle.md` | `COMPLETO` |
| `ADOUT-04` | Unidad de trabajo y outbox SQL | Salida / transacción y eventos | Implementa `PO-15`, `PO-23` | `BackendSDD/Adapters/nexusmarket-adapter-sql-unit-of-work-outbox.md` | `COMPLETO` |
| `ADOUT-05` | Repositorio MongoDB de auditoría | Salida / persistencia documental | Implementa `PO-14` | `BackendSDD/Adapters/nexusmarket-adapter-mongodb-audit.md` | `COMPLETO` |
| `ADOUT-06` | Consultas SQL de reportes | Salida / lectura | Implementa `PO-24` | `BackendSDD/Adapters/nexusmarket-adapter-sql-reporting-query.md` | `COMPLETO` |
| `ADOUT-07` | Pasarela de pagos | Salida / integración externa | Implementa `PO-16` | `BackendSDD/Adapters/nexusmarket-adapter-payment-gateway.md` | `COMPLETO` |
| `ADOUT-08` | Proveedor logístico | Salida / integración externa | Implementa `PO-17` | `BackendSDD/Adapters/nexusmarket-adapter-shipping-provider.md` | `COMPLETO` |
| `ADOUT-09` | Envío de notificaciones | Salida / integración externa | Implementa `PO-18` | `BackendSDD/Adapters/nexusmarket-adapter-notification-sender.md` | `COMPLETO` |
| `ADOUT-10` | Entrega digital | Salida / integración externa | Implementa `PO-19` | `BackendSDD/Adapters/nexusmarket-adapter-digital-delivery.md` | `COMPLETO` |
| `ADOUT-11` | Reloj del sistema | Salida / capacidad técnica | Implementa `PO-20` | `BackendSDD/Adapters/nexusmarket-adapter-system-clock.md` | `COMPLETO` |
| `ADOUT-12` | Generador de identificadores | Salida / capacidad técnica | Implementa `PO-21` | `BackendSDD/Adapters/nexusmarket-adapter-id-generator.md` | `COMPLETO` |
| `ADOUT-13` | Hashing de credenciales | Salida / capacidad técnica | Implementa `PO-22` | `BackendSDD/Adapters/nexusmarket-adapter-password-hasher.md` | `COMPLETO` |

**Criterio de agrupación:** los adaptadores de persistencia SQL se documentan por familia de contexto, no por puerto aislado. Cada documento declara que las implementaciones concretas siguen siendo una por puerto y módulo; la agrupación evita duplicar reglas de traducción, errores y transacciones. No se crea un repositorio universal.

**Estado de los documentos:** los 14 documentos individuales y el catálogo están `COMPLETO` como documentación. Esto no significa que existan implementaciones: no se creó código, SQL, esquemas, colecciones, endpoints, SDKs, credenciales ni pruebas. Los bloqueos de implementación se registran en el catálogo §9 y en `L-27`/limitaciones existentes.

---

## 6. Conflictos y decisiones de reconciliación

| ID | Hallazgo | Fuentes | Resolución | Estado |
|---|---|---|---|---|
| C-01 | El README describía `SDD/` y documentos con nombres antiguos (histórico; el README fue actualizado el 2026-10-26); el árbol vigente usa `BackendSDD/` y nombres `nexusmarket-*`. | README previo; árbol Git | Se adopta `BackendSDD/` y los nombres vigentes. No se recrean los archivos antiguos. | Resuelto por consistencia |
| C-02 | El README y los documentos antiguos hablan de 5 servicios de dominio (`UserManagementService`, `CatalogService`, `InventoryService`, `OrderProcessingService`, `AuditService`); el modelo 2.0 define 9 servicios/políticas. | README; `Domain  Servicies.md` (histórico); modelo §18 | Se adopta el modelo 2.0. Los 5 servicios antiguos se tratan como legado y se explican sus equivalencias. | Resuelto por jerarquía |
| C-03 | El README declara devoluciones y reembolsos fuera del modelo de dominio; el modelo 2.0 los incluye con agregados y reglas. | README; modelo §14 | Se adopta el modelo 2.0. | Resuelto por jerarquía |
| C-04 | El documento antiguo incluye `CARRITO` como estado de pedido y `FINALIZADO`; el modelo 2.0 excluye `CARRITO` y normaliza `FINALIZADO` como `CERRADO`. | `Domain Object Value.md` (histórico); modelo §10.3 | Se adopta el modelo 2.0. | Resuelto por jerarquía |
| C-05 | El documento antiguo usa `EstadoPago.APROBADO`; el modelo 2.0 usa `AUTORIZADO`, `CAPTURADO`, etc. | `Domain Object Value.md` (histórico); modelo §11.1 | Se adopta el modelo 2.0; `APROBADO` es legado. | Resuelto por jerarquía |
| C-06 | El documento antiguo usa `MetodoEntrega`; el modelo 2.0 usa `TipoEntrega`. | `Domain Object Value.md` (histórico); modelo §16 | Se adopta `TipoEntrega`; `MetodoEntrega` es sinónimo legado, no un VO distinto. | Resuelto por consistencia |
| C-07 | El documento antiguo usa `SystemRole`; el modelo 2.0 usa `RolSistema`. | `Domain Object Value.md` (histórico); modelo §6.2 | Se adopta `RolSistema` como nombre canónico; los códigos no cambian. | Resuelto por consistencia |
| C-08 | La arquitectura §18 enumera decisiones pendientes que el modelo 2.0 ya resolvió (relación usuario/perfiles, política de inventario, estados de pedido, etc.). | Arquitectura §18; modelo §27 | Se adopta el modelo 2.0 y se marca la lista de arquitectura como histórica en los puntos superados. | Resuelto por jerarquía |
| C-09 | La arquitectura menciona PostgreSQL como recomendación; la instrucción vigente lo establece como tecnología oficial. | Arquitectura; instrucción del usuario | PostgreSQL es la base relacional oficial. No se introduce MySQL. | Resuelto por instrucción |
| C-10 | El README describe identificadores opacos `string`; el modelo 2.0 exige identificadores tipados. | README; modelo §16 | Compatibles: el tipo nominal envuelve un valor opaco; el formato físico queda abierto. | Resuelto por consistencia |
| C-11 | `[MOD]` §8.2.1 y §21 enumeran `INV-01…INV-10` con contenidos distintos; por ejemplo, §21 asigna a `INV-02` la prohibición de reservar stock no disponible, mientras §8.2.1 la define como `reserved + unavailable <= onHand`. | Modelo §8.2.1, §21 | Se adopta §8.2.1 por ser la sección normativa del agregado `Inventario`; `[DS]` lo declara en §1.5. | Resuelto por jerarquía interna |
| C-12 | `[MOD]` §7.1 y §21 enumeran `CAT-01…CAT-07` con contenidos distintos: §7.1 regula la publicación; §21 asigna a `CAT-03` la vendibilidad y a `CAT-04` la no reapertura del descontinuado. | Modelo §7.1, §21; `[DS]` §4.2 | Se adopta §7.1 por ser la sección normativa del agregado `Producto`, con el mismo criterio que `C-11`. La regla de vendibilidad de §21 se conserva por referencia de sección y se documenta como `PUB-01` en `DS-02`. | Resuelto por jerarquía interna |
| C-13 | `[MOD]` §10.3 y §21 enumeran `ORD-01…ORD-08`/`ORD-01…ORD-06` con contenidos distintos: §10.3 regula transiciones; §21 formula reglas resumidas de pago, salida, cierre y snapshots. | Modelo §10.3, §21; `[DS]` §4.6 | Se adopta §10.3 por ser la sección normativa de las transiciones del agregado `Pedido`; las reglas resumidas de §21 se referencian por sección y se conservan en `DS-06`. | Resuelto por jerarquía interna |
| C-14 | `[MOD]` §6.1 asigna `USR-03` a «rol obligatorio y único» y `USR-04` a «cuenta inactiva o bloqueada»; §19.1, §21 y `[DS]` §4.1 usan `USR-03` para la cuenta inactiva o bloqueada. | Modelo §6.1, §19.1, §21; `[DS]` §4.1 | Se adopta §6.1 por ser la sección normativa del agregado `Usuario`; en `DS-01`, `USR-03` queda para rol único y `USR-04` para cuenta inactiva o bloqueada. El catálogo conserva su contenido de negocio y se interpreta con la corrección de código. | Resuelto por jerarquía interna |
| C-15 | `[ARQ]` §9.3 muestra `modules/catalog/domain/product-repository.ts` y `modules/identity/domain/user-repository.ts`, mientras §4, §7 y §16 ubican los puertos en la capa de aplicación y prohíben que el dominio dependa de ellos. | Arquitectura §4, §7.3, §9.3, §16; catálogos de puertos | Se adopta `application/ports/` como ubicación canónica de los puertos de salida. El ejemplo de §9.3 se trata como ilustrativo y no se modifica la arquitectura; la discrepancia queda registrada. | Resuelto por jerarquía arquitectónica |
| C-16 | `PI-12` describía un `pagoId` singular, mientras `[MOD]` §11.1 exige `Pago.pedidoId` y un checkout multi-vendedor crea varios pedidos. | `PI-12`; modelo §9.4, §11.1; casos de uso `UC-01` | Se adopta un pago por pedido (`D-17`). La salida de `PI-12` se corrige a lista de pagos; un pago único de grupo exigiría cambiar el modelo y no se inventa. | Resuelto por jerarquía del modelo |
| C-17 | Los catálogos de puertos estaban físicamente en `BackendSDD/Domain/`, aunque su contenido, el estado y la arquitectura declaraban `BackendSDD/Application/`. | Árbol de archivos; `[PI]`, `[PO]`; estado §3; arquitectura §4, §7 | Se restauran los dos catálogos en `BackendSDD/Application/` (`D-23`); no quedan copias duplicadas. | Resuelto por consistencia |
| C-18 | `PI-13` menciona «operador asignado», pero el modelo no define una entidad de asignación de operador a pedido/envío. | `PI-13`; modelo §13.1; `UC-02` | El alcance del operador debe provenir del contexto de autorización; sin asignación explícita se deniega. Se registra `L-26`; no se inventa una entidad. | Acotado; limitación abierta |
| C-19 | `PI-13` devolvía `NO_AUTORIZADO` cuando el actor no tenía alcance sobre un pedido; el caso de uso adopta no divulgación de existencia. | `PI-13`; `UC-02`; `D-21` | Se alinea `PI-13`: `NO_AUTORIZADO` para rol/contexto; `RECURSO_NO_ENCONTRADO` para recurso fuera de alcance. | Resuelto por decisión de seguridad |
| C-20 | `PO-16` y `PO-17` atribuyen la verificación de autenticidad de webhooks al adaptador de integración de salida, mientras `PI-15` y `PI-18` exigen un evento ya verificado en el límite de entrada. | `[PO]` `PO-16`, `PO-17`; `[PI]` `PI-15`, `PI-18`; `ADIN-01`; `ADOUT-07`, `ADOUT-08` | `D-26`: el límite HTTP verifica autenticidad antes de invocar `PI-15`/`PI-18`; el mecanismo concreto depende de `L-22`/`L-23`. No se crea un puerto nuevo ni se invierte la dirección de dependencias. | Acotado; mecanismo concreto abierto |
| C-21 | Seis documentos de adaptadores declaraban códigos de error o estados no presentes en el puerto que implementan: `ADOUT-01` añadía `NO_DISPONIBLE`; `ADOUT-06` añadía `FALLO_PERSISTENCIA`; `ADOUT-10` usaba `PENDIENTE`/`PROVISTO`/`EXPIRADO` y añadía `LIMITE_EXCEDIDO`; `ADOUT-11` añadía `OPERACION_NO_SOPORTADA`; `ADOUT-12` no usaba `DATOS_INVALIDOS`/`CONFLICTO_UNICIDAD`; `ADOUT-13` añadía `FALLO_PROVEEDOR`. | `[PO]` `PO-01`…`PO-04`, `PO-19`, `PO-20`, `PO-21`, `PO-22`, `PO-24`; documentos `ADOUT-01`, `ADOUT-06`, `ADOUT-10`…`ADOUT-13` | `D-27`: los adaptadores usan exactamente los códigos y estados declarados por el puerto; no añaden códigos no previstos ni estados normalizados alternativos. Se corrigieron los seis documentos sin tocar los puertos. | Resuelto por Contract Alignment |

---

## 7. Limitaciones reales detectadas (no convertidas en requisitos)

| ID | Limitación | Fuentes/puertos revisados | Impacto | Contenido que sí puede definirse |
|---|---|---|---|---|
| L-01 | No se especifican los campos exactos de `Direccion` ni de `DireccionFisica`. | Modelo §6.3, §8.1, §16 | No puede fijarse una composición cerrada. | Semántica, inmutabilidad del snapshot, obligatoriedad para compra física y rechazo de direcciones inválidas. |
| L-02 | No se especifican límites máximos de longitud de nombres. | Modelo §16 | No puede fijarse un máximo numérico. | No vacío, normalización de espacios y remisión a la validación de entrada. |
| L-03 | No se especifica el formato ni la normalización exacta de `DocumentoIdentidad`. | Modelo §6.1, §16 | No puede fijarse una regla de formato. | Componentes tipo/país/número, unicidad y protección del dato. |
| L-04 | No se especifica la escala decimal, moneda obligatoria del despliegue ni regla de redondeo. | Modelo §16, §16.1 | No puede fijarse precisión ni moneda única. | Moneda explícita, aritmética exacta, igualdad de moneda y redondeo reproducible por política. |
| L-05 | No se especifican tasas de impuestos, descuentos ni costo de envío. | Modelo §10.1, §18 | El cálculo no puede producir valores sin política. | Fórmula, invariantes y entradas conceptuales de la política. |
| L-06 | **CERRADA (DEC-W1-002)** — históricamente no se especificaba el plazo; el valor inicial aprobado es 30 días, configurable y de ámbito único de plataforma. | Modelo §14.1, DD-12 | Sin bloqueo para la política; la configuración y el snapshot se implementan en W2/W5. | Ventana configurable, valor inicial 30 días, elegibilidad y límites de cantidades. |
| L-07 | No se especifica la preferencia entre bodegas elegibles. | Modelo §8, §18 | No puede fijarse una optimización comercial. | Validación de factibilidad, bodegas activas y disponibilidad suficiente. |
| L-08 | No se especifica el proceso que cambia `EstadoComercial`. | Modelo §6.3; histórico O-17 | No puede atribuirse a un actor concreto. | Valores y efecto de `RESTRINGIDO`. |
| L-09 | No se especifican todas las transiciones de `EstadoVendedor`, `EstadoVariante`, `EstadoBodega` y `EstadoEnvio`. | Modelo §6.4, §7.4, §8.1, §13.1 | No puede cerrarse una tabla completa de transiciones. | Valores, reglas explícitas y transiciones confirmadas. |
| L-10 | No se especifica el catálogo de `MotivoDevolucion` ni de `MotivoReembolso`. | Modelo §14.1, §14.2 | No pueden enumerarse motivos válidos. | Obligatoriedad, no vacío y pertenencia a catálogo controlado cuando aplique. |
| L-11 | No se especifica la composición de `DatosEmisorSnapshot`, `DatosReceptorSnapshot` ni `AuditPayload`. | Modelo §12.1, §15.1 | No puede fijarse un esquema cerrado. | Semántica de snapshot inmutable, minimización y ausencia de secretos. |
| L-12 | **CERRADA (DEC-W1-008)** — históricamente no se especificaba el algoritmo ni el formato; se adopta Argon2id y PHC (`$argon2id$v=19$m=19456,t=2,p=1$...`). | Modelo §6.1, §16 | Sin bloqueo de algoritmo; el adaptador y la dependencia se eligen en W4. | Nunca contraseña en texto plano, no reversible, PHC y creación fuera del dominio. |
| L-13 | No se especifica el formato físico de los identificadores. | Modelo §16, §24 | No puede fijarse UUID, serial u otro. | Tipo nominal, opacidad, no reutilización y unicidad. |
| L-14 | No se especifica el catálogo completo de `CodigoEvento` ni de `TipoReferencia`. | Modelo §8.3, §15.1 | No pueden enumerarse todos los valores. | Código estable, versionado y pertenencia a catálogo controlado. |
| L-15 | No se especifica la política de asignación de `GravedadAuditoria` por evento. | Modelo §15.1; `[DS]` §4.9; `[VO]` §8.18 | No puede fijarse una escala de severidad por tipo de evento. | Valores del catálogo, coherencia mínima con el resultado y exigencia de actor/correlación en eventos críticos. |
| L-16 | **CERRADA (DEC-W1-007)** — históricamente no se fijaba el estado inicial; se adopta `Usuario ACTIVO`, `PerfilComprador HABILITADO`, `PerfilVendedor ACTIVO` y primera `BodegaVendedor ACTIVA` al crear. | Modelo §6.1, §6.3, §6.4, §8.1; VOs §8.5, §8.7; puertos PI-01, PI-02, PI-03, PI-04 | Sin bloqueo para el alta; las transiciones restantes siguen en `L-09`. | Estados iniciales aprobados; no hay verificación de correo ni revisión separada del vendedor en V1. |
| L-17 | No se especifican numeración, serie fiscal ni política de corrección de facturas. | Modelo §12.1; VOs §8.13, §9.5; puertos PI-19, PI-20, PO-10 | No puede definirse el número ni el documento correctivo. | Serie, formato, unicidad, jurisdicción y regla de corrección. |
| L-18 | No se especifica el mecanismo ni el modelo de recursos de entrega digital. | Modelo §7.3, §13.3; puertos PI-15, PI-18, PI-22, PO-19 | El contrato de entrega digital queda abstracto. | Cómo se provisiona/revoca una licencia o acceso y qué evidencia se registra. |
| L-19 | No se especifican catálogo de reportes, parámetros, búsqueda ni límites de paginación. | Arquitectura §9.3; puertos PI-07, PI-10, PI-13, PI-24, PI-25, PO-24 | Los contratos de consulta no fijan tipos ni límites. | Reportes aprobados, filtros, orden y tamaño máximo. |
| L-20 | **CERRADA (DEC-W1-008)** — históricamente no se especificaba la política; se adopta Argon2id (m=19456 KiB, t=2, p=1), contraseña de 12–128 caracteres sin composición obligatoria y verificación de tiempo constante. | Modelo §6.1; VOs §6.4; puertos PI-01, PI-02, PO-22 | Sin bloqueo de política; rate limiting y recuperación quedan fuera de `L-20`. | Requisitos, algoritmo, parámetros y verificación aprobados. |
| L-21 | No se define el actor ni el proceso de cierre `ENTREGADO → CERRADO`. | Modelo §10.3; puertos PI-18, PO-08, PO-11 | El estado `CERRADO` no tiene puerto de entrada. | Definir si el cierre es automático, administrativo o programado, con precondiciones y evidencia. |
| L-22 | No se especifica el protocolo del proveedor de pago, el modelo autorización/captura, los reintentos ni la cancelación. | Modelo §11.1; puertos PI-12, PI-14, PI-15, PI-23, PO-09, PO-16 | Los contratos de pago quedan abstractos. | Contrato del proveedor y semántica de reintento/cancelación. |
| L-23 | No se especifica la integración logística, los eventos de tracking ni el formato de evidencia de entrega. | Modelo §13.1–§13.3; puertos PI-16, PI-17, PI-18, PO-11, PO-17 | El contrato de transporte queda abstracto. | Proveedor, eventos, evidencia y reintentos. |
| L-24 | No se especifica el catálogo de notificaciones, canales ni consentimiento. | Arquitectura §7.3; puertos PI-01, PI-02, PI-12, PI-15, PI-17–PI-23, PO-18 | El contrato de notificación queda abstracto. | Canales, plantillas y política de consentimiento. |
| L-25 | No se especifica la política de aislamiento, timeout y reintento transaccional. | Arquitectura §9.4; puerto PO-15 | El adaptador no puede fijar el comportamiento sin una decisión. | Nivel de aislamiento, timeout y reintentos. |
| L-26 | No se modela la asignación de un operador logístico a pedidos o envíos. | Modelo §13.1; puerto PI-13; caso de uso `UC-02` | El alcance del operador no puede derivarse del modelo; sin asignación explícita no hay consulta autorizada. | El contexto de autorización debe aportar la asignación; si falta, se deniega. No se inventa una entidad. |
| L-27 | No existe un contrato HTTP/OpenAPI aprobado: rutas, métodos, códigos de estado, autenticación, versionado, esquemas públicos y límites de tasa no están definidos. | Arquitectura §8, §11.2; `[PI]` §4; `ADIN-01` | El adaptador HTTP no puede cerrar su contrato público ni fijar códigos, rutas o autenticación. | Responsabilidad, flujo, validación de forma, construcción del contexto, mapeo conceptual de resultados y errores, y criterios de seguridad. |

### 7.1 Estado de cierre o acotación de limitaciones bloqueantes

| ID | Estado tras los casos de uso | Evidencia | Alcance que sigue abierto |
|---|---|---|---|
| `L-17` | **No bloquea checkout/consulta.** | `UC-02` solo devuelve la factura existente; `UC-01` no emite factura. | Numeración, serie y corrección fiscal para `PI-19`/`PI-20` y el contrato de facturación. |
| `L-22` | **Acotada.** La interacción abstracta queda definida. | `D-18`; `UC-01` inicia pago y no captura; `PO-16`. | Proveedor, protocolo autorización/captura, ventana de reintento y cancelación concreta. |
| `L-23` | **No bloquea checkout/consulta.** | `UC-02` devuelve resumen de envío; `UC-01` no integra logística. | Proveedor, eventos de tracking, evidencia y reintentos para `PI-16`…`PI-18`. |
| `L-25` | **Cerrada a nivel de diseño.** | `D-16`: `READ COMMITTED` por defecto, timeout/reintentos acotados y configurables, sin transacción distribuida. | Valores numéricos de timeout y número máximo de reintentos, que quedan en configuración. |
| `L-26` | **Abierta y acotada.** | `C-18`; `UC-02` exige asignación en el contexto o deniega. | Modelo/proceso de asignación de operador logístico; solo afecta el alcance del operador. |
| `L-27` | **Abierta y acotada para la documentación de adaptadores.** | `ADIN-01` documenta frontera, validación, contexto y mapeo conceptual; no fija el contrato público. | Rutas, métodos, códigos HTTP, autenticación, versionado, esquemas públicos y límites de tasa. |

---

## 8. Decisiones de diseño adoptadas por el agente

| ID | Decisión | Justificación | Consecuencia |
|---|---|---|---|
| D-01 | Usar `BackendSDD/Domain/` como ubicación de los entregables de dominio (modelo, VOs y servicios). | Es la carpeta del modelo de dominio vigente y mantiene la convención `nexusmarket-*`. | Enlaces relativos al modelo, a los VOs, a los servicios y a la arquitectura. |
| D-02 | Guardar el estado en `BackendSDD/DOCUMENTATION_STATUS.md`. | No existe `docs/documentation/`; `BackendSDD/` es la raíz documental real. | Un único registro de continuidad. |
| D-03 | Tratar los 5 servicios antiguos como legado y no como servicios canónicos. | El modelo 2.0 es la línea base y separa dominio de aplicación. | Se documentan equivalencias y descartes. |
| D-04 | Agrupar los identificadores tipados en una familia `IdentificadorTipado` con especializaciones nominales. | Evita duplicar 20 especificaciones idénticas y conserva la distinción de tipo. | Tabla de identificadores concretos y reglas compartidas. |
| D-05 | Agrupar los nombres textuales en una familia con reglas compartidas y semántica por campo. | Comparten invariantes de texto no vacío/normalizado; difieren en el concepto que nombran. | Se evita duplicación sin perder significado. |
| D-06 | Adoptar `TipoEntrega` como nombre canónico y tratar `MetodoEntrega` como sinónimo legado. | El modelo 2.0 es la fuente vigente. | No se crea un VO duplicado. |
| D-07 | No fijar valores numéricos para límites, plazos, tasas, moneda o redondeo. | No hay evidencia suficiente; fijarlos sería inventar política de negocio. | Se documentan como políticas configurables o limitaciones. |
| D-08 | No definir puertos, adaptadores ni contratos dentro de los documentos de dominio; los puertos se documentan en `BackendSDD/Application/`. | Mantiene la dirección de dependencias y separa dominio de aplicación. | El dominio describe colaboraciones conceptuales; los puertos viven en Application. |
| D-09 | Estructura `Domain/services/<nombre-canónico>.md`, con el nombre en minúsculas y guiones. | El árbol real usa archivos planos; la convención anterior de carpetas anidadas no coincidía. | Enlaces relativos desde cada documento al catálogo, al modelo, a los VOs y a la arquitectura. El `id` estable `DS-xx` no se usa en la ruta. |
| D-10 | Los códigos de regla que no figuran en `[MOD]` §21 ni en `[DS]` se marcan como derivaciones locales del documento que los usa. | Evita presentar como normativos códigos construidos para ordenar la exposición de una política. | Cada documento incluye una nota de códigos; el catálogo normativo no se amplía por conveniencia documental. |
| D-11 | Ubicar los catálogos de puertos en `BackendSDD/Application/` y proponer `src/modules/<módulo>/application/ports/` como ubicación arquitectónica. | `[ARQ]` §4, §7 y §16 asignan los puertos a la capa de aplicación; el dominio no debe depender de ellos. | Se registra `C-15` por la discrepancia con `[ARQ]` §9.3; no se crean adaptadores ni código. |
| D-12 | Usar dos catálogos (Input/Output) en lugar de un archivo por puerto. | Evita 49 archivos duplicados y mantiene una visión transversal; `[ARQ]` §7.2 no exige una interfaz por clase. | Cada puerto conserva sus diez puntos; si el proyecto exige archivos individuales, se dividen mecánicamente. |
| D-13 | Inventario de entrada de 25 puertos; agrupar `AddCartItem` en `ManageCart`, `PublishProduct` en `ManageProductPublication` y rechazar `ReserveInventory` como puerto de entrada. | Evita un puerto por método; la reserva es una operación interna de `DS-03` invocada por checkout/cancelación/despacho. | `PI-01`…`PI-25`; los descartes se justifican en el catálogo. |
| D-14 | Inventario de salida de 24 puertos; agrupar reservas/movimientos en `InventoryRepository` y auditoría en `AuditLogRepository`; añadir `BuyerRepository`, `WarehouseRepository`, `DigitalDeliveryProvider`, `Clock`, `IdGenerator`, `PasswordHasher`, `DomainEventOutbox` y `ReportingQuery`. | Respetan límites de agregado, atomicidad y necesidades documentadas del modelo/arquitectura. | `PO-01`…`PO-24`; las justificaciones están en el catálogo. |
| D-15 | No crear puertos para `CloseOrder`, `RetryPayment`, `ChangeRole`, `ChangeCommercialStatus` ni consultas de detalle no aprobadas. | Falta actor, proceso o caso de uso; crearlos obligaría a inventar reglas. | Se registran como limitaciones `L-08`, `L-21` y `L-22`; `L-16` quedó cerrada por `DEC-W1-007` y no se presenta como contrato cerrado. |
| D-16 | Adoptar `READ COMMITTED` como aislamiento por defecto para `UC-01`, con actualizaciones condicionales/versión, timeout y reintentos acotados y configurables; reintentar solo fallos transitorios con la misma clave; no reintentar una captura externa sin consultar. | `L-25` no fija política; la arquitectura exige atomicidad y no transacciones distribuidas. | Cierra `L-25` a nivel de diseño; los valores numéricos quedan en configuración. |
| D-17 | Un pago por pedido, no un pago único por `checkoutGroupId`. | `[MOD]` §11.1 exige `Pago.pedidoId`; un checkout multi-vendedor crea varios pedidos. | `C-16`; `PI-12` devuelve una lista de pagos. |
| D-18 | Definir la interacción de pago de forma abstracta: iniciar → estado normalizado → confirmar/consultar → cancelar si el proveedor lo permite; sin captura en checkout y sin datos de tarjeta. | `PO-16` ya expresa la abstracción; `L-22` solo bloquea el protocolo concreto. | `L-22` queda acotada; proveedor y ventana de reintento siguen abiertos. |
| D-19 | `UC-02` usa los repositorios operativos `PO-08`…`PO-13`, no `PO-24`; no requiere proyección ni auditoría de lecturas. | `PO-24` está reservado a reportes; `PI-13` no incluye `PO-14`. | Consulta operativa consistente con la fuente transaccional; auditoría de accesos queda como decisión futura. |
| D-20 | En `UC-02`, el modo detalle usa `pedidoId`; el modo lista usa paginación; orden por defecto `creadoEn DESC` con desempate `pedidoId`; rango de fechas `[desde, hasta)`. | Evita respuestas ambiguas y sobrecarga; no fija límites numéricos. | Contrato conceptual estable; `L-19` sigue fijando el máximo y los filtros aprobados. |
| D-21 | Un recurso existente pero fuera de alcance se devuelve como `RECURSO_NO_ENCONTRADO`; `NO_AUTORIZADO` se reserva para falta de capacidad o contexto. | Minimiza enumeración y filtración de existencia. | Seguridad por no divulgación. |
| D-22 | Mantener un solo documento para `UC-01` y `UC-02`, con contratos separados y contexto común. | Ambos pertenecen a `orders`, comparten autorización, errores y trazabilidad; separarlos duplicaría contexto. | Un documento de dos casos de uso; los flujos posteriores se documentarán aparte. |
| D-23 | Restaurar los catálogos de puertos en `BackendSDD/Application/` y corregir los enlaces relativos de los servicios. | El contenido, el estado y la arquitectura ya declaraban `Application/`; los archivos estaban físicamente en `Domain/`, y los servicios conservaban rutas de la estructura anidada anterior. | `C-17`; no hay copias duplicadas y todos los enlaces relativos resuelven. |
| D-24 | Documentar 14 adaptadores: un HTTP de entrada y trece de salida; agrupar los repositorios SQL por familia de contexto (`ADOUT-01`…`ADOUT-03`) y separar unidad de trabajo/outbox, auditoría, reportes, integraciones y capacidades técnicas. | Evita un documento por puerto y duplica menos reglas de traducción/errores; `[PM]` §12 permite agrupar por contexto sin mezclar responsabilidades y `[ARQ]` §4/§9.3 mantiene la implementación por módulo/agregado. | Cada puerto conserva una implementación separada; no se crea un repositorio universal. El catálogo justifica la cobertura de los 24 `PO`. |
| D-25 | Usar PostgreSQL como fuente inicial de `PO-24 ReportingQuery`; no crear una proyección MongoDB sin un reporte concreto que la justifique. | PostgreSQL es la fuente de verdad transaccional (`[MOD]` §24 (punto 1)); `[ARQ]` §9.3 permite SQL, MongoDB o combinación, pero `L-19` no define reportes ni necesidad documental. | Si un reporte requiere MongoDB, se implementa otro adaptador para `PO-24` con su propia justificación; no se duplica la fuente de verdad por anticipación. |
| D-26 | Verificar la autenticidad de webhooks de pago/logística en el límite HTTP antes de invocar `PI-15`/`PI-18`; el mecanismo concreto queda condicionado por `L-22`/`L-23`. | `PI-15`/`PI-18` exigen un evento verificado; `PO-16`/`PO-17` atribuyen la verificación a la integración. Se conserva la dirección de dependencias sin crear un puerto nuevo. | `C-20`; el adaptador HTTP no confía en el payload del proveedor y el adaptador de integración conserva la responsabilidad del protocolo concreto. |
| D-27 | Los adaptadores deben usar exactamente los códigos de error y estados normalizados declarados por su puerto; cualquier código o estado adicional se considera desalineación documental y se corrige o se registra como limitación. | Contract Alignment encontró seis desalineaciones (`C-21`); añadir códigos no declarados rompe la trazabilidad puerto → adapter y puede introducir semántica no aprobada. | Se corrigieron `ADOUT-01`, `ADOUT-06`, `ADOUT-10`…`ADOUT-13`; no se modificaron los puertos ni el dominio. |
| D-28 | Contract Alignment se entrega como un único documento de verificación y propuesta; no crea OpenAPI, esquemas de eventos, SDKs, clientes ni contratos ejecutables. | El prompt maestro §5.8 pide un documento de alineación; `L-27` y los protocolos externos siguen abiertos, y crear artefactos ejecutables inventaría decisiones no aprobadas. | El documento usa estados `ALINEADO_CON_PROPUESTA`/`SIN_EVIDENCIA` y correcciones concretas; los contratos ejecutables quedan para una ejecución posterior. |
| D-29 | El sobre de eventos propuesto se limita a los campos exigidos por `[MOD]` §20 y `PO-23`: identificador, tipo, versión, fecha UTC, agregado, correlación, causalidad, payload minimizado y clave idempotente. | Permite verificar la cadena sin inventar un catálogo ni payloads; `L-14` sigue abierto. | `CT-02` queda `ALINEADO_CON_PROPUESTA`; no se crea un esquema de eventos ejecutable. |
| D-30 | `CT-01` se marca `SIN_EVIDENCIA` y los flujos que usan HTTP se marcan `ALINEADO_CON_PROPUESTA`, no `ALINEADO`. | No hay OpenAPI aprobado; marcar alineado ocultaría un eslabón crítico. | La corrección es aprobar el contrato HTTP, no inventar rutas ni métodos. |

---

## 9. Decisiones que requieren aprobación externa

| ID | Pregunta | Alternativas | Recomendación | Documentos afectados | Trabajo que puede continuar |
|---|---|---|---|---|---|
| DEC-BIZ-01 | ¿Qué campos y formato exacto debe tener `Direccion`? | Definir campos obligatorios/opcionales por país; reutilizar un estándar; dejar el detalle al contrato de entrada. | Definir un conjunto mínimo de campos de entrega y validarlo en el contrato de entrada. | VO, casos de uso, API. | Semántica, snapshot y obligatoriedad ya definidos. |
| DEC-BIZ-02 | **Resuelta (`DEC-W1-002`)**: plazo configurable, 30 días como valor inicial aprobado, una sola política de plataforma en V1; se registra el valor aplicado. | Plazo fijo por política comercial; plazo por categoría; plazo por jurisdicción. | Parametrizar por política y registrar el valor vigente al solicitar. | VO, DS-07, casos de uso. | Flujo, valor inicial e invariantes definidos; configuración/snapshot en W2/W5. |
| DEC-BIZ-03 | ¿Qué catálogo de motivos de devolución y reembolso se adopta? | Catálogo cerrado por tipo de producto; catálogo único; texto libre controlado. | Catálogo cerrado y versionado. | VO, DS-07, DS-08. | Obligatoriedad y validación de pertenencia ya definidas. |
| DEC-BIZ-04 | ¿Qué política de selección de bodega se usa cuando hay varias elegibles? | Mayor disponibilidad; menor número de bodegas; cercanía; prioridad marketplace. | Definir una política operativa explícita y versionada. | DS-04, logística, costos. | Factibilidad y reserva ya definidas. |
| DEC-BIZ-05 | ¿Qué moneda, escala decimal y regla de redondeo se fijan para el despliegue? | COP con escala definida; multimoneda; otra moneda. | Fijar moneda del despliegue y una regla central reproducible. | VO `Dinero`, DS-05, facturación. | Operaciones y comparaciones ya definidas. |
| DEC-BIZ-06 | ¿Qué proceso y actor cambian `EstadoComercial`? | Proceso administrativo; automático por impago; manual por soporte. | Definir un caso de uso administrativo auditado. | VO, autorización, casos de uso. | Valores y efecto ya definidos. |
| DEC-BIZ-07 | ¿Quién ejerce la aprobación financiera además del Administrador y cómo se le autoriza? | Rol `FINANZAS` en `RolSistema`; autorización funcional sobre un rol existente; aprobación exclusiva del Administrador. | Mantener cinco roles y conceder una autorización financiera explícita y versionada, sin inventar un sexto `RolSistema`. | `[VO]` §8.16; `DS-01`; `DS-08`; casos de uso. | La política ya exige aprobador autorizado y separación de funciones; solo falta definir la atribución. |

**Nota sobre los puertos:** `L-16`, `L-12`/`L-20` y `L-06` quedaron cerradas por `DEC-W1-007`, `DEC-W1-008` y `DEC-W1-002` respectivamente. Siguen requiriendo decisión externa `L-27` (contrato HTTP/OpenAPI), `L-17` (numeración y serie fiscal), `L-18` (entrega digital), `L-19` (catálogo de reportes), `L-13` (formato de ids), `L-21` (cierre `ENTREGADO → CERRADO`), `L-22` (protocolo del proveedor de pago), `L-23` (integración logística), `L-24` (notificaciones) y `L-26` (asignación de operador). `L-25` se cierra a nivel de diseño con `D-16`; los valores numéricos quedan configurables. No se convierten limitaciones en requisitos ni se inventan reglas para eliminarlas; los catálogos, los casos de uso y los adaptadores las registran como límites explícitos.

---

## 10. Matriz de trazabilidad de alto nivel

| Requisito/regla | Dominio | Servicio/política | Caso de uso | Puerto(s) | Adaptador | Contrato | Estado |
|---|---|---|---|---|---|---|---|
| RG-01/RG-02/RG-03 autorización por rol y alcance | Usuario, RolSistema, recursos | DS-01 | Consultar/administrar recursos; autorizar operaciones | `PI-03`, `PI-04`, `PI-13`, `PI-19`, `PI-24`, `PI-25` | `ADIN-01`; `ADOUT-01`, `ADOUT-03` | `CT-01`, `CT-12` | Alineado en dominio y puertos |
| CAT-02/CAT-03 publicación válida | Producto, Variante, PerfilVendedor | DS-02 | Publicar y consultar catálogo | `PI-05`, `PI-06`, `PI-07` | `ADIN-01`; `ADOUT-02` | `CT-01`, `CT-02`, `CT-12` | Alineado en dominio y puertos |
| INV-01…INV-10 inventario | Inventario, ReservaInventario, MovimientoInventario | DS-03 | Reservar/liberar/consumir y ajustar inventario | `PI-09`, `PI-10`, `PI-12`, `PI-14`, `PI-15`, `PI-17`, `PI-22` | `ADIN-01`; `ADOUT-02`, `ADOUT-04` | `CT-01`, `CT-02`, `CT-12` | Alineado en dominio y puertos |
| ORD-07/LOG-01 asignación física | Pedido, Envio, Bodega | DS-04 | Checkout, preparación y despacho | `PI-12`, `PI-16`, `PI-17` | `ADIN-01`; `ADOUT-02`, `ADOUT-03`, `ADOUT-08` | `CT-01`, `CT-02`, `CT-05`, `CT-12` | Alineado en dominio y puertos |
| OBJ-08 confirmar compra | Carrito, Pedido, Pago, ReservaInventario | DS-01, DS-03, DS-04, DS-05, DS-06, DS-09 | `UC-01 Checkout` | `PI-12` (upstream `PI-11`) | `ADIN-01`; `ADOUT-02`, `ADOUT-03`, `ADOUT-04`, `ADOUT-07`, `ADOUT-09`, `ADOUT-10`, `ADOUT-11`, `ADOUT-12` | `CT-01`, `CT-02`, `CT-04`, `CT-06`, `CT-07`, `CT-12` | Alineado con `L-01`, `L-04`, `L-05`, `L-07`, `L-22`; `C-16` |
| OBJ-08/OBJ-12 consulta de pedido | Pedido, Pago, Envio, Factura, Devolucion, Reembolso | DS-01 | `UC-02 QueryOrder` | `PI-13` | `ADIN-01`; `ADOUT-03`, `ADOUT-05`, `ADOUT-06` | `CT-01`, `CT-10`, `CT-12` | Inferido; `L-17`, `L-19`, `L-23`, `L-26` |
| Cálculo monetario | Dinero, Pedido, ItemPedido | DS-05 | Checkout calcula; consulta solo lee snapshots | `PI-11`, `PI-12` | `ADIN-01`; `ADOUT-02`, `ADOUT-03` | `CT-01`, `CT-12` | Alineado en dominio y puertos |
| ORD-01…ORD-08 transiciones | Pedido, EstadoPedido, Pago, Envio | DS-06 | Checkout, pago, despacho, entrega, cancelación y cierre | `PI-12`, `PI-14`, `PI-15`, `PI-16`, `PI-17`, `PI-18`, `PI-19`, `PI-20`, `PI-21`, `PI-22` | `ADIN-01`; `ADOUT-03`, `ADOUT-04`, `ADOUT-07`, `ADOUT-08`, `ADOUT-09`, `ADOUT-10`, `ADOUT-11` | `CT-01`, `CT-02`, `CT-04`, `CT-05`, `CT-06`, `CT-07`, `CT-12` | Alineado en dominio y puertos |
| RET-01/RET-02 devolución | Devolucion, Pedido, Comprador | DS-07 | Solicitar, resolver y consultar devolución | `PI-21`, `PI-22`, `PI-23` | `ADIN-01`; `ADOUT-03`, `ADOUT-09`, `ADOUT-10` | `CT-01`, `CT-02`, `CT-04`, `CT-06`, `CT-12` | Alineado en dominio y puertos |
| REF-01/PAY-05 reembolso | Pago, Reembolso | DS-08 | Procesar y consultar reembolso | `PI-22`, `PI-23` | `ADIN-01`; `ADOUT-03`, `ADOUT-07`, `ADOUT-09` | `CT-01`, `CT-02`, `CT-04`, `CT-06`, `CT-12` | Alineado en dominio y puertos |
| AUD-01…AUD-06 auditoría | RegistroAuditoria | DS-09 | Auditar operación y consultar auditoría | `PI-25` y todos los casos que mutan estado | `ADIN-01`; `ADOUT-04`, `ADOUT-05` | `CT-01`, `CT-02`, `CT-03`, `CT-12` | Alineado en dominio y puertos |

**Lectura de la matriz:** la columna «Puerto(s)» identifica los puertos de entrada que exponen el caso de uso; los puertos de salida que cada uno consume están en `nexusmarket-output-ports.md` §7.1 y en la matriz PI→PO de `nexusmarket-input-ports.md` §7.3. La columna «Adaptador» identifica los adaptadores documentados y la columna «Contrato» referencia `CT-01`…`CT-13`; los contratos ejecutables siguen pendientes de aprobación.

---

## 11. Últimos cambios realizados

| Fecha | Archivo | Cambio |
|---|---|---|
| 2026-10-26 | `BackendSDD/DOCUMENTATION_STATUS.md` | Creación del registro de continuidad y de la matriz inicial de fuentes, conflictos, limitaciones y decisiones. |
| 2026-10-26 | `BackendSDD/Domain/nexusmarket-domain-object-values.md` | Creación del catálogo canónico de VOs: 47 entradas de inventario, familias de identificadores y nombres, VOs escalares, dirección/tiempo/trazabilidad, catálogos de estado, VOs auxiliares, validación, invariantes y trazabilidad. |
| 2026-10-26 | `BackendSDD/Domain/nexusmarket-domain-services.md` | Creación del catálogo de nueve servicios/políticas con veinte puntos cada uno, interacciones, matrices de reglas e invariantes, trazabilidad y equivalencias con los cinco servicios legados. |
| 2026-10-26 | `BackendSDD/Domain/services/` | Creación de la estructura de definiciones individuales y de los documentos `DS-01`, `DS-02` y `DS-03`, con la plantilla de diecisiete secciones. |
| 2026-10-26 | `BackendSDD/Domain/services/` | Creación de `DS-04` (`servicio-asignacion-bodega`), `DS-05` (`servicio-calculo-pedido`), `DS-06` (`politica-transicion-pedido`) y `DS-07` (`politica-elegibilidad-devolucion`), con reglas, invariantes, escenarios y trazabilidad. |
| 2026-10-26 | `BackendSDD/Domain/services/` | Creación de `DS-08` (`politica-reembolso`) y `DS-09` (`servicio-auditoria`), incluida la delimitación de saldo reembolsable, aprobación, minimización de payload y durabilidad de auditoría. |
| 2026-10-26 | `BackendSDD/DOCUMENTATION_STATUS.md` | Registro del alcance de la ejecución, inventario de definiciones individuales, convención de carpetas y conflictos `C-11`, `C-12` y `C-13`. |
| 2026-10-26 | `BackendSDD/DOCUMENTATION_STATUS.md` | Cierre de la ejecución: los nueve documentos pasan a `COMPLETO`; se añaden `L-15`, `DEC-BIZ-07` y `D-10`; se actualizan entregables, matriz de alcance, próximas acciones y bloque de relevo. |
| 2026-10-26 | `BackendSDD/Domain/services/` | Revisión cruzada final: enlaces relativos válidos, diecisiete secciones por documento, códigos locales marcados, referencias `DS-D-0x` corregidas y colisión `USR-03`/`USR-04` resuelta en `DS-01`. |
| 2026-10-26 | `BackendSDD/Application/nexusmarket-input-ports.md` | Creación del catálogo de 25 Input Ports (`PI-01`…`PI-25`) con diez puntos cada uno, inventario, convenciones, agrupaciones/descartes, matrices OBJ→PI y PI→PO, validación y limitaciones `L-16`…`L-24`. |
| 2026-10-26 | `BackendSDD/Application/nexusmarket-output-ports.md` | Creación del catálogo de 24 Output Ports (`PO-01`…`PO-24`) con diez puntos cada uno, inventario, convenciones, agrupaciones/descartes, matriz PO→consumidor, validación y limitaciones `L-01`…`L-25`. |
| 2026-10-26 | `BackendSDD/DOCUMENTATION_STATUS.md` | Registro de los catálogos de puertos en §3, §4 y §5; corrección de las rutas de servicios a archivos planos; adición de `C-15`, `L-16`…`L-25`, `D-11`…`D-15`; actualización de la matriz de trazabilidad y del bloque de relevo. |
| 2026-10-26 | `BackendSDD/Application/nexusmarket-use-cases-checkout-query-order.md` | Creación de `UC-01 Checkout` y `UC-02 QueryOrder` con contexto común, actores, entradas, flujos, errores, invariantes, idempotencia, transacciones, puertos, trazabilidad y límites. |
| 2026-10-26 | `BackendSDD/Application/nexusmarket-input-ports.md` | Corrección de `PI-12` para devolver una lista de pagos, uno por pedido (`C-16`); `PI-13` limitado por `L-26`, con errores de alcance alineados (`C-19`) y salida de lista/detalle precisada (`D-20`); conciliaciones documentadas. |
| 2026-10-26 | `BackendSDD/Application/nexusmarket-input-ports.md`, `BackendSDD/Application/nexusmarket-output-ports.md` | Reubicación de los catálogos desde `BackendSDD/Domain/` a `BackendSDD/Application/`, conforme a su contenido, al estado y a la arquitectura (`C-17`, `D-23`). |
| 2026-10-26 | `BackendSDD/Domain/services/*.md` | Corrección de enlaces relativos: rutas al modelo, VOs, catálogo, enunciado y arquitectura, y enlaces planos entre servicios; sin cambio de contenido normativo. |
| 2026-10-26 | `BackendSDD/DOCUMENTATION_STATUS.md` | Registro de `ENT-UC`, `C-16`…`C-19`, `L-26`, `D-16`…`D-23`; cierre/acotación de `L-17`, `L-22`, `L-23` y `L-25`; actualización de trazabilidad, próximas acciones y relevo. |
| 2026-10-26 | `BackendSDD/Adapters/nexusmarket-adapters.md` | Creación del catálogo con 14 adaptadores, agrupaciones justificadas, relaciones `PI`/`PO`, flujo, bloqueos y criterios de validación. |
| 2026-10-26 | `BackendSDD/Adapters/nexusmarket-adapter-*.md` | Creación de los 14 documentos individuales: `ADIN-01` y `ADOUT-01`…`ADOUT-13`, con las nueve secciones requeridas y sin código, SQL, endpoints, SDKs ni pruebas. |
| 2026-10-26 | `BackendSDD/DOCUMENTATION_STATUS.md` | Cierre de la ejecución de adaptadores: `ENT-AD` y los 14 documentos pasan a `COMPLETO`; se añaden `C-20`, `L-27`, `D-24`…`D-26`; se actualizan inventario, trazabilidad, próximas acciones y relevo. |
| 2026-10-26 | `BackendSDD/Adapters/nexusmarket-adapter-*.md` | Corrección de seis desalineaciones detectadas por Contract Alignment (`C-21`, `D-27`): códigos de error y estados normalizados alineados con `PO-01`…`PO-04`, `PO-19`…`PO-22` y `PO-24`; sin cambios en los puertos. |
| 2026-10-26 | `BackendSDD/Contracts/nexusmarket-contract-alignment.md` | Inicio de Contract Alignment: inventario `CT-01`…`CT-13`, matriz de flujos, estados, correcciones y bloqueos. |
| 2026-10-26 | `BackendSDD/Contracts/nexusmarket-contract-alignment.md`, `BackendSDD/DOCUMENTATION_STATUS.md` | Cierre de Contract Alignment: `ENT-CA` pasa a `COMPLETO`; se registran `C-21`, `D-27`…`D-30`; se actualizan la matriz de contratos, las próximas acciones y el relevo. No se crearon OpenAPI, esquemas ejecutables, SDKs ni código. |
| 2026-10-26 | `README.md` | Reescritura integral: descripción del marketplace, estado de la especificación, alcance, stack, arquitectura, modelo de dominio, puertos, adaptadores, contratos, estructura, índices de documentación, convenciones, hoja de ruta, decisiones abiertas y licencia. Alineado con `BackendSDD/`; no se creó código ni contratos ejecutables. |

---

## 12. Próximas acciones priorizadas

1. Los catálogos de Input Ports (`PI-01`…`PI-25`), Output Ports (`PO-01`…`PO-24`), los casos de uso `UC-01`/`UC-02` y los 14 adaptadores están completos y validados; no se modificó el contenido normativo del modelo, los VOs, los servicios ni la arquitectura.
2. Resolver `DEC-BIZ-01`…`DEC-BIZ-07` antes de implementar las políticas variables (dirección, plazo, motivos, bodega, moneda, estado comercial y autorización financiera).
3. Mantener abiertas las limitaciones que condicionan contratos e implementaciones: `L-27` (contrato HTTP/OpenAPI), `L-17` (numeración/serie fiscal), `L-22` (protocolo de pago), `L-23` (integración logística), `L-24` (notificaciones), `L-18` (entrega digital), `L-13` (formato de ids), `L-19` (reportes) y `L-26` (asignación de operador); `L-16`, `L-12`, `L-20` y `L-06` ya están cerradas por decisiones W1; `L-25` queda cerrada a nivel de diseño por `D-16`.
4. **Contract Alignment completado.** El documento `BackendSDD/Contracts/nexusmarket-contract-alignment.md` verificó la cadena y corrigió `C-21`; los contratos `CT-01`…`CT-13` tienen estado y bloqueo. La siguiente acción no es crear contratos ejecutables, sino cerrar las decisiones externas: HTTP/OpenAPI (`L-27`), eventos/outbox (`L-14`), proveedores (`L-22`, `L-23`, `L-24`, `L-18`), identificadores (`L-13`), facturación (`L-17`) y reportes (`L-19`). Las credenciales ya tienen política (`DEC-W1-008`). Después podrá iniciarse una ejecución de contrato ejecutable/implementación.
5. Mantener la trazabilidad requisito → dominio → servicio → caso de uso → puerto → adaptador → contrato al crear cada documento nuevo.
6. No reintroducir `SDD/` ni los cinco servicios legados como canónicos; no convertir las derivaciones locales de reglas en códigos normativos sin aprobación; no inventar reglas, protocolos, rutas ni algoritmos para las limitaciones abiertas.

---

## 13. Bloque obligatorio de relevo

- **Última tarea completada:** actualización integral de `README.md`, alineada con `BackendSDD/`: descripción, estado, alcance, stack, arquitectura, dominio, puertos, adaptadores, contratos, estructura, índices, convenciones, hoja de ruta y decisiones abiertas. No se creó código, OpenAPI ni contratos ejecutables. Se mantiene cerrado Contract Alignment en `BackendSDD/Contracts/nexusmarket-contract-alignment.md`, con cadena requisito → regla → dominio → caso de uso → `PI` → `PO` → adaptador → contrato, inventario `CT-01`…`CT-13`, matriz de 13 flujos, estados de alineación, bloqueos y correcciones; se corrigieron seis desalineaciones (`C-21`) y se registraron `D-27`…`D-30`.
- **Documento(s) modificado(s):** `README.md` (reescritura integral) y `BackendSDD/DOCUMENTATION_STATUS.md` en esta tanda. En la tanda de Contract Alignment: `BackendSDD/Contracts/nexusmarket-contract-alignment.md` (nuevo); `BackendSDD/Adapters/nexusmarket-adapter-sql-identity-profiles.md`, `...-sql-reporting-query.md`, `...-digital-delivery.md`, `...-system-clock.md`, `...-id-generator.md` y `...-password-hasher.md` (correcciones `C-21`). No se modificó el modelo, los VOs, los servicios, la arquitectura, los puertos ni los casos de uso.
- **Documento actualmente en progreso:** ninguno; Contract Alignment está cerrado como documentación.
- **Fuentes de verdad consultadas:** `Prompt-maestro-documentacion.md` (§5.8); `enunciado.md` (OBJ-01…OBJ-12); `nexusmarket-arquitectura.md` (§8, §9, §11.2 y §16); `nexusmarket-domain-model.md` (§6–§24, especialmente §15.1 y §20); `nexusmarket-domain-object-values.md` (§6–§9); `nexusmarket-domain-services.md` y los nueve servicios; `nexusmarket-input-ports.md`; `nexusmarket-output-ports.md`; `nexusmarket-use-cases-checkout-query-order.md`; el catálogo y los 14 documentos de adaptadores; el documento de Contract Alignment; y este estado.
- **Decisiones adoptadas en esta tanda:** `D-27` (adaptadores usan exactamente códigos/estados del puerto), `D-28` (Contract Alignment es un documento de verificación, no un contrato ejecutable), `D-29` (sobre de eventos limitado a `[MOD]` §20 y `PO-23`) y `D-30` (`CT-01` y flujos HTTP quedan como propuesta/sin evidencia, no `ALINEADO`). Se mantienen D-01…D-26, VO-D-01…VO-D-07 y DS-D-01…DS-D-09.
- **Decisiones que requieren aprobación:** DEC-BIZ-01, DEC-BIZ-03, DEC-BIZ-04, DEC-BIZ-05, DEC-BIZ-06 y DEC-BIZ-07; además, `L-27` (contrato HTTP/OpenAPI), `L-17`, `L-18`, `L-19`, `L-21`, `L-22`, `L-23`, `L-24`, `L-26` y `L-13` requieren decisión externa antes de cerrar contratos ejecutables e implementaciones. `L-16`, `L-12`, `L-20` y `L-06` están cerradas por `DEC-W1-007`, `DEC-W1-008` y `DEC-W1-002`. `L-25` queda cerrada a nivel de diseño con `D-16`; sus valores numéricos quedan en configuración.
- **Conflictos abiertos:** `C-20` acotado (verificación de webhooks, dependiente de `L-22`/`L-23`). `C-21` resuelto documentalmente (códigos/estados de adaptadores alineados a los puertos). C-01 a C-19 resueltos por jerarquía, consistencia, seguridad o acotación. `C-15` registra la discrepancia de `[ARQ]` §9.3; `C-16` fija un pago por pedido; `C-17` restaura la ubicación de los puertos; `C-18` acota el alcance del operador y registra `L-26`; `C-19` alinea la no divulgación de existencia en `PI-13`.
- **Limitaciones abiertas:** L-01 a L-27, con L-06/L-12/L-16/L-20 cerradas; las más bloqueantes para contratos ejecutables son `L-27` (HTTP/OpenAPI), `L-17` (numeración/serie fiscal), `L-22` (protocolo de pago), `L-23` (integración logística), `L-24` (notificaciones), `L-18` (entrega digital), `L-13` (formato de ids) y `L-19` (reportes). `L-14`, `L-11` y `L-15` condicionan eventos y auditoría. `L-26` sigue abierta y acotada; `L-25` queda cerrada a nivel de diseño. La visibilidad field-level y la auditoría de lecturas siguen como decisiones futuras no numeradas en `UC-02`.
- **Documentos que requieren actualización:** arquitectura si el equipo decide alinearla con la estructura vigente; el README ya está alineado con `BackendSDD/` (2026-10-26). En una ejecución posterior, los artefactos ejecutables de `CT-01`…`CT-12` (OpenAPI, esquemas de eventos, contratos de proveedor, migraciones y SDKs). No se requiere cambiar los adaptadores mientras los contratos no se aprueben.
- **Siguiente acción exacta:** cerrar las decisiones externas que bloquean los contratos: `L-27` y autenticación; `L-14` y catálogo de eventos; `L-22`, `L-23`, `L-24` y `L-18`; `L-13`; `L-17` y `L-19`. Después podrá iniciarse una ejecución de contrato ejecutable/implementación. No crear endpoints, SDKs, esquemas ejecutables ni código antes de cada aprobación.
- **Instrucciones para el agente entrante:** leer este estado y el documento de Contract Alignment; respetar `BackendSDD/` como raíz documental; no resucitar `SDD/`; no reintroducir los cinco servicios legados como canónicos; no crear código, endpoints, contratos ejecutables ni pruebas en esta ejecución; no inventar rutas, protocolos, algoritmos, formatos ni reglas de negocio; mantener los servicios como archivos planos en `BackendSDD/Domain/services/<nombre-canónico>.md`; conservar la dirección de dependencias (entrada → `PI`; aplicación → `PO`; adaptadores implementan `PO`); no añadir códigos/estados no declarados por un puerto (`D-27`); y no presentar como normativos los códigos marcados como derivaciones locales (D-10).
