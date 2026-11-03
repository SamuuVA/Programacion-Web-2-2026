# NexusMarket — Dependencias backend ↔ frontend

**Corte:** 2026-11-03
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

No se consumen `POST /api/v1/buyers`, `/health` ni `/ready` desde la interfaz pública.

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

## 11. Manejo de errores en el frontend

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

---

## 12. Imágenes

- La API devuelve rutas relativas como `/products/audifonos-aurora.svg`.
- Next.js sirve esos archivos desde `frontend/public/products/`.
- Los nombres y `alt` están alineados con `backend/scripts/seed-demo.ts`.
- Si un producto no tiene imagen, la tarjeta muestra un placeholder con “NM”.

---

## 13. Orden de arranque

1. PostgreSQL (`docker compose up -d`).
2. Migraciones (`npm run db:migrate`).
3. Seed opcional de demostración (`npm run db:seed:demo`).
4. Backend (`npm run dev` en `backend/`, puerto 3000).
5. Frontend (`npm run dev -- -p 3001` en `frontend/`).

Si el backend no está disponible, el frontend muestra un estado de error; no sustituye datos.

---

## 14. Protocolo de cambio de contrato

1. Modificar dominio, caso de uso, adaptador y ruta en el backend.
2. Actualizar `backend/openapi.yaml`.
3. Actualizar `backend/tests/contract/openapi.test.ts` y las pruebas HTTP/PostgreSQL.
4. Actualizar los tipos y funciones del feature correspondiente en `frontend/src/features/`.
5. Ejecutar suites backend, `npm run validate:openapi` y build del frontend.
6. Registrar la decisión en `DECISIONS-LOG.md` y el estado en `API-CONTRACT-STATUS.md`.

No se permite que el frontend consuma una ruta que no esté en OpenAPI y cubierta por pruebas.
