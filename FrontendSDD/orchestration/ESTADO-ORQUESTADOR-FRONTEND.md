# Estado del orquestador frontend

Proyecto: NexusMarket. Versión: 1.0. Estado global: IN_PROGRESS (marketplace local verificado y CI remoto en PASS). Ola activa: integración/hardening. Último gate: identidad y onboarding (`GATE-V2-IDENTITY = PASS` local + CI run `42749289978`). Próxima acción: revisión independiente y decisión de los bloqueos documentados.

| Ola | Alcance | Estado |
|---|---|---|
| 0 | Inventario y baseline | DONE |
| 1 | Fundación | DONE (local) |
| 2 | Público/catálogo | DONE (local) |
| 3 | Buyer | DONE (local) |
| 4 | Seller | DONE (local) |
| 5 | Administrator | DONE (local) |
| 6 | Logistics/Supervisor | DONE (local) |
| 7 | Integración/hardening | IN_PROGRESS |

## Corte 2026-11-09 — identidad y onboarding

- Rutas nuevas: `/register`, `/seller-application`, `/admin/seller-applications`, `/admin/seller-applications/[applicationId]`; formulario de estado de acceso en `/admin/users/[userId]`.
- Enlaces de cabecera para registro y solicitud; navegación admin "Solicitudes".
- El frontend no decide permisos ni roles: el backend fija `COMPRADOR` en el alta y `VENDEDOR` solo mediante aprobación administrativa.
- Evidencia ejecutada: `npm run lint` 0 errores (2 avisos `no-img-element`), `npm run typecheck` OK, `npm run build` OK (56 rutas), `npm run test:e2e` 10/10 y CI remoto 5/5 jobs (run `42749289978`).
- Límites: reenvío/edición tras rechazo sin política definida; notificaciones externas no implementadas.

Riesgos: contratos API y sesión ya verificados en local; logística/supervisión dependen de contratos estables. Actualizar por ejecución: fecha, ola, agentes, archivos, pruebas y resultados reales, bloqueos, decisiones, gate, revisor, evidencia y siguiente paso. Verificar el repositorio al reanudar; el estado documental no reemplaza la inspección.
