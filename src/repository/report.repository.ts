import type { SelectQueryBuilder } from "typeorm";
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
  outletId: number;
  outletName: string;
  rank: string | null;
  menuItemId: number | null;
  menuItemName: string | null;
  quantitySold: string | null;
  totalRevenue: string | null;
}

export class ReportRepository {
  async revenueByOutlet({ from, to }: { from?: string; to?: string }) {
    try {
      let joinCondition = "sale.outlet_id = outlet.id";
      if (from) joinCondition += " AND sale.created_at >= CAST(:from AS date)";
      if (to) joinCondition += " AND sale.created_at < CAST(:to AS date) + 1";

      return await getDataSource()
        .createQueryBuilder()
        .from(Outlet, "outlet")
        .leftJoin(Sale, "sale", joinCondition, { from, to })
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

  async topItemsByOutlet({ from, to, limit }: { from?: string; to?: string; limit: number }) {
    try {
      const rankedItems = (queryBuilder: SelectQueryBuilder<SaleItem>) => {
        queryBuilder
          .from(SaleItem, "si")
          .innerJoin(Sale, "sale", "sale.id = si.sale_id")
          .innerJoin(OutletMenuItem, "omi", "omi.id = si.outlet_menu_item_id")
          .select("sale.outlet_id", "outlet_id")
          .addSelect("omi.menu_item_id", "menu_item_id")
          .addSelect("SUM(si.quantity)", "quantity_sold")
          .addSelect("SUM(si.subtotal)", "total_revenue")
          .addSelect(
            "ROW_NUMBER() OVER (PARTITION BY sale.outlet_id ORDER BY SUM(si.quantity) DESC, SUM(si.subtotal) DESC, omi.menu_item_id ASC)",
            "rank"
          )
          .groupBy("sale.outlet_id")
          .addGroupBy("omi.menu_item_id");
        if (from) queryBuilder.andWhere("sale.created_at >= CAST(:from AS date)", { from });
        if (to) queryBuilder.andWhere("sale.created_at < CAST(:to AS date) + 1", { to });
        return queryBuilder;
      };

      return await getDataSource()
        .createQueryBuilder()
        .from(Outlet, "outlet")
        .leftJoin(rankedItems, "ranked", "ranked.outlet_id = outlet.id AND ranked.rank <= :limit", { limit })
        .leftJoin(MenuItem, "menu_item", "menu_item.id = ranked.menu_item_id")
        .select("outlet.id", "outletId")
        .addSelect("outlet.name", "outletName")
        .addSelect("ranked.rank", "rank")
        .addSelect("ranked.menu_item_id", "menuItemId")
        .addSelect("menu_item.name", "menuItemName")
        .addSelect("ranked.quantity_sold", "quantitySold")
        .addSelect("ranked.total_revenue", "totalRevenue")
        .orderBy("outlet.id", "ASC")
        .addOrderBy("ranked.rank", "ASC")
        .getRawMany<OutletTopItemRow>();
    } catch (error) {
      throw new HttpError("Failed to get top items by outlet", 
        StatusCodes.EXPECTATION_FAILED, error as Error
      );
    }
  }
}
