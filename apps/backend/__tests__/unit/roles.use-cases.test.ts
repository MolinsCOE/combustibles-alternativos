import { describe, expect, it, beforeEach } from "vitest";
import { CreateRoleUseCase } from "../../src/modules/usuarios-roles/application/use-cases/create-role.use-case.js";
import { DeleteRoleUseCase } from "../../src/modules/usuarios-roles/application/use-cases/delete-role.use-case.js";
import { GetRoleDetailUseCase } from "../../src/modules/usuarios-roles/application/use-cases/get-role-detail.use-case.js";
import { ListRolesUseCase } from "../../src/modules/usuarios-roles/application/use-cases/list-roles.use-case.js";
import { SeedDefaultRolesUseCase } from "../../src/modules/usuarios-roles/application/use-cases/seed-default-roles.use-case.js";
import { UpdateRoleUseCase } from "../../src/modules/usuarios-roles/application/use-cases/update-role.use-case.js";
import {
  ConflictError,
  NotFoundError,
  ValidationError
} from "../../src/shared/errors/domain-error.js";
import { InMemoryRoleRepository } from "../helpers/in-memory-role-repository.js";

describe("roles use cases", () => {
  let repo: InMemoryRoleRepository;

  beforeEach(() => {
    repo = new InMemoryRoleRepository();
  });

  describe("CreateRoleUseCase", () => {
    it("creates a role with trimmed inputs", async () => {
      const useCase = new CreateRoleUseCase(repo);
      const created = await useCase.execute({ nombre: "  Editor  ", descripcion: "  Desc  " });
      expect(created.nombre).toBe("Editor");
      expect(created.descripcion).toBe("Desc");
    });

    it("normalizes an empty description to null", async () => {
      const useCase = new CreateRoleUseCase(repo);
      const created = await useCase.execute({ nombre: "Lector", descripcion: "   " });
      expect(created.descripcion).toBeNull();
    });

    it("rejects empty name", async () => {
      const useCase = new CreateRoleUseCase(repo);
      await expect(useCase.execute({ nombre: "   ", descripcion: null })).rejects.toBeInstanceOf(
        ValidationError
      );
    });

    it("rejects duplicate name (case-insensitive)", async () => {
      const useCase = new CreateRoleUseCase(repo);
      await useCase.execute({ nombre: "Admin", descripcion: null });
      await expect(useCase.execute({ nombre: "admin", descripcion: null })).rejects.toBeInstanceOf(
        ConflictError
      );
    });
  });

  describe("ListRolesUseCase", () => {
    it("returns paginated results sorted by name", async () => {
      const create = new CreateRoleUseCase(repo);
      await create.execute({ nombre: "Zebra", descripcion: null });
      await create.execute({ nombre: "Alpha", descripcion: null });
      const useCase = new ListRolesUseCase(repo);
      const result = await useCase.execute({ page: 1, pageSize: 10 });
      expect(result.total).toBe(2);
      expect(result.items[0]?.nombre).toBe("Alpha");
      expect(result.items[1]?.nombre).toBe("Zebra");
    });
  });

  describe("GetRoleDetailUseCase", () => {
    it("returns detail with users list", async () => {
      const created = await new CreateRoleUseCase(repo).execute({
        nombre: "Admin",
        descripcion: null
      });
      const useCase = new GetRoleDetailUseCase(repo);
      const detail = await useCase.execute(created.id);
      expect(detail.id).toBe(created.id);
      expect(detail.usuarios).toEqual([]);
    });

    it("throws NotFoundError when role does not exist", async () => {
      const useCase = new GetRoleDetailUseCase(repo);
      await expect(useCase.execute("missing")).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("UpdateRoleUseCase", () => {
    it("updates nombre and descripcion", async () => {
      const created = await new CreateRoleUseCase(repo).execute({
        nombre: "Admin",
        descripcion: "orig"
      });
      const useCase = new UpdateRoleUseCase(repo);
      const updated = await useCase.execute(created.id, {
        nombre: "Administrador",
        descripcion: "nueva"
      });
      expect(updated.nombre).toBe("Administrador");
      expect(updated.descripcion).toBe("nueva");
    });

    it("allows same name on same role", async () => {
      const created = await new CreateRoleUseCase(repo).execute({
        nombre: "Admin",
        descripcion: null
      });
      const updated = await new UpdateRoleUseCase(repo).execute(created.id, {
        nombre: "admin",
        descripcion: "cambiada"
      });
      expect(updated.descripcion).toBe("cambiada");
    });

    it("rejects duplicate name of another role", async () => {
      await new CreateRoleUseCase(repo).execute({ nombre: "Admin", descripcion: null });
      const second = await new CreateRoleUseCase(repo).execute({
        nombre: "Editor",
        descripcion: null
      });
      await expect(
        new UpdateRoleUseCase(repo).execute(second.id, { nombre: "Admin", descripcion: null })
      ).rejects.toBeInstanceOf(ConflictError);
    });

    it("throws NotFoundError when role does not exist", async () => {
      await expect(
        new UpdateRoleUseCase(repo).execute("missing", { nombre: "X", descripcion: null })
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("rejects empty name", async () => {
      const created = await new CreateRoleUseCase(repo).execute({
        nombre: "Admin",
        descripcion: null
      });
      await expect(
        new UpdateRoleUseCase(repo).execute(created.id, { nombre: "  ", descripcion: null })
      ).rejects.toBeInstanceOf(ValidationError);
    });
  });

  describe("DeleteRoleUseCase", () => {
    it("deletes a role without users", async () => {
      const created = await new CreateRoleUseCase(repo).execute({
        nombre: "Admin",
        descripcion: null
      });
      await new DeleteRoleUseCase(repo).execute(created.id);
      const listed = await new ListRolesUseCase(repo).execute({ page: 1, pageSize: 10 });
      expect(listed.total).toBe(0);
    });

    it("rejects delete when users are assigned (singular)", async () => {
      const created = await new CreateRoleUseCase(repo).execute({
        nombre: "Admin",
        descripcion: null
      });
      repo.setUserCount(created.id, 1);
      const error = await new DeleteRoleUseCase(repo)
        .execute(created.id)
        .catch((e: unknown) => e);
      expect(error).toBeInstanceOf(ConflictError);
      expect((error as ConflictError).message).toContain("1 usuario asignado");
    });

    it("rejects delete when users are assigned (plural)", async () => {
      const created = await new CreateRoleUseCase(repo).execute({
        nombre: "Admin",
        descripcion: null
      });
      repo.setUserCount(created.id, 3);
      const error = await new DeleteRoleUseCase(repo)
        .execute(created.id)
        .catch((e: unknown) => e);
      expect(error).toBeInstanceOf(ConflictError);
      expect((error as ConflictError).message).toContain("3 usuarios asignados");
    });

    it("throws NotFoundError when role does not exist", async () => {
      await expect(new DeleteRoleUseCase(repo).execute("missing")).rejects.toBeInstanceOf(
        NotFoundError
      );
    });
  });

  describe("SeedDefaultRolesUseCase", () => {
    it("creates the two default roles on first run", async () => {
      await new SeedDefaultRolesUseCase(repo).execute();
      const { items, total } = await new ListRolesUseCase(repo).execute({
        page: 1,
        pageSize: 10
      });
      expect(total).toBe(2);
      expect(items.map((r) => r.nombre).sort()).toEqual(["Admin", "Usuario básico"]);
    });

    it("is idempotent", async () => {
      const seeder = new SeedDefaultRolesUseCase(repo);
      await seeder.execute();
      await seeder.execute();
      const { total } = await new ListRolesUseCase(repo).execute({ page: 1, pageSize: 10 });
      expect(total).toBe(2);
    });
  });
});
