# Estado del orquestador frontend

Proyecto: NexusMarket. Versión: 1.1. Estado global: IN_PROGRESS (marketplace local verificado y CI remoto en PASS). Ola activa: integración/hardening. Último gate: recuperación visual, tema y catálogo (`GATE-RECUPERACION-VISUAL = PASS` local), posterior a identidad y onboarding (`GATE-V2-IDENTITY = PASS` local + CI run `42749289978`). Próxima acción: confirmar y publicar el corte de recuperación, revisión independiente y decisión de los bloqueos documentados.

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

## Corte 2026-11-10 — recuperación visual, tema y catálogo

- Diagnóstico verificado: el tema claro/oscuro no era la causa de la pérdida de estilos. Los tokens CSS están completos (56 variables usadas, 0 sin definir; 435/435 llaves) y el build compila.
- Causa 1: PostgreSQL detenido (`Exited (255)`); el backend devolvía `503 DEPENDENCIA_NO_DISPONIBLE` en el catálogo.
- Causa 2: el `next start` de 3001 servía un build anterior; su HTML referenciaba un CSS que devolvía `500`.
- Corrección: se inició PostgreSQL y se reinició 3001 desde el build actual; catálogo y CSS responden `200`.
- Cobertura nueva: `frontend/e2e/theme.spec.ts` (3 pruebas: aplicación/persistencia/recarga, preferencia del sistema y catálogo/búsqueda/detalle/carrito en ambos temas) y `frontend/e2e/support/demo-stock.ts` (reposición de stock por API real del vendedor).
- Corrección de prueba: `body` anima el color de fondo 0.2 s; la prueba ahora espera el valor final con `expect.poll`.
- Evidencia ejecutada: `npm run lint` 0 errores (2 avisos `no-img-element`), `npm run typecheck` OK, `npm run build` OK (56 rutas), `npm run test:e2e` 13/13 en 3001 (4.6 min) y 13/13 en 3002 (11.2 min); `theme.spec.ts` 3/3 en 3001.
- Límites: pendientes de negocio e identidad sin cambios; requisito operativo: PostgreSQL activo y reinicio del servidor de producción tras cada `next build`.

## Corte 2026-11-09 — identidad y onboarding

- Rutas nuevas: `/register`, `/seller-application`, `/admin/seller-applications`, `/admin/seller-applications/[applicationId]`; formulario de estado de acceso en `/admin/users/[userId]`.
- Enlaces de cabecera para registro y solicitud; navegación admin "Solicitudes".
- El frontend no decide permisos ni roles: el backend fija `COMPRADOR` en el alta y `VENDEDOR` solo mediante aprobación administrativa.
- Evidencia ejecutada: `npm run lint` 0 errores (2 avisos `no-img-element`), `npm run typecheck` OK, `npm run build` OK (56 rutas), `npm run test:e2e` 10/10 y CI remoto 5/5 jobs (run `42749289978`).
- Límites: reenvío/edición tras rechazo sin política definida; notificaciones externas no implementadas.

Riesgos: contratos API y sesión ya verificados en local; logística/supervisión dependen de contratos estables. Actualizar por ejecución: fecha, ola, agentes, archivos, pruebas y resultados reales, bloqueos, decisiones, gate, revisor, evidencia y siguiente paso. Verificar el repositorio al reanudar; el estado documental no reemplaza la inspección.
