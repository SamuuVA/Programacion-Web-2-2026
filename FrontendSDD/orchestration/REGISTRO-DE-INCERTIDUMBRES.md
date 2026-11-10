# Registro de incertidumbres

| ID | Pregunta | Severidad | Estado |
|---|---|---|---|
| FE-U-01 | ¿Qué OpenAPI está disponible? | blocker integración real | RESOLVED: `openapi.yaml` 0.8.0 (74 rutas / 83 operaciones) |
| FE-U-02 | ¿Qué mecanismo de sesión existe? | blocker rutas privadas reales | RESOLVED: sesión opaca con cookie `HttpOnly` en Next.js |
| FE-U-03 | ¿Cuál es el contrato de media storage? | blocker carga real | OPEN: solo imágenes por URL |
| FE-U-04 | ¿Qué operaciones logísticas existen? | blocker módulo logístico | RESOLVED: preparación, despacho y entrega |
| FE-U-05 | ¿Qué consultas de Supervisor están definidas? | blocker reportes | RESOLVED: 9 rutas de solo lectura |
| FE-U-06 | ¿Se puede reenviar o editar una solicitud de vendedor rechazada? | media | OPEN: política no definida; la UI no lo ofrece |
| FE-U-07 | ¿Existe infraestructura de notificaciones externas? | baja | OPEN: no hay correo/mensajería aprobada; resultado en la app |

Cada registro nuevo debe incluir evidencia, pregunta concreta, impacto, opciones, recomendación, responsable y tareas bloqueadas.
