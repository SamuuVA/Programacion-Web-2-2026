import type { AppConfig } from "../config.js";
import type { BuyerRegistrationStore } from "../modules/buyers/application/ports.js";
import { MemoryBuyerRegistrationStore } from "../modules/buyers/infrastructure/memory-buyer-registration-store.js";
import { PostgresBuyerRegistrationStore } from "../modules/buyers/infrastructure/postgres-buyer-registration-store.js";

export function createBuyerRegistrationStore(config: AppConfig): BuyerRegistrationStore {
  if (config.PERSISTENCE === "postgres") {
    if (!config.DATABASE_URL) {
      throw new Error("DATABASE_URL es obligatoria cuando PERSISTENCE=postgres.");
    }
    return new PostgresBuyerRegistrationStore(config.DATABASE_URL);
  }
  return new MemoryBuyerRegistrationStore();
}
