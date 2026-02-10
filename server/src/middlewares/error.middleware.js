import { ApiError } from '../utils/apiError.js';
import { HTTP_STATUS } from '../constants.js';

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    return res
      .status(err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({
        success: false,
        message: err.message || 'Error',
        errors: err.errors || [],
      });
  }

  console.error(err);
  res
    .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    .json({ success: false, message: 'Internal server error' });
};

export default errorHandler;
