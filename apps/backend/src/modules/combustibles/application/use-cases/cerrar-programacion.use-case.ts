import { NotFoundError } from "../../../../shared/errors/domain-error.js";
import type { CombustiblesSolicitudesRepository } from "../../domain/ports/combustibles-repo.port.js";

export class CerrarProgramacionUseCase {
  constructor(private readonly solicitudes: CombustiblesSolicitudesRepository) {}

  async execute(solicitudId: number): Promise<void> {
    const solicitud = await this.solicitudes.findById(solicitudId);
    if (!solicitud) {
      throw new NotFoundError(`No existe la solicitud con id ${solicitudId}`);
    }
    await this.solicitudes.updateEstado(solicitudId, "cerrada");
  }
}
