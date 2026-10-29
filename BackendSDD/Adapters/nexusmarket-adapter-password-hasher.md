# NEXUSMARKET — ADOUT-13 Hashing de credenciales

**Identificador:** `ADOUT-13`  
**Tipo:** adaptador de salida / capacidad técnica  
**Capa/módulo:** `src/modules/identity/adapters/` o `src/shared/infrastructure/` según composición  
**Estado documental:** `COMPLETO`; política aprobada en `DEC-W1-008`
**Última actualización:** 28 de octubre de 2026
**Documento canónico:** este archivo  
**Catálogo:** [`nexusmarket-adapters.md`](nexusmarket-adapters.md)

---

## 1. Identificación y propósito

Este adapter implementa `PO-22 PasswordHasher`. Su propósito es transformar una credencial en claro en un hash verificable y comparar una credencial candidata con un hash almacenado, sin que la aplicación o el dominio dependan del algoritmo, de la biblioteca ni de los parámetros criptográficos.

No autentica usuarios, no decide políticas de contraseña, no gestiona sesiones y no almacena credenciales. La política está aprobada en `DEC-W1-008`: Argon2id v=19, `m=19456` KiB, `t=2`, `p=1`, sal de 16 bytes, salida de 32 bytes y formato PHC; la biblioteca concreta se elige en W4.

---

## 2. Límites arquitectónicos

| Aspecto | Definición |
|---|---|
| Capa | Adaptador de salida / infraestructura técnica. |
| Frontera | Contrato `PO-22` ↔ biblioteca criptográfica o servicio de hashing. |
| Dependencias permitidas | `PO-22`, biblioteca/servicio aprobado, configuración y logger protegido. |
| Dependencias prohibidas | Dominio, HTTP, repositorios, reglas de autenticación, proveedores de identidad. |
| Consumidores | `PI-01`, `PI-02` a través de la aplicación. |
| Composición | El punto de composición inyecta la implementación. |

**No le corresponde:** validar la fortaleza de la contraseña, decidir el estado de la cuenta, autenticar, emitir tokens, comparar identidades ni registrar la credencial. Tampoco define el formato de almacenamiento del hash; el adapter devuelve el valor que el contrato permita.

---

## 3. Puertos y contratos relacionados

| Puerto | Relación | Propósito | Dirección | Resultado |
|---|---|---|---|---|
| `PO-22 PasswordHasher` | Implementa | Generar un hash verificable y verificar una credencial candidata. | Aplicación → adapter | Hash opaco o resultado de verificación. |
| `PI-01 RegisterBuyer` | Consumidor indirecto | Hashear la credencial antes de persistir el usuario. | Aplicación → `PO-22` | Hash para `PO-01`. |
| `PI-02 RegisterSeller` | Consumidor indirecto | Hashear la credencial antes de persistir el usuario. | Aplicación → `PO-22` | Hash para `PO-01`. |

El hash resultante es un valor opaco para la aplicación; no se interpreta como contraseña ni se compara fuera del adapter.

---

## 4. Flujo conceptual

1. La aplicación recibe una credencial en claro en el límite de registro.
2. Valida la forma y la política de negocio correspondiente; el adapter no la decide.
3. Invoca `PO-22` para generar el hash.
4. El adapter aplica el mecanismo aprobado y devuelve un hash verificable.
5. La aplicación persiste el hash mediante `PO-01`; nunca persiste la credencial en claro.
6. Para verificar, la aplicación recupera el hash y envía la credencial candidata al adapter.
7. El adapter compara de forma segura y devuelve un resultado booleano/controlado.
8. La credencial en claro no se registra, no se audita y no se devuelve en la respuesta.

---

## 5. Transformación y traducción de datos

| Elemento | Traducción |
|---|---|
| Credencial en claro | Texto de entrada → hash opaco; no se conserva ni se registra. |
| Hash almacenado | Valor opaco → entrada de verificación; no se interpreta fuera del adapter. |
| Resultado de verificación | Comparación interna → resultado controlado; no se expone el hash. |
| Parámetros | Configuración del mecanismo → Argon2id v=19, `m=19456`, `t=2`, `p=1`; el formato PHC conserva los parámetros aplicados. |
| Errores | Fallo del mecanismo → `NO_DISPONIBLE`; formato inválido → `DATOS_INVALIDOS`. |

**Reglas de seguridad:** la comparación debe ser resistente a ataques de tiempo; la credencial en claro no se escribe en logs, auditoría, outbox ni mensajes de error; el hash no se devuelve al cliente. El adapter no decide la longitud mínima, complejidad ni rotación; esas reglas están en `DEC-W1-008`.

---

## 6. Errores y resultados excepcionales

| Código | Situación | Responsabilidad del adapter |
|---|---|---|
| `DATOS_INVALIDOS` | Credencial o hash con formato inválido. | Rechazar sin revelar detalles sensibles. |
| `NO_DISPONIBLE` | El mecanismo no está configurado o falló. | Informar indisponibilidad; no usar un hash inseguro. |
| `OPERACION_NO_SOPORTADA` | Se solicita un algoritmo o modo no contemplado. | Rechazar; no improvisar. |

No se inventan algoritmos, parámetros, longitudes, políticas de contraseña ni códigos HTTP. La política está aprobada en `DEC-W1-008`; la implementación y la biblioteca quedan para W4.

---

## 7. Dependencias y restricciones

| Dependencia | Tipo | Restricción |
|---|---|---|
| Biblioteca/servicio de hashing | Decisión técnica de W4 | Debe implementar Argon2id v=19 con los parámetros de `DEC-W1-008`; no se instala en W1. |
| Configuración de secretos | Infraestructura | Fuera del repositorio; no se registra. |
| `PO-22` | Contrato | Solo hash/verificación; no autentica ni persiste. |
| `DEC-W1-008` | Política | Algoritmo, parámetros, formato PHC y fortaleza aprobados. |

**Restricciones:** no se registra la credencial en claro; no se usa un algoritmo obsoleto o no aprobado; no se compara con `===` fuera del adapter; no se devuelve el hash al cliente; no se usa el adapter como almacén de credenciales.

---

## 8. Trazabilidad

| Elemento | Fuente |
|---|---|
| Existencia y responsabilidad | `[ARQ]` §7.3, §11.2; `[PO]` §5.4 |
| Contrato | `[PO]` `PO-22` |
| Credenciales y usuario | `[MOD]` §6.1; `[VO]` §6.4, §8.1 |
| Registro | `[PI]` `PI-01`, `PI-02`; `[UC]` `UC-01` |
| Política | `DEC-W1-008`; `[EST]` §7 |

---

## 9. Criterios de validación documental

- [x] El adapter implementa únicamente `PO-22`.
- [x] La credencial en claro no se persiste, registra ni devuelve.
- [x] El hash es opaco y la verificación ocurre dentro del adapter.
- [x] La política Argon2id y sus parámetros están trazados a `DEC-W1-008`.
- [x] No se autentica ni se decide la política de contraseña en el adapter.
- [x] Los errores no revelan información sensible.
- [x] No se creó código, algoritmo ejecutable, configuración ni prueba.
