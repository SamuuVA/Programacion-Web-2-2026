import type {
  EstadoPedido,
  EstadoPago
} from "../../orders/application/ports.js";
import type {
  DatosProducto,
  EstadoProductoVendedor,
  ImagenProductoVendedor,
  ProductoVendedor,
  TipoEntregaVendedor
} from "../domain/producto-vendedor.js";

/** Identidad resuelta por la sesión. El cliente nunca la envía. */
export interface SellerActor {
  readonly usuarioId: string;
  readonly sellerId: string;
}

export type EstadoVendedor =
  "EN_REVISION" | "ACTIVO" | "SUSPENDIDO" | "INACTIVO";

export interface SellerProfileView {
  readonly id: string;
  readonly usuarioId: string;
  readonly nombreComercial: string;
  readonly estado: EstadoVendedor;
  readonly creadoEn: string;
  readonly nombreCompleto: string;
  readonly correoElectronico: string;
}

export interface SellerProductInventoryView {
  readonly onHand: number;
  readonly reserved: number;
  readonly unavailable: number;
  readonly disponible: number;
}

export interface SellerProductView extends ProductoVendedor {
  /**
   * Agregado de las posiciones del producto en las bodegas del vendedor.
   * `null` para productos digitales, que no usan inventario físico.
   */
  readonly inventario: SellerProductInventoryView | null;
}

export interface SellerWarehouseView {
  readonly id: string;
  readonly vendedorId: string;
  readonly nombre: string;
  readonly ubicacion: string;
  readonly estado: "ACTIVA" | "INACTIVA";
  readonly creadaEn: string;
}

export interface SellerInventoryView {
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

export interface SellerOrderItemView {
  readonly id: string;
  readonly productoId: string;
  readonly nombreProducto: string;
  readonly sku: string;
  readonly tipoEntrega: TipoEntregaVendedor;
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
  readonly items: readonly SellerOrderItemView[];
}

export interface CreateProductRecord {
  readonly id: string;
  readonly vendedorId: string;
  readonly datos: DatosProducto;
  readonly imagenes: readonly ImagenProductoVendedor[];
  readonly creadoEn: string;
}

export interface CreateWarehouseRecord {
  readonly id: string;
  readonly vendedorId: string;
  readonly nombre: string;
  readonly ubicacion: string;
  readonly creadaEn: string;
}

export interface WarehouseChanges {
  readonly nombre?: string | undefined;
  readonly ubicacion?: string | undefined;
}

/** Cambios parciales de producto compatibles con `exactOptionalPropertyTypes`. */
export type ProductChanges = {
  readonly [K in keyof DatosProducto]?: DatosProducto[K] | undefined;
};

export interface AddImageRecord {
  readonly id: string;
  readonly vendedorId: string;
  readonly productoId: string;
  readonly url: string;
  readonly alt: string;
  readonly creadoEn: string;
}

export interface IngressCommand {
  readonly vendedorId: string;
  readonly actorId: string;
  readonly productoId: string;
  readonly bodegaId: string;
  readonly cantidad: number;
  readonly idempotencyKey: string;
  readonly motivo: string | null;
  readonly movimientoId: string;
  readonly inventarioId: string;
  readonly now: string;
}

export interface IngressResult {
  readonly movimientoId: string;
  readonly duplicado: boolean;
  readonly posicion: SellerInventoryView;
}

/**
 * Puerto de persistencia del espacio del vendedor.
 *
 * Toda operación recibe el `sellerId` resuelto de la sesión y lo aplica como
 * filtro obligatorio. Un recurso de otro vendedor se comporta como inexistente
 * (`null`), nunca como prohibido: no se filtra la existencia de identificadores.
 */
export interface SellerWorkspaceStore {
  findProfile(sellerId: string): Promise<SellerProfileView | null>;
  updateProfile(
    sellerId: string,
    nombreComercial: string,
    now: string
  ): Promise<SellerProfileView | null>;

  listProducts(sellerId: string): Promise<SellerProductView[]>;
  findProduct(
    sellerId: string,
    productoId: string
  ): Promise<SellerProductView | null>;
  createProduct(record: CreateProductRecord): Promise<SellerProductView>;
  updateProduct(
    sellerId: string,
    productoId: string,
    datos: DatosProducto,
    now: string
  ): Promise<SellerProductView | null>;
  updateProductState(
    sellerId: string,
    productoId: string,
    expected: EstadoProductoVendedor,
    next: EstadoProductoVendedor,
    now: string
  ): Promise<SellerProductView | null>;
  addProductImage(record: AddImageRecord): Promise<SellerProductView | null>;
  removeProductImage(
    sellerId: string,
    productoId: string,
    imageId: string
  ): Promise<SellerProductView | null>;

  listWarehouses(sellerId: string): Promise<SellerWarehouseView[]>;
  createWarehouse(record: CreateWarehouseRecord): Promise<SellerWarehouseView>;
  updateWarehouse(
    sellerId: string,
    warehouseId: string,
    changes: WarehouseChanges
  ): Promise<SellerWarehouseView | null>;

  listInventory(sellerId: string): Promise<SellerInventoryView[]>;
  registerIngress(command: IngressCommand): Promise<IngressResult>;

  listOrders(sellerId: string): Promise<SellerOrderSummary[]>;
  findOrder(
    sellerId: string,
    orderId: string
  ): Promise<SellerOrderDetail | null>;

  healthCheck(): Promise<void>;
  close(): Promise<void>;
}
