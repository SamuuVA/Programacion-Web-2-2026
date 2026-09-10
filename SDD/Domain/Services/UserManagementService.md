# UserManagementService

## 1. Descripción
Servicio de dominio **stateless** responsable de coordinar la gestión de usuarios de NexusMarket.

### Responsabilidades
- Registrar compradores.
- Incorporar vendedores mediante un Administrador.
- Actualizar estados de acceso.
- Validar unicidad de documento y correo.
- Aplicar roles y permisos del dominio.
- Registrar operaciones relevantes en auditoría.

## 2. Actores y permisos

| Operación | Actor |
|---|---|
| `registerBuyer` | Proceso de registro / comprador |
| `onboardSeller` | Administrador |
| `updateUserAccessStatus` | Administrador |

Un vendedor no puede registrarse por sí mismo.

## 3. Entidades y objetos relacionados
- `Usuario`
- `Comprador`
- `Vendedor`
- `Administrador`
- `SystemRole`
- `UserStatus`
- `CommercialStatus`
- `RegistroAuditoria`

## 4. Operaciones

### `registerBuyer`

```text
registerBuyer(buyerData): Buyer
```

**Propósito:** crear un comprador válido.

**Precondiciones**
- Datos obligatorios presentes.
- Documento de identidad único.
- Correo electrónico único.
- Información de comprador válida.
- Dirección principal válida.

**Flujo**
1. Validar datos.
2. Verificar documento y correo.
3. Asignar `COMPRADOR`.
4. Crear `Comprador`.
5. Registrar auditoría.

**Postcondiciones**
- Comprador creado con identificador único.
- Rol `COMPRADOR` asignado.
- Operación trazable.

### `onboardSeller`

```text
onboardSeller(adminId, sellerData): Seller
```

**Propósito:** incorporar un vendedor al Marketplace.

**Precondiciones**
- Administrador autenticado y autorizado.
- Datos válidos.
- Documento y correo no duplicados.

**Flujo**
1. Validar administrador.
2. Validar datos.
3. Verificar unicidad.
4. Crear `Vendedor`.
5. Asignar `VENDEDOR`.
6. Registrar auditoría.

### `updateUserAccessStatus`

```text
updateUserAccessStatus(adminId, userId, newStatus): Void
```

**Estados:** `ACTIVO`, `INACTIVO`, `BLOQUEADO`.

**Flujo**
1. Validar administrador.
2. Buscar usuario.
3. Validar nuevo estado.
4. Actualizar estado.
5. Registrar auditoría.

## 5. Reglas de negocio
- Toda operación requiere usuario autenticado.
- Cada usuario posee un único rol.
- Ningún participante administra información fuera de su rol.
- Documento y correo son únicos.
- Los vendedores no se auto-registran.
- Las operaciones administrativas relevantes deben auditarse.

## 6. Errores

| Situación | Resultado |
|---|---|
| Documento duplicado | Rechazar |
| Correo duplicado | Rechazar |
| Usuario no autenticado | Rechazar |
| Rol insuficiente | Rechazar |
| Vendedor intenta auto-registro | Rechazar |
| Usuario inexistente | Rechazar |
| Estado inválido | Rechazar |

## 7. Límites
No administra productos, inventario, pedidos, pagos, despachos, devoluciones, reembolsos ni reportes.
