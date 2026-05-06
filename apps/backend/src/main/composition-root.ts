import { buildApp } from "./app.js";
import type { Env } from "./config/env.js";
import { createDb, type Db } from "../shared/infrastructure/db/client.js";
import { buildHealthModule } from "../modules/health/index.js";
import {
  buildUsuariosRolesModule,
  type UsuariosRolesModule
} from "../modules/usuarios-roles/index.js";
import { combustiblesEmailRouter } from "../modules/combustibles/index.js";

export type ComposedApp = {
  app: ReturnType<typeof buildApp>;
  db: Db;
  usuariosRoles: UsuariosRolesModule;
};

/**
 * Composition root — the ONLY place where implementations are instantiated
 * and wired together. No DI containers, decorators or reflection.
 *
 * Accepts an optional pre-built `db` so integration tests can point at a
 * Testcontainers instance. In production, the db is created from the
 * validated env.
 */
export function composeApp(env: Env, deps: { db?: Db } = {}): ComposedApp {
  const db = deps.db ?? createDb(env.DATABASE_URL);

  const healthRouter = buildHealthModule();
  const usuariosRoles = buildUsuariosRolesModule(db);

  const app = buildApp({
    env,
    routers: [healthRouter, usuariosRoles.router, combustiblesEmailRouter]
  });

  return { app, db, usuariosRoles };
}
