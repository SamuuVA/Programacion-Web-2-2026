# NEXUSMARKET — ADOUT-05 Repositorio MongoDB de auditoría

**Identificador:** `ADOUT-05`  
**Tipo:** adaptador de salida / persistencia documental  
**Capa/módulo:** `src/modules/reporting/adapters/persistence/mongodb-audit-log-repository.ts` (ubicación propuesta)  
**Estado documental:** `COMPLETO` con límites de fuente registrados  
**Última actualización:** 26 de octubre de 2026  
**Documento canónico:** este archivo  
**Catálogo:** [`nexusmarket-adapters.md`](nexusmarket-adapters.md)

---

## 1. Identificación y propósito

Este adapter implementa `PO-14 AuditLogRepository` sobre MongoDB. Su propósito es registrar de forma append-only los `RegistroAuditoria` y consultarlos con filtros autorizados, preservando inmutabilidad, minimización y correlación. Es la implementación documental de auditoría; no es la fuente de verdad de los agregados de negocio.

MongoDB se justifica porque la arquitectura lo señala para documentos de auditoría/eventos y porque el registro tiene estructura documental variable (`[ARQ]` §9.2, §9.3; `[MOD]` §24 (punto 2)). No se usa MongoDB para duplicar pedidos, pagos o inventario.

---

## 2. Límites arquitectónicos

| Aspecto | Definición |
|---|---|
| Capa | Adaptador de salida; implementa un puerto de la aplicación. |
| Frontera | `RegistroAuditoria` de dominio/aplicación ↔ documento MongoDB. |
| Dependencias permitidas | `PO-14`, `PO-23` para auditoría crítica, driver MongoDB y configuración. |
| Dependencias prohibidas | Reglas de dominio, DTOs HTTP, SQL como parte de la misma transacción, SDKs de proveedores. |
| Consumidores | Casos de uso que auditan y `PI-25 QueryAuditLog`. |
| Composición | El punto de composición inyecta el repositorio en los casos de uso y en el relay de outbox. |

**No le corresponde:** decidir qué eventos auditar (`L-14`), asignar gravedad (`L-15`), construir el payload de negocio (`DS-09`), autorizar consultas (`DS-01`) ni reemplazar los registros de pedidos, pagos o inventario.

---

## 3. Puertos y contratos relacionados

| Puerto | Relación | Propósito | Dirección | Resultado |
|---|---|---|---|---|
| `PO-14 AuditLogRepository` | Implementa | Añadir registro append-only; consultar por filtros; recuperar por identificador. | Aplicación → adapter | Confirmación de append; registros paginados; ausencia explícita. |
| `PO-23 DomainEventOutbox` | Usa / coordina | Recibir eventos críticos para escritura durable de auditoría. | Relay → adapter | Append del registro; el evento se marca según resultado. |
| `PI-25 QueryAuditLog` | Consumidor indirecto | Consulta autorizada de auditoría. | Aplicación → `PO-14` | Registros reconstruidos, sin documentos crudos. |

**Relación con la transacción SQL:** MongoDB no participa en la transacción de PostgreSQL. La auditoría crítica se registra primero en el outbox SQL y el relay la escribe en MongoDB; si la escritura documental falla, el evento permanece pendiente/reintentable. No se declara una transacción distribuida.

---

## 4. Flujo conceptual

1. Un caso de uso construye un `RegistroAuditoria` válido mediante `DS-09`.
2. Si la auditoría es crítica, registra el evento en `PO-23` dentro de la transacción de negocio.
3. El relay recupera el evento pendiente y solicita al adapter de auditoría el append del registro.
4. El adapter traduce el registro a un documento MongoDB y lo inserta.
5. Si el append falla, el relay marca el evento como fallido y conserva la evidencia para reintento.
6. Si el append tiene éxito, el relay marca el evento como publicado.
7. Para consultas, `PI-25` invoca el puerto con filtros y paginación; el adapter devuelve registros reconstruidos y minimizados.
8. El adapter no devuelve documentos crudos, secretos ni datos personales innecesarios.

---

## 5. Transformación y traducción de datos

| Elemento | Traducción |
|---|---|
| `RegistroAuditoria` | Evento, recurso, actor, timestamp UTC, correlación, causalidad, resultado, gravedad y payload minimizado → documento append-only. |
| Payload | Se conserva solo lo permitido por `AuditPayload`; se excluyen contraseñas, tokens, datos completos de tarjeta y secretos. |
| Identificadores | Se tratan como opacos; el documento no impone un formato de negocio. |
| Fechas | UTC; se conserva la precisión necesaria para ordenar y filtrar. |
| Consulta | Filtros por evento, recurso, actor, fecha, resultado, gravedad o correlación → criterio documental; paginación conceptual. |
| Resultado | Documento → `RegistroAuditoria` reconstruido; no se exponen campos internos de MongoDB. |
| Ausencia | `NO_ENCONTRADO` para recuperación por id; lista vacía para consulta sin coincidencias. |

**Inmutabilidad:** el adapter solo inserta y consulta. No actualiza ni elimina registros. Una corrección se representa con un nuevo registro, no con una edición (`AUD-01`). La representación documental puede incluir metadatos técnicos, pero no puede alterar el significado del registro.

**Validación técnica vs. negocio:** el adapter valida que el registro tenga los campos mínimos y que el documento sea insertable. No decide la gravedad, el catálogo de eventos ni la obligación de auditar; esas decisiones provienen de `DS-09` y del caso de uso.

---

## 6. Errores y resultados excepcionales

| Código | Situación | Responsabilidad del adapter |
|---|---|---|
| `FALLO_PERSISTENCIA` | MongoDB no disponible o escritura/lectura falló. | Traducir a error seguro; el relay conserva el evento para reintento. |
| `DATOS_INVALIDOS` | Registro sin actor, acción o correlación. | Rechazar el append; no completar campos de negocio. |
| `LIMITE_EXCEDIDO` | Se supera el tamaño de página o el tiempo. | Informar el límite; no devolver un conjunto incompleto como si fuera total. |
| `NO_ENCONTRADO` | No existe el registro solicitado. | Devolver ausencia explícita. |
| `OPERACION_NO_SOPORTADA` | Se intenta modificar o eliminar. | Rechazar; el contrato es append-only. |

No se inventan políticas de retención, TTL, reintentos ni compensaciones. La política de auditoría crítica y la gravedad dependen de `DS-09`, `L-14` y `L-15`.

---

## 7. Dependencias y restricciones

| Dependencia | Tipo | Restricción |
|---|---|---|
| MongoDB | Persistencia documental oficial | Adecuada para auditoría/eventos; no es fuente de verdad transaccional (`[MOD]` §24 (punto 2)). |
| Driver MongoDB | Decisión técnica no fijada | `[ARQ]` §2.1 permite driver oficial o compatible, confinado al adapter. |
| `PO-23` | Outbox | La auditoría crítica se coordina mediante outbox; no hay transacción distribuida. |
| `DS-09` | Servicio de dominio | Construye el registro; el adapter solo lo persiste. |
| `L-11`, `L-14`, `L-15` | Límites de fuente | Composición de payload, catálogo de eventos y gravedad no están cerrados. |

**Restricciones:** no se registran secretos ni datos personales innecesarios; no se permite update/delete; no se usa la auditoría para reconstruir saldos o estados; no se expone el documento crudo; no se declara éxito de una operación crítica sin evidencia durable.

---

## 8. Trazabilidad

| Elemento | Fuente |
|---|---|
| Existencia y responsabilidad | `[ARQ]` §7.3, §9.2, §9.3, §9.4; `[PO]` §5.1 |
| Contrato | `[PO]` `PO-14` |
| Auditoría y minimización | `[MOD]` §15.1, §20, §24 (punto 2); `[VO]` §8.18–§8.20; `[DS]` `DS-09` |
| Outbox | `[PO]` `PO-23`; `[ARQ]` §9.4; `[MOD]` §24 (punto 5) |
| Consulta autorizada | `[PI]` `PI-25`; `[DS]` `DS-01` |
| Límites | `[EST]` §7, `L-11`, `L-14`, `L-15` |

---

## 9. Criterios de validación documental

- [x] El adapter implementa `PO-14` y no sustituye la fuente de verdad transaccional.
- [x] La escritura es append-only y no permite update/delete.
- [x] La auditoría crítica se coordina con outbox y no con una transacción distribuida.
- [x] La traducción conserva actor, recurso, timestamp, correlación, resultado y gravedad.
- [x] Se excluyen secretos y datos personales innecesarios.
- [x] Los errores coinciden con `PO-14` y `[PO]` §4.3.
- [x] No se decide el catálogo de eventos ni la gravedad.
- [x] No se creó código, colección, índice, esquema ni migración.
