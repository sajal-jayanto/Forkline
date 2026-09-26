import { EntityManager, Repository } from "typeorm";
import { getDataSource } from "../db/typeorm.js";
import { HttpError } from "../middlewares/error.middleware.js";
import { StatusCodes } from "http-status-codes";
import { Sale, SaleDto } from "../entities/sale.entity.js";

export class SaleRepository {
  private get repo(): Repository<Sale> {
    return getDataSource().getRepository(Sale);
  }

  private repoFor(txManager?: EntityManager): Repository<Sale> {
    return txManager ? txManager.getRepository(Sale) : this.repo;
  }

  async create(payload: SaleDto, txManager?: EntityManager) {
    try {
      const repo = this.repoFor(txManager);
      const raw = repo.create(payload);
      return await repo.save(raw);
    } catch (error) {
      throw new HttpError("Failed to create sale", StatusCodes.EXPECTATION_FAILED, error as Error);
    }
  }

  async searchBy({ saleId }: { saleId: number }, txManager?: EntityManager) {
    try {
      return await this.repoFor(txManager).findOne({
        where: { id: saleId },
        relations: { saleItems: true },
      });
    } catch (error) {
      throw new HttpError(`Failed to find sale by id ${saleId}`, StatusCodes.EXPECTATION_FAILED, error as Error);
    }
  }

  async getLastReceiptNumber({ outletId }: { outletId: number }, txManager?: EntityManager) {
    try {
      const result = await this.repoFor(txManager)
        .createQueryBuilder("sale")
        .select("MAX(sale.receipt_number)", "max")
        .where("sale.outlet_id = :outletId", { outletId })
        .getRawOne<{ max: number | null }>();
      return result?.max ?? 0;
    } catch (error) {
      throw new HttpError(
        `Failed to get last receipt number for outlet id ${outletId}`,
        StatusCodes.EXPECTATION_FAILED, error as Error
      );
    }
  }
}
