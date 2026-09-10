# Objetos de Valor de Dominio - NexusMarket

## 1. Propósito

Los **Objetos de Valor (Value Objects)** representan conceptos del negocio cuyo significado depende de sus valores y no de una identidad propia.

En NexusMarket se utilizan para evitar que estados, roles, categorías y tipos de operación sean representados mediante cadenas arbitrarias dispersas por el sistema.

Su función principal es:

- Restringir valores a opciones válidas.
- Centralizar definiciones de negocio.
- Facilitar validaciones.
- Evitar inconsistencias terminológicas.
- Mantener reglas del dominio fuera de las capas técnicas.
- Expresar claramente el significado de cada estado o clasificación.

---

# 2. Características generales

Los objetos de valor y catálogos definidos en este documento deben cumplir:

### Inmutabilidad

Una vez creado un valor de dominio, su definición no debe modificarse durante su uso.

### Igualdad por valor

Dos instancias con los mismos valores representan el mismo concepto de negocio, independientemente de su referencia en memoria.

### Valores controlados

No se deben aceptar cadenas arbitrarias cuando el dominio define un conjunto cerrado de valores.

### Semántica de negocio

Cada valor debe tener un código estable, un nombre legible y una descripción clara cuando corresponda.

---

# 3. DomainCatalog

`DomainCatalog` representa la abstracción común para valores comerciales controlados.

| Atributo | Tipo | Descripción |
|---|---|---|
| `codigo` | `String` | Código único utilizado para identificar el valor. |
| `nombre` | `String` | Nombre legible para usuarios y documentación. |
| `descripcion` | `String` | Significado y alcance operativo del valor. |

### Reglas

1. `codigo` debe ser único dentro del catálogo correspondiente.
2. El código no debe cambiar una vez utilizado por el dominio.
3. Los valores deben pertenecer al catálogo definido.
4. No se deben aceptar literales no controlados para representar estados de negocio.

---

# 4. SystemRole

Representa el rol operativo asignado a un usuario.

### Valores permitidos

| Código | Nombre | Responsabilidad principal |
|---|---|---|
| `COMPRADOR` | Comprador | Explora productos, administra su carrito y realiza pedidos. |
| `VENDEDOR` | Vendedor | Registra productos, variantes y administra sus bodegas. |
| `OPERADOR_LOGISTICO` | Operador Logístico | Gestiona operaciones físicas de inventario, preparación y despacho. |
| `ADMINISTRADOR` | Administrador | Incorpora vendedores y administra recursos centrales del marketplace. |
| `SUPERVISOR` | Supervisor | Consulta, seguimiento y reportes operativos. |

### Regla

Cada usuario debe tener exactamente un rol.

---

# 5. EstadoUsuario

Representa la condición de acceso operativo de una cuenta.

| Código | Nombre | Significado |
|---|---|---|
| `ACTIVO` | Activo | El usuario puede autenticarse y realizar operaciones permitidas. |
| `INACTIVO` | Inactivo | La cuenta está deshabilitada temporalmente. |
| `BLOQUEADO` | Bloqueado | La cuenta está bloqueada por razones de seguridad o administración. |

### Regla

El cambio de estado debe realizarse mediante las funciones administrativas correspondientes y respetar los permisos del ejecutor.

---

# 6. EstadoComercial

Representa si un comprador está habilitado para realizar nuevas operaciones comerciales.

| Código | Nombre | Significado |
|---|---|---|
| `HABILITADO` | Habilitado | Puede realizar pedidos y continuar el proceso comercial. |
| `RESTRINGIDO` | Restringido | No puede realizar nuevos pedidos debido a restricciones de negocio. |

### Regla

Un comprador restringido no debe iniciar nuevas compras mientras permanezca en dicho estado.

---

# 7. EstadoProducto

Representa el estado de publicación de un producto.

| Código | Nombre | Significado |
|---|---|---|
| `PUBLICADO` | Publicado | Producto visible y disponible en el catálogo. |
| `SUSPENDIDO` | Suspendido | Producto temporalmente oculto de la venta. |
| `DESCONTINUADO` | Descontinuado | Producto retirado de forma permanente de la venta. |

### Interpretación

- **Publicado:** forma parte de la oferta comercial visible.
- **Suspendido:** se conserva el producto, pero no debe estar disponible para nuevas ventas mientras dure la suspensión.
- **Descontinuado:** representa el final de su comercialización.

---

# 8. EstadoPedido

Representa el ciclo de vida comercial del pedido.

| Código | Nombre | Significado |
|---|---|---|
| `CARRITO` | Carrito | Selección provisional de artículos. |
| `PENDIENTE_PAGO` | Pendiente de pago | Pedido creado, esperando confirmación financiera. |
| `PAGADO` | Pagado | Pago confirmado; comienza la preparación. |
| `DESPACHADO` | Despachado | Pedido preparado y entregado al transportista. |
| `ENTREGADO` | Entregado | Pedido recibido por el comprador y finalizado. |
| `CANCELADO` | Cancelado | Pedido anulado antes del despacho. |

### Flujo principal

```text
CARRITO
   ↓
PENDIENTE_PAGO
   ↓
PAGADO
   ↓
DESPACHADO
   ↓
ENTREGADO
```

### Regla crítica

Un pedido en estado `ENTREGADO` es inmutable y no puede modificarse.

### Cancelación

La especificación contempla `CANCELADO` para pedidos anulados antes del despacho. Las condiciones detalladas de cancelación deben mantenerse alineadas con las reglas de negocio que se definan para el proceso de pedidos.

---

# 9. EstadoPago

Representa la condición financiera de una operación.

| Código | Nombre | Significado |
|---|---|---|
| `PENDIENTE` | Pendiente | Pago iniciado o esperado, pero aún no finalizado. |
| `APROBADO` | Aprobado | Fondos autorizados y capturados correctamente. |
| `RECHAZADO` | Rechazado | El procesador financiero rechazó el pago. |
| `REEMBOLSADO` | Reembolsado | Los fondos fueron devueltos después de una devolución validada. |

### Relación con el pedido

El estado de pago es independiente del estado logístico del pedido, aunque influye directamente en la transición hacia `PAGADO`.

---

# 10. TipoMovimientoInventario

Representa las operaciones válidas que modifican o comprometen el inventario.

| Código | Nombre | Efecto conceptual |
|---|---|---|
| `INGRESO` | Ingreso | Añade existencias por carga inicial o reabastecimiento. |
| `RESERVA` | Reserva | Compromete temporalmente existencias para un pedido. |
| `SALIDA_VENTA` | Salida por venta | Registra la salida física definitiva al despachar. |
| `AJUSTE` | Ajuste | Corrige cantidades por auditoría, daños o pérdidas. |
| `DEVOLUCION` | Devolución | Registra el reingreso derivado de una devolución aceptada. |

### Reglas

- Todo movimiento debe indicar variante y bodega.
- Todo movimiento debe identificar al usuario responsable.
- Todo movimiento debe quedar registrado en auditoría.
- Las operaciones no pueden provocar inventario negativo.

---

# 11. TipoBodega

Clasifica las bodegas según su propiedad y administración.

| Código | Nombre | Significado |
|---|---|---|
| `MARKETPLACE` | Marketplace | Bodega administrada directamente por la organización central. |
| `VENDEDOR` | Vendedor | Bodega propiedad de un vendedor y gestionada por este. |

### Regla

Las bodegas de vendedor deben estar asociadas al vendedor responsable.

---

# 12. CategoriaProducto

Clasifica comercialmente los productos.

| Código | Nombre | Alcance |
|---|---|---|
| `ELECTRONICA` | Electrónica | Electrónicos y accesorios tecnológicos. |
| `ROPA` | Ropa y Moda | Prendas, calzado y artículos de moda. |
| `HOGAR` | Hogar y Muebles | Artículos domésticos, muebles y utensilios. |
| `DIGITAL` | Software y Digital | Descargas, licencias y contenido digital. |

La categoría pertenece al producto y permite clasificar la oferta del catálogo.

---

# 13. Enumeraciones primitivas

No todos los conceptos necesitan un catálogo completo. Algunos representan conjuntos técnicos simples.

## 13.1 GravedadAuditoria

Representa la importancia o severidad de un evento de auditoría.

Valores:

```text
INFORMACION
ADVERTENCIA
ERROR
CRITICO
```

### Uso conceptual

- `INFORMACION`: operación normal registrada.
- `ADVERTENCIA`: evento que requiere atención.
- `ERROR`: operación que produjo una condición anómala.
- `CRITICO`: evento de alta importancia operativa o de control.

---

## 13.2 MetodoEntrega

Representa el mecanismo de entrega según el tipo de producto.

Valores:

```text
ENVIO_FISICO
DESCARGA_DIGITAL
```

### Relación con productos

- `ProductoFisico` → `ENVIO_FISICO`.
- `ProductoDigital` → `DESCARGA_DIGITAL`.

---

# 14. Reglas de validación de los Value Objects

| Código | Regla |
|---|---|
| VO-01 | Los códigos de catálogo deben ser únicos. |
| VO-02 | Los valores deben pertenecer al conjunto permitido. |
| VO-03 | Los objetos de valor son inmutables. |
| VO-04 | La igualdad se determina por sus valores. |
| VO-05 | Un usuario debe tener un único `SystemRole`. |
| VO-06 | Un pedido entregado no puede volver a un estado modificable. |
| VO-07 | Un inventario no puede adoptar cantidades negativas. |
| VO-08 | Un movimiento de inventario debe utilizar un tipo válido. |

---

# 15. Relación entre catálogos y entidades

```text
Usuario
 ├── rol → SystemRole
 └── estado → EstadoUsuario

Comprador
 └── estadoComercial → EstadoComercial

Producto
 ├── categoria → CategoriaProducto
 └── estado → EstadoProducto

Pedido
 ├── estadoPedido → EstadoPedido
 └── estadoPago → EstadoPago

Inventario / MovimientoInventario
 └── tipoMovimiento → TipoMovimientoInventario

Bodega
 └── tipoBodega → TipoBodega

ProductoFisico / ProductoDigital
 └── método de entrega → MetodoEntrega
```

Estos valores permiten que las entidades utilicen conceptos de negocio controlados en lugar de cadenas libres.
