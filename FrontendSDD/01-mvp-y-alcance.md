# 01 — MVP y alcance
**P0:** Home, catálogo, detalle, responsive y navegación pública.  
**P1:** carrito, acceso y journey Buyer.  
**P2:** Seller: listado y formulario de productos, SKU e imágenes, sin variantes.  
**P3:** Administrator: consulta y alta atómica Seller + primera Warehouse.  
**P4:** Logistics y Supervisor, únicamente con contratos definidos.  
**P5:** integración, accesibilidad, seguridad, pruebas y rendimiento.

Cuando no exista backend, utilizar DemoDataAdapter separado de HttpApiAdapter, activado explícitamente en desarrollo y con aviso visible de modo demostración. Nunca presentar fixtures como datos reales ni simular pagos confirmados.
