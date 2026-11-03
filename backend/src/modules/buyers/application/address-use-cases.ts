import type { Clock, IdGenerator } from "../../../shared/application/ports.js";
import { ResourceNotFoundError } from "../../../shared/domain/errors.js";
import { DireccionEntrega } from "../domain/direccion-entrega.js";
import type { AddressStore } from "./address-ports.js";

export interface AddressInput {
  readonly destinatario: string;
  readonly telefono: string;
  readonly linea1: string;
  readonly linea2?: string | null | undefined;
  readonly ciudad: string;
  readonly region: string;
  readonly codigoPostal?: string | null | undefined;
  readonly pais?: string | undefined;
}

export interface CreateAddressCommand extends AddressInput {
  readonly esPrincipal?: boolean | undefined;
}

export type UpdateAddressCommand = {
  readonly direccionId: string;
} & {
  readonly [K in keyof AddressInput]?: AddressInput[K] | undefined;
};

export class ListAddresses {
  constructor(private readonly store: AddressStore) {}

  execute(compradorId: string): Promise<DireccionEntrega[]> {
    return this.store.list(compradorId);
  }
}

export class CreateAddress {
  constructor(
    private readonly store: AddressStore,
    private readonly clock: Clock,
    private readonly ids: IdGenerator
  ) {}

  async execute(compradorId: string, command: CreateAddressCommand): Promise<DireccionEntrega> {
    const now = this.clock.now().value;
    const existing = await this.store.list(compradorId);
    const esPrincipal = command.esPrincipal === true || existing.length === 0;
    const direccion = DireccionEntrega.create({
      id: this.ids.addressId(),
      compradorId,
      destinatario: command.destinatario,
      telefono: command.telefono,
      linea1: command.linea1,
      linea2: command.linea2 ?? null,
      ciudad: command.ciudad,
      region: command.region,
      codigoPostal: command.codigoPostal ?? null,
      pais: command.pais ?? "CO",
      esPrincipal,
      creadaEn: now,
      actualizadaEn: now
    });
    await this.store.create(direccion);
    return direccion;
  }
}

export class UpdateAddress {
  constructor(
    private readonly store: AddressStore,
    private readonly clock: Clock
  ) {}

  async execute(
    compradorId: string,
    command: UpdateAddressCommand
  ): Promise<DireccionEntrega> {
    const current = await this.store.findById(compradorId, command.direccionId);
    if (current === null) {
      throw new ResourceNotFoundError("La dirección no existe o no pertenece al comprador.");
    }
    const updated = current
      .withUpdatedFields({
        ...(command.destinatario !== undefined
          ? { destinatario: command.destinatario }
          : {}),
        ...(command.telefono !== undefined ? { telefono: command.telefono } : {}),
        ...(command.linea1 !== undefined ? { linea1: command.linea1 } : {}),
        ...(command.linea2 !== undefined ? { linea2: command.linea2 } : {}),
        ...(command.ciudad !== undefined ? { ciudad: command.ciudad } : {}),
        ...(command.region !== undefined ? { region: command.region } : {}),
        ...(command.codigoPostal !== undefined
          ? { codigoPostal: command.codigoPostal }
          : {}),
        ...(command.pais !== undefined ? { pais: command.pais } : {})
      })
      .withUpdatedFields({ actualizadaEn: this.clock.now().value });
    await this.store.update(updated);
    return updated;
  }
}

export class DeleteAddress {
  constructor(private readonly store: AddressStore) {}

  async execute(compradorId: string, direccionId: string): Promise<void> {
    const deleted = await this.store.delete(compradorId, direccionId);
    if (!deleted) {
      throw new ResourceNotFoundError("La dirección no existe o no pertenece al comprador.");
    }
  }
}

export class SetPrincipalAddress {
  constructor(
    private readonly store: AddressStore,
    private readonly clock: Clock
  ) {}

  async execute(compradorId: string, direccionId: string): Promise<void> {
    const updated = await this.store.setPrincipal(
      compradorId,
      direccionId,
      this.clock.now().value
    );
    if (!updated) {
      throw new ResourceNotFoundError("La dirección no existe o no pertenece al comprador.");
    }
  }
}
