import type { PaginatedList, PaginationParams } from "../../domain/entities/pagination.js";
import type { RoleWithUserCount } from "../../domain/entities/role.js";
import type { RoleRepository } from "../../domain/ports/role-repository.port.js";

export class ListRolesUseCase {
  constructor(private readonly roles: RoleRepository) {}

  execute(params: PaginationParams): Promise<PaginatedList<RoleWithUserCount>> {
    return this.roles.list(params);
  }
}
