import type { CaEstadoCompleto } from "../../domain/entities/combustibles.js";
import type { CombustiblesReadRepository } from "../../domain/ports/combustibles-repo.port.js";

export class GetEstadoCompletoUseCase {
  constructor(private readonly repo: CombustiblesReadRepository) {}

  async execute(): Promise<CaEstadoCompleto> {
    return this.repo.getEstadoCompleto();
  }
}
