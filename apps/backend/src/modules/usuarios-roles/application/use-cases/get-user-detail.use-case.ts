import { NotFoundError } from "../../../../shared/errors/domain-error.js";
import type { UserWithRole } from "../../domain/entities/user.js";
import type { UserRepository } from "../../domain/ports/user-repository.port.js";

export class GetUserDetailUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(id: string): Promise<UserWithRole> {
    const detail = await this.users.findByIdWithRole(id);
    if (!detail) {
      throw new NotFoundError(`No se ha encontrado el usuario con id ${id}.`);
    }
    return detail;
  }
}
