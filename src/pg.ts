import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();


const pool = new Pool({
  host: process.env.N8N_DB_HOST,
  port: Number(process.env.N8N_DB_PORT),
  user: process.env.N8N_DB_USER,
  password: process.env.N8N_DB_PASSWORD,
  database: process.env.N8N_DB_NAME,
});

const n8ndb = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  pool,
}

export default n8ndb;
