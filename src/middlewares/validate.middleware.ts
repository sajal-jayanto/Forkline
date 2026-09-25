import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ZodError, type ZodType } from "zod";
import { HttpError } from "./error.middleware.js";

type ValidationSchemas = {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
};

const formatZodError = (error: ZodError) =>
  error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));

const validateSchema =
  ({ body, params, query }: ValidationSchemas) =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (body) req.body = body.parse(req.body);
      if (params) req.params = params.parse(req.params) as typeof req.params;
      if (query) req.query = query.parse(req.query) as typeof req.query;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = formatZodError(err);
        next(new HttpError("Validation failed", StatusCodes.BAD_REQUEST, { details }));
        return;
      }
      next(err);
    }
  };

export { validateSchema };
