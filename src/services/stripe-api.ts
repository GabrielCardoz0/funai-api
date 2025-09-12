import axios from "axios";
import dotenv from "dotenv";
import Stripe from "stripe";

dotenv.config();


export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const stripeApi = axios.create({
  baseURL: "https://api.stripe.com/v1",
  headers: {
    "Authorization": `Bearer ${process.env.STRIPE_SECRET_KEY}`,
  },
});