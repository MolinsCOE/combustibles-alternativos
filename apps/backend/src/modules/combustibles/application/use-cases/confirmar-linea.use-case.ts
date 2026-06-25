import { NotFoundError } from "../../../../shared/errors/domain-error.js";
import type {
  DiaKey,
  LineaDistribucion,
} from "../../domain/entities/combustibles.js";
import type {
  CombustiblesDistribucionRepository,
  CombustiblesSolicitudesRepository,
} from "../../domain/ports/combustibles-repo.port.js";

const DIAS_KEYS: DiaKey[] = ["dl", "dt", "dc", "dj", "dv", "ds", "dg"];

export type ConfirmarLineaProveedorInput = {
  lineaId: number;
  comentario?: string | null;
  cantidades?: Partial<Record<DiaKey, number>>;
};

export type RechazarLineaInput = {
  lineaId: number;
  motivo: string;
};

export type ConfirmarLineaTransportistaInput = ConfirmarLineaProveedorInput;

export class ConfirmarLineaProveedorUseCase {
  constructor(
    private readonly distribucion: CombustiblesDistribucionRepository,
    private readonly solicitudes: CombustiblesSolicitudesRepository
  ) {}

  async execute(input: ConfirmarLineaProveedorInput): Promise<LineaDistribucion> {
    const lineas = await this.distribucion.findAll();
    const linea = lineas.find((l) => l.id === input.lineaId);
    if (!linea) {
      throw new NotFoundError(`No existe la línea de distribución con id ${input.lineaId}`);
    }

    const cantidadesProveedor: Partial<Record<DiaKey, number>> | null =
      input.cantidades !== undefined
        ? Object.fromEntries(
            DIAS_KEYS.map((k) => {
              const solicitado = input.cantidades![k];
              return [k, solicitado !== undefined ? Math.min(solicitado, linea[k]) : linea[k]];
            })
          )
        : null;

    await this.distribucion.addConfirmacion({
      lineaDistribucionId: input.lineaId,
      parte: "proveedor",
      estado: "confirmada",
      motivo: input.comentario ?? null,
      ts: new Date().toISOString(),
    });

    const updated = await this.distribucion.update(input.lineaId, {
      confirmacionProveedor: "confirmada",
      cantidadesProveedor,
      comentarioProveedor: input.comentario ?? null,
      motivoRechazoProveedor: null,
    });
    if (!updated) throw new NotFoundError(`No existe la línea de distribución con id ${input.lineaId}`);

    // Comprobar si todas las líneas de la solicitud están confirmadas por ambas partes
    await this.checkAndAutoConfirmarSolicitud(linea.solicitudId);

    return updated;
  }

  private async checkAndAutoConfirmarSolicitud(solicitudId: number): Promise<void> {
    const solicitud = await this.solicitudes.findById(solicitudId);
    if (!solicitud || solicitud.estado === "cerrada") return;
    const todasLineas = await this.distribucion.findBySolicitud(solicitudId);
    const todasConfirmadas = todasLineas.every(
      (l) =>
        l.confirmacionProveedor === "confirmada" &&
        l.confirmacionTransportista === "confirmada"
    );
    if (todasConfirmadas) {
      await this.solicitudes.updateEstado(solicitudId, "confirmada");
    }
  }
}

export class RechazarLineaProveedorUseCase {
  constructor(private readonly distribucion: CombustiblesDistribucionRepository) {}

  async execute(input: RechazarLineaInput): Promise<LineaDistribucion> {
    await this.distribucion.addConfirmacion({
      lineaDistribucionId: input.lineaId,
      parte: "proveedor",
      estado: "rechazada",
      motivo: input.motivo,
      ts: new Date().toISOString(),
    });

    const updated = await this.distribucion.update(input.lineaId, {
      confirmacionProveedor: "rechazada",
      motivoRechazoProveedor: input.motivo,
    });
    if (!updated) throw new NotFoundError(`No existe la línea de distribución con id ${input.lineaId}`);
    return updated;
  }
}

export class ConfirmarLineaTransportistaUseCase {
  constructor(
    private readonly distribucion: CombustiblesDistribucionRepository,
    private readonly solicitudes: CombustiblesSolicitudesRepository
  ) {}

  async execute(input: ConfirmarLineaTransportistaInput): Promise<LineaDistribucion> {
    const lineas = await this.distribucion.findAll();
    const linea = lineas.find((l) => l.id === input.lineaId);
    if (!linea) {
      throw new NotFoundError(`No existe la línea de distribución con id ${input.lineaId}`);
    }

    const cantidadesTransportista: Partial<Record<DiaKey, number>> | null =
      input.cantidades !== undefined
        ? Object.fromEntries(
            DIAS_KEYS.map((k) => {
              const solicitado = input.cantidades![k];
              return [k, solicitado !== undefined ? Math.min(solicitado, linea[k]) : linea[k]];
            })
          )
        : null;

    await this.distribucion.addConfirmacion({
      lineaDistribucionId: input.lineaId,
      parte: "transportista",
      estado: "confirmada",
      motivo: input.comentario ?? null,
      ts: new Date().toISOString(),
    });

    const updated = await this.distribucion.update(input.lineaId, {
      confirmacionTransportista: "confirmada",
      cantidadesTransportista,
      comentarioTransportista: input.comentario ?? null,
      motivoRechazoTransportista: null,
    });
    if (!updated) throw new NotFoundError(`No existe la línea de distribución con id ${input.lineaId}`);

    await this.checkAndAutoConfirmarSolicitud(linea.solicitudId);

    return updated;
  }

  private async checkAndAutoConfirmarSolicitud(solicitudId: number): Promise<void> {
    const solicitud = await this.solicitudes.findById(solicitudId);
    if (!solicitud || solicitud.estado === "cerrada") return;
    const todasLineas = await this.distribucion.findBySolicitud(solicitudId);
    const todasConfirmadas = todasLineas.every(
      (l) =>
        l.confirmacionProveedor === "confirmada" &&
        l.confirmacionTransportista === "confirmada"
    );
    if (todasConfirmadas) {
      await this.solicitudes.updateEstado(solicitudId, "confirmada");
    }
  }
}

export class RechazarLineaTransportistaUseCase {
  constructor(private readonly distribucion: CombustiblesDistribucionRepository) {}

  async execute(input: RechazarLineaInput): Promise<LineaDistribucion> {
    await this.distribucion.addConfirmacion({
      lineaDistribucionId: input.lineaId,
      parte: "transportista",
      estado: "rechazada",
      motivo: input.motivo,
      ts: new Date().toISOString(),
    });

    const updated = await this.distribucion.update(input.lineaId, {
      confirmacionTransportista: "rechazada",
      motivoRechazoTransportista: input.motivo,
    });
    if (!updated) throw new NotFoundError(`No existe la línea de distribución con id ${input.lineaId}`);
    return updated;
  }
}
