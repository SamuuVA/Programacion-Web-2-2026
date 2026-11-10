# Registro de decisiones

- FE-D-01: Next.js App Router + React + TypeScript — base del proyecto.
- FE-D-02: tema claro, verdes neutros — preferencia acordada.
- FE-D-03: sin variantes comerciales V1 — restricción de dominio.
- FE-D-04: DemoDataAdapter separado de HttpApiAdapter — decisión técnica propuesta.
- FE-D-05: Server Components por defecto — recomendación técnica.
- FE-D-06 (2026-11-09): el registro público no envía rol ni estado; el backend fija `COMPRADOR` y `ACTIVO`.
- FE-D-07 (2026-11-09): `/seller-application` consulta la solicitud propia y refleja el estado; no decide la aprobación.
- FE-D-08 (2026-11-09): la revisión administrativa vive en `/admin/seller-applications`; aprobar y rechazar requieren confirmación.
- FE-D-09 (2026-11-09): el formulario de estado de acceso solo ofrece transiciones válidas, pero el backend revalida y puede responder `422`.
- FE-D-10 (2026-11-09): no se ofrece reenvío tras rechazo ni notificaciones externas mientras la política y la infraestructura no estén definidas.

Registrar cambios con fecha, justificación, impacto y documentos afectados.
