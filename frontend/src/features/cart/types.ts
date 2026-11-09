import type { CategoriaProducto, TipoEntrega } from "@/features/catalog/types";

export type MotivoNoVendible =
  | "PRODUCTO_NO_PUBLICADO"
  | "VENDEDOR_NO_ACTIVO"
  | "STOCK_INSUFICIENTE";

export interface CartItem {
  readonly productoId: string;
  readonly nombre: string;
  readonly sku: string;
  readonly categoria: CategoriaProducto;
  readonly tipoEntrega: TipoEntrega;
  readonly precioCentavos: number;
  readonly moneda: string;
  readonly estadoProducto: "PUBLICADO" | "SUSPENDIDO" | "DESCONTINUADO";
  readonly vendedorId: string;
  readonly vendedorNombre: string;
  readonly estadoVendedor: "EN_REVISION" | "ACTIVO" | "SUSPENDIDO" | "INACTIVO";
  readonly disponible: number | null;
  readonly cantidad: number;
  readonly precioReferencialCentavos: number;
  readonly monedaReferencial: string;
  readonly subtotalCentavos: number;
  readonly vendible: boolean;
  readonly motivoNoVendible: MotivoNoVendible | null;
}

export interface Cart {
  readonly carritoId: string;
  readonly compradorId: string;
  readonly items: readonly CartItem[];
  readonly totalCentavos: number;
  readonly moneda: string | null;
  readonly actualizadoEn: string;
  readonly version: number;
  readonly requiereConfirmacionPrecio: boolean;
}

export interface CartEnvelope {
  readonly data: Cart;
}
