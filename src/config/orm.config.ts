import "reflect-metadata";
import { DataSource } from "typeorm";
import { initializeTransactionalContext, addTransactionalDataSource } from "typeorm-transactional";
import { env } from "./env.js";

initializeTransactionalContext();

const dataSource = addTransactionalDataSource(
  new DataSource({
    type: "postgres",
    entities: [],
    host: env.db.host,
    port: env.db.port,
    username: env.db.user,
    password: env.db.password,
    database: env.db.name,
    synchronize: false,
    logging: ["development", "test"].includes(env.nodeEnv)
  }),
);

export { dataSource };
