import jwt from 'jsonwebtoken';
import dotent from 'dotenv';
import usersModel from '../models/users';
import agentsService from './agents';
import instancesModel from '../models/instances';
import { evolutionService } from './evolution-api';
import subscriptionsService from './subscriptions';

dotent.config();

const create = async ({ user_id, agent_id }: { user_id: number, agent_id: number }): Promise<any> => {

  await agentsService.verifyIsUserAgent({ agent_id, user_id });

  await subscriptionsService.verifyUserInstancesCountOrFail(user_id)

  const instance = {
    integration_id: null,
    name: null,
    type: "whatsapp",
    is_connected: false,
    is_disable: false,
    agent: {
      connect: {
        id: agent_id
      }
    }
  }

  
  return await instancesModel.create(instance);
}

const getInstanceByIdOrFail = async (id: number) => {
  const instance = await instancesModel.getById(id);
  if (!instance) {
    throw { status: 404, message: "Instância não encontrada." };
  }
  return instance;
}

const update = async ({ user_id, instance_id, is_disable }: { user_id: number, instance_id: number, is_disable: boolean }): Promise<any> => {
  const instance = await getInstanceByIdOrFail(instance_id);

  await agentsService.verifyIsUserAgent({ agent_id: instance.agent_id, user_id });

  return await instancesModel.update(instance_id, { is_disable });
}

const deleteInstance = async ({ user_id, instance_id }: { user_id: number, instance_id: number }): Promise<any> => {
  const instance = await getInstanceByIdOrFail(instance_id);

  await agentsService.verifyIsUserAgent({ agent_id: instance.agent_id, user_id });

  instance.integration_id && await evolutionService.deleteInstance(instance.integration_id);

  return await instancesModel.delete(instance_id);
}

const generateRandomString = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

const connectInstance = async ({ instance_id, user_id } :{ user_id: number, instance_id: number }) => {
  const instance = await getInstanceByIdOrFail(instance_id);
  
  await agentsService.verifyIsUserAgent({ agent_id: instance.agent_id, user_id });

  if(instance.is_connected && instance.integration_id) {
    const { data } = await evolutionService.connectInstance(instance.integration_id);

    return data;
  } else {
    const randomId = generateRandomString();

    const { data } = await evolutionService.createInstance({ instanceName: randomId });

    await instancesModel.update(instance_id, { integration_id: randomId });

    return data.qrcode;
  }
}

const getInstanceConnectionStatus = async ({ instance_id, user_id } :{ user_id: number, instance_id: number }) => {
  const instance = await getInstanceByIdOrFail(instance_id);

  await agentsService.verifyIsUserAgent({ agent_id: instance.agent_id, user_id });
  
  return instance;
}

const instancesService = {
  create,
  update,
  delete: deleteInstance,
  getInstanceConnectionStatus,
  connectInstance,
};

export default instancesService;