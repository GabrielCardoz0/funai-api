import { Response } from "express";
import { errorHandler } from "./agents";
import { AuthenticatedRequest } from "../middlewares/auth";
import dashboardService from "../services/dashboard";

const get = async ( req: AuthenticatedRequest, res: Response ): Promise<any> => {
  try {
    const user_id = req.user!.id;

    const metrics = await dashboardService.get({ user_id, days: parseInt(req.params.days) ?? 30 });

    return res.status(200).send({ data: metrics });

  } catch (error: any) { return errorHandler(error, req, res) }
};

const dashboardController = {
  get
};

export default dashboardController;
