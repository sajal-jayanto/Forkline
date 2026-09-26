import { EntityManager, Repository } from "typeorm";
import { getDataSource } from "../db/typeorm.js";
import { HttpError } from "../middlewares/error.middleware.js";
import { StatusCodes } from "http-status-codes";
import { OutletMenuItem, OutletMenuItemDto } from "../entities/outlet-menu-item.entity.js";

export class OutletMenuItemRepository {
  private get repo(): Repository<OutletMenuItem> {
    return getDataSource().getRepository(OutletMenuItem);
  }

  private repoFor(txManager?: EntityManager): Repository<OutletMenuItem> {
    return txManager ? txManager.getRepository(OutletMenuItem) : this.repo;
  }

  async createOne(payload : OutletMenuItemDto, txManager?: EntityManager){
    try {
      const repo = this.repoFor(txManager);
      const raw = repo.create(payload);
      return await repo.save(raw);
    } catch (error) {
      throw new HttpError("Failed to create outlet", 
        StatusCodes.EXPECTATION_FAILED, error as Error
      );
    }
  }

  async searchOneBy({ outletId , menuItemId } : { outletId : number , menuItemId : number}, txManager?: EntityManager) {
    try {
      return await this.repoFor(txManager).findOneBy({ outletId, menuItemId });
    } catch (error) {
      throw new HttpError(
        `Failed to search item outlet id ${outletId} and menu item id ${menuItemId}` , 
        StatusCodes.EXPECTATION_FAILED, error as Error
      );
    }
  }

  async searchManyForUpdate({ outletId , menuItemIds } : { outletId : number , menuItemIds : number[] }, txManager: EntityManager) {
    try {
      return await this.repoFor(txManager)
        .createQueryBuilder("omi")
        .innerJoinAndSelect("omi.menuItem", "menuItem")
        .where("omi.outletId = :outletId", { outletId })
        .andWhere("omi.menuItemId IN (:...menuItemIds)", { menuItemIds })
        .orderBy("omi.id", "ASC")
        .setLock("pessimistic_write", undefined, ["omi"])
        .getMany();
    } catch (error) {
      throw new HttpError(
        `Failed to search items for outlet id ${outletId}` , 
        StatusCodes.EXPECTATION_FAILED, error as Error
      );
    }
  }

  async decreaseAvailableUnits(items : { id : number , quantity : number }[], txManager?: EntityManager) {
    try {
      return await this.repoFor(txManager).query(
        `UPDATE outlet_menu_items AS omi
         SET available_unit = omi.available_unit - v.quantity,
             updated_at = now()
         FROM unnest($1::int[], $2::int[]) AS v(id, quantity)
         WHERE omi.id = v.id`,
        [items.map(item => item.id), items.map(item => item.quantity)]
      );
    } catch (error) {
      throw new HttpError(
        `Failed to decrease available units for outlet menu item ids ${items.map(item => item.id).join(", ")}` , 
        StatusCodes.EXPECTATION_FAILED, error as Error
      );
    }
  }
}
