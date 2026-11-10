import type { DireccionEntrega } from "../domain/direccion-entrega.js";

export interface AddressStore {
  list(compradorId: string): Promise<DireccionEntrega[]>;
  findById(
    compradorId: string,
    direccionId: string
  ): Promise<DireccionEntrega | null>;
  create(direccion: DireccionEntrega): Promise<void>;
  update(direccion: DireccionEntrega): Promise<void>;
  /** Elimina y, si era la principal, promueve la más antigua restante. */
  delete(compradorId: string, direccionId: string): Promise<boolean>;
  setPrincipal(
    compradorId: string,
    direccionId: string,
    at: string
  ): Promise<boolean>;
  close(): Promise<void>;
}
