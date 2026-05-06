import { Router } from "express";
import { validate } from "../../../../shared/interfaces/http/middleware/validate.js";
import type { UsersController } from "./users.controller.js";
import {
  paginationQuerySchema,
  userBodySchema,
  userIdParamsSchema
} from "./schemas.js";

export function buildUsersRouter(controller: UsersController): Router {
  const router = Router();

  router.get(
    "/usuarios",
    validate("query", paginationQuerySchema),
    controller.list
  );

  router.get(
    "/usuarios/:id",
    validate("params", userIdParamsSchema),
    controller.detail
  );

  router.post(
    "/usuarios",
    validate("body", userBodySchema),
    controller.create
  );

  router.put(
    "/usuarios/:id",
    validate("params", userIdParamsSchema),
    validate("body", userBodySchema),
    controller.update
  );

  router.delete(
    "/usuarios/:id",
    validate("params", userIdParamsSchema),
    controller.remove
  );

  return router;
}
