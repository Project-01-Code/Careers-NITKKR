import { ApiError } from '../utils/apiError.js';

export const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Error',
      errors: err.errors || []
    });
  }

  console.error(err);
  res.status(500).json({ success: false, message: 'Internal server error' });
};

export default errorHandler;
