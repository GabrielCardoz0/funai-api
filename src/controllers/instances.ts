import { NextFunction, Request, Response } from "express";
import { errorHandler } from "./agents";
import instancesService from "../services/instances";
import { AuthenticatedRequest } from "../middlewares/auth";

const create = async ( req: AuthenticatedRequest, res: Response, next: NextFunction ): Promise<any> => {
  try {
    const user_id = req.user!.id;
    const instance = await instancesService.create({ user_id, agent_id: req.body.agent_id });

    return res.status(200).send({ data: instance });
  } catch (error: any) { return errorHandler(error, req, res) }
};

const update = async ( req: AuthenticatedRequest, res: Response, next: NextFunction ): Promise<any> => {
  try {
    const user_id = req.user!.id;

    const instance = await instancesService.update({ user_id, instance_id: Number(req.params.id), is_disable: req.body.is_disable });

    return res.status(200).send({ data: instance });
  } catch (error: any) { return errorHandler(error, req, res) }
};

const deleteInstance = async ( req: AuthenticatedRequest, res: Response, next: NextFunction ): Promise<any> => {
  try {
    const user_id = req.user!.id;

    const instance = await instancesService.delete({ user_id, instance_id: Number(req.params.id) });

    return res.status(200).send({ data: instance });
  } catch (error: any) { return errorHandler(error, req, res) }
};

const connectInstance = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    const user_id = req.user!.id;
    const instance_id = req.params.id;

    const qrcore = await instancesService.connectInstance({  user_id: user_id!, instance_id: Number(instance_id) });

    return res.status(201).send({ data: qrcore });
  } catch (error: any) { return errorHandler(error, req, res) }
}

const getInstanceConnectionStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    const user_id = req.user!.id;
    const instance_id = req.params.id;

    const status = await instancesService.getInstanceConnectionStatus({  user_id: user_id!, instance_id: Number(instance_id) });

    return res.status(201).send({ data: status });
  } catch (error: any) { return errorHandler(error, req, res) }
}

const instancesController = {
  create,
  update,
  delete: deleteInstance,
  connectInstance,
  getInstanceConnectionStatus,
};

export default instancesController;
