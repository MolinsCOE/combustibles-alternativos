import { Router, type Router as ExpressRouter } from "express";
import type { Db } from "../../shared/infrastructure/db/client.js";
import { CreateRoleUseCase } from "./application/use-cases/create-role.use-case.js";
import { CreateUserUseCase } from "./application/use-cases/create-user.use-case.js";
import { DeleteRoleUseCase } from "./application/use-cases/delete-role.use-case.js";
import { DeleteUserUseCase } from "./application/use-cases/delete-user.use-case.js";
import { GetRoleDetailUseCase } from "./application/use-cases/get-role-detail.use-case.js";
import { GetUserDetailUseCase } from "./application/use-cases/get-user-detail.use-case.js";
import { ListRolesUseCase } from "./application/use-cases/list-roles.use-case.js";
import { ListUsersUseCase } from "./application/use-cases/list-users.use-case.js";
import { SeedDefaultRolesUseCase } from "./application/use-cases/seed-default-roles.use-case.js";
import { UpdateRoleUseCase } from "./application/use-cases/update-role.use-case.js";
import { UpdateUserUseCase } from "./application/use-cases/update-user.use-case.js";
import { PostgresRoleRepository } from "./infrastructure/postgres-role.repository.js";
import { PostgresUserRepository } from "./infrastructure/postgres-user.repository.js";
import { RolesController } from "./interfaces/http/roles.controller.js";
import { buildRolesRouter } from "./interfaces/http/roles.routes.js";
import { UsersController } from "./interfaces/http/users.controller.js";
import { buildUsersRouter } from "./interfaces/http/users.routes.js";

export type UsuariosRolesModule = {
  router: ExpressRouter;
  seedDefaultRoles: SeedDefaultRolesUseCase;
};

/**
 * Builds the usuarios-roles module. Called from the composition root with
 * a wired database handle. Returns a single router with /roles and
 * /usuarios endpoints plus the seed use case so server startup can run
 * idempotent data seeding.
 */
export function buildUsuariosRolesModule(db: Db): UsuariosRolesModule {
  const roleRepository = new PostgresRoleRepository(db);
  const userRepository = new PostgresUserRepository(db);

  const createRole = new CreateRoleUseCase(roleRepository);
  const listRoles = new ListRolesUseCase(roleRepository);
  const getRoleDetail = new GetRoleDetailUseCase(roleRepository);
  const updateRole = new UpdateRoleUseCase(roleRepository);
  const deleteRole = new DeleteRoleUseCase(roleRepository);
  const seedDefaultRoles = new SeedDefaultRolesUseCase(roleRepository);

  const createUser = new CreateUserUseCase(userRepository, roleRepository);
  const listUsers = new ListUsersUseCase(userRepository);
  const getUserDetail = new GetUserDetailUseCase(userRepository);
  const updateUser = new UpdateUserUseCase(userRepository, roleRepository);
  const deleteUser = new DeleteUserUseCase(userRepository);

  const rolesController = new RolesController({
    createRole,
    listRoles,
    getRoleDetail,
    updateRole,
    deleteRole
  });

  const usersController = new UsersController({
    createUser,
    listUsers,
    getUserDetail,
    updateUser,
    deleteUser
  });

  const router = Router();
  router.use(buildRolesRouter(rolesController));
  router.use(buildUsersRouter(usersController));

  return { router, seedDefaultRoles };
}
