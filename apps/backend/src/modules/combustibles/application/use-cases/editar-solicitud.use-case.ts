import { NotFoundError } from "../../../../shared/errors/domain-error.js";
import type { Solicitud } from "../../domain/entities/combustibles.js";
import type {
  CombustiblesDistribucionRepository,
  CombustiblesSolicitudesRepository,
} from "../../domain/ports/combustibles-repo.port.js";

export type EditarSolicitudInput = {
  solicitudId: number;
  lineas: Array<{
    id: number;
    dl: number;
    dt: number;
    dc: number;
    dj: number;
    dv: number;
    ds: number;
    dg: number;
    destino?: string;
  }>;
  motivo: string;
  comentarioGeneral?: string;
  mantenimientosProgramados?: string;
};

const DIAS = ["dl", "dt", "dc", "dj", "dv", "ds", "dg"] as const;
const DIAS_ABR = ["L", "M", "X", "J", "V", "S", "D"] as const;

export class EditarSolicitudUseCase {
  constructor(
    private readonly solicitudes: CombustiblesSolicitudesRepository,
    private readonly distribucion: CombustiblesDistribucionRepository
  ) {}

  async execute(input: EditarSolicitudInput): Promise<Solicitud> {
    const solicitud = await this.solicitudes.findById(input.solicitudId);
    if (!solicitud) {
      throw new NotFoundError(
        `No existe la solicitud con id ${input.solicitudId}`
      );
    }

    // Identificar qué líneas cambiaron y cuáles no
    const lineasModificadas: number[] = [];
    const detallesCambios: string[] = [];

    for (const nuevaLinea of input.lineas) {
      const viejaLinea = solicitud.lineas.find((l) => l.id === nuevaLinea.id);
      if (!viejaLinea) continue;

      const cambiosDia = DIAS.flatMap((k, i) =>
        viejaLinea[k] !== nuevaLinea[k]
          ? [`${DIAS_ABR[i]}: ${viejaLinea[k]}→${nuevaLinea[k]}`]
          : []
      );
      const cambioDestino =
        nuevaLinea.destino !== undefined && nuevaLinea.destino !== viejaLinea.destino
          ? [`Destino: ${viejaLinea.destino}→${nuevaLinea.destino}`]
          : [];
      const cambios = [...cambiosDia, ...cambioDestino];

      if (cambios.length > 0) {
        lineasModificadas.push(nuevaLinea.id);
        detallesCambios.push(`${viejaLinea.materialNom} (${cambios.join(", ")})`);
      }
    }

    const descripcion =
      detallesCambios.length > 0
        ? detallesCambios.join(" | ")
        : "Sin cambios en cantidades";

    // Actualizar líneas
    await this.solicitudes.updateLineas(input.solicitudId, input.lineas);

    // Añadir historial
    await this.solicitudes.addHistorial(input.solicitudId, {
      ts: new Date().toISOString(),
      autor: "produccion",
      motivo: input.motivo,
      descripcion,
    });

    // Resetear confirmaciones solo de las líneas que cambiaron
    if (lineasModificadas.length > 0) {
      await this.distribucion.resetConfirmacionesByLineaSolicitudIds(lineasModificadas);
    }

    // Actualizar comentarios si se proporcionaron
    if (input.comentarioGeneral !== undefined || input.mantenimientosProgramados !== undefined) {
      await this.solicitudes.updateComentarios(input.solicitudId, {
        comentarioGeneral: input.comentarioGeneral ?? solicitud.comentarioGeneral,
        mantenimientosProgramados: input.mantenimientosProgramados ?? solicitud.mantenimientosProgramados,
      });
    }

    const updated = await this.solicitudes.findById(input.solicitudId);
    if (!updated) {
      throw new NotFoundError(
        `No existe la solicitud con id ${input.solicitudId}`
      );
    }
    return updated;
  }
}
