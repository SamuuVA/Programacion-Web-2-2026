import {
  BusinessRuleError,
  ResourceNotFoundError
} from "../../src/shared/domain/errors.js";
import type {
  ApplyUserAccessTransitionInput,
  UserAccessRecord,
  UserAccessStore,
  UserAccessTransitionResult
} from "../../src/modules/identity/application/update-user-access-status.js";

/**
 * Doble en memoria del estado de acceso. Registra las transiciones aplicadas
 * para comprobar la tabla de transiciones y la revocación de sesiones.
 */
export class FakeUserAccessStore implements UserAccessStore {
  private readonly users = new Map<string, UserAccessRecord>();
  readonly transitions: ApplyUserAccessTransitionInput[] = [];
  sesionesVigentes = 0;

  seedUser(user: UserAccessRecord): void {
    this.users.set(user.usuarioId, user);
  }

  getUser(usuarioId: string): UserAccessRecord | undefined {
    return this.users.get(usuarioId);
  }

  async findUser(usuarioId: string): Promise<UserAccessRecord | null> {
    return this.users.get(usuarioId) ?? null;
  }

  async applyTransition(
    input: ApplyUserAccessTransitionInput
  ): Promise<UserAccessTransitionResult> {
    const user = this.users.get(input.usuarioId);
    if (!user) {
      throw new ResourceNotFoundError("La cuenta no existe.");
    }
    if (user.estado !== input.estadoEsperado) {
      throw new BusinessRuleError("La cuenta cambió de estado.");
    }
    const updated: UserAccessRecord = {
      ...user,
      estado: input.estadoNuevo,
      actualizadoEn: input.ocurridoEn
    };
    this.users.set(updated.usuarioId, updated);
    this.transitions.push(input);
    const sesionesRevocadas = input.revocarSesiones ? this.sesionesVigentes : 0;
    if (input.revocarSesiones) {
      this.sesionesVigentes = 0;
    }
    return {
      usuarioId: input.usuarioId,
      estadoAnterior: input.estadoEsperado,
      estadoNuevo: input.estadoNuevo,
      actualizadoEn: input.ocurridoEn,
      sesionesRevocadas
    };
  }

  async healthCheck(): Promise<void> {}
  async close(): Promise<void> {}
}
