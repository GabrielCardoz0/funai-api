import { NextFunction, Request, Response } from "express";
import fs from 'fs';
import path from 'path';
import { evolutionWebhookService } from "../services/evolution-webhooks";
import { errorHandler } from "./agents";
import { stripeWebhookService } from "../services/stripe-webhooks";


const evolutionWebhook = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    // save body in file
    //const filePath = path.join(__dirname, '../../webhook.log');
    //fs.appendFileSync(filePath, JSON.stringify(req.body, null, 2) + '\n\n', 'utf8');
    const { event, instance, data } = req.body;

    evolutionWebhookService.webhooks(event, instance, data);

    return res.status(200).send({ message: "OK!" });
  } catch (error: any) {
    return errorHandler(error, req, res);
  }
}

const stripeWebhook = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    stripeWebhookService.distribuition(req.body);

    return res.status(200).send({ message: "OK!" });
  } catch (error: any) {
    return errorHandler(error, req, res);
  }
}


const webhookController = {
  evolutionWebhook,
  stripeWebhook,
};

export { webhookController };
