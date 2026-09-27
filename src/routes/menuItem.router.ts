import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware.js";
import { StatusCodes } from "http-status-codes";
import { validateSchema } from "../middlewares/validate.middleware.js";
import {
  assignOutletSchema,
  createMenuItemSchema,
  getMenuItemsQuerySchema,
  type GetMenuItemsQuery,
} from "../schemas/menuItem.schema.js";
import { MenuItemService } from "../service/menuItem.service.js";

export const menuItemRouter = Router();
const menuItemService = new MenuItemService();

menuItemRouter.get(
  "/",
  validateSchema({ query: getMenuItemsQuerySchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as GetMenuItemsQuery;
    const items = await menuItemService.getAllMenuItems(query);
    res.status(StatusCodes.OK).json(items);
  })
);

menuItemRouter.post(
  "/create", 
  validateSchema({ body: createMenuItemSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { body } = req;
    const createdItem = await menuItemService.createMenuItem(body);
    res.status(StatusCodes.CREATED).json(createdItem);
  })
);

menuItemRouter.post(
 "/assign-outlet",
 validateSchema({ body : assignOutletSchema }),
 asyncHandler(async (req: Request, res: Response) => {
   const { body } = req;
   const data = await menuItemService.assignOutlet(body);
   res.status(StatusCodes.OK).json(data);
 })
)
