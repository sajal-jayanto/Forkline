import { runner } from "node-pg-migrate";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

const initMigrations = async (): Promise<void> => {
  await runner({
    databaseUrl: {
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      database: env.db.name,
    },
    dir: "migrations",
    direction: "up",
    migrationsTable: "pgmigrations",
    log: (msg: string) => logger.info(msg),
  });
};

export { initMigrations };
