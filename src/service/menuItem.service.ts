import { MenuItemDto } from "../entities/menu-item.entity.js";
import { MenuItemRepository } from "../repository/menuItem.repository.js";
import { v4 as uuIdv4 } from 'uuid';
import { demoDescription, demoUrl } from "../utils.js";
import { OutletMenuItemDto } from "../entities/outlet-menu-item.entity.js";
import { HttpError } from "../middlewares/error.middleware.js";
import { OutletMenuItemRepository } from "../repository/outletMenuItem.repository.js";
import { StatusCodes } from "http-status-codes";
import { OutletRepository } from "../repository/outlet.repository.js";

export class MenuItemService {
  private menuItemRepository = new MenuItemRepository();
  private outletMenuItemRepository = new OutletMenuItemRepository();
  private outletRepository = new OutletRepository();

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
    
    const isOutletPresent = await this.outletRepository.searchBy({ outletId });
    if(!isOutletPresent){ 
      throw new HttpError("Outlet not found." , StatusCodes.NOT_FOUND);
    }

    const ismenuItemPresent = await this.menuItemRepository.searchBy({ menuItemId });
    if(!ismenuItemPresent){ 
      throw new HttpError("menu Item not found." , StatusCodes.NOT_FOUND);
    }

    const isAssignPresent = await this.outletMenuItemRepository.searchOneBy({ outletId , menuItemId });
    if(isAssignPresent){ 
      throw new HttpError("This item is assign to this outlet all ready." , StatusCodes.CONFLICT);
    }

    const outletMenuItem ={
      outletId: Number(outletId),
      menuItemId: Number(menuItemId),
      priceOverride: payload.priceOverride,
      availableUnit: Number(payload.availableUnit),
    }
    return this.outletMenuItemRepository.createOne(outletMenuItem);
  }
}

