# 02 — Arquitectura frontend
## Estructura sugerida
```text
src/
  app/
    (public)/page.tsx
    (public)/products/page.tsx
    (public)/products/[productId]/page.tsx
    (auth)/login/page.tsx
    (buyer)/cart/page.tsx
    (buyer)/checkout/page.tsx
    (buyer)/account/orders/page.tsx
    (seller)/seller/page.tsx
    (seller)/seller/products/page.tsx
    (seller)/seller/products/new/page.tsx
    (admin)/admin/page.tsx
    (admin)/admin/sellers/page.tsx
    (operations)/logistics/page.tsx
    (operations)/supervisor/page.tsx
  components/ui/
  components/layout/
  features/catalog/
  features/cart/
  features/checkout/
  features/seller/
  features/administration/
  features/logistics/
  features/supervision/
  lib/api/
  lib/auth/
  lib/config/
  lib/validation/
```
Adaptar al repositorio real; no mover código sin análisis.

## Responsabilidades
`app`: rutas y layouts. `components`: UI genérica. `features`: comportamiento por capacidad. `lib/api`: cliente, DTOs, errores y adaptadores. `lib/auth`: utilidades de sesión y navegación, nunca autoridad de seguridad.

## Reglas
Separar UI de reglas de negocio. No dispersar fetch en componentes. No exponer secretos en NEXT_PUBLIC. Mantener caché conservadora para datos privados y compras. Evitar `any`, componentes monolíticos y estado global innecesario.
