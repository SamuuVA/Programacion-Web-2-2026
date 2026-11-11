# 19 — Pruebas y aceptación
Unitarias: validadores, mappers, formatters. Componentes: formularios, catálogo, feedback. Integración: adaptadores API. E2E: home → catálogo → detalle y journey Buyer.

Casos críticos: rutas privadas sin sesión, rol no autorizado, error API, publicación sin SKU/imágenes, ausencia de variantes, pago unknown, fallo de alta Seller+Warehouse sin éxito parcial, pedido finalizado sin edición.

Definition of Done: criterio satisfecho, responsive básico, accesibilidad básica, errores/estados, pruebas ejecutadas, revisión y trazabilidad.

## Cobertura E2E del tema y del catálogo

`frontend/e2e/theme.spec.ts` (3 pruebas, ejecutadas contra el build de producción):

1. El tema se aplica con el botón real, cambia superficies calculadas (fondo, cabecera, tarjetas), persiste al navegar y al recargar, y vuelve a claro sin errores de consola ni de página.
2. La preferencia del sistema (`prefers-color-scheme: dark`) se respeta en la primera visita y una elección explícita gana y persiste.
3. Catálogo real, búsqueda, filtro por categoría, detalle, alta en carrito y eliminación funcionan en tema claro y oscuro.

`frontend/e2e/support/demo-stock.ts` repone stock del producto demo mediante `POST /api/v1/seller/inventory/ingresos` (API real del vendedor) para que las suites de logística y supervisión sean deterministas sin mocks ni escritura directa en PostgreSQL.

Evidencia del corte: suite completa 13/13 en build de producción; `theme.spec.ts` 3/3; lint sin errores; typecheck y build correctos.
