import { getDataSource } from "../db/typeorm.js";

export class HealthService {
  async checkHealth() {
    const isDbConnected = await this.checkDatabase();
    return {
      status: isDbConnected ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: isDbConnected ? 'up' : 'down',
      },
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await getDataSource().query("SELECT 1");
      return true;
    } catch {
      return false;
    }
  }
}