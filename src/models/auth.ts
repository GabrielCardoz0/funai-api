import { Prisma } from "../generated/prisma";
import prisma from "../prisma";

const createUser = async (user: Prisma.usersCreateInput) => {
  return prisma.users.create({
    data: user,
  })
}

const authModel = {
  createUser,
};

export default authModel;