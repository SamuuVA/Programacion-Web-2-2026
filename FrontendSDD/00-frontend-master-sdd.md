# 00 — Frontend Master SDD
## Propósito
Definir la base de experiencia, arquitectura y entrega del frontend NexusMarket.

## Objetivo de la primera versión
Construir una aplicación web ejecutable y demostrable con home, catálogo, detalle de producto, navegación responsive, acceso y vistas iniciales por rol. Priorizar un flujo vertical funcional sobre muchas pantallas vacías.

## Stack
Next.js App Router, React y TypeScript. Mantener las dependencias existentes salvo justificación. Server Components por defecto; Client Components cuando se requiera interacción.

## Roles
Buyer, Seller, Logistics Operator, Administrator y Supervisor. Cada usuario tiene un único rol principal. Buyer y Seller son entidades/perfiles de dominio distintos de User.

## Reglas obligatorias
- Seller no se auto-registra.
- Administrator registra Seller y su primera Warehouse como una operación atómica.
- V1 no tiene variantes comerciales: cada combinación vendible es un Product independiente.
- SKU e imágenes son requisitos para publicar.
- Inventario por Product + Warehouse; nunca negativo.
- Pago V1 simulado. Resultado desconocido no significa éxito ni rechazo.
- Pedido finalizado no se modifica.
- Backend es autoridad de autorización, ownership, stock, precios y transiciones.
- No afirmar devolución o reembolso ejecutado sin confirmación real.

## Alcance inicial
Home, catálogo, detalle, carrito y flujo Buyer demostrativo/real según contratos; Seller con gestión básica de productos; Administrator con vistas básicas; Logistics y Supervisor cuando existan contratos.

## Fuera del MVP
Pago real, logística inversa completa, reembolsos reales, analítica avanzada y cualquier operación no definida o no contratada.

## Criterio de terminado
Ruta navegable, interacción principal funcional, estados de carga/error/vacío, reglas de dominio respetadas, datos demo identificados, pruebas básicas y build verificados.
