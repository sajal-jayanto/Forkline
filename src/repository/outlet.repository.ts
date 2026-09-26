import { Repository } from "typeorm";
import { getDataSource } from "../db/typeorm.js";
import { HttpError } from "../middlewares/error.middleware.js";
import { StatusCodes } from "http-status-codes";
import { Outlet, OutletDto } from "../entities/outlet.entity.js";

export class OutletRepository {
  private get repo(): Repository<Outlet> {
    return getDataSource().getRepository(Outlet);
  }

  async create(payload: OutletDto) {
    try {
      const raw = this.repo.create(payload);
      return this.repo.save(raw);
    } catch (error) {
      throw new HttpError("Failed to create outlet" , StatusCodes.EXPECTATION_FAILED, error as Error);
    }
  }
}