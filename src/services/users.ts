import { NextFunction, Request, Response } from 'express';
import usersModel from '../models/users';
import { IUserUpdateInput, IUserUpdatePasswordInput } from '../types';
import authService from './auth';

const getMe = async (id: number) => {
  const user = await usersModel.getUserById(id);
  
  if (!user) {
    throw { status: 404, message: 'Usuário não encontrado.' };
  }

  user.password = "";

  return user;
}

const hashPassword = (password: string) => {
  return password;
}

const update = async ({ id, data }: {id: number, data: IUserUpdateInput }) => {
  // const verifyEmailAlreadyExists = await usersModel.getUserByEmail(data.email);
  return await usersModel.updateUser(id, data);
}

const updatePassword = async ({ userId, data }: {userId: number, data: IUserUpdatePasswordInput }) => {
  authService.verifyPasswordOrFail({ sendedPassword: data.currentPassword, userPassword: data.newPassword });

  return await usersModel.updateUser(userId, { password: hashPassword(data.newPassword) });
}

const usersService = {
  getMe,
  update,
  updatePassword,
};

export default usersService;