import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware.js";
import { StatusCodes } from "http-status-codes";
import { validateSchema } from "../middlewares/validate.middleware.js";
import { createMenuItemSchema } from "../schemas/menuItem.schema.js";
import { MenuItemService } from "../service/menuItem.service.js";

export const menuItemRouter = Router();
const menuItemService = new MenuItemService();

menuItemRouter.get(
  "/create", 
  validateSchema({ body: createMenuItemSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { body } = req;
    const menuItem = await menuItemService.createMenuItem(body);
    res.status(StatusCodes.CREATED).json(menuItem);
  })
);