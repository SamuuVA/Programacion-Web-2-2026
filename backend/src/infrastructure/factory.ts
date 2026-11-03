import type { AppConfig } from "../config.js";
import type { BuyerRegistrationStore } from "../modules/buyers/application/ports.js";
import { PostgresBuyerRegistrationStore } from "../modules/buyers/infrastructure/postgres-buyer-registration-store.js";
import type { AddressStore } from "../modules/buyers/application/address-ports.js";
import { PostgresAddressStore } from "../modules/buyers/infrastructure/postgres-address-store.js";
import type { CatalogQueryRepository } from "../modules/catalog/application/ports.js";
import { PostgresCatalogQueryRepository } from "../modules/catalog/infrastructure/postgres-catalog-query-repository.js";
import type { IdentityStore } from "../modules/identity/application/ports.js";
import { PostgresIdentityStore } from "../modules/identity/infrastructure/postgres-identity-store.js";
import type { SellerRegistrationStore } from "../modules/sellers/application/ports.js";
import { PostgresSellerRegistrationStore } from "../modules/sellers/infrastructure/postgres-seller-registration-store.js";
import type { CartStore } from "../modules/cart/application/ports.js";
import { PostgresCartStore } from "../modules/cart/infrastructure/postgres-cart-store.js";
import type { CheckoutStore } from "../modules/orders/application/ports.js";
import { PostgresCheckoutStore } from "../modules/orders/infrastructure/postgres-checkout-store.js";
import type { IdGenerator } from "../shared/application/ports.js";

/**
 * Composition root de la persistencia.
 *
 * PostgreSQL es el único adaptador de ejecución. No existe una rama en
 * memoria: un entorno sin base de datos debe fallar al arrancar en vez de
 * aceptar datos que se perderían al reiniciar.
 */
export function createBuyerRegistrationStore(config: AppConfig): BuyerRegistrationStore {
  return new PostgresBuyerRegistrationStore(config.DATABASE_URL);
}

export function createCatalogQueryRepository(
  config: AppConfig
): CatalogQueryRepository {
  return new PostgresCatalogQueryRepository(config.DATABASE_URL);
}

export function createIdentityStore(config: AppConfig): IdentityStore {
  return new PostgresIdentityStore(config.DATABASE_URL);
}

export function createAddressStore(config: AppConfig): AddressStore {
  return new PostgresAddressStore(config.DATABASE_URL);
}

export function createSellerRegistrationStore(config: AppConfig): SellerRegistrationStore {
  return new PostgresSellerRegistrationStore(config.DATABASE_URL);
}

export function createCartStore(config: AppConfig): CartStore {
  return new PostgresCartStore(config.DATABASE_URL);
}

export function createCheckoutStore(config: AppConfig, ids: IdGenerator): CheckoutStore {
  return new PostgresCheckoutStore(config.DATABASE_URL, ids);
}
