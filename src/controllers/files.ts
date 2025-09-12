import { NextFunction, Request, Response } from "express";
import { errorHandler } from "./agents";
import { AuthenticatedRequest } from "../middlewares/auth";
import filesService from "../services/files";

const upload = async ( req: AuthenticatedRequest, res: Response, next: NextFunction ): Promise<any> => {
  try {
    const user_id = req.user!.id;
    const agent_id = Number(req.params.agent_id);

    const instance = await filesService.upload({ user_id, agent_id: agent_id, files: req.files as Express.Multer.File[] });

    return res.status(200).send({ data: instance });
  } catch (error: any) { return errorHandler(error, req, res) }
};

// const update = async ( req: AuthenticatedRequest, res: Response, next: NextFunction ): Promise<any> => {
//   try {
//     const user_id = req.user!.id;

//     const instance = await filesService.update({ user_id,  });

//     return res.status(200).send({ data: instance });
//   } catch (error: any) { return errorHandler(error, req, res) }
// };

const deleteFile = async ( req: AuthenticatedRequest, res: Response, next: NextFunction ): Promise<any> => {
  try {
    const user_id = req.user!.id;

    await filesService.delete({ user_id, file_id: Number(req.params.id) });

    return res.status(200).send({ message: "Arquivo excluído com sucesso." });
  } catch (error: any) { return errorHandler(error, req, res) }
};

const filesController = {
  upload,
  // update,
  delete: deleteFile,
};

export default filesController;
