import type { EventoDominio, RegistroAuditoria } from "../../../shared/domain/audit.js";
import type { CorreoElectronico, DocumentoIdentidad } from "../../../shared/domain/value-objects.js";
import type { Usuario } from "../../identity/domain/usuario.js";

export interface SellerProfileRecord {
  readonly id: string;
  readonly usuarioId: string;
  readonly nombreComercial: string;
  readonly estado: "ACTIVO";
  readonly creadoEn: string;
}

export interface WarehouseRecord {
  readonly id: string;
  readonly vendedorId: string;
  readonly nombre: string;
  readonly ubicacion: string;
  readonly tipo: "VENDEDOR";
  readonly estado: "ACTIVA";
  readonly creadaEn: string;
}

export interface SellerRegistrationRecord {
  readonly usuario: Usuario;
  readonly seller: SellerProfileRecord;
  readonly warehouse: WarehouseRecord;
  readonly auditoria: RegistroAuditoria;
  readonly evento: EventoDominio;
}

/**
 * Puerto transaccional de PI-02. Usuario, vendedor y primera bodega deben
 * confirmarse juntos o no confirmarse en absoluto.
 */
export interface SellerRegistrationStore {
  existsByEmail(email: CorreoElectronico): Promise<boolean>;
  existsByDocument(documento: DocumentoIdentidad): Promise<boolean>;
  saveRegistration(record: SellerRegistrationRecord): Promise<void>;
  healthCheck(): Promise<void>;
  close(): Promise<void>;
}
