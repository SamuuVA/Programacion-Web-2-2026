# NexusMarket — Frontend Master SDD (Next.js + DDD)

**Estado:** propuesta técnica basada en `nexusmarket-domain-sdd.md`  
**Tecnología objetivo:** Next.js con App Router, React, TypeScript  
**Ámbito:** arquitectura frontend compartida, navegación por rol, contratos, seguridad de interfaz, diseño visual, imágenes, calidad y despliegue.

## 1. Propósito

Definir cómo construir el frontend de NexusMarket con una experiencia de comercio electrónico inspirada en patrones observables en Mercado Libre, Amazon y Temu, sin copiar su identidad visual ni introducir funciones que no estén aprobadas para NexusMarket.

La experiencia debe servir dos objetivos complementarios:

1. **Conversión del comprador:** descubrir productos relevantes, entender precio y disponibilidad, confiar en el vendedor y completar la compra con fricción mínima.
2. **Productividad operativa:** ayudar a vendedores, operadores logísticos, administradores y supervisores a completar sus tareas con pocos pasos, información accionable y trazabilidad.

Las referencias de mercado son inspiración de UX, no fuentes de reglas de negocio. Las políticas, estados, permisos y operaciones válidas provienen de los documentos de dominio y de los contratos del backend.

## 2. Fuentes de verdad y decisiones de dominio preservadas

Antes de implementar, el equipo debe leer la versión vigente de `nexusmarket-domain-sdd.md` y los contratos API reales. Este SDD no reemplaza esos documentos.

Decisiones que el frontend debe respetar:

- Los roles son **Buyer, Seller, Logistics Operator, Administrator y Supervisor**.
- Cada usuario tiene un único rol.
- Buyer y Seller son entidades de dominio distintas de `User`; no son subtipos de usuario.
- El administrador registra vendedores y su primera bodega; los vendedores no se autorregistran.
- Los productos pueden ser físicos o digitales, pueden tener productos independientes y usan los estados `Published`, `Suspended` y `Discontinued`.
- El inventario se administra por producto y bodega; no puede ser negativo ni reservar unidades inexistentes o dañadas.
- Un pago validado inicia la preparación. La entrega confirmada permite finalizar el pedido. Un pedido finalizado no se modifica.
- Los detalles de facturación, logística, devoluciones, reembolsos, políticas de publicación y algunos estados/transiciones están incompletos. No deben inventarse en UI como reglas definitivas.
- Los permisos deben considerar rol **y alcance del recurso**. Un vendedor no puede gestionar productos, inventario ni pedidos de otro vendedor.
- No asumir permisos de aprobación de reembolsos, modificación de pedidos ni cambios sensibles para Supervisor; deben venir del contrato de autorización aprobado.

## 3. Objetivos de experiencia

### 3.1 Comprador
- Encontrar productos por búsqueda, categorías, filtros y descubrimiento visual.
- Comparar opciones mostrando precio, productos independientes, disponibilidad y reputación cuando esos datos existan.
- Entender el costo total y las condiciones antes de confirmar.
- Recibir feedback inequívoco ante errores, pagos pendientes y cambios de disponibilidad.
- Consultar pedidos y su estado real; nunca simular estados de entrega.

### 3.2 Vendedor
- Publicar y mantener productos con un flujo guiado y validación contextual.
- Ver ventas, tareas pendientes, productos con bajo inventario y problemas operativos.
- Gestionar pedidos y existencias dentro de su alcance autorizado.
- Identificar oportunidades de mejora sin presentar recomendaciones analíticas si no hay datos que las sustenten.

### 3.3 Operador logístico
- Trabajar desde colas operativas claras y priorizadas por el backend.
- Verificar pedido, artículos y bodega antes de registrar acciones.
- Evitar errores de picking y cambios accidentales de estado.
- Registrar incidencias con evidencia cuando el backend soporte esa capacidad.

### 3.4 Administrador
- Incorporar vendedores y primera bodega.
- Administrar usuarios, vendedores y operaciones autorizadas.
- Investigar incidencias y consultar reportes permitidos.
- Proteger acciones de alto impacto con confirmación y registro de motivo cuando el contrato lo requiera.

### 3.5 Supervisor
- Obtener visibilidad consolidada de procesos autorizados.
- Detectar atrasos, anomalías y tendencias.
- Escalar incidencias sin asumir facultades de modificación no aprobadas.

## 4. Principios de arquitectura frontend

Aplicar DDD de forma pragmática. El frontend representa conceptos y flujos del negocio, pero el backend sigue siendo la autoridad de las reglas, autorizaciones, consistencia y persistencia.

1. **Domain-first:** términos, estados y acciones de UI usan el lenguaje ubicuo de NexusMarket.
2. **Límites explícitos:** cada contexto funcional tiene su propio modelo de presentación, casos de uso y adaptadores.
3. **Dependencias hacia dentro:** componentes visuales no importan clientes HTTP ni lógica de autorización; los casos de uso dependen de puertos.
4. **No duplicar reglas críticas:** la validación frontend mejora la experiencia, pero el backend valida de nuevo.
5. **DTOs aislados:** los DTO de API se transforman a modelos de aplicación/presentación; no se tratan automáticamente como entidades de dominio.
6. **UI sin privilegios:** ocultar un botón no constituye autorización.
7. **Trazabilidad:** errores y operaciones relevantes deben correlacionarse con identificadores de solicitud cuando el backend los exponga.
8. **Accesibilidad y móvil primero:** formularios, tablas, navegación y galerías deben ser utilizables con teclado, lector de pantalla y pantallas estrechas.
9. **No inventar datos:** no mostrar ratings, tiempos de entrega, descuentos, stock, insignias, analítica o estados si no existen en una fuente fiable.

## 5. Estructura de carpetas sugerida

```text
src/
  app/
    (storefront)/
      page.tsx
      search/page.tsx
      products/[productId]/page.tsx
      cart/page.tsx
      checkout/page.tsx
      account/
    (auth)/
      login/page.tsx
      access-denied/page.tsx
    (workspace)/
      buyer/
      seller/
      logistics/
      admin/
      supervisor/
    api/                         # solo BFF/proxy si se decide explícitamente
  modules/
    identity/
      domain/
      application/
      infrastructure/
      presentation/
    catalog/
    discovery/
    cart/
    checkout/
    orders/
    inventory/
    seller-management/
    logistics/
    returns/
    reporting/
    media/
  shared/
    domain/                      # solo tipos/VO realmente compartidos
    application/
    infrastructure/
    ui/
    auth/
    config/
    observability/
  tests/
```

No crear un único `shared/domain` que se convierta en un dominio global con dependencias cruzadas. Los módulos deben mantener sus modelos y contratos locales cuando corresponda.

## 6. Capas y responsabilidades

| Capa | Responsabilidad | Puede depender de |
|---|---|---|
| `domain` | Tipos de dominio frontend estrictamente necesarios, políticas de presentación puras y estados tipados; no persistencia | Tipos base sin infraestructura |
| `application` | Casos de uso, coordinación de acciones, interfaces de puertos, mapeo de resultados | `domain`, puertos |
| `infrastructure` | Implementaciones de puertos HTTP, manejo de sesión, carga de medios, telemetría | APIs, SDK y librerías externas |
| `presentation` | Componentes, páginas, hooks de presentación, formularios, view models | `application`, UI compartida |
| `app` | Rutas Next.js, layouts, composición, límites de error y carga | Presentación y composición |

El código de `domain` y `application` no debe importar `next/navigation`, componentes React, SDK de imágenes, cliente HTTP concreto ni SDK de proveedores.

## 7. Next.js y renderizado

- Usar **App Router**.
- Preferir Server Components para páginas de lectura pública y contenido inicial de catálogo cuando la llamada al backend pueda ejecutarse de forma segura en servidor.
- Usar Client Components solo cuando se requiera interacción local: filtros interactivos, carrito, selector de productos, formularios, galería, tablas con acciones o controles.
- Las acciones de escritura deben invocar casos de uso/adaptadores bien definidos y mostrar el resultado confirmado por el backend.
- No exponer secretos ni credenciales de servicios de medios en variables `NEXT_PUBLIC_*`.
- Evitar usar Server Actions como sustituto implícito de contratos de aplicación. Si se usan, deben ser adaptadores de entrada delgados y validar sesión, autorización y entrada.
- Usar `loading.tsx`, `error.tsx`, `not-found.tsx` y estados de error de dominio en rutas relevantes.
- Aplicar caché por caso de uso: catálogo público puede admitir caché invalidable; carrito, stock operativo, pedidos, pagos y permisos deben usar políticas conservadoras. No cachear información sensible entre usuarios.
- Los cambios de inventario o estado deben refrescar/revalidar vistas afectadas después de confirmación del backend.

## 8. Navegación y layout

### Storefront público
- Header con marca, búsqueda destacada, categorías, acceso a cuenta y carrito.
- Menú y contenido adaptables a móvil.
- Navegación a catálogo, producto, carrito, checkout y ayuda/órdenes según sesión.

### Workspace autenticado
- Layout común con navegación filtrada por capacidades, identidad del usuario, notificaciones, ayuda y cierre de sesión.
- La navegación cambia por rol; no se crea un único panel con todas las rutas visibles.
- La ruta y la API deben aplicar autorización; un acceso directo a URL no debe conceder permisos.
- Mantener breadcrumb, filtros y contexto de lista al volver desde un detalle cuando sea viable.

## 9. Contratos de aplicación y API

- Definir puertos por necesidad del caso de uso, por ejemplo `CatalogQueryPort`, `CartCommandPort`, `OrderQueryPort`, `ProductMediaPort`; no crear un repositorio universal.
- Aislar los DTO HTTP en `infrastructure` y mapearlos a view models.
- Manejar errores de red, validación, no autenticado, prohibido, no encontrado, conflicto de estado, límite de tasa y error inesperado.
- Las operaciones de compra deben tolerar doble clic, reintentos y respuestas tardías; la idempotencia efectiva corresponde al contrato backend.
- No suponer endpoints, campos ni formatos. Documentar los contratos faltantes como dependencias del backend.
- Para cambios de estado, deshabilitar temporalmente la acción mientras se procesa y volver a habilitarla ante fallo recuperable.

## 10. Seguridad y privacidad

- Validar sesión en servidor donde sea posible y aplicar autorización también en backend.
- Evitar almacenar tokens sensibles en `localStorage`; preferir el mecanismo de sesión acordado con backend, idealmente cookies `HttpOnly`, `Secure`, `SameSite` cuando la arquitectura lo permita.
- Proteger rutas privadas, pero no considerar el middleware de Next.js como único control de seguridad.
- No confiar en `role`, `sellerId`, `warehouseId`, `price` o `stock` enviados por el cliente para autorizar acciones.
- No registrar contraseñas, tokens, datos de pago ni información personal sensible en logs.
- Sanitizar nombres, descripciones y contenido que pueda incluirse en HTML.
- Las imágenes subidas se validan por MIME real, tamaño y dimensiones en servidor; no confiar solo en la extensión o el navegador.

## 11. Sistema de diseño

Crear tokens de color, tipografía, espaciado, radios, elevación, foco y estados. Mantener una identidad propia; no replicar logos, marcas, iconografía propietaria ni la composición exacta de competidores.

### Patrones inspirados en referentes
- **Amazon:** jerarquía de búsqueda, detalle de producto informativo, claridad de disponibilidad y cuenta/pedidos.
- **Mercado Libre:** señales de confianza, reputación del vendedor cuando exista, seguimiento comprensible y contexto local.
- **Temu:** descubrimiento visual, grillas densas y navegación de ofertas; evitar urgencia falsa, descuentos ficticios o escasez no verificada.

### Componentes compartidos
`ProductCard`, `ProductImage`, `ProductGallery`, `PriceDisplay`, `AvailabilityLabel`, `SellerIdentity`, `Avatar`, `RatingSummary` (solo si hay ratings reales), `SearchBox`, `FilterPanel`, `Pagination`, `StatusBadge`, `EmptyState`, `ErrorState`, `Skeleton`, `ConfirmDialog`, `FormField`, `Toast`, `DataTable`, `Timeline`.

Los componentes compartidos presentan datos; no deciden reglas de negocio ni permisos.

## 12. Estrategia de imágenes de productos y perfiles

### 12.1 Principio
Las imágenes se obtienen desde el servicio de medios/API aprobada. El frontend no debe buscar imágenes aleatorias por nombre de producto ni generar URLs de proveedor inventadas. Una imagen debe pertenecer al producto, producto, vendedor o usuario que representa.

### 12.2 Modelo de presentación recomendado
El contrato de medios debe exponer una URL estable o URL temporal firmada, texto alternativo, dimensiones/relación de aspecto y, si aplica, productos independientes optimizadas. Los nombres exactos del contrato quedan pendientes de definición.

Ejemplo conceptual (no constituye contrato API):
```ts
type MediaAssetView = {
  url: string;
  altText: string;
  width?: number;
  height?: number;
  blurDataURL?: string;
};
```

### 12.3 Uso de `next/image`
- Usar `next/image` para imágenes remotas y locales, con `width`/`height` o contenedor `fill` y `sizes`.
- Configurar `images.remotePatterns` para hosts explícitamente aprobados.
- No permitir dominios arbitrarios en `remotePatterns`.
- Usar `priority` solo para la imagen principal visible inmediatamente (por ejemplo, hero/LCP); no marcar toda la grilla como prioritaria.
- Usar `sizes` responsivo para evitar descargar imágenes de escritorio en móvil.
- Mantener relación de aspecto estable para prevenir CLS.
- `object-fit: contain` para productos donde se necesita ver el objeto completo; `cover` para avatares, banners y fotografía ambiental cuando el recorte sea intencional.
- Definir placeholder y `onError` sin ciclos de reintento infinitos.
- No hacer `unoptimized` global sin una razón técnica documentada.

### 12.4 Imágenes de producto
- Tarjeta de catálogo: miniatura consistente, normalmente 1:1, con `sizes` de grilla.
- Detalle: galería con miniaturas, imagen principal y navegación por teclado; productos independientes actualizan la imagen si el contrato relaciona imágenes con productos independientes.
- Producto sin imagen: placeholder neutral y etiqueta de imagen no disponible; nunca mostrar una foto de otro producto.
- Error de carga: fallback local; registrar métricas técnicas sin incluir URLs firmadas completas en logs.
- Alt: describir el producto/ángulo/producto de forma útil, no repetir keywords de SEO.
- No superponer badges de oferta, stock o descuento si la API no entrega datos verificables.
- Imágenes de vendedor no deben sustituir imágenes de producto y viceversa.

### 12.5 Avatares y perfiles
- Avatar de usuario y logotipo/imagen de tienda son recursos distintos.
- Usar recorte circular para avatar personal y recorte cuadrado o adaptable para identidad de tienda.
- Si falta imagen, mostrar iniciales de forma determinista o un icono neutro; evitar avatar de una persona ficticia que parezca real.
- En perfiles públicos de vendedor, mostrar únicamente datos aprobados para exposición pública.
- En paneles operativos, no exponer documentos de identidad ni información sensible en alt, URL, logs o metadatos visibles.
- Al cambiar avatar/logo: previsualización, validación, confirmación del servidor y rollback visual si falla.

### 12.6 Flujo de carga (upload)
1. Usuario selecciona archivo.
2. Validación rápida de UX: tipos permitidos, tamaño y dimensiones configurados por contrato.
3. Previsualización local temporal; revocar object URLs al desmontar/reemplazar.
4. Solicitar al backend o servicio de medios una sesión/URL de carga autorizada.
5. Subir el archivo directamente o a través del backend según la arquitectura aprobada.
6. Confirmar la carga y asociar el asset al producto/perfil mediante el caso de uso correspondiente.
7. Mostrar éxito solo cuando el servidor confirme; ante error, conservar el formulario y ofrecer reintento.
8. Invalidar/refrescar la vista y limpiar el estado temporal.

La generación de miniaturas, escaneo de malware, moderación, límites y eliminación de assets son responsabilidades del backend/servicio de medios salvo contrato explícito distinto.

### 12.7 Seguridad de medios
- Preferir URLs firmadas de corta duración para recursos privados; URLs públicas estables para imágenes públicas según política.
- Nunca incluir credenciales del bucket o proveedor en el navegador.
- Validar autorización del actor y propiedad del recurso al asociar o eliminar medios.
- No confiar en el nombre del archivo del usuario; generar nombres de almacenamiento en servidor.
- Definir política de expiración y caché coherente con la estrategia de CDN.
- Evitar que imágenes privadas de pedidos o perfiles internos sean accesibles por URL pública.

## 13. Estados de interfaz obligatorios

Cada pantalla asíncrona debe contemplar, según aplique:
- carga inicial;
- carga incremental;
- contenido;
- vacío con siguiente paso;
- error recuperable y reintento;
- sesión expirada;
- acceso denegado;
- recurso inexistente;
- conflicto por estado cambiado;
- datos desactualizados;
- operación en curso;
- operación confirmada;
- operación fallida.

No mostrar un estado de éxito antes de una respuesta confirmatoria. Los mensajes deben ser claros y no revelar detalles internos sensibles.

## 14. Analítica UX

Instrumentar eventos con consentimiento/política de privacidad aplicable. No enviar datos personales ni tokens.

Eventos sugeridos:
- búsqueda enviada, búsqueda sin resultados, filtro aplicado;
- vista de producto, selección de producto, añadir al carrito;
- inicio de checkout, error de validación, pago confirmado por backend, abandono;
- alta/edición/publicación de producto;
- fallo de carga de imagen;
- acción de inventario, preparación y despacho;
- error de autorización, conflicto de estado y error de red.

Los informes comerciales solo se mostrarán si existen fuentes de datos fiables y permisos. No inferir conversiones ni ventas a partir de clics aislados.

## 15. Calidad, pruebas y Definition of Done

### Pruebas
- Unitarias: mapeadores, view models, casos de uso, validaciones de formulario puramente UX y utilidades de medios.
- Componentes: estados de carga/error/vacío, accesibilidad, fallback de imagen, formularios y diálogos.
- Integración: adaptadores API, sesión, autorización visual y manejo de errores.
- E2E: navegación por rol, catálogo, detalle, carrito/checkout con entorno de pruebas, flujos de vendedor y tareas logísticas.
- Seguridad: acceso directo a rutas, aislamiento entre vendedores, no filtración de datos entre sesiones.
- Visual regression para layouts principales cuando exista infraestructura.

### Definition of Done
- Requisitos vinculados a este SDD o a una decisión aprobada.
- Contratos API verificados; nada de mocks en producción.
- Estados de carga, error, vacío y éxito implementados.
- Responsive, teclado, foco visible y etiquetas accesibles.
- Imágenes optimizadas, fallback, `alt` y dominios permitidos.
- Pruebas relevantes pasan y errores de consola críticos están resueltos.
- No se duplican reglas de negocio ni se confía en permisos del cliente.
- Documentación y decisiones pendientes actualizadas.

## 16. Decisiones que deben resolverse antes de cerrar implementación

1. Versión de Next.js/React y estrategia de despliegue.
2. Contrato de autenticación, renovación de sesión, CSRF y cierre de sesión.
3. OpenAPI/contratos del backend y formato común de errores.
4. Servicio de medios, hosts permitidos, subida directa o proxy, límites, formatos y política de URLs.
5. Política de caché, CDN e invalidación de imágenes.
6. Estados y permisos exactos de devolución, reembolso, factura y logística.
7. Datos disponibles para reputación, reviews, promociones, analítica, ETA y recomendaciones.
8. Política de accesibilidad, privacidad, cookies y analítica.

Estas decisiones no deben resolverse con suposiciones ocultas en el código.
