/**
 * Drizzle schema — single source of truth for the PostgreSQL schema.
 *
 * Module-specific tables are declared in `<module>/infrastructure/db/*.schema.ts`
 * and re-exported from this barrel so drizzle-kit picks them up from one path.
 */

export {
  rolesTable,
  usuariosTable,
  type RoleRow,
  type NewRoleRow,
  type UsuarioRow,
  type NewUsuarioRow
} from "../../../../modules/usuarios-roles/infrastructure/db/usuarios-roles.schema.js";
