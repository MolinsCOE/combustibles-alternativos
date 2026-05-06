import type { PaginatedList, PaginationParams } from "../../domain/entities/pagination.js";
import type { UserWithRole } from "../../domain/entities/user.js";
import type { UserRepository } from "../../domain/ports/user-repository.port.js";

export class ListUsersUseCase {
  constructor(private readonly users: UserRepository) {}

  execute(params: PaginationParams): Promise<PaginatedList<UserWithRole>> {
    return this.users.list(params);
  }
}
