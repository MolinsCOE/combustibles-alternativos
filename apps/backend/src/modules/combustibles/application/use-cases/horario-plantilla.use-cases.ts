import { NotFoundError } from "../../../../shared/errors/domain-error.js";
import type { HorarioPlantillaSlot } from "../../domain/entities/combustibles.js";
import type {
  CombustiblesHorarioPlantillaRepository,
  CombustiblesHorarioRepository,
  UpsertHorarioPlantillaSlotInput,
} from "../../domain/ports/combustibles-repo.port.js";

export class UpsertHorarioPlantillaSlotUseCase {
  constructor(private readonly repo: CombustiblesHorarioPlantillaRepository) {}

  async execute(input: UpsertHorarioPlantillaSlotInput): Promise<HorarioPlantillaSlot> {
    return this.repo.upsertSlot(input);
  }
}

export class DeleteHorarioPlantillaSlotUseCase {
  constructor(private readonly repo: CombustiblesHorarioPlantillaRepository) {}

  async execute(id: number): Promise<void> {
    const all = await this.repo.findAll();
    if (!all.find((h) => h.id === id)) {
      throw new NotFoundError(`No existe el slot de plantilla con id ${id}`);
    }
    return this.repo.deleteSlot(id);
  }
}

export class CopyHorarioPlantillaToSolicitudUseCase {
  constructor(
    private readonly plantilla: CombustiblesHorarioPlantillaRepository,
    private readonly horario: CombustiblesHorarioRepository
  ) {}

  async execute(solicitudId: number): Promise<void> {
    const existing = await this.horario.findBySolicitud(solicitudId);
    if (existing.length > 0) return; // ya tiene horario, no sobreescribir

    const slots = await this.plantilla.findAll();
    await Promise.all(
      slots.map((s) =>
        this.horario.upsertSlot({
          solicitudId,
          dia: s.dia,
          franja: s.franja,
          silo: s.silo,
          materialNom: s.materialNom,
        })
      )
    );
  }
}
