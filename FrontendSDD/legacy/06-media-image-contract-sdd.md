# NexusMarket — SDD transversal de medios e imágenes

## 1. Objetivo

Definir el comportamiento frontend común para imágenes de productos, avatares personales, logos de tienda y posibles evidencias privadas. El documento separa las necesidades de UX de las decisiones de infraestructura que debe aprobar el backend.

## 2. Clases de recurso

| Recurso | Uso | Visibilidad |
|---|---|---|
| Imagen de producto | Tarjetas, detalle, productos independientes | Pública solo si el producto/asset está publicado y la política lo permite |
| | Avatar personal | Identidad visual de cuenta | Privada o pública según política; no inferir exposición |
| Logo/imagen de tienda | Identidad comercial | Pública solo en el perfil de tienda publicado |
| Imagen de evidencia | Paquete, daño, devolución u operación | Privada; requiere contrato y autorización explícitos |
| Banner promocional | Campaña o categoría | Solo si existe un módulo de campañas y contenido aprobado |

## 3. Contrato conceptual

El frontend necesita recibir, como mínimo, una URL válida para el contexto, texto alternativo y datos suficientes para reservar espacio. El contrato real se define con el equipo backend.

```ts
export type ImageAssetView = {
  url: string;
  altText: string;
  width?: number;
  height?: number;
  rendition?: "thumbnail" | "card" | "detail" | "original";
};
```

Este tipo es ilustrativo y no implica que el backend deba adoptar estos nombres.

## 4. Configuración de Next.js

Configurar `images.remotePatterns` en `next.config.ts` con esquemas, hosts y rutas permitidos explícitamente. Evitar patrones globales como cualquier dominio o wildcard amplio. Mantener la lista alineada con los hosts de CDN/servicio de medios aprobados por ambiente.

Ejemplo ilustrativo:
```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.example.com",
        pathname: "/nexusmarket/**",
      },
    ],
  },
};

export default nextConfig;
```

`media.example.com` es un ejemplo, no un host real de NexusMarket. Debe reemplazarse por el dominio aprobado.

## 5. Componente compartido

Crear un `ProductImage` o `ProfileImage` tipado que:
- reciba URL validada desde el contrato;
- defina `alt`, `sizes`, dimensiones o `fill`;
- aplique placeholder;
- use fallback local en error;
- evite reintentos infinitos;
- mantenga relación de aspecto;
- no registre URLs firmadas completas en telemetría;
- no incluya lógica de negocio ni autorización.

Mantener componentes separados por intención semántica (producto/avatar/evidencia), aunque compartan utilidades de carga.

## 6. Carga y rendimiento

- Definir `width` y `height` o contenedor con `aspect-ratio`.
- Usar `sizes` adaptado al layout real.
- Cargar de forma prioritaria solo la imagen principal crítica.
- Lazy loading para imágenes fuera de viewport.
- No precargar todas las imágenes de una grilla.
- Preferir formatos optimizados servidos por CDN/Next.js; la política de formatos y calidad se valida con pruebas reales.
- Evitar cambios de tamaño después de cargar.
- Establecer límites de imágenes por página y miniaturas para tablas.

## 7. Upload UX

1. Selección de archivo.
2. Validación preliminar en cliente.
3. Previsualización local.
4. Solicitud de autorización/sesión de carga.
5. Carga a través del flujo aprobado.
6. Confirmación del backend/servicio de medios.
7. Asociación al producto, producto o perfil mediante el caso de uso correspondiente.
8. Refresco de la vista.
9. Reintento o cancelación si falla.

La previsualización local no implica que el recurso esté guardado. No mostrar estado persistido hasta recibir confirmación.

## 8. Validaciones

Validaciones de UX configurables:
- MIME permitido;
- extensión esperada;
- tamaño máximo;
- ancho/alto mínimos y máximos;
- cantidad máxima de imágenes;
- relación de aspecto recomendada.

El backend debe verificar el contenido real del archivo, autorización, malware/moderación cuando aplique, y límites. El cliente no es frontera de seguridad.

## 9. Privacidad y caché

- Recursos públicos: CDN/caché de acuerdo con política.
- Recursos privados: URLs firmadas o mecanismo autenticado; no reutilizar caché compartida entre usuarios.
- No colocar datos personales en nombres de archivo, query strings o texto alternativo.
- No exponer imágenes privadas en previews compartidas o metadatos.
- Definir expiración de URLs y cómo refrescarlas.
- Al cerrar sesión, limpiar referencias visuales a recursos privados y datos sensibles.

## 10. Fallbacks y accesibilidad

- Producto sin imagen: placeholder neutro con nombre del producto accesible en texto.
- Avatar sin imagen: iniciales o icono neutral.
- Logo sin imagen: placeholder de tienda.
- Error de carga: fallback que no colapse el layout.
- `alt=""` solo para imágenes decorativas; imágenes informativas deben tener texto alternativo útil.
- No duplicar exactamente el nombre del producto en `alt` si el texto adyacente ya cumple esa función y la imagen no aporta información adicional.
- Si una galería permite cambiar imagen, controles con nombre accesible y soporte teclado.

## 11. Decisiones pendientes del backend/infraestructura

- Proveedor de almacenamiento/CDN.
- Contrato de carga y asociación.
- Hosts y rutas permitidos por ambiente.
- Tipos, tamaños, dimensiones y cantidades máximas.
- URL pública vs firmada y expiración.
- Política de borrado y reemplazo.
- Generación de miniaturas y formatos.
- Escaneo, moderación y cumplimiento legal.
- Permisos de acceso a evidencias.
- Relación de imágenes con productos independientes.
