export const validate = (schema) => {
  return async (req, res, next) => {
    try {
      const validatedData = await schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query,
        cookies: req.cookies,
      });

      if (validatedData.body !== undefined) {
        req.body = validatedData.body;
      }
      if (validatedData.params !== undefined) {
        req.params = validatedData.params;
      }
      if (validatedData.query !== undefined) {
        // Safe update for req.query to handle getter-only scenarios
        Object.keys(req.query).forEach((key) => delete req.query[key]);
        Object.assign(req.query, validatedData.query);
      }
      if (validatedData.cookies !== undefined) {
        req.cookies = validatedData.cookies;
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};
