# NEXUSMARKET — ADOUT-07 Pasarela de pagos

**Identificador:** `ADOUT-07`  
**Tipo:** adaptador de salida / integración externa  
**Capa/módulo:** `src/modules/payments/adapters/` (ubicación propuesta)  
**Estado documental:** `COMPLETO` con bloqueo `L-22`  
**Última actualización:** 26 de octubre de 2026  
**Documento canónico:** este archivo  
**Catálogo:** [`nexusmarket-adapters.md`](nexusmarket-adapters.md)

---

## 1. Identificación y propósito

Este adapter implementa `PO-16 PaymentGateway`. Su propósito es abstraer la comunicación con un proveedor de pagos: iniciar un pago, consultar su estado, confirmar/capturar cuando corresponda, cancelar un intento si el proveedor lo permite y solicitar un reembolso. Devuelve referencias y estados normalizados, sin exponer datos completos de tarjeta ni payloads crudos.

No decide el estado del pedido, no aprueba reembolsos, no emite facturas y no sustituye la conciliación financiera. El proveedor concreto, el protocolo, el modelo autorización/captura, los reintentos y la cancelación no están definidos (`L-22`).

---

## 2. Límites arquitectónicos

| Aspecto | Definición |
|---|---|
| Capa | Adaptador de salida / integración externa. |
| Frontera | Contrato `PO-16` ↔ API/SDK del proveedor de pagos. |
| Dependencias permitidas | `PO-16`, cliente/SDK del proveedor, configuración de credenciales, logger y verificación de eventos. |
| Dependencias prohibidas | Dominio, HTTP de la aplicación, repositorios SQL, reglas de pedido, emisión de facturas. |
| Consumidores | `PI-12`, `PI-14`, `PI-15`, `PI-23` a través de la aplicación. |
| Composición | El punto de composición inyecta el adapter y sus credenciales. |

**No le corresponde:** decidir si un pago es válido para el pedido, cambiar el estado del pedido, aprobar un reembolso, calcular importes, emitir facturas, notificar al comprador ni almacenar datos de tarjeta.

---

## 3. Puertos y contratos relacionados

| Puerto | Relación | Propósito | Dirección | Resultado |
|---|---|---|---|---|
| `PO-16 PaymentGateway` | Implementa | Iniciar, consultar, confirmar/capturar, cancelar y reembolsar. | Aplicación → adapter → proveedor | Referencia, estado normalizado, importe, código de rechazo seguro. |
| `PI-15 ConfirmPayment` | Consumidor indirecto | Registrar el resultado verificado de un pago. | Aplicación → `PO-16` | Estado normalizado para la aplicación. |
| `PI-23 ProcessRefund` | Consumidor indirecto | Ejecutar un reembolso aprobado. | Aplicación → `PO-16` | Confirmación o fallo del proveedor. |
| `PI-12`/`PI-14` | Consumidor indirecto | Iniciar pago o cancelar intento. | Aplicación → `PO-16` | Referencia/estado. |

**Webhooks:** los eventos del proveedor entran por el límite HTTP (`ADIN-01`) y se dirigen a `PI-15`. La autenticidad debe verificarse antes de invocar el puerto. `PO-16` atribuye la verificación al adaptador de pagos; `PI-15` exige un evento ya verificado. La conciliación se registra como `C-20`; no se crea un puerto nuevo.

---

## 4. Flujo conceptual

1. La aplicación solicita iniciar un pago con `PagoId`, `PedidoId`, importe, moneda, referencia opaca del instrumento y clave idempotente.
2. El adapter traduce la solicitud al protocolo del proveedor, sin incluir datos completos de tarjeta.
3. El proveedor responde con una referencia y un estado; el adapter normaliza el estado y descarta datos sensibles.
4. Para confirmar, la aplicación solicita consulta/captura según el modelo aprobado; el adapter verifica la respuesta y la devuelve.
5. Para cancelar o reembolsar, el adapter envía la solicitud solo si el proveedor lo permite y conserva la idempotencia.
6. Si el proveedor falla, tarda o responde de forma ambigua, el adapter devuelve un error seguro; no declara éxito.
7. La aplicación decide la transición del pedido y registra el estado intermedio; el adapter no modifica el dominio.

---

## 5. Transformación y traducción de datos

| Elemento | Traducción |
|---|---|
| Pago | `PagoId`, `PedidoId`, importe, moneda y referencia opaca → solicitud del proveedor. |
| Estado externo | Estado del proveedor → catálogo normalizado (`PENDIENTE`, `AUTORIZADO`, `CAPTURADO`, `RECHAZADO`, `EXPIRADO`, `REEMBOLSADO`). |
| Referencia | Referencia del proveedor → valor opaco para el puerto; no se expone al dominio como detalle de protocolo. |
| Importe | Se conserva exacto con moneda; el adapter no redondea ni convierte (`L-04`). |
| Rechazo | Código/mensaje del proveedor → código seguro; no se filtran detalles internos. |
| Webhook | Evento del proveedor → evento verificado y normalizado; el payload crudo no cruza el puerto. |
| Datos de tarjeta | Nunca se almacenan ni se registran; solo se usa una referencia opaca. |

**Validación técnica vs. negocio:** el adapter valida importe, moneda, referencia y formato de la respuesta. No decide si el pago debe capturarse, si el pedido puede avanzar, si el reembolso es procedente ni si el saldo es suficiente; esas decisiones pertenecen a `DS-06`, `DS-08` y a la aplicación.

---

## 6. Errores y resultados excepcionales

| Código | Situación | Responsabilidad del adapter |
|---|---|---|
| `FALLO_PROVEEDOR` | Rechazo, fallo o falta de respuesta. | Traducir a error seguro; no declarar pago exitoso. |
| `NO_DISPONIBLE` | Proveedor no configurado o caído. | Informar indisponibilidad; no simular éxito. |
| `IDEMPOTENCIA_CONFLICTO` | La clave se usó con otro importe/pago. | Rechazar sin duplicar efectos. |
| `DATOS_INVALIDOS` | Importe, moneda o referencia inválidos. | Rechazar antes de llamar al proveedor. |
| `OPERACION_NO_SOPORTADA` | El proveedor no permite cancelar/reembolsar. | Informar; no inventar una alternativa. |
| `LIMITE_EXCEDIDO` | Timeout o límite del proveedor. | Informar; no reintentar indefinidamente. |

No se inventan códigos HTTP, ventanas de reintento, tiempos de espera ni una máquina de estados del proveedor. `L-22` sigue abierto.

---

## 7. Dependencias y restricciones

| Dependencia | Tipo | Restricción |
|---|---|---|
| Proveedor de pagos | Externo | No definido (`L-22`); no se prescribe SDK, protocolo ni credenciales. |
| Configuración de secretos | Infraestructura | Fuera del repositorio; no se registra. |
| `PO-16` | Contrato | No se amplía con datos de tarjeta ni con estados no normalizados. |
| `PO-09` | Persistencia | El adapter no persiste el pago; la aplicación usa `PO-09`. |
| `L-22` | Bloqueo | Autorización/captura, webhooks, reintentos y cancelación no están cerrados. |

**Restricciones:** no se almacenan datos completos de tarjeta ni secretos; no se declara `CAPTURADO` sin confirmación verificable; no se modifica el dominio directamente; no se usa el adapter para emitir facturas o notificar; no se simula una transacción distribuida.

---

## 8. Trazabilidad

| Elemento | Fuente |
|---|---|
| Existencia y responsabilidad | `[ARQ]` §7.3, §9.4; `[PO]` §5.3 |
| Contrato | `[PO]` `PO-16` |
| Pago | `[MOD]` §11.1; `[VO]` §8.12; `[DS]` `DS-06`, `DS-08` |
| Confirmación de pago | `[PI]` `PI-15`; `[UC]` `UC-01` |
| Reembolso | `[PI]` `PI-23`; `[DS]` `DS-08` |
| Webhooks | `[PI]` `PI-15`; `C-20` |
| Bloqueo | `[EST]` §7, `L-22` |

---

## 9. Criterios de validación documental

- [x] El adapter implementa `PO-16` y no decide estados de pedido.
- [x] Normaliza estados y conserva referencias opacas.
- [x] No almacena ni registra datos completos de tarjeta.
- [x] Preserva idempotencia e importe/moneda.
- [x] Los webhooks se verifican antes de `PI-15`; `C-20` registra la tensión de ubicación.
- [x] `L-22` se registra sin inventar protocolo, reintentos ni cancelación.
- [x] No se creó código, SDK, endpoint, webhook ejecutable ni credencial.
