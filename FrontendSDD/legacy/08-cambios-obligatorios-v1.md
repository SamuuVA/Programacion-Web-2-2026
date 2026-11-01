# Cambios obligatorios de frontend para V1

Este documento evita que texto heredado de versiones anteriores vuelva a introducir funcionalidades descartadas.

- No mostrar variantes comerciales, selector de variante, galería por variante, stock por variante ni formularios de variantes. Cada combinación vendible es un Product independiente.
- Inventario y movimientos se consultan por Product + Warehouse.
- SKU e imágenes son obligatorios para publicar; no existe requisito de crear una variante.
- Alta de Seller y primera Warehouse es una sola acción con resultado atómico. Ante fallo, la UI comunica que no se creó ninguno.
- Para pagos con timeout o resultado desconocido, mostrar estado de verificación; no pedir un reintento ciego ni declarar fallo sin confirmación backend.
- La devolución es elegible dentro de 30 días de entrega según regla consolidada, pero no inventar logística inversa ni afirmar reembolso hasta que los contratos definan el proceso.
- Mantener en pantalla solo acciones permitidas por capacidades devueltas por backend, sin considerar esta ocultación una barrera de seguridad.
- Revisar todos los criterios de aceptación, wireframes, tipos, mocks, fixtures y tests por referencias residuales a variantes.
