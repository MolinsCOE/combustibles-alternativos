import {
  NotFoundError,
  ValidationError,
} from "../../../../shared/errors/domain-error.js";
import type { Solicitud } from "../../domain/entities/combustibles.js";
import type {
  CombustiblesSolicitudesRepository,
  CreateSolicitudInput,
} from "../../domain/ports/combustibles-repo.port.js";

export type EnviarSolicitudInput = {
  id?: number;
  semana: string;
  ini: string;
  fi: string;
  creadaPor: string;
  comentarioGeneral: string;
  mantenimientosProgramados: string;
  lineas: CreateSolicitudInput["lineas"];
};

export class EnviarSolicitudUseCase {
  constructor(private readonly solicitudes: CombustiblesSolicitudesRepository) {}

  async execute(input: EnviarSolicitudInput): Promise<Solicitud> {
    if (input.id !== undefined) {
      const existing = await this.solicitudes.findById(input.id);
      if (!existing) {
        throw new NotFoundError(`No existe la solicitud con id ${input.id}`);
      }
      if (existing.estado !== "borrador") {
        throw new ValidationError(
          `Solo se puede enviar una solicitud en estado borrador. Estado actual: ${existing.estado}`
        );
      }
      await this.solicitudes.syncLineas(input.id, input.lineas);
      await this.solicitudes.updateComentarios(input.id, {
        comentarioGeneral: input.comentarioGeneral,
        mantenimientosProgramados: input.mantenimientosProgramados,
      });
      await this.solicitudes.updateEstado(input.id, "enviada");
      const updated = await this.solicitudes.findById(input.id);
      if (!updated) throw new NotFoundError(`No existe la solicitud con id ${input.id}`);
      return updated;
    }

    // Crear directamente como enviada
    const creada = await this.solicitudes.create({
      semana: input.semana,
      ini: input.ini,
      fi: input.fi,
      creadaPor: input.creadaPor,
      estado: "enviada",
      comentarioGeneral: input.comentarioGeneral,
      mantenimientosProgramados: input.mantenimientosProgramados,
      lineas: input.lineas,
    });
    return creada;
  }
}
