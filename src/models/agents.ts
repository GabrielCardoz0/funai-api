import { Prisma } from "../generated/prisma";
import n8ndb from "../pg";
import prisma from "../prisma";

const createAgent = async (agent: Prisma.agentsCreateInput) => {
  return prisma.agents.create({
    data: agent,
    include: {
      files: true,
      instances: true,
      user: true,
    }
  })
}

const getAgentById = async (id: number) => {
  return prisma.agents.findFirst({
    where: { id },
    include: {
      files: true,
      instances: true,
      black_list: true,
      white_list: true,
      _count: {
        select: {
          files: true,
          instances: true,
          black_list: true,
          white_list: true,
        }
      }
    }
  });
} 

const updateAgent = async (id: number, agent: Prisma.agentsUpdateInput) => {
  return prisma.agents.update({
    where: { id },
    data: agent,
    include: {
      files: true,
      instances: true,
    }
  });
}

const deleteAgent = async (id: number) => {
  return prisma.agents.delete({
    where: { id }
  });
}

const getAgentsByUserId = async (user_id: number) => {
  return prisma.agents.findMany({
    where: { user_id },
    include: {
      files: true,
      instances: true,
    },
    orderBy: {
      id: 'desc'
    }
  });
}

const getAgentsCountByUserId = async (user_id: number) => {
  return prisma.agents.count({
    where: { user_id }
  });
}

const getInstancesCountByUserId = async (user_id: number) => {
  return prisma.instances.count({
    where: { 
      agent: {
        user_id
      }
    }
  });
}


const getChatByAgentId = async (agent_id: number) => {
  const response = await n8ndb.query(`
    select * from n8n_chat_histories WHERE session_id = $1 ORDER BY id ASC
  `, [agent_id]);

  return response.rows
}

const agentsModel = {
  createAgent,
  getAgentById,
  updateAgent,
  deleteAgent,
  getAgentsByUserId,
  getAgentsCountByUserId,
  getChatByAgentId,
  getInstancesCountByUserId,
};

export default agentsModel;