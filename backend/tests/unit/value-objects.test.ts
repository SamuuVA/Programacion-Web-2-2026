import { describe, expect, it } from "vitest";
import { ValidationError } from "../../src/shared/domain/errors.js";
import {
  CorreoElectronico,
  DocumentoIdentidad,
  HashCredencial,
  NombreCompleto
} from "../../src/shared/domain/value-objects.js";

describe("value objects de identidad", () => {
  it("normaliza el nombre sin colapsar su contenido", () => {
    expect(NombreCompleto.create("  Ana   María  Pérez ").value).toBe("Ana María Pérez");
    expect(() => NombreCompleto.create("   ")).toThrow(ValidationError);
  });

  it("normaliza el correo a minúsculas y rechaza formatos inválidos", () => {
    expect(CorreoElectronico.create("  Ana.Perez@Example.COM ").value).toBe(
      "ana.perez@example.com"
    );
    expect(() => CorreoElectronico.create("ana@sin-punto")).toThrow(ValidationError);
    expect(() => CorreoElectronico.create("ana ejemplo@correo.com")).toThrow(ValidationError);
  });

  it("compara documentos por sus tres componentes normalizados", () => {
    const first = DocumentoIdentidad.create({
      tipo: " CC ",
      pais: " CO ",
      numero: " 123456 "
    });
    const second = DocumentoIdentidad.create({
      tipo: "CC",
      pais: "CO",
      numero: "123456"
    });
    expect(first.equals(second)).toBe(true);
    expect(first).toMatchObject({ tipo: "CC", pais: "CO", numero: "123456" });
  });

  it("rechaza hashes que no cumplen la política PHC Argon2id", () => {
    expect(() => HashCredencial.create("texto-plano")).toThrow(ValidationError);
    expect(
      HashCredencial.create(
        "$argon2id$v=19$m=19456,t=2,p=1$c2FsdHNhbHRzYWx0c2E$aGFzaGhhc2hoYXNoaGFzaA"
      ).value
    ).toContain("$argon2id$v=19$");
  });
});
