import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/postgres/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"]
    }
  }
});
