import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth";
import { errorHandler } from "./agents";
import subscriptionsService from "../services/subscriptions";


const update = async ( req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const response = await subscriptionsService.update({ userId: req.user!.id, planId: req.body.plan_id });

    return res.status(200).send(response);
  } catch (error) { return errorHandler(error, req, res) };
};

const deleteSub = async ( req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const response = await subscriptionsService.delete({ userId: req.user!.id, ...req.body });

    return res.status(200).send(response);
  } catch (error) { return errorHandler(error, req, res) };
};

const get = async ( req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const response = await subscriptionsService.get({ userId: req.user!.id });

    return res.status(200).send(response);
  } catch (error) { return errorHandler(error, req, res) };
};

const subscriptionsController = {
  update,
  delete: deleteSub,
  get,
};

export default subscriptionsController;
