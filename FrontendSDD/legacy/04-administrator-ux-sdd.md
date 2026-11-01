# NexusMarket — SDD de experiencia Administrator (administrador)

## 1. Objetivo y límites

Proveer una consola administrativa para incorporar vendedores y su primera bodega, administrar usuarios/recursos autorizados, consultar operaciones y revisar reportes permitidos. Debe equilibrar eficiencia con protección de acciones de alto impacto.

La matriz exacta de permisos y los estados de usuario deben provenir de la política de autorización aprobada. No inferir permisos solo por la etiqueta Administrator.

## 2. Navegación

- Resumen global
- Usuarios
- Vendedores
- Productos/catálogo
- Bodegas e inventario
- Pedidos y operaciones
- Incidencias/devoluciones/reembolsos (cuando el alcance esté aprobado)
- Reportes
- Auditoría, si existe endpoint y permiso

## 3. Dashboard

- Resumen de ventas/pedidos únicamente desde datos agregados fiables.
- Usuarios/vendedores y productos por estado, según API.
- Alertas de inventario y operaciones pendientes cuando exista una regla configurada.
- Filtros por periodo y ámbito.
- Cada indicador muestra periodo, definición y hora de actualización cuando esté disponible.
- No presentar como global información parcial sin advertir el alcance.

## 4. Alta de vendedor y primera bodega

- Formulario dividido en datos del vendedor y datos iniciales de bodega.
- Resumen previo a confirmar.
- La operación debe ser atómica: el backend registra ambos recursos en una única transacción PostgreSQL; ante error, no debe persistir ninguno. Esta regla no es configurable por el frontend.
- No mostrar “vendedor creado” si la operación compuesta falló parcialmente.
- En error, informar el resultado confirmado y el siguiente paso seguro; evitar reintentar ciegamente si puede duplicar recursos.
- No habilitar autorregistro de vendedor.

## 5. Administración de usuarios y vendedores

- Tabla con búsqueda, filtros, paginación y campos mínimos necesarios.
- Separar estado de `User` del ciclo comercial de `Seller`.
- Mostrar rol único por usuario según dominio.
- Acciones sensibles requieren confirmación; motivo solo si el contrato lo requiere.
- No exponer documentos completos ni datos sensibles en tablas.
- Cambios de estado se confirman desde backend y actualizan historial/indicadores.
- El frontend no debe permitir que el administrador conceda roles no incluidos en el contrato.

## 6. Supervisión de catálogo e inventario

- Consultar productos y estados `Published`, `Suspended`, `Discontinued`.
- Mostrar propietario/vendedor y bodega solo para investigación autorizada.
- No asumir que el administrador puede editar o suspender productos sin un caso de uso y permiso explícitos.
- No permitir ajustes de inventario directos si no existe operación de dominio.
- Mostrar movimientos y alertas desde backend, no calcular stock alternativo en el navegador.

## 7. Operaciones, pedidos y casos de soporte

- Búsqueda por identificador de pedido/operación cuando API lo soporte.
- Mostrar estados y eventos confirmados.
- Diferenciar acciones de consulta de acciones que cambian estado.
- Reembolsos, devoluciones y modificaciones de pedido solo si política y permisos están aprobados.
- Evitar acceso indirecto a datos personales a través de reportes.

## 8. Imágenes y perfiles

- Perfil de usuario: avatar opcional con iniciales de fallback.
- Vendedor: logotipo/imagen pública de tienda, separado del avatar de usuario.
- Producto: imagen ligada a producto; fallback neutro.
- En listados densos usar miniaturas optimizadas; en detalle, galería si es útil para investigar el producto.
- Las imágenes de documentos, evidencia o recursos privados requieren un contrato de seguridad explícito.
- La carga/cambio de logo o avatar usa el flujo común de medios; la administración no obtiene acceso a medios privados por el mero hecho de ser administrador.
- No presentar imágenes de perfil como validación de identidad.

## 9. Auditoría y acciones de alto impacto

- Confirmación con entidad y acción concretas.
- Mostrar resultado confirmado y referencia de operación si existe.
- Si backend expone auditoría, mostrar actor, fecha, tipo y resultado autorizados.
- No generar auditoría ficticia en frontend; el registro oficial corresponde al backend.
- No ocultar errores de autorización, conflicto o fallo parcial.

## 10. Tablas, accesibilidad y rendimiento

- Columnas priorizadas y tablas adaptables a pantallas estrechas.
- Filtros persistentes, paginación del servidor y selección masiva solo si está soportada.
- Confirmación antes de operaciones masivas; resumen del alcance.
- Acciones por teclado, etiquetas accesibles y foco visible.
- No descargar listas completas si la API ofrece paginación.

## 11. Métricas

- tiempo de incorporación de vendedor;
- errores de administración;
- incidencias abiertas;
- tiempo de resolución;
- integridad de trazabilidad;
- errores de acceso denegado.

Las métricas deben proceder de fuentes autorizadas y definiciones documentadas.

## 12. Criterios de aceptación

- Alta de vendedor y primera bodega representa correctamente éxito, error y posible parcialidad.
- Roles, estados y acciones se derivan de contratos.
- Se separan datos públicos y privados.
- Las acciones de alto impacto requieren confirmación y respuesta backend.
- No se inventan permisos de reembolso, modificación ni suspensión.
