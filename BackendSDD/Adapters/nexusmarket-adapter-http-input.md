# NEXUSMARKET — ADIN-01 Adaptador de entrada HTTP

**Identificador:** `ADIN-01`  
**Tipo:** adaptador de entrada  
**Capa/módulo:** `src/modules/<módulo>/adapters/http/` y `src/infrastructure/http/` según `[ARQ]` §4 y §8  
**Estado documental:** `COMPLETO` con bloqueo `L-27`  
**Última actualización:** 26 de octubre de 2026  
**Documento canónico:** este archivo  
**Catálogo:** [`nexusmarket-adapters.md`](nexusmarket-adapters.md)

---

## 1. Identificación y propósito

El adapter HTTP es el límite de entrada de NEXUSMARKET. Su responsabilidad es recibir peticiones HTTP, validar su forma, autenticar e identificar al actor, construir el contexto de invocación y llamar al puerto de entrada correspondiente. Después traduce el resultado de aplicación a una respuesta HTTP y los errores a un formato público estable.

Resuelve una necesidad concreta: permitir que actores externos invoquen las capacidades `PI-01`…`PI-25` sin que la aplicación dependa de HTTP, de un framework, de DTOs de transporte ni de mecanismos de autenticación.

No es un caso de uso, un servicio de aplicación, un repositorio ni un proveedor. No decide autorización de negocio, transiciones, cálculos, elegibilidad, saldos ni reglas de dominio.

---

## 2. Límites arquitectónicos

| Aspecto | Definición |
|---|---|
| Capa | Adaptador de entrada; depende de puertos de entrada, nunca de adapters de salida. |
| Frontera | HTTP/JSON (u otro formato público aprobado) → `PI-01`…`PI-25`. |
| Dependencias permitidas | Puertos de entrada, utilidades de validación de borde, autenticación/middleware, logger y correlación. |
| Dependencias prohibidas | Dominio como sustituto de la aplicación, repositorios concretos, SQL, MongoDB, SDKs de proveedores, reglas de negocio. |
| Componentes que lo usan | Clientes, actores y sistemas externos autorizados. |
| Composición | El punto de composición construye el adapter y le inyecta los puertos de entrada. |

**No le corresponde:** decidir si un actor puede operar sobre un recurso, cambiar estados, calcular importes, reservar inventario, emitir facturas, procesar reembolsos, persistir datos o invocar proveedores directamente.

---

## 3. Puertos y contratos relacionados

| Relación | Puertos | Propósito | Dirección | Resultado |
|---|---|---|---|---|
| Invoca | `PI-01`…`PI-25` | Ejecutar la capacidad solicitada por el actor. | Adapter → puerto de entrada | `EXITO`, `RECHAZO` o `ERROR` según `[PI]` §4.2. |
| Usa contexto | `[PI]` §4.1 | Construir `actorId`, `rolActor`, `correlationId`, `motivo`, `idempotencyKey` y `versionEsperada` cuando corresponda. | Adapter → puerto | Contexto completo y coherente con la petición. |
| No implementa | `PO-01`…`PO-24` | La persistencia y las integraciones pertenecen a adapters de salida. | — | No hay acceso directo. |

El adapter no define nuevos puertos. Las capacidades y sus datos conceptuales están en `[PI]` §5. Si una ruta o un DTO requiere un dato que el puerto no contempla, se registra la discrepancia; no se amplía el contrato por conveniencia del transporte.

---

## 4. Flujo conceptual

1. Un cliente envía una petición HTTP a una operación pública o protegida.
2. El middleware aplica límites transversales: tamaño, correlación, observabilidad y controles de exposición definidos.
3. El adapter autentica al actor y obtiene su identidad. El mecanismo concreto no está aprobado (`L-27`); no se prescribe token, sesión ni proveedor de identidad.
4. El adapter valida la forma y los tipos de la solicitud contra el esquema público correspondiente. Esta validación es técnica, no de negocio.
5. El adapter construye el contexto de invocación de `[PI]` §4.1. No acepta roles, propietarios ni alcances declarados en el cuerpo como prueba de autorización.
6. El adapter invoca el puerto de entrada que corresponde a la capacidad.
7. El puerto devuelve `EXITO`, `RECHAZO` o `ERROR`.
8. El adapter mapea el resultado a la respuesta pública: datos permitidos, código estable, mensaje seguro y correlación.
9. Los detalles técnicos se registran en logs protegidos; no se devuelven al cliente.

**Webhooks de proveedores:** si se habilitan eventos de pago o logística, entran por el límite HTTP y se dirigen a `PI-15` o `PI-18`. La autenticidad del evento debe verificarse antes de invocar el puerto. La ubicación exacta de esa verificación y el mecanismo concreto dependen de `L-22`/`L-23`; se registra como conciliación `C-20`, sin crear un puerto nuevo.

---

## 5. Transformación y traducción de datos

| Elemento | Tratamiento |
|---|---|
| DTO HTTP | Estructura propia del transporte; nunca se pasa al dominio ni se usa como agregado. |
| Comando/consulta | Se construye a partir del DTO y del contexto; el puerto recibe datos conceptuales, no el objeto HTTP. |
| Identidad | Se extrae de la autenticación y se propaga como contexto; el cuerpo no es fuente de identidad. |
| Fechas y números | Se validan formato, rango y tipo; la semántica de negocio (por ejemplo, moneda o plazo) no se decide aquí. |
| Datos ausentes | Se rechazan si el contrato los exige; no se inventan valores por defecto de negocio. |
| Datos inválidos | Se devuelve un rechazo de validación con detalles seguros, sin filtrar información interna. |
| Resultado | Se seleccionan solo los campos públicos autorizados; no se expone el agregado completo ni datos de otros actores. |
| Errores | Se traducen a un formato uniforme con código estable, mensaje seguro, correlación y detalles de validación cuando proceda. |

**Separación de validaciones:** el adapter valida forma, tipos, campos obligatorios y límites de transporte. Las invariantes de negocio se protegen en dominio y aplicación; el adapter no las sustituye. La autorización por rol y recurso se decide con `DS-01` en la aplicación (`[PI]` §4.1, `[UC]` §4).

---

## 6. Errores y resultados excepcionales

| Situación | Responsabilidad del adapter | Resultado público |
|---|---|---|
| Petición mal formada o tipo inválido | Rechazar antes de invocar el puerto. | Error de validación seguro, con detalles permitidos. |
| Identidad ausente en capacidad protegida | No invocar el puerto; devolver rechazo de identidad. | Código estable de identidad ausente. |
| Puerto devuelve `RECHAZO` | Conservar el código y el mensaje seguro; mapear al formato público. | Respuesta de rechazo; no se aplican efectos. |
| Puerto devuelve `ERROR` | No exponer detalles internos; registrar correlación y causa técnica protegida. | Error público uniforme. |
| Conflicto de concurrencia o idempotencia | Propagar el código del puerto sin reinterpretarlo como regla de negocio. | Rechazo de conflicto. |
| Dependencia no disponible | No simular éxito; traducir a error de dependencia. | Error público seguro. |
| Webhook no auténtico | Rechazar antes de invocar `PI-15`/`PI-18`. | Rechazo de autenticidad, sin revelar detalles. |
| Error inesperado | Registrar y devolver un error genérico con correlación. | Error público sin stack trace. |

El adapter no inventa códigos HTTP, políticas de reintento, tiempos de espera ni garantías transaccionales. El contrato HTTP/OpenAPI no está aprobado (`L-27`); los códigos y esquemas públicos quedan pendientes de esa decisión.

---

## 7. Dependencias y restricciones

| Dependencia | Tipo | Uso |
|---|---|---|
| Framework HTTP | Decisión técnica no fijada | `[ARQ]` §2.1 recomienda Fastify o Express, sin mezclar; la elección definitiva no está aprobada. |
| Validación de esquemas | Decisión técnica no fijada | `[ARQ]` §2.1 propone Zod u otra biblioteca; no se prescribe. |
| Autenticación/identidad | Decisión externa | Mecanismo no aprobado (`L-27`); el adapter solo consume la identidad ya autenticada. |
| OpenAPI | Contrato futuro | `[ARQ]` §8.4 exige `api/openapi.yaml`; no existe contrato aprobado en esta ejecución. |
| Logger/correlación | Infraestructura | Registro estructurado y correlación; sin secretos. |
| Límites de tasa/CORS | Decisión operativa | Se aplican cuando los requisitos de exposición los determinen. |

**Restricciones:** no se prescriben rutas, métodos, códigos HTTP, versionado, esquemas de autenticación ni formatos públicos. No se usan DTOs HTTP en dominio ni se consultan repositorios desde handlers. No se permite que el adapter sea la única protección de autorización.

---

## 8. Trazabilidad

| Decisión/regla | Fuente |
|---|---|
| Capa de adaptadores de entrada | `[ARQ]` §3.3, §3.5, §16 |
| Responsabilidades HTTP | `[ARQ]` §8.1 |
| Validación y DTOs | `[ARQ]` §8.2 |
| Errores HTTP | `[ARQ]` §8.3 |
| OpenAPI | `[ARQ]` §8.4 |
| Contexto de invocación | `[PI]` §4.1 |
| Resultado de aplicación | `[PI]` §4.2 |
| Catálogo de errores | `[PI]` §4.3 |
| Autorización por recurso | `[ARQ]` §11.2; `[PI]` §4.4; `[UC]` §4 |
| Webhooks y verificación | `[PI]` `PI-15`, `PI-18`; `[PO]` `PO-16`, `PO-17`; `C-20` |
| Bloqueo de contrato HTTP | `L-27` en `[EST]` §7 |

---

## 9. Criterios de validación documental

- [x] El adapter tiene una responsabilidad de traducción y no contiene reglas de negocio.
- [x] Invoca `PI-01`…`PI-25` y no implementa puertos de salida.
- [x] Construye el contexto de `[PI]` §4.1 y no confía en roles del cuerpo.
- [x] Distingue validación de formato de validación de negocio.
- [x] Mapea `EXITO`, `RECHAZO` y `ERROR` sin inventar códigos HTTP.
- [x] No expone DTOs, agregados, filas, documentos ni detalles internos.
- [x] Reconoce `L-27` y no inventa rutas, métodos, autenticación ni versionado.
- [x] Los webhooks se documentan como entrada HTTP con verificación previa; `C-20` registra la tensión con `PO-16`/`PO-17`.
- [x] Las dependencias apuntan a puertos de entrada y no a adapters de salida.
- [x] No se creó código, pseudocódigo ni endpoint ejecutable.
