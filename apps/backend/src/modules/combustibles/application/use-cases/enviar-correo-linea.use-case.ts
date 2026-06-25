import { NotFoundError } from "../../../../shared/errors/domain-error.js";
import type { LineaDistribucion } from "../../domain/entities/combustibles.js";
import type { CombustiblesDistribucionRepository } from "../../domain/ports/combustibles-repo.port.js";

export class EnviarCorreoLineaUseCase {
  constructor(private readonly distribucion: CombustiblesDistribucionRepository) {}

  async execute(lineaId: number): Promise<LineaDistribucion> {
    const updated = await this.distribucion.update(lineaId, {
      estado: "enviada",
      correoEnviadoEn: new Date().toISOString(),
    });
    if (!updated) {
      throw new NotFoundError(`No existe la línea de distribución con id ${lineaId}`);
    }
    return updated;
  }
}

export class EnviarCorreoTransportistaLineaUseCase {
  constructor(private readonly distribucion: CombustiblesDistribucionRepository) {}

  async execute(lineaId: number): Promise<LineaDistribucion> {
    const updated = await this.distribucion.update(lineaId, {
      correoTransportistaEnviadoEn: new Date().toISOString(),
    });
    if (!updated) {
      throw new NotFoundError(`No existe la línea de distribución con id ${lineaId}`);
    }
    return updated;
  }
}
