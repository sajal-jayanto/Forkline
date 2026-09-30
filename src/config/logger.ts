import pino from "pino";
import { env } from "./env.js";

const isDevelopment = ["development"].includes(env.nodeEnv);
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
  level: isDevelopment ? "debug" : "info",
  ...(isDevelopment && { transport: transportOption }),
});

export { logger };
