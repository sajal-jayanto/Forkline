import { describe, expect, it, jest } from "@jest/globals";
import { OutletService } from "../../src/service/outlet.service.js";
import { OutletRepository } from "../../src/repository/outlet.repository.js";
import { Outlet } from "../../src/entities/outlet.entity.js";
import { demoDescription, demoLocation } from "../../src/utils.js";

const outletService = new OutletService();

describe("OutletService", () => {
  it("get all outlet list", async () => {
    const outlets = [{ id: 1, name: "Outlet One", slug: "outlet-one" }] as Outlet[];
    
    const findAll = jest
      .spyOn(OutletRepository.prototype, "findAll")
      .mockResolvedValue(outlets);

    await expect(outletService.getAllOutlets())
      .resolves.toEqual(outlets);

    expect(findAll).toHaveBeenCalledTimes(1);
  });

  it("create a new outlet" , async () => {
    const createdOutlet = {
      id: 1,
      name: "Dhaka outlet",
      slug: "1235d54d-8965dew-256ddsa5-8965das",
      description: demoDescription,
      location : demoLocation,
      isActive: true,
    } as Outlet;

    const create = jest
      .spyOn(OutletRepository.prototype , "create")
      .mockResolvedValue(createdOutlet);

    await expect(outletService.createOutlet({ name: "Dhaka outlet"}))
      .resolves.toEqual(createdOutlet)
    
    expect(create).toHaveBeenCalledTimes(1);
  })

});
