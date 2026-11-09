# NexusMarket — Dependencias backend ↔ frontend

**Corte:** 2026-11-06
**Regla:** el frontend consume exclusivamente endpoints implementados y probados en el backend. No hay datos de catálogo, precios, stock ni permisos embebidos en la interfaz.

---

## 1. Dirección de dependencia

```text
Navegador
   │ HTML / CSS / JS + Server Actions
   ▼
Next.js (servidor, puerto 3001)
   │ fetch HTTP (solo servidor) + Authorization: Bearer
   ▼
Fastify API (127.0.0.1:3000)
   │ SQL
   ▼
PostgreSQL 17 (puerto 5432)
```

- El navegador **no** llama directamente a la API.
- La URL de la API no se expone con `NEXT_PUBLIC_*`.
- El frontend no conoce credenciales de base de datos.
- El backend es la autoridad de permisos, stock, precios y transiciones de estado.

---

## 2. Variables de entorno

### Backend (`backend/.env`)

| Variable | Obligatoria | Uso |
|---|---|---|
| `DATABASE_URL` | Sí | Conexión PostgreSQL; sin ella el servidor no arranca |
| `HOST` | No | Valor inicial `127.0.0.1` |
| `PORT` | No | Valor inicial `3000` |
| `NODE_ENV` | No | `development`, `test`, `production` |
| `LOG_LEVEL` | No | Nivel de logs de Fastify |
| `CORS_ORIGINS` | No | Orígenes permitidos, separados por coma |

`PERSISTENCE` ya no existe.

### Frontend (`frontend/.env.local` o entorno)

| Variable | Obligatoria | Uso |
|---|---|---|
| `API_URL` | No | URL base del backend; por defecto `http://127.0.0.1:3000` |

`API_URL` se lee solo en el servidor de Next.js.

---

## 3. Flujo de autenticación frontend ↔ backend

1. El formulario de login envía una **Server Action** con `correoElectronico` y `credencial`.
2. La Server Action llama a `POST /api/v1/auth/login` desde el servidor de Next.js.
3. El backend devuelve `{ data: { token, expiraEn, usuario } }`.
4. Next.js guarda el token en su propia cookie `nexus_session` `HttpOnly`, `SameSite=Lax`.
5. Las páginas y Server Actions leen la cookie y envían `Authorization: Bearer <token>` al backend.
6. El backend valida la sesión y el rol; el frontend solo refleja el resultado.
7. Logout llama a `POST /api/v1/auth/logout` y borra la cookie del frontend.

Consecuencias:

- El token nunca llega al JavaScript del navegador.
- Una cookie ausente, inválida o expirada produce redirección a `/login` desde el servidor.
- El frontend no decide roles; una ruta admin con rol `COMPRADOR` redirige, y el backend además responde `403`.

---

## 4. Endpoints consumidos

| Endpoint | Uso en frontend | Pantalla |
|---|---|---|
| `POST /api/v1/auth/login` | Iniciar sesión | Login |
| `POST /api/v1/auth/logout` | Cerrar sesión | Cabecera |
| `GET /api/v1/auth/session` | Conocer usuario y rol | Cabecera y guardas |
| `GET /api/v1/products` | Listado, búsqueda, filtro, orden y paginación | Home y catálogo |
| `GET /api/v1/products/:productId` | Detalle de producto | Detalle |
| `GET /api/v1/categories` | Categorías del catálogo | Home y filtros |
| `GET /api/v1/cart` | Ver carrito | Carrito y checkout |
| `POST /api/v1/cart/items` | Agregar producto | Detalle de producto |
| `PATCH /api/v1/cart/items/:productoId` | Cambiar cantidad | Carrito |
| `DELETE /api/v1/cart/items/:productoId` | Quitar producto | Carrito |
| `GET /api/v1/buyers/me/addresses` | Listar direcciones | Direcciones y checkout |
| `POST /api/v1/buyers/me/addresses` | Crear dirección | Direcciones |
| `PATCH /api/v1/buyers/me/addresses/:direccionId` | Editar dirección | Direcciones |
| `DELETE /api/v1/buyers/me/addresses/:direccionId` | Eliminar dirección | Direcciones |
| `POST /api/v1/buyers/me/addresses/:direccionId/principal` | Marcar principal | Direcciones |
| `POST /api/v1/checkout` | Confirmar compra | Checkout |
| `GET /api/v1/orders` | Historial de pedidos | Pedidos |
| `GET /api/v1/orders/:orderId` | Detalle de pedido | Detalle de pedido |
| `POST /api/v1/admin/sellers` | Registrar vendedor + bodega | Admin vendedores |
| `GET /api/v1/seller/profile` | Ver perfil propio | Mi tienda / Perfil |
| `PATCH /api/v1/seller/profile` | Editar `nombreComercial` | Mi tienda / Perfil |
| `GET/POST /api/v1/seller/products` | Listar y crear productos propios | Mis productos |
| `GET/PATCH /api/v1/seller/products/:productId` | Detalle y edición | Detalle de producto |
| `POST/DELETE /api/v1/seller/products/:productId/images[/:imageId]` | Alta y baja de imágenes por URL | Detalle de producto |
| `POST /api/v1/seller/products/:productId/publish` | Publicar | Detalle de producto |
| `POST /api/v1/seller/products/:productId/suspend` | Suspender | Detalle de producto |
| `POST /api/v1/seller/products/:productId/discontinue` | Descontinuar | Detalle de producto |
| `GET/POST /api/v1/seller/warehouses` | Listar y crear bodegas propias | Mis bodegas |
| `PATCH /api/v1/seller/warehouses/:warehouseId` | Editar bodega propia | Mis bodegas |
| `GET /api/v1/seller/inventory` | Consultar posiciones | Inventario |
| `POST /api/v1/seller/inventory/ingresos` | Registrar ingreso idempotente | Inventario |
| `GET /api/v1/seller/orders` | Pedidos con productos propios | Pedidos |
| `GET /api/v1/seller/orders/:orderId` | Detalle de pedido propio | Pedidos |
| `GET /api/v1/logistics/profile` | Perfil y bodegas asignadas | Resumen logístico |
| `GET /api/v1/logistics/warehouses` | Bodegas autorizadas | Bodegas |
| `GET /api/v1/logistics/inventory` | Inventario de bodegas autorizadas | Inventario |
| `GET /api/v1/logistics/summary` | Contadores operativos | Resumen logístico |
| `GET /api/v1/logistics/orders` | Pedidos dentro del ámbito | Pedidos logísticos |
| `GET /api/v1/logistics/orders/:orderId` | Detalle operable e historial | Detalle logístico |
| `POST /api/v1/logistics/orders/:orderId/prepare` | Preparar envío | Detalle logístico |
| `POST /api/v1/logistics/shipments/:shipmentId/dispatch` | Despachar envío | Detalle logístico |
| `POST /api/v1/logistics/shipments/:shipmentId/delivery` | Registrar entrega o fallo | Detalle logístico |
| `POST /api/v1/admin/logistics-operators` | Alta administrativa de operador | Admin logística |
| `GET /api/v1/supervisor/dashboard` | Conteos directos del marketplace | Resumen de supervisión |
| `GET /api/v1/supervisor/orders` | Pedidos globales con filtro y paginación | Pedidos supervisados |
| `GET /api/v1/supervisor/orders/:orderId` | Detalle operativo e historial | Detalle supervisado |
| `GET /api/v1/supervisor/products` | Catálogo global con filtros | Productos supervisados |
| `GET /api/v1/supervisor/products/:productId` | Detalle e inventario por bodega | Detalle de producto supervisado |
| `GET /api/v1/supervisor/warehouses` | Almacenes globales | Almacenes supervisados |
| `GET /api/v1/supervisor/inventory` | Inventario global | Inventario supervisado |
| `GET /api/v1/supervisor/shipments` | Envíos globales | Envíos supervisados |
| `GET /api/v1/supervisor/sellers` | Vendedores y conteos operativos | Vendedores supervisados |
| `GET /api/v1/admin/dashboard` | Resumen administrativo | Panel de administración |
| `GET /api/v1/admin/users` | Usuarios con rol y estado | Usuarios |
| `GET /api/v1/admin/users/:userId` | Detalle de usuario | Detalle de usuario |
| `GET /api/v1/admin/sellers` | Vendedores con conteos | Vendedores |
| `GET /api/v1/admin/sellers/:sellerId` | Detalle de vendedor | Detalle de vendedor |
| `GET /api/v1/admin/buyers` | Compradores | Compradores |
| `GET /api/v1/admin/buyers/:buyerId` | Detalle de comprador | Detalle de comprador |
| `GET /api/v1/admin/warehouses` | Bodegas globales | Bodegas |
| `GET /api/v1/admin/warehouses/:warehouseId` | Detalle de bodega | Detalle de bodega |
| `GET /api/v1/admin/products` | Catálogo global | Catálogo |
| `GET /api/v1/admin/products/:productId` | Detalle de producto e inventario | Detalle de producto |
| `GET /api/v1/admin/inventory` | Existencias globales | Inventario |
| `GET /api/v1/admin/inventory/movements` | Movimientos de inventario | Movimientos |
| `GET /api/v1/admin/orders` | Pedidos globales | Pedidos |
| `GET /api/v1/admin/orders/:orderId` | Detalle de pedido | Detalle de pedido |
| `GET /api/v1/admin/payments` | Pagos por estado | Pagos |
| `GET /api/v1/admin/reports` | Agregados reales directos | Reportes |

No se consumen `POST /api/v1/buyers`, `/health` ni `/ready` desde la interfaz pública. La supervisión no consume ningún método de escritura: el frontend solo llama a las nueve rutas `GET`. El espacio administrativo solo consume las 17 rutas `GET` y las dos altas `POST /admin/sellers` y `POST /admin/logistics-operators`.

---

## 5. Contrato de listado de catálogo

**Solicitud:**

```http
GET /api/v1/products?search=lampara&categoria=HOGAR&orden=precio_asc&page=1&pageSize=6
```

| Parámetro | Valores | Default |
|---|---|---|
| `search` | Texto de hasta 100 caracteres | Sin filtro |
| `categoria` | `ELECTRONICA`, `ROPA`, `HOGAR`, `DIGITAL` | Sin filtro |
| `orden` | `recientes`, `precio_asc`, `precio_desc`, `nombre_asc` | `recientes` |
| `page` | Entero ≥ 1 | `1` |
| `pageSize` | Entero 1–48 | `12` en API; `6` en la interfaz |

**Respuesta:** `{ data: { items, pagination } }` con precio, imagen principal, disponibilidad y vendedor. El frontend no transforma precios ni inventario; solo formatea.

---

## 6. Contrato de carrito

**Agregar:**

```http
POST /api/v1/cart/items
{ "productoId": "40000000-0000-4000-8000-000000000001", "cantidad": 2 }
```

- `201`/`200` con el carrito actualizado.
- Rechaza producto inexistente, no público, vendedor inactivo o cantidad inválida.
- No hay variantes en V1.

**Actualizar / eliminar:** `PATCH`/`DELETE /api/v1/cart/items/:productoId`.

El backend devuelve el carrito autoritativo; el frontend nunca envía precios.

---

## 7. Contrato de checkout

**Solicitud:**

```http
POST /api/v1/checkout
Idempotency-Key: <uuid>
{
  "direccionId": "73000000-0000-4000-8000-000000000002",
  "resultadoPagoSimulado": "CONFIRMADO",
  "confirmarPrecio": false
}
```

Resultados:

| Escenario | HTTP | Pedido | Pago |
|---|---:|---|---|
| Pago confirmado | `201` | `EN_PREPARACION` | `CAPTURADO` |
| Pago rechazado | `201` | `CANCELADO` | `RECHAZADO` |
| Pago desconocido | `202` | `PENDIENTE_DE_PAGO` | `PENDIENTE` |
| Cambio de precio | `422` | No se crea | — (`motivo: PRECIO_CAMBIADO`) |
| Carrito vacío / stock / dirección | `422` | No se crea | — |

- Reintentar con la misma `Idempotency-Key` devuelve el mismo resultado sin duplicar pedidos ni reservas.
- El frontend conserva la clave en reintentos por pago desconocido y por confirmación de precio.
- Un pago desconocido **no** se muestra como éxito ni como rechazo; se muestra como pendiente.

---

## 8. Contrato de pedidos

- `GET /api/v1/orders` devuelve solo pedidos del comprador autenticado.
- `GET /api/v1/orders/:orderId` valida ownership; un pedido ajeno responde `404`.
- El detalle incluye items, total, estados y snapshot de la dirección.
- El frontend valida el formato UUID antes de llamar; un ID malformado se trata como no encontrado.

---

## 9. Contrato de direcciones

- Todas las rutas viven bajo `/api/v1/buyers/me/addresses` y operan sobre el comprador autenticado.
- Campos: `destinatario`, `telefono`, `linea1`, `linea2?`, `ciudad`, `region`, `codigoPostal?`, `pais`.
- Una sola dirección principal por comprador.
- Eliminar la principal promueve la más antigua restante.
- El pedido guarda una copia inmutable; editar la dirección después no altera pedidos pasados.

---

## 10. Contrato de alta de vendedor

```http
POST /api/v1/admin/sellers
{
  "nombreCompleto": "...",
  "correoElectronico": "...",
  "documentoTipo": "CC",
  "documentoPais": "CO",
  "documentoNumero": "...",
  "credencial": "...",
  "nombreComercial": "...",
  "bodegaNombre": "...",
  "bodegaUbicacion": "..."
}
```

- Solo `ADMINISTRADOR` activo.
- Crea usuario vendedor, perfil y primera bodega en una transacción.
- Conflicto → `409`; no autorizado → `401`/`403`.
- El cuerpo no puede declarar rol ni identidad.

---

## 11. Contrato del espacio del vendedor

- Todas las rutas viven bajo `/api/v1/seller/*` y operan sobre el `sellerId` de la sesión.
- El frontend nunca envía `sellerId`, rol ni propietario; el backend los deriva de la sesión.
- Acceso a un recurso de otro vendedor → `404` (no se filtra su existencia).
- Perfil: `GET/PATCH /seller/profile`; solo `nombreComercial` es editable.
- Productos: creación en `BORRADOR`; publicación exige SKU no vacío y al menos una imagen; transiciones `PUBLICADO → SUSPENDIDO → PUBLICADO` y `→ DESCONTINUADO` (terminal).
- Imágenes: referencias URL persistentes; el frontend envía `url` y `alt` opcional. No hay carga binaria.
- Bodegas: solo las propias; listar, crear y editar.
- Inventario: consulta y `POST /seller/inventory/ingresos` con `productoId`, `bodegaId`, `cantidad`, `idempotencyKey` y `motivo` opcional. La clave se genera en el cliente una vez por intención; un reintento conserva la misma clave.
- Pedidos: `GET /seller/orders` y `GET /seller/orders/:orderId`; solo productos propios y sin mutaciones de pago o logística.
- Errores esperados: `400`, `401`, `403`, `404`, `409`, `422`, `500`, `503`.

---

## 12. Contrato del operador logístico

- Todas las rutas operativas viven bajo `/api/v1/logistics/*`; el alta de operadores es `POST /api/v1/admin/logistics-operators`.
- El `operadorId` se deriva de la sesión; el frontend nunca lo envía. Se exige rol `OPERADOR_LOGISTICO` y perfil `ACTIVO`.
- Ámbito por bodegas asignadas: pedidos, reservas, envíos e inventario fuera del ámbito responden `404`.
- Preparación: `POST /logistics/orders/:orderId/prepare` con `bodegaId`, `idempotencyKey` y `transportista` opcional. Exige pedido pagado/en preparación y reservas activas.
- Despacho: `POST /logistics/shipments/:shipmentId/dispatch` con `idempotencyKey`, `transportista` y `trackingNumber` opcionales. Consume reservas y registra la salida de inventario.
- Entrega: `POST /logistics/shipments/:shipmentId/delivery` con `resultado` (`ENTREGADO`/`FALLIDO`), `evidencia` e `idempotencyKey`. La evidencia es obligatoria.
- Un reintento con la misma clave devuelve `200`; una clave reutilizada con otros datos devuelve `422 IDEMPOTENCIA_CONFLICTO`.
- Errores esperados: `400`, `401`, `403`, `404`, `409`, `422`, `500`, `503`.
- Límites: no hay asignación automática, transportistas externos, tracking integrado, evidencia del proveedor ni cierre `ENTREGADO → CERRADO`.

---

## 13. Contrato del supervisor

- Las nueve rutas viven bajo `/api/v1/supervisor/*` y solo aceptan `GET`. Cualquier otro método responde `405 METODO_NO_PERMITIDO` con `Allow: GET, HEAD`.
- Se exige rol `SUPERVISOR` y usuario `ACTIVO`. `ADMINISTRADOR` no hereda el acceso.
- El frontend nunca envía identidad ni rol; el backend los deriva de la sesión.
- Dashboard: conteos directos de pedidos, pagos, productos, inventario, almacenes, envíos, vendedores, operadores y compradores por estado. El inventario disponible usa `on_hand - reserved - unavailable` (`INV-03`). No hay porcentajes, metas, SLA, rankings, proyecciones ni comparaciones temporales.
- Pedidos: filtro por estado y paginación; el detalle incluye ítems, pago, reservas, envíos e historial de estados, sin acciones.
- Productos: filtros por estado, categoría y vendedor; el detalle incluye imágenes e inventario por bodega.
- Almacenes, inventario, envíos y vendedores: consulta global con filtros y paginación.
- Privacidad: no se publican nombre/teléfono/dirección del comprador, correo/documento del vendedor, dirección de entrega, identificadores de actor ni referencia del proveedor de pago.
- Errores esperados: `400` (UUID o paginación inválida), `401`, `403`, `404`, `405`, `500`, `503`.
- Reportes: `BLOQUEADO` (`L-19`). El frontend muestra “No disponibles” y no inventa métricas ni endpoints.

---

## 14. Contrato del administrador

- Las 17 rutas de consulta viven bajo `/api/v1/admin/*` y solo aceptan `GET`. Las escrituras permitidas son únicamente `POST /admin/sellers` y `POST /admin/logistics-operators`; cualquier otro método bajo el prefijo responde `405 METODO_NO_PERMITIDO` con `Allow`.
- Se exige rol `ADMINISTRADOR` y usuario `ACTIVO`. `SUPERVISOR` y los demás roles no heredan el acceso.
- El frontend nunca envía identidad ni rol; el backend los deriva de la sesión.
- Dashboard y reportes: conteos directos por estado, montos capturados e inventario disponible (`on_hand - reserved - unavailable`). Sin porcentajes, metas, SLA, rankings, proyecciones ni exportaciones.
- Usuarios, vendedores, compradores, bodegas, catálogo, inventario, movimientos, pedidos y pagos: listas con filtros y paginación, más detalles.
- El detalle de pedido minimiza la dirección a `ciudad`, `region`, `pais` y `capturadoEn`; no se exponen hashes, documentos, tokens, referencia del proveedor de pago ni `actor_id`.
- El alta de vendedores vive en `/admin/sellers/new`; `/admin/sellers` es la lista. Las Server Actions revalidan `/admin/sellers`, `/admin/sellers/new` y `/admin`.
- Errores esperados: `400`, `401`, `403`, `404`, `405`, `500`, `503`.
- Límites: no hay mutaciones de producto, inventario, pedido, pago, rol, vendedor ni bodega; no hay devoluciones, reembolsos ni facturación.

---

## 15. Manejo de errores en el frontend

`frontend/src/lib/api/client.ts` centraliza:

- URL base validada (`http`/`https`).
- Timeout de 8 segundos.
- `cache: "no-store"`.
- Lectura de `x-correlation-id`.
- Conversión de errores HTTP a `ApiError` con `status`, `code`, `correlationId` y `details`.
- Error de red con código `RED_NO_DISPONIBLE`.

`ApiError` vive en `frontend/src/lib/api/errors.ts` (módulo neutral) para que componentes cliente no importen el cliente `server-only`.

| Situación | Comportamiento de UI |
|---|---|
| Sin sesión en ruta protegida | Redirección a `/login?redirect=...` |
| Sesión inválida/expirada | Redirección a login; el backend responde `401` |
| Rol insuficiente | Redirección desde el servidor; el backend responde `403` |
| `404` en detalle de producto/pedido | `notFound()` → página no encontrada |
| ID malformado | Validación local → `notFound()` |
| Error de red o `5xx` | `ErrorState` con mensaje y código de seguimiento |
| Lista o carrito vacío | `EmptyState` con acción útil |
| Cambio de precio en checkout | Aviso `PRECIO_CAMBIADO` con opción de confirmar |
| Pago desconocido | Estado pendiente y reintento con la misma clave |
| Vendedor en ruta de comprador/admin | Redirección desde el servidor; el backend responde `403` |
| Recurso de otro vendedor | `404` real; la UI muestra “No encontramos ese recurso” |
| Producto sin SKU o sin imagen al publicar | `422` con mensaje de la regla incumplida |
| Ingreso de inventario duplicado | `200` con `duplicado: true`; no se suma stock de nuevo |
| Transición de estado no permitida | `422`; la UI muestra el motivo y conserva el estado actual |
| Recurso fuera del ámbito logístico | `404` real; no se revela su existencia |
| Preparación sin reservas activas | `422` con `motivo: "SIN_RESERVAS"`; la UI no simula un envío |
| Entrega sin evidencia | `422`; el formulario exige tipo y referencia (o motivo del fallo) |
| Reintento logístico | `200` con el resultado previo; no duplica envíos ni salidas |
| Supervisor en ruta de otro rol | Redirección desde el servidor; el backend responde `403` |
| Escritura bajo `/api/v1/supervisor/*` | `405` con `Allow: GET, HEAD`; la UI no ofrece formularios |
| Escritura bajo `/api/v1/admin/*` fuera de las altas | `405` con `Allow`; la UI admin no ofrece formularios de mutación |
| Reportes del supervisor sin catálogo | Mensaje “No disponibles”; no se inventan métricas (`L-19`) |
| Reportes del administrador | Solo agregados reales; no hay exportaciones ni métricas inventadas |

---

## 16. Imágenes

- La API devuelve rutas relativas como `/products/audifonos-aurora.svg`.
- Next.js sirve esos archivos desde `frontend/public/products/`.
- Los nombres y `alt` están alineados con `backend/scripts/seed-demo.ts`.
- Si un producto no tiene imagen, la tarjeta muestra un placeholder con “NM”.
- El vendedor puede registrar imágenes por URL persistente en `product_images`; la baja también está soportada.
- La carga binaria de archivos está `BLOQUEADA`: el SDD rechaza `FileStorage` y no hay proveedor ni límites de tamaño/formato aprobados. El frontend no simula una subida inexistente.

---

## 17. Orden de arranque

1. PostgreSQL (`cd backend; docker compose up -d`).
2. Migraciones (`npm run db:migrate`).
3. Seed opcional de demostración (`npm run db:seed:demo`).
4. Backend (`npm run dev` en `backend/`, puerto 3000).
5. Frontend (`npm run dev -- -p 3001` en `frontend/`).

Si el backend no está disponible, el frontend muestra un estado de error; no sustituye datos.

---

## 18. Protocolo de cambio de contrato

1. Modificar dominio, caso de uso, adaptador y ruta en el backend.
2. Actualizar `backend/openapi.yaml`.
3. Actualizar `backend/tests/contract/openapi.test.ts` y las pruebas HTTP/PostgreSQL.
4. Actualizar los tipos y funciones del feature correspondiente en `frontend/src/features/`.
5. Ejecutar suites backend, `npm run validate:openapi` y build del frontend.
6. Registrar la decisión en `DECISIONS-LOG.md` y el estado en `API-CONTRACT-STATUS.md`.

No se permite que el frontend consuma una ruta que no esté en OpenAPI y cubierta por pruebas.
