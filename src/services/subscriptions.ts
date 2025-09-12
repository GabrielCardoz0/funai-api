import agentsModel from "../models/agents";
import plansModel from "../models/plans";
import subscriptionsModel from "../models/subscriptions";
import usersModel from "../models/users";
import authService from "./auth";
import { stripe } from "./stripe-api";

const update = async ({ userId, planId }: { userId: number; planId: number }) => {
  const newPlan = await plansModel.getById(planId);
  
  if(!newPlan) throw new Error("Não foi possível encontrar o plano solicitado.");
  
  const subscription = await subscriptionsModel.getByUserId(userId);
  
  if(!subscription) throw new Error("Não foi possível encontrar a assinatura do usuário.");
  
  const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_id);
  
  if(!stripeSubscription) throw new Error("Não foi possível encontrar na stripe a assinatura do usuário.");

  const { data: newProduct } = await stripe.plans.list({
    product: newPlan.stripe_id!
  });
  
  const updatedSubscription = await stripe.subscriptions.update(stripeSubscription.id, {
    items: [{
      id: stripeSubscription.items.data[0].id,
      price: newProduct[0].id,
    }],
    proration_behavior: 'none',
  });

  await subscriptionsModel.update(subscription.id, {
    plan: {
      connect: {
        id: newPlan.id
      }
    }
  });

  return {
    message: "Assinatura atualizada com sucesso"
  }
};

const cancelSubscriptionAtPeriodEnd = async (stripeSubscriptionId: string) => {
  const canceled = await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  // const cancelDate = new Date(canceled.ended_at! * 1000).toLocaleDateString('pt-BR');

  return {
    message: "Assinatura será cancelada ao fim do período vigente.",
    current_period_end: canceled.ended_at,
  };
};

const deleteSub = async ({ userId, password, reason }: { userId: number, password: string, reason: string }) => {
  const user = await usersModel.getUserById(userId);

  if(user?.is_deleted) throw { status: 400, message: "Sua assinatura já foi cancelada." };

  await authService.verifyPasswordOrFail({
    userPassword: user!.password,
    sendedPassword: password,
  });

  await cancelSubscriptionAtPeriodEnd(user!.subscription.stripe_id);

  await usersModel.updateUser(user!.id, {
    is_deleted: true
  });

  return {
    message: `Assinatura cancelada. Você ainda terá acesso até o final do período.`
  }
}

const get = async ({ userId }: { userId: number }) => {
  const subscription = await subscriptionsModel.getByUserId(userId) as any;

  if(!subscription) throw { status: 404, message: "Assinatura não encontrada." };

  return subscription;
}

const getByUserIdOrFail = async (id: number) => {
  const subscription = await subscriptionsModel.getByUserId(id);

  if(!subscription) throw { message: "Assinatura não encontrada!", status: 404 }

  return subscription;
}

const verifyUserAgentsCountOrFail = async (userId: number) => {
  const subscription = await getByUserIdOrFail(userId);

  const count = await agentsModel.getAgentsCountByUserId(userId);
  
  if(count >= subscription.agents_limit) {
    throw { status: 403, message: "Limite de agentes atingido. Exclua um agente para criar outro." };
  }
  
  return count;
}

const verifyUserInstancesCountOrFail = async (userId: number) => {
  const subscription = await getByUserIdOrFail(userId);

  const count = await agentsModel.getAgentsCountByUserId(userId);

  if(count >= subscription.instances_limit) {
    throw { status: 403, message: "Limite de instâncias atingido. Exclua uma instância para continuar." };
  }

  return count;
}


const subscriptionsService = {
  update,
  delete: deleteSub,
  get,
  verifyUserAgentsCountOrFail,
  verifyUserInstancesCountOrFail,
};

export default subscriptionsService;
