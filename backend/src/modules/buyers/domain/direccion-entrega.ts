import { ValidationError } from "../../../shared/domain/errors.js";

export interface DireccionEntregaProps {
  readonly id: string;
  readonly compradorId: string;
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

export interface DireccionSnapshot {
  readonly direccionId: string;
  readonly destinatario: string;
  readonly telefono: string;
  readonly linea1: string;
  readonly linea2: string | null;
  readonly ciudad: string;
  readonly region: string;
  readonly codigoPostal: string | null;
  readonly pais: string;
  readonly capturadaEn: string;
}

const MAX = {
  destinatario: 120,
  telefono: 30,
  linea1: 160,
  linea2: 160,
  ciudad: 80,
  region: 80,
  codigoPostal: 20
} as const;

/**
 * L-01: dirección de entrega del comprador.
 *
 * Composición mínima aprobada para V1: destinatario, teléfono, línea 1,
 * línea 2 opcional, ciudad, región, código postal opcional y país ISO-3166-1
 * alfa-2. No se modelan coordenadas ni referencias adicionales porque las
 * fuentes no las exigen.
 */
export class DireccionEntrega {
  private constructor(private readonly props: DireccionEntregaProps) {}

  static create(input: DireccionEntregaProps): DireccionEntrega {
    const props: DireccionEntregaProps = {
      id: required(input.id, "id"),
      compradorId: required(input.compradorId, "compradorId"),
      destinatario: text(input.destinatario, "destinatario", MAX.destinatario),
      telefono: text(input.telefono, "telefono", MAX.telefono),
      linea1: text(input.linea1, "linea1", MAX.linea1),
      linea2: optionalText(input.linea2, "linea2", MAX.linea2),
      ciudad: text(input.ciudad, "ciudad", MAX.ciudad),
      region: text(input.region, "region", MAX.region),
      codigoPostal: optionalText(input.codigoPostal, "codigoPostal", MAX.codigoPostal),
      pais: country(input.pais),
      esPrincipal: Boolean(input.esPrincipal),
      creadaEn: required(input.creadaEn, "creadaEn"),
      actualizadaEn: required(input.actualizadaEn, "actualizadaEn")
    };
    return new DireccionEntrega(props);
  }

  get id(): string {
    return this.props.id;
  }

  get compradorId(): string {
    return this.props.compradorId;
  }

  get destinatario(): string {
    return this.props.destinatario;
  }

  get telefono(): string {
    return this.props.telefono;
  }

  get linea1(): string {
    return this.props.linea1;
  }

  get linea2(): string | null {
    return this.props.linea2;
  }

  get ciudad(): string {
    return this.props.ciudad;
  }

  get region(): string {
    return this.props.region;
  }

  get codigoPostal(): string | null {
    return this.props.codigoPostal;
  }

  get pais(): string {
    return this.props.pais;
  }

  get esPrincipal(): boolean {
    return this.props.esPrincipal;
  }

  get creadaEn(): string {
    return this.props.creadaEn;
  }

  get actualizadaEn(): string {
    return this.props.actualizadaEn;
  }

  withPrincipal(value: boolean): DireccionEntrega {
    return new DireccionEntrega({ ...this.props, esPrincipal: value });
  }

  withUpdatedFields(
    input: Partial<Omit<DireccionEntregaProps, "id" | "compradorId" | "creadaEn" | "esPrincipal">>
  ): DireccionEntrega {
    return DireccionEntrega.create({
      ...this.props,
      ...input,
      id: this.props.id,
      compradorId: this.props.compradorId,
      creadaEn: this.props.creadaEn,
      esPrincipal: this.props.esPrincipal
    });
  }

  /**
   * Copia inmutable para el pedido. Cambiar o borrar la dirección del perfil
   * después de la compra no modifica este snapshot.
   */
  toSnapshot(capturadaEn: string): DireccionSnapshot {
    return {
      direccionId: this.props.id,
      destinatario: this.props.destinatario,
      telefono: this.props.telefono,
      linea1: this.props.linea1,
      linea2: this.props.linea2,
      ciudad: this.props.ciudad,
      region: this.props.region,
      codigoPostal: this.props.codigoPostal,
      pais: this.props.pais,
      capturadaEn
    };
  }
}

function required(value: string, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ValidationError(`La dirección requiere ${label}.`);
  }
  return value;
}

function text(value: string, label: string, max: number): string {
  if (typeof value !== "string") {
    throw new ValidationError(`La dirección requiere ${label}.`);
  }
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length === 0) {
    throw new ValidationError(`La dirección requiere ${label}.`);
  }
  if (normalized.length > max) {
    throw new ValidationError(`${label} no puede superar ${max} caracteres.`);
  }
  return normalized;
}

function optionalText(value: string | null | undefined, label: string, max: number): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== "string") {
    throw new ValidationError(`${label} debe ser texto.`);
  }
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length === 0) {
    return null;
  }
  if (normalized.length > max) {
    throw new ValidationError(`${label} no puede superar ${max} caracteres.`);
  }
  return normalized;
}

function country(value: string): string {
  if (typeof value !== "string") {
    throw new ValidationError("El país es obligatorio.");
  }
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) {
    throw new ValidationError("El país debe usar el código ISO de dos letras (por ejemplo CO).");
  }
  return normalized;
}
