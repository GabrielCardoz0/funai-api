import n8ndb from "../pg";
import prisma from "../prisma";

export interface IN8nChat {
  id: string;
  session_id: string;
  // message: string;
  created_at: Date;
  message: {
    type: "ai" | "human";
    response_metadata: {
      fromMe?: boolean;
      [key: string]: string | boolean | number | undefined;
    };
    content: string;
    
    additional_kwargs: any;
    
    tool_calls: string[];
    invalid_tool_calls: string[];
  };
}

const getUserWithAgents = async (user_id: number) => {
  return await prisma.users.findFirst({
    include: {
      subscription: {
        include: {
          plan: true
        }
      },
      agents: {
        select: {
          id: true,
          name: true,
          agent_name: true,
          description: true,
          is_active: true,
          instances: {
            select: {
              id: true,
              name: true,
              is_connected: true,
            },
          },
        },
      },
    },
  });
};

const getIntegrationsCount = async (agentIds: number[]) => {
  return prisma.instances.count({
    where: { agent_id: { in: agentIds }, is_connected: true },
  });
};

const getMessagesByAgents = async ({ userId, sinceDate }: { userId: number, sinceDate: Date }): Promise<IN8nChat[]> => {

  const { rows } = await n8ndb.query(
    `
    SELECT session_id, message, created_at
    FROM n8n_chat_histories
    WHERE created_at >= $1 AND created_at < $2
    AND session_id LIKE $3
    ORDER BY id DESC
    `,
    [sinceDate, new Date(), `%${userId}:%`]
  );

  return rows ?? [];
};

// const getMessagesByAgents = async (
//   agentIds: number[],
//   sinceDate: Date
// ): Promise<IN8nChat[]> => {
//   if (!agentIds.length) return [];

//   const { rows } = await n8ndb.query(
//     `
//     SELECT session_id, message, created_at
//     FROM n8n_chat_histories
//     WHERE created_at >= $1
//     AND (
//       ${agentIds.map((_, i) => `session_id LIKE $${i + 2}`).join(" OR ")}
//     )
//     `,
//     [sinceDate, ...agentIds.map((id) => `%:${id}:%`)]
//   );

//   return rows;
// };

const getMessagesByAgentsPeriod = async ({ startDate, endDate, userId }: { userId: number, startDate: Date, endDate: Date }): Promise<IN8nChat[]> => {
  // const { rows } = await n8ndb.query(
  //   `
  //   SELECT session_id, message, created_at
  //   FROM n8n_chat_histories
  //   WHERE created_at >= $1 AND created_at < $2
  //   AND session_id LIKE $3
  //   ORDER BY id DESC
  //   `,
  //   [startDate, endDate, `%:${userId}:%`]
  // );

  const { rows } = await n8ndb.query(
    `
    SELECT session_id, message, created_at
    FROM n8n_chat_histories
    WHERE created_at >= $1 AND created_at < $2
    AND session_id LIKE $3
    ORDER BY id DESC
    `,
    [startDate, endDate, `%${userId}:%`]
  );

  return rows ?? [];
};

const dashboardModel = {
  getUserWithAgents,
  getIntegrationsCount,
  getMessagesByAgents,
  getMessagesByAgentsPeriod,
};

export default dashboardModel;
