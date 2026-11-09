import type { CategoriaProducto, TipoEntrega } from "../../catalog/domain/producto.js";

export interface SellableProduct {
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
}

export type MotivoNoVendible =
  | "PRODUCTO_NO_PUBLICADO"
  | "VENDEDOR_NO_ACTIVO"
  | "STOCK_INSUFICIENTE";

export interface CartLineView extends SellableProduct {
  readonly cantidad: number;
  readonly precioReferencialCentavos: number;
  readonly monedaReferencial: string;
  readonly subtotalCentavos: number;
  readonly vendible: boolean;
  readonly motivoNoVendible: MotivoNoVendible | null;
}

export interface CartView {
  readonly carritoId: string;
  readonly compradorId: string;
  readonly items: readonly CartLineView[];
  readonly totalCentavos: number;
  readonly moneda: string | null;
  readonly actualizadoEn: string;
  readonly version: number;
  readonly requiereConfirmacionPrecio: boolean;
}

export interface CartItemState {
  readonly cantidad: number;
  readonly precioReferencialCentavos: number;
  readonly monedaReferencial: string;
}

export interface CartStore {
  getCart(compradorId: string): Promise<CartView>;
  findProduct(productoId: string): Promise<SellableProduct | null>;
  getItem(compradorId: string, productoId: string): Promise<CartItemState | null>;
  upsertItem(input: {
    compradorId: string;
    productoId: string;
    cantidad: number;
    precioCentavos: number;
    moneda: string;
    now: string;
  }): Promise<void>;
  removeItem(compradorId: string, productoId: string, now: string): Promise<boolean>;
  close(): Promise<void>;
}
