import type {
  Role,
  RoleDetail,
  RoleWithUserCount
} from "../entities/role.js";
import type { PaginatedList, PaginationParams } from "../entities/pagination.js";

export type CreateRoleInput = {
  nombre: string;
  descripcion: string | null;
};

export type UpdateRoleInput = CreateRoleInput;

export interface RoleRepository {
  findByNombre(nombre: string): Promise<Role | null>;
  findById(id: string): Promise<Role | null>;
  findDetailById(id: string): Promise<RoleDetail | null>;
  create(input: CreateRoleInput): Promise<Role>;
  update(id: string, input: UpdateRoleInput): Promise<Role | null>;
  delete(id: string): Promise<void>;
  list(params: PaginationParams): Promise<PaginatedList<RoleWithUserCount>>;
  countUsers(rolId: string): Promise<number>;
}
