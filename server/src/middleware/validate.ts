import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { ValidationError } from './errorHandler';

interface ValidateSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export const validate = (schemas: ValidateSchemas) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors: Record<string, string[]> = {};

      if (schemas.body) {
        const result = schemas.body.safeParse(req.body);
        if (!result.success) {
          result.error.errors.forEach(err => {
            const path = `body.${err.path.join('.')}`;
            if (!errors[path]) errors[path] = [];
            errors[path].push(err.message);
          });
        } else {
          req.body = result.data;
        }
      }

      if (schemas.query) {
        const result = schemas.query.safeParse(req.query);
        if (!result.success) {
          result.error.errors.forEach(err => {
            const path = `query.${err.path.join('.')}`;
            if (!errors[path]) errors[path] = [];
            errors[path].push(err.message);
          });
        } else {
          req.query = result.data;
        }
      }

      if (schemas.params) {
        const result = schemas.params.safeParse(req.params);
        if (!result.success) {
          result.error.errors.forEach(err => {
            const path = `params.${err.path.join('.')}`;
            if (!errors[path]) errors[path] = [];
            errors[path].push(err.message);
          });
        } else {
          req.params = result.data;
        }
      }

      if (Object.keys(errors).length > 0) {
        throw new ValidationError('Validation failed', errors);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default validate;
