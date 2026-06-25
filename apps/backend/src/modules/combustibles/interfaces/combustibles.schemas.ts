import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

const diaSchema = z.number().int().nonnegative();

const cantidadesDiasSchema = z.object({
  dl: diaSchema,
  dt: diaSchema,
  dc: diaSchema,
  dj: diaSchema,
  dv: diaSchema,
  ds: diaSchema,
  dg: diaSchema,
});

const cantidadesDiasParcialSchema = cantidadesDiasSchema.partial();

const lineaSolicitudInputSchema = z.object({
  id: z.number().int().positive().optional(),
  materialId: z.number().int().positive(),
  materialNom: z.string().min(1),
  dl: diaSchema,
  dt: diaSchema,
  dc: diaSchema,
  dj: diaSchema,
  dv: diaSchema,
  ds: diaSchema,
  dg: diaSchema,
  destino: z.string().optional().transform((v): string => v ?? ""),
  obs: z.string().default(""),
});

// ---------------------------------------------------------------------------
// Solicitudes
// ---------------------------------------------------------------------------

export const guardarBorradorSchema = z.object({
  id: z.number().int().positive().optional(),
  semana: z.string().min(1),
  ini: z.string().min(1),
  fi: z.string().min(1),
  creadaPor: z.string().min(1),
  comentarioGeneral: z.string().default(""),
  mantenimientosProgramados: z.string().default(""),
  lineas: z.array(lineaSolicitudInputSchema).min(1),
});

export const enviarSolicitudSchema = guardarBorradorSchema;

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const editarSolicitudSchema = z.object({
  lineas: z
    .array(
      z.object({
        id: z.number().int().positive(),
        dl: diaSchema,
        dt: diaSchema,
        dc: diaSchema,
        dj: diaSchema,
        dv: diaSchema,
        ds: diaSchema,
        dg: diaSchema,
        destino: z.string().optional(),
      })
    )
    .min(1),
  motivo: z.string().min(1),
  comentarioGeneral: z.string().optional(),
  mantenimientosProgramados: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Distribución
// ---------------------------------------------------------------------------

export const confirmarLineaSchema = z.object({
  comentario: z.string().nullable().optional(),
  cantidades: cantidadesDiasParcialSchema.optional(),
});

export const rechazarLineaSchema = z.object({
  motivo: z.string().min(1),
});

export const reasignarLineaSchema = z.object({
  solicitudId: z.number().int().positive(),
  proveedorId: z.number().int().positive().optional(),
  proveedorNom: z.string().optional(),
  transportistaId: z.number().int().positive().optional(),
  transportistaNom: z.string().optional(),
  motivo: z.string().min(1),
});

export const crearLineaDistribucionSchema = z.object({
  proveedorId: z.number().int().positive(),
  proveedorNom: z.string().min(1),
  transportistaId: z.number().int().positive(),
  transportistaNom: z.string().min(1),
  destino: z.string().default(""),
  dl: diaSchema,
  dt: diaSchema,
  dc: diaSchema,
  dj: diaSchema,
  dv: diaSchema,
  ds: diaSchema,
  dg: diaSchema,
});

export const solicitudLineaParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  lineaSolicitudId: z.coerce.number().int().positive(),
});

export const updateLineaDistribucionSchema = z.object({
  proveedorId: z.number().int().positive().optional(),
  proveedorNom: z.string().optional(),
  transportistaId: z.number().int().positive().optional(),
  transportistaNom: z.string().optional(),
  destino: z.string().optional(),
  dl: diaSchema.optional(),
  dt: diaSchema.optional(),
  dc: diaSchema.optional(),
  dj: diaSchema.optional(),
  dv: diaSchema.optional(),
  ds: diaSchema.optional(),
  dg: diaSchema.optional(),
});

// ---------------------------------------------------------------------------
// Maestros
// ---------------------------------------------------------------------------

export const addDestinoSchema = z.object({
  nom: z.string().min(1),
});

export const addMaterialSchema = z.object({
  nom: z.string().min(1),
});

export const addProveedorSchema = z.object({
  nom: z.string().min(1),
  tipus: z.enum(["proveedor", "transportista", "ambos"]),
  emails: z.array(z.string().email()).default([]),
  bcc: z.array(z.string().email()).default([]),
});

export const updateProveedorSchema = z.object({
  nom: z.string().min(1).optional(),
  tipus: z.enum(["proveedor", "transportista", "ambos"]).optional(),
  emails: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
});

export const addAsignacionSchema = z.object({
  materialId: z.number().int().positive(),
  proveedorId: z.number().int().positive(),
  transportistaId: z.number().int().positive(),
  pct: z.number().int().min(0).max(100),
});

export const createPlantillaSchema = z.object({
  materialId: z.number().int().positive(),
  materialNom: z.string().min(1),
  destino: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Entradas reales
// ---------------------------------------------------------------------------

export const addEntradaRealSchema = z.object({
  solicitudId: z.number().int().positive().nullable().optional(),
  fecha: z.string().min(1),
  materialId: z.number().int().positive(),
  materialNom: z.string().min(1),
  proveedorId: z.number().int().positive(),
  proveedorNom: z.string().min(1),
  transportistaId: z.number().int().positive(),
  transportistaNom: z.string().min(1),
  viajes: z.number().int().positive(),
  destino: z.string().default(""),
  obs: z.string().default(""),
});

// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------

const diaKeySchema = z.enum(["dl", "dt", "dc", "dj", "dv", "ds", "dg"]);
const siloSchema = z.enum(["silo1", "silo2"]);

export const upsertHorarioPlantillaSlotSchema = z.object({
  dia: z.enum(["dl", "dt", "dc", "dj", "dv", "ds", "dg"]),
  franja: z.string().min(1),
  silo: z.enum(["silo1", "silo2"]),
  materialNom: z.string().min(1),
});

export const horarioPlantillaSlotIdParamSchema = z.object({
  slotId: z.coerce.number().int().positive(),
});

export const upsertHorarioSlotSchema = z.object({
  solicitudId: z.number().int().positive(),
  dia: diaKeySchema,
  franja: z.string().min(1),
  silo: siloSchema,
  materialNom: z.string().min(1),
});

export const horarioSlotIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  slotId: z.coerce.number().int().positive(),
});

export type GuardarBorradorBody = z.infer<typeof guardarBorradorSchema>;
export type EnviarSolicitudBody = z.infer<typeof enviarSolicitudSchema>;
export type IdParam = z.infer<typeof idParamSchema>;
export type EditarSolicitudBody = z.infer<typeof editarSolicitudSchema>;
export type ConfirmarLineaBody = z.infer<typeof confirmarLineaSchema>;
export type RechazarLineaBody = z.infer<typeof rechazarLineaSchema>;
export type ReasignarLineaBody = z.infer<typeof reasignarLineaSchema>;
export type UpdateLineaDistribucionBody = z.infer<typeof updateLineaDistribucionSchema>;
export type CrearLineaDistribucionBody = z.infer<typeof crearLineaDistribucionSchema>;
export type SolicitudLineaParam = z.infer<typeof solicitudLineaParamSchema>;
export type AddDestinoBody = z.infer<typeof addDestinoSchema>;
export type AddMaterialBody = z.infer<typeof addMaterialSchema>;
export type AddProveedorBody = z.infer<typeof addProveedorSchema>;
export type UpdateProveedorBody = z.infer<typeof updateProveedorSchema>;
export type AddAsignacionBody = z.infer<typeof addAsignacionSchema>;
export type CreatePlantillaBody = z.infer<typeof createPlantillaSchema>;
export type AddEntradaRealBody = z.infer<typeof addEntradaRealSchema>;
export type UpsertHorarioSlotBody = z.infer<typeof upsertHorarioSlotSchema>;
export type HorarioSlotIdParam = z.infer<typeof horarioSlotIdParamSchema>;
export type UpsertHorarioPlantillaSlotBody = z.infer<typeof upsertHorarioPlantillaSlotSchema>;
export type HorarioPlantillaSlotIdParam = z.infer<typeof horarioPlantillaSlotIdParamSchema>;
