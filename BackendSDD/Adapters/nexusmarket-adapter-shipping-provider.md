# NEXUSMARKET — ADOUT-08 Proveedor logístico

**Identificador:** `ADOUT-08`  
**Tipo:** adaptador de salida / integración externa  
**Capa/módulo:** `src/modules/shipping/adapters/` (ubicación propuesta)  
**Estado documental:** `COMPLETO` con bloqueo `L-23`  
**Última actualización:** 26 de octubre de 2026  
**Documento canónico:** este archivo  
**Catálogo:** [`nexusmarket-adapters.md`](nexusmarket-adapters.md)

---

## 1. Identificación y propósito

Este adapter implementa `PO-17 ShippingProvider`. Su propósito es abstraer la asignación de transporte, la creación de guías, el seguimiento, la recepción de eventos del operador logístico y la cancelación cuando el proveedor lo permita. Devuelve estados normalizados, tracking y evidencia, sin exponer datos personales innecesarios.

No decide el estado interno del envío, no consume inventario, no elige bodega y no confirma pagos. El proveedor, los eventos de tracking, el formato de evidencia y los reintentos no están definidos (`L-23`).

---

## 2. Límites arquitectónicos

| Aspecto | Definición |
|---|---|
| Capa | Adaptador de salida / integración externa. |
| Frontera | Contrato `PO-17` ↔ API/SDK del operador logístico. |
| Dependencias permitidas | `PO-17`, cliente/SDK del proveedor, configuración, logger y verificación de eventos. |
| Dependencias prohibidas | Dominio, HTTP de la aplicación, repositorios SQL, reglas de pedido/inventario. |
| Consumidores | `PI-17`, `PI-18` a través de la aplicación. |
| Composición | El punto de composición inyecta el adapter y sus credenciales. |

**No le corresponde:** decidir la transición del envío, consumir reservas, calcular cantidades, elegir transportista por política comercial, confirmar entrega sin evidencia ni modificar el pedido.

---

## 3. Puertos y contratos relacionados

| Puerto | Relación | Propósito | Dirección | Resultado |
|---|---|---|---|---|
| `PO-17 ShippingProvider` | Implementa | Asignar transporte, crear guía, consultar estado, recibir evento, cancelar. | Aplicación → adapter → proveedor | Transportista, servicio, tracking, estado normalizado y evidencia. |
| `PI-17 DispatchOrder` | Consumidor indirecto | Despachar y registrar salida. | Aplicación → `PO-17` | Guía/tracking para la aplicación. |
| `PI-18 ConfirmDelivery` | Consumidor indirecto | Registrar entrega o fallo. | Aplicación → `PO-17` | Evento normalizado con evidencia. |

**Webhooks:** los eventos del transportista entran por `ADIN-01` y se dirigen a `PI-18`. La autenticidad debe verificarse antes de invocar el puerto. `PO-17` atribuye la verificación al adaptador logístico; `PI-18` exige un evento verificado. La conciliación se registra como `C-20`; no se crea un puerto nuevo.

---

## 4. Flujo conceptual

1. La aplicación solicita asignar transporte con `EnvioId`, origen, destino, líneas/cantidades, servicio y clave idempotente.
2. El adapter minimiza la dirección y traduce la solicitud al protocolo del proveedor.
3. El proveedor responde con transportista, servicio, guía y estado; el adapter normaliza y devuelve.
4. Para consultar, el adapter envía el tracking o `EnvioId` y normaliza el estado.
5. Para recibir un evento, el adapter verifica autenticidad, correlaciona con el envío y normaliza el evento.
6. Para cancelar, el adapter envía la solicitud solo si el proveedor lo permite.
7. La aplicación decide la transición y registra evidencia; el adapter no modifica el dominio.

---

## 5. Transformación y traducción de datos

| Elemento | Traducción |
|---|---|
| Envío | `EnvioId`, origen, destino, líneas/cantidades y servicio → solicitud del proveedor. |
| Dirección | Se minimiza; solo se envían los datos necesarios para la entrega. |
| Estado externo | Estado del proveedor → catálogo normalizado (`PREPARADO`, `EN_TRANSITO`, `ENTREGADO`, `FALLIDO`, `CANCELADO`). |
| Tracking | Identificador del proveedor → valor opaco para el puerto. |
| Evidencia | Evento/entrega → evidencia y fecha; no se inventa un formato no definido (`L-23`). |
| Evento | Payload del proveedor → evento verificado, correlacionado y minimizado. |
| Datos personales | No se devuelven datos innecesarios; no se registran en claro sin necesidad. |

**Validación técnica vs. negocio:** el adapter valida dirección mínima, líneas, servicio y formato de respuesta. No decide si el envío está preparado, si la entrega es válida, si el pedido puede cerrarse ni si se consume inventario; esas decisiones pertenecen a `DS-06`, `DS-03` y a la aplicación.

---

## 6. Errores y resultados excepcionales

| Código | Situación | Responsabilidad del adapter |
|---|---|---|
| `FALLO_PROVEEDOR` | El transportista rechazó o falló. | Traducir a error seguro; no declarar entrega. |
| `NO_DISPONIBLE` | Proveedor no configurado o caído. | Informar indisponibilidad. |
| `DATOS_INVALIDOS` | Dirección, líneas o servicio inválidos. | Rechazar antes de llamar al proveedor. |
| `IDEMPOTENCIA_CONFLICTO` | La clave se usó con otro envío. | Rechazar sin duplicar efectos. |
| `OPERACION_NO_SOPORTADA` | El proveedor no permite cancelar/consultar. | Informar; no inventar una alternativa. |
| `LIMITE_EXCEDIDO` | Timeout o límite del proveedor. | Informar; no reintentar indefinidamente. |

No se inventan códigos HTTP, eventos, formato de evidencia, ventanas de reintento ni una máquina de estados del proveedor. `L-23` sigue abierto.

---

## 7. Dependencias y restricciones

| Dependencia | Tipo | Restricción |
|---|---|---|
| Operador logístico | Externo | No definido (`L-23`); no se prescribe SDK, protocolo ni credenciales. |
| Configuración de secretos | Infraestructura | Fuera del repositorio; no se registra. |
| `PO-17` | Contrato | No se amplía con datos personales innecesarios ni estados no normalizados. |
| `PO-11` | Persistencia | El adapter no persiste el envío; la aplicación usa `PO-11`. |
| `L-23` | Bloqueo | Proveedor, eventos, evidencia y reintentos no están cerrados. |

**Restricciones:** no se consume inventario; no se confirma entrega sin evidencia; no se modifica el dominio directamente; no se usa el adapter para notificar o facturar; no se simula una transacción distribuida.

---

## 8. Trazabilidad

| Elemento | Fuente |
|---|---|
| Existencia y responsabilidad | `[ARQ]` §7.3, §9.4; `[PO]` §5.3 |
| Contrato | `[PO]` `PO-17` |
| Envío | `[MOD]` §13.1–§13.3; `[VO]` §8.14; `[DS]` `DS-06` |
| Despacho/entrega | `[PI]` `PI-17`, `PI-18`; `[UC]` `UC-01` |
| Webhooks | `[PI]` `PI-18`; `C-20` |
| Bloqueo | `[EST]` §7, `L-23` |

---

## 9. Criterios de validación documental

- [x] El adapter implementa `PO-17` y no decide transiciones ni inventario.
- [x] Normaliza estados, tracking y evidencia.
- [x] Minimiza la dirección y no expone datos personales innecesarios.
- [x] Preserva idempotencia y correlación.
- [x] Los webhooks se verifican antes de `PI-18`; `C-20` registra la tensión de ubicación.
- [x] `L-23` se registra sin inventar protocolo, eventos ni reintentos.
- [x] No se creó código, SDK, endpoint, webhook ejecutable ni credencial.
