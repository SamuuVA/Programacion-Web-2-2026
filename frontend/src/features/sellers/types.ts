export interface RegisterSellerResult {
  readonly usuarioId: string;
  readonly sellerId: string;
  readonly warehouseId: string;
  readonly estadoUsuario: "ACTIVO";
  readonly estadoVendedor: "ACTIVO";
  readonly estadoBodega: "ACTIVA";
  readonly correoNormalizado: string;
}

export interface RegisterSellerEnvelope {
  readonly data: RegisterSellerResult;
}
