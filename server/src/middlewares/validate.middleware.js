import { ApiError } from '../utils/apiError.js';
import { HTTP_STATUS } from '../constants.js';

/**
 * Validation Middleware
 * Validates request data against a Zod schema
 *
 * @param {ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware function
 */
export const validate = (schema) => {
  return async (req, res, next) => {
    try {
      // Validate request data (body, params, query, cookies)
      const validatedData = await schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query,
        cookies: req.cookies,
      });

      // Replace request data with validated and transformed data
      req.body = validatedData.body || req.body;
      req.params = validatedData.params || req.params;
      req.query = validatedData.query || req.query;

      next();
    } catch (error) {
      // Handle Zod validation errors
      if (error.name === 'ZodError') {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        throw new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          'Validation failed',
          errors
        );
      }

      // Pass other errors to error handler
      next(error);
    }
  };
};
