import type { DataSource } from "typeorm";
import { dataSource } from "../config/orm.config.js";

const initDataSource = async (): Promise<DataSource> => {
  await dataSource.initialize();
  return dataSource;
};

const getDataSource = () => dataSource;

export { initDataSource, getDataSource };
