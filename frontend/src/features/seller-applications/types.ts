import type { EstadoUsuario, RolSistema } from "@/features/auth/types";

export type EstadoSolicitudVendedor = "PENDIENTE" | "APROBADA" | "RECHAZADA";

export type AccionEstadoUsuario =
  | "ACTIVAR"
  | "DESACTIVAR"
  | "BLOQUEAR"
  | "DESBLOQUEAR";

export interface SellerApplicationSummary {
  readonly id: string;
  readonly usuarioId: string;
  readonly nombreCompleto: string;
  readonly correoElectronico: string;
  readonly nombreComercial: string;
  readonly nombreBodega: string;
  readonly estado: EstadoSolicitudVendedor;
  readonly creadaEn: string;
  readonly actualizadaEn: string;
}

export interface SellerApplicationDetail extends SellerApplicationSummary {
  readonly ubicacionBodega: string;
  readonly motivoRechazo: string | null;
  readonly revisadoPor: string | null;
  readonly revisadoEn: string | null;
  readonly sellerId: string | null;
  readonly warehouseId: string | null;
  readonly usuarioRol: RolSistema;
  readonly usuarioEstado: EstadoUsuario;
}

export interface SellerApplicationPage {
  readonly items: readonly SellerApplicationSummary[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

export interface SellerApplicationEnvelope {
  readonly data: SellerApplicationDetail;
}

export interface SellerApplicationOwnEnvelope {
  readonly data: {
    readonly solicitud: SellerApplicationDetail | null;
  };
}

export interface SellerApplicationPageEnvelope {
  readonly data: SellerApplicationPage;
}

export interface ApproveSellerApplicationResult {
  readonly solicitud: SellerApplicationDetail;
  readonly sellerId: string;
  readonly warehouseId: string;
  readonly yaAprobada: boolean;
}

export interface ApproveSellerApplicationEnvelope {
  readonly data: ApproveSellerApplicationResult;
}

export interface UserAccessTransitionResult {
  readonly usuarioId: string;
  readonly estadoAnterior: EstadoUsuario;
  readonly estadoNuevo: EstadoUsuario;
  readonly actualizadoEn: string;
  readonly sesionesRevocadas: number;
}

export interface UserAccessTransitionEnvelope {
  readonly data: UserAccessTransitionResult;
}
