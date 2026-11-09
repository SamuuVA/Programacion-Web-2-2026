import type { CategoriaProducto, TipoEntrega } from "@/features/catalog/types";
import type { EstadoPago, EstadoPedido } from "@/features/orders/types";

export type EstadoProductoVendedor =
  | "BORRADOR"
  | "PUBLICADO"
  | "SUSPENDIDO"
  | "DESCONTINUADO";

export type EstadoVendedor =
  | "EN_REVISION"
  | "ACTIVO"
  | "SUSPENDIDO"
  | "INACTIVO";

export interface SellerProfile {
  readonly id: string;
  readonly usuarioId: string;
  readonly nombreComercial: string;
  readonly estado: EstadoVendedor;
  readonly creadoEn: string;
  readonly nombreCompleto: string;
  readonly correoElectronico: string;
}

export interface SellerImage {
  readonly id: string;
  readonly url: string;
  readonly alt: string;
  readonly orden: number;
}

export interface SellerProductInventory {
  readonly onHand: number;
  readonly reserved: number;
  readonly unavailable: number;
  readonly disponible: number;
}

export interface SellerProduct {
  readonly id: string;
  readonly vendedorId: string;
  readonly nombre: string;
  readonly descripcion: string;
  readonly categoria: CategoriaProducto;
  readonly tipoEntrega: TipoEntrega;
  readonly sku: string;
  readonly precioCentavos: number;
  readonly moneda: string;
  readonly estado: EstadoProductoVendedor;
  readonly creadoEn: string;
  readonly actualizadoEn: string;
  readonly imagenes: readonly SellerImage[];
  readonly inventario: SellerProductInventory | null;
}

export interface SellerWarehouse {
  readonly id: string;
  readonly vendedorId: string;
  readonly nombre: string;
  readonly ubicacion: string;
  readonly estado: "ACTIVA" | "INACTIVA";
  readonly creadaEn: string;
}

export interface SellerInventoryPosition {
  readonly productoId: string;
  readonly productoNombre: string;
  readonly sku: string;
  readonly bodegaId: string;
  readonly bodegaNombre: string;
  readonly onHand: number;
  readonly reserved: number;
  readonly unavailable: number;
  readonly disponible: number;
  readonly actualizadoEn: string;
}

export interface SellerIngressResult {
  readonly movimientoId: string;
  readonly duplicado: boolean;
  readonly posicion: SellerInventoryPosition;
}

export interface SellerOrderItem {
  readonly id: string;
  readonly productoId: string;
  readonly nombreProducto: string;
  readonly sku: string;
  readonly tipoEntrega: TipoEntrega;
  readonly cantidad: number;
  readonly precioUnitarioCentavos: number;
  readonly moneda: string;
  readonly subtotalCentavos: number;
}

export interface SellerOrderSummary {
  readonly id: string;
  readonly numero: string;
  readonly estado: EstadoPedido;
  readonly estadoPago: EstadoPago;
  readonly moneda: string;
  readonly totalCentavos: number;
  readonly itemsCount: number;
  readonly creadoEn: string;
}

export interface SellerOrderDetail extends SellerOrderSummary {
  readonly items: readonly SellerOrderItem[];
}

export interface SellerProfileEnvelope {
  readonly data: SellerProfile;
}

export interface SellerProductEnvelope {
  readonly data: SellerProduct;
}

export interface SellerProductListEnvelope {
  readonly data: readonly SellerProduct[];
}

export interface SellerWarehouseEnvelope {
  readonly data: SellerWarehouse;
}

export interface SellerWarehouseListEnvelope {
  readonly data: readonly SellerWarehouse[];
}

export interface SellerInventoryListEnvelope {
  readonly data: readonly SellerInventoryPosition[];
}

export interface SellerIngressEnvelope {
  readonly data: SellerIngressResult;
}

export interface SellerOrderListEnvelope {
  readonly data: readonly SellerOrderSummary[];
}

export interface SellerOrderEnvelope {
  readonly data: SellerOrderDetail;
}
