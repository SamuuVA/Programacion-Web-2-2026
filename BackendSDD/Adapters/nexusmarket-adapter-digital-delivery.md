# NEXUSMARKET — ADOUT-10 Entrega digital

**Identificador:** `ADOUT-10`  
**Tipo:** adaptador de salida / integración externa  
**Capa/módulo:** `src/shared/adapters/` o `src/modules/orders/adapters/` según composición  
**Estado documental:** `COMPLETO` con bloqueo `L-18`  
**Última actualización:** 26 de octubre de 2026  
**Documento canónico:** este archivo  
**Catálogo:** [`nexusmarket-adapters.md`](nexusmarket-adapters.md)

---

## 1. Identificación y propósito

Este adapter implementa `PO-19 DigitalDeliveryProvider`. Su propósito es abstraer la provisión, consulta y revocación de acceso a un bien digital, así como el registro de evidencia de entrega. Traduce la referencia del ítem digital, el comprador y la operación solicitada a la interfaz del mecanismo de entrega aprobado, sin exponer credenciales ni contenidos completos.

No decide si el pago está confirmado, si el pedido puede entregarse, qué licencia corresponde ni cómo se revoca por política comercial. El modelo de entrega digital, el mecanismo de acceso, la vigencia y la evidencia no están definidos (`L-18`).

---

## 2. Límites arquitectónicos

| Aspecto | Definición |
|---|---|
| Capa | Adaptador de salida / integración externa. |
| Frontera | Contrato `PO-19` ↔ mecanismo de entrega digital (servicio, repositorio de licencias o equivalente). |
| Dependencias permitidas | `PO-19`, cliente/SDK del mecanismo, configuración, logger y reloj si se requiere. |
| Dependencias prohibidas | Dominio, HTTP de la aplicación, repositorios SQL, reglas de pago/pedido, SDKs de pago/logística. |
| Consumidores | `PI-15`, `PI-18`, `PI-22` a través de la aplicación. |
| Composición | El punto de composición inyecta el adapter y sus credenciales. |

**No le corresponde:** confirmar pagos, cambiar el estado del pedido, consumir inventario, emitir facturas, notificar al comprador ni decidir la política de licencias. Tampoco sustituye la persistencia del pedido o del ítem digital.

---

## 3. Puertos y contratos relacionados

| Puerto | Relación | Propósito | Dirección | Resultado |
|---|---|---|---|---|
| `PO-19 DigitalDeliveryProvider` | Implementa | Proveer, consultar y revocar acceso; devolver evidencia. | Aplicación → adapter → mecanismo | Referencia de acceso, estado, vigencia y evidencia. |
| `PI-15 ConfirmPayment` | Consumidor indirecto | Iniciar la entrega tras un pago confirmado. | Aplicación → `PO-19` | Resultado de provisión. |
| `PI-18 ConfirmDelivery` | Consumidor indirecto | Registrar entrega digital. | Aplicación → `PO-19` | Evidencia/estado. |
| `PI-22 ResolveReturn` | Consumidor indirecto | Revocar acceso cuando la devolución lo exige. | Aplicación → `PO-19` | Confirmación o fallo de revocación. |

**Relación con el pedido:** el adapter recibe la referencia del ítem digital y el comprador ya validados por la aplicación. No lee el pedido directamente ni decide si la línea es digital; esa clasificación pertenece al dominio y al caso de uso.

---

## 4. Flujo conceptual

1. La aplicación determina que un ítem digital debe entregarse y construye la solicitud con pedido, línea, comprador, referencia del bien y clave idempotente.
2. El adapter valida que la referencia y el destinatario sean técnicamente utilizables.
3. Traduce la solicitud al mecanismo de entrega y provisiona el acceso.
4. El mecanismo responde con una referencia opaca, estado, vigencia y evidencia.
5. El adapter normaliza la respuesta y la devuelve a la aplicación.
6. Para consultar, el adapter usa la referencia opaca y devuelve el estado actual.
7. Para revocar, el adapter envía la solicitud solo si el mecanismo lo permite y conserva la idempotencia.
8. La aplicación decide la transición del pedido y registra la evidencia; el adapter no modifica el dominio.

---

## 5. Transformación y traducción de datos

| Elemento | Traducción |
|---|---|
| Ítem digital | Referencia del bien, pedido, línea y comprador → solicitud de provisión. |
| Acceso | Mecanismo concreto → referencia opaca, URL temporal o credencial de un solo uso, según `L-18`. |
| Estado | Estado del mecanismo → catálogo normalizado del puerto (`PROVISIONADO`, `FALLIDO`, `REVOCADO`). |
| Vigencia | Metadato opcional que el mecanismo reporte; no se fija una política ni se añade al contrato si el proveedor no lo entrega. |
| Evidencia | Confirmación, timestamp y referencia → evidencia de entrega; el formato no está definido (`L-18`). |
| Datos sensibles | No se devuelven secretos permanentes ni contenidos completos; se usan referencias temporales cuando el mecanismo lo permita. |
| Idempotencia | Clave → deduplicación de provisión/revocación; no se inventa una garantía si el mecanismo no la soporta. |

**Validación técnica vs. negocio:** el adapter valida referencia, destinatario y formato de respuesta. No decide si el pago está confirmado, si el ítem es digital, si la devolución procede ni si el acceso debe revocarse; esas decisiones pertenecen a `DS-06`, `DS-07` y a la aplicación.

---

## 6. Errores y resultados excepcionales

| Código | Situación | Responsabilidad del adapter |
|---|---|---|
| `DATOS_INVALIDOS` | Referencia, comprador o línea inválidos. | Rechazar antes de invocar el mecanismo. |
| `NO_DISPONIBLE` | Mecanismo no configurado o caído. | Informar indisponibilidad. |
| `FALLO_PROVEEDOR` | El mecanismo rechazó la provisión/revocación. | Traducir a error seguro; no declarar entrega. |
| `IDEMPOTENCIA_CONFLICTO` | La clave se usó con otro ítem/operación. | Rechazar sin duplicar efectos. |
| `OPERACION_NO_SOPORTADA` | El mecanismo no permite consultar/revocar. | Informar; no inventar una alternativa. |

No se inventan códigos HTTP, formatos de acceso, vigencias, evidencia ni políticas de revocación. `L-18` sigue abierto.

---

## 7. Dependencias y restricciones

| Dependencia | Tipo | Restricción |
|---|---|---|
| Mecanismo de entrega digital | Externo | No definido (`L-18`); no se prescribe SDK, protocolo ni credenciales. |
| Configuración de secretos | Infraestructura | Fuera del repositorio; no se registra. |
| `PO-19` | Contrato | No se amplía con contenidos completos ni políticas de licencia. |
| `PO-08`/`PO-09` | Persistencia | El adapter no persiste pedido/pago; la aplicación usa esos puertos. |
| `L-18` | Bloqueo | Modelo de acceso, vigencia, evidencia y revocación no están cerrados. |

**Restricciones:** no se entrega antes de que la aplicación confirme la condición de negocio; no se exponen secretos permanentes; no se modifica el dominio directamente; no se usa el adapter para notificar o facturar; no se simula una transacción distribuida.

---

## 8. Trazabilidad

| Elemento | Fuente |
|---|---|
| Existencia y responsabilidad | `[ARQ]` §7.3, §9.4; `[PO]` §5.3 |
| Contrato | `[PO]` `PO-19` |
| Producto/entrega digital | `[MOD]` §7.3, §22.4; `[VO]` §8.2, §8.8 |
| Confirmación/entrega | `[PI]` `PI-15`, `PI-18`; `[UC]` `UC-01` |
| Devolución/revocación | `[PI]` `PI-22`; `[DS]` `DS-07` |
| Bloqueo | `[EST]` §7, `L-18` |

---

## 9. Criterios de validación documental

- [x] El adapter implementa `PO-19` y no decide pago, pedido ni devolución.
- [x] Traduce provisión, consulta, revocación y evidencia.
- [x] No expone contenidos completos ni secretos permanentes.
- [x] Preserva idempotencia y referencias opacas.
- [x] No se inventan formatos de acceso, vigencia ni evidencia.
- [x] `L-18` se registra como bloqueo real.
- [x] No se creó código, SDK, endpoint, credencial ni mecanismo ejecutable.
