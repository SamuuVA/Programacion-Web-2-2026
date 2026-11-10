# 07 — Buyer UX

Journey: Home → Catálogo → Detalle → Carrito → Checkout → Resultado → Pedidos.

Mostrar únicamente datos disponibles: nombre, descripción, imágenes, precio y disponibilidad según contrato. No inventar ratings, descuentos, stock o entrega. Carrito valida con backend al confirmar. Pago unknown muestra verificación pendiente; nunca éxito ni rechazo. Pedidos requieren sesión. Pedido finalizado no se modifica.

Aceptación: navegación completa, estados vacíos/error, carrito usable en móvil y acciones críticas confirmadas por backend.

## Registro público y solicitud de vendedor (2026-11-09)

- `/register`: formulario de alta de comprador. El rol y el estado los fija el backend; el formulario no los envía. Valida en cliente, muestra carga, evita doble envío y enlaza a `/login` al terminar. Los errores del backend se muestran sin inventar mensajes.
- `/seller-application`: un comprador `ACTIVO` envía `nombreComercial`, `nombreBodega` y `ubicacionBodega`. La página consulta la solicitud propia (`GET /api/v1/buyer/seller-application`) y muestra su estado (`PENDIENTE`, `APROBADA`, `RECHAZADA`) con el motivo de rechazo si existe. Tras la aprobación enlaza a `/seller`; no ofrece reenvío tras un rechazo porque la política no está definida.
- El comprador conserva su cuenta e historial; la aprobación cambia el rol principal a `VENDEDOR`. El frontend no decide el rol ni oculta el resultado de la decisión administrativa.
