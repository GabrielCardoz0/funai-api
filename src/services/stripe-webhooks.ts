import axios from "axios";
import subscriptionsModel from "../models/subscriptions";
import usersModel from "../models/users";
import { v4 as uuid } from "uuid";
import { emailsTemplates, formatToBRL, sendEmail } from "../utils";
import { stripe } from "./stripe-api";
import plansModel from "../models/plans";
import invoicesModel from "../models/invoices";

const getUserByStripeIdOrFail = async (id: string) => {
  const customer = await stripe.customers.retrieve(id);

  if(!customer || customer.deleted) {
    throw new Error(`getUserByStripeIdOrFail: O usuário com stripe ID ${id} não foi encontrado na stripe.`);
  }

  return customer;
};

const getPlanByStripeIdOrFail = async (id: string) => {

  const findPlan = await plansModel.getByStripeId(id);

  if(!findPlan) throw new Error("getPlanByStripeIdOrFail: Não foi encontrado plano no banco com id "+id);

  return findPlan;
}

const customerSubscriptionCreated = async (data: SubscriptionObject) => {
  const { customer, plan, id } = data;

  const user = await getUserByStripeIdOrFail(customer);

  if(!user) {
    throw new Error(`customerSubscriptionCreated: Não foi encontrado usuário com ID ${customer}`);
  }

  const name = user.name!;
  const email = user.email!;


  const findPlan = await getPlanByStripeIdOrFail(plan.product);

  const subscription = await subscriptionsModel.create({
    stripe_id: id,
    agents_limit: findPlan.agents_limit,
    dashboard_type: findPlan.dashboard_type,
    instances_limit: findPlan.instances_limit,
    messages_limit: findPlan.messages_limit,
    plan: {
      connect: {
        id: findPlan!.id,
      },
    },
  });

  const randowPassword = uuid().slice(0, 8);

  await usersModel.createUser({
    email,
    name,
    password: randowPassword,
    stripe_id: user.id,
    subscription: {
      connect: {
        id: subscription.id,
      },
    },
  });

  await sendEmail({
    email,
    subject: "Bem vindo(a) a FUN.AI!",
    html: emailsTemplates.welcome({ name, email, temp_pass: randowPassword })
  });
}

const invoiceCreated = async (data: any) => {
  const { id, period_end, period_start, status, total, customer, amount_due, amount_paid, parent } = data;
  const { subscription_details } = parent;
  const { subscription } = subscription_details;

  await new Promise((resolve) => setTimeout(resolve, 1 * 60 * 1000));

  const subs = await subscriptionsModel.getByStripeId(subscription);
  
  if (!subs) {
    throw new Error(`invoiceCreated: Assinatura não encontrada com stripe_id: ${subscription}`);
  }

  await invoicesModel.create({
    start: String(period_start),
    end: String(period_end),
    amount: total,
    status,
    stripe_id: id,
    plan_name: subs.plan.name,
    subscription: {
      connect: {
        id: subs.id,
      },
    }
  });
}

const invoiceUpdated = async (data: any) => {
  const { id, status, parent, total } = data;
  const { subscription_details } = parent;
  const { subscription } = subscription_details;

  await new Promise((resolve) => setTimeout(resolve, 1 * 60 * 1000));

  const subs = await subscriptionsModel.getByStripeId(subscription);
  
  if (!subs) {
    throw new Error(`invoiceUpdated: Subscription not found with stripe_id: ${subscription}`);
  }

  const invoice = await invoicesModel.getByStripeId(id);

  if(!invoice) throw new Error("invoiceUpdated: Não foi encontrado no banco a invoice com ID "+id);

  await invoicesModel.update(invoice!.id, {
    status,
  });

  await sendEmail({
    email: subs.user[0].email,
    subject: "Recebemos seu pagamento!",
    html: emailsTemplates.invoiceConfirmation({
      amount: formatToBRL(total),
      invoiceId: id,
      name: subs.user[0].name,
      plan_name: subs.plan.name
    })
  });
}

const customerSubscriptionDeleted = async (data: any) => {
  const { id, status, canceled_at } = data;

  const canceledAt = canceled_at as number;

  const sub = await subscriptionsModel.getByStripeId(id);

  if(!sub) return

  await subscriptionsModel.update(sub!.id, {
    status,
    canceled_at: new Date(canceledAt * 1000),
  })

  await sendEmail({
    email: sub.user[0].email,
    subject: "Cancelamento Assinatura FUN.IA",
    html: emailsTemplates.subscriptionCanceled({
      name: sub.user[0].name
    })
  })
}

const invoicePaymentFailed = async (data: any) => {
  const { customer } = data;

  const user = await usersModel.getByStripeId(customer);

  if(!user) throw new Error(`invoicePaymentFailed: O usuário com id ${customer} não foi encontrado no banco de dados.`);

  await sendEmail({
    email: user.email,
    subject: "Ocorreu um erro ao receber o pagamento da sua mensalidade",
    html: emailsTemplates.invoiceFailed({
      name: user.name
    })
  })
}

const subscriptionUpdated = async (data: any) => {
  const { customer, plan } = data;

  const user = await usersModel.getByStripeId(customer);

  if(!user) throw new Error(`subscriptionUpdated: O usuário com id ${customer} não foi encontrado no banco de dados.`);

  if(data.canceled_at && data.cancel_at_period_end) {

  await sendEmail({
    email: user.email,
    subject: "Confirmação Assinatura FUN.AI cancelada",
    html: emailsTemplates.subscriptionCanceledAtEndPeriod({
      name: user.name,
      end_date: data.cancel_at
    })
  });

  return;
}

  const product = await stripe.products.retrieve(plan.product);

  return await sendEmail({
    email: user.email,
    subject: "Assinatura FUN.AI atualizada!",
    html: emailsTemplates.subscriptionUpdated({
      name: user.name,
      plan_name: product.name,
      plan_price: formatToBRL(plan.amount)
    })
  })
}

const customerDeleted = async (data: any) => {
  const { id } = data;
  const user = await usersModel.getByStripeId(id);

  if(!user) throw new Error(`customerDeleted: Usuário ${id} não encontrado no postgres`);

  await subscriptionsModel.delete(user.subscription.id);

  await usersModel.deleteUser(user.id);
}

const distribuition = async (body: StripeWebhookEvent) => {
  const data = body.data.object;

  try {
    switch (body.type) {
      case "customer.subscription.created":
        await customerSubscriptionCreated(data);
        break;
      
      case "customer.subscription.deleted":
        await customerSubscriptionDeleted(data);
        break;
  
      case "invoice.created":
        await invoiceCreated(data);
        break;
  
      case "invoice.paid":
        await invoiceUpdated(data);
        break;

      case "customer.subscription.updated":
        await subscriptionUpdated(data);
        break;

      case "invoice.payment_failed":
        await invoicePaymentFailed(data);
        break;

      case "customer.deleted":
        await customerDeleted(data);
        break;
  
      default:
        console.warn(`Unhandled event: ${body.type} view logs for more details`);
        break
    }
    
  } catch (error: any) {
    console.log(error.message ?? "DEU RUIM AQUI");
  }
}

export const stripeWebhookService = {
  distribuition,
}


interface StripeWebhookEvent {
  id: string;
  object: string;
  api_version: string;
  created: number;
  data: {
    object: SubscriptionObject;
  };
  livemode: boolean;
  pending_webhooks: number;
  request: {
    id: string | null;
    idempotency_key: string;
  };
  type: string;
}

interface SubscriptionObject {
  id: string;
  object: string;
  application: any | null;
  application_fee_percent: number | null;
  automatic_tax: {
    disabled_reason: string | null;
    enabled: boolean;
    liability: string | null;
  };
  billing_cycle_anchor: number;
  billing_cycle_anchor_config: any | null;
  billing_mode: {
    type: string;
  };
  billing_thresholds: any | null;
  cancel_at: number | null;
  cancel_at_period_end: boolean;
  canceled_at: number | null;
  cancellation_details: {
    comment: string | null;
    feedback: string | null;
    reason: string | null;
  };
  collection_method: string;
  created: number;
  currency: string;
  customer: string;
  days_until_due: number | null;
  default_payment_method: string | null;
  default_source: any | null;
  default_tax_rates: any[];
  description: string | null;
  discounts: any[];
  ended_at: number | null;
  invoice_settings: {
    account_tax_ids: any | null;
    issuer: {
      type: string;
    };
  };
  items: {
    object: string;
    data: SubscriptionItem[];
    has_more: boolean;
    total_count: number;
    url: string;
  };
  latest_invoice: string | null;
  livemode: boolean;
  metadata: Record<string, any>;
  next_pending_invoice_item_invoice: any | null;
  on_behalf_of: any | null;
  pause_collection: any | null;
  payment_settings: {
    payment_method_options: {
      acss_debit: any | null;
      bancontact: any | null;
      card: {
        network: string | null;
        request_three_d_secure: string;
      };
      customer_balance: any | null;
      konbini: any | null;
      sepa_debit: any | null;
      us_bank_account: any | null;
    };
    payment_method_types: any | null;
    save_default_payment_method: string;
  };
  pending_invoice_item_interval: any | null;
  pending_setup_intent: any | null;
  pending_update: any | null;
  plan: Plan;
  quantity: number;
  schedule: any | null;
  start_date: number;
  status: string;
  test_clock: any | null;
  transfer_data: any | null;
  trial_end: number | null;
  trial_settings: {
    end_behavior: {
      missing_payment_method: string;
    };
  };
  trial_start: number | null;
}

interface SubscriptionItem {
  id: string;
  object: string;
  billing_thresholds: any | null;
  created: number;
  current_period_end: number;
  current_period_start: number;
  discounts: any[];
  metadata: Record<string, any>;
  plan: Plan;
  price: Price;
  quantity: number;
  subscription: string;
  tax_rates: any[];
}

interface Plan {
  id: string;
  object: string;
  active: boolean;
  amount: number;
  amount_decimal: string;
  billing_scheme: string;
  created: number;
  currency: string;
  interval: string;
  interval_count: number;
  livemode: boolean;
  metadata: Record<string, any>;
  meter: any | null;
  nickname: string | null;
  product: string;
  tiers_mode: any | null;
  transform_usage: any | null;
  trial_period_days: number | null;
  usage_type: string;
}

interface Price {
  id: string;
  object: string;
  active: boolean;
  billing_scheme: string;
  created: number;
  currency: string;
  custom_unit_amount: any | null;
  livemode: boolean;
  lookup_key: any | null;
  metadata: Record<string, any>;
  nickname: string | null;
  product: string;
  recurring: {
    interval: string;
    interval_count: number;
    meter: any | null;
    trial_period_days: number | null;
    usage_type: string;
  };
  tax_behavior: string;
  tiers_mode: any | null;
  transform_quantity: any | null;
  type: string;
  unit_amount: number;
  unit_amount_decimal: string;
}