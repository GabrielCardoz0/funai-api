import { Router } from "express";
import Joi from "joi";
import { validateBody } from "../middlewares/validate-schema";
import instancesController from "../controllers/instances";
import { IInstanceCreateInput, IInstanceUpdateInput } from "../types";
import { authenticateToken } from "../middlewares/auth";

const instancesRouter = Router();

const instanceSchema = Joi.object<IInstanceCreateInput>({
  agent_id: Joi.number().required()
})

const updateInstanceSchema = Joi.object<IInstanceUpdateInput>({
  is_disable: Joi.boolean().required()
})

instancesRouter
  .use(authenticateToken)
  // .get("/", instancesController.getInstances)
  .post("/", validateBody(instanceSchema), instancesController.create)
  .put("/:id", validateBody(updateInstanceSchema), instancesController.update)
  // .get("/:id", instancesController.getInstanceById)
  .delete("/:id", instancesController.delete)

  .get("/:id/connect", instancesController.connectInstance)
  .get("/:id/status", instancesController.getInstanceConnectionStatus)
;

export { instancesRouter };