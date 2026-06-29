import { NotFoundError } from "../../../../shared/errors/domain-error.js";
import type {
  ComparativaDia,
  ComparativaLinea,
  DiaKey,
} from "../../domain/entities/combustibles.js";
import type {
  CombustiblesDistribucionRepository,
  CombustiblesSolicitudesRepository,
} from "../../domain/ports/combustibles-repo.port.js";
import type { ProsegurEntriesRepository } from "../../domain/ports/prosegur-repo.port.js";

const DIAS_KEYS: DiaKey[] = ["dl", "dt", "dc", "dj", "dv", "ds", "dg"];

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export class GetComparativaUseCase {
  constructor(
    private readonly solicitudes: CombustiblesSolicitudesRepository,
    private readonly distribucion: CombustiblesDistribucionRepository,
    private readonly prosegurEntries: ProsegurEntriesRepository
  ) {}

  async execute(solicitudId: number): Promise<ComparativaLinea[]> {
    const solicitud = await this.solicitudes.findById(solicitudId);
    if (!solicitud) {
      throw new NotFoundError(`Solicitud ${solicitudId} no encontrada`);
    }

    const [lineas, prosegurSummary] = await Promise.all([
      this.distribucion.findBySolicitud(solicitudId),
      this.prosegurEntries.getWeeklySummary(solicitud.ini, solicitud.fi),
    ]);

    // dia → fecha
    const diaToFecha: Record<DiaKey, string> = {
      dl: addDays(solicitud.ini, 0),
      dt: addDays(solicitud.ini, 1),
      dc: addDays(solicitud.ini, 2),
      dj: addDays(solicitud.ini, 3),
      dv: addDays(solicitud.ini, 4),
      ds: addDays(solicitud.ini, 5),
      dg: addDays(solicitud.ini, 6),
    };

    // Prosegur real: key = `${materialId}-${proveedorId}-${fecha}` → count
    const realMap = new Map<string, number>();
    for (const entry of prosegurSummary) {
      const key = `${entry.mappedMaterialId}-${entry.mappedProveedorId}-${entry.fecha}`;
      realMap.set(key, (realMap.get(key) ?? 0) + entry.count);
    }

    // Agrupar lineas por material+proveedor y sumar cantidades por día
    type GroupKey = `${number}-${number}`;
    const grouped = new Map<
      GroupKey,
      {
        materialId: number;
        materialNom: string;
        proveedorId: number;
        proveedorNom: string;
        dias: Record<DiaKey, number>;
      }
    >();

    for (const linea of lineas) {
      const key: GroupKey = `${linea.materialId}-${linea.proveedorId}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          materialId: linea.materialId,
          materialNom: linea.materialNom,
          proveedorId: linea.proveedorId,
          proveedorNom: linea.proveedorNom,
          dias: { dl: 0, dt: 0, dc: 0, dj: 0, dv: 0, ds: 0, dg: 0 },
        });
      }
      const g = grouped.get(key)!;
      for (const d of DIAS_KEYS) {
        g.dias[d] += linea[d];
      }
    }

    // Construir respuesta
    const result: ComparativaLinea[] = [];
    for (const g of grouped.values()) {
      const dias: ComparativaDia[] = DIAS_KEYS.map((dia) => {
        const fecha = diaToFecha[dia];
        const real =
          realMap.get(`${g.materialId}-${g.proveedorId}-${fecha}`) ?? 0;
        return {
          fecha,
          diaKey: dia,
          planificado: g.dias[dia],
          real,
          desviacion: real - g.dias[dia],
        };
      });

      result.push({
        materialId: g.materialId,
        materialNom: g.materialNom,
        proveedorId: g.proveedorId,
        proveedorNom: g.proveedorNom,
        dias,
        totalPlanificado: DIAS_KEYS.reduce((s, d) => s + g.dias[d], 0),
        totalReal: dias.reduce((s, d) => s + d.real, 0),
      });
    }

    return result.sort((a, b) => a.materialNom.localeCompare(b.materialNom));
  }
}
