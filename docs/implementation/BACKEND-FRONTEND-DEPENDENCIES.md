# NexusMarket — Dependencias backend ↔ frontend

**Corte:** 2026-11-01
**Regla:** el frontend consume exclusivamente endpoints implementados y probados en el backend. No hay datos de catálogo embebidos en la interfaz.

---

## 1. Dirección de dependencia

```text
Navegador
   │ HTML / CSS / JS
   ▼
Next.js (servidor, puerto 3001)
   │ fetch HTTP (solo servidor)
   ▼
Fastify API (127.0.0.1:3000)
   │ SQL
   ▼
PostgreSQL 17 (puerto 5432)
```

- El navegador **no** llama directamente a la API en esta entrega.
- La URL de la API no se expone con `NEXT_PUBLIC_*`.
- El frontend no conoce credenciales de base de datos.

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

## 3. Endpoints consumidos

| Endpoint | Uso en frontend | Pantalla |
|---|---|---|
| `GET /api/v1/products` | Listado, búsqueda, filtro, orden y paginación | Home y catálogo |
| `GET /api/v1/products/:productId` | Detalle de producto | Detalle |
| `GET /api/v1/categories` | Categorías del catálogo | Home y filtros |

No se consumen `POST /api/v1/buyers`, `/health` ni `/ready` desde la interfaz pública.

---

## 4. Contrato de listado

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

**Respuesta:**

```json
{
  "data": {
    "items": [
      {
        "id": "40000000-0000-4000-8000-000000000001",
        "nombre": "Audífonos Aurora",
        "descripcion": "Audífonos inalámbricos...",
        "categoria": "ELECTRONICA",
        "tipoEntrega": "FISICA",
        "precio": { "montoCentavos": 42990000, "moneda": "COP" },
        "imagenPrincipal": {
          "id": "50000000-0000-4000-8000-000000000001",
          "url": "/products/audifonos-aurora.svg",
          "alt": "Audífonos inalámbricos color verde bosque",
          "orden": 0
        },
        "disponible": 18,
        "vendedor": {
          "id": "20000000-0000-4000-8000-000000000001",
          "nombreComercial": "Estudio Aurora"
        },
        "creadoEn": "2026-11-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 6,
      "total": 8,
      "totalPages": 2
    }
  }
}
```

---

## 5. Contrato de detalle

**Solicitud:**

```http
GET /api/v1/products/40000000-0000-4000-8000-000000000001
```

**Respuesta:** `{ "data": { ...resumen, "sku": "AUR-AUD-001", "imagenes": [...], "actualizadoEn": "..." } }`.

Reglas:

- ID con formato UUID inválido → `400 VALIDACION_INVALIDA`.
- UUID válido inexistente o no público → `404 RECURSO_NO_ENCONTRADO`.
- El frontend valida el formato antes de llamar; un ID malformado se trata como no encontrado.

---

## 6. Contrato de categorías

**Respuesta:**

```json
{
  "data": [
    { "codigo": "ELECTRONICA", "nombre": "Electrónica" },
    { "codigo": "ROPA", "nombre": "Ropa" },
    { "codigo": "HOGAR", "nombre": "Hogar" },
    { "codigo": "DIGITAL", "nombre": "Digital" }
  ]
}
```

---

## 7. Manejo de errores en el frontend

`frontend/src/lib/api/client.ts` centraliza:

- URL base validada (`http`/`https`).
- Timeout de 8 segundos.
- `cache: "no-store"`.
- Lectura de `x-correlation-id`.
- Conversión de errores HTTP a `ApiError` con `status`, `code`, `correlationId` y `details`.
- Error de red con código `RED_NO_DISPONIBLE`.

| Situación | Comportamiento de UI |
|---|---|
| `404` en detalle | `notFound()` → página “Producto no encontrado” |
| `400` por ID malformado | Validación local → `notFound()` |
| Error de red o `5xx` | `ErrorState` con mensaje y código de seguimiento |
| Lista vacía | `EmptyState` con acción para limpiar filtros |
| Categoría o página inválida en URL | Se normaliza antes de llamar a la API |

---

## 8. Imágenes

- La API devuelve rutas relativas como `/products/audifonos-aurora.svg`.
- Next.js sirve esos archivos desde `frontend/public/products/`.
- Los nombres y `alt` están alineados con `backend/scripts/seed-demo.ts`.
- Si un producto no tiene imagen, la tarjeta muestra un placeholder con “NM”.

---

## 9. Orden de arranque

1. PostgreSQL (`docker compose up -d`).
2. Migraciones (`npm run db:migrate`).
3. Seed opcional de demostración (`npm run db:seed:demo`).
4. Backend (`npm run dev` en `backend/`, puerto 3000).
5. Frontend (`npm run dev -- -p 3001` en `frontend/`).

Si el backend no está disponible, el frontend muestra un estado de error; no sustituye datos.

---

## 10. Protocolo de cambio de contrato

1. Modificar dominio, caso de uso, adaptador y ruta en el backend.
2. Actualizar `backend/openapi.yaml`.
3. Actualizar `backend/tests/contract/openapi.test.ts` y las pruebas HTTP/PostgreSQL.
4. Actualizar `frontend/src/features/catalog/types.ts` y `api.ts`.
5. Ejecutar suites backend y build del frontend.
6. Registrar la decisión en `DECISIONS-LOG.md` y el estado en `API-CONTRACT-STATUS.md`.

No se permite que el frontend consuma una ruta que no esté en OpenAPI y cubierta por pruebas.
