import whiteListsModel from '../models/white-lists';
import { IWhiteListCreateInput } from '../types';
import agentsService from './agents';

const create = async ({ user_id, data: { agent_id, contact } }: { user_id: number, data: IWhiteListCreateInput }): Promise<any> => {
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
  
  return await whiteListsModel.create(item);
}

const getContactByIdOrFail = async (id: number)  => {
  const contact = await whiteListsModel.getById(id);
  if (!contact) {
    throw { status: 404, message: "Contato não encontrado." };
  }
  return contact;
}

const deleteContact = async ({ user_id, white_list_id }: { user_id: number, white_list_id: number }): Promise<any> => {
  const item = await getContactByIdOrFail(white_list_id);
  
  await agentsService.verifyIsUserAgent({ agent_id: item.agent_id, user_id });

  await whiteListsModel.delete(white_list_id);

  return { message: "Contato excluído com sucesso." };
}

const whiteListService = {
  create,
  delete: deleteContact,
};

export default whiteListService;