import "dotenv/config";
import {
  getMigrationStatus,
  runMigrations
} from "../src/infrastructure/migrations.js";

const args = new Set(process.argv.slice(2));
const help = args.has("--help") || args.has("-h");
const showStatus = args.has("--status");
const allowBaseline = args.has("--baseline");

if (help) {
  console.log(`Uso:
  npm run db:migrate            Aplica las migraciones pendientes.
  npm run db:migrate -- --status
                                Muestra historial y migraciones pendientes.
  npm run db:migrate:baseline   Registra 001 como aplicada en una base
                                existente ya verificada. No crea tablas.

Variables:
  DATABASE_URL                  Obligatoria.
`);
  process.exit(0);
}

if (showStatus && allowBaseline) {
  console.error("--status y --baseline no se pueden combinar.");
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.error("DATABASE_URL es obligatoria para ejecutar migraciones.");
  process.exit(1);
}

try {
  if (showStatus) {
    const status = await getMigrationStatus({ connectionString: databaseUrl });
    console.log("Migraciones aplicadas:");
    if (status.applied.length === 0) {
      console.log("  (ninguna)");
    }
    for (const migration of status.applied) {
      console.log(
        `  ${migration.version} ${migration.name} ${migration.appliedAt} ${migration.checksum.slice(0, 12)}`
      );
    }
    console.log("Migraciones pendientes:");
    if (status.pending.length === 0) {
      console.log("  (ninguna)");
    }
    for (const migration of status.pending) {
      console.log(`  ${migration.version} ${migration.name}`);
    }
  } else {
    const result = await runMigrations({
      connectionString: databaseUrl,
      allowBaseline
    });
    if (result.baselined.length > 0) {
      console.log(`Línea base registrada: ${result.baselined.join(", ")}`);
    }
    if (result.applied.length === 0) {
      console.log("No había migraciones pendientes.");
    } else {
      console.log(`Migraciones aplicadas: ${result.applied.join(", ")}`);
    }
  }
} catch (error) {
  console.error(
    "No fue posible completar la operación de migraciones.",
    error instanceof Error ? error.message : error
  );
  process.exitCode = 1;
}
