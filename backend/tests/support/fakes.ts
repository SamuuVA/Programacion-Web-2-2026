import type { PasswordHasher } from "../../src/shared/application/ports.js";
import { DependencyUnavailableError } from "../../src/shared/domain/errors.js";
import type {
  AuthenticatedUser,
  CredentialRecord,
  IdentityStore,
  SessionRecord,
  StoredSession
} from "../../src/modules/identity/application/ports.js";
import type { RolSistema, EstadoUsuario } from "../../src/modules/identity/domain/usuario.js";
import type { DireccionEntrega } from "../../src/modules/buyers/domain/direccion-entrega.js";
import type { AddressStore } from "../../src/modules/buyers/application/address-ports.js";
import type {
  SellerProfileRecord,
  SellerRegistrationRecord,
  SellerRegistrationStore,
  WarehouseRecord
} from "../../src/modules/sellers/application/ports.js";
import type { CorreoElectronico, DocumentoIdentidad } from "../../src/shared/domain/value-objects.js";
import type { Usuario } from "../../src/modules/identity/domain/usuario.js";
import type {
  CartItemState,
  CartLineView,
  CartStore,
  CartView,
  MotivoNoVendible,
  SellableProduct
} from "../../src/modules/cart/application/ports.js";
import type {
  CheckoutCommand,
  CheckoutResult,
  CheckoutStore,
  OrderDetail,
  OrderSummary
} from "../../src/modules/orders/application/ports.js";

/**
 * Dobles de prueba de la suite. Nunca se importan desde `src/`: la aplicación
 * en ejecución usa PostgreSQL. Se usan para probar casos de uso y contratos
 * HTTP sin depender de la base de datos.
 */

export class FakePasswordHasher implements PasswordHasher {
  async hash(plainPassword: string): Promise<string> {
    return fakePasswordHash(plainPassword);
  }

  async verify(hash: string, plainPassword: string): Promise<boolean> {
    return hash === fakePasswordHash(plainPassword);
  }
}

/**
 * Hash con forma PHC Argon2id válida para los dobles. No es un hash real: solo
 * permite ejercitar las validaciones de formato sin ejecutar Argon2id.
 */
export function fakePasswordHash(plainPassword: string): string {
  const payload = Buffer.from(plainPassword, "utf8").toString("base64");
  return `$argon2id$v=19$m=19456,t=2,p=1$ZmFrZXNhbHQ$${payload}`;
}

export interface SeedIdentity {
  readonly usuarioId: string;
  readonly nombreCompleto: string;
  readonly correoElectronico: string;
  readonly credencial: string;
  readonly rol: RolSistema;
  readonly estado: EstadoUsuario;
  readonly compradorId?: string | null;
  readonly sellerId?: string | null;
}

export class FakeIdentityStore implements IdentityStore {
  private readonly credentials: CredentialRecord[];
  private readonly sessions = new Map<string, StoredSession>();
  private readonly revoked = new Set<string>();

  constructor(seed: readonly SeedIdentity[]) {
    this.credentials = seed.map((user) => ({
      usuarioId: user.usuarioId,
      nombreCompleto: user.nombreCompleto,
      correoElectronico: user.correoElectronico.trim().toLowerCase(),
      hashCredencial: fakePasswordHash(user.credencial),
      rol: user.rol,
      estado: user.estado,
      compradorId: user.compradorId ?? null,
      sellerId: user.sellerId ?? null
    }));
  }

  async findCredentialsByEmail(email: string): Promise<CredentialRecord | null> {
    const normalized = email.trim().toLowerCase();
    return this.credentials.find((user) => user.correoElectronico === normalized) ?? null;
  }

  async createSession(record: SessionRecord): Promise<void> {
    const credential = this.credentials.find((user) => user.usuarioId === record.usuarioId);
    if (!credential) {
      throw new DependencyUnavailableError("El usuario de la sesión no existe.");
    }
    this.sessions.set(record.tokenHash, {
      session: record,
      user: toAuthenticatedUser(credential)
    });
  }

  async findSessionByTokenHash(tokenHash: string): Promise<StoredSession | null> {
    if (this.revoked.has(tokenHash)) {
      return null;
    }
    return this.sessions.get(tokenHash) ?? null;
  }

  async touchSession(): Promise<void> {
    // La actividad es informativa en el doble.
  }

  async revokeSession(tokenHash: string): Promise<void> {
    this.revoked.add(tokenHash);
  }

  async healthCheck(): Promise<void> {
    // Disponible mientras viva el proceso de prueba.
  }

  async close(): Promise<void> {
    this.sessions.clear();
    this.revoked.clear();
  }

  getSessionCount(): number {
    return this.sessions.size - this.revoked.size;
  }
}

export class FakeAddressStore implements AddressStore {
  private readonly addresses = new Map<string, DireccionEntrega>();

  async list(compradorId: string): Promise<DireccionEntrega[]> {
    return [...this.addresses.values()]
      .filter((address) => address.compradorId === compradorId)
      .sort((a, b) => {
        if (a.esPrincipal !== b.esPrincipal) {
          return a.esPrincipal ? -1 : 1;
        }
        return a.creadaEn.localeCompare(b.creadaEn);
      });
  }

  async findById(compradorId: string, direccionId: string): Promise<DireccionEntrega | null> {
    const address = this.addresses.get(direccionId);
    return address && address.compradorId === compradorId ? address : null;
  }

  async create(direccion: DireccionEntrega): Promise<void> {
    if (direccion.esPrincipal) {
      this.clearPrincipal(direccion.compradorId);
    }
    this.addresses.set(direccion.id, direccion);
  }

  async update(direccion: DireccionEntrega): Promise<void> {
    this.addresses.set(direccion.id, direccion);
  }

  async delete(compradorId: string, direccionId: string): Promise<boolean> {
    const address = this.addresses.get(direccionId);
    if (!address || address.compradorId !== compradorId) {
      return false;
    }
    this.addresses.delete(direccionId);
    if (address.esPrincipal) {
      const oldest = [...this.addresses.values()]
        .filter((candidate) => candidate.compradorId === compradorId)
        .sort((a, b) => a.creadaEn.localeCompare(b.creadaEn))[0];
      if (oldest) {
        this.addresses.set(oldest.id, oldest.withPrincipal(true));
      }
    }
    return true;
  }

  async setPrincipal(compradorId: string, direccionId: string): Promise<boolean> {
    const address = this.addresses.get(direccionId);
    if (!address || address.compradorId !== compradorId) {
      return false;
    }
    this.clearPrincipal(compradorId);
    this.addresses.set(direccionId, address.withPrincipal(true));
    return true;
  }

  async close(): Promise<void> {
    this.addresses.clear();
  }

  private clearPrincipal(compradorId: string): void {
    for (const [id, address] of this.addresses) {
      if (address.compradorId === compradorId && address.esPrincipal) {
        this.addresses.set(id, address.withPrincipal(false));
      }
    }
  }
}

export class FakeSellerRegistrationStore implements SellerRegistrationStore {
  private readonly users = new Map<string, Usuario>();
  private readonly sellers = new Map<string, SellerProfileRecord>();
  private readonly warehouses = new Map<string, WarehouseRecord>();
  private readonly audit: unknown[] = [];
  private readonly events: unknown[] = [];

  /** Permite simular que la inserción de la bodega falla. */
  failOnWarehouse = false;

  async existsByEmail(email: CorreoElectronico): Promise<boolean> {
    return [...this.users.values()].some(
      (user) => user.correoElectronico.value === email.value
    );
  }

  async existsByDocument(documento: DocumentoIdentidad): Promise<boolean> {
    return [...this.users.values()].some((user) =>
      user.documentoIdentidad.equals(documento)
    );
  }

  async saveRegistration(record: SellerRegistrationRecord): Promise<void> {
    if (this.failOnWarehouse) {
      throw new DependencyUnavailableError("La bodega no pudo crearse.");
    }
    this.users.set(record.usuario.id, record.usuario);
    this.sellers.set(record.seller.id, record.seller);
    this.warehouses.set(record.warehouse.id, record.warehouse);
    this.audit.push(record.auditoria);
    this.events.push(record.evento);
  }

  async healthCheck(): Promise<void> {
    // Disponible mientras viva el proceso de prueba.
  }

  async close(): Promise<void> {
    this.users.clear();
    this.sellers.clear();
    this.warehouses.clear();
  }

  getUserCount(): number {
    return this.users.size;
  }

  getSellerCount(): number {
    return this.sellers.size;
  }

  getWarehouseCount(): number {
    return this.warehouses.size;
  }
}

export class FakeCartStore implements CartStore {
  private readonly products = new Map<string, SellableProduct>();
  private readonly items = new Map<string, Map<string, CartItemState>>();

  constructor(products: readonly SellableProduct[]) {
    for (const product of products) {
      this.products.set(product.productoId, product);
    }
  }

  async getCart(compradorId: string): Promise<CartView> {
    const items = [...(this.items.get(compradorId)?.entries() ?? [])].map(
      ([productoId, state]) => {
        const product = this.products.get(productoId);
        if (!product) {
          throw new DependencyUnavailableError("Producto eliminado del catálogo.");
        }
        return toCartLine(product, state);
      }
    );
    return {
      carritoId: `cart-${compradorId}`,
      compradorId,
      items,
      totalCentavos: items.reduce((sum, item) => sum + item.subtotalCentavos, 0),
      moneda: items[0]?.moneda ?? null,
      actualizadoEn: "2026-10-28T12:00:00.000Z",
      version: 1,
      requiereConfirmacionPrecio: items.some(
        (item) =>
          item.precioReferencialCentavos !== item.precioCentavos ||
          item.monedaReferencial !== item.moneda
      )
    };
  }

  async findProduct(productoId: string): Promise<SellableProduct | null> {
    return this.products.get(productoId) ?? null;
  }

  async getItem(compradorId: string, productoId: string): Promise<CartItemState | null> {
    return this.items.get(compradorId)?.get(productoId) ?? null;
  }

  async upsertItem(input: {
    compradorId: string;
    productoId: string;
    cantidad: number;
    precioCentavos: number;
    moneda: string;
    now: string;
  }): Promise<void> {
    const current = this.items.get(input.compradorId) ?? new Map();
    current.set(input.productoId, {
      cantidad: input.cantidad,
      precioReferencialCentavos: input.precioCentavos,
      monedaReferencial: input.moneda
    });
    this.items.set(input.compradorId, current);
  }

  async removeItem(compradorId: string, productoId: string): Promise<boolean> {
    return this.items.get(compradorId)?.delete(productoId) ?? false;
  }

  async close(): Promise<void> {
    this.items.clear();
    this.products.clear();
  }

  setProduct(product: SellableProduct): void {
    this.products.set(product.productoId, product);
  }

  setItem(
    compradorId: string,
    productoId: string,
    state: CartItemState
  ): void {
    const current = this.items.get(compradorId) ?? new Map();
    current.set(productoId, state);
    this.items.set(compradorId, current);
  }
}

export class FakeCheckoutStore implements CheckoutStore {
  readonly commands: CheckoutCommand[] = [];
  result: CheckoutResult = {
    estado: "CONFIRMADO",
    checkoutId: "00000000-0000-4000-8009-000000000001",
    pedidos: [],
    mensaje: "Pago confirmado."
  };

  async executeCheckout(command: CheckoutCommand): Promise<CheckoutResult> {
    this.commands.push(command);
    return { ...this.result, estado: command.resultadoPagoSimulado };
  }

  async listOrders(_compradorId: string): Promise<OrderSummary[]> {
    return [];
  }

  async findOrder(
    _compradorId: string,
    _orderId: string
  ): Promise<OrderDetail | null> {
    return null;
  }

  async close(): Promise<void> {
    // Nada que liberar.
  }
}

export function toAuthenticatedUser(credential: CredentialRecord): AuthenticatedUser {
  return {
    usuarioId: credential.usuarioId,
    nombreCompleto: credential.nombreCompleto,
    correoElectronico: credential.correoElectronico,
    rol: credential.rol,
    estado: credential.estado,
    compradorId: credential.compradorId,
    sellerId: credential.sellerId
  };
}

function toCartLine(product: SellableProduct, state: CartItemState): CartLineView {
  const motivo = motivoNoVendible(product, state.cantidad);
  return {
    ...product,
    cantidad: state.cantidad,
    precioReferencialCentavos: state.precioReferencialCentavos,
    monedaReferencial: state.monedaReferencial,
    subtotalCentavos: product.precioCentavos * state.cantidad,
    vendible: motivo === null,
    motivoNoVendible: motivo
  };
}

function motivoNoVendible(
  product: SellableProduct,
  cantidad: number
): MotivoNoVendible | null {
  if (product.estadoProducto !== "PUBLICADO") {
    return "PRODUCTO_NO_PUBLICADO";
  }
  if (product.estadoVendedor !== "ACTIVO") {
    return "VENDEDOR_NO_ACTIVO";
  }
  if (product.tipoEntrega === "FISICA" && cantidad > (product.disponible ?? 0)) {
    return "STOCK_INSUFICIENTE";
  }
  return null;
}
