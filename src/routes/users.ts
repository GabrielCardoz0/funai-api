import { Router } from "express";
import { authenticateToken } from "../middlewares/auth";
import usersController from "../controllers/users";
import Joi from "joi";
import { validateBody } from "../middlewares/validate-schema";
import { IUserUpdatePasswordInput } from "../types";

const usersRouter = Router();

const UpdateUserSchema = Joi.object({
  name: Joi.string().min(3).max(50).optional(),
  email: Joi.string().email().optional(),
});

const UpdatePasswordSchema = Joi.object<IUserUpdatePasswordInput>({
  currentPassword: Joi.string().min(6).max(50).required(),
  newPassword: Joi.string().min(6).max(50).required(),
});

usersRouter
  .use(authenticateToken)
  .get("/:id",  usersController.getMe)
  .put("/", validateBody(UpdateUserSchema), usersController.update)
  .put("/password", validateBody(UpdatePasswordSchema), usersController.updatePassword)
;

export { usersRouter };