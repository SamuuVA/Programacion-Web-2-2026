import { UniquenessConflictError } from "../../src/shared/domain/errors.js";
import type { RegistroAuditoria, EventoDominio } from "../../src/shared/domain/audit.js";
import type {
  CorreoElectronico,
  DocumentoIdentidad
} from "../../src/shared/domain/value-objects.js";
import type {
  BuyerRegistrationRecord,
  BuyerRegistrationStore
} from "../../src/modules/buyers/application/ports.js";
import type { Usuario } from "../../src/modules/identity/domain/usuario.js";
import type { PerfilComprador } from "../../src/modules/buyers/domain/perfil-comprador.js";
import type { Carrito } from "../../src/modules/cart/domain/carrito.js";

/**
 * Doble de prueba exclusivo de la suite automatizada.
 *
 * No se importa desde `src/` ni se registra en el composition root: la
 * aplicación en ejecución usa siempre PostgreSQL. Su única finalidad es
 * aislar casos de uso y contratos HTTP sin levantar una base de datos.
 */
export class FakeBuyerRegistrationStore implements BuyerRegistrationStore {
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
    // El doble está disponible mientras viva el proceso de prueba.
  }

  async close(): Promise<void> {
    this.users.clear();
    this.buyers.clear();
    this.carts.clear();
    this.audit.length = 0;
    this.events.length = 0;
  }

  // Introspección exclusiva para aserciones de la suite.
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
