import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware.js";
import { StatusCodes } from "http-status-codes";
import { validateSchema } from "../middlewares/validate.middleware.js";
import { topItemsByOutletQuerySchema } from "../schemas/report.schema.js";
import { ReportService } from "../service/report.service.js";

export const reportRouter = Router();
const reportService = new ReportService();

reportRouter.get(
  "/revenue-by-outlet",
  asyncHandler(async (_req: Request, res: Response) => {
    const data = await reportService.revenueByOutlet();
    res.status(StatusCodes.OK).json(data);
  }),
);

reportRouter.get(
  "/top-items-by-outlet",
  validateSchema({ query: topItemsByOutletQuerySchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { outletId } = req.query;
    const data = await reportService.topItemsByOutlet(Number(outletId));
    res.status(StatusCodes.OK).json(data);
  }),
);
