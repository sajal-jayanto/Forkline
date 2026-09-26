import { v4 as uuIdv4 } from 'uuid';
import { demoDescription, demoLocation } from "../utils.js";
import { OutletRepository } from "../repository/outlet.repository.js";
import { OutletDto } from '../entities/outlet.entity.js';

export class OutletService {
  private outletRepository = new OutletRepository();
  
  async createOutlet(payload : OutletDto) {
    const outlet: OutletDto = {
      name: payload.name,
      slug: uuIdv4(),
      description: payload.description ?? demoDescription,
      location : payload.location ?? demoLocation,
      isActive: true,
    }
    return this.outletRepository.create(outlet);
  }
}

