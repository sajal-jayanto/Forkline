import pino from "pino";
import pc from "picocolors";
import { env } from "./env.js";

const transportOption = {
  target: "pino-pretty",
  options: {
    colorize: true,
    translateTime: "HH:MM:ss",
    ignore: "pid,hostname",
    singleLine: true,
  },
};

const logger = pino({
  level: env.nodeEnv === "development" ? "debug" : "info",
  transport: env.nodeEnv === "development" ? transportOption : undefined,
});

export { logger };
