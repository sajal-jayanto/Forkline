import { runner } from "node-pg-migrate";
import { env } from "../config/env.js";

const initMigrations = async (): Promise<void> => {
  await runner({
    databaseUrl: {
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      database: env.db.name,
      ssl: env.db.ssl,
    },
    dir: "migrations",
    direction: "up",
    migrationsTable: "pgmigrations",
    // log: (msg: string) => logger.info(msg),
  });
};

export { initMigrations };
