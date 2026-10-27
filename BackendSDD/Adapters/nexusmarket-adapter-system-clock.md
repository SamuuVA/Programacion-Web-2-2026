# NEXUSMARKET — ADOUT-11 Reloj del sistema

**Identificador:** `ADOUT-11`  
**Tipo:** adaptador de salida / capacidad técnica  
**Capa/módulo:** `src/shared/infrastructure/` o `src/shared/adapters/` según composición  
**Estado documental:** `COMPLETO`  
**Última actualización:** 26 de octubre de 2026  
**Documento canónico:** este archivo  
**Catálogo:** [`nexusmarket-adapters.md`](nexusmarket-adapters.md)

---

## 1. Identificación y propósito

Este adapter implementa `PO-20 Clock`. Su propósito es proporcionar el instante actual del sistema en UTC a los casos de uso y a otros adapters que lo necesiten, sin que el dominio dependa de `Date`, de la zona horaria del servidor ni de una biblioteca concreta.

Es una capacidad técnica, no una regla de negocio. No decide plazos, vigencias, ventanas de cancelación ni políticas de expiración; solo entrega el instante que la aplicación solicita.

---

## 2. Límites arquitectónicos

| Aspecto | Definición |
|---|---|
| Capa | Adaptador de salida / infraestructura técnica. |
| Frontera | Contrato `PO-20` ↔ reloj del sistema operativo o fuente de tiempo inyectada. |
| Dependencias permitidas | `PO-20`, reloj del runtime y configuración de entorno. |
| Dependencias prohibidas | Dominio, HTTP, repositorios, proveedores externos, reglas de negocio. |
| Consumidores | Casos de uso que crean o marcan recursos; `ADOUT-04` para timestamps de eventos; `ADOUT-06` para `generadoEn`. |
| Composición | El punto de composición inyecta la implementación. |

**No le corresponde:** calcular plazos, decidir si una operación expiró, convertir zonas horarias de negocio, generar identificadores ni registrar auditoría.

---

## 3. Puertos y contratos relacionados

| Puerto | Relación | Propósito | Dirección | Resultado |
|---|---|---|---|---|
| `PO-20 Clock` | Implementa | Obtener el instante actual en UTC. | Aplicación → adapter | `Instant` UTC. |
| `PO-21 IdGenerator` | No se usa | La generación de ids es una capacidad distinta. | — | No se mezcla. |
| `PO-23 DomainEventOutbox` | Consumidor indirecto | Usa el instante para eventos cuando la aplicación no lo aporta. | Adapter de outbox → `PO-20` | Timestamp del evento. |

El contrato no prescribe una clase, una biblioteca ni un formato de serialización. La representación concreta del instante pertenece al tipo de dominio/aplicación que el puerto defina.

---

## 4. Flujo conceptual

1. Un caso de uso o adapter necesita el instante actual.
2. Invoca `PO-20`.
3. El adapter obtiene el tiempo del reloj del sistema o de la fuente inyectada.
4. Normaliza el resultado a UTC y lo devuelve como el tipo del contrato.
5. Si el reloj no está disponible, devuelve `NO_DISPONIBLE`; no inventa una fecha.
6. El consumidor decide cómo usar el instante; el adapter no aplica reglas temporales.

---

## 5. Transformación y traducción de datos

| Elemento | Traducción |
|---|---|
| Instante del sistema | Tiempo del runtime → instante UTC del contrato. |
| Zona horaria | Se normaliza a UTC; no se conserva la zona local como dato de negocio. |
| Precisión | Se conserva la precisión necesaria para ordenar y comparar; no se fija un formato de presentación. |
| Fuente | Reloj del sistema o fuente inyectada → misma interfaz; el consumidor no conoce el detalle. |
| Errores | Fuente no disponible → `NO_DISPONIBLE`; no se devuelve una fecha inventada. |

**Validación técnica vs. negocio:** el adapter solo garantiza un instante UTC. No valida plazos, no decide si una fecha es pasada/futura y no aplica políticas de expiración.

---

## 6. Errores y resultados excepcionales

| Código | Situación | Responsabilidad del adapter |
|---|---|---|
| `NO_DISPONIBLE` | El reloj o la fuente de tiempo no está disponible. | Informar indisponibilidad; no inventar un instante. |

No se inventan códigos HTTP, políticas de reintento ni formatos de fecha.

---

## 7. Dependencias y restricciones

| Dependencia | Tipo | Restricción |
|---|---|---|
| Reloj del runtime | Infraestructura | Fuente por defecto; no se expone al dominio. |
| Configuración de entorno | Infraestructura | No se requiere una variable específica para el reloj. |
| `PO-20` | Contrato | Solo devuelve el instante; no decide reglas temporales. |

**Restricciones:** no se usa la hora local del servidor como regla de negocio; no se cambia la zona horaria de los datos persistidos; no se usa el adapter para calcular plazos; no se registra la llamada como evento de auditoría.

---

## 8. Trazabilidad

| Elemento | Fuente |
|---|---|
| Existencia y responsabilidad | `[ARQ]` §7.3; `[PO]` §5.4 |
| Contrato | `[PO]` `PO-20` |
| Uso en eventos y reportes | `[PO]` `PO-23`, `PO-24`; `[ARQ]` §9.4 |
| Tiempo y VOs | `[VO]` §7 |
| Bloqueos | No aplica un bloqueo externo específico. |

---

## 9. Criterios de validación documental

- [x] El adapter implementa únicamente `PO-20`.
- [x] Devuelve un instante UTC y no una fecha de negocio.
- [x] No calcula plazos ni aplica políticas temporales.
- [x] No se acopla a una biblioteca o formato de presentación.
- [x] El error de indisponibilidad no inventa un instante.
- [x] No se creó código, utilidad ejecutable ni prueba.
