import "reflect-metadata";
import { env } from "./config/env.js";
import createApp from "./app.js";
import { logger } from "./config/logger.js";
import { initDataSource } from "./db/typeorm.js";
import { initMigrations } from "./db/init-migrate.js";

const app = createApp();
const PORT = Number(env.port) || 3000;

const startServer = async () => {
  const dataSource = await initDataSource().catch((err: unknown) => {
    logger.error(err, "❌ Failed to connect to database, aborting startup");
    process.exit(1);
  });

  logger.info("✅ Connected to database successfully.");

  await initMigrations().catch((err: unknown) => {
    logger.error(err, "❌ Failed to run migrations, aborting startup");
    process.exit(1);
  });
  
  logger.info("✅ Migrations up to date.");

  app.listen(PORT, () => {
    logger.info(`✅ Service listening on port ${PORT} [${env.nodeEnv}]`);
  });

  process.on("SIGTERM", async () => {
    await dataSource?.destroy();
    process.exit(0);
  });
};

startServer();