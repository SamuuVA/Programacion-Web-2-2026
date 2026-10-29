# NEXUSMARKET — ADOUT-01 Repositorios SQL de identidad y perfiles

**Identificador:** `ADOUT-01`  
**Tipo:** adaptador de salida / persistencia relacional  
**Capa/módulo:** `adapters/persistence/` de `identity`, `buyers`, `sellers` y `warehouses`  
**Estado documental:** `COMPLETO` con límites de fuente registrados  
**Última actualización:** 26 de octubre de 2026  
**Documento canónico:** este archivo  
**Catálogo:** [`nexusmarket-adapters.md`](nexusmarket-adapters.md)

---

## 1. Identificación y propósito

Esta familia documental especifica las implementaciones SQL de los puertos `PO-01 UserRepository`, `PO-02 BuyerRepository`, `PO-03 SellerRepository` y `PO-04 WarehouseRepository`. Su propósito es persistir y reconstruir los agregados de identidad, perfiles comerciales y bodegas, preservando unicidad, versión y correspondencia entre cuenta y perfil.

No es un repositorio universal. Cada puerto tiene su propia implementación por agregado y módulo; este documento agrupa las cuatro porque comparten tecnología, patrones de traducción, errores y participación en la unidad de trabajo. La agrupación es documental, no una autorización para mezclar agregados.

---

## 2. Límites arquitectónicos

| Aspecto | Definición |
|---|---|
| Capa | Adaptador de salida; implementa puertos definidos por la aplicación. |
| Frontera | Modelo de dominio ↔ representación relacional en PostgreSQL. |
| Dependencias permitidas | Contratos `PO-01`…`PO-04`, unidad de trabajo `PO-15`, driver/query builder SQL y configuración inyectada. |
| Dependencias prohibidas | HTTP, DTOs de transporte, reglas de dominio, servicios de aplicación, SDKs de proveedores. |
| Consumidores | Casos de uso de registro, perfiles, bodegas, checkout, devoluciones y autorización. |
| Composición | El punto de composición inyecta cada implementación en su caso de uso. |

**No le corresponde:** autenticar, hashear contraseñas, decidir roles, estados iniciales, transiciones, autorización, estado comercial ni reglas de publicación. Tampoco crear cuentas de otros módulos ni compartir filas entre agregados.

---

## 3. Puertos y contratos relacionados

| Puerto | Implementación | Agregado | Responsabilidad de persistencia | Contrato canónico |
|---|---|---|---|---|
| `PO-01` | `UserRepository` SQL | `Usuario` | Recuperar por id, correo o documento; verificar unicidad; guardar con versión. | `[PO]` §5.1, `PO-01` |
| `PO-02` | `BuyerRepository` SQL | `PerfilComprador` | Recuperar por id o `UsuarioId`; guardar direcciones y estado comercial. | `[PO]` §5.1, `PO-02` |
| `PO-03` | `SellerRepository` SQL | `PerfilVendedor` | Recuperar por id o `UsuarioId`; guardar estado y datos comerciales; verificar propiedad cuando aplique. | `[PO]` §5.1, `PO-03` |
| `PO-04` | `WarehouseRepository` SQL | `Bodega` | Recuperar por id; guardar tipo, propietario y estado; listar para operaciones. | `[PO]` §5.1, `PO-04` |

**Relaciones de dirección:** la aplicación depende de los puertos; estas implementaciones dependen de los contratos y de la unidad de trabajo. No dependen de casos de uso concretos ni de otros adapters.

**Datos que nunca cruzan el puerto:** filas, columnas, tipos de driver, credenciales en claro, tokens, secretos y mensajes internos de SQL (`[PO]` §4.6).

---

## 4. Flujo conceptual

1. Un caso de uso solicita recuperar o guardar un agregado a través de `PO-01`, `PO-02`, `PO-03` o `PO-04`.
2. La implementación correspondiente recibe el identificador, criterio único o agregado completo y la versión esperada cuando aplica.
3. Traduce el criterio o el agregado a la representación relacional definida para su módulo.
4. Ejecuta la operación dentro del contexto transaccional de `PO-15` cuando el caso de uso lo requiere.
5. Reconstruye el agregado como objeto de dominio válido o devuelve ausencia explícita.
6. Traduce conflictos de unicidad, concurrencia y fallos de persistencia a los códigos del puerto.
7. Devuelve el resultado al caso de uso; no decide el siguiente paso de negocio.

---

## 5. Transformación y traducción de datos

| Puerto | Traducción de entrada | Traducción de salida | Invariantes que refuerza |
|---|---|---|---|
| `PO-01` | `UsuarioId`, correo/documento normalizado o `Usuario` completo → claves y columnas de identidad. | Registro reconstruido → `Usuario` con rol, estado, credencial hasheada y datos de identidad. | Correo y documento únicos; rol único; estado válido; no credencial en claro; versión. |
| `PO-02` | `CompradorId`, `UsuarioId` o `PerfilComprador` → perfil, direcciones y estado comercial. | Perfil reconstruido → `PerfilComprador` con direcciones y `estadoComercial`. | Un perfil por usuario con rol `COMPRADOR`; dirección válida según `L-01`; estado obligatorio. |
| `PO-03` | `VendedorId`, `UsuarioId` o `PerfilVendedor` → perfil, estado y datos comerciales. | Perfil reconstruido → `PerfilVendedor` con estado e `incorporadoPor`. | Un perfil por usuario con rol `VENDEDOR`; estado del catálogo; propietario correcto. |
| `PO-04` | `BodegaId` o `Bodega` → tipo, propietario, estado y datos físicos. | Registro reconstruido → `Bodega` válida. | Tipo y propietario coherentes; estado válido; dirección válida según `L-01`. |

**Reglas de traducción comunes:**

- Los identificadores se tratan como valores opacos y tipados; el formato físico no se decide aquí (`L-13`).
- Los objetos de valor se reconstruyen con sus invariantes; no se convierten en texto libre sin validación.
- Las fechas se conservan en UTC y con la precisión que exija el contrato.
- Los datos ausentes se representan como ausencia explícita cuando la búsqueda es normal; no se inventan agregados vacíos.
- Los datos inválidos para la escritura se rechazan como `DATOS_INVALIDOS`; no se corrigen silenciosamente.
- La versión se usa para control de concurrencia; no se sobrescribe un cambio concurrente.

**Validación técnica vs. negocio:** el adapter refuerza unicidad, integridad referencial y versión en persistencia. No decide el estado inicial —fijado en `DEC-W1-007`—, si un vendedor puede cambiar de estado (`L-09`) ni si un comprador está restringido (`L-08`); esas decisiones pertenecen a la aplicación/dominio.

---

## 6. Errores y resultados excepcionales

| Código | Situación | Responsabilidad del adapter |
|---|---|---|
| `NO_ENCONTRADO` | El agregado o criterio no existe. | Devolver ausencia explícita; no lanzar un error de negocio por una búsqueda normal. |
| `CONFLICTO_UNICIDAD` | Correo, documento o perfil duplicado. | Traducir la restricción de persistencia; no decidir la política de registro. |
| `CONFLICTO_CONCURRENCIA` | La versión cambió. | Rechazar la escritura; no aplicar una actualización parcial. |
| `DATOS_INVALIDOS` | Agregado o parámetros inválidos. | Rechazar antes o durante la escritura; no corregir datos de negocio. |
| `FALLO_PERSISTENCIA` | Conexión, transacción o restricción no disponible. | Traducir a error seguro; registrar causa técnica protegida; no simular éxito. |

No se inventan reintentos, timeouts ni códigos HTTP. La política transaccional se coordina con `PO-15` y `D-16`.

---

## 7. Dependencias y restricciones

| Dependencia | Tipo | Restricción |
|---|---|---|
| PostgreSQL | Persistencia oficial | Fuente de verdad de identidad y perfiles (`[MOD]` §24 (punto 1)). |
| Driver/query builder SQL | Decisión técnica no fijada | `[ARQ]` §2.1 exige seleccionarlo antes de implementar; no se prescribe ORM. |
| `PO-15` | Unidad de trabajo | Las escrituras multiagregado se confirman o revierten juntas. |
| `PO-20`/`PO-21` | Reloj e identificadores | La aplicación asigna timestamps e ids; el repositorio no los inventa. |
| `L-01`, `L-03`, `L-08`, `L-09`, `L-13` | Límites de fuente | Composición de dirección, formato de documento, proceso comercial, transiciones e ids no están cerrados. Los estados iniciales están aprobados (`DEC-W1-007`). |

**Restricciones:** no se exponen filas al dominio; no se comparten transacciones entre módulos sin unidad de trabajo; no se usa MongoDB como fuente de verdad de estas entidades.

---

## 8. Trazabilidad

| Elemento | Fuente |
|---|---|
| Existencia y responsabilidad | `[ARQ]` §7.3, §9.3, §16; `[PO]` §5.1 |
| Propiedad SQL | `[MOD]` §24 (punto 1); `[ARQ]` §9.1 |
| Contratos | `[PO]` `PO-01`, `PO-02`, `PO-03`, `PO-04` |
| Invariantes | `[MOD]` §6.1–§6.4, §8.1, §21; `[VO]` §6–§8 |
| Autorización y perfiles | `[DS]` `DS-01`; `[PI]` `PI-01`–`PI-04`, `PI-08` |
| Unidad de trabajo | `[PO]` `PO-15`; `[ARQ]` §9.4; `D-16` |
| Límites | `[EST]` §7, `L-01`, `L-03`, `L-08`, `L-09`, `L-13`; estados iniciales `DEC-W1-007` |

---

## 9. Criterios de validación documental

- [x] Cada uno de los cuatro puertos tiene una implementación identificable y separada.
- [x] No se crea un repositorio universal ni se mezclan agregados.
- [x] La dirección de dependencia es aplicación → puerto ← adapter.
- [x] La traducción conserva identificadores tipados, VOs, versión y unicidad.
- [x] Las reglas de estado, autorización y negocio permanecen fuera del adapter.
- [x] Los errores coinciden con `[PO]` §4.3 y con cada contrato.
- [x] PostgreSQL es la fuente de verdad; MongoDB no se usa para estas entidades.
- [x] Los límites de fuente se registran sin inventar políticas.
- [x] No se creó código, SQL ejecutable, esquema ni migración.
