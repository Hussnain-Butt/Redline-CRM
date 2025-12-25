import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from './errorHandler.js';

/**
 * Validates request body, query, or params against a Zod schema
 */
export const validateRequest = (
  schema: ZodSchema,
  property: 'body' | 'query' | 'params' = 'body'
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = schema.parse(req[property]);
      req[property] = data; // Replace with parsed/transformed data
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        next(new AppError(`Validation failed: ${messages}`, 400));
      } else {
        next(error);
      }
    }
  };
};

/**
 * Validates multiple parts of the request
 */
export const validateAll = (schemas: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        next(new AppError(`Validation failed: ${messages}`, 400));
      } else {
        next(error);
      }
    }
  };
};
