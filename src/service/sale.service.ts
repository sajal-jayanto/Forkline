import { StatusCodes } from "http-status-codes";
import { HttpError } from "../middlewares/error.middleware.js";
import { OutletMenuItemRepository } from "../repository/outletMenuItem.repository.js";
import { SaleRepository } from "../repository/sale.repository.js";
import { SaleItemRepository } from "../repository/saleItem.repository.js";
import { getDataSource } from "../db/typeorm.js";
import { SaleDto } from "../entities/sale.entity.js";
import { SaleItemDto } from "../entities/sale-item.entity.js";
import { OutletMenuItem } from "../entities/outlet-menu-item.entity.js";
import { toAmount, toCents } from "../utils.js";

export interface CreateSaleItemDto {
  menuItemId: number;
  quantity: number;
}

export interface CreateNewSaleDto {
  outletId: number;
  items: CreateSaleItemDto[];
}

export class SealService {
  private outletMenuItemRepository = new OutletMenuItemRepository();
  private saleRepository = new SaleRepository();
  private saleItemRepository = new SaleItemRepository();

  async createNewSale(payload: CreateNewSaleDto) {
    const { outletId , items } = payload;
    
    const quantities = new Map<number, number>();
    for (const item of items) {
      quantities.set(item.menuItemId, (quantities.get(item.menuItemId) ?? 0) + item.quantity);
    }
    const menuItems = [...quantities.keys()];

    return getDataSource().transaction(async txManager => {
      const outletMenuItems = await this.outletMenuItemRepository.searchManyForUpdate({
        outletId,
        menuItemIds: menuItems,
      }, txManager);

      const outletMenuItemMap = new Map<number, OutletMenuItem>(
        outletMenuItems.map(item => [item.menuItemId, item])
      );

      const missing = menuItems.filter(id => !outletMenuItemMap.has(id));
      if (missing.length > 0) {
        throw new HttpError(
          `Menu item(s) ${missing.join(", ")} not available in outlet ${outletId}`,
          StatusCodes.NOT_FOUND
        );
      }

      const unavailable = menuItems.filter(id => {
        const outletMenuItem = outletMenuItemMap.get(id)!;
        return !outletMenuItem.isAvailable || outletMenuItem.availableUnit < quantities.get(id)!;
      });
      if (unavailable.length > 0) {
        throw new HttpError(
          `Not enough quantity for menu item(s) ${unavailable.join(", ")} in outlet ${outletId}`,
          StatusCodes.CONFLICT
        );
      }

      const saleItems: Omit<SaleItemDto, "saleId">[] = menuItems.map(menuItemId => {
        const outletMenuItem = outletMenuItemMap.get(menuItemId)!;
        const quantity = quantities.get(menuItemId)!;
        const unitPriceCents = toCents(outletMenuItem.priceOverride ?? outletMenuItem.menuItem.masterPrice);
        return {
          outletMenuItemId: outletMenuItem.id,
          quantity,
          unitPrice: toAmount(unitPriceCents),
          subtotal: toAmount(unitPriceCents * quantity),
        };
      });

      const totalCents = saleItems.reduce((sum, item) => sum + toCents(item.subtotal), 0);
      const taxCents = 0;
      const lastReceiptNumber = await this.saleRepository.getLastReceiptNumber({ outletId }, txManager);

      const sale: SaleDto = {
        outletId,
        receiptNumber: lastReceiptNumber + 1,
        taxAmount: toAmount(taxCents),
        totalAmount: toAmount(totalCents + taxCents),
      };
      const savedSale = await this.saleRepository.create(sale, txManager);

      const savedSaleItems = await this.saleItemRepository.createMany(
        saleItems.map(item => ({ ...item, saleId: savedSale.id })),
        txManager
      );

      await this.outletMenuItemRepository.decreaseAvailableUnits(
        saleItems.map(item => ({ id: item.outletMenuItemId, quantity: item.quantity })),
        txManager
      );

      return { ...savedSale, saleItems: savedSaleItems };
    });
  }
}
