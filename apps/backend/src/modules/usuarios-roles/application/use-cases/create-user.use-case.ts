import {
  ConflictError,
  ValidationError
} from "../../../../shared/errors/domain-error.js";
import type { User } from "../../domain/entities/user.js";
import type {
  CreateUserInput,
  UserRepository
} from "../../domain/ports/user-repository.port.js";
import type { RoleRepository } from "../../domain/ports/role-repository.port.js";

/**
 * Creates a new user enforcing the unique-email rule and validating that
 * the selected rol exists. Returns clear domain errors before any DB-level
 * constraint fires, so the client gets actionable messages.
 */
export class CreateUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly roles: RoleRepository
  ) {}

  async execute(input: CreateUserInput): Promise<User> {
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

    const duplicate = await this.users.findByEmail(email);
    if (duplicate) {
      throw new ConflictError(
        `Ya existe un usuario con el email "${email}".`
      );
    }

    return this.users.create({
      nombre,
      email,
      rolId: input.rolId,
      activo: input.activo
    });
  }
}
