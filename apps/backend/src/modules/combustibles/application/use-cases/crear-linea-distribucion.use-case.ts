import { NotFoundError, ValidationError } from "../../../../shared/errors/domain-error.js";
import type { LineaDistribucion } from "../../domain/entities/combustibles.js";
import type {
  CombustiblesDistribucionRepository,
  CombustiblesSolicitudesRepository,
} from "../../domain/ports/combustibles-repo.port.js";

export type CrearLineaDistribucionInput = {
  solicitudId: number;
  lineaSolicitudId: number;
  proveedorId: number;
  proveedorNom: string;
  transportistaId: number;
  transportistaNom: string;
  destino: string;
  dl: number;
  dt: number;
  dc: number;
  dj: number;
  dv: number;
  ds: number;
  dg: number;
};

export class CrearLineaDistribucionUseCase {
  constructor(
    private readonly solicitudes: CombustiblesSolicitudesRepository,
    private readonly distribucion: CombustiblesDistribucionRepository
  ) {}

  async execute(input: CrearLineaDistribucionInput): Promise<LineaDistribucion> {
    const solicitud = await this.solicitudes.findById(input.solicitudId);
    if (!solicitud) {
      throw new NotFoundError(`No existe la solicitud con id ${input.solicitudId}`);
    }
    const lineaSolicitud = solicitud.lineas.find((l) => l.id === input.lineaSolicitudId);
    if (!lineaSolicitud) {
      throw new NotFoundError(
        `No existe la línea de solicitud con id ${input.lineaSolicitudId} en la solicitud ${input.solicitudId}`
      );
    }
    if (solicitud.estado !== "enviada" && solicitud.estado !== "en_distribucion") {
      throw new ValidationError(
        `Solo se pueden crear líneas de distribución para solicitudes enviadas o en distribución. Estado actual: ${solicitud.estado}`
      );
    }

    return this.distribucion.create({
      solicitudId: input.solicitudId,
      lineaSolicitudId: input.lineaSolicitudId,
      materialId: lineaSolicitud.materialId,
      materialNom: lineaSolicitud.materialNom,
      proveedorId: input.proveedorId,
      proveedorNom: input.proveedorNom,
      transportistaId: input.transportistaId,
      transportistaNom: input.transportistaNom,
      destino: input.destino,
      dl: input.dl,
      dt: input.dt,
      dc: input.dc,
      dj: input.dj,
      dv: input.dv,
      ds: input.ds,
      dg: input.dg,
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
  }
}
