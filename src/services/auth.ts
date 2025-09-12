import jwt from 'jsonwebtoken';
import dotent from 'dotenv';
import usersModel from '../models/users';
import { emailsTemplates, sendEmail } from '../utils';

dotent.config();


const verifyPasswordOrFail = async ({ sendedPassword, userPassword }: { sendedPassword: string, userPassword: string }) => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  if (sendedPassword !== userPassword) throw { status: 400, message: 'Senha incorreta' };
}

const login = async ({ email, password }: { email: string, password: string }): Promise<any> => {
  const user = await usersModel.getUserByEmail(email);

  if (!user) {
    throw { status: 400, message: 'Usuário não encontrado' };
  }

  await verifyPasswordOrFail({ sendedPassword: password, userPassword: user.password });

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '720h' });

  return { token, user };
}

const verifyToken = async (token: string): Promise<boolean> => {
  try {
    jwt.verify(token, process.env.JWT_SECRET!);
    return true;
  } catch (error) {
    return false;
  }
}

const generateResetToken = (userId: number) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' } // token válido por 1 hora
  );
};

const forgotPassword = async ({ email }: { email: string }): Promise<boolean> => {
  const user = await usersModel.getUserByEmail(email);

  if (!user) throw { status: 404, message: "Usuário não encontrado." };

  const token = generateResetToken(user.id);

  const resetLink = `${process.env.FRONT_URL}/reset-password?token=${token}`;

  await sendEmail({
    email: user.email,
    subject: "Recuperação de senha",
    html: emailsTemplates.resetPassword({
      name: user.name,
      reset_link: resetLink
    })
  });

  return true;
};

const resetPassword = async ({ token, password }: { token: string, password: string }) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };

    console.log(decoded);

    const user = await usersModel.getUserById(decoded.userId);

    if (!user) throw { status: 404, message: "Usuário não encontrado." };

    await usersModel.updateUser(user.id, { password });
  } catch (error) {
    throw { status: 400, message: "Token inválido ou expirado." };
  }
};

const authService = {
  login,
  verifyToken,
  verifyPasswordOrFail,
  forgotPassword,
  resetPassword,
};

export default authService;