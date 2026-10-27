# NEXUSMARKET — ADOUT-03 Repositorios SQL del ciclo de pedido

**Identificador:** `ADOUT-03`  
**Tipo:** adaptador de salida / persistencia relacional  
**Capa/módulo:** `adapters/persistence/` de `orders`, `payments`, `billing`, `shipping`, `returns` y `refunds`  
**Estado documental:** `COMPLETO` con límites de fuente registrados  
**Última actualización:** 26 de octubre de 2026  
**Documento canónico:** este archivo  
**Catálogo:** [`nexusmarket-adapters.md`](nexusmarket-adapters.md)

---

## 1. Identificación y propósito

Esta familia documental especifica las implementaciones SQL de `PO-08 OrderRepository`, `PO-09 PaymentRepository`, `PO-10 InvoiceRepository`, `PO-11 ShipmentRepository`, `PO-12 ReturnRepository` y `PO-13 RefundRepository`. Su propósito es persistir y reconstruir pedidos, pagos, facturas, envíos, devoluciones y reembolsos, preservando snapshots, transiciones, unicidad, idempotencia y concurrencia.

No es un repositorio universal. Cada puerto tiene su implementación por agregado y módulo. La agrupación refleja el ciclo comercial y de posventa, comparte la frontera SQL y evita duplicar las mismas reglas de traducción y errores.

---

## 2. Límites arquitectónicos

| Aspecto | Definición |
|---|---|
| Capa | Adaptador de salida; implementa puertos de la aplicación. |
| Frontera | Agregados `Pedido`, `Pago`, `Factura`, `Envio`, `Devolucion` y `Reembolso` ↔ PostgreSQL. |
| Dependencias permitidas | `PO-08`…`PO-13`, `PO-15`, driver/query builder SQL y configuración. |
| Dependencias prohibidas | HTTP, DTOs, reglas de dominio, SDKs de pago/logística, adapters externos. |
| Consumidores | Casos de uso de checkout, consulta, cancelación, pago, facturación, logística, devoluciones y reembolsos. |
| Composición | El punto de composición inyecta cada repositorio en su caso de uso. |

**No le corresponde:** confirmar pagos, capturar, reembolsar, emitir facturas, generar PDF, asignar transportista, consumir inventario, decidir transiciones ni aprobar devoluciones. Tampoco sustituye las reglas de `DS-06`, `DS-07` o `DS-08`.

---

## 3. Puertos y contratos relacionados

| Puerto | Implementación | Agregado | Responsabilidad de persistencia | Contrato canónico |
|---|---|---|---|---|
| `PO-08` | `OrderRepository` SQL | `Pedido` | Recuperar por id/comprador/vendedor/grupo, listar, guardar y aplicar transición con versión. | `[PO]` §5.1, `PO-08` |
| `PO-09` | `PaymentRepository` SQL | `Pago` | Recuperar por id/pedido/referencia, guardar estado, verificar idempotencia y unicidad externa. | `[PO]` §5.1, `PO-09` |
| `PO-10` | `InvoiceRepository` SQL | `Factura` | Recuperar por id/pedido/número, guardar snapshots y líneas, verificar unicidad. | `[PO]` §5.1, `PO-10` |
| `PO-11` | `ShipmentRepository` SQL | `Envio` | Recuperar por id/pedido/seguimiento, guardar líneas/estado/evidencia, aplicar transición. | `[PO]` §5.1, `PO-11` |
| `PO-12` | `ReturnRepository` SQL | `Devolucion` | Recuperar por id/pedido/comprador, guardar estado/motivo/inspección, aplicar transición. | `[PO]` §5.1, `PO-12` |
| `PO-13` | `RefundRepository` SQL | `Reembolso` | Recuperar por id/pago/pedido/devolución, guardar estado, verificar saldo e idempotencia. | `[PO]` §5.1, `PO-13` |

**Relaciones:** los casos de uso dependen de los puertos; los repositorios dependen de los contratos y de `PO-15`. Los adapters externos `PO-16`/`PO-17` no se invocan desde estos repositorios.

---

## 4. Flujo conceptual

1. Un caso de uso solicita recuperar, listar o guardar un agregado del ciclo de pedido.
2. El repositorio traduce el criterio o agregado a su representación relacional.
3. Las transiciones de estado se persisten una sola vez y con la versión esperada; el dominio ya decidió que la transición es válida.
4. La operación participa en `PO-15` cuando afecta varios agregados o requiere atomicidad con outbox.
5. El repositorio reconstruye el agregado con snapshots, líneas, estados e importes, o devuelve ausencia explícita.
6. Traduce conflictos de unicidad, concurrencia, transición, idempotencia y persistencia a los códigos del puerto.
7. Devuelve el resultado al caso de uso; no decide el siguiente estado ni llama a proveedores.

---

## 5. Transformación y traducción de datos

| Puerto | Traducción de entrada | Traducción de salida | Invariantes que refuerza |
|---|---|---|---|
| `PO-08` | `PedidoId`, filtros, `CheckoutGroupId` o `Pedido` → pedido, líneas, snapshots y estados. | Registros → `Pedido` con líneas, snapshots, totales y versión. | Un vendedor por pedido; al menos una línea; snapshots inmutables; totales consistentes; no reescribir `ENTREGADO`/`CERRADO`; transición con actor, timestamp y causalidad. |
| `PO-09` | `PagoId`, `PedidoId`, referencia externa o `Pago` → pago, estado, importe, moneda e intentos. | Registros → `Pago` con estado, importe, moneda, proveedor y referencia. | No datos completos de tarjeta; no `CAPTURADO` sin confirmación; no doble captura; historial de intentos; unicidad de clave y referencia. |
| `PO-10` | `FacturaId`, `PedidoId`, número/serie o `Factura` → factura, snapshots y líneas. | Registros → `Factura` con snapshots, importes y estado. | Factura emitida no se edita silenciosamente; corrección por anulación/documento correctivo; snapshots inmutables; número único en serie. |
| `PO-11` | `EnvioId`, `PedidoId`, seguimiento o `Envio` → envío, líneas, estado y evidencia. | Registros → `Envio` con líneas, estado, transportista, seguimiento y evidencias. | Varios envíos por pedido; cantidades no exceden lo comprado/reservado; no `ENTREGADO` sin evidencia; estado terminal no se reabre. |
| `PO-12` | `DevolucionId`, `PedidoId`, comprador o `Devolucion` → devolución, líneas, estado, motivo e inspección. | Registros → `Devolucion` con líneas, estado y vínculo al pedido. | Cantidades no exceden lo entregado menos lo solicitado; estado terminal no se reabre; motivo del catálogo; inspección obligatoria para reingreso. |
| `PO-13` | `ReembolsoId`, `PagoId`, `PedidoId`, `DevolucionId` o `Reembolso` → reembolso, estado, importe y clave. | Registros → `Reembolso` con estado, importe, moneda, pago y referencia. | Importe mayor que cero; moneda compatible; suma no excede capturado; no `COMPLETADO` sin confirmación; idempotencia; historial no sobrescrito. |

**Reglas de traducción comunes:**

- Los importes se conservan exactos con moneda; el adapter no redondea ni convierte (`L-04`).
- Los snapshots comerciales y fiscales son inmutables; se reconstruyen como valores, no como referencias mutables.
- Las transiciones se persisten con el estado previo, estado nuevo, actor, timestamp y referencia causal; el adapter no calcula la validez.
- Las claves de idempotencia y las referencias externas se preservan con unicidad en su ámbito.
- Los identificadores son opacos y tipados; el formato físico no se decide aquí (`L-13`).
- Los datos inválidos se rechazan como `DATOS_INVALIDOS`; no se corrigen silenciosamente.
- Los documentos/artefactos de factura no se generan ni almacenan; `PO-10` solo persiste el agregado y sus datos.

**Validación técnica vs. negocio:** el adapter refuerza unicidad, concurrencia, integridad y transiciones persistidas. No decide estados (`DS-06`), elegibilidad (`DS-07`), saldo reembolsable (`DS-08`), numeración fiscal (`L-17`) ni evidencia logística (`L-23`).

---

## 6. Errores y resultados excepcionales

| Código | Situación | Responsabilidad del adapter |
|---|---|---|
| `NO_ENCONTRADO` | Pedido, pago, factura, envío, devolución o reembolso inexistente. | Devolver ausencia explícita. |
| `CONFLICTO_UNICIDAD` | Número de factura, seguimiento, clave idempotente o referencia externa duplicada. | Traducir la restricción; no decidir la política de negocio. |
| `CONFLICTO_CONCURRENCIA` | La versión cambió o dos operaciones compiten. | Rechazar; no aplicar cambios parciales. |
| `TRANSICION_INVALIDA` | El estado nuevo no es alcanzable. | Traducir el rechazo del contrato; no recalcular la transición. |
| `REGLA_NEGOCIO_INCUMPLIDA` | Saldo, cantidad o elegibilidad inválidos. | Traducir el rechazo; no aprobar ni reembolsar. |
| `DATOS_INVALIDOS` | Snapshots, líneas, importes o evidencia inválidos. | Rechazar antes o durante la escritura. |
| `FALLO_PERSISTENCIA` | Conexión, transacción o restricción no disponible. | Traducir a error seguro; registrar causa protegida. |

No se inventan códigos HTTP, reintentos, timeouts ni compensaciones externas. La coordinación con proveedores se documenta en `ADOUT-07` y `ADOUT-08`; la unidad de trabajo en `ADOUT-04`.

---

## 7. Dependencias y restricciones

| Dependencia | Tipo | Restricción |
|---|---|---|
| PostgreSQL | Persistencia oficial | Fuente de verdad de pedidos, pagos, facturas, envíos, devoluciones y reembolsos (`[MOD]` §24 (punto 1)). |
| `PO-15` | Unidad de trabajo | Operaciones multiagregado y outbox se confirman o revierten juntas. |
| `PO-16`/`PO-17` | Integraciones externas | No se invocan desde el repositorio; la aplicación coordina. |
| `PO-20`/`PO-21` | Reloj e identificadores | La aplicación asigna timestamps e ids. |
| `L-04`, `L-11`, `L-17`, `L-21`, `L-22`, `L-23` | Límites de fuente | Moneda, snapshots, numeración fiscal, cierre, protocolo de pago y logística no están cerrados. |

**Restricciones:** no se expone el agregado completo sin autorización; no se reescribe un pedido cerrado; no se elimina historial; no se usa MongoDB como fuente de verdad; no se simula una transacción distribuida con pago o logística.

---

## 8. Trazabilidad

| Elemento | Fuente |
|---|---|
| Existencia y responsabilidad | `[ARQ]` §7.3, §9.3, §9.4, §16; `[PO]` §5.1 |
| Propiedad SQL | `[MOD]` §24 (punto 1); `[ARQ]` §9.1 |
| Contratos | `[PO]` `PO-08`…`PO-13` |
| Pedido | `[MOD]` §10.1–§10.4, §21; `[VO]` §6.5, §7.3, §8.11; `[DS]` `DS-06` |
| Pago | `[MOD]` §11.1; `[VO]` §8.12; `[DS]` `DS-06`, `DS-08` |
| Factura | `[MOD]` §12.1; `[VO]` §8.13, §9.5; `[DS]` `DS-09` |
| Envío | `[MOD]` §13.1–§13.3; `[VO]` §8.14; `[DS]` `DS-06` |
| Devolución | `[MOD]` §14.1, §14.3; `[VO]` §8.15; `[DS]` `DS-07` |
| Reembolso | `[MOD]` §14.2; `[VO]` §8.16; `[DS]` `DS-08` |
| Checkout/consulta | `[UC]` `UC-01`, `UC-02` |
| Límites | `[EST]` §7 |

---

## 9. Criterios de validación documental

- [x] Cada puerto tiene una implementación separada por agregado y módulo.
- [x] Los snapshots, transiciones, unicidad e idempotencia se preservan en la traducción.
- [x] El adapter no decide estados, elegibilidad, saldo ni numeración fiscal.
- [x] Los errores coinciden con `[PO]` §4.3 y los contratos.
- [x] Las integraciones externas no se invocan desde los repositorios.
- [x] La transacción no se presenta como distribuida.
- [x] Los límites de fuente se registran sin inventar políticas.
- [x] No se creó código, SQL ejecutable, esquema ni migración.
