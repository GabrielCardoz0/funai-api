import { Response } from "express";
import { errorHandler } from "./agents";
import { AuthenticatedRequest } from "../middlewares/auth";
import { IBlackListCreateInput } from "../types";
import blackListService from "../services/black-lists";

const create = async ( req: AuthenticatedRequest, res: Response ): Promise<any> => {
  try {
    const user_id = req.user!.id;
    const data = req.body as IBlackListCreateInput;

    const instance = await blackListService.create({ user_id, data });

    return res.status(200).send({ data: instance });
  } catch (error: any) { return errorHandler(error, req, res) }
};


const deleteContact = async ( req: AuthenticatedRequest, res: Response ): Promise<any> => {
  try {
    const user_id = req.user!.id;
    const black_list_id = Number(req.params.id);

    const instance = await blackListService.delete({ user_id, black_list_id });

    return res.status(200).send({ data: instance });
  } catch (error: any) { return errorHandler(error, req, res) }
};


const BlackListController = {
  create,
  delete: deleteContact,
};

export default BlackListController;
