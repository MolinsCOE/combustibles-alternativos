import { sql } from "drizzle-orm";
import {
  boolean,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";

/**
 * Drizzle schema for the `usuarios-roles` module.
 *
 * Both tables live in the same file because drizzle-kit's CJS loader does
 * not resolve the `.js` → `.ts` extension mapping used at runtime, which
 * breaks cross-file imports between schema modules.
 *
 * - `roles.nombre` has a unique index (business rule + DB defense in depth).
 * - `usuarios.email` has a unique index (business rule + DB defense in depth).
 * - `usuarios.rol_id` restricts deletion of a role that still has users.
 */

export const rolesTable = pgTable(
  "roles",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    nombre: text("nombre").notNull(),
    descripcion: text("descripcion"),
    fechaCreacion: timestamp("fecha_creacion", { withTimezone: true })
      .notNull()
      .defaultNow(),
    fechaActualizacion: timestamp("fecha_actualizacion", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    nombreUnique: uniqueIndex("roles_nombre_unique").on(table.nombre)
  })
);

export const usuariosTable = pgTable(
  "usuarios",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    nombre: text("nombre").notNull(),
    email: text("email").notNull(),
    activo: boolean("activo").notNull().default(true),
    rolId: uuid("rol_id")
      .notNull()
      .references(() => rolesTable.id, { onDelete: "restrict" }),
    fechaCreacion: timestamp("fecha_creacion", { withTimezone: true })
      .notNull()
      .defaultNow(),
    fechaActualizacion: timestamp("fecha_actualizacion", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    emailUnique: uniqueIndex("usuarios_email_unique").on(table.email)
  })
);

export type RoleRow = typeof rolesTable.$inferSelect;
export type NewRoleRow = typeof rolesTable.$inferInsert;
export type UsuarioRow = typeof usuariosTable.$inferSelect;
export type NewUsuarioRow = typeof usuariosTable.$inferInsert;
