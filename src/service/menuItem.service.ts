import { MenuItemDto } from "../entities/menu-item.entity.js";
import { MenuItemRepository } from "../repository/menuItem.repository.js";
import { v4 as uuIdv4 } from 'uuid';
import { demoDescription, demoUrl } from "../utils.js";
import { OutletMenuItemDto } from "../entities/outlet-menu-item.entity.js";
import { HttpError } from "../middlewares/error.middleware.js";

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

  async assignOutlet(payload: OutletMenuItemDto){
    const { outletId , menuItemId } = payload;
    
    const isPresent = await this.menuItemRepository.searchItem({ outletId , menuItemId });
    if(isPresent){
      throw new HttpError("This item is assign to tou this outlet all ready." , )
    }

    const outletMenuItem ={
      outletId: Number(outletId),
      menuItemId: Number(menuItemId),
      priceOverride: payload.priceOverride,
      availableUnit: Number(payload.menuItemId),
    }
    // return this.menuItemRepository.create(outletMenuItem);
  }
}

