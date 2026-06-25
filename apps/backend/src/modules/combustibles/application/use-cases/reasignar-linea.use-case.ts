import { NotFoundError } from "../../../../shared/errors/domain-error.js";
import type { LineaDistribucion } from "../../domain/entities/combustibles.js";
import type {
  CombustiblesDistribucionRepository,
  CombustiblesSolicitudesRepository,
} from "../../domain/ports/combustibles-repo.port.js";

export type ReasignarLineaInput = {
  solicitudId: number;
  lineaId: number;
  proveedorId?: number;
  proveedorNom?: string;
  transportistaId?: number;
  transportistaNom?: string;
  motivo: string;
};

export class ReasignarLineaDistribucionUseCase {
  constructor(
    private readonly distribucion: CombustiblesDistribucionRepository,
    private readonly solicitudes: CombustiblesSolicitudesRepository
  ) {}

  async execute(input: ReasignarLineaInput): Promise<LineaDistribucion> {
    const lineas = await this.distribucion.findAll();
    const linea = lineas.find((l) => l.id === input.lineaId);
    if (!linea) {
      throw new NotFoundError(
        `No existe la línea de distribución con id ${input.lineaId}`
      );
    }

    const reasignaProveedor = input.proveedorId !== undefined;
    const reasignaTransportista = input.transportistaId !== undefined;

    const provNom = reasignaProveedor
      ? (input.proveedorNom ?? linea.proveedorNom)
      : linea.proveedorNom;
    const transNom = reasignaTransportista
      ? (input.transportistaNom ?? linea.transportistaNom)
      : linea.transportistaNom;

    const partes: string[] = [];
    if (reasignaProveedor) {
      partes.push(`Proveedor: ${linea.proveedorNom || "—"} → ${provNom}`);
    }
    if (reasignaTransportista) {
      partes.push(`Transportista: ${linea.transportistaNom || "—"} → ${transNom}`);
    }
    const descripcion = `${linea.materialNom}: ${partes.join(", ")}`;

    await this.distribucion.update(input.lineaId, {
      ...(reasignaProveedor && {
        proveedorId: input.proveedorId,
        proveedorNom: provNom,
        confirmacionProveedor: "pendiente",
      }),
      ...(reasignaTransportista && {
        transportistaId: input.transportistaId,
        transportistaNom: transNom,
        confirmacionTransportista: "pendiente",
      }),
    });

    await this.solicitudes.addHistorial(input.solicitudId, {
      ts: new Date().toISOString(),
      autor: "compras",
      motivo: input.motivo,
      descripcion,
    });

    const updated = await this.distribucion.findAll().then((ls) =>
      ls.find((l) => l.id === input.lineaId) ?? null
    );
    if (!updated) throw new NotFoundError(`No existe la línea de distribución con id ${input.lineaId}`);
    return updated;
  }
}
