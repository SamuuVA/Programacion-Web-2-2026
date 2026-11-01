# NexusMarket — SDD de experiencia Supervisor

## 1. Objetivo y límites

Ofrecer visibilidad consolidada de los procesos que el supervisor está autorizado a consultar: desempeño operativo, pedidos con problemas, inventario, devoluciones y tendencias cuando existan datos. El principio por defecto es **consulta y seguimiento**, no modificación.

Los permisos de aprobación, intervención, reembolso o cambio de estado deben definirse en la política de autorización; no se presuponen.

## 2. Navegación

- Panel de seguimiento
- Pedidos/incidencias
- Inventario y bodegas
- Vendedores y catálogo (solo datos autorizados)
- Devoluciones/reembolsos (solo si se aprueba)
- Reportes y exportaciones (si están autorizados)
- Auditoría/seguimiento (si el backend lo soporta)

## 3. Dashboard

- Tendencias por periodo, con definición y fuente.
- Pedidos por estado real y casos operativos que requieren atención.
- Atrasos solo cuando exista una fecha límite o SLA aprobado.
- Alertas de inventario derivadas de reglas configuradas.
- Filtros por periodo, vendedor, bodega o estado solo cuando la API autorice esos filtros.
- Indicar cuándo se actualizaron los datos y si la consulta está incompleta.

## 4. Seguimiento de pedidos y operaciones

- Timeline compuesto por eventos confirmados por backend.
- Identificador de pedido, estados, marcas temporales y referencias logísticas disponibles.
- Comparar eventos solo si los datos y definiciones están disponibles.
- Permitir abrir detalle, revisar contexto y escalar si existe caso de uso aprobado.
- No permitir editar pedidos finalizados ni cambiar estados por una acción de solo lectura.
- No mostrar datos de compradores innecesarios para la supervisión.

## 5. Reportes

- Periodo y zona horaria explícitos.
- Definición de cada indicador, filtros activos, fecha de actualización y origen.
- Exportar solo con permiso y a través de una operación backend controlada.
- Aplicar minimización de datos; los reportes no pueden ser un canal indirecto para acceder a información no autorizada.
- Evitar conclusiones automáticas sobre fraude o rendimiento sin una regla aprobada.

## 6. Imágenes y perfiles

- Avatares y logos ayudan a reconocer usuario/tienda, pero no son evidencia de identidad ni de rendimiento.
- Imágenes de producto en contexto de investigación deben ser miniaturas y enlazarse al detalle autorizado.
- Evidencia de envío, daño o devolución solo se muestra si existe un contrato explícito y permiso por recurso.
- Respetar URL firmadas, expiración, caché y política de privacidad.
- Fallback visual cuando la imagen no está disponible; el resto del registro debe seguir accesible.

## 7. Acceso y seguridad

- La UI debe representar capacidades devueltas por la autorización, pero el backend siempre vuelve a verificar.
- No confiar en ocultar botones o en rutas difíciles de adivinar.
- Restringir datos de comprador, vendedor, pagos y documentos al mínimo necesario.
- Si una exportación contiene datos sensibles, debe seguir permisos, auditoría y política de retención.

## 8. Métricas

- tiempo de detección de incidencias;
- tiempo de resolución;
- volumen de casos fuera de plazo definido;
- integridad de eventos de seguimiento;
- consistencia de reportes.

## 9. Criterios de aceptación

- La experiencia es de seguimiento por defecto.
- No aparecen acciones de mutación no autorizadas.
- Los indicadores muestran periodo, definición y frescura cuando se conoce.
- No se infieren SLA, causas o fraude sin fuentes aprobadas.
- El acceso a imágenes y datos sigue el mismo alcance de autorización del recurso.
