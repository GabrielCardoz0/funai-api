import { Router } from "express";
import Joi from "joi";
import { validateBody } from "../middlewares/validate-schema";
import agentController from "../controllers/agents";
import { authenticateToken } from "../middlewares/auth";
import { IAgentCreateInput, IAgentUpdateInput } from "../types";

const agentsRouter = Router();

const createAgentSchema = Joi.object<IAgentCreateInput>({
  name: Joi.string().min(3).max(50).required(),
  description: Joi.string().min(3).max(500).required(),
  agent_name: Joi.string().min(3).max(50).required(),
  agent_behavior: Joi.string().min(3).required(),
  business_description: Joi.string().min(3).required(),
  image: Joi.string().required(),
})

const UpdateAgentSchema = Joi.object<IAgentUpdateInput>({
  name: Joi.string().min(3).max(50).optional(),
  description: Joi.string().min(3).max(500).optional(),
  agent_name: Joi.string().min(3).max(50).optional(),
  agent_behavior: Joi.string().min(3).optional(),
  business_description: Joi.string().min(3).optional(),
  is_active: Joi.boolean().optional(),
  image: Joi.string().optional(),
})

agentsRouter
  .use(authenticateToken) // Substituir .all("/*", authenticateToken) por .use(authenticateToken)
  .post("/", validateBody(createAgentSchema), agentController.createAgent)
  .get("/", agentController.getAgents)
  .put("/:id", validateBody(UpdateAgentSchema), agentController.updateAgent)
  .get("/:id", agentController.getAgentById)
  .delete("/:id", agentController.deleteAgent)

  
  .post("/:id/chat" , agentController.localMessages)
  .get("/:id/chat" , agentController.getChat)
;

export { agentsRouter };