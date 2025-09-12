import { NextFunction, Response} from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import agentsService from '../services/agents';
import { IAgentCreateInput, IAgentUpdateInput } from '../types';

export const errorHandler = (error: any, req: AuthenticatedRequest, res: Response) => {
  console.error(`Error processing request ${req.originalUrl}:`, error);
  return res.status(error.status ?? 500).send({ message: error.message ?? "Erro ao processar requisição "+req.originalUrl });
}

const createAgent = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    const data = req.body as IAgentCreateInput;
    const newAgent = await agentsService.createAgent({ user: req.user!, data });

    return res.status(201).send({ data: newAgent });
  } catch (error: any) { return errorHandler(error, req, res) }
}

const updateAgent = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    const agent_id = req.params!.id;
    const user_id = req.user!.id;
    const data = req.body as IAgentUpdateInput;

    console.log(data);

    const updatedAgent = await agentsService.updateAgent({ id: Number(agent_id), user_id, data });

    return res.status(201).send({ data: updatedAgent });
  } catch (error: any) { return errorHandler(error, req, res) }
}

const getAgents = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    const user_id = req.user!.id;

    const newAgent = await agentsService.getAgents(user_id!);

    return res.status(201).send({ data: newAgent });
  } catch (error: any) { return errorHandler(error, req, res) }
}

const deleteAgent = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    const user_id = req.user!.id;
    const agent_id = req.params.id;

    const message = await agentsService.deleteAgent({  user_id: user_id!, agent_id: Number(agent_id) });

    return res.status(201).send({ data: message });
  } catch (error: any) { return errorHandler(error, req, res) }
}

const getAgentById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    const user_id = req.user!.id;
    const agent_id = req.params.id;

    const data = await agentsService.getAgentById({  user_id: user_id!, agent_id: Number(agent_id) });

    return res.status(201).send({ data });
  } catch (error: any) { return errorHandler(error, req, res) }
}






const localMessages = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const agent_id = req.params.id;

    const question = req.body.message;

    const message = await agentsService.localMessages({ agent_id: Number(agent_id), question });

    return res.status(201).send({ data: message });
  } catch (error: any) { return errorHandler(error, req, res) }
}

const getChat = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const agent_id = req.params.id;

    const message = await agentsService.getChat(Number(agent_id));

    return res.status(201).send({ data: message });
  } catch (error: any) { return errorHandler(error, req, res) }
}


const agentController = {
  createAgent,
  updateAgent,
  getAgents,
  deleteAgent,
  getAgentById,
  localMessages,
  getChat,
};

export default agentController;