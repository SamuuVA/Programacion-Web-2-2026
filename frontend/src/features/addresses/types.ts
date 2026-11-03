export interface Address {
  readonly id: string;
  readonly destinatario: string;
  readonly telefono: string;
  readonly linea1: string;
  readonly linea2: string | null;
  readonly ciudad: string;
  readonly region: string;
  readonly codigoPostal: string | null;
  readonly pais: string;
  readonly esPrincipal: boolean;
  readonly creadaEn: string;
  readonly actualizadaEn: string;
}

export interface AddressListEnvelope {
  readonly data: readonly Address[];
}

export interface AddressEnvelope {
  readonly data: Address;
}

export interface AddressInput {
  readonly destinatario: string;
  readonly telefono: string;
  readonly linea1: string;
  readonly linea2?: string | null;
  readonly ciudad: string;
  readonly region: string;
  readonly codigoPostal?: string | null;
  readonly pais?: string;
  readonly esPrincipal?: boolean;
}
