import { Router } from "express";
import { authenticateToken } from "../middlewares/auth";
import dashboardController from "../controllers/dashboard";

const dashboardRouter = Router();


dashboardRouter
  .use(authenticateToken)
  .get("/:days", dashboardController.get)
  // .get("/:agentId", dashboardController.create)
;

export { dashboardRouter };