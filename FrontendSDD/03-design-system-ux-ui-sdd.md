# 03 — Design System UX/UI
Dirección: marketplace premium latinoamericano, tema claro, densidad equilibrada, responsive balanceado.

## Paleta propuesta
| Token | Hex | Uso |
|---|---|---|
| forest | #24483D | marca |
| primary | #3F765B | acciones principales |
| sage-soft | #E5EFE8 | fondos suaves |
| canvas | #F4F7F3 | fondo |
| surface | #FFFFFF | superficies |
| text | #29352F | texto principal |
| muted | #68766D | texto secundario |
| success | #247447 | éxito |
| warning | #946313 | advertencia |
| danger | #B93838 | error |

Verificar contraste WCAG AA antes de fijar los tonos finales. No usar color como único indicador.

Tipografía sans-serif legible; escala 12, 14, 16, 18, 20, 24, 30, 36 px. Espaciado 4, 8, 12, 16, 24, 32, 48 px. Radios 8, 12 y 16 px.

Componentes: Button, Input, Select, Badge, Card, ProductCard, PriceDisplay, SearchField, Breadcrumbs, Tabs, Table, Dialog, Drawer, Toast, Alert, Skeleton, EmptyState, ErrorState, PageHeader.

Breakpoints orientativos: móvil <640 px, tablet 640–1023 px, escritorio >=1024 px. Probar teclado, foco, labels, contraste, texto alternativo y reduced motion.

## Tema claro/oscuro (implementado y verificado)

- Fuente única de verdad: `frontend/src/lib/theme.ts` define la clave de almacenamiento `nexusmarket-theme`, el tipo `Theme`, los colores de barra del navegador y el script de inicialización previo al primer pintado.
- La paleta vive en tokens CSS dentro de `frontend/src/app/globals.css`: `:root` define el tema claro y `html[data-theme="dark"]` redefine los mismos tokens. Los componentes consumen variables (`var(--surface)`, `var(--text)`, `var(--border)`, etc.) y no colores fijos, por lo que ambos temas cubren toda la aplicación sin selectores globales amplios.
- `frontend/src/app/layout.tsx` aplica `data-theme` en `<html>` mediante el script inline de `THEME_INIT_SCRIPT`, antes del primer paint, y declara `themeColor` para claro y oscuro.
- `frontend/src/components/theme-toggle.tsx` es el único control de cambio; usa `useSyncExternalStore` para leer el atributo real del documento y persiste la elección explícita en `localStorage`. La preferencia del sistema solo se usa cuando no hay elección guardada.
- Estados requeridos del sistema visual (hover, focus, disabled, loading, error, vacío) se mantienen porque dependen de tokens, no de valores por tema.
- Verificación automatizada: `frontend/e2e/theme.spec.ts` comprueba aplicación, persistencia entre rutas y recargas, preferencia del sistema y catálogo/búsqueda/detalle/carrito en ambos temas.
