import { NextFunction, Request, Response } from "express";
import authService from "../services/auth";
import { errorHandler } from "./agents";

const login = async ( req: Request, res: Response, next: NextFunction ): Promise<any> => {
  try {
    const userWToken = await authService.login(req.body);

    return res.status(200).json({ data: userWToken });
  } catch (error) { return errorHandler(error, req, res) };
};

const forgotPassword = async ( req: Request, res: Response, next: NextFunction ): Promise<any> => {
  try {
    const response = await authService.forgotPassword(req.body);

    return res.status(200).json({ data: response });
  } catch (error) { return errorHandler(error, req, res) };
};

const resetPassword = async ( req: Request, res: Response, next: NextFunction ): Promise<any> => {
  try {
    const response = await authService.resetPassword(req.body);

    return res.status(200).json({ data: response });
  } catch (error) { return errorHandler(error, req, res) };
};

const authController = {
  login,
  forgotPassword,
  resetPassword,
};

export default authController;
