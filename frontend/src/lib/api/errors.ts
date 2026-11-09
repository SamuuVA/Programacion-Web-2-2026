/**
 * Error tipado de la API. Vive en un módulo neutral para que puedan
 * importarlo tanto componentes de servidor como de cliente sin arrastrar
 * dependencias exclusivas del servidor.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly correlationId: string | undefined;
  readonly details: Record<string, unknown> | undefined;

  constructor(input: {
    message: string;
    status: number;
    code: string;
    correlationId?: string;
    details?: Record<string, unknown>;
  }) {
    super(input.message);
    this.name = "ApiError";
    this.status = input.status;
    this.code = input.code;
    this.correlationId = input.correlationId;
    this.details = input.details;
  }
}
