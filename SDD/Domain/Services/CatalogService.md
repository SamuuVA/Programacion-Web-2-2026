# CatalogService

## 1. Descripción
Servicio de dominio **stateless** responsable de coordinar la gestión del catálogo de NexusMarket.

Gestiona productos, variantes, SKU y estados comerciales, manteniendo la relación entre producto y vendedor.

## 2. Actores
- `Vendedor`: registra y administra sus productos.
- Otros actores no adquieren permisos de catálogo por el simple hecho de participar en el sistema.

## 3. Entidades y objetos relacionados
- `Producto`
- `ProductoFisico`
- `ProductoDigital`
- `Variante`
- `Vendedor`
- `ProductStatus`
- `ProductCategory`
- `RegistroAuditoria`

## 4. Operaciones

### `publishProduct`

```text
publishProduct(sellerId, productData, variantsData): Product
```

**Precondiciones**
- Vendedor existente y autorizado.
- Datos del producto válidos.
- Variantes válidas.
- Cada variante posee SKU.
- Precio de variante válido.

**Flujo**
1. Validar vendedor.
2. Validar producto.
3. Crear producto.
4. Crear variantes.
5. Validar SKU y precio.
6. Establecer `PUBLICADO`.
7. Registrar auditoría.

**Postcondiciones**
- Producto asociado a su vendedor.
- Variantes asociadas al producto.
- Producto publicado si todas las validaciones se cumplen.

### `updateProductStatus`

```text
updateProductStatus(sellerId, productId, newStatus): Void
```

**Estados**
- `PUBLICADO`
- `SUSPENDIDO`
- `DESCONTINUADO`

**Precondiciones**
- Vendedor autenticado.
- Producto existente.
- Producto pertenece al vendedor.
- Estado solicitado válido.

**Flujo**
1. Validar vendedor.
2. Buscar producto.
3. Comprobar pertenencia.
4. Validar estado.
5. Actualizar estado.
6. Auditar.

## 5. Variantes
Cada variante representa una presentación concreta del producto y contiene:

```text
id
sku
nombreVariante
precio
```

El inventario se controla por variante/SKU.

## 6. Productos físicos y digitales

**Físicos:** pueden requerir inventario y envío.

**Digitales:** se entregan mediante descarga digital y no siguen el mismo flujo físico de inventario y transporte.

## 7. Reglas de negocio
- Cada producto pertenece a un vendedor.
- Solo un vendedor autorizado administra sus productos.
- Toda variante debe tener SKU.
- El estado del producto debe ser válido.
- Productos físicos y digitales tienen flujos de entrega diferentes.
- Las operaciones relevantes se auditan.

## 8. Errores

| Situación | Resultado |
|---|---|
| Vendedor inexistente | Rechazar |
| Sin permisos | Rechazar |
| Producto inexistente | Rechazar |
| Producto de otro vendedor | Rechazar |
| SKU ausente/inválido | Rechazar |
| Estado inválido | Rechazar |

## 9. Límites
No reserva inventario, crea pedidos, confirma pagos, ejecuta despachos ni gestiona devoluciones/reembolsos.
