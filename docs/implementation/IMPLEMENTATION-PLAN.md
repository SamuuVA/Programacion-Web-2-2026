# NexusMarket — Plan de implementación V1

**Corte:** 2026-11-01
**Objetivo:** llevar NexusMarket de un backend parcial a una primera versión demostrable: catálogo público persistido en PostgreSQL y frontend Next.js conectado a la API real.

---

## 1. Principios de ejecución

1. **Backend antes que frontend:** ninguna pantalla consume un endpoint que no exista o no esté probado.
2. **Datos reales:** la demostración usa PostgreSQL y el seed explícito; no se inventan respuestas ni productos en el frontend.
3. **Entrega vertical:** cada gate debe dejar algo ejecutable y verificable.
4. **Sin botones falsos:** si una capacidad no existe, se muestra un aviso honesto; no se simula una compra.
5. **Contrato primero:** OpenAPI y pruebas de contrato se actualizan antes de conectar la interfaz.
6. **Evidencia ejecutada:** un gate no se marca aprobado sin comandos y resultados reales.

---

## 2. Gates

### Gate A — Persistencia real obligatoria

**Objetivo:** eliminar la posibilidad de ejecutar el backend con almacenamiento en memoria.

**Trabajo:**

- Eliminar `memory-buyer-registration-store.ts` del runtime.
- Eliminar `PERSISTENCE` de configuración, `.env.example`, pruebas y documentación operativa.
- Hacer `DATABASE_URL` obligatoria.
- Mantener el puerto `BuyerRegistrationStore` y el adaptador PostgreSQL.
- Mover el doble en memoria a `tests/support/` con uso exclusivo en pruebas.
- Añadir una prueba de arquitectura que impida reincorporar el modo memoria.

**Criterios de aceptación:**

- `backend/src/` no contiene referencias a `PERSISTENCE` ni al almacén en memoria.
- El backend falla al arrancar sin `DATABASE_URL`.
- Las pruebas unitarias, HTTP, contrato y PostgreSQL aprueban.
- Un registro creado por HTTP sobrevive a un reinicio del servidor.

**Estado:** `PASS` (ver `IMPLEMENTATION-STATUS.md`).

---

### Gate B — Catálogo backend

**Objetivo:** exponer un catálogo público real, con productos, vendedores, imágenes e inventario.

**Trabajo:**

- Migración `003_catalog.sql`.
- Modelo de producto V1 sin variantes: SKU, precio, categoría, tipo de entrega e imágenes propias.
- Tablas `sellers`, `warehouses`, `products`, `product_images`, `inventory`.
- Puerto `CatalogQueryRepository`.
- Caso de uso `QueryCatalog`.
- Adaptador PostgreSQL con búsqueda sin acentos, filtros, orden y paginación.
- Rutas:
  - `GET /api/v1/products`
  - `GET /api/v1/products/:productId`
  - `GET /api/v1/categories`
- Regla pública: solo productos `PUBLICADO` de vendedores `ACTIVO`.
- Disponibilidad calculada por bodega activa; `null` para productos digitales.

**Criterios de aceptación:**

- Listado, búsqueda, filtro por categoría, orden y paginación funcionan contra PostgreSQL.
- El detalle devuelve SKU, imágenes y datos del vendedor.
- Un producto inexistente o no público responde `404 RECURSO_NO_ENCONTRADO`.
- Las pruebas de integración y PostgreSQL aprueban.

**Estado:** `PASS`.

---

### Gate C — Contrato ejecutable

**Objetivo:** que OpenAPI describa exactamente lo implementado y que el contrato se valide automáticamente.

**Trabajo:**

- Actualizar `backend/openapi.yaml` a `0.2.0`.
- Documentar rutas, parámetros, esquemas de producto, paginación y errores.
- Añadir `RECURSO_NO_ENCONTRADO` al catálogo de errores.
- Actualizar `tests/contract/openapi.test.ts`.

**Criterios de aceptación:**

- El contrato incluye todas las rutas implementadas y ninguna ruta inexistente.
- Las pruebas de contrato aprueban.
- El frontend solo consume rutas declaradas.

**Estado:** `PASS`.

---

### Gate D — Frontend conectado

**Objetivo:** construir la primera experiencia pública sobre la API real.

**Trabajo:**

- Next.js App Router + React + TypeScript.
- Server Components por defecto.
- Cliente HTTP centralizado, solo de servidor, con timeout y manejo de errores.
- Home, catálogo, detalle de producto.
- Búsqueda, filtros por categoría, orden y paginación.
- Estados de carga, error, vacío y no encontrado.
- Diseño responsive y accesible con CSS propio.
- Ocho imágenes SVG locales alineadas con el seed.

**Criterios de aceptación:**

- `npm run typecheck` y `npm run build` aprueban.
- Home, catálogo y detalle responden `200` contra la API real.
- La búsqueda y los filtros reflejan datos de PostgreSQL.
- Un producto inexistente devuelve `404`.
- No hay botones de compra que aparenten funcionar.

**Estado:** `PASS`.

---

### Gate E — Verificación y documentación

**Objetivo:** demostrar el estado real y dejar el proyecto reanudable.

**Trabajo:**

- Ejecutar suites backend y PostgreSQL.
- Ejecutar typecheck y build del frontend.
- Ejecutar smoke HTTP de las tres pantallas.
- Verificar persistencia y conteos en PostgreSQL.
- Crear `docs/implementation/*`.
- Actualizar README, estado operativo y notas históricas que mencionaban el modo memoria.

**Criterios de aceptación:**

- Todos los comandos registrados tienen resultado real.
- La documentación distingue lo implementado de lo pendiente.
- No se declara compra, pago o autenticación como disponibles.

**Estado:** `PASS` con evidencia local; CI y revisión independiente quedan pendientes.

---

## 3. Orden de dependencias

```text
Gate A (persistencia)
   │
   ├── Gate B (catálogo backend)
   │      │
   │      └── Gate C (contrato)
   │             │
   │             └── Gate D (frontend)
   │                    │
   └────────────────────┴── Gate E (verificación y docs)
```

El frontend no se inició hasta que el catálogo y su contrato estuvieron disponibles.

---

## 4. Fuera de alcance de esta entrega

- Autenticación, sesiones y autorización.
- Inscripción de vendedores desde la aplicación.
- Carrito operativo y checkout.
- Pagos reales o simulados.
- Pedidos, facturación, envíos y devoluciones.
- Subida y almacenamiento de imágenes.
- Variantes comerciales.
- MongoDB y proyecciones de reportes.
- CI/CD y despliegue.

Estas capacidades no se muestran como funcionales en la interfaz.

---

## 5. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación aplicada |
|---|---|---|
| El modo memoria vuelve a introducirse | Pérdida de datos | Prueba de arquitectura y `DATABASE_URL` obligatoria |
| El frontend inventa datos | Demostración engañosa | Todo producto proviene de la API; seed explícito |
| El contrato se desalinea | Pantallas rotas | OpenAPI actualizado y pruebas de contrato |
| Búsqueda con acentos falla | Mala experiencia | `translate(lower(...))` en PostgreSQL y smoke con “lampara” |
| Producto inexistente responde `200` | SEO y semántica incorrectos | Grupos de rutas y `notFound()`; verificado `404` |
| Falta de espacio en disco | Builds fallidos | Limpieza de cachés seguras y nueva ejecución |
| Se promete compra inexistente | Expectativa falsa | Aviso explícito en el detalle; sin botón de carrito |

---

## 6. Próximos pasos sugeridos

1. Implementar autenticación y autorización administrativa.
2. Implementar inscripción atómica de vendedor + primera bodega.
3. Añadir carrito y checkout con pago simulado, incluyendo estado “desconocido”.
4. Añadir pruebas end-to-end de navegador y CI.
5. Incorporar subida de imágenes y almacenamiento de archivos.
