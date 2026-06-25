import {
  NotFoundError,
  ValidationError,
} from "../../../../shared/errors/domain-error.js";
import type { LineaDistribucion } from "../../domain/entities/combustibles.js";
import type {
  CombustiblesAsignacionesRepository,
  CombustiblesDistribucionRepository,
  CombustiblesProveedoresRepository,
  CombustiblesSolicitudesRepository,
} from "../../domain/ports/combustibles-repo.port.js";

const DIAS = ["dl", "dt", "dc", "dj", "dv", "ds", "dg"] as const;

export class AplicarRepartoAutomaticoUseCase {
  constructor(
    private readonly solicitudes: CombustiblesSolicitudesRepository,
    private readonly distribucion: CombustiblesDistribucionRepository,
    private readonly asignaciones: CombustiblesAsignacionesRepository,
    private readonly proveedores: CombustiblesProveedoresRepository
  ) {}

  async execute(solicitudId: number, lineaSolicitudId: number): Promise<LineaDistribucion[]> {
    const solicitud = await this.solicitudes.findById(solicitudId);
    if (!solicitud) {
      throw new NotFoundError(`No existe la solicitud con id ${solicitudId}`);
    }
    if (solicitud.estado !== "enviada" && solicitud.estado !== "en_distribucion") {
      throw new ValidationError(
        `Solo se puede aplicar reparto automático en solicitudes enviadas o en distribución. Estado actual: ${solicitud.estado}`
      );
    }
    const linea = solicitud.lineas.find((l) => l.id === lineaSolicitudId);
    if (!linea) {
      throw new NotFoundError(
        `No existe la línea de solicitud con id ${lineaSolicitudId} en la solicitud ${solicitudId}`
      );
    }

    const lineasExistentes = await this.distribucion.findBySolicitud(solicitudId);
    const yaTieneLineas = lineasExistentes.some((l) => l.lineaSolicitudId === lineaSolicitudId);
    if (yaTieneLineas) {
      throw new ValidationError(
        `El material "${linea.materialNom}" ya tiene líneas de distribución asignadas.`
      );
    }

    const [todasAsignaciones, todosProveedores] = await Promise.all([
      this.asignaciones.findAll(),
      this.proveedores.findAll(),
    ]);

    const asignacionesMaterial = todasAsignaciones.filter((a) => a.materialId === linea.materialId);
    if (asignacionesMaterial.length === 0) {
      throw new ValidationError(
        `No hay asignaciones configuradas para el material "${linea.materialNom}". Usa asignación manual.`
      );
    }

    const proveedorMap = new Map(todosProveedores.map((p) => [p.id, p.nom]));
    const totalPct = asignacionesMaterial.reduce((sum, a) => sum + a.pct, 0);
    const lineasCreadas: LineaDistribucion[] = [];

    for (const asig of asignacionesMaterial) {
      const factor = totalPct > 0 ? asig.pct / totalPct : 0;
      const cantidades = Object.fromEntries(
        DIAS.map((d) => [d, Math.round(linea[d] * factor)])
      ) as Record<typeof DIAS[number], number>;

      const destino = linea.destino ?? "";

      const lineaDist = await this.distribucion.create({
        solicitudId,
        lineaSolicitudId: linea.id,
        materialId: linea.materialId,
        materialNom: linea.materialNom,
        proveedorId: asig.proveedorId,
        proveedorNom: proveedorMap.get(asig.proveedorId) ?? String(asig.proveedorId),
        transportistaId: asig.transportistaId,
        transportistaNom: proveedorMap.get(asig.transportistaId) ?? String(asig.transportistaId),
        destino,
        ...cantidades,
        estado: "pendiente",
        confirmacionProveedor: "pendiente",
        confirmacionTransportista: "pendiente",
        cantidadesProveedor: null,
        comentarioProveedor: null,
        cantidadesTransportista: null,
        comentarioTransportista: null,
        motivoRechazoProveedor: null,
        motivoRechazoTransportista: null,
        correoEnviadoEn: null,
        correoTransportistaEnviadoEn: null,
      });
      lineasCreadas.push(lineaDist);
    }

    return lineasCreadas;
  }
}
