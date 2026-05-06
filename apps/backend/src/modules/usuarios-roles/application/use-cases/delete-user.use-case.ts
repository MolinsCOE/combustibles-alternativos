import { NotFoundError } from "../../../../shared/errors/domain-error.js";
import type { UserRepository } from "../../domain/ports/user-repository.port.js";

export class DeleteUserUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.users.findById(id);
    if (!existing) {
      throw new NotFoundError(`No se ha encontrado el usuario con id ${id}.`);
    }
    await this.users.delete(id);
  }
}
