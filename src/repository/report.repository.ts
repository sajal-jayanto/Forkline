import { getDataSource } from "../db/typeorm.js";
import { HttpError } from "../middlewares/error.middleware.js";
import { StatusCodes } from "http-status-codes";
import { Outlet } from "../entities/outlet.entity.js";
import { Sale } from "../entities/sale.entity.js";
import { SaleItem } from "../entities/sale-item.entity.js";
import { OutletMenuItem } from "../entities/outlet-menu-item.entity.js";
import { MenuItem } from "../entities/menu-item.entity.js";

export interface OutletRevenueRow {
  outletId: number;
  outletName: string;
  totalSales: string;
  totalRevenue: string;
}

export interface OutletTopItemRow {
  menuItemId: number;
  menuItemName: string;
  quantitySold: string;
}

export class ReportRepository {
  async revenueByOutlet() {
    try {
      return await getDataSource()
        .createQueryBuilder()
        .from(Outlet, "outlet")
        .leftJoin(Sale, "sale", "sale.outlet_id = outlet.id")
        .select("outlet.id", "outletId")
        .addSelect("outlet.name", "outletName")
        .addSelect("COUNT(sale.id)", "totalSales")
        .addSelect("COALESCE(SUM(sale.total_amount), 0)", "totalRevenue")
        .groupBy("outlet.id")
        .orderBy('"totalRevenue"', "DESC")
        .addOrderBy("outlet.id", "ASC")
        .getRawMany<OutletRevenueRow>();
    } catch (error) {
      throw new HttpError("Failed to get revenue by outlet", 
        StatusCodes.EXPECTATION_FAILED, error as Error
      );
    }
  }

  async topItemsByOutlet({ outletId, limit }: { outletId: number; limit: number }) {
    try {
      return await getDataSource()
        .createQueryBuilder()
        .from(SaleItem, "si")
        .innerJoin(Sale, "sale", "sale.id = si.sale_id")
        .innerJoin(OutletMenuItem, "omi", "omi.id = si.outlet_menu_item_id")
        .innerJoin(MenuItem, "menu_item", "menu_item.id = omi.menu_item_id")
        .select("menu_item.id", "menuItemId")
        .addSelect("menu_item.name", "menuItemName")
        .addSelect("SUM(si.quantity)", "quantitySold")
        .where("sale.outlet_id = :outletId", { outletId })
        .groupBy("menu_item.id")
        .orderBy('"quantitySold"', "DESC")
        .addOrderBy("menu_item.id", "ASC")
        .limit(limit)
        .getRawMany<OutletTopItemRow>();
    } catch (error) {
      throw new HttpError("Failed to get top items by outlet", 
        StatusCodes.EXPECTATION_FAILED, error as Error
      );
    }
  }
}
