import { Repository } from "typeorm";
import { getDataSource } from "../db/typeorm.js";
import { HttpError } from "../middlewares/error.middleware.js";
import { StatusCodes } from "http-status-codes";
import { OutletMenuItem, OutletMenuItemDto } from "../entities/outlet-menu-item.entity.js";

export class OutletMenuItemRepository {
  private get repo(): Repository<OutletMenuItem> {
    return getDataSource().getRepository(OutletMenuItem);
  }

  async createOne(payload : OutletMenuItemDto){
    try {
      const raw = this.repo.create(payload);
      return this.repo.save(raw);
    } catch (error) {
      throw new HttpError("Failed to create outlet" , StatusCodes.EXPECTATION_FAILED, error as Error);
    }
  }

  async searchOneBy({ outletId , menuItemId } : { outletId : number , menuItemId : number}) {
    try {
      return this.repo.findOneBy({ outletId, menuItemId });
    } catch (error) {
      throw new HttpError(
        `Failed to search item outlet id ${outletId} and menu item id ${menuItemId}` , 
        StatusCodes.EXPECTATION_FAILED, error as Error
      );
    }
  }
}