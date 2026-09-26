import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware.js";
import { StatusCodes } from "http-status-codes";
import { validateSchema } from "../middlewares/validate.middleware.js";
import {
  revenueByOutletQuerySchema,
  topItemsByOutletQuerySchema,
  type RevenueByOutletQuery,
  type TopItemsByOutletQuery,
} from "../schemas/report.schema.js";
import { ReportService } from "../service/report.service.js";

export const reportRouter = Router();
const reportService = new ReportService();

reportRouter.get(
  "/revenue-by-outlet",
  validateSchema({ query: revenueByOutletQuerySchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const data = await reportService.revenueByOutlet(req.query as RevenueByOutletQuery);
    res.status(StatusCodes.OK).json(data);
  })
);

reportRouter.get(
  "/top-items-by-outlet",
  validateSchema({ query: topItemsByOutletQuerySchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const data = await reportService.topItemsByOutlet(req.query as unknown as TopItemsByOutletQuery);
    res.status(StatusCodes.OK).json(data);
  })
);
