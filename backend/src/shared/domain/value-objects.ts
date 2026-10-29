import { ValidationError } from "./errors.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHC_ARGON2ID_PATTERN =
  /^\$argon2id\$v=19\$m=19456,t=2,p=1\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/;

export class NombreCompleto {
  private constructor(readonly value: string) {}

  static create(value: string): NombreCompleto {
    if (typeof value !== "string") {
      throw new ValidationError("El nombre completo es obligatorio.");
    }
    const normalized = value.trim().replace(/\s+/g, " ");
    if (normalized.length === 0) {
      throw new ValidationError("El nombre completo no puede estar vacío.");
    }
    return new NombreCompleto(normalized);
  }

  equals(other: NombreCompleto): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

export class CorreoElectronico {
  private constructor(readonly value: string) {}

  static create(value: string): CorreoElectronico {
    if (typeof value !== "string") {
      throw new ValidationError("El correo electrónico es obligatorio.");
    }
    const normalized = value.trim().toLowerCase();
    if (normalized.length === 0) {
      throw new ValidationError("El correo electrónico no puede estar vacío.");
    }
    if (!EMAIL_PATTERN.test(normalized)) {
      throw new ValidationError("El correo electrónico no tiene un formato válido.");
    }
    return new CorreoElectronico(normalized);
  }

  equals(other: CorreoElectronico): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

export class DocumentoIdentidad {
  private constructor(
    readonly tipo: string,
    readonly pais: string,
    readonly numero: string
  ) {}

  static create(input: { tipo: string; pais: string; numero: string }): DocumentoIdentidad {
    const tipo = normalizeComponent(input.tipo, "tipo de documento");
    const pais = normalizeComponent(input.pais, "país del documento");
    const numero = normalizeComponent(input.numero, "número de documento");
    return new DocumentoIdentidad(tipo, pais, numero);
  }

  equals(other: DocumentoIdentidad): boolean {
    return (
      this.tipo === other.tipo &&
      this.pais === other.pais &&
      this.numero === other.numero
    );
  }
}

export class HashCredencial {
  private constructor(readonly value: string) {}

  static create(value: string): HashCredencial {
    if (typeof value !== "string" || value.length === 0) {
      throw new ValidationError("El hash de la credencial es obligatorio.");
    }
    if (!PHC_ARGON2ID_PATTERN.test(value)) {
      throw new ValidationError("El hash de la credencial no corresponde a la política aprobada.");
    }
    return new HashCredencial(value);
  }

  equals(other: HashCredencial): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

export class CorrelationId {
  private constructor(readonly value: string) {}

  static create(value: string): CorrelationId {
    const normalized = typeof value === "string" ? value.trim() : "";
    if (normalized.length === 0) {
      throw new ValidationError("El correlationId es obligatorio.");
    }
    if (!isValidCorrelationId(normalized)) {
      throw new ValidationError(
        "El correlationId debe tener entre 1 y 200 caracteres y usar solo letras, números, punto, guion, guion bajo o dos puntos."
      );
    }
    return new CorrelationId(normalized);
  }

  toString(): string {
    return this.value;
  }
}

export const CORRELATION_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;

export function isValidCorrelationId(value: string): boolean {
  return CORRELATION_ID_PATTERN.test(value);
}

export class Instant {
  private constructor(readonly value: string) {}

  static fromDate(value: Date): Instant {
    if (Number.isNaN(value.getTime())) {
      throw new ValidationError("El instante no es válido.");
    }
    return new Instant(value.toISOString());
  }

  static fromISOString(value: string): Instant {
    const date = new Date(value);
    if (Number.isNaN(date.getTime()) || date.toISOString() !== value) {
      throw new ValidationError("El instante debe estar en formato ISO 8601 UTC.");
    }
    return new Instant(value);
  }

  toDate(): Date {
    return new Date(this.value);
  }

  toString(): string {
    return this.value;
  }
}

function normalizeComponent(value: string, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ValidationError(`El ${label} es obligatorio.`);
  }
  return value.trim();
}
