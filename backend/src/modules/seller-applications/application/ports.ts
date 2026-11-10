import type {
  EventoDominio,
  RegistroAuditoria
} from "../../../shared/domain/audit.js";
import type {
  EstadoUsuario,
  RolSistema
} from "../../identity/domain/usuario.js";
import type { EstadoSolicitudVendedor } from "../domain/solicitud-vendedor.js";

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

export interface SellerApplicationFilter {
  readonly estado: EstadoSolicitudVendedor | null;
  readonly search: string | null;
  readonly page: number;
  readonly pageSize: number;
}

export interface CreateSellerApplicationRecord {
  readonly id: string;
  readonly usuarioId: string;
  readonly nombreComercial: string;
  readonly nombreBodega: string;
  readonly ubicacionBodega: string;
  readonly creadaEn: string;
  readonly actualizadaEn: string;
  readonly auditoria: RegistroAuditoria;
  readonly evento: EventoDominio;
}

export interface ApproveSellerApplicationInput {
  readonly applicationId: string;
  readonly actorId: string;
  readonly actorRol: RolSistema;
  readonly revisadoEn: string;
  readonly sellerId: string;
  readonly warehouseId: string;
  readonly auditoria: RegistroAuditoria;
  readonly evento: EventoDominio;
}

export interface ApproveSellerApplicationResult {
  readonly solicitud: SellerApplicationDetail;
  readonly sellerId: string;
  readonly warehouseId: string;
  readonly yaAprobada: boolean;
}

export interface RejectSellerApplicationInput {
  readonly applicationId: string;
  readonly actorId: string;
  readonly actorRol: RolSistema;
  readonly motivo: string;
  readonly revisadoEn: string;
  readonly auditoria: RegistroAuditoria;
  readonly evento: EventoDominio;
}

/**
 * Frontera transaccional del agregado SolicitudVendedor.
 *
 * `approve` debe crear el perfil de vendedor y su primera bodega en una sola
 * transacción PostgreSQL, conservando el mismo `users.id`. `reject` no crea
 * perfiles ni modifica el estado de acceso del usuario.
 */
export interface SellerApplicationStore {
  create(
    record: CreateSellerApplicationRecord
  ): Promise<SellerApplicationDetail>;
  findById(applicationId: string): Promise<SellerApplicationDetail | null>;
  findLatestByUserId(
    usuarioId: string
  ): Promise<SellerApplicationDetail | null>;
  findPendingByUserId(
    usuarioId: string
  ): Promise<SellerApplicationDetail | null>;
  list(filter: SellerApplicationFilter): Promise<SellerApplicationPage>;
  approve(
    input: ApproveSellerApplicationInput
  ): Promise<ApproveSellerApplicationResult>;
  reject(input: RejectSellerApplicationInput): Promise<SellerApplicationDetail>;
  healthCheck(): Promise<void>;
  close(): Promise<void>;
}
