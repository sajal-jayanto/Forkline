import { Repository } from "typeorm";
import { MenuItem, MenuItemDto } from "../entities/menu-item.entity.js";
import { getDataSource } from "../db/typeorm.js";
import { HttpError } from "../middlewares/error.middleware.js";
import { StatusCodes } from "http-status-codes";

export class MenuItemRepository {
  private get repo(): Repository<MenuItem> {
    return getDataSource().getRepository(MenuItem);
  }

  async create(payload: MenuItemDto): Promise<MenuItem> {
    try {
      const menuItem = this.repo.create(payload);
      return this.repo.save(menuItem);
    } catch (error) {
      throw new HttpError("Failed to create menu item" , StatusCodes.EXPECTATION_FAILED, error as Error);
    }
  }

}