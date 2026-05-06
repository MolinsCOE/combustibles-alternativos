import { asc, eq, sql } from "drizzle-orm";
import type { Db } from "../../../shared/infrastructure/db/client.js";
import type { PaginatedList, PaginationParams } from "../domain/entities/pagination.js";
import type {
  Role,
  RoleDetail,
  RoleUserSummary,
  RoleWithUserCount
} from "../domain/entities/role.js";
import type {
  CreateRoleInput,
  RoleRepository,
  UpdateRoleInput
} from "../domain/ports/role-repository.port.js";
import {
  rolesTable,
  usuariosTable,
  type RoleRow
} from "./db/usuarios-roles.schema.js";

function toRole(row: RoleRow): Role {
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    fechaCreacion: row.fechaCreacion,
    fechaActualizacion: row.fechaActualizacion
  };
}

export class PostgresRoleRepository implements RoleRepository {
  constructor(private readonly db: Db) {}

  async findByNombre(nombre: string): Promise<Role | null> {
    const rows = await this.db
      .select()
      .from(rolesTable)
      .where(sql`lower(${rolesTable.nombre}) = lower(${nombre})`)
      .limit(1);
    const row = rows[0];
    return row ? toRole(row) : null;
  }

  async findById(id: string): Promise<Role | null> {
    const rows = await this.db
      .select()
      .from(rolesTable)
      .where(eq(rolesTable.id, id))
      .limit(1);
    const row = rows[0];
    return row ? toRole(row) : null;
  }

  async findDetailById(id: string): Promise<RoleDetail | null> {
    const role = await this.findById(id);
    if (!role) return null;

    const userRows = await this.db
      .select({
        id: usuariosTable.id,
        nombre: usuariosTable.nombre,
        email: usuariosTable.email,
        activo: usuariosTable.activo
      })
      .from(usuariosTable)
      .where(eq(usuariosTable.rolId, id))
      .orderBy(asc(usuariosTable.nombre));

    const usuarios: RoleUserSummary[] = userRows.map((u) => ({
      id: u.id,
      nombre: u.nombre,
      email: u.email,
      activo: u.activo
    }));

    return { ...role, usuarios };
  }

  async create(input: CreateRoleInput): Promise<Role> {
    const [row] = await this.db
      .insert(rolesTable)
      .values({ nombre: input.nombre, descripcion: input.descripcion })
      .returning();
    if (!row) {
      throw new Error("Insert returned no row for roles.create");
    }
    return toRole(row);
  }

  async update(id: string, input: UpdateRoleInput): Promise<Role | null> {
    const [row] = await this.db
      .update(rolesTable)
      .set({
        nombre: input.nombre,
        descripcion: input.descripcion,
        fechaActualizacion: new Date()
      })
      .where(eq(rolesTable.id, id))
      .returning();
    return row ? toRole(row) : null;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(rolesTable).where(eq(rolesTable.id, id));
  }

  async list(params: PaginationParams): Promise<PaginatedList<RoleWithUserCount>> {
    const offset = (params.page - 1) * params.pageSize;

    const rows = await this.db
      .select({
        id: rolesTable.id,
        nombre: rolesTable.nombre,
        descripcion: rolesTable.descripcion,
        fechaCreacion: rolesTable.fechaCreacion,
        fechaActualizacion: rolesTable.fechaActualizacion,
        numeroUsuarios: sql<number>`count(${usuariosTable.id})::int`
      })
      .from(rolesTable)
      .leftJoin(usuariosTable, eq(usuariosTable.rolId, rolesTable.id))
      .groupBy(rolesTable.id)
      .orderBy(asc(rolesTable.nombre))
      .limit(params.pageSize)
      .offset(offset);

    const totalRows = await this.db
      .select({ total: sql<number>`count(*)::int` })
      .from(rolesTable);
    const total = totalRows[0]?.total ?? 0;

    const items: RoleWithUserCount[] = rows.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      descripcion: r.descripcion,
      fechaCreacion: r.fechaCreacion,
      fechaActualizacion: r.fechaActualizacion,
      numeroUsuarios: r.numeroUsuarios
    }));

    return {
      items,
      page: params.page,
      pageSize: params.pageSize,
      total: total ?? 0
    };
  }

  async countUsers(rolId: string): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(usuariosTable)
      .where(eq(usuariosTable.rolId, rolId));
    return row?.count ?? 0;
  }
}
