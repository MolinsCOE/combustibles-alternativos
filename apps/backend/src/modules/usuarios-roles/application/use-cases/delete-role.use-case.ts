import { ConflictError, NotFoundError } from "../../../../shared/errors/domain-error.js";
import type { RoleRepository } from "../../domain/ports/role-repository.port.js";

/**
 * Deletes a role only if it has no users assigned.
 * Application-level validation returns a clear `ConflictError` before the
 * DB FK restriction kicks in.
 */
export class DeleteRoleUseCase {
  constructor(private readonly roles: RoleRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.roles.findById(id);
    if (!existing) {
      throw new NotFoundError(`No se ha encontrado el rol con id ${id}.`);
    }

    const users = await this.roles.countUsers(id);
    if (users > 0) {
      const plural = users === 1 ? "1 usuario asignado" : `${users} usuarios asignados`;
      throw new ConflictError(
        `No se puede eliminar el rol porque tiene ${plural}. Reasigna o elimina esos usuarios primero.`
      );
    }

    await this.roles.delete(id);
  }
}
