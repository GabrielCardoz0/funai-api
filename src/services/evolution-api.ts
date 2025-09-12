import axios from "axios";
import dotenv from "dotenv";
import agentsModel from "../models/agents";

dotenv.config();

const { EVOLUTION_API_URL, EVOLUTION_API_TOKEN } = process.env;

export const evoApi = axios.create({
  baseURL: EVOLUTION_API_URL,
  headers: {
    "Content-Type": "application/json",
    apikey: EVOLUTION_API_TOKEN
  },
});

const createInstance = async ({ instanceName }: { instanceName: string  }) => {

  const payload = {
    instanceName,
    qrcode: true,
    integration: "WHATSAPP-BAILEYS",
    //webhook: `http://localhost:4000/webhook/agents`,
    //webhook_by_events: true,
    //events: [
      //"MESSAGES_UPSERT",
    //]
  }

  const instance = await evoApi.post(`/instance/create`, payload);

  await evoApi.post(`webhook/set/${instanceName}`, {
    webhook: {
      url: `http://localhost:5000/evolution/webhooks`,
      events: [
        // "APPLICATION_STARTUP",
        // "CALL",
        // "CHATS_DELETE",
        // "CHATS_SET",
        // "CHATS_UPDATE",
        // "CHATS_UPSERT",
        "CONNECTION_UPDATE",
        // "CONTACTS_SET",
        // "CONTACTS_UPDATE",
        // "CONTACTS_UPSERT",
        // "GROUP_PARTICIPANTS_UPDATE",
        // "GROUP_UPDATE",
        // "GROUPS_UPSERT",
        // "LABELS_ASSOCIATION",
        // "LABELS_EDIT",
        "LOGOUT_INSTANCE",
        // "MESSAGES_DELETE",
        // "MESSAGES_SET",
        // "MESSAGES_UPDATE",
        "MESSAGES_UPSERT",
        // "PRESENCE_UPDATE",
        "QRCODE_UPDATED",
        "REMOVE_INSTANCE",
        // "SEND_MESSAGE",
        // "TYPEBOT_CHANGE_STATUS",
        // "TYPEBOT_START"
      ],
      enabled: true,
      webhookByEvents: false,
      webhookBase64: false,
      instanceId: instance.data.instance.instanceId,
    }
  });

  return instance;

}

const connectInstance = async (id: string | number ) => {
  return await evoApi.get(`/instance/connect/${id}`)
}

const logoutInstance = async (id: string | number ) => {
  return await evoApi.delete(`/instance/logout/${id}`)
}

const deleteInstance = async (id: string | number ) => {
  return await evoApi.delete(`/instance/delete/${id}`)
}

export const evolutionService = {
  createInstance,
  connectInstance,
  logoutInstance,
  deleteInstance,
}
