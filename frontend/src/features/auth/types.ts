export type RolSistema =
  | "COMPRADOR"
  | "VENDEDOR"
  | "OPERADOR_LOGISTICO"
  | "ADMINISTRADOR"
  | "SUPERVISOR";

export type EstadoUsuario = "ACTIVO" | "INACTIVO" | "BLOQUEADO";

export interface AuthenticatedUser {
  readonly usuarioId: string;
  readonly nombreCompleto: string;
  readonly correoElectronico: string;
  readonly rol: RolSistema;
  readonly estado: EstadoUsuario;
  readonly compradorId: string | null;
  readonly sellerId: string | null;
}

export interface SessionEnvelope {
  readonly data: {
    readonly usuario: AuthenticatedUser;
  };
}

export interface LoginEnvelope {
  readonly data: {
    readonly token: string;
    readonly expiraEn: string;
    readonly usuario: AuthenticatedUser;
  };
}
