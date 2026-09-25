import "reflect-metadata";
import { DataSource } from "typeorm";
import { initializeTransactionalContext, addTransactionalDataSource } from "typeorm-transactional";
import { env } from "./env.js";
import { MenuItem } from "../entities/menu-item.entity.js";
import { OutletMenuItem } from "../entities/outlet-menu-item.entity.js";
import { Outlet } from "../entities/outlet.entity.js";
import { SaleItem } from "../entities/sale-item.entity.js";
import { Sale } from "../entities/sale.entity.js";

initializeTransactionalContext();

const dataSource = addTransactionalDataSource(
  new DataSource({
    type: "postgres",
    entities: [
      MenuItem, 
      OutletMenuItem, 
      Outlet, 
      SaleItem, 
      Sale
    ],
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
