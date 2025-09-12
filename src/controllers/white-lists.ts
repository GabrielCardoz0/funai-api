import { Response } from "express";
import { errorHandler } from "./agents";
import { AuthenticatedRequest } from "../middlewares/auth";
import { IWhiteListCreateInput } from "../types";
import whiteListService from "../services/white-lists";

const create = async ( req: AuthenticatedRequest, res: Response ): Promise<any> => {
  try {
    const user_id = req.user!.id;
    const data = req.body as IWhiteListCreateInput;

    const instance = await whiteListService.create({ user_id, data });

    return res.status(200).send({ data: instance });
  } catch (error: any) { return errorHandler(error, req, res) }
};


const deleteContact = async ( req: AuthenticatedRequest, res: Response ): Promise<any> => {
  try {
    const user_id = req.user!.id;
    const white_list_id = Number(req.params.id);

    const instance = await whiteListService.delete({ user_id, white_list_id });

    return res.status(200).send({ data: instance });
  } catch (error: any) { return errorHandler(error, req, res) }
};


const WhiteListController = {
  create,
  delete: deleteContact,
};

export default WhiteListController;
