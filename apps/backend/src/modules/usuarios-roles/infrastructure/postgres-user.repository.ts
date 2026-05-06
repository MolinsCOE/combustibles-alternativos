import { asc, eq, sql } from "drizzle-orm";
import type { Db } from "../../../shared/infrastructure/db/client.js";
import type { PaginatedList, PaginationParams } from "../domain/entities/pagination.js";
import type { User, UserWithRole } from "../domain/entities/user.js";
import type {
  CreateUserInput,
  UpdateUserInput,
  UserRepository
} from "../domain/ports/user-repository.port.js";
import {
  rolesTable,
  usuariosTable,
  type UsuarioRow
} from "./db/usuarios-roles.schema.js";

function toUser(row: UsuarioRow): User {
  return {
    id: row.id,
    nombre: row.nombre,
    email: row.email,
    activo: row.activo,
    rolId: row.rolId,
    fechaCreacion: row.fechaCreacion,
    fechaActualizacion: row.fechaActualizacion
  };
}

export class PostgresUserRepository implements UserRepository {
  constructor(private readonly db: Db) {}

  async findByEmail(email: string): Promise<User | null> {
    const rows = await this.db
      .select()
      .from(usuariosTable)
      .where(sql`lower(${usuariosTable.email}) = lower(${email})`)
      .limit(1);
    const row = rows[0];
    return row ? toUser(row) : null;
  }

  async findById(id: string): Promise<User | null> {
    const rows = await this.db
      .select()
      .from(usuariosTable)
      .where(eq(usuariosTable.id, id))
      .limit(1);
    const row = rows[0];
    return row ? toUser(row) : null;
  }

  async findByIdWithRole(id: string): Promise<UserWithRole | null> {
    const rows = await this.db
      .select({
        id: usuariosTable.id,
        nombre: usuariosTable.nombre,
        email: usuariosTable.email,
        activo: usuariosTable.activo,
        rolId: usuariosTable.rolId,
        fechaCreacion: usuariosTable.fechaCreacion,
        fechaActualizacion: usuariosTable.fechaActualizacion,
        rolNombre: rolesTable.nombre
      })
      .from(usuariosTable)
      .innerJoin(rolesTable, eq(rolesTable.id, usuariosTable.rolId))
      .where(eq(usuariosTable.id, id))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    return {
      id: row.id,
      nombre: row.nombre,
      email: row.email,
      activo: row.activo,
      rolId: row.rolId,
      fechaCreacion: row.fechaCreacion,
      fechaActualizacion: row.fechaActualizacion,
      rolNombre: row.rolNombre
    };
  }

  async create(input: CreateUserInput): Promise<User> {
    const [row] = await this.db
      .insert(usuariosTable)
      .values({
        nombre: input.nombre,
        email: input.email,
        activo: input.activo,
        rolId: input.rolId
      })
      .returning();
    if (!row) {
      throw new Error("Insert returned no row for usuarios.create");
    }
    return toUser(row);
  }

  async update(id: string, input: UpdateUserInput): Promise<User | null> {
    const [row] = await this.db
      .update(usuariosTable)
      .set({
        nombre: input.nombre,
        email: input.email,
        activo: input.activo,
        rolId: input.rolId,
        fechaActualizacion: new Date()
      })
      .where(eq(usuariosTable.id, id))
      .returning();
    return row ? toUser(row) : null;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(usuariosTable).where(eq(usuariosTable.id, id));
  }

  async list(params: PaginationParams): Promise<PaginatedList<UserWithRole>> {
    const offset = (params.page - 1) * params.pageSize;

    const rows = await this.db
      .select({
        id: usuariosTable.id,
        nombre: usuariosTable.nombre,
        email: usuariosTable.email,
        activo: usuariosTable.activo,
        rolId: usuariosTable.rolId,
        fechaCreacion: usuariosTable.fechaCreacion,
        fechaActualizacion: usuariosTable.fechaActualizacion,
        rolNombre: rolesTable.nombre
      })
      .from(usuariosTable)
      .innerJoin(rolesTable, eq(rolesTable.id, usuariosTable.rolId))
      .orderBy(asc(usuariosTable.nombre))
      .limit(params.pageSize)
      .offset(offset);

    const totalRows = await this.db
      .select({ total: sql<number>`count(*)::int` })
      .from(usuariosTable);
    const total = totalRows[0]?.total ?? 0;

    const items: UserWithRole[] = rows.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      email: r.email,
      activo: r.activo,
      rolId: r.rolId,
      fechaCreacion: r.fechaCreacion,
      fechaActualizacion: r.fechaActualizacion,
      rolNombre: r.rolNombre
    }));

    return {
      items,
      page: params.page,
      pageSize: params.pageSize,
      total
    };
  }
}
