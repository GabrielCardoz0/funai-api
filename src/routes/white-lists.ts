import { Router } from "express";
import Joi from "joi";
import { validateBody } from "../middlewares/validate-schema";
import { IWhiteListCreateInput } from "../types";
import WhiteListController from "../controllers/white-lists";
import { authenticateToken } from "../middlewares/auth";

const whiteListRouter = Router();

const blackListSchema = Joi.object<IWhiteListCreateInput>({
  agent_id: Joi.number().required(),
  contact : Joi.string().required()
})

whiteListRouter
.use(authenticateToken)
  .post("/", validateBody(blackListSchema), WhiteListController.create)
  .delete("/:id", WhiteListController.delete)
;

export { whiteListRouter };