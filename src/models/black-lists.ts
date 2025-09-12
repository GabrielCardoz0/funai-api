import { Prisma } from "../generated/prisma";
import prisma from "../prisma";

const create = async (data: Prisma.black_listsCreateInput) => {
  return prisma.black_lists.create({
    data,
  })
}

const deleteInstance = async (id: number) => {
  return prisma.black_lists.delete({
    where: {
      id,
    },
  })
}

const getById = async (id: number) => {
  return prisma.black_lists.findFirst({
    include: {
      agent: true,
    },
    where: {
      id,
    },
  })
}

const blackListsModel = {
  create,
  delete: deleteInstance,
  getById,
};

export default blackListsModel;