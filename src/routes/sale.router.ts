import { Router , type Request, type Response } from "express";
import { validateSchema } from "../middlewares/validate.middleware.js";
import { asyncHandler } from "../middlewares/asyncHandler.middleware.js";
import { StatusCodes } from "http-status-codes";
import { SealService } from "../service/sale.service.js";
import { createNewSaleSchema } from "../schemas/seal.schema.js";

export const sealRouter = Router();
const saleService = new SealService();

sealRouter.post(
  "/new",
  validateSchema({ body: createNewSaleSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { body } = req;
    const data = await saleService.createNewSale(body);
    res.status(StatusCodes.CREATED).json(data);
  })
)