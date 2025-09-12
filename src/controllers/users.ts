import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth";
import usersService from "../services/users";
import { errorHandler } from "./agents";

// const getUserById = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
//   try {
//     const token = await authService.login(req.body);
//
//     return res.status(200).json({ data: { token } });
//
//   } catch (error) { return res.status(error.status ?? 500).send({ message: error.message ?? "Erro ao processar requisição "+req.originalUrl }) }
// }

const getMe = async ( req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const user = await usersService.getMe(req.user!.id);

    return res.status(200).json({ data: { user } });
  } catch (error) { return errorHandler(error, req, res) };
};

const update = async ( req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    delete req.body.email;
    const user = await usersService.update({id: req.user!.id, data: req.body });

    return res.status(200).json({ data: { user } });
  } catch (error) { return errorHandler(error, req, res) };
};

const updatePassword = async ( req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const user = await usersService.updatePassword({ userId: req.user!.id, data: req.body });

    return res.status(200).json({ data: { user } });
  } catch (error) { return errorHandler(error, req, res) };
};

const usersController = {
  getMe,
  update,
  updatePassword,
};

export default usersController;
