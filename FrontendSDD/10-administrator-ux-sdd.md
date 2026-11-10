# 10 — Administrator UX

Vistas administrativas y consulta de vendedores, usuarios y bodegas según contrato. Alta de Seller y primera Warehouse como una única operación. Si falla, no comunicar éxito parcial. No inventar atributos. Backend valida autorización y atomicidad.

## Revisión de solicitudes y estados de acceso (2026-11-09)

- `/admin/seller-applications`: lista de solicitudes con búsqueda, filtro por estado y paginación. Muestra solicitante, nombre comercial, bodega propuesta, estado y fecha. Estados vacío/error y paginación siguen los patrones administrativos existentes.
- `/admin/seller-applications/[applicationId]`: detalle con datos del solicitante y de la bodega. Permite aprobar (crea vendedor + primera bodega) o rechazar con motivo obligatorio, con confirmación explícita. El resultado real lo decide el backend; la UI no declara éxito por sí sola.
- El administrador no puede aprobar ni rechazar su propia solicitud; la interfaz oculta esas acciones y el backend las deniega igualmente.
- `/admin/users/[userId]`: incluye el formulario de estado de acceso (`ACTIVAR`, `DESACTIVAR`, `BLOQUEAR`, `DESBLOQUEAR`). `DESACTIVAR` y `BLOQUEAR` exigen motivo. Solo se ofrecen las acciones derivadas de la tabla de transiciones, pero el backend revalida y responde `422` con `detalles.transicionInvalida` si la transición no procede. El administrador no puede cambiar su propio estado.
- La aprobación y el rechazo no inventan notificaciones externas: el resultado se consulta dentro de la aplicación. El reenvío o la edición tras un rechazo no se ofrecen porque la política no está definida.
