import { EntityManager, Repository } from "typeorm";
import { getDataSource } from "../db/typeorm.js";
import { HttpError } from "../middlewares/error.middleware.js";
import { StatusCodes } from "http-status-codes";
import { SaleItem, SaleItemDto } from "../entities/sale-item.entity.js";

export class SaleItemRepository {
  private get repo(): Repository<SaleItem> {
    return getDataSource().getRepository(SaleItem);
  }

  private repoFor(manager?: EntityManager): Repository<SaleItem> {
    return manager ? manager.getRepository(SaleItem) : this.repo;
  }

  async createMany(payloads: SaleItemDto[], manager?: EntityManager) {
    try {
      const repo = this.repoFor(manager);
      const raws = repo.create(payloads);
      return await repo.save(raws);
    } catch (error) {
      throw new HttpError("Failed to create sale items", StatusCodes.EXPECTATION_FAILED, error as Error);
    }
  }

  async searchBy({ saleId }: { saleId: number }, manager?: EntityManager) {
    try {
      return await this.repoFor(manager).findBy({ saleId });
    } catch (error) {
      throw new HttpError(`Failed to find sale items by sale id ${saleId}`, StatusCodes.EXPECTATION_FAILED, error as Error);
    }
  }
}
