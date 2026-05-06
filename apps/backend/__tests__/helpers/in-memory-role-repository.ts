import type {
  Role,
  RoleDetail,
  RoleWithUserCount
} from "../../src/modules/usuarios-roles/domain/entities/role.js";
import type {
  PaginatedList,
  PaginationParams
} from "../../src/modules/usuarios-roles/domain/entities/pagination.js";
import type {
  CreateRoleInput,
  RoleRepository,
  UpdateRoleInput
} from "../../src/modules/usuarios-roles/domain/ports/role-repository.port.js";

type InternalRole = Role & { usersCount: number };

export class InMemoryRoleRepository implements RoleRepository {
  private roles: InternalRole[] = [];
  private idCounter = 0;

  setUserCount(id: string, count: number): void {
    const role = this.roles.find((r) => r.id === id);
    if (role) role.usersCount = count;
  }

  private nextId(): string {
    this.idCounter += 1;
    return `11111111-1111-1111-1111-${this.idCounter.toString().padStart(12, "0")}`;
  }

  private clone(role: InternalRole): Role {
    return {
      id: role.id,
      nombre: role.nombre,
      descripcion: role.descripcion,
      fechaCreacion: role.fechaCreacion,
      fechaActualizacion: role.fechaActualizacion
    };
  }

  findByNombre(nombre: string): Promise<Role | null> {
    const match = this.roles.find((r) => r.nombre.toLowerCase() === nombre.toLowerCase());
    return Promise.resolve(match ? this.clone(match) : null);
  }

  findById(id: string): Promise<Role | null> {
    const match = this.roles.find((r) => r.id === id);
    return Promise.resolve(match ? this.clone(match) : null);
  }

  findDetailById(id: string): Promise<RoleDetail | null> {
    const match = this.roles.find((r) => r.id === id);
    if (!match) return Promise.resolve(null);
    return Promise.resolve({ ...this.clone(match), usuarios: [] });
  }

  create(input: CreateRoleInput): Promise<Role> {
    const now = new Date();
    const created: InternalRole = {
      id: this.nextId(),
      nombre: input.nombre,
      descripcion: input.descripcion,
      fechaCreacion: now,
      fechaActualizacion: now,
      usersCount: 0
    };
    this.roles.push(created);
    return Promise.resolve(this.clone(created));
  }

  update(id: string, input: UpdateRoleInput): Promise<Role | null> {
    const role = this.roles.find((r) => r.id === id);
    if (!role) return Promise.resolve(null);
    role.nombre = input.nombre;
    role.descripcion = input.descripcion;
    role.fechaActualizacion = new Date();
    return Promise.resolve(this.clone(role));
  }

  delete(id: string): Promise<void> {
    this.roles = this.roles.filter((r) => r.id !== id);
    return Promise.resolve();
  }

  list(params: PaginationParams): Promise<PaginatedList<RoleWithUserCount>> {
    const sorted = [...this.roles].sort((a, b) => a.nombre.localeCompare(b.nombre));
    const offset = (params.page - 1) * params.pageSize;
    const items = sorted.slice(offset, offset + params.pageSize).map((r) => ({
      ...this.clone(r),
      numeroUsuarios: r.usersCount
    }));
    return Promise.resolve({
      items,
      page: params.page,
      pageSize: params.pageSize,
      total: sorted.length
    });
  }

  countUsers(rolId: string): Promise<number> {
    const role = this.roles.find((r) => r.id === rolId);
    return Promise.resolve(role?.usersCount ?? 0);
  }
}
