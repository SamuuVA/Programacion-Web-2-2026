# NexusMarket — SDD de experiencia Logistics Operator (operador logístico)

## 1. Objetivo

Reducir errores y tiempo operativo durante las tareas de preparación y despacho que estén asignadas/autorizadas al operador. La interfaz debe ser funcional en escritorio y tabletas, con controles grandes, lenguaje concreto y trazabilidad.

El dominio indica que un pedido pagado inicia preparación y que se registra la salida de bodega; los estados intermedios, evidencias y excepciones específicas no están completamente definidos. No inventarlos.

## 2. Navegación

- Resumen operativo
- Cola de tareas/pedidos asignados
- Detalle de pedido
- Preparación y verificación
- Despacho
- Incidencias (si está soportado)
- Historial de operaciones autorizadas

## 3. Dashboard operativo

- Colas por estado real y prioridad devuelta por backend.
- Pedidos/tareas asignados al operador o a su ámbito.
- Información de bodega necesaria para ejecutar la tarea.
- Señales claras de falta de datos, conflicto o tarea ya procesada.
- No mostrar tiempos límite ni indicadores de atraso sin una regla/fecha de servicio definida.

## 4. Flujo de preparación

1. Abrir una tarea asignada.
2. Verificar identificador del pedido y bodega.
3. Revisar artículos, productos independientes y cantidades.
4. Registrar verificaciones/picking únicamente mediante acciones soportadas.
5. Informar discrepancia por el mecanismo definido por backend.
6. Confirmar preparación cuando el backend acepte la transición.
7. Mostrar el siguiente paso autorizado.

No dar por preparada una orden solo porque el usuario pulse el botón. Esperar respuesta del backend.

## 5. Flujo de despacho

- Mostrar artículos/pedido y datos de despacho necesarios para el rol.
- Confirmar el pedido correcto antes de ejecutar una transición irreversible.
- Registrar despacho con el caso de uso de backend.
- Mostrar referencia de seguimiento solo si se devuelve una.
- Si el backend informa conflicto (por ejemplo, ya despachado), refrescar estado y explicar que cambió.
- No crear ni inventar transportadoras, etiquetas o guías.

## 6. Imágenes

- Las imágenes de producto pueden servir para reconocer artículos, pero nunca sustituyen SKU/identificador o verificación formal.
- Usar miniaturas optimizadas con `next/image`, tamaño fijo y fallback.
- Mostrar avatar del operador solo como identidad de sesión, no como evidencia operativa.
- Si se permiten fotografías de evidencia de paquete/daño, este SDD no autoriza la función por sí solo: debe existir contrato de backend, política de retención, permisos, límites de archivo y controles de privacidad.
- Las imágenes de pedido/evidencia, si existen, pueden ser privadas; no exponer URL pública ni incluirlas en caché compartida.
- En errores de imagen, mantener nombre/código del producto visible para que el trabajo no dependa exclusivamente de una foto.

## 7. Diseño de interacción y prevención de errores

- Botones grandes, contraste suficiente y acciones primarias separadas de acciones destructivas.
- Confirmación para transiciones sensibles; el texto debe identificar pedido y resultado esperado.
- Evitar acciones duplicadas mediante estado de procesamiento; el backend debe ser idempotente cuando aplique.
- No permitir acciones fuera del estado/permiso autorizado; backend vuelve a validar.
- Mantener filtros y contexto al volver a la cola.
- Mostrar fecha/hora con zona horaria clara si viene de backend.
- En dispositivos compartidos, permitir cierre de sesión visible y no conservar datos personales tras salir.

## 8. Accesibilidad y entorno

- Objetivos táctiles amplios, navegación por teclado, foco visible.
- No depender solo de color o iconos para diferenciar estados.
- Contraste adecuado para uso en almacenes y pantallas pequeñas.
- Escáner de código de barras solo si existe integración técnica aprobada; no bloquear el flujo si no está disponible.

## 9. Métricas

- tiempo de preparación;
- errores de picking;
- discrepancias por bodega;
- tiempo entre preparación y despacho;
- incidencias y tiempo de resolución.

No calcularlas en el cliente como fuente de verdad; consumir reportes/telemetría autorizados.

## 10. Criterios de aceptación

- El operador solo ve tareas/recursos de su alcance.
- Las transiciones requieren confirmación del backend.
- Un conflicto actualiza el estado visible y no se oculta.
- Las imágenes no sustituyen identificadores ni reglas de verificación.
- La UI funciona en tabletas y contempla carga, vacío, error y pérdida de conectividad.
