import { Prisma } from "../generated/prisma";
import prisma from "../prisma";

const createUser = async (user: Prisma.usersCreateInput) => {
  return prisma.users.create({
    data: user,
  });
};

const getUserRequestById = async (id: number) => {
  return prisma.users.findFirst({
    where: { id },
    include: {
      subscription: {
        include: {
          plan: true
        }
      },
      _count: {
        select: {
          agents: true,
        }
      }
    }
  });
};

const getUserById = async (id: number) => {
  return prisma.users.findFirst({
    where: { id },
    include: {
      subscription: {
        include: {
          plan: true
        }
      },
      agents: true,
      _count: {
        select: {
          agents: true,
        }
      }
    }
  });
};

const getUserByEmail = async (email: string) => {
  return prisma.users.findFirst({
    where: { email }
  });
};

const updateUser = async (id: number, user: Prisma.usersUpdateInput) => {
  return prisma.users.update({
    where: { id },
    data: user,
  });
};

const deleteUser = async (id: number) => {
  return prisma.users.delete({
    where: { id }
  });
};

const getSubscription = async (id: number) => {
  const res = await prisma.users.findFirst({
    where: {
      id
    },
    include: {
      subscription: {
        include: {
          plan: true
        }
      }
    }
  });

  return res?.subscription;
};

const getByStripeId = async (id: string) => {
  return await prisma.users.findFirst({
    where: {
      stripe_id: id,
    },
    include: {
      subscription: {
        include: {
          plan: true
        }
      }
    }
  });
};


const usersModel = {
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  getUserByEmail,
  getUserRequestById,
  getSubscription,
  getByStripeId,
};

export default usersModel;
