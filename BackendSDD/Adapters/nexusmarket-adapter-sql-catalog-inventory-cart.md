# NEXUSMARKET — ADOUT-02 Repositorios SQL de catálogo, inventario y carrito

**Identificador:** `ADOUT-02`  
**Tipo:** adaptador de salida / persistencia relacional  
**Capa/módulo:** `adapters/persistence/` de `catalog`, `inventory` y `cart`  
**Estado documental:** `COMPLETO` con límites de fuente registrados  
**Última actualización:** 26 de octubre de 2026  
**Documento canónico:** este archivo  
**Catálogo:** [`nexusmarket-adapters.md`](nexusmarket-adapters.md)

---

## 1. Identificación y propósito

Esta familia documental especifica las implementaciones SQL de `PO-05 ProductRepository`, `PO-06 InventoryRepository` y `PO-07 CartRepository`. Su propósito es persistir y reconstruir productos y variantes, posiciones de inventario con reservas y movimientos, y carritos con sus líneas, preservando unicidad, atomicidad y concurrencia.

No es un repositorio universal. Cada puerto conserva su implementación por agregado y módulo. La agrupación responde a que catálogo, inventario y carrito participan en la preparación de la compra y comparten la misma frontera relacional; no autoriza mezclar sus invariantes.

---

## 2. Límites arquitectónicos

| Aspecto | Definición |
|---|---|
| Capa | Adaptador de salida; implementa puertos de la aplicación. |
| Frontera | Agregados `Producto`/`Variante`, `Inventario`/`ReservaInventario`/`MovimientoInventario` y `Carrito` ↔ PostgreSQL. |
| Dependencias permitidas | `PO-05`, `PO-06`, `PO-07`, `PO-15`, driver/query builder SQL y configuración. |
| Dependencias prohibidas | HTTP, DTOs, reglas de dominio, SDKs de proveedores, adapters de pago o logística. |
| Consumidores | Casos de uso de catálogo, inventario, carrito y checkout. |
| Composición | El punto de composición inyecta cada repositorio en su caso de uso. |

**No le corresponde:** decidir publicación, vendibilidad, selección de bodega, cálculo de precios o totales, reserva de stock por política comercial, descuentos ni autorización. Tampoco sustituye la atomicidad por una comprobación previa en aplicación.

---

## 3. Puertos y contratos relacionados

| Puerto | Implementación | Agregado(s) | Responsabilidad de persistencia | Contrato canónico |
|---|---|---|---|---|
| `PO-05` | `ProductRepository` SQL | `Producto`, `Variante` | Recuperar por id/SKU, listar, guardar producto y variantes con unicidad. | `[PO]` §5.1, `PO-05` |
| `PO-06` | `InventoryRepository` SQL | `Inventario`, `ReservaInventario`, `MovimientoInventario` | Recuperar posiciones, reservar/liberar/consumir atómicamente, registrar movimientos, recuperar reservas. | `[PO]` §5.1, `PO-06` |
| `PO-07` | `CartRepository` SQL | `Carrito`, `ItemCarrito` | Recuperar carrito por id o comprador, guardar líneas y versión, verificar carrito activo único. | `[PO]` §5.1, `PO-07` |

**Relaciones:** los casos de uso dependen de los puertos; los repositorios dependen de los contratos y de `PO-15`. `PO-06` es el único responsable de la atomicidad de reserva/consumo; `PO-05` y `PO-07` no modifican saldos de inventario.

---

## 4. Flujo conceptual

1. Un caso de uso solicita recuperar, listar o guardar un producto, una posición de inventario o un carrito.
2. El repositorio traduce el criterio o agregado a su representación relacional.
3. En inventario, la operación de reserva, liberación o consumo se ejecuta de forma atómica respecto de la posición y con control de concurrencia.
4. La operación participa en la unidad de trabajo `PO-15` cuando el caso de uso lo requiere.
5. El repositorio reconstruye el agregado como objeto válido o devuelve ausencia explícita.
6. Traduce conflictos de unicidad, concurrencia, idempotencia y persistencia a los códigos del puerto.
7. Devuelve el resultado al caso de uso; no decide el estado del pedido ni la política de compra.

---

## 5. Transformación y traducción de datos

| Puerto | Traducción de entrada | Traducción de salida | Invariantes que refuerza |
|---|---|---|---|
| `PO-05` | `ProductoId`, `VarianteId`, SKU o agregado → producto, variantes, precios y estado. | Registros → `Producto`/`Variante` con estado y datos comerciales. | SKU único; producto con al menos una variante cuando se publica; estado válido; precios y moneda coherentes. |
| `PO-06` | Variante, bodega, cantidad, pedido, reserva, clave idempotente o movimiento → posición, reserva y movimiento. | Posición → saldos `onHand`, `reserved`, `unavailable`, `disponible` y versión; reserva → estado; movimiento → registro append-only. | `reserved + unavailable <= onHand`; no stock negativo; reserva/consumo atómicos; movimiento por mutación; idempotencia; reserva terminal no reactivada. |
| `PO-07` | `CarritoId`, `CompradorId` o `Carrito` → carrito, líneas, precios referenciales y versión. | Registros → `Carrito` con líneas y versión. | Un carrito activo por comprador; una línea por variante; cantidades positivas; precio referencial; no reserva stock. |

**Reglas de traducción comunes:**

- Los importes se conservan como valores exactos con moneda; el adapter no redondea ni convierte moneda (`L-04`).
- Las cantidades y saldos se leen y escriben en una operación atómica; no se acepta una lectura seguida de una escritura no protegida.
- Los movimientos de inventario son append-only; una corrección se representa con un movimiento compensatorio, no con una edición.
- Las claves de idempotencia se preservan y se traducen a restricciones o mecanismos equivalentes; el adapter no decide la política de reintento.
- Los identificadores se tratan como opacos y tipados; el formato físico no se decide aquí (`L-13`).
- Los datos inválidos se rechazan como `DATOS_INVALIDOS`; no se corrigen silenciosamente.

**Validación técnica vs. negocio:** el adapter refuerza unicidad de SKU, integridad de líneas, concurrencia y atomicidad. No decide si un producto es vendible, qué bodega elegir (`L-07`), cómo calcular el total (`DS-05`) ni si el carrito puede confirmarse (`UC-01`).

---

## 6. Errores y resultados excepcionales

| Código | Situación | Responsabilidad del adapter |
|---|---|---|
| `NO_ENCONTRADO` | Producto, posición, reserva o carrito inexistente. | Devolver ausencia explícita. |
| `CONFLICTO_UNICIDAD` | SKU duplicado o carrito activo duplicado. | Traducir la restricción; no decidir la política de catálogo. |
| `CONFLICTO_CONCURRENCIA` | La posición o el carrito cambió. | Rechazar la operación; no aplicar cambios parciales. |
| `REGLA_NEGOCIO_INCUMPLIDA` | Disponibilidad insuficiente, bodega inactiva o variante no vendible. | Traducir el rechazo del contrato; no recalcular la regla. |
| `IDEMPOTENCIA_CONFLICTO` | La clave se usó con otros datos. | Rechazar sin duplicar efectos. |
| `DATOS_INVALIDOS` | Cantidad, línea, tipo o referencia inválidos. | Rechazar antes o durante la escritura. |
| `FALLO_PERSISTENCIA` | Conexión, transacción o restricción no disponible. | Traducir a error seguro; registrar causa protegida. |

No se inventan códigos HTTP, políticas de reintento ni tiempos de espera. La coordinación transaccional se rige por `PO-15` y `D-16`.

---

## 7. Dependencias y restricciones

| Dependencia | Tipo | Restricción |
|---|---|---|
| PostgreSQL | Persistencia oficial | Fuente de verdad de catálogo, inventario y carrito (`[MOD]` §24 (punto 1)). |
| `PO-15` | Unidad de trabajo | Reserva, movimiento, carrito y producto participan según el caso de uso. |
| `PO-20`/`PO-21` | Reloj e identificadores | La aplicación asigna timestamps e ids; el repositorio no los inventa. |
| Driver/query builder SQL | Decisión técnica no fijada | `[ARQ]` §2.1; no se prescribe ORM. |
| `L-04`, `L-07`, `L-13` | Límites de fuente | Moneda/redondeo, preferencia de bodega y formato de ids no están cerrados. |

**Restricciones:** MongoDB no es fuente autoritativa del saldo de inventario; no se duplica el catálogo ni el carrito en MongoDB sin estrategia; no se expone el saldo interno a actores no autorizados; no se usa el repositorio para decidir reglas de publicación o checkout.

---

## 8. Trazabilidad

| Elemento | Fuente |
|---|---|
| Existencia y responsabilidad | `[ARQ]` §7.3, §9.3, §9.4, §16; `[PO]` §5.1 |
| Propiedad SQL | `[MOD]` §24 (punto 1); `[ARQ]` §9.1 |
| Contratos | `[PO]` `PO-05`, `PO-06`, `PO-07` |
| Invariantes de catálogo | `[MOD]` §7.1–§7.5, §21; `[VO]` §8.8, §8.9 |
| Invariantes de inventario | `[MOD]` §8.2–§8.3, §21; `[VO]` §6.6, §6.7, §8.17; `[DS]` `DS-03`, `DS-04` |
| Invariantes de carrito | `[MOD]` §9.1–§9.4; `[VO]` §6.5, §6.7 |
| Checkout | `[UC]` `UC-01`; `[PI]` `PI-11`, `PI-12` |
| Límites | `[EST]` §7, `L-04`, `L-07`, `L-13` |

---

## 9. Criterios de validación documental

- [x] Cada puerto tiene una implementación separada por agregado y módulo.
- [x] La atomicidad de inventario se documenta como responsabilidad del adapter, no de una comprobación previa.
- [x] Los movimientos son append-only y la corrección es compensatoria.
- [x] La traducción conserva cantidades, saldos, moneda, versión e idempotencia.
- [x] No se decide publicación, vendibilidad, bodega ni cálculo de totales en el adapter.
- [x] Los errores coinciden con `[PO]` §4.3 y los contratos.
- [x] MongoDB no se usa como fuente de verdad del saldo.
- [x] Los límites de fuente se registran sin inventar políticas.
- [x] No se creó código, SQL ejecutable, esquema ni migración.
