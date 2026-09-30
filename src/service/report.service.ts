import { ReportRepository } from "../repository/report.repository.js";
import { OutletRepository } from "../repository/outlet.repository.js";
import { HttpError } from "../middlewares/error.middleware.js";
import { StatusCodes } from "http-status-codes";
import { toAmount, toCents } from "../utils.js";

export class ReportService {
  private reportRepository = new ReportRepository();
  private outletRepository = new OutletRepository();

  async revenueByOutlet() {
    const rows = await this.reportRepository.revenueByOutlet();

    const sales = rows.map((row) => ({
      outletId: row.outletId,
      outletName: row.outletName,
      totalSales: Number(row.totalSales),
      totalRevenue: toAmount(toCents(row.totalRevenue)),
    }));
    const totalRevenueCents = rows.reduce((sum, row) => sum + toCents(row.totalRevenue), 0);

    return {
      totalRevenue: toAmount(totalRevenueCents),
      sales,
    };
  }

  async topItemsByOutlet(outletId: number) {
    const outlet = await this.outletRepository.searchBy({ outletId });

    if (!outlet) {
      throw new HttpError("Outlet not found.", StatusCodes.NOT_FOUND);
    }

    const TOP_ITEMS_LIMIT = 5;
    const rows = await this.reportRepository.topItemsByOutlet({ outletId, limit: TOP_ITEMS_LIMIT });
    return {
      outletId: outlet.id,
      outletName: outlet.name,
      items: rows.map((row) => ({
        menuItemId: row.menuItemId,
        menuItemName: row.menuItemName,
        quantitySold: Number(row.quantitySold),
      })),
    };
  }
}
