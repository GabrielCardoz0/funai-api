import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import prisma from "../prisma";

dotenv.config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const CHUNK_SIZE = 500;



// Area para processamento de arquivos txt e geração de embeddings
function splitText(text: string, size: number): string[] {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

async function embedText(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

// function sanitizeText(input: string): string {
//   return input
//     .replace(/\u0000/g, '')  // remove NULL chars
//     .replace(/\x1A/g, '')    // remove SUB chars
//     .replace(/\\/g, '\\\\'); // escapa barras invertidas
// }

// function sanitizeText(input: string): string {
//   return input
//     .normalize("NFC")       // normaliza caracteres Unicode
//     .replace(/\u0000/g, ""); // remove NULLs invisíveis
// }

function sanitizeText(input: string): string {
  return input
    .normalize("NFC")        // normaliza unicode (emojis, acentos)
    .replace(/\u0000/g, "")  // remove caracteres NUL
    .replace(/\x1A/g, "")    // remove SUB
    // não precisa escapar aspas aqui — parametrização do prisma cuida disso
    ;
}

async function processTxt({ agent_id, file_id, filepath } : { filepath: string, agent_id: number, file_id: number }): Promise<void> {
  const filePath = path.join(__dirname, 'example.txt');

  const content = fs.readFileSync(filepath, 'utf-8');

  const chunks = splitText(content, CHUNK_SIZE);

  // for (let i = 0; i < chunks.length; i++) {
  //   const embedding = await embedText(chunks[i]) as number[];
  
  //   const safeContent = sanitizeText(chunks[i]);
  
  //   await prisma.$queryRawUnsafe(
  //     `INSERT INTO knowledge_chunks 
  //     (source_file, chunk_index, content, embedding, agent_id, file_id) 
  //     VALUES ($1, $2, $3, $4::vector, $5, $6)`,
  //     filepath,
  //     i,
  //     safeContent,
  //     `[${embedding.join(",")}]`,
  //     agent_id,
  //     file_id
  //   );
  // }

  // for (let i = 0; i < chunks.length; i++) {
  //   const embedding = await embedText(chunks[i]) as unknown as number[];
    
  //   await prisma.$queryRawUnsafe(
  //     `INSERT INTO knowledge_chunks 
  //     (source_file, chunk_index, content, embedding, agent_id, file_id) 
  //     VALUES ($1, $2, $3, $4::vector, $5, $6)`,
  //     filepath,
  //     i,
  //     chunks[i],
  //     `[${embedding.join(",")}]`, // <-- vira string: "[0.12,0.98,...]"
  //     agent_id,
  //     file_id
  //   );

  // }


  for (let i = 0; i < chunks.length; i++) {
    const embedding = await embedText(chunks[i]) as unknown as number[];

    await prisma.$queryRawUnsafe(
      `INSERT INTO knowledge_chunks (source_file, chunk_index, content, embedding, agent_id, file_id) VALUES ($1, $2, $3, $4, $5, $6)`,
      filePath, i, JSON.stringify(chunks[i]), embedding, agent_id, file_id
    );

  }

  // for (let i = 0; i < chunks.length; i++) {
  //   const embedding = await embedText(chunks[i]) as unknown as number[];
  //   const safeContent = sanitizeText(chunks[i]);

  //   await prisma.$queryRaw(
  //     `INSERT INTO knowledge_chunks 
  //     (source_file, chunk_index, content, embedding, agent_id, file_id) 
  //     VALUES ($1, $2, $3, $4::vector, $5, $6)`,
  //     filepath,
  //     i,
  //     safeContent,
  //     `[${embedding.join(",")}]`,
  //     agent_id,
  //     file_id
  //   );
  // }
}

// async function processTxt({
//   agent_id,
//   file_id,
//   filepath,
// }: {
//   filepath: string;
//   agent_id: number;
//   file_id: number;
// }): Promise<void> {
//   const content = fs.readFileSync(filepath, "utf-8");
//   const chunks = splitText(content, CHUNK_SIZE);

//   for (let i = 0; i < chunks.length; i++) {
//     const chunk = chunks[i];
//     const embedding = (await embedText(chunk)) as unknown as number[];

//     const safeContent = sanitizeText(chunk);
//     const vectorLiteral = `[${embedding.join(",")}]`; // string como "[0.01,0.23,...]"

//     try {
//       // tagged template — evita o erro TS 'string não atribuível...'
//       await prisma.$queryRaw`
//         INSERT INTO knowledge_chunks
//         (source_file, chunk_index, content, embedding, agent_id, file_id)
//         VALUES (
//           ${filepath},
//           ${i},
//           ${safeContent},
//           ${vectorLiteral}::vector,
//           ${agent_id},
//           ${file_id}
//         )
//       `;
//     } catch (err) {
//       console.error("Erro inserindo chunk:", i);
//       console.error(err);
//       // rethrow ou continue, conforme desejar
//       throw err;
//     }
//   }
// }



// Área para processar perguntas e gerar embeddings
async function embedQuestion(question: string) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: question,
  });
  return response.data[0].embedding;
}

async function retrieveChunks(agentId: number, questionEmbedding: any, topK: number = 5): Promise<string[]> {
  // const { rows } = await db.query(
  //   `SELECT content, 1 - (embedding <=> $1::vector) AS score
  //   FROM knowledge_chunks
  //   ORDER BY embedding <=> $1::vector
  //   LIMIT $2`,
  //   [questionEmbedding, topK]
  // );

  const rows = await prisma.$queryRawUnsafe(
    `SELECT content, 1 - (embedding <=> $1::vector) AS score
    FROM knowledge_chunks
    WHERE agent_id = $3
    ORDER BY embedding <=> $1::vector
    LIMIT $2`,
    questionEmbedding, topK, agentId
  ) as { content: string, score: number }[];

  if (!rows || rows.length === 0) {
    return [];
  }
  return rows.map((r: any) => r.content);
}

async function getKnowledgeChunksByAgentId(agentId: number, question: string): Promise<string[]> {
  const questionEmbedding = await embedQuestion(question);
  return await retrieveChunks(agentId, questionEmbedding);
}

// async function generateAnswer(question: string) {
//   const questionEmbedding = await embedQuestion(question);
//   const chunks = await retrieveChunks(questionEmbedding);

//   const prompt = `
// Baseado nas informações abaixo, responda à pergunta.

// Contexto:
// ${chunks.join('\n\n')}

// Pergunta: ${question}
// `;

//   const response = await openai.chat.completions.create({
//     model: 'gpt-4',
//     messages: [{ role: 'user', content: prompt }],
//   });

//   return response.choices[0].message.content;
// }




export const ragService = {
  processTxt,
  getKnowledgeChunksByAgentId,
}