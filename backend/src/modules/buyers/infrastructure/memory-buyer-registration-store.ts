import { UniquenessConflictError } from "../../../shared/domain/errors.js";
import type { RegistroAuditoria, EventoDominio } from "../../../shared/domain/audit.js";
import type { CorreoElectronico, DocumentoIdentidad } from "../../../shared/domain/value-objects.js";
import type { BuyerRegistrationRecord, BuyerRegistrationStore } from "../application/ports.js";
import type { Usuario } from "../../identity/domain/usuario.js";
import type { PerfilComprador } from "../domain/perfil-comprador.js";
import type { Carrito } from "../../cart/domain/carrito.js";

/**
 * Adaptador efímero para desarrollo local y pruebas.
 * No es una fuente de verdad de producción; el adaptador PostgreSQL es el
 * mecanismo persistente seleccionado para el primer vertical.
 */
export class MemoryBuyerRegistrationStore implements BuyerRegistrationStore {
  private readonly users = new Map<string, Usuario>();
  private readonly buyers = new Map<string, PerfilComprador>();
  private readonly carts = new Map<string, Carrito>();
  private readonly audit: RegistroAuditoria[] = [];
  private readonly events: EventoDominio[] = [];

  async existsByEmail(email: CorreoElectronico): Promise<boolean> {
    return this.findUserByEmail(email.value) !== undefined;
  }

  async existsByDocument(documento: DocumentoIdentidad): Promise<boolean> {
    return this.findUserByDocument(documento) !== undefined;
  }

  async saveRegistration(record: BuyerRegistrationRecord): Promise<void> {
    // Las comprobaciones y las escrituras son síncronas entre sí: una petición
    // concurrente no puede intercalarse dentro de esta sección en Node.js.
    if (this.findUserByEmail(record.usuario.correoElectronico.value)) {
      throw new UniquenessConflictError("El correo electrónico ya está registrado.");
    }
    if (this.findUserByDocument(record.usuario.documentoIdentidad)) {
      throw new UniquenessConflictError("El documento de identidad ya está registrado.");
    }
    if (this.buyers.has(record.comprador.id) || this.carts.has(record.carrito.id)) {
      throw new UniquenessConflictError("El identificador del registro ya existe.");
    }

    this.users.set(record.usuario.id, record.usuario);
    this.buyers.set(record.comprador.id, record.comprador);
    this.carts.set(record.carrito.id, record.carrito);
    this.audit.push(record.auditoria);
    this.events.push(record.evento);
  }

  async healthCheck(): Promise<void> {
    // El adaptador en memoria siempre está disponible mientras el proceso viva.
  }

  async close(): Promise<void> {
    this.users.clear();
    this.buyers.clear();
    this.carts.clear();
    this.audit.length = 0;
    this.events.length = 0;
  }

  // Introspección exclusiva para pruebas y para el adaptador de demostración.
  getUserByEmail(email: string): Usuario | undefined {
    return this.findUserByEmail(email.trim().toLowerCase());
  }

  getUserById(id: string): Usuario | undefined {
    return this.users.get(id);
  }

  getBuyerByUserId(usuarioId: string): PerfilComprador | undefined {
    return [...this.buyers.values()].find((buyer) => buyer.usuarioId === usuarioId);
  }

  getCartByBuyerId(compradorId: string): Carrito | undefined {
    return [...this.carts.values()].find((cart) => cart.compradorId === compradorId);
  }

  getAuditRecords(): readonly RegistroAuditoria[] {
    return [...this.audit];
  }

  getOutboxEvents(): readonly EventoDominio[] {
    return [...this.events];
  }

  private findUserByEmail(email: string): Usuario | undefined {
    return [...this.users.values()].find(
      (user) => user.correoElectronico.value === email
    );
  }

  private findUserByDocument(documento: DocumentoIdentidad): Usuario | undefined {
    return [...this.users.values()].find((user) =>
      user.documentoIdentidad.equals(documento)
    );
  }
}
