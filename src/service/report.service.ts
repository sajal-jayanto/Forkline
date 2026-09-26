import { ReportRepository } from "../repository/report.repository.js";
import type { RevenueByOutletQuery, TopItemsByOutletQuery } from "../schemas/report.schema.js";
import { toAmount, toCents } from "../utils.js";

interface TopItem {
  rank: number;
  menuItemId: number;
  menuItemName: string;
  quantitySold: number;
  totalRevenue: string;
}

export class ReportService {
  private reportRepository = new ReportRepository();

  async revenueByOutlet({ from, to }: RevenueByOutletQuery) {
    const rows = await this.reportRepository.revenueByOutlet({ from, to });

    const sales = rows.map(row => ({
      outletId: row.outletId,
      outletName: row.outletName,
      totalSales: Number(row.totalSales),
      totalRevenue: toAmount(toCents(row.totalRevenue)),
    }));
    const totalRevenueCents = rows.reduce((sum, row) => sum + toCents(row.totalRevenue), 0);

    return {
      from: from ?? null,
      to: to ?? null,
      totalRevenue: toAmount(totalRevenueCents),
      sales,
    };
  }

  async topItemsByOutlet({ from, to, limit }: TopItemsByOutletQuery) {

    const rows = await this.reportRepository.topItemsByOutlet({ from, to, limit });
    const outlets = new Map<number, { outletId: number; outletName: string; items: TopItem[] }>();
    
    for (const row of rows) {
      if (!outlets.has(row.outletId)) {
        outlets.set(row.outletId, { outletId: row.outletId, outletName: row.outletName, items: [] });
      }
      if (row.menuItemId === null) continue;
      outlets.get(row.outletId)!.items.push({
        rank: Number(row.rank),
        menuItemId: row.menuItemId,
        menuItemName: row.menuItemName!,
        quantitySold: Number(row.quantitySold),
        totalRevenue: toAmount(toCents(row.totalRevenue!)),
      });
    }

    return {
      from: from ?? null,
      to: to ?? null,
      limit,
      outlets: [...outlets.values()],
    };
  }
}
