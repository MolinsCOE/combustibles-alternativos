import { NotFoundError } from "../../../../shared/errors/domain-error.js";
import type { HorarioLlegada } from "../../domain/entities/combustibles.js";
import type {
  CombustiblesHorarioRepository,
  UpsertHorarioSlotInput,
} from "../../domain/ports/combustibles-repo.port.js";

export class UpsertHorarioSlotUseCase {
  constructor(private readonly repo: CombustiblesHorarioRepository) {}

  async execute(input: UpsertHorarioSlotInput): Promise<HorarioLlegada> {
    return this.repo.upsertSlot(input);
  }
}

export class DeleteHorarioSlotUseCase {
  constructor(private readonly repo: CombustiblesHorarioRepository) {}

  async execute(id: number): Promise<void> {
    const all = await this.repo.findAll();
    if (!all.find((h) => h.id === id)) {
      throw new NotFoundError(`No existe el slot de horario con id ${id}`);
    }
    return this.repo.deleteSlot(id);
  }
}
