// ===================== ENTIDADES PRINCIPAIS =====================

export interface IUser {
  id: number;
  created_at: Date;
  updated_at?: Date | null;
  email: string;
  name: string;
  password: string;
  is_first_access: boolean;
  is_deleted: boolean;
  is_blocked: boolean;
  agents?: IAgent[];
  subscription: ISubscription;
}

export interface IUserRequest {
  id: number;
  created_at: Date;
  updated_at?: Date | null;
  email: string;
  name: string;
  password: string;
  is_first_access: boolean;
  is_deleted: boolean;
  is_blocked: boolean;
}

export interface IAgent {
  id: number;
  created_at: Date;
  updated_at?: Date | null;
  name: string;
  description: string;
  agent_name: string;
  agent_behavior: string;
  user_id: number;
  is_active: boolean;
  user?: IUser;
  black_list?: IBlackList[];
  files?: IFile[];
  instances?: IInstance[];
  knowledge_chunks?: IKnowledgeChunk[];
  white_list?: IWhiteList[];
}

export interface IInstance {
  id: number;
  created_at: Date;
  updated_at?: Date | null;
  agent_id: number;
  integration_id?: string | null;
  name?: string | null;
  type: string;
  is_connected: boolean;
  is_disable: boolean;
  agent?: IAgent;
}

export interface IFile {
  id: number;
  created_at: Date;
  updated_at?: Date | null;
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
  agent_id: number;
  agent?: IAgent;
  knowledge_chunks?: IKnowledgeChunk[];
}

export interface IBlackList {
  id: number;
  created_at: Date;
  updated_at?: Date | null;
  type: string;
  contact: string;
  agent_id: number;
  agent?: IAgent;
}

export interface IWhiteList {
  id: number;
  created_at: Date;
  updated_at?: Date | null;
  type: string;
  contact: string;
  agent_id: number;
  agent?: IAgent;
}

export interface IKnowledgeChunk {
  id: number;
  source_file?: string | null;
  chunk_index?: number | null;
  content?: string | null;
  agent_id?: number | null;
  file_id?: number | null;
  embedding?: unknown | null; // Vector não suportado
  agent?: IAgent | null;
  file?: IFile | null;
}

// ===================== CREATE INPUTS =====================

export interface IUserCreateInput {
  email: string;
  name: string;
  password: string;
  is_first_access?: boolean;
  is_deleted?: boolean;
  is_blocked?: boolean;
  agents?: IAgentCreateInput[];
}

export interface IAgentCreateInput {
  name: string;
  description: string;
  agent_name: string;
  agent_behavior: string;
  image: string;
  business_description: string;
  // user_id: number;
}

export interface IInstanceCreateInput {
  agent_id: number;
  name?: string | null;
  type: string;
}

export interface IFileCreateInput {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
  agent_id: number;
}

export interface IBlackListCreateInput {
  type: string;
  contact: string;
  agent_id: number;
}

export interface IWhiteListCreateInput {
  type: string;
  contact: string;
  agent_id: number;
}

export interface IKnowledgeChunkCreateInput {
  source_file?: string | null;
  chunk_index?: number | null;
  content?: string | null;
  agent_id?: number | null;
  file_id?: number | null;
  embedding?: unknown | null;
}

// ===================== UPDATE INPUTS =====================

export interface IUserUpdateInput {
  email?: string;
  name?: string;
  is_first_access?: boolean;
}

export interface IUserUpdatePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface IAgentUpdateInput {
  name?: string;
  description?: string;
  agent_name?: string;
  agent_behavior?: string;
  is_active?: boolean;
  image?: string;
  business_description?: string;
}

export interface IInstanceUpdateInput {
  integration_id?: string | null;
  name?: string | null;
  type?: string;
  is_connected?: boolean;
  is_disable?: boolean;
}

export interface IFileUpdateInput {
  fieldname?: string;
  originalname?: string;
  encoding?: string;
  mimetype?: string;
  destination?: string;
  filename?: string;
  path?: string;
  size?: number;
}

// export interface IBlackListUpdateInput {
//   type?: string;
//   contact?: string;
//   agent_id?: number;
// }

// export interface IWhiteListUpdateInput {
//   type?: string;
//   contact?: string;
//   agent_id?: number;
// }

export interface IPlan {
  id: number;
  created_at: Date;
  updated_at?: Date | null;
  stripe_id?: string;
  name: string;
  description: string;
  price: number;
  agents_limit: number;
  instances_limit: number;
  dashboard_type: string;
  subscriptions?: ISubscription[];
}

export interface ISubscription {
  id: number;
  created_at: Date;
  updated_at?: Date | null;
  stripe_id: string;
  plan_id: number;
  invoices?: IInvoice[];
  plan: IPlan;
  users: IUser[]; // Assumindo que existe uma interface IUser para o modelo `users`
}

export interface ISubscriptionRequest {
  id: number;
  created_at: Date;
  updated_at?: Date | null;
  stripe_id: string;
  plan_id: number;
  plan: IPlan;
}

export interface IInvoice {
  id: number;
  created_at: Date;
  updated_at?: Date | null;
  stripe_id: string;
  amount: number;
  end: string;
  start: string;
  status: string;
  subscription_id: number;
  subscription: ISubscription;
}