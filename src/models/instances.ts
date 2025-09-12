import { Prisma } from "../generated/prisma";
import prisma from "../prisma";

const create = async (data: Prisma.instancesCreateInput) => {
  return prisma.instances.create({
    data,
  })
}

const getById = async (id: number) => {
  return prisma.instances.findFirst({
    where: {
      id,
    },
  })
}

const update = async (id: number, data: Prisma.instancesUpdateInput) => {
  return prisma.instances.update({
    where: {
      id,
    },
    data,
  })
}

const deleteInstance = async (id: number) => {
  return prisma.instances.delete({
    where: {
      id,
    },
  })
}

const getInstanceConnectStatusById = async (id: number) => {
  return prisma.instances.findFirst({
    where: {
      id,
    },
    select: {
      integration_id: true,
      is_connected: true,
      agent_id: true,
      id: true,
    }
  })
}
const getInstanceByIntegrationId = async (integration_id: string) => {
  return prisma.instances.findFirst({
    where: {
      integration_id,
    },
  })
}

const instancesModel = {
  create,
  getById,
  update,
  delete: deleteInstance,
  getInstanceConnectStatusById,
  getInstanceByIntegrationId,
};

export default instancesModel;