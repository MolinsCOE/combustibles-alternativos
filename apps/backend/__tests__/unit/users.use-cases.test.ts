import { beforeEach, describe, expect, it } from "vitest";
import { CreateRoleUseCase } from "../../src/modules/usuarios-roles/application/use-cases/create-role.use-case.js";
import { CreateUserUseCase } from "../../src/modules/usuarios-roles/application/use-cases/create-user.use-case.js";
import { DeleteUserUseCase } from "../../src/modules/usuarios-roles/application/use-cases/delete-user.use-case.js";
import { GetUserDetailUseCase } from "../../src/modules/usuarios-roles/application/use-cases/get-user-detail.use-case.js";
import { ListUsersUseCase } from "../../src/modules/usuarios-roles/application/use-cases/list-users.use-case.js";
import { UpdateUserUseCase } from "../../src/modules/usuarios-roles/application/use-cases/update-user.use-case.js";
import {
  ConflictError,
  NotFoundError,
  ValidationError
} from "../../src/shared/errors/domain-error.js";
import { InMemoryRoleRepository } from "../helpers/in-memory-role-repository.js";
import { InMemoryUserRepository } from "../helpers/in-memory-user-repository.js";

describe("users use cases", () => {
  let roles: InMemoryRoleRepository;
  let users: InMemoryUserRepository;
  let rolAdminId: string;

  beforeEach(async () => {
    roles = new InMemoryRoleRepository();
    const admin = await new CreateRoleUseCase(roles).execute({
      nombre: "Admin",
      descripcion: null
    });
    rolAdminId = admin.id;
    users = new InMemoryUserRepository((id) =>
      id === admin.id ? admin.nombre : null
    );
  });

  describe("CreateUserUseCase", () => {
    it("creates a user with trimmed and lowercased email", async () => {
      const useCase = new CreateUserUseCase(users, roles);
      const created = await useCase.execute({
        nombre: "  Ana Molins  ",
        email: "  Ana@Molins.DEV  ",
        rolId: rolAdminId,
        activo: true
      });
      expect(created.nombre).toBe("Ana Molins");
      expect(created.email).toBe("ana@molins.dev");
      expect(created.activo).toBe(true);
    });

    it("rejects empty nombre", async () => {
      const useCase = new CreateUserUseCase(users, roles);
      await expect(
        useCase.execute({
          nombre: "   ",
          email: "a@b.com",
          rolId: rolAdminId,
          activo: true
        })
      ).rejects.toBeInstanceOf(ValidationError);
    });

    it("rejects empty email", async () => {
      const useCase = new CreateUserUseCase(users, roles);
      await expect(
        useCase.execute({
          nombre: "Ana",
          email: "   ",
          rolId: rolAdminId,
          activo: true
        })
      ).rejects.toBeInstanceOf(ValidationError);
    });

    it("rejects non-existent rol", async () => {
      const useCase = new CreateUserUseCase(users, roles);
      await expect(
        useCase.execute({
          nombre: "Ana",
          email: "a@b.com",
          rolId: "00000000-0000-0000-0000-000000000000",
          activo: true
        })
      ).rejects.toBeInstanceOf(ValidationError);
    });

    it("rejects duplicate email (case-insensitive)", async () => {
      const useCase = new CreateUserUseCase(users, roles);
      await useCase.execute({
        nombre: "Ana",
        email: "ana@molins.dev",
        rolId: rolAdminId,
        activo: true
      });
      await expect(
        useCase.execute({
          nombre: "Otra",
          email: "ANA@molins.dev",
          rolId: rolAdminId,
          activo: true
        })
      ).rejects.toBeInstanceOf(ConflictError);
    });
  });

  describe("ListUsersUseCase", () => {
    it("returns paginated users sorted by name with rolNombre", async () => {
      const create = new CreateUserUseCase(users, roles);
      await create.execute({
        nombre: "Zoe",
        email: "z@m.dev",
        rolId: rolAdminId,
        activo: true
      });
      await create.execute({
        nombre: "Ana",
        email: "a@m.dev",
        rolId: rolAdminId,
        activo: true
      });
      const result = await new ListUsersUseCase(users).execute({
        page: 1,
        pageSize: 10
      });
      expect(result.total).toBe(2);
      expect(result.items[0]?.nombre).toBe("Ana");
      expect(result.items[0]?.rolNombre).toBe("Admin");
    });
  });

  describe("GetUserDetailUseCase", () => {
    it("returns detail including rol name", async () => {
      const created = await new CreateUserUseCase(users, roles).execute({
        nombre: "Ana",
        email: "a@m.dev",
        rolId: rolAdminId,
        activo: true
      });
      const detail = await new GetUserDetailUseCase(users).execute(created.id);
      expect(detail.id).toBe(created.id);
      expect(detail.rolNombre).toBe("Admin");
    });

    it("throws NotFoundError when user does not exist", async () => {
      await expect(
        new GetUserDetailUseCase(users).execute("missing")
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("UpdateUserUseCase", () => {
    it("updates all fields", async () => {
      const created = await new CreateUserUseCase(users, roles).execute({
        nombre: "Ana",
        email: "a@m.dev",
        rolId: rolAdminId,
        activo: true
      });
      const updated = await new UpdateUserUseCase(users, roles).execute(
        created.id,
        {
          nombre: "Ana M.",
          email: "ana@m.dev",
          rolId: rolAdminId,
          activo: false
        }
      );
      expect(updated.nombre).toBe("Ana M.");
      expect(updated.email).toBe("ana@m.dev");
      expect(updated.activo).toBe(false);
    });

    it("allows keeping same email on same user", async () => {
      const created = await new CreateUserUseCase(users, roles).execute({
        nombre: "Ana",
        email: "ana@m.dev",
        rolId: rolAdminId,
        activo: true
      });
      const updated = await new UpdateUserUseCase(users, roles).execute(
        created.id,
        {
          nombre: "Ana 2",
          email: "ANA@m.dev",
          rolId: rolAdminId,
          activo: true
        }
      );
      expect(updated.nombre).toBe("Ana 2");
    });

    it("rejects duplicate email from another user", async () => {
      const create = new CreateUserUseCase(users, roles);
      await create.execute({
        nombre: "A",
        email: "a@m.dev",
        rolId: rolAdminId,
        activo: true
      });
      const b = await create.execute({
        nombre: "B",
        email: "b@m.dev",
        rolId: rolAdminId,
        activo: true
      });
      await expect(
        new UpdateUserUseCase(users, roles).execute(b.id, {
          nombre: "B",
          email: "a@m.dev",
          rolId: rolAdminId,
          activo: true
        })
      ).rejects.toBeInstanceOf(ConflictError);
    });

    it("throws NotFoundError when user does not exist", async () => {
      await expect(
        new UpdateUserUseCase(users, roles).execute("missing", {
          nombre: "A",
          email: "a@m.dev",
          rolId: rolAdminId,
          activo: true
        })
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("rejects empty nombre", async () => {
      const created = await new CreateUserUseCase(users, roles).execute({
        nombre: "Ana",
        email: "a@m.dev",
        rolId: rolAdminId,
        activo: true
      });
      await expect(
        new UpdateUserUseCase(users, roles).execute(created.id, {
          nombre: "   ",
          email: "a@m.dev",
          rolId: rolAdminId,
          activo: true
        })
      ).rejects.toBeInstanceOf(ValidationError);
    });

    it("rejects empty email", async () => {
      const created = await new CreateUserUseCase(users, roles).execute({
        nombre: "Ana",
        email: "a@m.dev",
        rolId: rolAdminId,
        activo: true
      });
      await expect(
        new UpdateUserUseCase(users, roles).execute(created.id, {
          nombre: "Ana",
          email: "   ",
          rolId: rolAdminId,
          activo: true
        })
      ).rejects.toBeInstanceOf(ValidationError);
    });

    it("rejects non-existent rol", async () => {
      const created = await new CreateUserUseCase(users, roles).execute({
        nombre: "Ana",
        email: "a@m.dev",
        rolId: rolAdminId,
        activo: true
      });
      await expect(
        new UpdateUserUseCase(users, roles).execute(created.id, {
          nombre: "Ana",
          email: "a@m.dev",
          rolId: "00000000-0000-0000-0000-000000000000",
          activo: true
        })
      ).rejects.toBeInstanceOf(ValidationError);
    });
  });

  describe("DeleteUserUseCase", () => {
    it("deletes an existing user", async () => {
      const created = await new CreateUserUseCase(users, roles).execute({
        nombre: "Ana",
        email: "a@m.dev",
        rolId: rolAdminId,
        activo: true
      });
      await new DeleteUserUseCase(users).execute(created.id);
      const after = await new ListUsersUseCase(users).execute({
        page: 1,
        pageSize: 10
      });
      expect(after.total).toBe(0);
    });

    it("throws NotFoundError when user does not exist", async () => {
      await expect(
        new DeleteUserUseCase(users).execute("missing")
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
