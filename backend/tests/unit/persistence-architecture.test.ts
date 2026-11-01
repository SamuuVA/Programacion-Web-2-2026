import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const sourceRoot = resolve(here, "..", "..", "src");

async function collectSourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(path)));
    } else if (entry.isFile() && entry.name.endsWith(".ts")) {
      files.push(path);
    }
  }
  return files;
}

/**
 * Guard de arquitectura: el código de ejecución no puede volver a introducir
 * un adaptador de persistencia en memoria para Buyer. Los dobles de prueba
 * viven exclusivamente en `tests/`.
 */
describe("Persistencia de ejecución", () => {
  it("no contiene adaptadores en memoria ni referencias a PERSISTENCE", async () => {
    const files = await collectSourceFiles(sourceRoot);
    const offenders: string[] = [];

    for (const file of files) {
      const content = await readFile(file, "utf8");
      if (
        /memory-buyer-registration-store|MemoryBuyerRegistrationStore|PERSISTENCE/.test(
          content
        )
      ) {
        offenders.push(file.replace(sourceRoot, "src"));
      }
    }

    expect(offenders).toEqual([]);
  });

  it("solo importa el adaptador PostgreSQL en el composition root", async () => {
    const factory = await readFile(
      resolve(sourceRoot, "infrastructure", "factory.ts"),
      "utf8"
    );

    expect(factory).toContain("PostgresBuyerRegistrationStore");
    expect(factory).not.toMatch(/memory/i);
  });
});
