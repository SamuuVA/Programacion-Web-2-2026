export interface RegisterBuyerRequest {
  readonly nombreCompleto: string;
  readonly correoElectronico: string;
  readonly documentoIdentidad: {
    readonly tipo: string;
    readonly pais: string;
    readonly numero: string;
  };
  readonly credencial: string;
}

export interface RegisterBuyerResult {
  readonly usuarioId: string;
  readonly compradorId: string;
  readonly carritoId: string;
  readonly estadoUsuario: "ACTIVO";
  readonly estadoComercial: "HABILITADO";
  readonly correoNormalizado: string;
}

export interface RegisterBuyerEnvelope {
  readonly data: RegisterBuyerResult;
}
