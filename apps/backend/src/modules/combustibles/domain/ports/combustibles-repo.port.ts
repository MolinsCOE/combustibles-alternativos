/**
 * Repository port for the Combustibles Alternativos module.
 * Pure interface — implementations live in infrastructure/.
 */

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
  Material,
  PlantillaDistribucion,
  Proveedor,
  Solicitud,
  TipusProveedor,
  DiaKey,
} from "../entities/combustibles.js";

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export interface CombustiblesReadRepository {
  getEstadoCompleto(): Promise<CaEstadoCompleto>;
}

// ---------------------------------------------------------------------------
// Destinos
// ---------------------------------------------------------------------------

export type CreateDestinoInput = { nom: string };

export interface CombustiblesDestinosRepository {
  findAll(): Promise<Destino[]>;
  create(input: CreateDestinoInput): Promise<Destino>;
  toggle(id: number): Promise<Destino | null>;
}

// ---------------------------------------------------------------------------
// Materiales
// ---------------------------------------------------------------------------

export type CreateMaterialInput = { nom: string };
export type ToggleMaterialInput = { id: number };

export interface CombustiblesMaterialesRepository {
  findAll(): Promise<Material[]>;
  create(input: CreateMaterialInput): Promise<Material>;
  toggle(id: number): Promise<Material | null>;
}

// ---------------------------------------------------------------------------
// Proveedores
// ---------------------------------------------------------------------------

export type CreateProveedorInput = {
  nom: string;
  tipus: TipusProveedor;
  emails: string[];
  bcc: string[];
};

export type UpdateProveedorInput = Partial<
  Pick<Proveedor, "nom" | "tipus" | "emails" | "bcc">
>;

export interface CombustiblesProveedoresRepository {
  findAll(): Promise<Proveedor[]>;
  create(input: CreateProveedorInput): Promise<Proveedor>;
  update(id: number, input: UpdateProveedorInput): Promise<Proveedor | null>;
  toggle(id: number): Promise<Proveedor | null>;
}

// ---------------------------------------------------------------------------
// Asignaciones
// ---------------------------------------------------------------------------

export type CreateAsignacionInput = {
  materialId: number;
  proveedorId: number;
  transportistaId: number;
  pct: number;
};

export interface CombustiblesAsignacionesRepository {
  findAll(): Promise<Asignacion[]>;
  create(input: CreateAsignacionInput): Promise<Asignacion>;
  delete(id: number): Promise<void>;
}

// ---------------------------------------------------------------------------
// Solicitudes
// ---------------------------------------------------------------------------

export type CreateSolicitudInput = {
  semana: string;
  ini: string;
  fi: string;
  creadaPor: string;
  estado: EstadoSolicitud;
  comentarioGeneral: string;
  mantenimientosProgramados: string;
  lineas: Array<{
    id?: number;
    materialId: number;
    materialNom: string;
    dl: number;
    dt: number;
    dc: number;
    dj: number;
    dv: number;
    ds: number;
    dg: number;
    destino: string;
    obs: string;
  }>;
};

export type UpdateSolicitudInput = Partial<
  Pick<Solicitud, "estado" | "comentarioGeneral" | "mantenimientosProgramados">
>;

export type UpdateComentariosInput = {
  comentarioGeneral: string;
  mantenimientosProgramados: string;
};

export type UpdateLineasInput = Array<{
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

export type SyncLineasInput = Array<{
  id?: number;
  materialId: number;
  materialNom: string;
  dl: number;
  dt: number;
  dc: number;
  dj: number;
  dv: number;
  ds: number;
  dg: number;
  destino: string;
  obs: string;
}>;

export interface CombustiblesSolicitudesRepository {
  findAll(): Promise<Solicitud[]>;
  findById(id: number): Promise<Solicitud | null>;
  create(input: CreateSolicitudInput): Promise<Solicitud>;
  updateEstado(id: number, estado: EstadoSolicitud): Promise<void>;
  updateComentarios(id: number, input: UpdateComentariosInput): Promise<void>;
  updateLineas(solicitudId: number, lineas: UpdateLineasInput): Promise<void>;
  /** Sincroniza las líneas de una solicitud en borrador: actualiza las existentes
   *  (por id), inserta las nuevas (sin id) y elimina las que ya no están presentes. */
  syncLineas(solicitudId: number, lineas: SyncLineasInput): Promise<void>;
  addHistorial(
    solicitudId: number,
    entrada: Omit<CambioHistorial, "id" | "solicitudId">
  ): Promise<CambioHistorial>;
}

// ---------------------------------------------------------------------------
// Distribución
// ---------------------------------------------------------------------------

export type CreateLineaDistribucionInput = Omit<LineaDistribucion, "id">;

export type UpdateLineaDistribucionInput = Partial<
  Pick<
    LineaDistribucion,
    | "proveedorId"
    | "proveedorNom"
    | "transportistaId"
    | "transportistaNom"
    | "destino"
    | "dl"
    | "dt"
    | "dc"
    | "dj"
    | "dv"
    | "ds"
    | "dg"
    | "confirmacionProveedor"
    | "confirmacionTransportista"
    | "cantidadesProveedor"
    | "comentarioProveedor"
    | "cantidadesTransportista"
    | "comentarioTransportista"
    | "motivoRechazoProveedor"
    | "motivoRechazoTransportista"
    | "correoEnviadoEn"
    | "correoTransportistaEnviadoEn"
    | "estado"
  >
>;

export interface CombustiblesDistribucionRepository {
  findBySolicitud(solicitudId: number): Promise<LineaDistribucion[]>;
  findAll(): Promise<LineaDistribucion[]>;
  create(input: CreateLineaDistribucionInput): Promise<LineaDistribucion>;
  update(
    id: number,
    input: UpdateLineaDistribucionInput
  ): Promise<LineaDistribucion | null>;
  resetConfirmacionesBySolicitud(solicitudId: number): Promise<void>;
  resetConfirmacionesByLineaSolicitudIds(lineaSolicitudIds: number[]): Promise<void>;
  addConfirmacion(
    input: Omit<Confirmacion, "id">
  ): Promise<Confirmacion>;
  findConfirmacionesBySolicitud(solicitudId: number): Promise<Confirmacion[]>;
  findAllConfirmaciones(): Promise<Confirmacion[]>;
  delete(id: number): Promise<void>;
}

// ---------------------------------------------------------------------------
// Entradas reales
// ---------------------------------------------------------------------------

export type CreateEntradaRealInput = Omit<EntradaReal, "id">;

export interface CombustiblesEntradasRepository {
  findAll(): Promise<EntradaReal[]>;
  create(input: CreateEntradaRealInput): Promise<EntradaReal>;
}

// ---------------------------------------------------------------------------
// Plantilla de distribución
// ---------------------------------------------------------------------------

export interface CombustiblesPlantillaRepository {
  findAll(): Promise<PlantillaDistribucion[]>;
  findActive(): Promise<PlantillaDistribucion[]>;
  create(input: CreatePlantillaDistribucionInput): Promise<PlantillaDistribucion>;
  delete(id: number): Promise<void>;
}

// ---------------------------------------------------------------------------
// Horario de llegadas
// ---------------------------------------------------------------------------

export type UpsertHorarioSlotInput = {
  solicitudId: number;
  dia: DiaKey;
  franja: string;
  silo: "silo1" | "silo2";
  materialNom: string;
};

export interface CombustiblesHorarioRepository {
  findAll(): Promise<HorarioLlegada[]>;
  findBySolicitud(solicitudId: number): Promise<HorarioLlegada[]>;
  upsertSlot(input: UpsertHorarioSlotInput): Promise<HorarioLlegada>;
  deleteSlot(id: number): Promise<void>;
}

// ---------------------------------------------------------------------------
// Plantilla de horario
// ---------------------------------------------------------------------------

export type UpsertHorarioPlantillaSlotInput = {
  dia: DiaKey;
  franja: string;
  silo: "silo1" | "silo2";
  materialNom: string;
};

export interface CombustiblesHorarioPlantillaRepository {
  findAll(): Promise<HorarioPlantillaSlot[]>;
  upsertSlot(input: UpsertHorarioPlantillaSlotInput): Promise<HorarioPlantillaSlot>;
  deleteSlot(id: number): Promise<void>;
}

// ---------------------------------------------------------------------------
// Semillas de datos iniciales
// ---------------------------------------------------------------------------

export type SeedDatos = {
  destinos: Array<{ nom: string }>;
  materiales: Array<{ nom: string }>;
  proveedores: Array<{
    nom: string;
    tipus: TipusProveedor;
    emails: string[];
    bcc: string[];
  }>;
  asignaciones: Array<{
    materialNom: string;
    proveedorNom: string;
    transportistaNom: string;
    pct: number;
  }>;
  plantilla: Array<{
    materialNom: string;
    destino: string;
  }>;
};

export interface CombustiblesSeedRepository {
  hasDatos(): Promise<boolean>;
  seedDatos(datos: SeedDatos): Promise<void>;
}

export type { DiaKey };
