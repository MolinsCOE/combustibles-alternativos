import type { RequestHandler } from "express";
import type { CreateRoleUseCase } from "../../application/use-cases/create-role.use-case.js";
import type { DeleteRoleUseCase } from "../../application/use-cases/delete-role.use-case.js";
import type { GetRoleDetailUseCase } from "../../application/use-cases/get-role-detail.use-case.js";
import type { ListRolesUseCase } from "../../application/use-cases/list-roles.use-case.js";
import type { UpdateRoleUseCase } from "../../application/use-cases/update-role.use-case.js";
import type {
  Role,
  RoleDetail,
  RoleWithUserCount
} from "../../domain/entities/role.js";
import type { PaginatedList } from "../../domain/entities/pagination.js";
import type { PaginationQuery, RoleBody } from "./schemas.js";

export type RolesControllerDeps = {
  createRole: CreateRoleUseCase;
  listRoles: ListRolesUseCase;
  getRoleDetail: GetRoleDetailUseCase;
  updateRole: UpdateRoleUseCase;
  deleteRole: DeleteRoleUseCase;
};

type RoleDto = {
  id: string;
  nombre: string;
  descripcion: string | null;
  fechaCreacion: string;
  fechaActualizacion: string;
};

type RoleWithCountDto = RoleDto & { numeroUsuarios: number };

type RoleDetailDto = RoleDto & {
  usuarios: Array<{ id: string; nombre: string; email: string; activo: boolean }>;
};

type PagedDto<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

function toRoleDto(role: Role): RoleDto {
  return {
    id: role.id,
    nombre: role.nombre,
    descripcion: role.descripcion,
    fechaCreacion: role.fechaCreacion.toISOString(),
    fechaActualizacion: role.fechaActualizacion.toISOString()
  };
}

function toRoleWithCountDto(role: RoleWithUserCount): RoleWithCountDto {
  return { ...toRoleDto(role), numeroUsuarios: role.numeroUsuarios };
}

function toRoleDetailDto(detail: RoleDetail): RoleDetailDto {
  return {
    ...toRoleDto(detail),
    usuarios: detail.usuarios.map((u) => ({
      id: u.id,
      nombre: u.nombre,
      email: u.email,
      activo: u.activo
    }))
  };
}

function toPagedDto(
  page: PaginatedList<RoleWithUserCount>
): PagedDto<RoleWithCountDto> {
  return {
    items: page.items.map(toRoleWithCountDto),
    page: page.page,
    pageSize: page.pageSize,
    total: page.total
  };
}

export class RolesController {
  constructor(private readonly deps: RolesControllerDeps) {}

  readonly list: RequestHandler = async (req, res, next) => {
    try {
      const query = req.query as unknown as PaginationQuery;
      const result = await this.deps.listRoles.execute({
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
      const detail = await this.deps.getRoleDetail.execute(id);
      res.status(200).json(toRoleDetailDto(detail));
    } catch (err) {
      next(err);
    }
  };

  readonly create: RequestHandler = async (req, res, next) => {
    try {
      const body = req.body as RoleBody;
      const created = await this.deps.createRole.execute({
        nombre: body.nombre,
        descripcion: body.descripcion ?? null
      });
      res.status(201).json(toRoleDto(created));
    } catch (err) {
      next(err);
    }
  };

  readonly update: RequestHandler = async (req, res, next) => {
    try {
      const { id } = req.params as { id: string };
      const body = req.body as RoleBody;
      const updated = await this.deps.updateRole.execute(id, {
        nombre: body.nombre,
        descripcion: body.descripcion ?? null
      });
      res.status(200).json(toRoleDto(updated));
    } catch (err) {
      next(err);
    }
  };

  readonly remove: RequestHandler = async (req, res, next) => {
    try {
      const { id } = req.params as { id: string };
      await this.deps.deleteRole.execute(id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
