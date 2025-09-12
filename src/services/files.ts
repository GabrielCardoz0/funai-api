import filesModel from '../models/files';
import agentsService from './agents';
import { ragService } from './rag';
import fs from 'fs';

const upload = async ({ user_id, agent_id, files }: { user_id: number, agent_id: number, files: Express.Multer.File[] }): Promise<any> => {
  await agentsService.verifyIsUserAgent({ agent_id, user_id });

  for(const file of files) {
    const createdFile = await filesModel.createFile({
      fieldname: file.fieldname,
      originalname: file.originalname,
      filename: file.originalname,
      destination: file.destination,
      encoding: file.encoding,
      mimetype: file.mimetype,
      path: file.path,
      size: file.size,
      agent: {
        connect: {
          id: agent_id
        }
      }
    });

    await ragService.processTxt({ agent_id, file_id: createdFile.id, filepath: file.path });
  }

  return { message: "Arquivos enviados com sucesso." };
}

const getFileByIdOrFail = async (id: number) => {
  const file = await filesModel.getById(id);
  if (!file) {
    throw { status: 404, message: "Arquivo não encontrado." };
  }
  return file;
}

const deleteFile = async ({ user_id, file_id }: { user_id: number, file_id: number }): Promise<any> => {
  const file = await getFileByIdOrFail(file_id);
  
  if(file.agent.user.id !== user_id) {
    throw { status: 403, message: "Você não tem permissão para excluir este arquivo." };
  }

  if(fs.existsSync(file.path)){
    fs.unlinkSync(file.path);
  }

  await filesModel.deleteFile(file_id);

  return { message: "Arquivo excluído com sucesso." };
}

const filesService = {
  upload,
  delete: deleteFile,
};

export default filesService;