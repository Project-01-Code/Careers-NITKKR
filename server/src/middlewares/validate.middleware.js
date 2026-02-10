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
      // Pass error to central error handler
      next(error);
    }
  };
};
