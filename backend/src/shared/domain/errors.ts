export type ErrorCode =
  | "VALIDACION_INVALIDA"
  | "CONFLICTO_UNICIDAD"
  | "REGLA_NEGOCIO_INCUMPLIDA"
  | "DEPENDENCIA_NO_DISPONIBLE"
  | "NO_AUTORIZADO"
  | "RUTA_NO_ENCONTRADA"
  | "METODO_NO_PERMITIDO";

export class ApplicationError extends Error {
  readonly code: ErrorCode;
  readonly details: Record<string, unknown> | undefined;

  constructor(
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("VALIDACION_INVALIDA", message, details);
  }
}

export class UniquenessConflictError extends ApplicationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("CONFLICTO_UNICIDAD", message, details);
  }
}

export class BusinessRuleError extends ApplicationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("REGLA_NEGOCIO_INCUMPLIDA", message, details);
  }
}

export class DependencyUnavailableError extends ApplicationError {
  constructor(message = "La dependencia no está disponible.", details?: Record<string, unknown>) {
    super("DEPENDENCIA_NO_DISPONIBLE", message, details);
  }
}
