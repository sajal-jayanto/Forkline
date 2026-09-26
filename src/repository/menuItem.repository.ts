import { Repository } from "typeorm";
import { MenuItem, MenuItemDto } from "../entities/menu-item.entity.js";
import { getDataSource } from "../db/typeorm.js";
import { HttpError } from "../middlewares/error.middleware.js";
import { StatusCodes } from "http-status-codes";
import { OutletMenuItemDto } from "../entities/outlet-menu-item.entity.js";

export class MenuItemRepository {
  private get repo(): Repository<MenuItem> {
    return getDataSource().getRepository(MenuItem);
  }

  async create(payload: MenuItemDto) {
    try {
      const raw = this.repo.create(payload);
      return this.repo.save(raw);
    } catch (error) {
      throw new HttpError("Failed to create menu item" , StatusCodes.EXPECTATION_FAILED, error as Error);
    }
  }

  async searchItem({outletId , menuItemId} : { outletId : number , menuItemId : number}) {
    try {
      const raw = this.repo.findOneBy({
        outletId: 10,
        menuItemId: 10
      });
      return this.repo.save(raw);
    } catch (error) {
      throw new HttpError("Failed to create menu item" , StatusCodes.EXPECTATION_FAILED, error as Error);
    }
  }

  // async assignOutlet(payload: OutletMenuItemDto){
  //   try {

  //   }
  // }

}