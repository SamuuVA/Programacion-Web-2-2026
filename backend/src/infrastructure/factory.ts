import type { AppConfig } from "../config.js";
import type { BuyerRegistrationStore } from "../modules/buyers/application/ports.js";
import { PostgresBuyerRegistrationStore } from "../modules/buyers/infrastructure/postgres-buyer-registration-store.js";
import type { CatalogQueryRepository } from "../modules/catalog/application/ports.js";
import { PostgresCatalogQueryRepository } from "../modules/catalog/infrastructure/postgres-catalog-query-repository.js";

/**
 * Composition root de la persistencia de Buyer.
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
