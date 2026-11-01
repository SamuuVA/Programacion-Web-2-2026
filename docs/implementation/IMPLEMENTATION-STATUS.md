# NexusMarket — Estado de implementación

**Corte:** 2026-11-01
**Estado global:** primera entrega demostrable construida y verificada localmente.
**Fuente de verdad:** código del repositorio, PostgreSQL real y comandos ejecutados.

---

## 1. Resumen de gates

| Gate | Alcance | Estado | Evidencia principal |
|---|---|---|---|
| A | Persistencia PostgreSQL obligatoria | `PASS` | Almacén memoria eliminado; 51 pruebas; 11 pruebas PostgreSQL; reinicio verificado |
| B | Catálogo backend | `PASS` | Migración `003`; rutas de productos y categorías; smoke real |
| C | Contrato OpenAPI | `PASS` | `openapi.yaml` 0.2.0; prueba de contrato |
| D | Frontend Next.js | `PASS` | Typecheck/build; home, catálogo y detalle contra API real |
| E | Verificación y documentación | `PASS` local | Suites, smoke, conteos y estos documentos |

`PASS` significa “verificado con la evidencia listada”. No implica CI, revisión independiente ni cobertura de capacidades fuera de alcance.

---

## 2. Gate A — Persistencia real

### Implementado

- Eliminado `backend/src/modules/buyers/infrastructure/memory-buyer-registration-store.ts`.
- `backend/src/infrastructure/factory.ts` crea siempre `PostgresBuyerRegistrationStore`.
- `backend/src/config.ts` exige `DATABASE_URL` y ya no lee `PERSISTENCE`.
- `backend/.env.example` documenta solo PostgreSQL.
- `backend/tests/support/fake-buyer-registration-store.ts` contiene el doble exclusivo de pruebas.
- `backend/tests/unit/persistence-architecture.test.ts` falla si `src/` menciona `PERSISTENCE` o el almacén en memoria.

### Evidencia

| Verificación | Resultado |
|---|---|
| `npm run typecheck` | OK |
| `npm test` | 8 archivos, 51 pruebas |
| `npm run build` | OK |
| `npm run test:postgres` | 3 archivos, 11 pruebas |
| Reinicio real de comprador | `POST` `201`; reinicio del servidor; `SELECT count(*)` = 1 |
| Conteo de catálogo tras reinicios | 8 productos publicados en PostgreSQL |

---

## 3. Gate B — Catálogo backend

### Entregables

| Artefacto | Ruta |
|---|---|
| Migración de catálogo | `backend/migrations/003_catalog.sql` |
| Dominio | `backend/src/modules/catalog/domain/producto.ts` |
| Puertos | `backend/src/modules/catalog/application/ports.ts` |
| Caso de uso | `backend/src/modules/catalog/application/query-catalog.ts` |
| Adaptador PostgreSQL | `backend/src/modules/catalog/infrastructure/postgres-catalog-query-repository.ts` |
| Rutas HTTP | `backend/src/modules/catalog/interfaces/http/catalog-routes.ts` |
| Seed demo | `backend/scripts/seed-demo.ts` |
| Pruebas HTTP | `backend/tests/integration/catalog-http.test.ts` |
| Pruebas PostgreSQL | `backend/tests/postgres/catalog-query-postgres.test.ts` |

### Reglas implementadas

- Solo productos `PUBLICADO` de vendedores `ACTIVO`.
- Disponibilidad física = suma de `on_hand - reserved - unavailable` en bodegas `ACTIVA`, con mínimo 0.
- Productos `DIGITAL` devuelven `disponible: null`.
- Búsqueda insensible a mayúsculas y acentos sobre nombre y descripción.
- Orden: `recientes`, `precio_asc`, `precio_desc`, `nombre_asc`.
- Paginación: página 1 por defecto, 12 por defecto en la API, máximo 48.
- Detalle inexistente o no público: `404 RECURSO_NO_ENCONTRADO`.

### Datos demo comprobados

| Tabla | Filas |
|---|---:|
| Productos publicados | 8 |
| Vendedores | 2 |
| Imágenes | 8 |
| Inventario | 6 |

---

## 4. Gate C — Contrato

- `backend/openapi.yaml` versión `0.2.0`.
- Rutas declaradas: `/api/v1/buyers`, `/api/v1/products`, `/api/v1/products/{productId}`, `/api/v1/categories`, `/health`, `/ready`.
- Esquemas de producto, imagen, precio, vendedor, paginación y errores.
- Código `RECURSO_NO_ENCONTRADO` documentado con `404`.
- `backend/tests/contract/openapi.test.ts` valida rutas, métodos, respuestas y referencias.

---

## 5. Gate D — Frontend

### Entregables

| Pantalla / pieza | Ruta |
|---|---|
| Layout, header y footer | `frontend/src/app/layout.tsx`, `frontend/src/components/` |
| Home | `frontend/src/app/(home)/page.tsx` |
| Catálogo | `frontend/src/app/products/(catalog)/page.tsx` |
| Detalle | `frontend/src/app/products/[productId]/page.tsx` |
| No encontrado | `frontend/src/app/not-found.tsx`, `frontend/src/app/products/[productId]/not-found.tsx` |
| Error global | `frontend/src/app/error.tsx` |
| Cliente API | `frontend/src/lib/api/client.ts` |
| Contrato de tipos | `frontend/src/features/catalog/types.ts` |
| Funciones API | `frontend/src/features/catalog/api.ts` |
| Formato | `frontend/src/features/catalog/format.ts` |
| Componentes de catálogo | `frontend/src/features/catalog/components/` |
| Diseño | `frontend/src/app/globals.css` |
| Imágenes | `frontend/public/products/*.svg` |

### Verificación

| Comprobación | Resultado |
|---|---|
| `npm run typecheck` | OK |
| `npm run build` | OK |
| Home | `200`, 8 tarjetas |
| Catálogo página 1 | `200`, 6 tarjetas, enlace a página 2 |
| Catálogo página 2 | `200`, 2 tarjetas, página actual marcada |
| Búsqueda `lampara` | `200`, 1 resultado |
| Categoría `DIGITAL` | `200`, 2 resultados |
| Orden `precio_asc` | `200`, primer resultado: Guía de finanzas |
| Detalle | `200`, SKU `AUR-AUD-001` |
| Producto inexistente | `404` con UI de no encontrado |
| ID malformado (`/products/not-a-uuid`) | `404` con UI de no encontrado, sin llamada inválida a la API |
| Imágenes SVG | 8 de 8 responden `200` |

### Decisiones de honestidad

- No hay botón de “añadir al carrito” ni de “comprar”.
- El detalle muestra un aviso: el carrito y el pago simulado llegan en la siguiente iteración.
- No se muestran categorías, productos ni conteos inventados.

---

## 6. Gate E — Verificación y documentación

### Documentos creados

- `docs/implementation/REPOSITORY-BASELINE.md`
- `docs/implementation/IMPLEMENTATION-PLAN.md`
- `docs/implementation/IMPLEMENTATION-STATUS.md`
- `docs/implementation/BACKEND-FRONTEND-DEPENDENCIES.md`
- `docs/implementation/API-CONTRACT-STATUS.md`
- `docs/implementation/DECISIONS-LOG.md`
- `docs/implementation/EXECUTION-LOG.md`

### Documentos actualizados

- `backend/README.md`: alcance de catálogo, rutas, seed, conteos y comandos.
- `README.md`: estado actual, eliminación del modo memoria y arranque con PostgreSQL.
- `orchestrator-state.md`: corte vigente y sesión S-006.
- Notas históricas: se marca que el adaptador en memoria fue retirado.

---

## 7. Lo que no se declara terminado

| Capacidad | Estado real |
|---|---|
| Autenticación / sesiones | No implementado |
| Autorización administrativa | No implementado |
| Inscripción de vendedores | No implementado en la aplicación |
| Carrito | No implementado |
| Checkout | No implementado |
| Pagos (reales o simulados) | No implementado |
| Pedidos, envíos, devoluciones | No implementado |
| Subida de imágenes | No implementado |
| Variantes comerciales | Fuera de V1 por decisión |
| MongoDB | No usado en este corte |
| CI / lint / e2e de navegador | No configurado |

---

## 8. Próxima acción

Implementar autenticación y autorización administrativa; después, la inscripción atómica de vendedor + primera bodega. El catálogo y el frontend actuales no deben ampliarse con carrito o pagos hasta que existan esos contratos y sus pruebas.
