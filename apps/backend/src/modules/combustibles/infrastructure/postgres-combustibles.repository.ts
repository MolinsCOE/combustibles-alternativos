import { eq, inArray } from "drizzle-orm";
import type { Db } from "../../../shared/infrastructure/db/client.js";
import type {
  Asignacion,
  CaEstadoCompleto,
  CambioHistorial,
  Confirmacion,
  CreatePlantillaDistribucionInput,
  Destino,
  EntradaReal,
  EstadoSolicitud,
  HorarioLlegada,
  HorarioPlantillaSlot,
  LineaDistribucion,
  LineaSolicitud,
  Material,
  PlantillaDistribucion,
  Proveedor,
  Solicitud,
} from "../domain/entities/combustibles.js";
import type {
  CombustiblesAsignacionesRepository,
  CombustiblesDestinosRepository,
  CombustiblesDistribucionRepository,
  CombustiblesEntradasRepository,
  CombustiblesHorarioPlantillaRepository,
  CombustiblesHorarioRepository,
  CombustiblesMaterialesRepository,
  CombustiblesPlantillaRepository,
  CombustiblesProveedoresRepository,
  CombustiblesReadRepository,
  CombustiblesSeedRepository,
  CombustiblesSolicitudesRepository,
  CreateAsignacionInput,
  CreateDestinoInput,
  CreateEntradaRealInput,
  CreateLineaDistribucionInput,
  CreateMaterialInput,
  CreateProveedorInput,
  CreateSolicitudInput,
  SeedDatos,
  SyncLineasInput,
  UpdateLineaDistribucionInput,
  UpdateLineasInput,
  UpdateProveedorInput,
  UpsertHorarioPlantillaSlotInput,
  UpsertHorarioSlotInput,
} from "../domain/ports/combustibles-repo.port.js";
import {
  caAsignacionesTable,
  caConfirmacionesTable,
  caDestinosTable,
  caEntradasRealesTable,
  caHistorialSolicitudTable,
  caHorarioLlegadasTable,
  caHorarioPlantillaTable,
  caLineasDistribucionTable,
  caLineasSolicitudTable,
  caMaterialesTable,
  caPlantillaDistribucionTable,
  caProveedoresTable,
  caSolicitudesTable,
  type CaAsignacionRow,
  type CaConfirmacionRow,
  type CaDestinoRow,
  type CaEntradaRealRow,
  type CaHistorialSolicitudRow,
  type CaHorarioLlegadaRow,
  type CaHorarioPlantillaRow,
  type CaLineaDistribucionRow,
  type CaLineaSolicitudRow,
  type CaMaterialRow,
  type CaPlantillaDistribucionRow,
  type CaProveedorRow,
  type CaSolicitudRow,
} from "./db/combustibles.schema.js";

// ---------------------------------------------------------------------------
// Row → entity mappers
// ---------------------------------------------------------------------------

function toDestino(row: CaDestinoRow): Destino {
  return { id: row.id, nom: row.nom, activo: row.activo };
}

function toMaterial(row: CaMaterialRow): Material {
  return { id: row.id, nom: row.nom, activo: row.activo };
}

function toProveedor(row: CaProveedorRow): Proveedor {
  return {
    id: row.id,
    nom: row.nom,
    tipus: row.tipus,
    emails: row.emails as string[],
    bcc: row.bcc as string[],
    activo: row.activo,
  };
}

function toAsignacion(row: CaAsignacionRow): Asignacion {
  return {
    id: row.id,
    materialId: row.materialId,
    proveedorId: row.proveedorId,
    transportistaId: row.transportistaId,
    pct: row.pct,
  };
}

function toPlantilla(row: CaPlantillaDistribucionRow): PlantillaDistribucion {
  return {
    id: row.id,
    materialId: row.materialId,
    materialNom: row.materialNom,
    destino: row.destino,
    activo: row.activo,
    createdAt: row.createdAt.toISOString(),
  };
}

function toLineaSolicitud(row: CaLineaSolicitudRow): LineaSolicitud {
  return {
    id: row.id,
    solicitudId: row.solicitudId,
    materialId: row.materialId,
    materialNom: row.materialNom,
    dl: row.dl,
    dt: row.dt,
    dc: row.dc,
    dj: row.dj,
    dv: row.dv,
    ds: row.ds,
    dg: row.dg,
    destino: row.destino,
    obs: row.obs,
  };
}

function toHistorial(row: CaHistorialSolicitudRow): CambioHistorial {
  return {
    id: row.id,
    solicitudId: row.solicitudId,
    ts: row.ts.toISOString(),
    autor: row.autor,
    motivo: row.motivo,
    descripcion: row.descripcion,
  };
}

function toSolicitud(
  row: CaSolicitudRow,
  lineas: LineaSolicitud[],
  historial: CambioHistorial[]
): Solicitud {
  return {
    id: row.id,
    semana: row.semana,
    ini: row.ini,
    fi: row.fi,
    creadaPor: row.creadaPor,
    estado: row.estado,
    comentarioGeneral: row.comentarioGeneral,
    mantenimientosProgramados: row.mantenimientosProgramados,
    ts: row.ts.toISOString(),
    lineas,
    historial,
  };
}

function toLineaDistribucion(row: CaLineaDistribucionRow): LineaDistribucion {
  return {
    id: row.id,
    solicitudId: row.solicitudId,
    lineaSolicitudId: row.lineaSolicitudId,
    materialId: row.materialId,
    materialNom: row.materialNom,
    proveedorId: row.proveedorId,
    proveedorNom: row.proveedorNom,
    transportistaId: row.transportistaId,
    transportistaNom: row.transportistaNom,
    destino: row.destino,
    dl: row.dl,
    dt: row.dt,
    dc: row.dc,
    dj: row.dj,
    dv: row.dv,
    ds: row.ds,
    dg: row.dg,
    estado: row.estado,
    confirmacionProveedor: row.confirmacionProveedor,
    confirmacionTransportista: row.confirmacionTransportista,
    cantidadesProveedor:
      (row.cantidadesProveedor as Record<string, number> | null) ?? null,
    comentarioProveedor: row.comentarioProveedor ?? null,
    cantidadesTransportista:
      (row.cantidadesTransportista as Record<string, number> | null) ?? null,
    comentarioTransportista: row.comentarioTransportista ?? null,
    motivoRechazoProveedor: row.motivoRechazoProveedor ?? null,
    motivoRechazoTransportista: row.motivoRechazoTransportista ?? null,
    correoEnviadoEn: row.correoEnviadoEn?.toISOString() ?? null,
    correoTransportistaEnviadoEn:
      row.correoTransportistaEnviadoEn?.toISOString() ?? null,
  };
}

function toConfirmacion(row: CaConfirmacionRow): Confirmacion {
  return {
    id: row.id,
    lineaDistribucionId: row.lineaDistribucionId,
    parte: row.parte,
    estado: row.estado,
    motivo: row.motivo ?? null,
    ts: row.ts.toISOString(),
  };
}

function toEntradaReal(row: CaEntradaRealRow): EntradaReal {
  return {
    id: row.id,
    solicitudId: row.solicitudId ?? null,
    fecha: row.fecha,
    materialId: row.materialId,
    materialNom: row.materialNom,
    proveedorId: row.proveedorId,
    proveedorNom: row.proveedorNom,
    transportistaId: row.transportistaId,
    transportistaNom: row.transportistaNom,
    viajes: row.viajes,
    destino: row.destino,
    obs: row.obs,
  };
}

// ---------------------------------------------------------------------------
// Repository implementations
// ---------------------------------------------------------------------------

export class PostgresCombustiblesDestinosRepository
  implements CombustiblesDestinosRepository
{
  constructor(private readonly db: Db) {}

  async findAll(): Promise<Destino[]> {
    const rows = await this.db
      .select()
      .from(caDestinosTable)
      .orderBy(caDestinosTable.nom);
    return rows.map(toDestino);
  }

  async create(input: CreateDestinoInput): Promise<Destino> {
    const [row] = await this.db
      .insert(caDestinosTable)
      .values({ nom: input.nom })
      .returning();
    if (!row) throw new Error("Insert returned no row for ca_destinos");
    return toDestino(row);
  }

  async toggle(id: number): Promise<Destino | null> {
    const existing = await this.db
      .select()
      .from(caDestinosTable)
      .where(eq(caDestinosTable.id, id))
      .limit(1);
    const row = existing[0];
    if (!row) return null;
    const [updated] = await this.db
      .update(caDestinosTable)
      .set({ activo: !row.activo })
      .where(eq(caDestinosTable.id, id))
      .returning();
    return updated ? toDestino(updated) : null;
  }
}

export class PostgresCombustiblesMaterialesRepository
  implements CombustiblesMaterialesRepository
{
  constructor(private readonly db: Db) {}

  async findAll(): Promise<Material[]> {
    const rows = await this.db.select().from(caMaterialesTable);
    return rows.map(toMaterial);
  }

  async create(input: CreateMaterialInput): Promise<Material> {
    const [row] = await this.db
      .insert(caMaterialesTable)
      .values({ nom: input.nom })
      .returning();
    if (!row) throw new Error("Insert returned no row for ca_materiales");
    return toMaterial(row);
  }

  async toggle(id: number): Promise<Material | null> {
    const existing = await this.db
      .select()
      .from(caMaterialesTable)
      .where(eq(caMaterialesTable.id, id))
      .limit(1);
    const row = existing[0];
    if (!row) return null;
    const [updated] = await this.db
      .update(caMaterialesTable)
      .set({ activo: !row.activo })
      .where(eq(caMaterialesTable.id, id))
      .returning();
    return updated ? toMaterial(updated) : null;
  }
}

export class PostgresCombustiblesProveedoresRepository
  implements CombustiblesProveedoresRepository
{
  constructor(private readonly db: Db) {}

  async findAll(): Promise<Proveedor[]> {
    const rows = await this.db.select().from(caProveedoresTable);
    return rows.map(toProveedor);
  }

  async create(input: CreateProveedorInput): Promise<Proveedor> {
    const [row] = await this.db
      .insert(caProveedoresTable)
      .values({
        nom: input.nom,
        tipus: input.tipus,
        emails: input.emails,
        bcc: input.bcc,
      })
      .returning();
    if (!row) throw new Error("Insert returned no row for ca_proveedores");
    return toProveedor(row);
  }

  async update(
    id: number,
    input: UpdateProveedorInput
  ): Promise<Proveedor | null> {
    const [row] = await this.db
      .update(caProveedoresTable)
      .set({
        ...(input.nom !== undefined && { nom: input.nom }),
        ...(input.tipus !== undefined && { tipus: input.tipus }),
        ...(input.emails !== undefined && { emails: input.emails }),
        ...(input.bcc !== undefined && { bcc: input.bcc }),
      })
      .where(eq(caProveedoresTable.id, id))
      .returning();
    return row ? toProveedor(row) : null;
  }

  async toggle(id: number): Promise<Proveedor | null> {
    const existing = await this.db
      .select()
      .from(caProveedoresTable)
      .where(eq(caProveedoresTable.id, id))
      .limit(1);
    const row = existing[0];
    if (!row) return null;
    const [updated] = await this.db
      .update(caProveedoresTable)
      .set({ activo: !row.activo })
      .where(eq(caProveedoresTable.id, id))
      .returning();
    return updated ? toProveedor(updated) : null;
  }
}

export class PostgresCombustiblesAsignacionesRepository
  implements CombustiblesAsignacionesRepository
{
  constructor(private readonly db: Db) {}

  async findAll(): Promise<Asignacion[]> {
    const rows = await this.db.select().from(caAsignacionesTable);
    return rows.map(toAsignacion);
  }

  async create(input: CreateAsignacionInput): Promise<Asignacion> {
    const [row] = await this.db
      .insert(caAsignacionesTable)
      .values({
        materialId: input.materialId,
        proveedorId: input.proveedorId,
        transportistaId: input.transportistaId,
        pct: input.pct,
      })
      .returning();
    if (!row) throw new Error("Insert returned no row for ca_asignaciones");
    return toAsignacion(row);
  }

  async delete(id: number): Promise<void> {
    await this.db
      .delete(caAsignacionesTable)
      .where(eq(caAsignacionesTable.id, id));
  }
}

export class PostgresCombustiblesSolicitudesRepository
  implements CombustiblesSolicitudesRepository
{
  constructor(private readonly db: Db) {}

  async findAll(): Promise<Solicitud[]> {
    const solicitudRows = await this.db.select().from(caSolicitudesTable);
    const lineasRows = await this.db.select().from(caLineasSolicitudTable);
    const historialRows = await this.db.select().from(caHistorialSolicitudTable);

    return solicitudRows.map((s) => {
      const lineas = lineasRows
        .filter((l) => l.solicitudId === s.id)
        .map(toLineaSolicitud);
      const historial = historialRows
        .filter((h) => h.solicitudId === s.id)
        .map(toHistorial);
      return toSolicitud(s, lineas, historial);
    });
  }

  async findById(id: number): Promise<Solicitud | null> {
    const rows = await this.db
      .select()
      .from(caSolicitudesTable)
      .where(eq(caSolicitudesTable.id, id))
      .limit(1);
    const row = rows[0];
    if (!row) return null;

    const lineasRows = await this.db
      .select()
      .from(caLineasSolicitudTable)
      .where(eq(caLineasSolicitudTable.solicitudId, id));
    const historialRows = await this.db
      .select()
      .from(caHistorialSolicitudTable)
      .where(eq(caHistorialSolicitudTable.solicitudId, id));

    return toSolicitud(
      row,
      lineasRows.map(toLineaSolicitud),
      historialRows.map(toHistorial)
    );
  }

  async create(input: CreateSolicitudInput): Promise<Solicitud> {
    const [solicitudRow] = await this.db
      .insert(caSolicitudesTable)
      .values({
        semana: input.semana,
        ini: input.ini,
        fi: input.fi,
        creadaPor: input.creadaPor,
        estado: input.estado,
        comentarioGeneral: input.comentarioGeneral,
        mantenimientosProgramados: input.mantenimientosProgramados,
      })
      .returning();
    if (!solicitudRow) throw new Error("Insert returned no row for ca_solicitudes");

    const lineasRows =
      input.lineas.length > 0
        ? await this.db
            .insert(caLineasSolicitudTable)
            .values(
              input.lineas.map((l) => ({
                solicitudId: solicitudRow.id,
                materialId: l.materialId,
                materialNom: l.materialNom,
                dl: l.dl,
                dt: l.dt,
                dc: l.dc,
                dj: l.dj,
                dv: l.dv,
                ds: l.ds,
                dg: l.dg,
                destino: l.destino ?? "",
                obs: l.obs,
              }))
            )
            .returning()
        : [];

    return toSolicitud(solicitudRow, lineasRows.map(toLineaSolicitud), []);
  }

  async updateEstado(id: number, estado: EstadoSolicitud): Promise<void> {
    await this.db
      .update(caSolicitudesTable)
      .set({ estado, actualizadoEn: new Date() })
      .where(eq(caSolicitudesTable.id, id));
  }

  async updateComentarios(id: number, input: { comentarioGeneral: string; mantenimientosProgramados: string }): Promise<void> {
    await this.db
      .update(caSolicitudesTable)
      .set({ comentarioGeneral: input.comentarioGeneral, mantenimientosProgramados: input.mantenimientosProgramados, actualizadoEn: new Date() })
      .where(eq(caSolicitudesTable.id, id));
  }

  async updateLineas(
    solicitudId: number,
    lineas: UpdateLineasInput
  ): Promise<void> {
    await Promise.all(
      lineas.map((l) =>
        this.db
          .update(caLineasSolicitudTable)
          .set({ dl: l.dl, dt: l.dt, dc: l.dc, dj: l.dj, dv: l.dv, ds: l.ds, dg: l.dg, ...(l.destino !== undefined ? { destino: l.destino } : {}) })
          .where(eq(caLineasSolicitudTable.id, l.id))
      )
    );
  }

  async syncLineas(solicitudId: number, lineas: SyncLineasInput): Promise<void> {
    const existentes = await this.db
      .select({ id: caLineasSolicitudTable.id })
      .from(caLineasSolicitudTable)
      .where(eq(caLineasSolicitudTable.solicitudId, solicitudId));
    const idsExistentes = new Set(existentes.map((e) => e.id));

    const aActualizar = lineas.filter(
      (l): l is SyncLineasInput[number] & { id: number } =>
        l.id !== undefined && idsExistentes.has(l.id)
    );
    const aInsertar = lineas.filter(
      (l) => l.id === undefined || !idsExistentes.has(l.id)
    );
    const idsAConservar = new Set(aActualizar.map((l) => l.id));
    const idsAEliminar = [...idsExistentes].filter((id) => !idsAConservar.has(id));

    await Promise.all([
      ...aActualizar.map((l) =>
        this.db
          .update(caLineasSolicitudTable)
          .set({
            materialId: l.materialId,
            materialNom: l.materialNom,
            dl: l.dl,
            dt: l.dt,
            dc: l.dc,
            dj: l.dj,
            dv: l.dv,
            ds: l.ds,
            dg: l.dg,
            destino: l.destino,
            obs: l.obs,
          })
          .where(eq(caLineasSolicitudTable.id, l.id))
      ),
      aInsertar.length > 0
        ? this.db.insert(caLineasSolicitudTable).values(
            aInsertar.map((l) => ({
              solicitudId,
              materialId: l.materialId,
              materialNom: l.materialNom,
              dl: l.dl,
              dt: l.dt,
              dc: l.dc,
              dj: l.dj,
              dv: l.dv,
              ds: l.ds,
              dg: l.dg,
              destino: l.destino,
              obs: l.obs,
            }))
          )
        : Promise.resolve(),
      idsAEliminar.length > 0
        ? this.db
            .delete(caLineasSolicitudTable)
            .where(inArray(caLineasSolicitudTable.id, idsAEliminar))
        : Promise.resolve(),
    ]);
  }

  async addHistorial(
    solicitudId: number,
    entrada: Omit<CambioHistorial, "id" | "solicitudId">
  ): Promise<CambioHistorial> {
    const [row] = await this.db
      .insert(caHistorialSolicitudTable)
      .values({
        solicitudId,
        autor: entrada.autor,
        motivo: entrada.motivo,
        descripcion: entrada.descripcion,
      })
      .returning();
    if (!row) throw new Error("Insert returned no row for ca_historial_solicitud");
    return toHistorial(row);
  }
}

export class PostgresCombustiblesDistribucionRepository
  implements CombustiblesDistribucionRepository
{
  constructor(private readonly db: Db) {}

  async findBySolicitud(solicitudId: number): Promise<LineaDistribucion[]> {
    const rows = await this.db
      .select()
      .from(caLineasDistribucionTable)
      .where(eq(caLineasDistribucionTable.solicitudId, solicitudId));
    return rows.map(toLineaDistribucion);
  }

  async findAll(): Promise<LineaDistribucion[]> {
    const rows = await this.db.select().from(caLineasDistribucionTable);
    return rows.map(toLineaDistribucion);
  }

  async create(
    input: CreateLineaDistribucionInput
  ): Promise<LineaDistribucion> {
    const [row] = await this.db
      .insert(caLineasDistribucionTable)
      .values({
        solicitudId: input.solicitudId,
        lineaSolicitudId: input.lineaSolicitudId,
        materialId: input.materialId,
        materialNom: input.materialNom,
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
        estado: input.estado,
        confirmacionProveedor: input.confirmacionProveedor,
        confirmacionTransportista: input.confirmacionTransportista,
        cantidadesProveedor: input.cantidadesProveedor ?? null,
        comentarioProveedor: input.comentarioProveedor ?? null,
        cantidadesTransportista: input.cantidadesTransportista ?? null,
        comentarioTransportista: input.comentarioTransportista ?? null,
        motivoRechazoProveedor: input.motivoRechazoProveedor ?? null,
        motivoRechazoTransportista: input.motivoRechazoTransportista ?? null,
        correoEnviadoEn: input.correoEnviadoEn
          ? new Date(input.correoEnviadoEn)
          : null,
        correoTransportistaEnviadoEn: input.correoTransportistaEnviadoEn
          ? new Date(input.correoTransportistaEnviadoEn)
          : null,
      })
      .returning();
    if (!row) throw new Error("Insert returned no row for ca_lineas_distribucion");
    return toLineaDistribucion(row);
  }

  async update(
    id: number,
    input: UpdateLineaDistribucionInput
  ): Promise<LineaDistribucion | null> {
    const setValues: Record<string, unknown> = {};
    if (input.proveedorId !== undefined) setValues["proveedorId"] = input.proveedorId;
    if (input.proveedorNom !== undefined) setValues["proveedorNom"] = input.proveedorNom;
    if (input.transportistaId !== undefined) setValues["transportistaId"] = input.transportistaId;
    if (input.transportistaNom !== undefined) setValues["transportistaNom"] = input.transportistaNom;
    if (input.destino !== undefined) setValues["destino"] = input.destino;
    if (input.dl !== undefined) setValues["dl"] = input.dl;
    if (input.dt !== undefined) setValues["dt"] = input.dt;
    if (input.dc !== undefined) setValues["dc"] = input.dc;
    if (input.dj !== undefined) setValues["dj"] = input.dj;
    if (input.dv !== undefined) setValues["dv"] = input.dv;
    if (input.ds !== undefined) setValues["ds"] = input.ds;
    if (input.dg !== undefined) setValues["dg"] = input.dg;
    if (input.confirmacionProveedor !== undefined) setValues["confirmacionProveedor"] = input.confirmacionProveedor;
    if (input.confirmacionTransportista !== undefined) setValues["confirmacionTransportista"] = input.confirmacionTransportista;
    if (input.cantidadesProveedor !== undefined) setValues["cantidadesProveedor"] = input.cantidadesProveedor;
    if (input.comentarioProveedor !== undefined) setValues["comentarioProveedor"] = input.comentarioProveedor;
    if (input.cantidadesTransportista !== undefined) setValues["cantidadesTransportista"] = input.cantidadesTransportista;
    if (input.comentarioTransportista !== undefined) setValues["comentarioTransportista"] = input.comentarioTransportista;
    if (input.motivoRechazoProveedor !== undefined) setValues["motivoRechazoProveedor"] = input.motivoRechazoProveedor;
    if (input.motivoRechazoTransportista !== undefined) setValues["motivoRechazoTransportista"] = input.motivoRechazoTransportista;
    if (input.estado !== undefined) setValues["estado"] = input.estado;
    if (input.correoEnviadoEn !== undefined) {
      setValues["correoEnviadoEn"] = input.correoEnviadoEn
        ? new Date(input.correoEnviadoEn)
        : null;
    }
    if (input.correoTransportistaEnviadoEn !== undefined) {
      setValues["correoTransportistaEnviadoEn"] =
        input.correoTransportistaEnviadoEn
          ? new Date(input.correoTransportistaEnviadoEn)
          : null;
    }

    const [row] = await this.db
      .update(caLineasDistribucionTable)
      .set(setValues)
      .where(eq(caLineasDistribucionTable.id, id))
      .returning();
    return row ? toLineaDistribucion(row) : null;
  }

  async resetConfirmacionesBySolicitud(solicitudId: number): Promise<void> {
    await this.db
      .update(caLineasDistribucionTable)
      .set({
        confirmacionProveedor: "pendiente",
        confirmacionTransportista: "pendiente",
      })
      .where(eq(caLineasDistribucionTable.solicitudId, solicitudId));
  }

  async resetConfirmacionesByLineaSolicitudIds(lineaSolicitudIds: number[]): Promise<void> {
    if (lineaSolicitudIds.length === 0) return;
    await this.db
      .update(caLineasDistribucionTable)
      .set({
        confirmacionProveedor: "pendiente",
        confirmacionTransportista: "pendiente",
        cantidadesProveedor: null,
        cantidadesTransportista: null,
        motivoRechazoProveedor: null,
        motivoRechazoTransportista: null,
        comentarioProveedor: null,
        comentarioTransportista: null,
      })
      .where(inArray(caLineasDistribucionTable.lineaSolicitudId, lineaSolicitudIds));
  }

  async addConfirmacion(
    input: Omit<Confirmacion, "id">
  ): Promise<Confirmacion> {
    const [row] = await this.db
      .insert(caConfirmacionesTable)
      .values({
        lineaDistribucionId: input.lineaDistribucionId,
        parte: input.parte,
        estado: input.estado,
        motivo: input.motivo ?? null,
      })
      .returning();
    if (!row) throw new Error("Insert returned no row for ca_confirmaciones");
    return toConfirmacion(row);
  }

  async findConfirmacionesBySolicitud(
    solicitudId: number
  ): Promise<Confirmacion[]> {
    const lineas = await this.findBySolicitud(solicitudId);
    const lineaIds = lineas.map((l) => l.id);
    if (lineaIds.length === 0) return [];

    const rows = await this.db.select().from(caConfirmacionesTable);
    return rows
      .filter((r) => lineaIds.includes(r.lineaDistribucionId))
      .map(toConfirmacion);
  }

  async findAllConfirmaciones(): Promise<Confirmacion[]> {
    const rows = await this.db.select().from(caConfirmacionesTable);
    return rows.map(toConfirmacion);
  }

  async delete(id: number): Promise<void> {
    await this.db
      .delete(caLineasDistribucionTable)
      .where(eq(caLineasDistribucionTable.id, id));
  }
}

export class PostgresCombustiblesEntradasRepository
  implements CombustiblesEntradasRepository
{
  constructor(private readonly db: Db) {}

  async findAll(): Promise<EntradaReal[]> {
    const rows = await this.db.select().from(caEntradasRealesTable);
    return rows.map(toEntradaReal);
  }

  async create(input: CreateEntradaRealInput): Promise<EntradaReal> {
    const [row] = await this.db
      .insert(caEntradasRealesTable)
      .values({
        solicitudId: input.solicitudId ?? null,
        fecha: input.fecha,
        materialId: input.materialId,
        materialNom: input.materialNom,
        proveedorId: input.proveedorId,
        proveedorNom: input.proveedorNom,
        transportistaId: input.transportistaId,
        transportistaNom: input.transportistaNom,
        viajes: input.viajes,
        destino: input.destino,
        obs: input.obs,
      })
      .returning();
    if (!row) throw new Error("Insert returned no row for ca_entradas_reales");
    return toEntradaReal(row);
  }
}

export class PostgresCombustiblesPlantillaRepository
  implements CombustiblesPlantillaRepository
{
  constructor(private readonly db: Db) {}

  async findAll(): Promise<PlantillaDistribucion[]> {
    const rows = await this.db.select().from(caPlantillaDistribucionTable);
    return rows.map(toPlantilla);
  }

  async findActive(): Promise<PlantillaDistribucion[]> {
    const rows = await this.db
      .select()
      .from(caPlantillaDistribucionTable)
      .where(eq(caPlantillaDistribucionTable.activo, true));
    return rows.map(toPlantilla);
  }

  async create(input: CreatePlantillaDistribucionInput): Promise<PlantillaDistribucion> {
    const [row] = await this.db
      .insert(caPlantillaDistribucionTable)
      .values({
        materialId: input.materialId,
        materialNom: input.materialNom,
        destino: input.destino,
      })
      .returning();
    if (!row) throw new Error("Insert returned no row for ca_plantilla_distribucion");
    return toPlantilla(row);
  }

  async delete(id: number): Promise<void> {
    await this.db
      .delete(caPlantillaDistribucionTable)
      .where(eq(caPlantillaDistribucionTable.id, id));
  }
}

// ---------------------------------------------------------------------------
// Horario de llegadas
// ---------------------------------------------------------------------------

function toHorarioLlegada(row: CaHorarioLlegadaRow): HorarioLlegada {
  return {
    id: row.id,
    solicitudId: row.solicitudId,
    dia: row.dia as HorarioLlegada["dia"],
    franja: row.franja,
    silo: row.silo as HorarioLlegada["silo"],
    materialNom: row.materialNom,
    creadoEn: row.creadoEn.toISOString(),
  };
}

export class PostgresCombustiblesHorarioRepository
  implements CombustiblesHorarioRepository
{
  constructor(private readonly db: Db) {}

  async findAll(): Promise<HorarioLlegada[]> {
    const rows = await this.db.select().from(caHorarioLlegadasTable);
    return rows.map(toHorarioLlegada);
  }

  async findBySolicitud(solicitudId: number): Promise<HorarioLlegada[]> {
    const rows = await this.db
      .select()
      .from(caHorarioLlegadasTable)
      .where(eq(caHorarioLlegadasTable.solicitudId, solicitudId));
    return rows.map(toHorarioLlegada);
  }

  async upsertSlot(input: UpsertHorarioSlotInput): Promise<HorarioLlegada> {
    const rows = await this.db
      .insert(caHorarioLlegadasTable)
      .values({
        solicitudId: input.solicitudId,
        dia: input.dia,
        franja: input.franja,
        silo: input.silo,
        materialNom: input.materialNom,
      })
      .onConflictDoUpdate({
        target: [
          caHorarioLlegadasTable.solicitudId,
          caHorarioLlegadasTable.dia,
          caHorarioLlegadasTable.franja,
          caHorarioLlegadasTable.silo,
        ],
        set: { materialNom: input.materialNom },
      })
      .returning();
    const row = rows[0];
    if (!row) throw new Error("Upsert de horario no devolvió ningún resultado");
    return toHorarioLlegada(row);
  }

  async deleteSlot(id: number): Promise<void> {
    await this.db
      .delete(caHorarioLlegadasTable)
      .where(eq(caHorarioLlegadasTable.id, id));
  }
}

// ---------------------------------------------------------------------------
// Plantilla de horario
// ---------------------------------------------------------------------------

function toHorarioPlantillaSlot(row: CaHorarioPlantillaRow): HorarioPlantillaSlot {
  return {
    id: row.id,
    dia: row.dia as HorarioPlantillaSlot["dia"],
    franja: row.franja,
    silo: row.silo as HorarioPlantillaSlot["silo"],
    materialNom: row.materialNom,
  };
}

export class PostgresCombustiblesHorarioPlantillaRepository
  implements CombustiblesHorarioPlantillaRepository
{
  constructor(private readonly db: Db) {}

  async findAll(): Promise<HorarioPlantillaSlot[]> {
    const rows = await this.db.select().from(caHorarioPlantillaTable);
    return rows.map(toHorarioPlantillaSlot);
  }

  async upsertSlot(input: UpsertHorarioPlantillaSlotInput): Promise<HorarioPlantillaSlot> {
    const rows = await this.db
      .insert(caHorarioPlantillaTable)
      .values({
        dia: input.dia,
        franja: input.franja,
        silo: input.silo,
        materialNom: input.materialNom,
      })
      .onConflictDoUpdate({
        target: [
          caHorarioPlantillaTable.dia,
          caHorarioPlantillaTable.franja,
          caHorarioPlantillaTable.silo,
        ],
        set: { materialNom: input.materialNom },
      })
      .returning();
    const row = rows[0];
    if (!row) throw new Error("Upsert de plantilla horario no devolvió resultado");
    return toHorarioPlantillaSlot(row);
  }

  async deleteSlot(id: number): Promise<void> {
    await this.db
      .delete(caHorarioPlantillaTable)
      .where(eq(caHorarioPlantillaTable.id, id));
  }
}

export class PostgresCombustiblesReadRepository
  implements CombustiblesReadRepository
{
  constructor(
    private readonly materiales: CombustiblesMaterialesRepository,
    private readonly destinos: CombustiblesDestinosRepository,
    private readonly proveedores: CombustiblesProveedoresRepository,
    private readonly asignaciones: CombustiblesAsignacionesRepository,
    private readonly solicitudes: CombustiblesSolicitudesRepository,
    private readonly distribucion: CombustiblesDistribucionRepository,
    private readonly entradas: CombustiblesEntradasRepository,
    private readonly plantilla: CombustiblesPlantillaRepository,
    private readonly horario: CombustiblesHorarioRepository,
    private readonly horarioPlantilla: CombustiblesHorarioPlantillaRepository
  ) {}

  async getEstadoCompleto(): Promise<CaEstadoCompleto> {
    const [
      materiales,
      destinos,
      proveedores,
      asignaciones,
      solicitudes,
      distribucion,
      confirmaciones,
      entradasReales,
      plantillaDistribucion,
      horarioLlegadas,
      horarioPlantilla,
    ] = await Promise.all([
      this.materiales.findAll(),
      this.destinos.findAll(),
      this.proveedores.findAll(),
      this.asignaciones.findAll(),
      this.solicitudes.findAll(),
      this.distribucion.findAll(),
      this.distribucion.findAllConfirmaciones(),
      this.entradas.findAll(),
      this.plantilla.findActive(),
      this.horario.findAll(),
      this.horarioPlantilla.findAll(),
    ]);

    return {
      materiales,
      destinos,
      proveedores,
      asignaciones,
      solicitudes,
      distribucion,
      confirmaciones,
      entradasReales,
      plantillaDistribucion,
      horarioLlegadas,
      horarioPlantilla,
    };
  }
}

export class PostgresCombustiblesSeedRepository
  implements CombustiblesSeedRepository
{
  constructor(
    private readonly db: Db,
    private readonly destinos: CombustiblesDestinosRepository,
    private readonly materiales: CombustiblesMaterialesRepository,
    private readonly proveedores: CombustiblesProveedoresRepository,
    private readonly asignaciones: CombustiblesAsignacionesRepository,
    private readonly plantilla: CombustiblesPlantillaRepository
  ) {}

  async hasDatos(): Promise<boolean> {
    const rows = await this.db
      .select()
      .from(caMaterialesTable)
      .limit(1);
    return rows.length > 0;
  }

  async seedDatos(datos: SeedDatos): Promise<void> {
    for (const d of datos.destinos) {
      await this.destinos.create({ nom: d.nom });
    }

    const matMap = new Map<string, number>();
    for (const m of datos.materiales) {
      const created = await this.materiales.create({ nom: m.nom });
      matMap.set(m.nom, created.id);
    }

    const provMap = new Map<string, number>();
    for (const p of datos.proveedores) {
      const created = await this.proveedores.create({
        nom: p.nom,
        tipus: p.tipus,
        emails: p.emails,
        bcc: p.bcc,
      });
      provMap.set(p.nom, created.id);
    }

    for (const a of datos.asignaciones) {
      const materialId = matMap.get(a.materialNom);
      const proveedorId = provMap.get(a.proveedorNom);
      const transportistaId = provMap.get(a.transportistaNom);
      if (
        materialId === undefined ||
        proveedorId === undefined ||
        transportistaId === undefined
      ) {
        continue;
      }
      await this.asignaciones.create({
        materialId,
        proveedorId,
        transportistaId,
        pct: a.pct,
      });
    }

    for (const p of datos.plantilla) {
      const materialId = matMap.get(p.materialNom);
      if (materialId === undefined) continue;
      await this.plantilla.create({
        materialId,
        materialNom: p.materialNom,
        destino: p.destino,
      });
    }
  }
}
