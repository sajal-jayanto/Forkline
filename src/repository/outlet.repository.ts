import { Repository } from "typeorm";
import { getDataSource } from "../db/typeorm.js";
import { HttpError } from "../middlewares/error.middleware.js";
import { StatusCodes } from "http-status-codes";
import { Outlet, OutletDto } from "../entities/outlet.entity.js";

export class OutletRepository {
  private get repo(): Repository<Outlet> {
    return getDataSource().getRepository(Outlet);
  }

  async searchBy({ outletId } : {outletId : number}) {
    try {
      return this.repo.findOneBy({ id: outletId });
    } catch (error) {
      throw new HttpError(`Failed to excuted find outlet By Id` ,  StatusCodes.EXPECTATION_FAILED, error as Error);
    }
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