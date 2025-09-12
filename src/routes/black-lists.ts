import { Router } from "express";
import Joi from "joi";
import { validateBody } from "../middlewares/validate-schema";
import { IBlackListCreateInput } from "../types";
import BlackListController from "../controllers/black-lists";
import { authenticateToken } from "../middlewares/auth";

const blackListRouter = Router();

const blackListSchema = Joi.object<IBlackListCreateInput>({
  agent_id: Joi.number().required(),
  contact : Joi.string().required()
})

blackListRouter
  .use(authenticateToken)
  .post("/", validateBody(blackListSchema), BlackListController.create)
  .delete("/:id", BlackListController.delete)
;

export { blackListRouter };