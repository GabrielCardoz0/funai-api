import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const { N8N_API_URL } = process.env;

export const n8nApi = axios.create({
  baseURL: N8N_API_URL,
  headers: {
    "Content-Type": "application/json",
    // apikey: EVOLUTION_API_TOKEN
  },
});