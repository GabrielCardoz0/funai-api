import moment from "moment";
import dashboardModel, { IN8nChat } from "../models/dashboard";
import fs from "fs";

export interface AgentPerformance {
  agentId: number;
  agentName: string;
  chatsCount: number;
  messagesCount: number;
  avgResponseTime: number;
  automatedResolutionRate: number;
  customerServedCount: number;
}

// export interface DashboardInfo {

//   customerServedCount: number;
//   prevCustomerServedCount: number;

//   usage: {
//     chatsCount: number;
//     messagesCount: number;
//     avgResponseTime: number;
//     automatedResolutionRate: number;
//     activeAgents: number;
//     instancesActiveCount: number;
//     planAgentsUsagePercent: number;

//     prevChatsCount: number;
//     prevMessagesCount: number;
//     prevAvgResponseTime: number;
//     prevAutomatedResolutionRate: number;
//     prevActiveAgents: number;
//     prevInstancesActiveCount: number;
//     prevPlanAgentsUsagePercent: number;
//   };
//   impact: {
//     hoursSaved: number;
//     estimatedSavingsBRL: number;

//     prevHoursSaved: number;
//     prevEstimatedSavingsBRL: number;
//   };
//   insights: {
//     topQuestions: { question: string; count: number }[];
//     trendingTopics: { topic: string; growthPercent: number }[];
//   };
//   history: {
//     labels: string[];
//     messages: number[];
//     clients: number[];
//   };

//   agentsPerformance: AgentPerformance[];
// }

export interface DashboardInfo {

  customerServedCount: number;
  prevCustomerServedCount: number;

  usage: {
    chatsCount: number;
    messagesCount: number;
    avgResponseTime: number;
    automatedResolutionRate: number;
    activeAgents: number;
    instancesActiveCount: number;
    planAgentsUsagePercent: number;
  };
  prevUsage: {
    chatsCount: number;
    messagesCount: number;
    avgResponseTime: number;
    automatedResolutionRate: number;
    activeAgents: number;
    instancesActiveCount: number;
    planAgentsUsagePercent: number;
  };

  impact: {
    hoursSaved: number;
    estimatedSavingsBRL: number;
  };
  prevImpact: {
    hoursSaved: number;
    estimatedSavingsBRL: number;
  };

  insights: {
    topQuestions: { question: string; count: number }[];
    trendingTopics: { topic: string; growthPercent: number }[];
  };
  history: {
    labels: string[];
    messages: number[];
    clients: number[];
  };
  agentsPerformance: AgentPerformance[];
}

const CUSTO_MEDIO_HORA = 36;
const MSG_POR_HORA_HUMANA = 50;


const calcAvgResponseTime = (msgs: IN8nChat[]) => {
  // const hashMessages: { [key: string]: IN8nChat[] } = {};

  // msgs.forEach((m) => {

  //   if(!m.message.response_metadata.fromMe) {
  //     const founded = hashMessages[m.session_id];
      
  //     if(founded) {
  //       founded.push(m);
  //     } else {
  //       hashMessages[m.session_id] = [m];
  //     }
  //   }
  // });

  // let sum = 0;
  // let count = 0;

  // for(const key in hashMessages) {
  //   const sessionMsgs = hashMessages[key];

  //   if(sessionMsgs.length < 2) continue;

  //   for (let i = 0; i < sessionMsgs.length; i++) {
  //     const currMsg = sessionMsgs[i];
  //     const nextMsg = sessionMsgs[i + 1];

  //     if(currMsg.message.type === "human") {
  //       continue;
  //     }

  //     if(!nextMsg) {
  //       break;
  //     }

  //     if(currMsg.message.type === nextMsg.message.type) {
  //       continue;
  //     }

  //     const diff = new Date(currMsg.created_at).getTime() - new Date(nextMsg.created_at).getTime();


  //     if (diff < 2*60*1000) {
  //       sum =+ diff;
  //       count++;
  //     }
      
  //     continue;
  //   }
  // }

  // return Number((sum / count).toFixed(2));

  const responseTimes: number[] = [];

  const sorted = msgs.sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i - 1].session_id === sorted[i].session_id) {
      const diff =
        new Date(sorted[i].created_at).getTime() -
        new Date(sorted[i - 1].created_at).getTime();
      if (diff > 0 && diff < 60000) {
        responseTimes.push(diff / 1000);
      }
    }
  }

  return responseTimes.length
    ? Number(
        (
          responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        ).toFixed(2)
      )
    : 0;
};

const calcTopQuestions = (msgs: IN8nChat[], limit: number) => {
  const questionMap: Record<string, number> = {};
  for (const m of msgs) {
    if (m.message?.content) {
      const text = m.message.content.toLowerCase();
      questionMap[text] = (questionMap[text] || 0) + 1;
    }
  }
  return Object.entries(questionMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([question, count]) => ({ question, count }));
};

const buildHistory = (msgs: IN8nChat[], days: number) => {
  const labels: string[] = [];
  const data: number[] = [];

  const now = new Date();

  for (let i = 0; i < Math.ceil(days / 30); i++) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);

    const label = month.toLocaleString("default", { month: "long", year: "numeric" });

    const count = msgs.filter((m) => {
      const d = new Date(m.created_at);
      return (
        d.getMonth() === month.getMonth() &&
        d.getFullYear() === month.getFullYear()
      );
    }).length;

    labels.unshift(label);
    data.unshift(count);
  }

  return { labels, messages: data };
};

const buildHistoryByDay = (msgs: IN8nChat[], days: number) => {
  const labels: string[] = [];
  const data: IN8nChat[][] = [];
  const now = new Date();

  // Começando do último dia (days - 1) e indo até o dia 0
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    day.setDate(now.getDate() - i);

    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);

    const msgsForDay = msgs.filter((m) => {
      const msgDate = new Date(m.created_at);
      return msgDate >= day && msgDate < nextDay;
    });

    const weekday = day.toLocaleDateString("pt-BR", { weekday: "short" }); // seg, ter, qua...
    const dateLabel = day.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    const label = `${weekday} ${dateLabel}`;

    labels.push(label);
    data.push(msgsForDay);
  }

  return {
    labels: labels,
    messages: data.map(item => item.length),
    clients: data.map(item => new Set(item.map(m => m.session_id.split(":")[2])).size)
  };
};

const buildHistoryByWeek = (msgs: IN8nChat[], days: number) => {
  const labels: string[] = [];
  const data: IN8nChat[][] = [];

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const since = new Date(now);
  since.setDate(now.getDate() - (days - 1));

  const totalWeeks = Math.ceil(days / 7);

  for (let i = totalWeeks - 1; i >= 0; i--) {
    const ref = new Date(now);
    ref.setDate(now.getDate() - i * 7);

    const dow = (ref.getDay() + 6) % 7; // dom(0)->6, seg(1)->0
    const weekStart = new Date(ref);
    weekStart.setDate(ref.getDate() - dow);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const from = weekStart < since ? since : weekStart;
    const to = weekEnd > now ? now : weekEnd;

    if (to < since) continue;

    const count = msgs.filter((m) => {
      const t = new Date(m.created_at).getTime();
      return t >= from.getTime() && t <= to.getTime();
    });
    

    const weekNumber = getWeekNumber(weekStart);
    const monthName = weekStart.toLocaleString("pt-BR", { month: "long" });
    const year = weekStart.getFullYear();

    const rangeLabel = `${from.toLocaleDateString("pt-BR")} - ${to.toLocaleDateString("pt-BR")}`;
    // const label = `${rangeLabel} (Semana ${weekNumber} de ${monthName} ${year})`;
    const label = `${rangeLabel}`;

    labels.push(label);
    data.push(count);
  }

  return {
    labels,
    messages: data.map(item => item.length),
    clients: data.map(item => new Set(item.map(m => m.session_id.split(":")[2])).size)
  };
};

function getWeekNumber(date: Date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const adjusted = date.getDate() + offset;
  return Math.ceil(adjusted / 7);
}

// const emptyDashboard = (): DashboardInfo => ({
//     usage: {
//       chatsCount: 0,
//       messagesCount: 0,
//       avgResponseTime: 0,
//       automatedResolutionRate: 0,
//       activeAgents: 0,
//       instancesActiveCount: 0,
//       planAgentsUsagePercent: 0,

//       prevChatsCount: 0,
//       prevMessagesCount: 0,
//       prevAvgResponseTime: 0,
//       prevAutomatedResolutionRate: 0,
//       prevActiveAgents: 0,
//       prevInstancesActiveCount: 0,
//       prevPlanAgentsUsagePercent: 0,
//     },
//     impact: {
//       hoursSaved: 0,
//       estimatedSavingsBRL: 0,

//       prevHoursSaved: 0,
//       prevEstimatedSavingsBRL: 0,
//     },
//     insights: {
//       topQuestions: [],
//       trendingTopics: []
//     },
//     history: { labels: [], messages: [], clients: [] },
//     customerServedCount: 0,
//     prevCustomerServedCount: 0,
//     agentsPerformance: [],
// });

const emptyDashboard = (): DashboardInfo => ({
  usage: {
    chatsCount: 0,
    messagesCount: 0,
    avgResponseTime: 0,
    automatedResolutionRate: 0,
    activeAgents: 0,
    instancesActiveCount: 0,
    planAgentsUsagePercent: 0,
  },
  prevUsage: {
    chatsCount: 0,
    messagesCount: 0,
    avgResponseTime: 0,
    automatedResolutionRate: 0,
    activeAgents: 0,
    instancesActiveCount: 0,
    planAgentsUsagePercent: 0,
  },
  impact: {
    hoursSaved: 0,
    estimatedSavingsBRL: 0,
  },
  prevImpact: {
    hoursSaved: 0,
    estimatedSavingsBRL: 0,
  },
  insights: {
    topQuestions: [],
    trendingTopics: [],
  },
  history: { labels: [], messages: [], clients: [] },
  customerServedCount: 0,
  prevCustomerServedCount: 0,
  agentsPerformance: [],
});

const separeteIaAndHumanMessages = (messages: IN8nChat[]) => {
  const iaMessages: IN8nChat[] = [];
  const humanMessages: IN8nChat[] = [];

  messages.forEach((m) =>
    m.message.type === "ai" ? iaMessages.push(m) : humanMessages.push(m)
    // m.message.type === "ai" ? !m.message.response_metadata.fromMe && iaMessages.push(m) : humanMessages.push(m)
  );

  return { iaMessages, humanMessages };
};

const calculateAutomatedResolution = ({ chatsCount, messages }: { chatsCount: number, messages: IN8nChat[]}) => {

  const hashedMsg: { [key: string]: IN8nChat[] } = { };

  messages.forEach((m) => {
    const sessionId = m.session_id;

    if (hashedMsg[sessionId]) {
      hashedMsg[sessionId].push(m);
    } else {
      hashedMsg[sessionId] = [m];
    }
  });

  let chatsCounter = chatsCount;
  const hash: { [key: string]: IN8nChat[] } = { };

  for (const key in hashedMsg) {
    const messages = hashedMsg[key];

    messages.forEach((m, index) => {
      if(!messages[index+1]) return;

      const diff = new Date(m.created_at).getTime() - new Date(messages[index+1].created_at).getTime();

      if(diff > 20 * 60 * 1000) {
        chatsCounter++;
      }

      const chatsKey = m.session_id+""+chatsCounter;
      const hasKey = hash[chatsKey];
      
      if (hasKey) {
        hash[chatsKey].push(m);
      } else {
        hash[chatsKey] = [m];
      }
    })
  }

  let humanChatTrySolve = 0;
  let iaSolveChat = 0;

  Object.values(hash).forEach((msgs) => {
    if(msgs.find(m => m.message.response_metadata.fromMe)) {
      humanChatTrySolve++;
    } else {
      iaSolveChat++;
    }
  })

  return Number((iaSolveChat/chatsCounter).toFixed(2));
}

const getUsageMetrics = ({
  messages,
  agents,
  agents_limit,
}: {
  messages: IN8nChat[];
  agents: { is_active: boolean; instances: { is_connected: boolean }[] }[];
  agents_limit: number;
}): DashboardInfo["usage"] => {
  const messagesCount = messages.length;

  // const { iaMessages, humanMessages } = separeteIaAndHumanMessages(messages);

  const chatsCount = new Set(messages.map((m) => m.session_id)).size;

  const avgResponseTime = calcAvgResponseTime(messages);

  const planAgentsUsagePercent = Number(
    ((agents.length / agents_limit) * 100).toFixed(2)
  );

  const instancesActiveCount = agents.reduce((total, agent) => {
    const activeInstances = agent.is_active
      ? agent.instances?.filter((i) => i.is_connected).length ?? 0
      : 0;
    return total + activeInstances;
  }, 0);

  return {
    chatsCount,
    messagesCount,
    avgResponseTime,
    automatedResolutionRate: calculateAutomatedResolution({ messages, chatsCount }),
    activeAgents: agents.filter((a) => a.is_active).length,
    instancesActiveCount,
    planAgentsUsagePercent,
  };
};

const getImpactMetrics = (messagesCount: number) => {
  
  const hoursSaved = Number((messagesCount / MSG_POR_HORA_HUMANA).toFixed(2));

  const impactMetrics = {
    hoursSaved,
    estimatedSavingsBRL: Number((hoursSaved * CUSTO_MEDIO_HORA).toFixed(2)),
  }

  return impactMetrics;
}

const getInsightsMetrics = ({ messages, prevMessages, limit }: {messages: IN8nChat[], prevMessages: IN8nChat[], limit: number}) => {

  const topQuestions = calcTopQuestions(messages, limit);

  const trendingTopics = topQuestions.map(tq => {
    const prevCount = prevMessages.filter(m => m.message?.content?.toLowerCase() === tq.question).length;
    const growthPercent = prevCount ? Number((((tq.count - prevCount) / prevCount) * 100).toFixed(2)) : 100;
    return { topic: tq.question, growthPercent };
  });

  const insightsMetrics = {
    topQuestions: calcTopQuestions(messages, 5),
    // trendingTopics: topQuestions.map((tq) => {
    //   const prevCount = messages.filter(
    //     (m) => m.message?.content?.toLowerCase() === tq.question
    //   ).length;
    //   const growthPercent = prevCount
    //     ? Number((((tq.count - prevCount) / prevCount) * 100).toFixed(2))
    //     : 100;
    //   return { topic: tq.question, growthPercent };
    // }),
    trendingTopics
  }

  return insightsMetrics;
}

const getAgentsPerformance = ({ messages, agents, days }: { messages: IN8nChat[], days: number, agents: {
  id: number;
  name: string;
  description: string;
  agent_name: string;
  is_active: boolean;
  instances: {
      id: number;
      name: string | null;
      is_connected: boolean;
  }[];
}[] }) => {

  const hashedAgentsMessages: { [key: string]: IN8nChat[] } = {};

  messages.forEach((m) => {
    const agentId = m.session_id.split(":")[1];
    if (hashedAgentsMessages[agentId]) {
      hashedAgentsMessages[agentId].push(m);
    } else {
      hashedAgentsMessages[agentId] = [m];
    }
  });

  return agents.map((agent) => {
    const agentMsgs = hashedAgentsMessages[agent.id] ?? [];

    return {
      agentId: agent.id,
      agentName: agent.name,
      chatsCount: new Set(agentMsgs.map((m) => m.session_id)).size,
      messagesCount: agentMsgs.length,
      avgResponseTime: calcAvgResponseTime(agentMsgs),
      automatedResolutionRate: agentMsgs.length
        ? Number(
            (
              agentMsgs.filter((m) => m.message?.type === "ai").length /
              agentMsgs.length
            ).toFixed(2)
          )
        : 0,
      customerServedCount: new Set(agentMsgs.map((m) => m.session_id.split(":")[2])).size,
      history: days > 90 ? buildHistoryByWeek(agentMsgs, days) : buildHistoryByDay(agentMsgs, days),
    };
  });
}

const get = async ({ user_id, days = 30 }: { user_id: number, days?: number }): Promise<DashboardInfo> => {
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - days);

  const user = await dashboardModel.getUserWithAgents(user_id);

  if (!user) throw new Error("User not found");

  const agents = user.agents ?? [];

  if (!agents.length) {
    return emptyDashboard();
  }


  const messages = await dashboardModel.getMessagesByAgentsPeriod({
    userId: user_id,
    startDate: sinceDate,
    endDate: new Date(),
  });

  const prevPeriodMessages = await dashboardModel.getMessagesByAgentsPeriod({
    userId: user_id,
    startDate: new Date(sinceDate.getTime() - days * 24 * 60 * 60 * 1000),
    endDate: sinceDate,
  });


  const usageMetrics = getUsageMetrics({ messages, agents, agents_limit: user.subscription.agents_limit });

  const prevUsageMetrics = getUsageMetrics({ messages: prevPeriodMessages, agents, agents_limit: user.subscription.agents_limit });

  const impactMetrics = getImpactMetrics(usageMetrics.messagesCount);

  const prevImpactMetrics = getImpactMetrics(prevUsageMetrics.messagesCount);

  const insights = getInsightsMetrics({
    limit: 5,
    messages,
    prevMessages: prevPeriodMessages,
  });

  const agentsPerformance = getAgentsPerformance({
    messages,
    agents: user.agents,
    days
  });


  return {
    usage: usageMetrics,
    prevUsage: prevUsageMetrics,
    impact: impactMetrics,
    prevImpact: prevImpactMetrics,
    insights,
    history: days > 90 ? buildHistoryByWeek(messages, days) : buildHistoryByDay(messages, days),
    agentsPerformance,
    customerServedCount: new Set(messages.map((m) => m.session_id.split(":")[2])).size,
    prevCustomerServedCount: new Set(prevPeriodMessages.map((m) => m.session_id.split(":")[2])).size,
    // usage: usageMetrics,
    // impact: impactMetrics,
    // insights,
    // history: days > 90 ? buildHistoryByWeek(messages, days) : buildHistoryByDay(messages, days),
    // // history: buildHistoryByDay(messages, days),
    // customerServedCount: new Set(messages.map((m) => m.session_id.split(":")[2])).size,
    // agentsPerformance,
  };
};

const dashboardService = {
  get,
};

export default dashboardService;
