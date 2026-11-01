# NexusMarket Frontend

Primera entrega pública en **Next.js 16 (App Router) + React 19 + TypeScript**.

## Alcance

Incluido:

- home con productos destacados y categorías reales;
- catálogo con búsqueda, filtro por categoría, orden y paginación;
- detalle de producto con galería, precio, SKU, vendedor y disponibilidad;
- estados de carga, vacío, error y no encontrado;
- diseño responsive con CSS propio y sistema de tokens;
- consumo exclusivo de la API real del backend.

No incluido:

- autenticación, registro o sesiones;
- carrito y checkout;
- pagos;
- panel de vendedor o administración;
- subida de imágenes.

El detalle muestra un aviso honesto: el carrito y el pago simulado llegan en una
iteración posterior. No hay botones que simulen acciones inexistentes.

## Requisitos

- Node.js 24.x.
- Backend NexusMarket en ejecución (`http://127.0.0.1:3000`).
- PostgreSQL con migraciones y, opcionalmente, el seed demo.

## Instalación

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local
```

`API_URL` se lee solo en el servidor. No usar `NEXT_PUBLIC_*` para la API: el
navegador nunca la llama directamente en esta entrega.

```dotenv
API_URL=http://127.0.0.1:3000
```

## Ejecutar

Desarrollo:

```powershell
npm run dev -- -p 3001
```

Producción:

```powershell
npm run build
npm run start -- -p 3001
```

Abrir `http://127.0.0.1:3001`.

## Verificación

```powershell
npm run typecheck
npm run build
```

Resultado registrado: ambos comandos pasan. El smoke end-to-end se ejecutó contra
el backend y PostgreSQL reales:

| Comprobación | Resultado |
|---|---|
| Home | `200`, 8 tarjetas |
| Catálogo página 1 | `200`, 6 tarjetas, enlace a página 2 |
| Catálogo página 2 | `200`, 2 tarjetas |
| Búsqueda `lampara` | `200`, 1 resultado |
| Categoría `DIGITAL` | `200`, 2 resultados |
| Orden `precio_asc` | Primer resultado: Guía de finanzas |
| Detalle | `200`, SKU `AUR-AUD-001` |
| Producto inexistente | `404` con UI propia |
| ID malformado | Tratado como no encontrado |
| Imágenes SVG | 8 de 8 responden `200` |

## Estructura

```text
frontend/
├── src/
│   ├── app/
│   │   ├── (home)/                  # Home y su loading
│   │   ├── products/(catalog)/      # Catálogo, filtros y loading
│   │   ├── products/[productId]/    # Detalle y not-found
│   │   ├── error.tsx                # Error global
│   │   ├── layout.tsx               # Layout, header y footer
│   │   └── globals.css              # Tokens y estilos
│   ├── components/                  # Header, footer, iconos
│   ├── features/catalog/            # Tipos, API, formato y componentes
│   └── lib/api/client.ts            # Cliente HTTP solo servidor
└── public/products/                 # 8 SVG de demostración
```

## Decisiones de comportamiento

- `isProductId()` valida el UUID antes de llamar a la API; un ID malformado se
  trata como no encontrado, no como error `400`.
- El detalle no tiene `loading.tsx` para que `notFound()` produzca un `404` real.
- Home y catálogo usan route groups para acotar sus esqueletos.
- Si la API no responde, la UI muestra un estado de error; no inventa datos.
- La paginación usa `pageSize=6` para que los 8 productos demo ocupen dos páginas.

## Contrato y dependencias

El contrato consumido está en [`../backend/openapi.yaml`](../backend/openapi.yaml).
La correspondencia entre endpoints y pantallas está en
[`../docs/implementation/BACKEND-FRONTEND-DEPENDENCIES.md`](../docs/implementation/BACKEND-FRONTEND-DEPENDENCIES.md).
El estado verificable está en
[`../docs/implementation/IMPLEMENTATION-STATUS.md`](../docs/implementation/IMPLEMENTATION-STATUS.md).
