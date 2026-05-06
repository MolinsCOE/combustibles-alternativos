import {
  ConflictError,
  NotFoundError,
  ValidationError
} from "../../../../shared/errors/domain-error.js";
import type { User } from "../../domain/entities/user.js";
import type {
  UpdateUserInput,
  UserRepository
} from "../../domain/ports/user-repository.port.js";
import type { RoleRepository } from "../../domain/ports/role-repository.port.js";

export class UpdateUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly roles: RoleRepository
  ) {}

  async execute(id: string, input: UpdateUserInput): Promise<User> {
    const existing = await this.users.findById(id);
    if (!existing) {
      throw new NotFoundError(`No se ha encontrado el usuario con id ${id}.`);
    }

    const nombre = input.nombre.trim();
    if (nombre.length === 0) {
      throw new ValidationError("El nombre del usuario es obligatorio.");
    }
    const email = input.email.trim().toLowerCase();
    if (email.length === 0) {
      throw new ValidationError("El email del usuario es obligatorio.");
    }

    const role = await this.roles.findById(input.rolId);
    if (!role) {
      throw new ValidationError("El rol seleccionado no existe.");
    }

    if (email !== existing.email.toLowerCase()) {
      const duplicate = await this.users.findByEmail(email);
      if (duplicate && duplicate.id !== id) {
        throw new ConflictError(
          `Ya existe un usuario con el email "${email}".`
        );
      }
    }

    const updated = await this.users.update(id, {
      nombre,
      email,
      rolId: input.rolId,
      activo: input.activo
    });
    if (!updated) {
      throw new NotFoundError(`No se ha encontrado el usuario con id ${id}.`);
    }
    return updated;
  }
}
