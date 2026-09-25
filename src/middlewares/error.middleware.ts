import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { env } from "../config/env.js";

export class HttpError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(
    message: string,
    statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR,
    options?: { cause?: unknown; details?: unknown },
  ) {
    super(message, options);
    this.statusCode = statusCode;
    this.details = options?.details;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err instanceof HttpError ? err.statusCode : StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err instanceof HttpError ? err.message : "Internal Server Error";
  const details = err instanceof HttpError ? err.details : undefined;

  if (env.nodeEnv !== "test") {
    req.log.error(err);
  }

  res.status(statusCode).json({
    statusCode: statusCode,
    message: message,
    ...(details !== undefined && { details }),
    // ...(env.nodeEnv === "development" && { stack: err.stack }),
  });
};

export { errorHandler };
