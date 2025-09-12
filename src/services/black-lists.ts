import blackListsModel from '../models/black-lists';
import { IBlackListCreateInput } from '../types';
import agentsService from './agents';

const create = async ({ user_id, data: { agent_id, contact } }: { user_id: number, data: IBlackListCreateInput }): Promise<any> => {
  await agentsService.verifyIsUserAgent({ agent_id, user_id });

  const item = {
    type: "whatsapp",
    contact,
    agent: {
      connect: {
        id: agent_id,
      }
    },
  }
  
  return await blackListsModel.create(item);
}

const getContactByIdOrFail = async (id: number) => {
  const contact = await blackListsModel.getById(id);
  if (!contact) {
    throw { status: 404, message: "Contato não encontrado." };
  }
  return contact;
}

const deleteContact = async ({ user_id, black_list_id }: { user_id: number, black_list_id: number }): Promise<any> => {
  const item = await getContactByIdOrFail(black_list_id);
  
  await agentsService.verifyIsUserAgent({ agent_id: item.agent_id, user_id });

  await blackListsModel.delete(black_list_id);

  return { message: "Contato excluído com sucesso." };
}

const blackListService = {
  create,
  delete: deleteContact,
};

export default blackListService;