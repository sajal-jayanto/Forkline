import { EntityManager, Repository } from "typeorm";
import { MenuItem, MenuItemDto } from "../entities/menu-item.entity.js";
import { getDataSource } from "../db/typeorm.js";
import { HttpError } from "../middlewares/error.middleware.js";
import { StatusCodes } from "http-status-codes";

export class MenuItemRepository {
  private get repo(): Repository<MenuItem> {
    return getDataSource().getRepository(MenuItem);
  }

  private repoFor(txManager?: EntityManager): Repository<MenuItem> {
    return txManager ? txManager.getRepository(MenuItem) : this.repo;
  }

  async searchBy({ menuItemId } : { menuItemId : number }, txManager?: EntityManager) {
    try {
      return await this.repoFor(txManager).findOneBy({ id: menuItemId });
    } catch (error) {
      throw new HttpError(`Failed to excuted find outlet By Id` ,  StatusCodes.EXPECTATION_FAILED, error as Error);
    }
  }

  async create(payload: MenuItemDto, txManager?: EntityManager) {
    try {
      const repo = this.repoFor(txManager);
      const raw = repo.create(payload);
      return await repo.save(raw);
    } catch (error) {
      throw new HttpError("Failed to create menu item" , StatusCodes.EXPECTATION_FAILED, error as Error);
    }
  }

}