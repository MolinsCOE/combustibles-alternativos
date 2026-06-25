import { NotFoundError } from "../../../../shared/errors/domain-error.js";
import type { Solicitud } from "../../domain/entities/combustibles.js";
import type {
  CombustiblesSolicitudesRepository,
  CreateSolicitudInput,
} from "../../domain/ports/combustibles-repo.port.js";

export type GuardarBorradorInput = {
  id?: number;
  semana: string;
  ini: string;
  fi: string;
  creadaPor: string;
  comentarioGeneral: string;
  mantenimientosProgramados: string;
  lineas: CreateSolicitudInput["lineas"];
};

export class GuardarBorradorUseCase {
  constructor(private readonly solicitudes: CombustiblesSolicitudesRepository) {}

  async execute(input: GuardarBorradorInput): Promise<Solicitud> {
    if (input.id !== undefined) {
      const existing = await this.solicitudes.findById(input.id);
      if (!existing) {
        throw new NotFoundError(`No existe la solicitud con id ${input.id}`);
      }
      // Sincroniza líneas: actualiza existentes (por id), inserta nuevas y elimina las quitadas
      await this.solicitudes.syncLineas(input.id, input.lineas);
      await this.solicitudes.updateComentarios(input.id, {
        comentarioGeneral: input.comentarioGeneral,
        mantenimientosProgramados: input.mantenimientosProgramados,
      });
      const updated = await this.solicitudes.findById(input.id);
      if (!updated) throw new NotFoundError(`No existe la solicitud con id ${input.id}`);
      return updated;
    }

    return this.solicitudes.create({
      semana: input.semana,
      ini: input.ini,
      fi: input.fi,
      creadaPor: input.creadaPor,
      estado: "borrador",
      comentarioGeneral: input.comentarioGeneral,
      mantenimientosProgramados: input.mantenimientosProgramados,
      lineas: input.lineas,
    });
  }
}
