import { Prisma } from "../generated/prisma";
import prisma from "../prisma";

const create = async (data: Prisma.plansCreateInput) => {
  return prisma.plans.create({
    data,
  })
}

const getById = async (id: number) => {
  return prisma.plans.findFirst({
    where: {
      id,
    },
    include: {
      subscriptions: true
    }
  })
}

const getByStripeId = async (id: string) => {
  return prisma.plans.findFirst({
    where: {
      stripe_id: id,
    }
  })
}

const plansModel = {
  create,
  getById,
  getByStripeId,
};

export default plansModel;