import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { ApiError } from '../utils/apiError.js';
import { HTTP_STATUS, NODE_ENV } from '../constants.js';

/**
 * Enhanced Error Handler Middleware
 * Intercepts various error types (Mongoose, Zod, JWT) and standardizes them into ApiError
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let error = err;

  // 1. Handle Zod Validation Errors
  if (err instanceof ZodError) {
    if (process.env.NODE_ENV === NODE_ENV.DEVELOPMENT) {
      console.error('[ZodError Debug]:', {
        name: err.name,
        issues: err.issues,
        errors: err.errors,
      });
    }
    const zodIssues = err.errors || err.issues || [];
    const errorMessages = zodIssues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    }));

    error = new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Validation Error',
      errorMessages
    );
  }

  // 2. Handle Mongoose Validation Errors
  else if (err instanceof mongoose.Error.ValidationError) {
    const errorMessages = Object.values(err.errors || {}).map((val) => ({
      field: val.path,
      message: val.message,
    }));

    error = new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Mongoose Validation Error',
      errorMessages
    );
  }

  // 3. Handle Mongoose Cast Errors (Invalid ID)
  else if (err instanceof mongoose.Error.CastError) {
    const message = `Invalid ${err.path}: ${err.value}`;
    error = new ApiError(HTTP_STATUS.BAD_REQUEST, message);
  }

  // 4. Handle Mongoose Duplicate Key Errors
  else if (err.code === 11000) {
    const field = err.keyValue
      ? Object.keys(err.keyValue)[0]
      : 'duplicate field';
    const message = `Duplicate field value entered: ${field}. Please use another value.`;
    error = new ApiError(HTTP_STATUS.CONFLICT, message);
  }

  // 5. Handle JWT Errors
  else if (err.name === 'JsonWebTokenError') {
    error = new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      'Invalid token. Please log in again.'
    );
  } else if (err.name === 'TokenExpiredError') {
    error = new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      'Token expired. Please log in again.'
    );
  }

  // 6. Handle Multer Errors
  else if (
    err.name === 'MulterError' ||
    Object.prototype.hasOwnProperty.call(err, 'storageErrors')
  ) {
    const message = `File upload error: ${err.message}`;
    error = new ApiError(HTTP_STATUS.BAD_REQUEST, message, [
      { code: err.code, field: err.field },
    ]);
  }

  // 6. Ensure error is an instance of ApiError
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, error.errors || [], error.stack);
  }

  // 7. Send Response
  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors,
    ...(process.env.NODE_ENV === NODE_ENV.DEVELOPMENT && {
      stack: error.stack,
    }),
  };

  // Log error (except for 4xx errors in production)
  if (
    process.env.NODE_ENV === NODE_ENV.DEVELOPMENT ||
    error.statusCode >= 500
  ) {
    console.error(`[${req.method}] ${req.path} - Error:`, error);
  }

  return res.status(error.statusCode).json(response);
};

export default errorHandler;
