import { NotFoundError } from "../../../../shared/errors/domain-error.js";
import type { LineaDistribucion } from "../../domain/entities/combustibles.js";
import type {
  CombustiblesDistribucionRepository,
  UpdateLineaDistribucionInput,
} from "../../domain/ports/combustibles-repo.port.js";

export class UpdateLineaDistribucionUseCase {
  constructor(private readonly distribucion: CombustiblesDistribucionRepository) {}

  async execute(
    id: number,
    changes: UpdateLineaDistribucionInput
  ): Promise<LineaDistribucion> {
    const updated = await this.distribucion.update(id, changes);
    if (!updated) {
      throw new NotFoundError(`No existe la línea de distribución con id ${id}`);
    }
    return updated;
  }
}
