import request from "supertest";
import type { Response as SupertestResponse } from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { buildTestComposedApp } from "../helpers/build-test-app.js";

const { app, db } = buildTestComposedApp();

interface RoleBody {
  id: string;
  nombre: string;
  descripcion: string | null;
}

interface ErrorBody {
  code: string;
  message: string;
}

interface RoleListBody {
  items: Array<{ id: string; nombre: string; descripcion: string | null; numeroUsuarios: number }>;
  page: number;
  pageSize: number;
  total: number;
}

interface RoleDetailBody extends RoleBody {
  usuarios: Array<{ id: string; nombre: string; email: string }>;
}

const asRole = (res: SupertestResponse): RoleBody => res.body as RoleBody;
const asError = (res: SupertestResponse): ErrorBody => res.body as ErrorBody;
const asList = (res: SupertestResponse): RoleListBody => res.body as RoleListBody;
const asDetail = (res: SupertestResponse): RoleDetailBody => res.body as RoleDetailBody;

async function resetTables(): Promise<void> {
  // Truncate cascades from usuarios to roles. Order ensures no FK issue.
  await db.execute(sql`truncate table usuarios, roles restart identity cascade`);
}

afterAll(async () => {
  await resetTables();
});

describe("/roles", () => {
  beforeEach(async () => {
    await resetTables();
  });

  describe("POST /roles", () => {
    it("creates a role and returns it with 201", async () => {
      const res = await request(app)
        .post("/roles")
        .send({ nombre: "Editor", descripcion: "Edita contenido" });
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        nombre: "Editor",
        descripcion: "Edita contenido"
      });
      expect(asRole(res).id).toMatch(/^[0-9a-f-]{36}$/);
    });

    it("returns 409 when the name already exists (case-insensitive)", async () => {
      await request(app).post("/roles").send({ nombre: "Admin" });
      const res = await request(app).post("/roles").send({ nombre: "admin" });
      expect(res.status).toBe(409);
      expect(asError(res).code).toBe("CONFLICT");
    });

    it("returns 422 when body is invalid", async () => {
      const res = await request(app).post("/roles").send({ nombre: "" });
      expect(res.status).toBe(422);
      expect(asError(res).code).toBe("VALIDATION_ERROR");
    });

    it("returns 422 when body has unknown fields", async () => {
      const res = await request(app)
        .post("/roles")
        .send({ nombre: "Ok", extra: "nope" });
      expect(res.status).toBe(422);
    });
  });

  describe("GET /roles", () => {
    it("returns a paginated list sorted by name", async () => {
      await request(app).post("/roles").send({ nombre: "Zebra" });
      await request(app).post("/roles").send({ nombre: "Alpha" });
      const res = await request(app).get("/roles?page=1&pageSize=10");
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ page: 1, pageSize: 10, total: 2 });
      const list = asList(res);
      expect(list.items).toHaveLength(2);
      expect(list.items[0]?.nombre).toBe("Alpha");
      expect(list.items[0]?.numeroUsuarios).toBe(0);
    });

    it("uses defaults when no query is provided", async () => {
      const res = await request(app).get("/roles");
      expect(res.status).toBe(200);
      const list = asList(res);
      expect(list.page).toBe(1);
      expect(list.pageSize).toBe(10);
    });

    it("returns 422 on invalid query", async () => {
      const res = await request(app).get("/roles?pageSize=999");
      expect(res.status).toBe(422);
    });
  });

  describe("GET /roles/:id", () => {
    it("returns detail with empty users list", async () => {
      const created = await request(app).post("/roles").send({ nombre: "Admin" });
      const res = await request(app).get(`/roles/${asRole(created).id}`);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ nombre: "Admin", usuarios: [] });
      expect(asDetail(res).usuarios).toEqual([]);
    });

    it("returns 404 when role does not exist", async () => {
      const res = await request(app).get(
        "/roles/00000000-0000-0000-0000-000000000000"
      );
      expect(res.status).toBe(404);
      expect(asError(res).code).toBe("NOT_FOUND");
    });

    it("returns 422 on invalid id", async () => {
      const res = await request(app).get("/roles/not-a-uuid");
      expect(res.status).toBe(422);
    });
  });

  describe("PUT /roles/:id", () => {
    it("updates nombre and descripcion", async () => {
      const created = await request(app)
        .post("/roles")
        .send({ nombre: "Admin", descripcion: "orig" });
      const res = await request(app)
        .put(`/roles/${asRole(created).id}`)
        .send({ nombre: "Administrador", descripcion: "nueva" });
      expect(res.status).toBe(200);
      expect(asRole(res).nombre).toBe("Administrador");
      expect(asRole(res).descripcion).toBe("nueva");
    });

    it("returns 409 when new name duplicates another role", async () => {
      await request(app).post("/roles").send({ nombre: "Admin" });
      const second = await request(app).post("/roles").send({ nombre: "Editor" });
      const res = await request(app)
        .put(`/roles/${asRole(second).id}`)
        .send({ nombre: "Admin" });
      expect(res.status).toBe(409);
    });

    it("returns 404 when role does not exist", async () => {
      const res = await request(app)
        .put("/roles/00000000-0000-0000-0000-000000000000")
        .send({ nombre: "X" });
      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /roles/:id", () => {
    it("deletes a role without users", async () => {
      const created = await request(app).post("/roles").send({ nombre: "Admin" });
      const del = await request(app).delete(`/roles/${asRole(created).id}`);
      expect(del.status).toBe(204);

      const after = await request(app).get(`/roles/${asRole(created).id}`);
      expect(after.status).toBe(404);
    });

    it("returns 409 when the role has users assigned", async () => {
      const created = await request(app).post("/roles").send({ nombre: "Admin" });
      const rolId = asRole(created).id;
      await db.execute(
        sql`insert into usuarios (nombre, email, rol_id) values ('Alice', 'a@a.com', ${rolId})`
      );
      const res = await request(app).delete(`/roles/${rolId}`);
      expect(res.status).toBe(409);
      expect(asError(res).message).toMatch(/usuario/);
    });

    it("returns 404 when role does not exist", async () => {
      const res = await request(app).delete(
        "/roles/00000000-0000-0000-0000-000000000000"
      );
      expect(res.status).toBe(404);
    });
  });
});
