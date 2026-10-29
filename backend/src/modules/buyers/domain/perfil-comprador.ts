import { ValidationError } from "../../../shared/domain/errors.js";
import type { CompradorId, UsuarioId } from "../../../shared/domain/ids.js";
import type { Instant } from "../../../shared/domain/value-objects.js";

export const ESTADOS_COMERCIALES = ["HABILITADO", "RESTRINGIDO"] as const;
export type EstadoComercial = (typeof ESTADOS_COMERCIALES)[number];

export interface PerfilCompradorProps {
  id: CompradorId;
  usuarioId: UsuarioId;
  estadoComercial: EstadoComercial;
  direcciones: readonly unknown[];
  creadoEn: Instant;
}

/**
 * Perfil comercial del comprador. En PI-01 nace sin direcciones y HABILITADO.
 * Un perfil por usuario con rol COMPRADOR.
 */
export class PerfilComprador {
  private constructor(private readonly props: PerfilCompradorProps) {}

  static create(input: PerfilCompradorProps): PerfilComprador {
    if (!ESTADOS_COMERCIALES.includes(input.estadoComercial)) {
      throw new ValidationError("El estado comercial del comprador no es válido.");
    }
    if (!Array.isArray(input.direcciones)) {
      throw new ValidationError("Las direcciones del comprador deben ser una lista.");
    }
    return new PerfilComprador(input);
  }

  get id(): CompradorId {
    return this.props.id;
  }

  get usuarioId(): UsuarioId {
    return this.props.usuarioId;
  }

  get estadoComercial(): EstadoComercial {
    return this.props.estadoComercial;
  }

  get direcciones(): readonly unknown[] {
    return this.props.direcciones;
  }

  get creadoEn(): Instant {
    return this.props.creadoEn;
  }
}
