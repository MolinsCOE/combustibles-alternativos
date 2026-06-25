import type { PlantillaDistribucion } from "../../domain/entities/combustibles.js";
import type { CombustiblesPlantillaRepository } from "../../domain/ports/combustibles-repo.port.js";

// ---------------------------------------------------------------------------
// GetPlantillaDistribucionUseCase
// ---------------------------------------------------------------------------

export class GetPlantillaDistribucionUseCase {
  constructor(private readonly plantilla: CombustiblesPlantillaRepository) {}

  async execute(): Promise<PlantillaDistribucion[]> {
    return this.plantilla.findActive();
  }
}

// ---------------------------------------------------------------------------
// CreatePlantillaDistribucionUseCase
// ---------------------------------------------------------------------------

export type CreatePlantillaInput = {
  materialId: number;
  materialNom: string;
  destino: string;
};

export class CreatePlantillaDistribucionUseCase {
  constructor(private readonly plantilla: CombustiblesPlantillaRepository) {}

  async execute(input: CreatePlantillaInput): Promise<PlantillaDistribucion> {
    return this.plantilla.create(input);
  }
}

// ---------------------------------------------------------------------------
// DeletePlantillaDistribucionUseCase
// ---------------------------------------------------------------------------

export class DeletePlantillaDistribucionUseCase {
  constructor(private readonly plantilla: CombustiblesPlantillaRepository) {}

  async execute(id: number): Promise<void> {
    return this.plantilla.delete(id);
  }
}
