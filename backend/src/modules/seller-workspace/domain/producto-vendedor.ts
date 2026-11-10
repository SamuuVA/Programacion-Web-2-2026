import {
  CATEGORIAS_PRODUCTO,
  type CategoriaProducto
} from "../../catalog/domain/producto.js";
import {
  BusinessRuleError,
  ValidationError
} from "../../../shared/domain/errors.js";

/**
 * Ciclo de vida del producto en el espacio del vendedor.
 *
 * `BORRADOR` es la fase de creación reconocida por el SDD (§7.1); no se
 * publica ni se muestra en el catálogo. La tabla de transiciones es la única
 * autoridad: un producto `DESCONTINUADO` no vuelve a `PUBLICADO`.
 */
export const ESTADOS_PRODUCTO_VENDEDOR = [
  "BORRADOR",
  "PUBLICADO",
  "SUSPENDIDO",
  "DESCONTINUADO"
] as const;

export type EstadoProductoVendedor = (typeof ESTADOS_PRODUCTO_VENDEDOR)[number];

export const TIPOS_ENTREGA_VENDEDOR = ["FISICA", "DIGITAL"] as const;
export type TipoEntregaVendedor = (typeof TIPOS_ENTREGA_VENDEDOR)[number];

export interface ImagenProductoVendedor {
  readonly id: string;
  readonly url: string;
  readonly alt: string;
  readonly orden: number;
}

export interface ProductoVendedor {
  readonly id: string;
  readonly vendedorId: string;
  readonly nombre: string;
  readonly descripcion: string;
  readonly categoria: CategoriaProducto;
  readonly tipoEntrega: TipoEntregaVendedor;
  readonly sku: string;
  readonly precioCentavos: number;
  readonly moneda: string;
  readonly estado: EstadoProductoVendedor;
  readonly creadoEn: string;
  readonly actualizadoEn: string;
  readonly imagenes: readonly ImagenProductoVendedor[];
}

export interface DatosProducto {
  readonly nombre: string;
  readonly descripcion: string;
  readonly categoria: CategoriaProducto;
  readonly tipoEntrega: TipoEntregaVendedor;
  readonly sku: string;
  readonly precioCentavos: number;
  readonly moneda: string;
}

export const TRANSICIONES_PRODUCTO: Readonly<
  Record<EstadoProductoVendedor, readonly EstadoProductoVendedor[]>
> = {
  BORRADOR: ["PUBLICADO"],
  PUBLICADO: ["SUSPENDIDO", "DESCONTINUADO"],
  SUSPENDIDO: ["PUBLICADO", "DESCONTINUADO"],
  DESCONTINUADO: []
};

export function esEstadoProductoVendedor(
  value: string
): value is EstadoProductoVendedor {
  return (ESTADOS_PRODUCTO_VENDEDOR as readonly string[]).includes(value);
}

export function esTipoEntregaVendedor(
  value: string
): value is TipoEntregaVendedor {
  return (TIPOS_ENTREGA_VENDEDOR as readonly string[]).includes(value);
}

/**
 * Normaliza y valida los datos comerciales aprobados. No agrega atributos que
 * el SDD no defina (por ejemplo, dimensiones, marca o variantes).
 */
export function normalizarDatosProducto(input: DatosProducto): DatosProducto {
  const nombre = textoObligatorio(input.nombre, "El nombre del producto");
  const descripcion = textoObligatorio(
    input.descripcion,
    "La descripción del producto"
  );
  const sku = textoObligatorio(input.sku, "El SKU");

  if (!(CATEGORIAS_PRODUCTO as readonly string[]).includes(input.categoria)) {
    throw new ValidationError("La categoría del producto no es válida.");
  }
  if (
    !(TIPOS_ENTREGA_VENDEDOR as readonly string[]).includes(input.tipoEntrega)
  ) {
    throw new ValidationError("El tipo de entrega no es válido.");
  }
  if (!Number.isInteger(input.precioCentavos) || input.precioCentavos <= 0) {
    throw new ValidationError(
      "El precio debe ser un entero positivo en centavos."
    );
  }

  const moneda = String(input.moneda ?? "")
    .trim()
    .toUpperCase();
  if (!/^[A-Z]{3}$/.test(moneda)) {
    throw new ValidationError("La moneda debe tener tres letras mayúsculas.");
  }

  return {
    nombre,
    descripcion,
    categoria: input.categoria,
    tipoEntrega: input.tipoEntrega,
    sku,
    precioCentavos: input.precioCentavos,
    moneda
  };
}

export function normalizarImagen(input: {
  readonly url: string;
  readonly alt?: string | undefined;
}): { readonly url: string; readonly alt: string } {
  return {
    url: textoObligatorio(input.url, "La URL de la imagen"),
    alt: typeof input.alt === "string" ? input.alt.trim() : ""
  };
}

export function assertTransicionPermitida(
  actual: EstadoProductoVendedor,
  siguiente: EstadoProductoVendedor
): void {
  if (!TRANSICIONES_PRODUCTO[actual].includes(siguiente)) {
    throw new BusinessRuleError(
      `No se puede pasar un producto de ${actual} a ${siguiente}.`,
      {
        motivo: "TRANSICION_INVALIDA",
        estadoActual: actual,
        estadoSolicitado: siguiente
      }
    );
  }
}

/**
 * Política de publicación (`CAT-03`, `CAT-05`, `PUB-02`, `PUB-03`, `PUB-05`).
 *
 * En V1 no existen variantes: el propio producto es la unidad vendible, por lo
 * que la comprobación de variante activa del SDD se sustituye por los datos
 * comerciales del producto. El stock no es requisito para publicar.
 */
export function evaluarPublicacion(
  producto: ProductoVendedor,
  vendedorActivo: boolean
): void {
  if (!vendedorActivo) {
    throw new BusinessRuleError(
      "Un vendedor inactivo no puede publicar productos.",
      { motivo: "VENDEDOR_NO_ACTIVO" }
    );
  }
  if (producto.estado === "DESCONTINUADO") {
    throw new BusinessRuleError(
      "Un producto descontinuado no vuelve a publicarse; crea una oferta nueva.",
      { motivo: "PRODUCTO_DESCONTINUADO" }
    );
  }

  assertTransicionPermitida(producto.estado, "PUBLICADO");

  const faltantes: string[] = [];
  if (producto.nombre.trim().length === 0) {
    faltantes.push("nombre");
  }
  if (producto.descripcion.trim().length === 0) {
    faltantes.push("descripcion");
  }
  if (
    !(CATEGORIAS_PRODUCTO as readonly string[]).includes(producto.categoria)
  ) {
    faltantes.push("categoria");
  }
  if (
    !(TIPOS_ENTREGA_VENDEDOR as readonly string[]).includes(
      producto.tipoEntrega
    )
  ) {
    faltantes.push("tipoEntrega");
  }
  if (producto.sku.trim().length === 0) {
    faltantes.push("sku");
  }
  if (
    !Number.isInteger(producto.precioCentavos) ||
    producto.precioCentavos <= 0
  ) {
    faltantes.push("precio");
  }
  if (!/^[A-Z]{3}$/.test(producto.moneda)) {
    faltantes.push("moneda");
  }
  if (producto.imagenes.length === 0) {
    faltantes.push("imagenes");
  }

  if (faltantes.length > 0) {
    throw new BusinessRuleError(
      "El producto no cumple las condiciones para publicarse.",
      { motivo: "PRODUCTO_NO_PUBLICABLE", campos: faltantes }
    );
  }
}

export function assertProductoEditable(estado: EstadoProductoVendedor): void {
  if (estado === "DESCONTINUADO") {
    throw new BusinessRuleError(
      "Un producto descontinuado no admite nuevas ediciones.",
      { motivo: "PRODUCTO_DESCONTINUADO" }
    );
  }
}

export function textoObligatorio(value: string, label: string): string {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (normalized.length === 0) {
    throw new ValidationError(`${label} es obligatorio.`);
  }
  return normalized;
}
