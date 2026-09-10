# Domain Model - NexusMarket

## 1. Propósito

El **Modelo de Dominio de NexusMarket** representa los conceptos de negocio que intervienen en la operación del marketplace: usuarios, compradores, vendedores, productos, variantes, bodegas, inventario, carrito, pedidos, movimientos de inventario y auditoría.

El modelo se deriva de la especificación funcional del negocio y busca expresar con claridad:

- Qué información representa cada concepto.
- Qué responsabilidades tiene cada entidad.
- Cómo se relacionan las entidades.
- Qué restricciones deben cumplirse.
- Qué estados y comportamientos forman parte del ciclo comercial.
- Qué elementos requieren trazabilidad mediante auditoría.

La especificación establece que NexusMarket centraliza la operación comercial entre compradores y vendedores, incluyendo registro, catálogo, inventario, carrito, pedidos, facturación, logística, devoluciones, reembolsos y consulta administrativa.

---

## 2. Principios del modelo

El modelo sigue principios de **Diseño Orientado a Objetos (OOD)** y **Diseño Guiado por el Dominio (DDD)**.

### 2.1 Entidades

Las entidades poseen una identidad propia y representan elementos que pueden mantenerse y cambiar durante la operación del negocio.

Ejemplos:

- `Usuario`
- `Comprador`
- `Vendedor`
- `Producto`
- `Variante`
- `Bodega`
- `Inventario`
- `Pedido`
- `MovimientoInventario`
- `RegistroAuditoria`

### 2.2 Objetos de valor

Los conceptos que representan valores controlados del negocio se modelan como objetos de valor o catálogos de dominio. Su comportamiento y valores válidos se encuentran documentados en `Domain Objec Value.md`.

### 2.3 Servicios de dominio

Las operaciones que involucran varias entidades o requieren coordinar reglas entre diferentes conceptos se modelan mediante servicios de dominio. Se encuentran documentadas en `Domain Service.md`.

---

# 3. Jerarquía de clases

```text
Usuario (Abstracto)
├── Comprador
└── UsuarioAdministrativo (Abstracto)
    ├── Vendedor
    ├── OperadorLogistico
    ├── Administrador
    └── Supervisor

Producto (Abstracto)
├── ProductoFisico
└── ProductoDigital

Bodega (Abstracto)
├── BodegaMarketplace
└── BodegaVendedor

Inventario
Variante
CarritoDeCompras
ItemCarrito
Pedido
ItemPedido
MovimientoInventario
RegistroAuditoria
```

### 3.1 Regla de especialización de usuarios

Todo usuario debe pertenecer a una única especialización funcional y tener un único rol dentro del sistema.

Los roles definidos por la especificación son:

- Comprador.
- Vendedor.
- Operador Logístico.
- Administrador.
- Supervisor.

Un participante no puede administrar información fuera del alcance correspondiente a su rol.

---

# 4. Relaciones principales

```text
Usuario
│
├── Comprador
│   ├── posee → CarritoDeCompras
│   │            └── contiene → ItemCarrito
│   │                          └── referencia → Variante
│   │
│   └── realiza → Pedido
│                └── contiene → ItemPedido
│                              └── referencia → Variante
│
└── UsuarioAdministrativo
    ├── Vendedor
    │   ├── administra → Producto / Catálogo
    │   └── posee → BodegaVendedor
    │
    ├── OperadorLogistico
    │   └── ejecuta → operaciones logísticas
    │
    ├── Administrador
    │   ├── incorpora → Vendedor
    │   └── administra → BodegaMarketplace
    │
    └── Supervisor
        └── consulta → información operativa y reportes

Producto
└── posee → Variante
             └── tiene stock en → Inventario
                                  └── pertenece a → Bodega

MovimientoInventario
└── afecta → Variante + Bodega
└── realizadoPor → Usuario
└── registradoEn → RegistroAuditoria
```

---

# 5. Entidades y clases

## 5.1 Usuario (Abstracto)

### Propósito

Representa a cualquier persona autorizada para interactuar con NexusMarket.

La clase concentra la información común de identificación y estado operativo. No se instancia directamente; se especializa en `Comprador` o `UsuarioAdministrativo`.

### Atributos

| Atributo | Tipo | Obligatorio | Restricción | Descripción |
|---|---|---:|---|---|
| `id` | `int` | Sí | Único | Identificador único del usuario. |
| `nombreCompleto` | `String` | Sí | No vacío | Nombre oficial del usuario. |
| `correoElectronico` | `String` | Sí | Único | Medio principal de acceso y comunicación. |
| `contraseña` | `String` | Sí | Almacenamiento seguro | Representación segura de la credencial. |
| `rol` | `RolSistema` | Sí | Un único rol | Define responsabilidades y permisos. |
| `estado` | `EstadoUsuario` | Sí | Valor permitido | Condición operativa de la cuenta. |

### Reglas

1. El correo electrónico debe ser único.
2. El documento de identidad debe ser único en la plataforma, según la validación crítica de la especificación.
3. Toda operación debe ejecutarse por un usuario autenticado.
4. Cada usuario tiene exactamente un rol.
5. Un usuario no puede administrar información fuera de las responsabilidades de su rol.

---

## 5.2 Comprador

### Propósito

Representa al cliente registrado que consulta productos, administra su carrito y realiza pedidos.

### Herencia

`Comprador` hereda de `Usuario`.

### Atributos

| Atributo | Tipo | Obligatorio | Descripción |
|---|---|---:|---|
| `direccionPrincipal` | `String` | Sí | Dirección habitual para las entregas. |
| `direccionesAdicionales` | `List<String>` | No | Direcciones secundarias de entrega. |
| `estadoComercial` | `EstadoComercial` | Sí | Determina si puede realizar compras. |

### Relaciones

- Un comprador posee un carrito.
- Un comprador puede realizar cero o más pedidos.
- El comprador solo administra su propia información comercial.
- El comprador no administra inventarios ni información de otros compradores.

---

## 5.3 UsuarioAdministrativo (Abstracto)

Representa la especialización base de los usuarios que realizan actividades administrativas, comerciales, logísticas o de supervisión.

### Especializaciones

- `Vendedor`
- `OperadorLogistico`
- `Administrador`
- `Supervisor`

No debe instanciarse directamente.

---

## 5.4 Vendedor

### Propósito

Representa al comerciante responsable de ofrecer productos en el marketplace.

### Herencia

`Vendedor` hereda de `UsuarioAdministrativo`.

### Atributos

| Atributo | Tipo | Obligatorio | Descripción |
|---|---|---:|---|
| `razonSocial` | `String` | Sí | Nombre comercial o razón social del vendedor. |

### Responsabilidades

- Administrar sus productos.
- Definir variantes de productos.
- Gestionar sus bodegas de vendedor.
- Participar en la administración de inventario de sus bodegas según las reglas operativas.

### Restricción importante

Los vendedores **no pueden autorregistrarse**. Son incorporados exclusivamente por un Administrador.

---

## 5.5 OperadorLogistico

### Propósito

Representa al usuario encargado de las actividades físicas de almacenamiento y despacho.

### Herencia

`OperadorLogistico` hereda de `UsuarioAdministrativo`.

### Responsabilidades

- Operación física de bodegas.
- Preparación y empaque.
- Despacho de pedidos.
- Ejecución de movimientos de inventario correspondientes a sus responsabilidades.

---

## 5.6 Administrador

### Propósito

Responsable de la administración global del marketplace.

### Herencia

`Administrador` hereda de `UsuarioAdministrativo`.

### Responsabilidades

- Incorporar vendedores.
- Administrar bodegas del Marketplace.
- Administrar estados operativos de usuarios.
- Ejecutar las funciones administrativas definidas por la especificación.

---

## 5.7 Supervisor

### Propósito

Perfil orientado a consulta, seguimiento y supervisión operativa.

### Herencia

`Supervisor` hereda de `UsuarioAdministrativo`.

### Responsabilidades

- Consultar información operativa.
- Dar seguimiento al funcionamiento del negocio.
- Consultar reportes administrativos consolidados.

El documento funcional no define operaciones de modificación para este perfil.

---

# 6. Productos y catálogo

## 6.1 Producto (Abstracto)

Representa un bien ofrecido por un vendedor.

### Atributos

| Atributo | Tipo | Obligatorio | Descripción |
|---|---|---:|---|
| `id` | `int` | Sí | Identificador único del producto. |
| `nombre` | `String` | Sí | Nombre comercial. |
| `descripcion` | `String` | Sí | Características generales. |
| `categoria` | `CategoriaProducto` | Sí | Clasificación comercial. |
| `estado` | `EstadoProducto` | Sí | Estado de publicación. |
| `vendedor` | `Vendedor` | Sí | Vendedor propietario. |

### Reglas

- Un producto pertenece a un único vendedor.
- Un producto posee una o más variantes.
- El producto puede estar `PUBLICADO`, `SUSPENDIDO` o `DESCONTINUADO`.
- El catálogo diferencia productos físicos y digitales.

---

## 6.2 ProductoFisico

Producto que requiere:

- Existencias en inventario.
- Asociación a una bodega.
- Reserva de stock.
- Preparación y despacho.
- Transporte.
- Confirmación de entrega.

Hereda de `Producto`.

---

## 6.3 ProductoDigital

Producto cuya entrega se realiza de manera digital después de la confirmación exitosa del pago.

Según la especificación, omite los pasos de:

- Almacenamiento físico.
- Reserva de inventario físico.
- Empaque.
- Despacho físico.
- Transporte físico.

Hereda de `Producto`.

---

## 6.4 Variante

Representa una presentación concreta de un producto, por ejemplo:

- Color.
- Talla.
- Modelo.
- Combinación de características.

El inventario se controla a nivel de variante y no directamente a nivel de producto.

### Atributos

| Atributo | Tipo | Obligatorio | Restricción |
|---|---|---:|---|
| `id` | `int` | Sí | Único |
| `sku` | `String` | Sí | Único |
| `nombreVariante` | `String` | Sí | No vacío |
| `precio` | `BigDecimal` | Sí | Valor monetario válido |

### Relaciones

- Una variante pertenece a un producto.
- Una variante puede tener inventario en diferentes bodegas.
- Una variante es la unidad concreta utilizada para controlar existencias y precios.

---

# 7. Bodegas e inventario

## 7.1 Bodega (Abstracta)

Representa el espacio físico donde se almacena inventario.

### Atributos

| Atributo | Tipo | Obligatorio | Descripción |
|---|---|---:|---|
| `id` | `int` | Sí | Identificador de la bodega. |
| `nombre` | `String` | Sí | Nombre de identificación. |
| `ubicacion` | `String` | Sí | Ubicación física. |
| `tipoBodega` | `TipoBodega` | Sí | Marketplace o Vendedor. |

### Especializaciones

- `BodegaMarketplace`: administrada por la operación central.
- `BodegaVendedor`: gestionada por un vendedor específico.

Una `BodegaVendedor` debe identificar a su vendedor propietario.

---

## 7.2 Inventario

Representa la existencia de una variante específica dentro de una bodega específica.

### Atributos

| Atributo | Tipo | Obligatorio | Descripción |
|---|---|---:|---|
| `id` | `int` | Sí | Identificador del registro. |
| `bodega` | `Bodega` | Sí | Bodega donde se encuentra el stock. |
| `variante` | `Variante` | Sí | Variante almacenada. |
| `cantidadDisponible` | `int` | Sí | Unidades disponibles para comercialización. |
| `cantidadReservada` | `int` | Sí | Unidades comprometidas por pedidos. |

### Reglas críticas

- `cantidadDisponible >= 0`.
- `cantidadReservada >= 0`.
- No se permiten existencias negativas.
- No se puede reservar stock inexistente.
- No se puede reservar stock marcado como dañado o no disponible.
- El inventario siempre está vinculado a una variante y una bodega.

### Movimientos

Los movimientos definidos por el negocio son:

1. `INGRESO`
2. `RESERVA`
3. `SALIDA_VENTA`
4. `AJUSTE`
5. `DEVOLUCION`

Cada movimiento debe quedar registrado en auditoría.

---

# 8. Carrito de compras

## 8.1 CarritoDeCompras

Representa la selección provisional realizada por un comprador antes de confirmar un pedido.

### Atributos

| Atributo | Tipo | Descripción |
|---|---|---|
| `id` | `Integer` | Identificador del carrito. |
| `comprador` | `Comprador` | Propietario del carrito. |
| `items` | `List<ItemCarrito>` | Elementos seleccionados. |

### Reglas

- El carrito pertenece a un comprador.
- Un comprador dispone de su propio carrito.
- El carrito representa una selección provisional, no un compromiso comercial formal.
- La confirmación del carrito inicia la creación del pedido.

---

## 8.2 ItemCarrito

Representa una línea de producto seleccionada.

| Atributo | Tipo | Descripción |
|---|---|---|
| `variante` | `Variante` | Variante seleccionada. |
| `cantidad` | `int` | Cantidad solicitada. |
| `precioUnitario` | `BigDecimal` | Precio registrado al agregar el artículo. |

---

# 9. Pedido

## 9.1 Pedido

Representa el compromiso comercial formal generado a partir de la compra del comprador.

### Atributos

| Atributo | Tipo | Descripción |
|---|---|---|
| `id` | `int` | Identificador único. |
| `comprador` | `Comprador` | Comprador que realizó la compra. |
| `fechaCreacion` | `LocalDateTime` | Momento de creación. |
| `estadoPedido` | `EstadoPedido` | Estado del ciclo de vida. |
| `estadoPago` | `EstadoPago` | Estado financiero. |
| `direccionEnvio` | `String` | Dirección confirmada de entrega. |
| `items` | `List<ItemPedido>` | Productos adquiridos. |

### Ciclo de vida

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

También se contempla `CANCELADO` como estado permitido.

### Reglas

- Un pedido debe esperar confirmación de pago antes de iniciar el alistamiento.
- Al confirmarse el pago, se inicia la reserva del inventario para productos físicos.
- Un pedido despachado representa la salida física de la mercancía.
- Un pedido entregado/finalizado no puede modificarse bajo ninguna circunstancia.
- Los compradores solo pueden consultar y gestionar sus propios pedidos.

---

## 9.2 ItemPedido

Representa una línea confirmada del pedido.

| Atributo | Tipo | Descripción |
|---|---|---|
| `variante` | `Variante` | Variante adquirida. |
| `cantidad` | `Integer` | Cantidad comprada. |
| `precioAplicado` | `BigDecimal` | Precio utilizado al confirmar la venta. |

El `precioAplicado` permite conservar el valor utilizado en la operación, independientemente de posteriores cambios en el catálogo.

---

# 10. MovimientoInventario

Representa un evento operativo que modifica o compromete el inventario.

### Atributos

| Atributo | Tipo | Descripción |
|---|---|---|
| `id` | `Integer` | Identificador del movimiento. |
| `tipoMovimiento` | `TipoMovimientoInventario` | Tipo de operación realizada. |
| `fecha` | `LocalDateTime` | Fecha y hora del movimiento. |
| `cantidad` | `Integer` | Unidades involucradas. |
| `variante` | `Variante` | Variante afectada. |
| `bodega` | `Bodega` | Bodega afectada. |
| `realizadoPor` | `Usuario` | Usuario responsable. |

### Regla de trazabilidad

Todo movimiento de inventario debe generar un registro correspondiente en `RegistroAuditoria`.

---

# 11. RegistroAuditoria

Representa el historial inmutable de acciones críticas del negocio.

Registra, entre otros:

- Movimientos de inventario.
- Cambios de estado de pedidos.
- Ajustes operativos.
- Acciones administrativas relevantes.
- Información necesaria para reconstruir la operación realizada.

### Atributos

| Atributo | Tipo | Descripción |
|---|---|---|
| `auditId` | Identificador | Identificador único. |
| `tipoEvento` | Tipo de evento | Acción registrada. |
| `marcaTiempo` | `LocalDateTime` | Momento de ejecución. |
| `realizadoPorUsuario` | `Usuario` | Usuario responsable. |
| `rolUsuario` | `RolSistema` | Rol vigente durante la operación. |
| `detalles` | `Map<String,Object>` | Información adicional de trazabilidad. |

### Invariantes

Los registros son **append-only**:

- Se pueden agregar.
- No se pueden modificar.
- No se pueden eliminar.

---

# 12. Ciclo integrado de compra e inventario

```text
Comprador
   │
   └── confirma CarritoDeCompras
              │
              ▼
        Pedido = PENDIENTE_PAGO
              │
              │ Pago confirmado
              ▼
        Pedido = PAGADO
              │
              ▼
     Reserva de inventario
              │
              ├── disponible ↓
              ├── reservado ↑
              ├── MovimientoInventario(RESERVA)
              └── RegistroAuditoria
              │
              ▼
       Preparación / Empaque
              │
              ▼
       Pedido = DESPACHADO
              │
              ├── MovimientoInventario(SALIDA_VENTA)
              └── RegistroAuditoria
              │
              ▼
       Pedido = ENTREGADO
              │
              ▼
        Pedido inmutable
```

Para productos digitales, la especificación establece una entrega inmediata después del pago y no contempla el flujo físico de inventario y despacho.

---

# 13. Reglas generales del modelo

| Código | Regla |
|---|---|
| RG-01 | Toda operación debe ser ejecutada por un usuario autenticado. |
| RG-02 | Cada usuario tiene un único rol. |
| RG-03 | Ningún participante puede administrar información fuera de su rol. |
| INV-01 | No se permiten existencias negativas. |
| INV-02 | No se puede reservar inventario inexistente. |
| INV-03 | No se puede reservar inventario dañado o no disponible. |
| ORD-01 | Un pedido entregado/finalizado no puede modificarse. |
| USR-01 | Correo y documento de identidad deben ser únicos. |
| SEL-01 | Los vendedores no pueden autorregistrarse. |
| AUD-01 | Todo movimiento de inventario debe quedar auditado. |
| AUD-02 | Los registros de auditoría son inmutables. |

---

# 14. Responsabilidades por participante

| Proceso | Comprador | Vendedor | Operador Logístico | Administrador | Supervisor |
|---|:---:|:---:|:---:|:---:|:---:|
| Registro de vendedores |  |  |  | ✔ |  |
| Registro/gestión de productos |  | ✔ |  |  |  |
| Administración de inventario |  | ✔ | ✔ |  |  |
| Gestión de pedidos | ✔ | ✔ | ✔ |  |  |
| Consulta/seguimiento | Propios | Propios | Operativo | Global | ✔ |
| Reembolsos |  | ✔ |  | ✔ | Consulta |

> La matriz refleja la distribución funcional indicada por la especificación. Las operaciones no detalladas explícitamente en el documento deben definirse en una especificación posterior antes de implementarse.

---

# 15. Límites del modelo

El modelo de dominio **no define**:

- Interfaces gráficas.
- Aplicaciones móviles.
- Portales web.
- Mecanismos técnicos de autenticación.
- Tecnología de implementación.
- Arquitectura de software.
- Tecnología de almacenamiento.

Estos elementos están fuera del alcance de la especificación funcional.
