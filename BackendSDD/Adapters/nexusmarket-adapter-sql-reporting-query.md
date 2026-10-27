# NEXUSMARKET — ADOUT-06 Consultas SQL de reportes

**Identificador:** `ADOUT-06`  
**Tipo:** adaptador de salida / lectura  
**Capa/módulo:** `src/modules/reporting/adapters/persistence/sql-reporting-query.ts` (ubicación propuesta)  
**Estado documental:** `COMPLETO` con límite `L-19`  
**Última actualización:** 26 de octubre de 2026  
**Documento canónico:** este archivo  
**Catálogo:** [`nexusmarket-adapters.md`](nexusmarket-adapters.md)

---

## 1. Identificación y propósito

Este adapter implementa `PO-24 ReportingQuery` sobre PostgreSQL. Su propósito es ejecutar consultas de solo lectura para reportes administrativos autorizados, devolviendo filas/agregados, totales e indicador de frescura, sin acoplar el caso de uso a SQL, MongoDB ni a una proyección concreta.

La implementación inicial elige PostgreSQL porque es la fuente de verdad transaccional (`[MOD]` §24 (punto 1)) y porque no existe una necesidad documentada de proyección documental. `PO-24` permite SQL, MongoDB o una combinación; una implementación MongoDB requeriría un reporte concreto y una estrategia de proyección, y no se crea por anticipación.

---

## 2. Límites arquitectónicos

| Aspecto | Definición |
|---|---|
| Capa | Adaptador de salida / lectura. |
| Frontera | Consulta de reporte de la aplicación ↔ datos relacionales de solo lectura. |
| Dependencias permitidas | `PO-24`, conexión SQL de lectura, configuración y logger. |
| Dependencias prohibidas | Escrituras, reglas de dominio, DTOs HTTP, autorización, SDKs de proveedores. |
| Consumidores | `PI-24 GenerateAdministrativeReport`. |
| Composición | El punto de composición inyecta la implementación en el caso de uso. |

**No le corresponde:** definir el catálogo de reportes, fórmulas, filtros aprobados, límites de paginación, autorización por rol/recurso, presentación/exportación ni decisiones de negocio. Tampoco reemplaza la consulta operativa `PO-08`…`PO-13`.

---

## 3. Puertos y contratos relacionados

| Puerto | Relación | Propósito | Dirección | Resultado |
|---|---|---|---|---|
| `PO-24 ReportingQuery` | Implementa | Ejecutar consulta de solo lectura por tipo, rango, filtros, agrupación y paginación. | Aplicación → adapter | Filas/agregados, totales, `generadoEn` e indicador de frescura. |
| `PI-24 GenerateAdministrativeReport` | Consumidor indirecto | Solicitar el reporte autorizado. | Aplicación → `PO-24` | Resultado de reporte o error seguro. |
| `PO-20 Clock` | Usa | Obtener `generadoEn` en UTC. | Adapter → puerto | `Instant` UTC. |

**No usa** `PO-14` ni `PO-08`…`PO-13` directamente. Si un reporte requiere auditoría, la composición debe decidir si consulta `PO-14` o una fuente combinada; esta implementación no lo hace por sí sola.

---

## 4. Flujo conceptual

1. `PI-24` recibe la solicitud de reporte autorizada y construye el criterio conceptual.
2. El caso de uso invoca `PO-24` con tipo de reporte, rango, filtros, agrupación, paginación y alcance.
3. El adapter valida que el criterio sea técnicamente ejecutable y que no amplíe el alcance recibido.
4. Traduce el criterio a una consulta de solo lectura sobre las relaciones disponibles.
5. Ejecuta la consulta con los límites configurados.
6. Devuelve filas/agregados, totales e indicador de frescura.
7. Si la fuente no está disponible o el límite se excede, devuelve el error del contrato.
8. No muta estado ni registra auditoría por sí mismo.

---

## 5. Transformación y traducción de datos

| Elemento | Traducción |
|---|---|
| Tipo de reporte | Criterio conceptual → consulta permitida; el catálogo no está enumerado (`L-19`). |
| Rango de fechas | Desde/hasta → predicado de lectura; semántica de intervalo según el contrato del reporte. |
| Filtros/agrupación | Dimensiones conceptuales → columnas/agregados permitidos; no se aceptan identificadores de tabla ni SQL libre. |
| Paginación | Página/tamaño → límite y desplazamiento; el máximo no está fijado (`L-19`). |
| Resultado | Filas/agregados → estructura de reporte; no se exponen filas crudas ni datos sensibles innecesarios. |
| Frescura | Lectura directa SQL → indicador de consistencia fuerte/fresca; si se usara una proyección, se declararía su retraso. |
| Alcance | Se recibe del caso de uso y se aplica como restricción de consulta; el adapter no lo amplía. |

**Validación técnica vs. negocio:** el adapter valida tipos, rangos y límites técnicos. No decide qué reportes existen, qué fórmulas aplicar, qué filtros son autorizados ni qué rol puede verlos. La autorización se decide en la aplicación/dominio (`DS-01`).

---

## 6. Errores y resultados excepcionales

| Código | Situación | Responsabilidad del adapter |
|---|---|---|
| `OPERACION_NO_SOPORTADA` | El tipo de reporte no existe o no está implementado. | Rechazar; no inventar una consulta genérica. |
| `DATOS_INVALIDOS` | Filtro, rango, agrupación o paginación inválidos. | Rechazar antes de ejecutar. |
| `NO_DISPONIBLE` | La fuente SQL no está disponible. | Informar indisponibilidad; no devolver datos parciales como completos. |
| `LIMITE_EXCEDIDO` | Se supera el tamaño de página o el tiempo. | Informar el límite; no truncar silenciosamente. |

No se inventan códigos HTTP, fórmulas, reportes ni límites numéricos. `L-19` sigue abierto.

---

## 7. Dependencias y restricciones

| Dependencia | Tipo | Restricción |
|---|---|---|
| PostgreSQL | Fuente inicial de lectura | Fuente de verdad transaccional; solo lectura. |
| `PO-20` | Reloj | `generadoEn` UTC. |
| Driver/query builder SQL | Decisión técnica no fijada | `[ARQ]` §2.1; no se prescribe ORM. |
| `L-19` | Límite de fuente | Catálogo, filtros, fórmulas y límites no definidos. |

**Restricciones:** solo lectura; no muta estado; no amplía alcance; no expone datos personales innecesarios; no reemplaza la fuente de verdad; no se usa para decisiones que exijan lectura fuerte sin declararlo. Una implementación MongoDB de `PO-24` no se crea mientras no exista un reporte concreto que la justifique.

---

## 8. Trazabilidad

| Elemento | Fuente |
|---|---|
| Existencia y responsabilidad | `[ARQ]` §7.3, §9.3; `[PO]` §5.5 |
| Contrato | `[PO]` `PO-24` |
| Fuente SQL/MongoDB | `[ARQ]` §9.2, §9.3; `[MOD]` §24 (puntos 1–2) |
| Reporte administrativo | `[ENU]` OBJ-12; `[PI]` `PI-24` |
| Autorización | `[DS]` `DS-01`; `[PI]` `PI-24` |
| Límite | `[EST]` §7, `L-19` |
| Decisión de fuente inicial | `D-25` en `[EST]` §8 |

---

## 9. Criterios de validación documental

- [x] El adapter implementa `PO-24` y es de solo lectura.
- [x] La elección de PostgreSQL está justificada por la fuente de verdad y no inventa reportes.
- [x] No se crea una proyección MongoDB sin necesidad concreta.
- [x] El alcance se recibe y no se amplía.
- [x] Los errores coinciden con `PO-24`.
- [x] No se decide autorización, catálogo, fórmulas ni límites.
- [x] No se creó código, consulta SQL ejecutable, vista, índice ni migración.
