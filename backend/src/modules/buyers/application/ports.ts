import type { PerfilComprador } from "../domain/perfil-comprador.js";
import type { Carrito } from "../../cart/domain/carrito.js";
import type { Usuario } from "../../identity/domain/usuario.js";
import type { RegistroAuditoria, EventoDominio } from "../../../shared/domain/audit.js";
import type { CorreoElectronico, DocumentoIdentidad } from "../../../shared/domain/value-objects.js";

/**
 * Frontera transaccional del primer vertical.
 *
 * Compone las operaciones de PO-01 (Usuario), PO-02 (PerfilComprador),
 * PO-07 (Carrito), PO-14 (auditoría append-only) y PO-23 (outbox) para que
 * PI-01 no pueda confirmar una cuenta parcial. Los puertos canónicos siguen
 * siendo la referencia para extraer repositorios separados cuando existan más
 * casos de uso que los reutilicen.
 */
export interface BuyerRegistrationStore {
  existsByEmail(email: CorreoElectronico): Promise<boolean>;
  existsByDocument(documento: DocumentoIdentidad): Promise<boolean>;
  saveRegistration(record: BuyerRegistrationRecord): Promise<void>;
  healthCheck(): Promise<void>;
  close(): Promise<void>;
}

export interface BuyerRegistrationRecord {
  readonly usuario: Usuario;
  readonly comprador: PerfilComprador;
  readonly carrito: Carrito;
  readonly auditoria: RegistroAuditoria;
  readonly evento: EventoDominio;
}
