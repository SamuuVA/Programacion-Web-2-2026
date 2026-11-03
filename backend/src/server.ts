import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";
import {
  createAddressStore,
  createBuyerRegistrationStore,
  createCartStore,
  createCatalogQueryRepository,
  createCheckoutStore,
  createIdentityStore,
  createSellerRegistrationStore
} from "./infrastructure/factory.js";
import { Argon2PasswordHasher } from "./modules/identity/infrastructure/argon2-password-hasher.js";
import { SystemClock } from "./shared/infrastructure/system-clock.js";
import { SecureSessionTokens } from "./shared/infrastructure/session-tokens.js";
import { UuidGenerator } from "./shared/infrastructure/uuid-generator.js";

const config = loadConfig();
const ids = new UuidGenerator();
const app = await buildApp(config, {
  store: createBuyerRegistrationStore(config),
  catalog: createCatalogQueryRepository(config),
  hasher: new Argon2PasswordHasher(),
  clock: new SystemClock(),
  ids,
  identity: createIdentityStore(config),
  sessionTokens: new SecureSessionTokens(),
  addresses: createAddressStore(config),
  sellers: createSellerRegistrationStore(config),
  cart: createCartStore(config),
  checkout: createCheckoutStore(config, ids)
});

const shutdown = async (signal: string): Promise<void> => {
  app.log.info({ signal }, "Cerrando servidor");
  await app.close();
  process.exit(0);
};

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

try {
  await app.listen({ host: config.HOST, port: config.PORT });
} catch (error) {
  app.log.error({ err: error }, "No fue posible iniciar el servidor");
  await app.close();
  process.exit(1);
}
