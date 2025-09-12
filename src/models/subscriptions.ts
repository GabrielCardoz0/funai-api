import { Prisma } from "../generated/prisma";
import prisma from "../prisma";

const create = async (data: Prisma.subscriptionsCreateInput) => {
  return prisma.subscriptions.create({
    data,
  })
}
const getByUserId = async (id: number) => {
  return prisma.subscriptions.findFirst({
    where: {
      user: {
        some: { id },
      },
    },
    include: {
      invoices: true,
      plan: true,
      user: {
        take: 1
      },
    },
  }).then((result) => {
    if (!result) return null;

    const { user, ...subscription } = result;

    return {
      ...subscription,
      user: user[0],
    };
  });
};

const getById = async (id: number) => {
  return prisma.subscriptions.findFirst({
    where: {
      id,
    },
    include: {
      plan: true,
      invoices: true,
      user: true,
    }
  })
}

const getByStripeId = async (id: string) => {
  return prisma.subscriptions.findFirst({
    where: {
      stripe_id: id,
    },
    include: {
      plan: true,
      invoices: true,
      user: true,
    }
  })
}

const deleteSubs = async (id: number) => {
  return prisma.subscriptions.delete({
    where: {
      id,
    }
  })
}

const update = async (id: number, data: Prisma.subscriptionsUpdateInput) => {
  return prisma.subscriptions.update({
    where: {
      id,
    },
    data: {
      ...data,
      updated_at: new Date(),
    }
  })
}

const subscriptionsModel = {
  create,
  getById,
  getByUserId,
  delete: deleteSubs,
  getByStripeId,
  update,
};

export default subscriptionsModel;