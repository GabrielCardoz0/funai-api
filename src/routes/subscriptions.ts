import { Router } from "express";
import { authenticateToken } from "../middlewares/auth";
import Joi from "joi";
import { validateBody } from "../middlewares/validate-schema";
import subscriptionsController from "../controllers/subscriptions";

const subscriptionsRouter = Router();

const UpdateSubscriptionSchema = Joi.object({
  plan_id: Joi.number().required(),
});

const DeleteSubscriptionSchema = Joi.object({
  password: Joi.string().required(),
  reason: Joi.string().required(),
});


subscriptionsRouter
  .use(authenticateToken)
  .put("/", validateBody(UpdateSubscriptionSchema), subscriptionsController.update)
  .delete("/", validateBody(DeleteSubscriptionSchema), subscriptionsController.delete)
  .get("/", subscriptionsController.get)
;

export { subscriptionsRouter }; 