import { sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { SeedDefaultRolesUseCase } from "../../src/modules/usuarios-roles/application/use-cases/seed-default-roles.use-case.js";
import { PostgresRoleRepository } from "../../src/modules/usuarios-roles/infrastructure/postgres-role.repository.js";
import { buildTestComposedApp } from "../helpers/build-test-app.js";

const { db } = buildTestComposedApp();

async function resetRoles(): Promise<void> {
  await db.execute(sql`truncate table usuarios, roles restart identity cascade`);
}

describe("SeedDefaultRolesUseCase against real Postgres", () => {
  beforeEach(async () => {
    await resetRoles();
  });

  it("creates Admin and Usuario básico on first run", async () => {
    const repo = new PostgresRoleRepository(db);
    await new SeedDefaultRolesUseCase(repo).execute();
    const admin = await repo.findByNombre("Admin");
    const basic = await repo.findByNombre("Usuario básico");
    expect(admin).not.toBeNull();
    expect(basic).not.toBeNull();
  });

  it("does not duplicate roles when re-run", async () => {
    const repo = new PostgresRoleRepository(db);
    const seed = new SeedDefaultRolesUseCase(repo);
    await seed.execute();
    await seed.execute();
    const { total } = await repo.list({ page: 1, pageSize: 10 });
    expect(total).toBe(2);
  });
});
