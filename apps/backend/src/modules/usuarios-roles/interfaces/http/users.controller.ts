import type { RequestHandler } from "express";
import type { CreateUserUseCase } from "../../application/use-cases/create-user.use-case.js";
import type { DeleteUserUseCase } from "../../application/use-cases/delete-user.use-case.js";
import type { GetUserDetailUseCase } from "../../application/use-cases/get-user-detail.use-case.js";
import type { ListUsersUseCase } from "../../application/use-cases/list-users.use-case.js";
import type { UpdateUserUseCase } from "../../application/use-cases/update-user.use-case.js";
import type { PaginatedList } from "../../domain/entities/pagination.js";
import type { User, UserWithRole } from "../../domain/entities/user.js";
import type { PaginationQuery, UserBody } from "./schemas.js";

export type UsersControllerDeps = {
  createUser: CreateUserUseCase;
  listUsers: ListUsersUseCase;
  getUserDetail: GetUserDetailUseCase;
  updateUser: UpdateUserUseCase;
  deleteUser: DeleteUserUseCase;
};

type UserDto = {
  id: string;
  nombre: string;
  email: string;
  activo: boolean;
  rolId: string;
  fechaCreacion: string;
  fechaActualizacion: string;
};

type UserWithRoleDto = UserDto & { rolNombre: string };

type PagedDto<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    activo: user.activo,
    rolId: user.rolId,
    fechaCreacion: user.fechaCreacion.toISOString(),
    fechaActualizacion: user.fechaActualizacion.toISOString()
  };
}

function toUserWithRoleDto(user: UserWithRole): UserWithRoleDto {
  return { ...toUserDto(user), rolNombre: user.rolNombre };
}

function toPagedDto(
  page: PaginatedList<UserWithRole>
): PagedDto<UserWithRoleDto> {
  return {
    items: page.items.map(toUserWithRoleDto),
    page: page.page,
    pageSize: page.pageSize,
    total: page.total
  };
}

export class UsersController {
  constructor(private readonly deps: UsersControllerDeps) {}

  readonly list: RequestHandler = async (req, res, next) => {
    try {
      const query = req.query as unknown as PaginationQuery;
      const result = await this.deps.listUsers.execute({
        page: query.page,
        pageSize: query.pageSize
      });
      res.status(200).json(toPagedDto(result));
    } catch (err) {
      next(err);
    }
  };

  readonly detail: RequestHandler = async (req, res, next) => {
    try {
      const { id } = req.params as { id: string };
      const detail = await this.deps.getUserDetail.execute(id);
      res.status(200).json(toUserWithRoleDto(detail));
    } catch (err) {
      next(err);
    }
  };

  readonly create: RequestHandler = async (req, res, next) => {
    try {
      const body = req.body as UserBody;
      const created = await this.deps.createUser.execute({
        nombre: body.nombre,
        email: body.email,
        rolId: body.rolId,
        activo: body.activo
      });
      res.status(201).json(toUserDto(created));
    } catch (err) {
      next(err);
    }
  };

  readonly update: RequestHandler = async (req, res, next) => {
    try {
      const { id } = req.params as { id: string };
      const body = req.body as UserBody;
      const updated = await this.deps.updateUser.execute(id, {
        nombre: body.nombre,
        email: body.email,
        rolId: body.rolId,
        activo: body.activo
      });
      res.status(200).json(toUserDto(updated));
    } catch (err) {
      next(err);
    }
  };

  readonly remove: RequestHandler = async (req, res, next) => {
    try {
      const { id } = req.params as { id: string };
      await this.deps.deleteUser.execute(id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
