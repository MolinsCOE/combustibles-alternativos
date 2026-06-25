import {
  NotFoundError,
  ValidationError,
} from "../../../../shared/errors/domain-error.js";
import type { CombustiblesDistribucionRepository } from "../../domain/ports/combustibles-repo.port.js";

export class EliminarLineaDistribucionUseCase {
  constructor(private readonly distribucion: CombustiblesDistribucionRepository) {}

  async execute(id: number): Promise<void> {
    const lineas = await this.distribucion.findAll();
    const linea = lineas.find((l) => l.id === id);
    if (!linea) {
      throw new NotFoundError(`No existe la línea de distribución con id ${id}`);
    }
    if (linea.estado !== "pendiente") {
      throw new ValidationError(
        "Solo se pueden eliminar líneas de distribución pendientes de enviar"
      );
    }
    await this.distribucion.delete(id);
  }
}
