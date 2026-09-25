import { MenuItemDto } from "../entities/menu-item.entity.js";
import { MenuItemRepository } from "../repository/menuItem.repository.js";
import { v4 as uuIdv4 } from 'uuid';
import { demoUrl } from "../utils.js";

export class MenuItemService {
  private menuItemRepository = new MenuItemRepository();

  async createMenuItem(payload : MenuItemDto) {
    const menuItem: MenuItemDto = {
      name: payload.name,
      slug: uuIdv4(),
      description: payload.description ?? demoDescription,
      imageUrl: payload.imageUrl ?? demoUrl,
      masterPrice: payload.masterPrice,
      isActive: true,
    }
    return this.menuItemRepository.create(menuItem);
  }
}

