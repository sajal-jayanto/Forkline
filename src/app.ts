import express , { type Request, type Response }  from "express";

import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "./middlewares/error.middleware.js";
import { requestLogger } from "./middlewares/requestLogger.middleware.js";
import { notFoundHandler } from "./middlewares/notFound.middleware.js";
import { asyncHandler } from "./middlewares/asyncHandler.middleware.js";
import { HealthService } from "./service/health.service.js";
import { StatusCodes } from "http-status-codes";
import { menuItemRouter } from "./routes/menuItem.router.js";
import { outletRouter } from "./routes/outlet.router.js";

const app = express();
const healthService = new HealthService();

const createApp = () => {
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  app.get(
    "/health", 
    asyncHandler(async (_req: Request, res: Response) => { 
      const health = await healthService.checkHealth();
      res.status(StatusCodes.OK).json(health);
    })
  );

  app.use("/menu-item" , menuItemRouter);
  app.use("/outlet" , outletRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export default createApp;