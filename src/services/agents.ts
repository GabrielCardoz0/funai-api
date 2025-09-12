import agentsModel from "../models/agents";
import usersModel from "../models/users";
import { IAgentCreateInput, IAgentUpdateInput, IUserRequest } from "../types";
import { n8nApi } from "./n8n-api";
import { ragService } from "./rag";
import subscriptionsService from "./subscriptions";

const getAgentByIdOrFail = async (id: number) => {
  const agent = await agentsModel.getAgentById(id);

  if(!agent) {
    throw { status: 404, message: "Agente não encontrado." };
  }

  return agent;
};

const verifyIsUserAgent = async ({ agent_id, user_id }: { agent_id: number, user_id: number }) => {
  const agent = await getAgentByIdOrFail(agent_id);
  if(agent.user_id !== user_id) {
    throw { status: 403, message: "Você não tem permissão para acessar este agente." };
  }
  return agent;
}

const createAgent = async ({ user, data }: {user: IUserRequest, data: IAgentCreateInput }) => {
  const subscription = await usersModel.getSubscription(user.id);

  if(!subscription) {
    throw { status: 403, message: "Você precisa de uma assinatura ativa para criar agentes." };
  }

  await subscriptionsService.verifyUserAgentsCountOrFail(user.id);

  const agent = {
    ...data,
    user: {
      connect: {
        id: user.id
      }
    }
  };

  return await agentsModel.createAgent(agent);
}

const getAgents = async (userId: number) => {
  const agents = await agentsModel.getAgentsByUserId(userId);

  return agents;
}

const updateAgent = async ({ id, user_id, data }: { id: number, user_id: number, data: IAgentUpdateInput }) => {
  await verifyIsUserAgent({ agent_id: id, user_id });

  const updatedAgent = await agentsModel.updateAgent(id, data);

  return updatedAgent;
}

const deleteAgent = async ({ agent_id, user_id } :{ user_id: number, agent_id: number }) => {
  await verifyIsUserAgent({ agent_id, user_id });

  await agentsModel.deleteAgent(agent_id);

  return { message: "Agente excluído com sucesso." };
}

const getAgentById = async ({ agent_id, user_id } :{ user_id: number, agent_id: number }) => {
  const agent = await verifyIsUserAgent({ agent_id, user_id });
  return agent;
}

const getAgentBehaviorAndKnowledgeById = async ({ agent_id, question }: {agent_id: number, question: string}) => {
  const agent = await getAgentByIdOrFail(agent_id);

  const knowledgeChunks = await ragService.getKnowledgeChunksByAgentId(agent_id, question);

  const behaviorAndKnowledge = `
  # Seu perfil
  Seu Nome é: '${agent.agent_name}'.

  # Sobre a empresa:
  '${agent.business_description}'

  Comportamento: '${agent.agent_behavior}'

  # Informações relevantes (embeedings):
  [${knowledgeChunks.join('\n\n')}]
  `;

  // console.log(behaviorAndKnowledge);

  return behaviorAndKnowledge;
}






const localMessages = async ({ agent_id, question }: {agent_id: number, question: string}) => {
  const agentBehavior = await agentsService.getAgentBehaviorAndKnowledgeById({ agent_id, question });
  const chatId = agent_id.toString();

  const { data: { output } } = await n8nApi.post("/agent", { agentBehavior, message: question, chatId });

  return output;
}

const getChat = async (agent_id: number) => {
  await getAgentByIdOrFail(agent_id);

  const chat = await agentsModel.getChatByAgentId(agent_id);

  return chat;
}

const agentsService = {
  createAgent,
  getAgents,
  updateAgent,
  deleteAgent,
  getAgentById,
  getAgentBehaviorAndKnowledgeById,
  verifyIsUserAgent,
  getAgentByIdOrFail,


  localMessages,
  getChat,
};

export default agentsService;
