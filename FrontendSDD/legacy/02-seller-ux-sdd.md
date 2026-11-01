# NexusMarket — SDD de experiencia Seller (vendedor)

## 1. Objetivo y límites

Dar al vendedor un centro de trabajo orientado a publicar productos, mantener inventario por bodega, atender pedidos y entender su desempeño. La UX prioriza claridad y velocidad de operaciones; no autoriza acciones que el dominio o backend no permitan.

El vendedor no se autorregistra: el administrador lo incorpora junto con su primera bodega en una única transacción PostgreSQL; ambos recursos se crean o ninguno se crea. El backend debe restringir recursos al vendedor autenticado.

## 2. Navegación

- Resumen
- Catálogo / productos
- Crear producto
- Inventario y bodegas
- Ventas / pedidos
- Logística (acciones disponibles según permisos)
- Devoluciones / soporte (cuando estén definidos)
- Reportes
- Perfil de tienda

Mostrar únicamente áreas habilitadas por capacidades; cada ruta y operación debe ser autorizada también en backend.

## 3. Dashboard

Debe responder rápidamente:
1. ¿Qué pedidos requieren una acción autorizada?
2. ¿Qué productos están suspendidos o tienen problemas?
3. ¿Qué existencias necesitan atención?
4. ¿Cómo evolucionan las ventas, si existen datos consolidados fiables?

Tarjetas de métricas deben tener definición, periodo y origen; no presentar “ventas en tiempo real” si el dato no lo es. Alertas accionables enlazan al filtro o recurso relevante. Los valores vacíos se muestran como “sin datos”, no como cero si el significado es desconocido.

## 4. Alta y edición de producto

### Flujo guiado
1. Datos básicos.
2. Tipo de producto: físico o digital.
3. Descripción y atributos/categoría.
4. No existe configuración de variantes comerciales en V1; cada combinación vendible se crea como un producto independiente.
5. Precio y moneda.
6. Imágenes y medios.
7. Inventario/logística cuando corresponda al producto físico y al contrato.
8. Revisión de resumen.
9. Guardar borrador/publicar solo si esos casos de uso y condiciones están disponibles. El estado `Draft` debe estar confirmado en el dominio y OpenAPI antes de implementarse.

No asumir que se requiere stock antes de publicar; el dominio deja esa condición pendiente. Mostrar al vendedor los requisitos reales devueltos por backend.

### Validaciones UX
- Marcar campos obligatorios según contrato.
- Guardar cambios no publicados como borrador solo si el estado `Draft` está aprobado en dominio y existe en API.
- Advertir de cambios sin guardar.
- Mostrar errores del servidor por campo o como error global.
- Estados confirmados en los documentos heredados: `Published`, `Suspended`, `Discontinued`. `Draft` es una decisión por armonizar con dominio/OpenAPI; no implementarlo como estado final hasta que esa revisión se cierre.
- No permitir que el vendedor edite productos ajenos aunque conozca su identificador.

## 5. Gestión de imágenes de producto

- Permitir seleccionar/cargar varias imágenes si el backend lo soporta.
- Mostrar previsualizaciones con orden y posibilidad de cambiar la imagen principal si el contrato lo permite.
- Validar tipo, tamaño y dimensiones en UX; servidor valida de nuevo.
- Mostrar progreso de carga y estado individual de cada archivo.
- La imagen solo se considera guardada tras confirmación del servicio de medios y asociación exitosa al producto.
- Si falla una imagen, permitir reintentarla sin perder los demás campos.
- No publicar URLs temporales como datos permanentes; usar la referencia/URL oficial devuelta por el servicio.
- No incluir datos de otros vendedores en el selector de medios.
- Alt text editable o generado desde una descripción revisable, de acuerdo con política de accesibilidad.
- Fallback de imagen ausente/error; nunca sustituirla por foto de otro producto.
- La carga masiva y edición por lote se implementan solo si el backend las soporta.

## 6. Inventario por producto y bodega

- Mostrar producto/producto, bodega, unidades y estados de disponibilidad que el backend exponga.
- Diferenciar existencias disponibles, reservadas y dañadas únicamente si los contratos definen estas cantidades.
- Mostrar movimientos de entrada, reserva, salida por venta, ajuste y devolución cuando el backend los exponga.
- Los ajustes requieren formulario explícito, razón si el contrato lo requiere y confirmación de resultado.
- Nunca permitir que la UI fuerce stock negativo o reserve unidades inexistentes/dañadas; la validación final corresponde al backend.
- No inferir cuál bodega abastecerá una compra: esa selección sigue pendiente en el dominio.
- Las alertas de stock bajo requieren umbrales configurados y origen de datos; no hardcodear un umbral como regla comercial.

## 7. Ventas y pedidos

- Tabla con identificador, fecha, estado, líneas, total, estado de pago y acciones permitidas por backend.
- Filtros por estado/fecha y búsqueda por identificador si la API lo soporta.
- El vendedor ve únicamente pedidos relacionados con sus recursos autorizados.
- Mostrar la diferencia entre pago confirmado y preparación/logística; no inferir pago a partir del estado visual de un pedido.
- Acciones disponibles se derivan de permisos/estado entregados por backend; el backend valida de nuevo.
- No permitir modificar un pedido finalizado.
- No prometer etiquetas, guías, transportadora, ETA o notificaciones si no hay integración contractual.
- Incidencias, devoluciones y reembolsos se muestran solo cuando el flujo y los permisos estén definidos.

## 8. Perfil de tienda y avatar

- Separar identidad de tienda (nombre/logo) de avatar personal del usuario.
- Logo/imagen de tienda: presentación consistente en storefront y panel, con fallback neutro.
- Avatar de cuenta: iniciales o imagen personal; no sustituye al logo de tienda.
- Los datos públicos deben venir de un contrato que especifique qué campos se pueden exponer.
- Cambiar logo/avatar usa flujo de carga común: previsualización, validación, carga autorizada, asociación y confirmación.
- No permitir manipular perfiles de otras tiendas.

## 9. Herramientas para mejorar ventas

Solo mostrar recomendaciones cuando exista evidencia medible:
- ficha incompleta;
- imágenes ausentes o de baja calidad si existe análisis fiable;
- visitas y conversión por producto;
- productos sin ventas en un periodo definido;
- productos con inventario bajo según umbral configurado;
- productos complementarios si existe lógica de recomendación aprobada.

No generar consejos a partir de datos inexistentes. Descuentos, promociones pagadas, publicidad y precios sugeridos requieren capacidades y políticas aprobadas.

## 10. UX de tablas y formularios

- Búsqueda y filtros persistentes al entrar/salir del detalle.
- Acciones masivas con vista previa del número de registros afectados y confirmación.
- Formularios largos divididos por secciones; resumen de errores arriba y errores por campo.
- Botones con texto explícito (“Guardar cambios”, “Suspender producto”), no iconos sin etiqueta en acciones críticas.
- Evitar perder trabajo al expirar sesión; informar y ofrecer recuperar borrador solo si es seguro y soportado.

## 11. Métricas

- tiempo hasta completar publicación;
- errores de carga de medios;
- porcentaje de fichas con información/imágenes completas;
- tiempo de procesamiento de pedidos;
- discrepancias de inventario;
- cancelaciones y devoluciones, cuando se disponga de datos.

Definir fórmula, periodo y fuente antes de presentar cifras.

## 12. Criterios de aceptación

- El vendedor puede consultar y editar solo sus productos/recursos autorizados.
- Los estados de producto coinciden con el backend.
- El inventario se presenta por bodega y no permite sugerir una operación inválida como exitosa.
- La carga de imágenes conserva el formulario y maneja fallos parciales.
- Las métricas muestran su periodo/origen y no inventan datos.
- Se incluyen estados de carga, vacío, error, acceso denegado y conflicto.
