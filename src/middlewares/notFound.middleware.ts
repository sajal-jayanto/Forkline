import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

const notFoundHandler = (req: Request, res: Response) => {
  res.status(StatusCodes.NOT_FOUND).json({
    error: `Route ${req.method} ${req.originalUrl} not found`,
  });
};

export { notFoundHandler };
