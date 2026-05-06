import { NotFoundError } from "../../../../shared/errors/domain-error.js";
import type { RoleDetail } from "../../domain/entities/role.js";
import type { RoleRepository } from "../../domain/ports/role-repository.port.js";

export class GetRoleDetailUseCase {
  constructor(private readonly roles: RoleRepository) {}

  async execute(id: string): Promise<RoleDetail> {
    const detail = await this.roles.findDetailById(id);
    if (!detail) {
      throw new NotFoundError(`No se ha encontrado el rol con id ${id}.`);
    }
    return detail;
  }
}
