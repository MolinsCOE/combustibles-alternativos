import type { User, UserWithRole } from "../entities/user.js";
import type { PaginatedList, PaginationParams } from "../entities/pagination.js";

export type CreateUserInput = {
  nombre: string;
  email: string;
  activo: boolean;
  rolId: string;
};

export type UpdateUserInput = CreateUserInput;

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findByIdWithRole(id: string): Promise<UserWithRole | null>;
  create(input: CreateUserInput): Promise<User>;
  update(id: string, input: UpdateUserInput): Promise<User | null>;
  delete(id: string): Promise<void>;
  list(params: PaginationParams): Promise<PaginatedList<UserWithRole>>;
}
