import { Repository } from "typeorm";
import { MenuItem, MenuItemDto } from "../entities/menu-item.entity.js";
import { getDataSource } from "../db/typeorm.js";

export class MenuItemRepository {
  private get repo(): Repository<MenuItem> {
    return getDataSource().getRepository(MenuItem);
  }

  async create(payload: MenuItemDto) {
    const menuItem = await this.repo.create(payload);
    return this.repo.save(menuItem);
  }

}