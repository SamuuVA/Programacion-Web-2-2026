export type ErrorCode =
  | "VALIDACION_INVALIDA"
  | "CONFLICTO_UNICIDAD"
  | "REGLA_NEGOCIO_INCUMPLIDA"
  | "DEPENDENCIA_NO_DISPONIBLE"
  | "NO_AUTENTICADO"
  | "NO_AUTORIZADO"
  | "RUTA_NO_ENCONTRADA"
  | "RECURSO_NO_ENCONTRADO"
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

export class ResourceNotFoundError extends ApplicationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("RECURSO_NO_ENCONTRADO", message, details);
  }
}

/** No hay sesión válida o las credenciales no son correctas. */
export class AuthenticationError extends ApplicationError {
  constructor(message = "Debes iniciar sesión para continuar.", details?: Record<string, unknown>) {
    super("NO_AUTENTICADO", message, details);
  }
}

/** Hay sesión válida, pero el rol o el ámbito no permiten la operación. */
export class AuthorizationError extends ApplicationError {
  constructor(message = "No tienes permiso para realizar esta operación.", details?: Record<string, unknown>) {
    super("NO_AUTORIZADO", message, details);
  }
}

export class DependencyUnavailableError extends ApplicationError {
  constructor(message = "La dependencia no está disponible.", details?: Record<string, unknown>) {
    super("DEPENDENCIA_NO_DISPONIBLE", message, details);
  }
}
