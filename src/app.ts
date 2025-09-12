// src/app.ts
import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";
import { agentsRouter } from "./routes/agents";
import { authRouter } from "./routes/auth";
import { usersRouter } from "./routes/users";
import { webhookController } from "./controllers/webhooks";
import { instancesRouter } from "./routes/instances";
import { filesRouter } from "./routes/files";
import { blackListRouter } from "./routes/black-lists";
import { whiteListRouter } from "./routes/white-lists";
import { dashboardRouter } from "./routes/dashboard";
import prisma from "./prisma";
import { stripeApi } from "./services/stripe-api";
import { subscriptionsRouter } from "./routes/subscriptions";

dotenv.config();

const port = process.env.PORT ?? 4000;

const app = express();

const logFilePath = path.join(__dirname, "api.log");

interface LogData {
  requestId?: string;
  level: "info" | "error";
  method?: string;
  url?: string;
  body?: any;
  headers?: any;
  params?: any;
  query?: any;
  errorMessage?: string;
  stack?: string;
  extra?: any;
}

export function logToFile(logData: LogData) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ...logData,
  };

  const logString = JSON.stringify(logEntry, null, 2) + "\n\n";

  fs.appendFile(logFilePath, logString, (err) => {
    if (err) {
      console.error("Erro ao salvar log:", err);
    }
  });
}

app
  // app.use(cors({
  //   origin: 'http://localhost:4200', // Permite apenas requisições de http://localhost:4200
  //   methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos HTTP permitidos
  //   allowedHeaders: ['Content-Type', 'Authorization'] // Headers permitidos
  // }));
  .use(express.json())
  .use(cors())
  .get("/health", (req: Request, res: Response): any => {
    return res.send({
      status: "Server is running!",
      timestamp: new Date().toISOString(),
    });
  })
  .use((req: any, res, next) => {
    const requestId = uuid();
    req.id = requestId;

    logToFile({
      level: "info",
      requestId,
      method: req.method,
      url: req.url,
      body: req.body,
      headers: req.headers,
      params: req.params,
      query: req.query,
    });

    return next();
  })
  .post("/error", (req: Request, res: Response): any => {
    throw new Error("This is a test error");
  })
  .use("/auth", authRouter)
  .use("/users", usersRouter)
  .use("/agents", agentsRouter)
  .use("/instances", instancesRouter)
  .use("/files", filesRouter)
  .use("/black-list", blackListRouter)
  .use("/white-list", whiteListRouter)
  .use("/dashboard", dashboardRouter)
  .use("/subscriptions", subscriptionsRouter)
  .post("/evolution/webhooks", webhookController.evolutionWebhook)
  .post("/webhooks", webhookController.stripeWebhook)

  .use((error: any, req: any, res: any, next: any) => {
    const requestId = req.id ?? "no-request-id";

    logToFile({
      level: "error",
      requestId,
      method: req.method,
      url: req.originalUrl,
      errorMessage: error.message,
      stack: error.stack,
    });

    res.status(error.status ?? 500).send({
      message:
        requestId +
        " " +
        req.method +
        " -> " +
        req.originalUrl +
        " : " +
        (error.message ?? "Erro ao processar requisição"),
    });
  })

// .listen(port, () =>
//   console.log(
//     `Servidor rodando na porta ${port}. Acesse: http://localhost:${port}`
//   )
// )


  const skipPlansVerification = false;

(async () => {
  if(skipPlansVerification) return;

  const dbPlans = await prisma.plans.findMany();

  if (dbPlans.length === 0) {
    const {
      data: { data: prices },
    } = await stripeApi.get("/plans?expand[]=data.product");

    const products: { [key: string]: any } = {};

    prices.forEach((price: any) => {
      const { product } = price;

      const productId = product.id as string;

      if (!products[productId]) {
        products[productId] = {
          name: product.name,
          description: product.description ?? "N/A",
          dashboard_type: product.metadata?.dashboard_type ?? "full",
          agents_limit: Number(product.metadata?.agents_limit ?? 100),
          instances_limit: Number(product.metadata?.instances_limit ?? 100),
          messages_limit: Number(product.metadata?.messages_limit ?? 100),
          price: price.amount,
          stripe_id: product.id,
        };
      }
    });

    for (const plan of Object.values(products)) {
      const exists = await prisma.plans.findFirst({
        where: {
          stripe_id: plan.stripe_id,
        },
      });

      if (exists) {
        await prisma.plans.update({
          data: plan,
          where: {
            id: exists.id,
          },
        });
      } else {
        await prisma.plans.create({
          data: plan,
        });
      }
    }
  }
})()
.then(() =>
  app.listen(port, () =>
    console.log(
      `Servidor rodando na porta ${port}. Acesse: http://localhost:${port}`
    )
  )
);


// app.listen(port, () =>
//   console.log(
//     `Servidor rodando na porta ${port}. Acesse: http://localhost:${port}`
//   )
// )