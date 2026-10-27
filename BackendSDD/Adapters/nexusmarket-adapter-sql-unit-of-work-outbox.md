# NEXUSMARKET — ADOUT-04 Unidad de trabajo y outbox SQL

**Identificador:** `ADOUT-04`  
**Tipo:** adaptador de salida / transacción y eventos  
**Capa/módulo:** `src/shared/adapters/persistence/` o `src/infrastructure/persistence/sql/` según composición  
**Estado documental:** `COMPLETO` con valores configurables pendientes  
**Última actualización:** 26 de octubre de 2026  
**Documento canónico:** este archivo  
**Catálogo:** [`nexusmarket-adapters.md`](nexusmarket-adapters.md)

---

## 1. Identificación y propósito

Este adapter implementa `PO-15 TransactionManager` y `PO-23 DomainEventOutbox` sobre PostgreSQL. Su propósito es delimitar una unidad de trabajo atómica para las escrituras relacionales, propagar el contexto transaccional a los repositorios SQL y registrar eventos críticos en la misma transacción que la mutación de negocio. También permite recuperar eventos pendientes y marcarlos como publicados o fallidos.

No decide reglas de negocio, no coordina transacciones distribuidas y no garantiza atomicidad entre PostgreSQL, MongoDB y proveedores externos. El outbox es el mecanismo de coordinación; la publicación posterior es al menos una vez y los consumidores deben ser idempotentes.

---

## 2. Límites arquitectónicos

| Aspecto | Definición |
|---|---|
| Capa | Adaptador de salida / infraestructura de persistencia y relay. |
| Frontera | Aplicación → `PO-15`/`PO-23` → PostgreSQL; relay → consumidores internos o externos. |
| Dependencias permitidas | Contratos `PO-15`, `PO-23`, conexión SQL, configuración, logger, reloj `PO-20` e identificadores `PO-21` cuando corresponda. |
| Dependencias prohibidas | Reglas de dominio, DTOs HTTP, SDKs de proveedores dentro de la transacción, MongoDB como parte de la transacción SQL. |
| Consumidores | Casos de uso multiagregado, mutaciones críticas y proceso de publicación. |
| Composición | El punto de composición construye la conexión, el manager y el relay. |

**No le corresponde:** decidir qué eventos existen (`L-14`), qué gravedad tiene una auditoría (`L-15`), aprobar reembolsos, confirmar pagos, compensar proveedores ni declarar éxito de una operación externa.

---

## 3. Puertos y contratos relacionados

| Puerto | Relación | Propósito | Dirección | Resultado |
|---|---|---|---|---|
| `PO-15 TransactionManager` | Implementa | Iniciar, confirmar o revertir una unidad de trabajo; propagar contexto a repositorios. | Aplicación → adapter | Confirmación, reversión o error seguro. |
| `PO-23 DomainEventOutbox` | Implementa | Registrar evento en la transacción actual; recuperar pendientes; marcar publicado/fallido. | Aplicación/relay → adapter | Identificador de evento, lote pendiente o confirmación de estado. |
| `PO-20 Clock` | Usa | Obtener el instante UTC del evento cuando la aplicación no lo aporta. | Adapter → puerto | `Instant` UTC. |
| `PO-21 IdGenerator` | Usa | Generar el identificador del evento cuando corresponda. | Adapter → puerto | Identificador opaco. |

Los repositorios SQL de `ADOUT-01`…`ADOUT-03` participan en la unidad de trabajo. No se exponen conexiones ni objetos de driver a la aplicación (`[PO]` `PO-15`).

---

## 4. Flujo conceptual

1. Un caso de uso inicia una unidad de trabajo a través de `PO-15`.
2. El manager abre el contexto transaccional y lo asocia a la operación y a su correlación.
3. Los repositorios SQL ejecutan lecturas/escrituras dentro de ese contexto.
4. Si la mutación es crítica, la aplicación registra uno o más eventos mediante `PO-23` antes de confirmar.
5. El manager confirma la transacción; la mutación y los eventos quedan persistidos juntos.
6. Si algo falla antes del commit, el manager revierte y no deja efectos parciales en los recursos cubiertos.
7. El relay recupera eventos pendientes y los publica de forma idempotente.
8. El relay marca el evento como publicado o fallido; un fallo de publicación no revierte la mutación ya confirmada.
9. La aplicación decide cómo reconciliar o reintentar según la política configurada.

---

## 5. Transformación y traducción de datos

| Elemento | Traducción |
|---|---|
| Unidad de trabajo | Operación conceptual de inicio/commit/rollback → contexto de conexión y transacción SQL. |
| Contexto de correlación | Se propaga a la transacción y a los eventos; no se expone al dominio como detalle de driver. |
| Evento | Código, agregado, referencia, payload minimizado, timestamp, correlación y clave idempotente → registro de outbox. |
| Estado del evento | Pendiente/publicado/fallido → representación persistente; no se borra al publicar. |
| Errores SQL | Se traducen a `FALLO_PERSISTENCIA`, `CONFLICTO_CONCURRENCIA` o `LIMITE_EXCEDIDO` según el contrato. |
| Errores del relay | Se traducen a `FALLO_PROVEEDOR` o `LIMITE_EXCEDIDO`; no se ocultan como éxito. |

**Reglas de traducción:**

- El payload se minimiza y no contiene secretos, credenciales, datos completos de tarjeta ni datos personales innecesarios.
- La clave idempotente evita duplicar el mismo evento; un conflicto con datos distintos se informa.
- El orden por agregado, si se exige, se preserva en la recuperación; el adapter no inventa una garantía de orden global.
- El adapter no serializa agregados completos ni objetos de dominio; recibe un evento ya construido por la aplicación/dominio.
- La transacción no incluye llamadas a proveedores externos ni escrituras MongoDB.

**Validación técnica vs. negocio:** el adapter refuerza atomicidad, unicidad de evento y estados de publicación. No decide el catálogo de eventos, la gravedad de auditoría ni la política de compensación.

---

## 6. Errores y resultados excepcionales

| Código | Situación | Responsabilidad del adapter |
|---|---|---|
| `FALLO_PERSISTENCIA` | No se pudo iniciar, confirmar o revertir; outbox no disponible. | Traducir a error seguro; no simular commit. |
| `CONFLICTO_CONCURRENCIA` | Deadlock, serialización o conflicto transaccional. | Informar el conflicto; la aplicación decide el reintento permitido. |
| `LIMITE_EXCEDIDO` | Timeout o lote de eventos excedido. | Informar el límite; no continuar indefinidamente. |
| `OPERACION_NO_SOPORTADA` | Transacción anidada o distribuida. | Rechazar; no simular una garantía inexistente. |
| `DATOS_INVALIDOS` | Evento sin código, agregado o correlación. | Rechazar antes de escribir. |
| `CONFLICTO_UNICIDAD` | Clave idempotente ya existente. | Informar; no duplicar el evento. |
| `FALLO_PROVEEDOR` | El relay no pudo publicar. | Marcar fallido y conservar el evento para reintento. |

**Política transaccional:** `D-16` adopta `READ COMMITTED` por defecto, timeout y reintentos acotados y configurables, misma clave de idempotencia y ninguna transacción distribuida. Los valores numéricos no están fijados por las fuentes; pertenecen a configuración. No se inventan políticas de reintento ni compensación.

---

## 7. Dependencias y restricciones

| Dependencia | Tipo | Restricción |
|---|---|---|
| PostgreSQL | Persistencia oficial | Fuente de verdad transaccional y del outbox. |
| Driver/query builder SQL | Decisión técnica no fijada | `[ARQ]` §2.1; no se prescribe ORM. |
| `PO-20`/`PO-21` | Reloj e identificadores | Se usan si la aplicación no aporta timestamp/id. |
| Relay/publicador | Proceso de infraestructura | No se requiere broker desde el primer día; la publicación es al menos una vez. |
| `L-14` | Catálogo de eventos | No se enumeran códigos ni payloads completos. |
| `L-25` | Valores de timeout/reintento | `D-16` cierra el diseño; los números quedan en configuración. |

**Restricciones:** no se usa MongoDB dentro de la transacción SQL; no se declara éxito de una operación externa; no se elimina el evento al publicarlo; no se expone la conexión al dominio; no se anida una unidad de trabajo.

---

## 8. Trazabilidad

| Elemento | Fuente |
|---|---|
| Existencia y responsabilidad | `[ARQ]` §9.4, §16; `[PO]` §5.2 |
| Contratos | `[PO]` `PO-15`, `PO-23` |
| Outbox y consistencia | `[ARQ]` §9.4; `[MOD]` §24 (punto 5); `[DS]` `DS-09` |
| Política transaccional | `[UC]` `UC-01`, decisión `D-16` |
| Eventos | `[MOD]` §20; `[PO]` `PO-23` |
| Límites | `[EST]` §7, `L-14`, `L-25` |

---

## 9. Criterios de validación documental

- [x] La unidad de trabajo y el outbox se documentan como puertos distintos dentro de un mismo límite transaccional.
- [x] El outbox se escribe en la misma transacción que la mutación crítica.
- [x] No se simula una transacción distribuida.
- [x] La publicación es al menos una vez y los consumidores deben ser idempotentes.
- [x] Los errores y estados del evento coinciden con `PO-23`.
- [x] `D-16` se aplica sin fijar valores numéricos no aprobados.
- [x] No se decide el catálogo de eventos ni la gravedad de auditoría.
- [x] No se creó código, SQL ejecutable, esquema, migración ni broker.
