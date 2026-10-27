# NEXUSMARKET — ADOUT-09 Envío de notificaciones

**Identificador:** `ADOUT-09`  
**Tipo:** adaptador de salida / integración externa  
**Capa/módulo:** `src/shared/infrastructure/` o `src/shared/adapters/` según composición  
**Estado documental:** `COMPLETO` con bloqueo `L-24`  
**Última actualización:** 26 de octubre de 2026  
**Documento canónico:** este archivo  
**Catálogo:** [`nexusmarket-adapters.md`](nexusmarket-adapters.md)

---

## 1. Identificación y propósito

Este adapter implementa `PO-18 NotificationSender`. Su propósito es entregar una notificación a un actor por un canal externo, traduciendo la intención de la aplicación (destinatario, canal, código/plantilla, variables y correlación) al protocolo del proveedor. Devuelve aceptación/rechazo e identificador de mensaje; no modifica el estado de negocio.

No decide cuándo notificar, qué plantilla de negocio usar, qué consentimiento aplica ni qué canal es obligatorio. El catálogo de notificaciones, canales y consentimiento no está definido (`L-24`).

---

## 2. Límites arquitectónicos

| Aspecto | Definición |
|---|---|
| Capa | Adaptador de salida / integración externa. |
| Frontera | Contrato `PO-18` ↔ proveedor de correo/SMS/push u otro canal autorizado. |
| Dependencias permitidas | `PO-18`, cliente/SDK del proveedor, configuración, logger y reloj si se requiere. |
| Dependencias prohibidas | Dominio, HTTP de la aplicación, repositorios, reglas de pedido/pago, auditoría como sustituto. |
| Consumidores | Casos de uso que notifican (`PI-01`, `PI-02`, `PI-12`, `PI-15`, `PI-17`–`PI-23`, según política). |
| Composición | El punto de composición inyecta el adapter y sus credenciales. |

**No le corresponde:** decidir el contenido de negocio, la plantilla, el consentimiento, la obligación de notificar, el estado del pedido ni la auditoría. No sustituye el outbox.

---

## 3. Puertos y contratos relacionados

| Puerto | Relación | Propósito | Dirección | Resultado |
|---|---|---|---|---|
| `PO-18 NotificationSender` | Implementa | Entregar notificación con destinatario, canal, plantilla/código, variables, correlación e idempotencia. | Aplicación → adapter → proveedor | Aceptación/rechazo, identificador de mensaje y estado si existe. |
| `PI-01`, `PI-02`, `PI-12`, `PI-15`, `PI-17`–`PI-23` | Consumidores indirectos | Solicitar notificación cuando la política lo requiera. | Aplicación → `PO-18` | Resultado de envío; no cambia el estado de negocio. |

**Relación con outbox:** si la notificación es un efecto crítico, la aplicación registra el evento en `PO-23` y el relay invoca `PO-18`. El adapter no escribe el outbox ni decide la política de reintento.

---

## 4. Flujo conceptual

1. La aplicación decide que debe notificar y construye la intención con destinatario, canal, código/plantilla, variables, correlación y clave idempotente cuando corresponda.
2. El adapter valida que el destinatario, canal y plantilla sean técnicamente utilizables.
3. Traduce la intención al protocolo del proveedor y minimiza los datos enviados.
4. El proveedor acepta o rechaza el mensaje; el adapter normaliza la respuesta.
5. El adapter devuelve aceptación/rechazo e identificador de mensaje.
6. Si el proveedor falla, el adapter devuelve un error seguro; no declara entrega final.
7. La aplicación decide si reintenta o registra el fallo según la política; el adapter no cambia el estado de negocio.

---

## 5. Transformación y traducción de datos

| Elemento | Traducción |
|---|---|
| Destinatario | Correo/teléfono/identificador → dirección del proveedor; se minimiza y no se registra innecesariamente. |
| Canal | `CORREO`, `SMS`, `PUSH` u otro autorizado → adaptador/proveedor del canal. |
| Plantilla/código | Código estable → identificador de plantilla del proveedor; no se decide el contenido de negocio. |
| Variables | Pares de datos → campos de la plantilla; se excluyen secretos y datos sensibles innecesarios. |
| Correlación | `CorrelationId` → metadato de trazabilidad del mensaje. |
| Idempotencia | Clave → deduplicación cuando el proveedor la soporta; no se inventa una garantía. |
| Resultado | Respuesta del proveedor → aceptación/rechazo, id de mensaje y estado de entrega si existe. |

**Validación técnica vs. negocio:** el adapter valida formato de destinatario, canal y plantilla. No decide la política de consentimiento, la plantilla comercial ni el momento de la notificación; esas decisiones pertenecen a la aplicación y a `L-24`.

---

## 6. Errores y resultados excepcionales

| Código | Situación | Responsabilidad del adapter |
|---|---|---|
| `DATOS_INVALIDOS` | Destinatario, canal o plantilla inválidos. | Rechazar antes de enviar. |
| `NO_DISPONIBLE` | Canal/proveedor no configurado o caído. | Informar indisponibilidad. |
| `FALLO_PROVEEDOR` | El proveedor rechazó el envío. | Traducir a error seguro; no declarar entrega final. |
| `LIMITE_EXCEDIDO` | Rate limit o timeout. | Informar; no reintentar indefinidamente. |
| `IDEMPOTENCIA_CONFLICTO` | La clave se usó con otro mensaje. | Rechazar sin duplicar. |

No se inventan canales, plantillas, consentimiento, códigos HTTP, reintentos ni garantías de entrega. `L-24` sigue abierto.

---

## 7. Dependencias y restricciones

| Dependencia | Tipo | Restricción |
|---|---|---|
| Proveedor de correo/SMS/push | Externo | No definido (`L-24`); no se prescribe SDK ni proveedor. |
| Configuración de secretos | Infraestructura | Fuera del repositorio; no se registra. |
| `PO-18` | Contrato | No se amplía con plantillas de negocio ni consentimiento. |
| `PO-23` | Outbox | Coordina efectos críticos; el adapter no lo sustituye. |
| `L-24` | Bloqueo | Canales, plantillas y consentimiento no están cerrados. |

**Restricciones:** no se envían secretos, credenciales ni datos completos de pago; el contenido se minimiza; el envío no cambia el estado de negocio; no se garantiza entrega final por una aceptación; no se usa el adapter para auditoría.

---

## 8. Trazabilidad

| Elemento | Fuente |
|---|---|
| Existencia y responsabilidad | `[ARQ]` §7.3; `[PO]` §5.3 |
| Contrato | `[PO]` `PO-18` |
| Consumidores | `[PO]` §7.2; `[PI]` §5 |
| Outbox | `[PO]` `PO-23`; `[ARQ]` §9.4 |
| Comunicación operativa | `[ENU]` OBJ-01…OBJ-12; `[PM]` §5.5 |
| Bloqueo | `[EST]` §7, `L-24` |

---

## 9. Criterios de validación documental

- [x] El adapter implementa `PO-18` y no modifica el estado de negocio.
- [x] Traduce destinatario, canal, plantilla, variables y correlación.
- [x] Minimiza datos y excluye secretos.
- [x] Preserva idempotencia cuando existe clave.
- [x] No decide consentimiento, plantilla ni momento de notificación.
- [x] `L-24` se registra sin inventar canales ni proveedores.
- [x] No se creó código, SDK, plantilla ejecutable ni credencial.
