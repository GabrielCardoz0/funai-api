import { Prisma } from "../generated/prisma";
import prisma from "../prisma";

const createFile = async (data: Prisma.filesCreateInput) => {
  return prisma.files.create({
    data
  })
}

const deleteFile = async (id: number) => {
  return prisma.files.delete({
    where: {
      id
    }
  })
}

const createManyFiles = async (files: Prisma.filesCreateManyInput[]) => {
  return prisma.files.createMany({
    data: files,
  })
}

const getById = async (id: number) => {
  return prisma.files.findFirst({
    where: {
      id
    },
    include: {
      agent: {
        select: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      },
    }
  })
}

const filesModel = {
  createFile,
  deleteFile,
  createManyFiles,
  getById,
};

export default filesModel;