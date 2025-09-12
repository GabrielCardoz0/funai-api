import { Prisma } from "../generated/prisma";
import prisma from "../prisma";

const create = async (data: Prisma.invoicesCreateInput) => {
  return prisma.invoices.create({
    data
  })
}

const update = async (id: number, data: Prisma.invoicesUpdateInput) => {
  return prisma.invoices.update({
    where: { id },
    data: {
      ...data,
      updated_at: new Date(),
    }
  })
}

const getById = async (id: number) => {
  return prisma.invoices.findFirst({
    where: {
      id,
    },
  })
}

const getByStripeId = async (id: string) => {
  return prisma.invoices.findFirst({
    where: {
      stripe_id: id,
    },
  })
}


const invoicesModel = {
  create,
  getById,
  getByStripeId,
  update,
};

export default invoicesModel;