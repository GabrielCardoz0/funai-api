import { Router } from "express";
import Joi from "joi";
import { validateBody } from "../middlewares/validate-schema";
import authController from "../controllers/auth";
import { IUserCreateInput } from "../types";

const authRouter = Router();

const loginSchema = Joi.object<IUserCreateInput>({
  email: Joi.string().email().required(),
  password: Joi.string().min(1).required(),
});

const forgotPasswordSchema = Joi.object<IUserCreateInput>({
  email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
  password: Joi.string().required(),
  token: Joi.string().required(),
});

authRouter
  .post("/login", validateBody(loginSchema), authController.login)
  .post("/forgot-password", validateBody(forgotPasswordSchema), authController.forgotPassword)
  .post("/reset-password", validateBody(resetPasswordSchema), authController.resetPassword)
;

export { authRouter };