import {
  NotFoundError,
  ValidationError,
} from "../../../../shared/errors/domain-error.js";
import type { Solicitud } from "../../domain/entities/combustibles.js";
import type {
  CombustiblesHorarioPlantillaRepository,
  CombustiblesHorarioRepository,
  CombustiblesSolicitudesRepository,
} from "../../domain/ports/combustibles-repo.port.js";

export class IniciarDistribucionUseCase {
  constructor(
    private readonly solicitudes: CombustiblesSolicitudesRepository,
    private readonly horario: CombustiblesHorarioRepository,
    private readonly horarioPlantilla: CombustiblesHorarioPlantillaRepository
  ) {}

  async execute(solicitudId: number): Promise<Solicitud> {
    const solicitud = await this.solicitudes.findById(solicitudId);
    if (!solicitud) {
      throw new NotFoundError(`No existe la solicitud con id ${solicitudId}`);
    }
    if (solicitud.estado !== "enviada") {
      throw new ValidationError(
        `Solo se puede iniciar distribución de solicitudes enviadas. Estado actual: ${solicitud.estado}`
      );
    }

    await this.solicitudes.updateEstado(solicitudId, "en_distribucion");

    // Copiar plantilla de horario si la semana aún no tiene horario asignado
    const existente = await this.horario.findBySolicitud(solicitudId);
    if (existente.length === 0) {
      const slots = await this.horarioPlantilla.findAll();
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

    const updated = await this.solicitudes.findById(solicitudId);
    if (!updated) {
      throw new NotFoundError(`No existe la solicitud con id ${solicitudId}`);
    }
    return updated;
  }
}
