import type { UsuarioId } from "../../../shared/domain/ids.js";
import type {
  CorreoElectronico,
  DocumentoIdentidad,
  HashCredencial,
  Instant,
  NombreCompleto
} from "../../../shared/domain/value-objects.js";

export const ROLES = [
  "COMPRADOR",
  "VENDEDOR",
  "OPERADOR_LOGISTICO",
  "ADMINISTRADOR",
  "SUPERVISOR"
] as const;

export type RolSistema = (typeof ROLES)[number];

export const ESTADOS_USUARIO = ["ACTIVO", "INACTIVO", "BLOQUEADO"] as const;
export type EstadoUsuario = (typeof ESTADOS_USUARIO)[number];

export interface CrearUsuarioInput {
  id: UsuarioId;
  nombreCompleto: NombreCompleto;
  correoElectronico: CorreoElectronico;
  documentoIdentidad: DocumentoIdentidad;
  credencial: HashCredencial;
  rol: RolSistema;
  estado: EstadoUsuario;
  creadoEn: Instant;
  actualizadoEn: Instant;
}

/**
 * Cuenta de acceso. No contiene lógica de autenticación ni emite sesiones.
 * Invariantes USR-01…USR-06 del modelo §6.1.
 */
export class Usuario {
  private constructor(private readonly props: CrearUsuarioInput) {}

  static create(input: CrearUsuarioInput): Usuario {
    if (!ROLES.includes(input.rol)) {
      throw new Error("El rol del usuario no es válido.");
    }
    if (!ESTADOS_USUARIO.includes(input.estado)) {
      throw new Error("El estado del usuario no es válido.");
    }
    return new Usuario(input);
  }

  get id(): UsuarioId {
    return this.props.id;
  }

  get nombreCompleto(): NombreCompleto {
    return this.props.nombreCompleto;
  }

  get correoElectronico(): CorreoElectronico {
    return this.props.correoElectronico;
  }

  get documentoIdentidad(): DocumentoIdentidad {
    return this.props.documentoIdentidad;
  }

  get credencial(): HashCredencial {
    return this.props.credencial;
  }

  get rol(): RolSistema {
    return this.props.rol;
  }

  get estado(): EstadoUsuario {
    return this.props.estado;
  }

  get creadoEn(): Instant {
    return this.props.creadoEn;
  }

  get actualizadoEn(): Instant {
    return this.props.actualizadoEn;
  }

  puedeAutenticarse(): boolean {
    return this.props.estado === "ACTIVO";
  }
}
