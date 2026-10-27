# NEXUSMARKET — ADOUT-12 Generador de identificadores

**Identificador:** `ADOUT-12`  
**Tipo:** adaptador de salida / capacidad técnica  
**Capa/módulo:** `src/shared/infrastructure/` o `src/shared/adapters/` según composición  
**Estado documental:** `COMPLETO` con bloqueo `L-13`  
**Última actualización:** 26 de octubre de 2026  
**Documento canónico:** este archivo  
**Catálogo:** [`nexusmarket-adapters.md`](nexusmarket-adapters.md)

---

## 1. Identificación y propósito

Este adapter implementa `PO-21 IdGenerator`. Su propósito es generar identificadores opacos y únicos para agregados, eventos y referencias internas, sin que el dominio dependa de una biblioteca, de una base de datos o de un formato físico concreto.

El contrato exige un identificador tipado y único. El mecanismo concreto —UUID, ULID, secuencia u otro— no está aprobado (`L-13`). Por eso este documento define la frontera, la traducción y los errores, pero no prescribe el algoritmo ni el formato.

---

## 2. Límites arquitectónicos

| Aspecto | Definición |
|---|---|
| Capa | Adaptador de salida / infraestructura técnica. |
| Frontera | Contrato `PO-21` ↔ mecanismo de generación de identificadores. |
| Dependencias permitidas | `PO-21`, biblioteca o servicio de generación, configuración y logger. |
| Dependencias prohibidas | Dominio, HTTP, repositorios, reglas de negocio, proveedores externos. |
| Consumidores | Casos de uso que crean agregados o eventos; `ADOUT-04` para ids de eventos. |
| Composición | El punto de composición inyecta la implementación. |

**No le corresponde:** decidir la unicidad de negocio, validar que un identificador exista, ordenar por negocio, generar números de factura (`L-17`), generar tracking (`L-23`) ni sustituir una clave natural.

---

## 3. Puertos y contratos relacionados

| Puerto | Relación | Propósito | Dirección | Resultado |
|---|---|---|---|---|
| `PO-21 IdGenerator` | Implementa | Generar un identificador opaco del tipo solicitado. | Aplicación → adapter | Identificador único y tipado. |
| `PO-20 Clock` | No se usa necesariamente | Algunos mecanismos usan tiempo, pero el contrato no lo exige. | — | No se mezcla la responsabilidad. |
| `PO-23 DomainEventOutbox` | Consumidor indirecto | Genera el id del evento cuando la aplicación no lo aporta. | Adapter de outbox → `PO-21` | Id de evento. |

El puerto no define el formato físico. La representación concreta debe ser opaca para el dominio y para los adapters que la consumen.

---

## 4. Flujo conceptual

1. Un caso de uso necesita un identificador para un agregado, evento o referencia.
2. Invoca `PO-21` con el tipo de identificador requerido.
3. El adapter genera el valor mediante el mecanismo aprobado.
4. Verifica que el valor no sea vacío y que corresponda al tipo solicitado.
5. Devuelve el identificador opaco.
6. Si el mecanismo no está disponible o no puede garantizar unicidad, devuelve un error seguro; no reutiliza un valor.
7. El consumidor asigna el identificador al agregado o evento; el adapter no persiste ni consulta.

---

## 5. Transformación y traducción de datos

| Elemento | Traducción |
|---|---|
| Tipo solicitado | Tipo nominal del contrato → mecanismo interno; no se expone la representación física. |
| Identificador generado | Valor del mecanismo → identificador opaco del dominio/aplicación. |
| Formato | No se fija; el adapter no impone prefijos, longitud ni codificación hasta que `L-13` se cierre. |
| Unicidad | El adapter usa el mecanismo aprobado; no consulta la base de datos para “verificar” unicidad salvo que el mecanismo lo requiera. |
| Errores | Fallo del mecanismo → `NO_DISPONIBLE`; tipo inválido → `DATOS_INVALIDOS`; colisión no resuelta → `CONFLICTO_UNICIDAD`, sin reutilizar. |

**Validación técnica vs. negocio:** el adapter garantiza el valor técnico. No decide si un identificador es “correcto” para un agregado, no genera claves naturales y no reemplaza la unicidad de correo, SKU, factura o tracking.

---

## 6. Errores y resultados excepcionales

| Código | Situación | Responsabilidad del adapter |
|---|---|---|
| `NO_DISPONIBLE` | El mecanismo no está configurado o falló. | Informar indisponibilidad; no inventar un id. |
| `DATOS_INVALIDOS` | Se solicita un tipo no contemplado o el tipo nominal es inválido. | Rechazar; no improvisar un formato. |
| `CONFLICTO_UNICIDAD` | El mecanismo detecta una colisión no resuelta. | Informar; no reutilizar valores. |

No se inventan códigos HTTP, formatos, longitudes, prefijos ni políticas de reintento. `L-13` sigue abierto.

---

## 7. Dependencias y restricciones

| Dependencia | Tipo | Restricción |
|---|---|---|
| Mecanismo de generación | Decisión técnica no fijada | `L-13`; no se prescribe UUID, ULID, secuencia ni biblioteca. |
| Configuración | Infraestructura | Puede requerir parámetros del mecanismo; no se fijan aquí. |
| `PO-21` | Contrato | Solo genera; no persiste ni consulta. |
| `L-13` | Bloqueo | Formato físico y estrategia de unicidad no están cerrados. |

**Restricciones:** no se usa el id para decisiones de negocio; no se expone el detalle del mecanismo; no se reutiliza un id tras un fallo; no se sustituyen claves naturales; no se genera un número fiscal.

---

## 8. Trazabilidad

| Elemento | Fuente |
|---|---|
| Existencia y responsabilidad | `[ARQ]` §7.3; `[PO]` §5.4 |
| Contrato | `[PO]` `PO-21` |
| Identificadores y VOs | `[VO]` §6, §7; `[MOD]` §17 |
| Uso en eventos | `[PO]` `PO-23`; `[ARQ]` §9.4 |
| Bloqueo | `[EST]` §7, `L-13` |

---

## 9. Criterios de validación documental

- [x] El adapter implementa únicamente `PO-21`.
- [x] El identificador se trata como opaco y tipado.
- [x] No se prescribe un formato físico mientras `L-13` esté abierto.
- [x] No se confunde con números de factura, tracking o claves naturales.
- [x] No se persiste ni se consulta desde el adapter.
- [x] Los errores no inventan un identificador.
- [x] No se creó código, algoritmo ejecutable ni prueba.
