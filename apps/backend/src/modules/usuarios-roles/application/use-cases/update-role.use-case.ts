import {
  ConflictError,
  NotFoundError,
  ValidationError
} from "../../../../shared/errors/domain-error.js";
import type { Role } from "../../domain/entities/role.js";
import type {
  RoleRepository,
  UpdateRoleInput
} from "../../domain/ports/role-repository.port.js";

export class UpdateRoleUseCase {
  constructor(private readonly roles: RoleRepository) {}

  async execute(id: string, input: UpdateRoleInput): Promise<Role> {
    const existing = await this.roles.findById(id);
    if (!existing) {
      throw new NotFoundError(`No se ha encontrado el rol con id ${id}.`);
    }

    const nombre = input.nombre.trim();
    if (nombre.length === 0) {
      throw new ValidationError("El nombre del rol es obligatorio.");
    }
    const descripcion = normalizeDescription(input.descripcion);

    if (nombre.toLowerCase() !== existing.nombre.toLowerCase()) {
      const duplicate = await this.roles.findByNombre(nombre);
      if (duplicate && duplicate.id !== id) {
        throw new ConflictError(`Ya existe un rol con el nombre "${nombre}".`);
      }
    }

    const updated = await this.roles.update(id, { nombre, descripcion });
    if (!updated) {
      throw new NotFoundError(`No se ha encontrado el rol con id ${id}.`);
    }
    return updated;
  }
}

function normalizeDescription(value: string | null): string | null {
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}
