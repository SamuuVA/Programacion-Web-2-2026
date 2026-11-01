# NexusMarket — Matriz de rutas, componentes y aceptación frontend

## 1. Matriz de rutas sugerida

Las rutas son una propuesta de navegación frontend, no un contrato de API. Ajustar según convenciones del proyecto.

| Área | Ruta sugerida | Acceso esperado |
|---|---|---|
| Inicio público | `/` | Público |
| Búsqueda | `/search` | Público |
| Categoría | `/categories/[slug]` | Público |
| Producto | `/products/[productId]` | Público para productos visibles |
| Carrito | `/cart` | Sesión o persistencia de carrito definida |
| Checkout | `/checkout` | Comprador autenticado o flujo definido |
| Cuenta comprador | `/buyer` | Buyer |
| Pedidos comprador | `/buyer/orders` | Buyer; solo propios |
| Resumen vendedor | `/seller` | Seller |
| Productos vendedor | `/seller/products` | Seller; solo propios |
| Inventario vendedor | `/seller/inventory` | Seller; alcance propio |
| Pedidos vendedor | `/seller/orders` | Seller; solo pedidos autorizados |
| Cola logística | `/logistics` | Logistics Operator |
| Detalle de tarea | `/logistics/tasks/[taskId]` | Operador y tarea autorizados |
| Administración | `/admin` | Administrator según permiso |
| Supervisión | `/supervisor` | Supervisor según permiso |
| Acceso denegado | `/access-denied` | Público/autenticado |

## 2. Matriz de componentes

| Componente | Responsabilidad | Prohibición |
|---|---|---|
| `ProductCard` | Mostrar datos de catálogo y navegar | No calcular descuento falso ni decidir disponibilidad |
| `ProductGallery` | Navegar imágenes de un producto/producto | No buscar imágenes externas arbitrarias |
| `ProductImage` | Imagen optimizada con fallback | No decidir permisos del recurso |
| `ProfileAvatar` | Avatar personal con fallback | No usar logo de tienda como avatar sin contrato |
| `StoreIdentity` | Nombre/logo de vendedor | No exponer datos privados |
| `PriceDisplay` | Formatear precio/moneda desde datos | No calcular impuestos o costos no definidos |
| `AvailabilityLabel` | Representar disponibilidad del backend | No reservar stock |
| `OrderStatusTimeline` | Mostrar eventos confirmados | No inferir estados intermedios |
| `RoleNavigation` | Navegación según capacidades | No sustituir autorización backend |
| `UploadField` | Previsualizar y coordinar carga | No considerar persistida una previsualización |
| `ConfirmDialog` | Confirmación de acciones sensibles | No ejecutar reglas de negocio |
| `DataTable` | Filtros, paginación, selección accesible | No descargar datasets ilimitados |

## 3. Contratos frontend sugeridos

Los puertos se definen en el módulo consumidor y tienen implementaciones concretas en infraestructura. Ejemplos conceptuales:
- `CatalogQueryPort`
- `ProductDetailQueryPort`
- `CartQueryPort` / `CartCommandPort`
- `CheckoutPort`
- `BuyerOrderQueryPort`
- `SellerProductPort`
- `SellerInventoryPort`
- `SellerOrderPort`
- `LogisticsTaskPort`
- `AdminManagementPort`
- `SupervisorReportPort`
- `MediaUploadPort`

No crear estos puertos si el caso de uso real no existe; no convertirlos en un cliente universal.

## 4. Manejo de errores común

| Error | UX esperada |
|---|---|
| No autenticado | Redirigir al acceso cuando corresponda, preservando retorno seguro |
| Prohibido | Pantalla/mensaje de acceso denegado; no revelar datos |
| No encontrado | `not-found` para producto/recurso inexistente |
| Validación | Mensajes junto a los campos y resumen de errores |
| Conflicto de estado | Refrescar recurso y explicar que cambió |
| Límite de tasa | Mensaje de espera si el contrato indica política; no hacer loops |
| Red/timeout | Reintento explícito y estado conservado cuando sea seguro |
| Error inesperado | Mensaje neutral y correlación técnica si está disponible |

## 5. Pruebas de aceptación por rol

### Buyer
- Buscar y filtrar productos; abrir detalle.
- Seleccionar producto y ver datos correctos.
- Agregar al carrito y gestionar cambios de disponibilidad.
- Confirmar que no se muestra compra exitosa antes del backend.
- No acceder a pedidos de otro comprador.

### Seller
- Crear/editar producto propio.
- Cargar imagen y recuperarse de fallo.
- Consultar inventario por bodega.
- Ver solo pedidos/productos autorizados.
- No ejecutar transición no permitida por backend.

### Logistics Operator
- Consultar tareas asignadas.
- Verificar artículos y registrar operación soportada.
- Resolver conflicto de estado actualizando datos.
- No acceder a tareas de otro ámbito.

### Administrator
- Registrar vendedor y primera bodega con manejo de fallo parcial.
- Administrar solo acciones autorizadas.
- Consultar información sensible con minimización.
- Ver resultado real y errores de operaciones de alto impacto.

### Supervisor
- Consultar reportes autorizados y ver frescura/periodo.
- No encontrar controles de modificación no aprobados.
- No obtener datos sensibles a través de exportaciones no autorizadas.

## 6. Orden recomendado de implementación

1. Contrato de sesión/autorización y shell visual.
2. Sistema de diseño, estados globales y componente de imagen.
3. Slice vertical Buyer: catálogo → detalle → carrito → checkout de pruebas.
4. Seller: catálogo → medios → inventario → pedidos.
5. Logistics Operator: cola → preparación → despacho.
6. Administrator: incorporación de vendedor/bodega y gestión.
7. Supervisor: panel de seguimiento y reportes.
8. Analítica, rendimiento, accesibilidad y endurecimiento de seguridad.

Cada fase requiere contratos reales, pruebas y criterios de aceptación; no pasar a la siguiente por mera existencia de pantallas.
