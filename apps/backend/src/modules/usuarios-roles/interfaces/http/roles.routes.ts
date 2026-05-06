import { Router } from "express";
import { validate } from "../../../../shared/interfaces/http/middleware/validate.js";
import type { RolesController } from "./roles.controller.js";
import {
  paginationQuerySchema,
  roleBodySchema,
  roleIdParamsSchema
} from "./schemas.js";

export function buildRolesRouter(controller: RolesController): Router {
  const router = Router();

  router.get("/roles", validate("query", paginationQuerySchema), controller.list);

  router.get(
    "/roles/:id",
    validate("params", roleIdParamsSchema),
    controller.detail
  );

  router.post("/roles", validate("body", roleBodySchema), controller.create);

  router.put(
    "/roles/:id",
    validate("params", roleIdParamsSchema),
    validate("body", roleBodySchema),
    controller.update
  );

  router.delete(
    "/roles/:id",
    validate("params", roleIdParamsSchema),
    controller.remove
  );

  return router;
}
