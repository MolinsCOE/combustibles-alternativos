import request from "supertest";
import type { Response as SupertestResponse } from "supertest";
import { sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { buildTestComposedApp } from "../helpers/build-test-app.js";

const { app, db } = buildTestComposedApp();

interface UserBody {
  id: string;
  nombre: string;
  email: string;
  activo: boolean;
  rolId: string;
}

interface UserWithRoleBody extends UserBody {
  rolNombre: string;
}

interface ErrorBody {
  code: string;
  message: string;
}

interface UserListBody {
  items: UserWithRoleBody[];
  page: number;
  pageSize: number;
  total: number;
}

interface RoleBody {
  id: string;
  nombre: string;
}

const asUser = (res: SupertestResponse): UserBody => res.body as UserBody;
const asUserWithRole = (res: SupertestResponse): UserWithRoleBody =>
  res.body as UserWithRoleBody;
const asError = (res: SupertestResponse): ErrorBody => res.body as ErrorBody;
const asList = (res: SupertestResponse): UserListBody => res.body as UserListBody;
const asRole = (res: SupertestResponse): RoleBody => res.body as RoleBody;

async function resetTables(): Promise<void> {
  await db.execute(sql`truncate table usuarios, roles restart identity cascade`);
}

async function createRole(nombre: string): Promise<string> {
  const res = await request(app).post("/roles").send({ nombre });
  return asRole(res).id;
}

afterAll(async () => {
  await resetTables();
});

describe("/usuarios", () => {
  let rolAdminId: string;
  let rolBasicoId: string;

  beforeEach(async () => {
    await resetTables();
    rolAdminId = await createRole("Admin");
    rolBasicoId = await createRole("Usuario básico");
  });

  describe("POST /usuarios", () => {
    it("creates a user and returns it with 201", async () => {
      const res = await request(app).post("/usuarios").send({
        nombre: "Ana Molins",
        email: "ana@molins.dev",
        rolId: rolAdminId
      });
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        nombre: "Ana Molins",
        email: "ana@molins.dev",
        rolId: rolAdminId,
        activo: true
      });
      expect(asUser(res).id).toMatch(/^[0-9a-f-]{36}$/);
    });

    it("accepts explicit activo=false", async () => {
      const res = await request(app).post("/usuarios").send({
        nombre: "Ana",
        email: "ana@molins.dev",
        rolId: rolAdminId,
        activo: false
      });
      expect(res.status).toBe(201);
      expect(asUser(res).activo).toBe(false);
    });

    it("returns 409 when email is duplicated (case-insensitive)", async () => {
      await request(app).post("/usuarios").send({
        nombre: "Ana",
        email: "ana@molins.dev",
        rolId: rolAdminId
      });
      const res = await request(app).post("/usuarios").send({
        nombre: "Otra Ana",
        email: "ANA@molins.dev",
        rolId: rolBasicoId
      });
      expect(res.status).toBe(409);
      expect(asError(res).code).toBe("CONFLICT");
    });

    it("returns 422 when rolId references a non-existent rol", async () => {
      const res = await request(app).post("/usuarios").send({
        nombre: "Ana",
        email: "ana@molins.dev",
        rolId: "00000000-0000-0000-0000-000000000000"
      });
      expect(res.status).toBe(422);
      expect(asError(res).code).toBe("VALIDATION_ERROR");
    });

    it("returns 422 when email is invalid", async () => {
      const res = await request(app).post("/usuarios").send({
        nombre: "Ana",
        email: "no-es-email",
        rolId: rolAdminId
      });
      expect(res.status).toBe(422);
    });

    it("returns 422 when nombre is empty", async () => {
      const res = await request(app).post("/usuarios").send({
        nombre: "",
        email: "a@m.dev",
        rolId: rolAdminId
      });
      expect(res.status).toBe(422);
    });

    it("returns 422 on unknown fields", async () => {
      const res = await request(app).post("/usuarios").send({
        nombre: "Ana",
        email: "a@m.dev",
        rolId: rolAdminId,
        extra: "nope"
      });
      expect(res.status).toBe(422);
    });
  });

  describe("GET /usuarios", () => {
    it("returns paginated users sorted by name with role name", async () => {
      await request(app).post("/usuarios").send({
        nombre: "Zoe",
        email: "z@m.dev",
        rolId: rolAdminId
      });
      await request(app).post("/usuarios").send({
        nombre: "Ana",
        email: "a@m.dev",
        rolId: rolBasicoId
      });
      const res = await request(app).get("/usuarios?page=1&pageSize=10");
      expect(res.status).toBe(200);
      const list = asList(res);
      expect(list.total).toBe(2);
      expect(list.items[0]?.nombre).toBe("Ana");
      expect(list.items[0]?.rolNombre).toBe("Usuario básico");
      expect(list.items[1]?.rolNombre).toBe("Admin");
    });

    it("uses defaults when no query is provided", async () => {
      const res = await request(app).get("/usuarios");
      expect(res.status).toBe(200);
      expect(asList(res).page).toBe(1);
      expect(asList(res).pageSize).toBe(10);
    });

    it("returns 422 on invalid query", async () => {
      const res = await request(app).get("/usuarios?pageSize=9999");
      expect(res.status).toBe(422);
    });
  });

  describe("GET /usuarios/:id", () => {
    it("returns detail with role name", async () => {
      const created = await request(app).post("/usuarios").send({
        nombre: "Ana",
        email: "a@m.dev",
        rolId: rolAdminId
      });
      const res = await request(app).get(`/usuarios/${asUser(created).id}`);
      expect(res.status).toBe(200);
      expect(asUserWithRole(res).rolNombre).toBe("Admin");
    });

    it("returns 404 when user does not exist", async () => {
      const res = await request(app).get(
        "/usuarios/00000000-0000-0000-0000-000000000000"
      );
      expect(res.status).toBe(404);
    });

    it("returns 422 on invalid id", async () => {
      const res = await request(app).get("/usuarios/not-a-uuid");
      expect(res.status).toBe(422);
    });
  });

  describe("PUT /usuarios/:id", () => {
    it("updates all fields", async () => {
      const created = await request(app).post("/usuarios").send({
        nombre: "Ana",
        email: "a@m.dev",
        rolId: rolAdminId
      });
      const res = await request(app).put(`/usuarios/${asUser(created).id}`).send({
        nombre: "Ana M.",
        email: "ana.m@m.dev",
        rolId: rolBasicoId,
        activo: false
      });
      expect(res.status).toBe(200);
      expect(asUser(res)).toMatchObject({
        nombre: "Ana M.",
        email: "ana.m@m.dev",
        rolId: rolBasicoId,
        activo: false
      });
    });

    it("returns 409 when new email duplicates another user", async () => {
      await request(app).post("/usuarios").send({
        nombre: "A",
        email: "a@m.dev",
        rolId: rolAdminId
      });
      const b = await request(app).post("/usuarios").send({
        nombre: "B",
        email: "b@m.dev",
        rolId: rolAdminId
      });
      const res = await request(app).put(`/usuarios/${asUser(b).id}`).send({
        nombre: "B",
        email: "a@m.dev",
        rolId: rolAdminId,
        activo: true
      });
      expect(res.status).toBe(409);
    });

    it("returns 404 when user does not exist", async () => {
      const res = await request(app)
        .put("/usuarios/00000000-0000-0000-0000-000000000000")
        .send({
          nombre: "X",
          email: "x@m.dev",
          rolId: rolAdminId,
          activo: true
        });
      expect(res.status).toBe(404);
    });

    it("returns 422 when rolId does not exist", async () => {
      const created = await request(app).post("/usuarios").send({
        nombre: "A",
        email: "a@m.dev",
        rolId: rolAdminId
      });
      const res = await request(app).put(`/usuarios/${asUser(created).id}`).send({
        nombre: "A",
        email: "a@m.dev",
        rolId: "00000000-0000-0000-0000-000000000000",
        activo: true
      });
      expect(res.status).toBe(422);
    });
  });

  describe("DELETE /usuarios/:id", () => {
    it("deletes a user", async () => {
      const created = await request(app).post("/usuarios").send({
        nombre: "Ana",
        email: "a@m.dev",
        rolId: rolAdminId
      });
      const del = await request(app).delete(`/usuarios/${asUser(created).id}`);
      expect(del.status).toBe(204);
      const after = await request(app).get(`/usuarios/${asUser(created).id}`);
      expect(after.status).toBe(404);
    });

    it("returns 404 when user does not exist", async () => {
      const res = await request(app).delete(
        "/usuarios/00000000-0000-0000-0000-000000000000"
      );
      expect(res.status).toBe(404);
    });
  });

  describe("role integration", () => {
    it("counts users per rol and lists them in the role detail", async () => {
      await request(app).post("/usuarios").send({
        nombre: "Ana",
        email: "a@m.dev",
        rolId: rolAdminId
      });
      await request(app).post("/usuarios").send({
        nombre: "Bea",
        email: "b@m.dev",
        rolId: rolAdminId
      });

      const listRes = await request(app).get("/roles?page=1&pageSize=10");
      const adminRow = (
        listRes.body as {
          items: Array<{ id: string; nombre: string; numeroUsuarios: number }>;
        }
      ).items.find((r) => r.nombre === "Admin");
      expect(adminRow?.numeroUsuarios).toBe(2);

      const detailRes = await request(app).get(`/roles/${rolAdminId}`);
      const detail = detailRes.body as {
        usuarios: Array<{ nombre: string; email: string }>;
      };
      expect(detail.usuarios).toHaveLength(2);
      expect(detail.usuarios.map((u) => u.email).sort()).toEqual([
        "a@m.dev",
        "b@m.dev"
      ]);
    });
  });
});
