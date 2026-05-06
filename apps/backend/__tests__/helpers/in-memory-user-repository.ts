import type {
  PaginatedList,
  PaginationParams
} from "../../src/modules/usuarios-roles/domain/entities/pagination.js";
import type { User, UserWithRole } from "../../src/modules/usuarios-roles/domain/entities/user.js";
import type {
  CreateUserInput,
  UpdateUserInput,
  UserRepository
} from "../../src/modules/usuarios-roles/domain/ports/user-repository.port.js";

type RoleLookup = (id: string) => string | null;

type Internal = User;

export class InMemoryUserRepository implements UserRepository {
  private users: Internal[] = [];
  private idCounter = 0;

  constructor(private readonly roleNameById: RoleLookup = () => null) {}

  private nextId(): string {
    this.idCounter += 1;
    return `22222222-2222-2222-2222-${this.idCounter.toString().padStart(12, "0")}`;
  }

  private clone(u: Internal): User {
    return { ...u };
  }

  findByEmail(email: string): Promise<User | null> {
    const match = this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    return Promise.resolve(match ? this.clone(match) : null);
  }

  findById(id: string): Promise<User | null> {
    const match = this.users.find((u) => u.id === id);
    return Promise.resolve(match ? this.clone(match) : null);
  }

  findByIdWithRole(id: string): Promise<UserWithRole | null> {
    const match = this.users.find((u) => u.id === id);
    if (!match) return Promise.resolve(null);
    const rolNombre = this.roleNameById(match.rolId) ?? "Rol desconocido";
    return Promise.resolve({ ...this.clone(match), rolNombre });
  }

  create(input: CreateUserInput): Promise<User> {
    const now = new Date();
    const created: Internal = {
      id: this.nextId(),
      nombre: input.nombre,
      email: input.email,
      activo: input.activo,
      rolId: input.rolId,
      fechaCreacion: now,
      fechaActualizacion: now
    };
    this.users.push(created);
    return Promise.resolve(this.clone(created));
  }

  update(id: string, input: UpdateUserInput): Promise<User | null> {
    const u = this.users.find((x) => x.id === id);
    if (!u) return Promise.resolve(null);
    u.nombre = input.nombre;
    u.email = input.email;
    u.activo = input.activo;
    u.rolId = input.rolId;
    u.fechaActualizacion = new Date();
    return Promise.resolve(this.clone(u));
  }

  delete(id: string): Promise<void> {
    this.users = this.users.filter((u) => u.id !== id);
    return Promise.resolve();
  }

  list(params: PaginationParams): Promise<PaginatedList<UserWithRole>> {
    const sorted = [...this.users].sort((a, b) => a.nombre.localeCompare(b.nombre));
    const offset = (params.page - 1) * params.pageSize;
    const items = sorted.slice(offset, offset + params.pageSize).map((u) => ({
      ...this.clone(u),
      rolNombre: this.roleNameById(u.rolId) ?? "Rol desconocido"
    }));
    return Promise.resolve({
      items,
      page: params.page,
      pageSize: params.pageSize,
      total: sorted.length
    });
  }
}
