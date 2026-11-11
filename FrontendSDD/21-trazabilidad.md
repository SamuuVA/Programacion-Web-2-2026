# 21 — Trazabilidad inicial

| ID | Requisito | Artefacto | Prueba |
|---|---|---|---|
| FE-01 | Home | `/` | E2E home |
| FE-02 | Catálogo | `/products` | listado/empty/error |
| FE-03 | Detalle | `/products/[productId]` | detalle/not found |
| FE-04 | Sin variantes V1 | Seller/product detail | revisión UI |
| FE-05 | Carrito | `/cart` | flujo carrito |
| FE-06 | Pago unknown | checkout | prueba unknown |
| FE-07 | SKU e imágenes | formulario Seller | validación |
| FE-08 | Alta atómica | formulario Admin | error sin éxito parcial |
| FE-09 | Rutas protegidas | layouts/guards | pruebas 401/403 |
| FE-10 | Responsive/accesibilidad | componentes | auditoría |
| FE-11 | Registro público de comprador | `/register` | `identity-onboarding.spec.ts` (registro) |
| FE-12 | Solicitud comprador → vendedor | `/seller-application` | `identity-onboarding.spec.ts` (solicitud y aprobación) |
| FE-13 | Revisión administrativa de solicitudes | `/admin/seller-applications` y detalle | `identity-onboarding.spec.ts` (aprobación/rechazo) |
| FE-14 | Estado de acceso y revocación de sesión | `/admin/users/[userId]` | `identity-onboarding.spec.ts` (desactivación/reactivación) |
| FE-15 | Lint del frontend | `frontend/eslint.config.mjs` | `npm run lint` |
| FE-16 | Tema claro/oscuro con persistencia | `src/lib/theme.ts`, `src/components/theme-toggle.tsx`, `src/app/layout.tsx`, `src/app/globals.css` | `theme.spec.ts` (aplicación, rutas, recarga) |
| FE-17 | Preferencia del sistema en primera visita | `src/lib/theme.ts` (`THEME_INIT_SCRIPT`) | `theme.spec.ts` (colorScheme dark) |
| FE-18 | Catálogo, búsqueda, detalle y carrito en ambos temas | `src/features/catalog/*`, `src/features/cart/*` | `theme.spec.ts` (ambos temas) |
| FE-19 | Determinismo de stock en E2E | `e2e/support/demo-stock.ts` | `logistics.spec.ts`, `supervisor.spec.ts`, `theme.spec.ts` |
