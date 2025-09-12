import agentsService from "./agents";
import { evoApi } from "./evolution-api";
import { n8nApi } from "./n8n-api";
import instancesModel from "../models/instances";
import agentsModel from "../models/agents";
import n8ndb from "../pg";

const webhooks = async (event: string, instance: string, data: any) => {
  switch (event) {
    case "connection.update":
      connectionUpdate(instance, data);
      break;

    case "logout.instance":
      logoutInstance(instance);
      break;

    case "remove.instance":
      removeInstance(instance);
      break;

    case "messages.upsert":
      upsertMessage(instance, data);
      break;

    default:
      console.warn(`Unhandled event: ${event} for instance ${instance}`);
      break;
  }
}

const connectionUpdate = async (instanceId: string, data: any) => {
  const instance = await instancesModel.getInstanceByIntegrationId(instanceId);
  
  if (!instance) return;

  await instancesModel.update(instance.id, {
    is_connected: Boolean(data.state === "open"),
    name: data?.wuid?.replace("@s.whatsapp.net", "")  ?? null,
  });
}

const logoutInstance = async (instanceId: string) => {
  const instance = await instancesModel.getInstanceByIntegrationId(instanceId);
  
  if (!instance) return;

  return await instancesModel.update(instance.id, { is_connected: false });
}

const removeInstance = async (instanceId: string) => {
  const instance = await instancesModel.getInstanceByIntegrationId(instanceId);
  
  if (!instance) return;

  return await instancesModel.update(instance.id, { is_connected: false, integration_id: null });
}


interface Message {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  pushName: string;
  status: string;
  message: {
    conversation: string;
    messageContextInfo: {
      deviceListMetadata: object;
      deviceListMetadataVersion: number;
      messageSecret: string;
    };
  };
  messageType: "imageMessage" | "conversation" | "extendedTextMessage" | "videoMessage" | "documentMessage" | "audioMessage" | "stickerMessage";
  messageTimestamp: number;
  instanceId: string;
  source: string;
}

const upsertMessage = async (instanceId: string, data: Message) => {
  const instance = await instancesModel.getInstanceByIntegrationId(instanceId);
  
  if (!instance) return;

  if(instance.is_disable) return;

  const agent = await agentsModel.getAgentById(instance.agent_id);
  
  if (!agent) return;

  const message = data.message.conversation;

  const remoteJid = data.key.remoteJid;

  const isFromMe = data.key.fromMe;
  
  const [ number, type ] = remoteJid.split("@");
  
  if(type !== "s.whatsapp.net") return;

  const chatId = `${agent.user_id}:${agent.id}:${remoteJid}`;

  if(data.messageType !== "conversation") {
    evoApi.post(`/message/sendText/${instanceId}`, { number, text: `Peço desculpas, não consigo entender mensagens desse tipo. Por favor, envie uma mensagem de texto.` });
    return;
  }

  if(isFromMe) {
    const historyMessage =  `{"type": "ai", "content": "${message}", "tool_calls": [], "additional_kwargs": {}, "response_metadata": { "fromMe": true }, "invalid_tool_calls": []}`;

    await n8ndb.query(`insert into n8n_chat_histories(session_id, message) values($1, $2);`, [chatId, historyMessage]);

    return
  }

  const agentBehavior = await agentsService.getAgentBehaviorAndKnowledgeById({ agent_id: agent.id, question: message });

  const { data: { output } } = await n8nApi.post("/agent", { agentBehavior, message, chatId });
  
  evoApi.post(`/message/sendText/${instanceId}`, { number, text: output });
}

export const evolutionWebhookService = {
  webhooks,
}