# Evaluación de `PI-02 RegisterSeller`

**Fecha:** 2026-10-28  
**Estado:** `BLOCKED` para implementación.  
**Decisión:** no se implementó `PI-02` en esta iteración.

---

## 1. Qué exige `PI-02`

`BackendSDD/Application/nexusmarket-input-ports.md` §`PI-02` exige:

- un actor con rol `ADMINISTRADOR` y cuenta operativa (`SEL-01`, `DS-01`);
- `actorId`, `rolActor` y `correlationId` como contexto de entrada;
- creación atómica de `Usuario` (`VENDEDOR`), `PerfilVendedor` y primera `BodegaVendedor` (`SEL-02`, `DM-05`);
- `razonSocial`, `nombreBodega` y `ubicacionBodega` como `DireccionFisica`;
- estados iniciales `ACTIVO`/`ACTIVO`/`ACTIVA` (`DEC-W1-007`);
- auditoría y outbox en la misma transacción;
- rechazo `NO_AUTORIZADO` si el actor no es Administrador o no está operativo.

La postcondición es explícita: si falla la bodega, no debe quedar un vendedor operativo sin bodega inicial.

## 2. Qué existe hoy

| Elemento | Estado real | Evidencia |
|---|---|---|
| Rol `VENDEDOR` en la tabla `users` | Existe como valor permitido | `backend/migrations/001_initial.sql` |
| Tipos de dominio de vendedor/bodega | No existen | `backend/src/modules/` solo contiene `identity`, `buyers` y `cart` |
| Tablas `sellers`/`warehouses` | No existen | `001_initial.sql` crea `users`, `buyers`, `carts`, `audit_log`, `outbox` |
| Autenticación/sesión | No implementada | `DEC-IMPL-006`; `ADR-004` sigue `MISSING`; `L-27` abierta fuera del alcance de `PI-01` |
| Actor administrativo verificado | No existe | No hay middleware, sesión ni contexto de identidad |
| Composición de `DireccionFisica` | No fijada | `L-01`; `VO-DIR-02` | 
| Estados iniciales | Aprobados | `DEC-W1-007` |
| Contrato HTTP de la nueva ruta | No aprobado | `L-27` se cerró solo para las tres rutas actuales |
| Política de autorización | Documentada | `DS-01` y `SEL-01`; no hay mecanismo de identidad que la alimente |

## 3. Bloqueos concretos

1. **Identidad del Administrador.** `PI-02` no puede confiar en un `actorId`/`rolActor` enviado por el cliente. La fuente autoritativa de identidad no está decidida. `nexusmarket-input-ports.md` excluye `Login`/`Authenticate` de los puertos de entrada y deja la autenticación en el adaptador/middleware, pero el mecanismo sigue abierto.
2. **Composición de la dirección.** `ubicacionBodega` es obligatoria y de tipo `DireccionFisica`; `L-01` no fija campos, formatos ni validaciones. Elegir una cadena opaca o inventar campos contradiría la regla de no inventar reglas.
3. **Contrato HTTP y alcance.** La ruta de incorporación administrativa, el esquema de autenticación y los códigos no están aprobados. Crear `POST /api/v1/sellers` ahora sería inventar un contrato fuera del alcance cerrado de `L-27`.
4. **Persistencia.** Faltan tablas, restricciones de unicidad y claves foráneas para vendedor y bodega. La atomicidad `DM-05` exigiría una migración y una transacción nuevas, no una extensión implícita de `001_initial.sql`.

`L-09` no bloquea el alta inicial porque `DEC-W1-007` fija el estado inicial; sí seguiría abierto para transiciones posteriores. `L-02`/`L-03` no bloquean más que en `PI-01`, porque se pueden aplicar las mismas reglas mínimas ya aprobadas.

## 4. Opciones evaluadas

| Opción | Descripción | Ventaja | Riesgo / motivo de descarte |
|---|---|---|---|
| A. Implementar solo el caso de uso con un `actorId` inyectado | Crear dominio/aplicación y probar atomicidad sin HTTP | Avanza el núcleo | No satisface `RG-01`/`SEL-01` en un borde real; podría crear una API insegura o una interfaz ficticia |
| B. Implementar autenticación de Administrador y después `PI-02` | Añadir login/sesión, middleware, actor y luego la incorporación | Cierra el bloqueo de identidad | Excede esta iteración; no hay puerto de login ni `ADR-004`; requiere decisión explícita |
| C. Operación administrativa interna sin HTTP | Script/CLI con identidad de operador del sistema | Evita inventar una ruta pública | El modelo exige un actor Administrador; la identidad del operador del sistema no está definida |
| D. Mantener `PI-02` bloqueado | No implementar hasta decisiones | No inventa reglas ni contratos | No entrega la funcionalidad todavía |

**Recomendación:** opción D para esta iteración. La opción B es la senda correcta si el propietario quiere continuar con `PI-02`; la opción A solo sería aceptable como pieza interna de pruebas y no debe exponerse como endpoint.

## 5. Preguntas necesarias antes de implementar

1. **Autenticación/autorización:** ¿se adopta sesión opaca server-side con cookie `HttpOnly`/`SameSite` (propuesta de `DEC-IMPL-006`), bearer token, o un proxy de confianza que inyecte identidad? Cualquier opción requiere un `ADR-004` y una prueba de que el cuerpo no puede suplantar al Administrador.
2. **Dirección física:** ¿qué campos mínimos componen `DireccionFisica` y cuáles son obligatorios? Sin esta decisión no puede validarse `ubicacionBodega`.
3. **Ruta administrativa:** ¿se autoriza una ruta concreta para `PI-02` y un esquema de error compatible con el contrato actual, o se implementa primero como operación interna?

## 6. Criterios de aceptación cuando se desbloquee

- Actor autenticado con rol `ADMINISTRADOR` y estado `ACTIVO`; el cuerpo no puede declarar identidad.
- Unicidad de correo y documento bajo concurrencia.
- Creación atómica de `Usuario`, `PerfilVendedor`, primera `BodegaVendedor`, auditoría y outbox.
- Rollback comprobado después de una escritura parcial; no queda vendedor sin bodega.
- `201`/errores de autorización, validación y conflicto documentados y probados.
- Migración versionada y prueba PostgreSQL real.
- Sin implementar catálogo, inventario, productos ni transiciones no aprobadas.
