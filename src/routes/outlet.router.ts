import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware.js";
import { StatusCodes } from "http-status-codes";
import { validateSchema } from "../middlewares/validate.middleware.js";
import { createOutletSchema } from "../schemas/outlet.schema.js";
import { OutletService } from "../service/outlet.service.js";

export const outletRouter = Router();
const outletService = new OutletService();

outletRouter.post(
  "/create", 
  validateSchema({ body: createOutletSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { body } = req;
    const data = await outletService.createOutlet(body);
    res.status(StatusCodes.CREATED).json(data);
  })
);