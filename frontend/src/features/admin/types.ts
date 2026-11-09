import type { RolSistema, EstadoUsuario } from "@/features/auth/types";
import type { CategoriaProducto, TipoEntrega } from "@/features/catalog/types";
import type { EstadoPago, EstadoPedido } from "@/features/orders/types";
import type {
  EstadoProductoVendedor,
  EstadoVendedor
} from "@/features/seller/types";

export type { EstadoPago, EstadoPedido } from "@/features/orders/types";
export type { CategoriaProducto, TipoEntrega } from "@/features/catalog/types";
export type {
  EstadoProductoVendedor,
  EstadoVendedor
} from "@/features/seller/types";
export type { EstadoUsuario, RolSistema } from "@/features/auth/types";

export type EstadoComprador = "HABILITADO" | "RESTRINGIDO";
export type EstadoOperador = "ACTIVO" | "INACTIVO";
export type EstadoBodega = "ACTIVA" | "INACTIVA";
export type TipoBodega = "MARKETPLACE" | "VENDEDOR";
export type EstadoEnvio =
  | "PREPARACION"
  | "EMPACADO"
  | "DESPACHADO"
  | "EN_TRANSITO"
  | "ENTREGADO"
  | "FALLIDO"
  | "DEVUELTO";
export type EstadoReserva = "ACTIVA" | "LIBERADA" | "CONSUMIDA";

export interface AdminPage<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

export interface AdminInventoryTotals {
  readonly posiciones: number;
  readonly onHand: number;
  readonly reserved: number;
  readonly unavailable: number;
  readonly disponible: number;
}

export interface AdminUserSummary {
  readonly id: string;
  readonly nombreCompleto: string;
  readonly correoElectronico: string;
  readonly rol: RolSistema;
  readonly estado: EstadoUsuario;
  readonly creadoEn: string;
  readonly actualizadoEn: string;
  readonly perfilId: string | null;
}

export type AdminUserProfile =
  | {
      readonly tipo: "COMPRADOR";
      readonly id: string;
      readonly estadoComercial: EstadoComprador;
      readonly creadoEn: string;
      readonly pedidosCount: number;
    }
  | {
      readonly tipo: "VENDEDOR";
      readonly id: string;
      readonly nombreComercial: string;
      readonly estado: EstadoVendedor;
      readonly creadoEn: string;
      readonly bodegasCount: number;
      readonly productosCount: number;
    }
  | {
      readonly tipo: "OPERADOR_LOGISTICO";
      readonly id: string;
      readonly nombreOperador: string;
      readonly estado: EstadoOperador;
      readonly creadoEn: string;
      readonly bodegasCount: number;
    };

export interface AdminUserDetail extends AdminUserSummary {
  readonly perfil: AdminUserProfile | null;
}

export interface AdminBuyerSummary {
  readonly id: string;
  readonly usuarioId: string;
  readonly nombreCompleto: string;
  readonly correoElectronico: string;
  readonly estadoComercial: EstadoComprador;
  readonly usuarioEstado: EstadoUsuario;
  readonly creadoEn: string;
  readonly pedidosCount: number;
}

export interface AdminBuyerOrder {
  readonly id: string;
  readonly numero: string;
  readonly estado: EstadoPedido;
  readonly estadoPago: EstadoPago;
  readonly moneda: string;
  readonly totalCentavos: number;
  readonly vendedorNombre: string;
  readonly creadoEn: string;
}

export interface AdminBuyerDetail extends AdminBuyerSummary {
  readonly pedidos: readonly AdminBuyerOrder[];
}

export interface AdminSellerSummary {
  readonly id: string;
  readonly usuarioId: string;
  readonly nombreComercial: string;
  readonly correoElectronico: string;
  readonly usuarioEstado: EstadoUsuario;
  readonly estado: EstadoVendedor;
  readonly creadoEn: string;
  readonly productosCount: number;
  readonly productosPublicadosCount: number;
  readonly bodegasCount: number;
  readonly inventarioDisponible: number;
}

export interface AdminWarehouse {
  readonly id: string;
  readonly nombre: string;
  readonly ubicacion: string;
  readonly tipo: TipoBodega;
  readonly estado: EstadoBodega;
  readonly vendedorId: string | null;
  readonly vendedorNombre: string | null;
  readonly vendedorCorreo: string | null;
  readonly creadaEn: string;
  readonly productosCount: number;
  readonly inventarioDisponible: number;
}

export interface AdminSellerDetail extends AdminSellerSummary {
  readonly bodegas: readonly AdminWarehouse[];
  readonly productos: readonly AdminProductSummary[];
  readonly inventario: AdminInventoryTotals;
  readonly pedidosCount: number;
}

export interface AdminWarehouseInventory {
  readonly productoId: string;
  readonly productoNombre: string;
  readonly sku: string;
  readonly onHand: number;
  readonly reserved: number;
  readonly unavailable: number;
  readonly disponible: number;
  readonly actualizadoEn: string;
}

export interface AdminWarehouseOperator {
  readonly id: string;
  readonly nombreOperador: string;
  readonly estado: EstadoOperador;
  readonly asignadaEn: string;
}

export interface AdminMovement {
  readonly id: string;
  readonly productoId: string;
  readonly productoNombre: string;
  readonly sku: string;
  readonly bodegaId: string;
  readonly bodegaNombre: string;
  readonly vendedorId: string;
  readonly vendedorNombre: string;
  readonly tipo: string;
  readonly cantidad: number;
  readonly referenciaTipo: string;
  readonly referenciaId: string;
  readonly motivo: string | null;
  readonly ocurridoEn: string;
}

export interface AdminWarehouseDetail extends AdminWarehouse {
  readonly inventario: readonly AdminWarehouseInventory[];
  readonly movimientos: readonly AdminMovement[];
  readonly operadores: readonly AdminWarehouseOperator[];
}

export interface AdminProductImage {
  readonly id: string;
  readonly url: string;
  readonly alt: string;
  readonly orden: number;
}

export interface AdminProductInventory {
  readonly bodegaId: string;
  readonly bodegaNombre: string;
  readonly onHand: number;
  readonly reserved: number;
  readonly unavailable: number;
  readonly disponible: number;
  readonly actualizadoEn: string;
}

export interface AdminProductSummary {
  readonly id: string;
  readonly vendedorId: string;
  readonly vendedorNombre: string;
  readonly nombre: string;
  readonly sku: string;
  readonly categoria: CategoriaProducto;
  readonly estado: EstadoProductoVendedor;
  readonly tipoEntrega: TipoEntrega;
  readonly precioCentavos: number;
  readonly moneda: string;
  readonly imagenPrincipal: string | null;
  readonly imagenesCount: number;
  readonly inventarioDisponible: number | null;
  readonly creadoEn: string;
  readonly actualizadoEn: string;
}

export interface AdminProductDetail extends AdminProductSummary {
  readonly descripcion: string;
  readonly imagenes: readonly AdminProductImage[];
  readonly inventario: readonly AdminProductInventory[];
}

export interface AdminInventoryPosition {
  readonly productoId: string;
  readonly productoNombre: string;
  readonly sku: string;
  readonly vendedorId: string | null;
  readonly vendedorNombre: string | null;
  readonly bodegaId: string;
  readonly bodegaNombre: string;
  readonly onHand: number;
  readonly reserved: number;
  readonly unavailable: number;
  readonly disponible: number;
  readonly actualizadoEn: string;
}

export interface AdminOrderSummary {
  readonly id: string;
  readonly numero: string;
  readonly estado: EstadoPedido;
  readonly estadoPago: EstadoPago;
  readonly moneda: string;
  readonly totalCentavos: number;
  readonly itemsCount: number;
  readonly compradorId: string;
  readonly compradorNombre: string;
  readonly vendedorId: string;
  readonly vendedorNombre: string;
  readonly creadoEn: string;
  readonly actualizadoEn: string;
}

export interface AdminOrderItem {
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

export interface AdminPaymentView {
  readonly estado: EstadoPago;
  readonly proveedor: string;
  readonly montoCentavos: number;
  readonly moneda: string;
  readonly creadoEn: string;
  readonly actualizadoEn: string;
}

export interface AdminReservation {
  readonly id: string;
  readonly productoId: string;
  readonly productoNombre: string;
  readonly sku: string;
  readonly bodegaId: string;
  readonly bodegaNombre: string;
  readonly cantidad: number;
  readonly estado: EstadoReserva;
  readonly creadaEn: string;
}

export interface AdminShipmentItem {
  readonly productoId: string;
  readonly nombreProducto: string;
  readonly sku: string;
  readonly cantidad: number;
}

export interface AdminEvidence {
  readonly tipo: string;
  readonly referencia: string;
  readonly nota: string | null;
  readonly registradaEn: string;
}

export interface AdminShipment {
  readonly id: string;
  readonly pedidoId: string;
  readonly bodegaOrigenId: string;
  readonly bodegaNombre: string;
  readonly transportista: string | null;
  readonly trackingNumber: string | null;
  readonly estado: EstadoEnvio;
  readonly creadoEn: string;
  readonly despachadoEn: string | null;
  readonly entregadoEn: string | null;
  readonly items: readonly AdminShipmentItem[];
  readonly evidencia: AdminEvidence | null;
}

export interface AdminHistoryEntry {
  readonly estadoPrevio: EstadoPedido | null;
  readonly estadoNuevo: EstadoPedido;
  readonly actorRol: string | null;
  readonly ocurridoEn: string;
  readonly referenciaTipo: string;
  readonly referenciaId: string;
  readonly correlationId: string;
}

export interface AdminDelivery {
  readonly ciudad: string;
  readonly region: string;
  readonly pais: string;
  readonly capturadaEn: string;
}

export interface AdminOrderDetail extends AdminOrderSummary {
  readonly items: readonly AdminOrderItem[];
  readonly pago: AdminPaymentView | null;
  readonly reservas: readonly AdminReservation[];
  readonly envios: readonly AdminShipment[];
  readonly historial: readonly AdminHistoryEntry[];
  readonly entrega: AdminDelivery | null;
}

export interface AdminPaymentSummary {
  readonly id: string;
  readonly pedidoId: string;
  readonly pedidoNumero: string;
  readonly compradorId: string;
  readonly compradorNombre: string;
  readonly vendedorNombre: string;
  readonly estado: EstadoPago;
  readonly proveedor: string;
  readonly montoCentavos: number;
  readonly moneda: string;
  readonly creadoEn: string;
  readonly actualizadoEn: string;
}

export interface AdminUsersReport {
  readonly total: number;
  readonly porRol: Readonly<Record<RolSistema, number>>;
  readonly porEstado: Readonly<Record<EstadoUsuario, number>>;
}

export interface AdminCountReport<E extends string> {
  readonly total: number;
  readonly porEstado: Readonly<Record<E, number>>;
}

export interface AdminReports {
  readonly usuarios: AdminUsersReport;
  readonly compradores: AdminCountReport<EstadoComprador>;
  readonly vendedores: AdminCountReport<EstadoVendedor>;
  readonly operadoresLogisticos: AdminCountReport<EstadoOperador>;
  readonly bodegas: {
    readonly total: number;
    readonly porEstado: Readonly<Record<EstadoBodega, number>>;
    readonly porTipo: Readonly<Record<TipoBodega, number>>;
  };
  readonly catalogo: {
    readonly total: number;
    readonly porEstado: Readonly<Record<EstadoProductoVendedor, number>>;
    readonly porCategoria: Readonly<Record<CategoriaProducto, number>>;
    readonly porTipoEntrega: Readonly<Record<TipoEntrega, number>>;
  };
  readonly inventario: AdminInventoryTotals;
  readonly pedidos: AdminCountReport<EstadoPedido>;
  readonly pagos: AdminCountReport<EstadoPago>;
  readonly envios: AdminCountReport<EstadoEnvio>;
}

export interface AdminDashboard extends AdminReports {
  readonly recientes: {
    readonly usuarios: readonly AdminUserSummary[];
    readonly compradores: readonly AdminBuyerSummary[];
    readonly vendedores: readonly AdminSellerSummary[];
    readonly pedidos: readonly AdminOrderSummary[];
  };
}

export interface AdminEnvelope<T> {
  readonly data: T;
}

export type AdminUserPage = AdminPage<AdminUserSummary>;
export type AdminBuyerPage = AdminPage<AdminBuyerSummary>;
export type AdminSellerPage = AdminPage<AdminSellerSummary>;
export type AdminWarehousePage = AdminPage<AdminWarehouse>;
export type AdminProductPage = AdminPage<AdminProductSummary>;
export type AdminInventoryPage = AdminPage<AdminInventoryPosition>;
export type AdminMovementPage = AdminPage<AdminMovement>;
export type AdminOrderPage = AdminPage<AdminOrderSummary>;
export type AdminPaymentPage = AdminPage<AdminPaymentSummary>;
