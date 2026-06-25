import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  time,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const estadoSolicitudEnum = pgEnum("ca_estado_solicitud", [
  "borrador",
  "enviada",
  "en_distribucion",
  "confirmada",
  "cerrada",
]);

export const estadoConfirmacionEnum = pgEnum("ca_estado_confirmacion", [
  "pendiente",
  "confirmada",
  "rechazada",
]);

export const estadoLineaDistribucionEnum = pgEnum(
  "ca_estado_linea_distribucion",
  ["pendiente", "enviada", "confirmada", "rechazada"]
);

export const tipusProveedorEnum = pgEnum("ca_tipus_proveedor", [
  "proveedor",
  "transportista",
  "ambos",
]);

export const autorHistorialEnum = pgEnum("ca_autor_historial", [
  "produccion",
  "compras",
]);

export const parteConfirmacionEnum = pgEnum("ca_parte_confirmacion", [
  "proveedor",
  "transportista",
]);

// ---------------------------------------------------------------------------
// Maestros
// ---------------------------------------------------------------------------

export const caDestinosTable = pgTable("ca_destinos", {
  id:        serial("id").primaryKey(),
  nom:       text("nom").notNull(),
  activo:    boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});

export const caMaterialesTable = pgTable("ca_materiales", {
  id: serial("id").primaryKey(),
  nom: text("nom").notNull(),
  activo: boolean("activo").notNull().default(true),
  creadoEn: timestamp("creado_en", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const caProveedoresTable = pgTable("ca_proveedores", {
  id: serial("id").primaryKey(),
  nom: text("nom").notNull(),
  tipus: tipusProveedorEnum("tipus").notNull(),
  emails: jsonb("emails").notNull().default(sql`'[]'::jsonb`),
  bcc: jsonb("bcc").notNull().default(sql`'[]'::jsonb`),
  activo: boolean("activo").notNull().default(true),
  creadoEn: timestamp("creado_en", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const caAsignacionesTable = pgTable("ca_asignaciones", {
  id: serial("id").primaryKey(),
  materialId: integer("material_id")
    .notNull()
    .references(() => caMaterialesTable.id, { onDelete: "cascade" }),
  proveedorId: integer("proveedor_id")
    .notNull()
    .references(() => caProveedoresTable.id, { onDelete: "cascade" }),
  transportistaId: integer("transportista_id")
    .notNull()
    .references(() => caProveedoresTable.id, { onDelete: "cascade" }),
  pct: integer("pct").notNull(),
  creadoEn: timestamp("creado_en", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const caPlantillaDistribucionTable = pgTable("ca_plantilla_distribucion", {
  id:          serial("id").primaryKey(),
  materialId:  integer("material_id").notNull().references(() => caMaterialesTable.id, { onDelete: "cascade" }),
  materialNom: text("material_nom").notNull().default(""),
  destino:     text("destino").notNull().default(""),
  activo:      boolean("activo").notNull().default(true),
  createdAt:   timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});

// ---------------------------------------------------------------------------
// Solicitudes
// ---------------------------------------------------------------------------

export const caSolicitudesTable = pgTable("ca_solicitudes", {
  id: serial("id").primaryKey(),
  semana: text("semana").notNull(),
  ini: text("ini").notNull(),     // ISO date string
  fi: text("fi").notNull(),       // ISO date string
  creadaPor: text("creada_por").notNull(),
  estado: estadoSolicitudEnum("estado").notNull().default("borrador"),
  comentarioGeneral: text("comentario_general").notNull().default(""),
  mantenimientosProgramados: text("mantenimientos_programados").notNull().default(""),
  ts: timestamp("ts", { withTimezone: true }).notNull().default(sql`now()`),
  actualizadoEn: timestamp("actualizado_en", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const caLineasSolicitudTable = pgTable("ca_lineas_solicitud", {
  id: serial("id").primaryKey(),
  solicitudId: integer("solicitud_id")
    .notNull()
    .references(() => caSolicitudesTable.id, { onDelete: "cascade" }),
  materialId: integer("material_id")
    .notNull()
    .references(() => caMaterialesTable.id, { onDelete: "restrict" }),
  materialNom: text("material_nom").notNull(),
  dl: integer("dl").notNull().default(0),
  dt: integer("dt").notNull().default(0),
  dc: integer("dc").notNull().default(0),
  dj: integer("dj").notNull().default(0),
  dv: integer("dv").notNull().default(0),
  ds: integer("ds").notNull().default(0),
  dg: integer("dg").notNull().default(0),
  destino: text("destino").notNull().default(""),
  obs: text("obs").notNull().default(""),
});

export const caHistorialSolicitudTable = pgTable("ca_historial_solicitud", {
  id: serial("id").primaryKey(),
  solicitudId: integer("solicitud_id")
    .notNull()
    .references(() => caSolicitudesTable.id, { onDelete: "cascade" }),
  ts: timestamp("ts", { withTimezone: true }).notNull().default(sql`now()`),
  autor: autorHistorialEnum("autor").notNull(),
  motivo: text("motivo").notNull(),
  descripcion: text("descripcion").notNull(),
});

// ---------------------------------------------------------------------------
// Distribución
// ---------------------------------------------------------------------------

export const caLineasDistribucionTable = pgTable("ca_lineas_distribucion", {
  id: serial("id").primaryKey(),
  solicitudId: integer("solicitud_id")
    .notNull()
    .references(() => caSolicitudesTable.id, { onDelete: "cascade" }),
  lineaSolicitudId: integer("linea_solicitud_id")
    .notNull()
    .references(() => caLineasSolicitudTable.id, { onDelete: "cascade" }),
  materialId: integer("material_id").notNull(),
  materialNom: text("material_nom").notNull(),
  proveedorId: integer("proveedor_id").notNull(),
  proveedorNom: text("proveedor_nom").notNull(),
  transportistaId: integer("transportista_id").notNull(),
  transportistaNom: text("transportista_nom").notNull(),
  destino: text("destino").notNull().default(""),
  dl: integer("dl").notNull().default(0),
  dt: integer("dt").notNull().default(0),
  dc: integer("dc").notNull().default(0),
  dj: integer("dj").notNull().default(0),
  dv: integer("dv").notNull().default(0),
  ds: integer("ds").notNull().default(0),
  dg: integer("dg").notNull().default(0),
  estado: estadoLineaDistribucionEnum("estado").notNull().default("pendiente"),
  confirmacionProveedor: estadoConfirmacionEnum("confirmacion_proveedor")
    .notNull()
    .default("pendiente"),
  confirmacionTransportista: estadoConfirmacionEnum(
    "confirmacion_transportista"
  )
    .notNull()
    .default("pendiente"),
  cantidadesProveedor: jsonb("cantidades_proveedor"),
  comentarioProveedor: text("comentario_proveedor"),
  cantidadesTransportista: jsonb("cantidades_transportista"),
  comentarioTransportista: text("comentario_transportista"),
  motivoRechazoProveedor: text("motivo_rechazo_proveedor"),
  motivoRechazoTransportista: text("motivo_rechazo_transportista"),
  correoEnviadoEn: timestamp("correo_enviado_en", { withTimezone: true }),
  correoTransportistaEnviadoEn: timestamp(
    "correo_transportista_enviado_en",
    { withTimezone: true }
  ),
});

export const caConfirmacionesTable = pgTable("ca_confirmaciones", {
  id: serial("id").primaryKey(),
  lineaDistribucionId: integer("linea_distribucion_id")
    .notNull()
    .references(() => caLineasDistribucionTable.id, { onDelete: "cascade" }),
  parte: parteConfirmacionEnum("parte").notNull(),
  estado: estadoConfirmacionEnum("estado").notNull(),
  motivo: text("motivo"),
  ts: timestamp("ts", { withTimezone: true }).notNull().default(sql`now()`),
});

// ---------------------------------------------------------------------------
// Entradas reales
// ---------------------------------------------------------------------------

export const caEntradasRealesTable = pgTable("ca_entradas_reales", {
  id: serial("id").primaryKey(),
  solicitudId: integer("solicitud_id").references(() => caSolicitudesTable.id, {
    onDelete: "set null",
  }),
  fecha: text("fecha").notNull(),   // ISO date string
  materialId: integer("material_id").notNull(),
  materialNom: text("material_nom").notNull(),
  proveedorId: integer("proveedor_id").notNull(),
  proveedorNom: text("proveedor_nom").notNull(),
  transportistaId: integer("transportista_id").notNull(),
  transportistaNom: text("transportista_nom").notNull(),
  viajes: integer("viajes").notNull(),
  destino: text("destino").notNull().default(""),
  obs: text("obs").notNull().default(""),
  creadoEn: timestamp("creado_en", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// ---------------------------------------------------------------------------
// Prosegur — importación automática de ficheros Excel
// ---------------------------------------------------------------------------

export const prosegurImportStatusEnum = pgEnum("ca_prosegur_import_status", [
  "ok",
  "error",
  "partial",
]);

export const prosegurEntryStatusEnum = pgEnum("ca_prosegur_entry_status", [
  "mapped",
  "unmapped",
]);

export const caProsegurImportsTable = pgTable("ca_prosegur_imports", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  status: prosegurImportStatusEnum("status").notNull(),
  rowsTotal: integer("rows_total"),
  rowsMapped: integer("rows_mapped"),
  rowsUnmapped: integer("rows_unmapped"),
  errorMessage: text("error_message"),
});

export const caProsegurEntriesTable = pgTable("ca_prosegur_entries", {
  id: serial("id").primaryKey(),
  importId: integer("import_id")
    .notNull()
    .references(() => caProsegurImportsTable.id, { onDelete: "cascade" }),
  fecha: date("fecha").notNull(),
  horaEntrada: time("hora_entrada"),
  horaSalida: time("hora_salida"),
  dni: text("dni"),
  nombre: text("nombre"),
  tarjeta: text("tarjeta"),
  tractora: text("tractora"),
  remolque: text("remolque"),
  materialRaw: text("material_raw").notNull(),
  destinoRaw: text("destino_raw"),
  fullSeguimentNo: text("full_seguiment_no"),
  mappedMaterialId: integer("mapped_material_id").references(
    () => caMaterialesTable.id,
    { onDelete: "set null" }
  ),
  mappedProveedorId: integer("mapped_proveedor_id").references(
    () => caProveedoresTable.id,
    { onDelete: "set null" }
  ),
  status: prosegurEntryStatusEnum("status").notNull().default("unmapped"),
});

export const caProsegurMaterialMapTable = pgTable("ca_prosegur_material_map", {
  id: serial("id").primaryKey(),
  prosegurLabel: text("prosegur_label").notNull().unique(),
  materialId: integer("material_id")
    .notNull()
    .references(() => caMaterialesTable.id, { onDelete: "cascade" }),
  proveedorId: integer("proveedor_id")
    .notNull()
    .references(() => caProveedoresTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// ---------------------------------------------------------------------------
// Plantilla de horario (predefinida por Compras, se copia al iniciar distribución)
// ---------------------------------------------------------------------------

export const caHorarioPlantillaTable = pgTable(
  "ca_horario_plantilla",
  {
    id: serial("id").primaryKey(),
    dia: text("dia").notNull(),
    franja: text("franja").notNull(),
    silo: text("silo").notNull(),
    materialNom: text("material_nom").notNull(),
    creadoEn: timestamp("creado_en", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    uniqSlot: uniqueIndex("ca_horario_plantilla_slot_idx").on(
      t.dia,
      t.franja,
      t.silo
    ),
  })
);

// ---------------------------------------------------------------------------
// Horario de llegadas
// ---------------------------------------------------------------------------

export const caHorarioLlegadasTable = pgTable(
  "ca_horario_llegadas",
  {
    id: serial("id").primaryKey(),
    solicitudId: integer("solicitud_id")
      .notNull()
      .references(() => caSolicitudesTable.id, { onDelete: "cascade" }),
    dia: text("dia").notNull(),
    franja: text("franja").notNull(),
    silo: text("silo").notNull(),
    materialNom: text("material_nom").notNull(),
    creadoEn: timestamp("creado_en", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    uniqSlot: uniqueIndex("ca_horario_llegadas_slot_idx").on(
      t.solicitudId,
      t.dia,
      t.franja,
      t.silo
    ),
  })
);

// ---------------------------------------------------------------------------
// Row types
// ---------------------------------------------------------------------------

export type CaDestinoRow = typeof caDestinosTable.$inferSelect;
export type NewCaDestinoRow = typeof caDestinosTable.$inferInsert;

export type CaMaterialRow = typeof caMaterialesTable.$inferSelect;
export type NewCaMaterialRow = typeof caMaterialesTable.$inferInsert;

export type CaProveedorRow = typeof caProveedoresTable.$inferSelect;
export type NewCaProveedorRow = typeof caProveedoresTable.$inferInsert;

export type CaAsignacionRow = typeof caAsignacionesTable.$inferSelect;
export type NewCaAsignacionRow = typeof caAsignacionesTable.$inferInsert;

export type CaPlantillaDistribucionRow = typeof caPlantillaDistribucionTable.$inferSelect;
export type NewCaPlantillaDistribucionRow = typeof caPlantillaDistribucionTable.$inferInsert;

export type CaSolicitudRow = typeof caSolicitudesTable.$inferSelect;
export type NewCaSolicitudRow = typeof caSolicitudesTable.$inferInsert;

export type CaLineaSolicitudRow =
  typeof caLineasSolicitudTable.$inferSelect;
export type NewCaLineaSolicitudRow =
  typeof caLineasSolicitudTable.$inferInsert;

export type CaHistorialSolicitudRow =
  typeof caHistorialSolicitudTable.$inferSelect;
export type NewCaHistorialSolicitudRow =
  typeof caHistorialSolicitudTable.$inferInsert;

export type CaLineaDistribucionRow =
  typeof caLineasDistribucionTable.$inferSelect;
export type NewCaLineaDistribucionRow =
  typeof caLineasDistribucionTable.$inferInsert;

export type CaConfirmacionRow = typeof caConfirmacionesTable.$inferSelect;
export type NewCaConfirmacionRow = typeof caConfirmacionesTable.$inferInsert;

export type CaEntradaRealRow = typeof caEntradasRealesTable.$inferSelect;
export type NewCaEntradaRealRow = typeof caEntradasRealesTable.$inferInsert;

export type CaProsegurImportRow = typeof caProsegurImportsTable.$inferSelect;
export type NewCaProsegurImportRow = typeof caProsegurImportsTable.$inferInsert;

export type CaProsegurEntryRow = typeof caProsegurEntriesTable.$inferSelect;
export type NewCaProsegurEntryRow = typeof caProsegurEntriesTable.$inferInsert;

export type CaProsegurMaterialMapRow =
  typeof caProsegurMaterialMapTable.$inferSelect;
export type NewCaProsegurMaterialMapRow =
  typeof caProsegurMaterialMapTable.$inferInsert;

export type CaHorarioLlegadaRow = typeof caHorarioLlegadasTable.$inferSelect;
export type NewCaHorarioLlegadaRow = typeof caHorarioLlegadasTable.$inferInsert;

export type CaHorarioPlantillaRow = typeof caHorarioPlantillaTable.$inferSelect;
export type NewCaHorarioPlantillaRow = typeof caHorarioPlantillaTable.$inferInsert;
