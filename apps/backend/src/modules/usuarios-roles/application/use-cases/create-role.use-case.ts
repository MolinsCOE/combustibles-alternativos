import { ConflictError, ValidationError } from "../../../../shared/errors/domain-error.js";
import type { Role } from "../../domain/entities/role.js";
import type {
  CreateRoleInput,
  RoleRepository
} from "../../domain/ports/role-repository.port.js";

/**
 * Creates a new role enforcing the unique-name business rule.
 * Returns a clear `ConflictError` before the DB-level unique index fires,
 * so the error middleware can return a useful message to the client.
 */
export class CreateRoleUseCase {
  constructor(private readonly roles: RoleRepository) {}

  async execute(input: CreateRoleInput): Promise<Role> {
    const nombre = input.nombre.trim();
    if (nombre.length === 0) {
      throw new ValidationError("El nombre del rol es obligatorio.");
    }
    const descripcion = normalizeDescription(input.descripcion);

    const duplicate = await this.roles.findByNombre(nombre);
    if (duplicate) {
      throw new ConflictError(`Ya existe un rol con el nombre "${nombre}".`);
    }

    return this.roles.create({ nombre, descripcion });
  }
}

function normalizeDescription(value: string | null): string | null {
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}
