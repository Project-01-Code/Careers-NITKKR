import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Middleware to verify if the authenticated user is an admin
 * Must be used AFTER verifyJWT middleware
 */
export const adminAuth = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required');
  }

  if (!req.user.isAdmin) {
    throw new ApiError(403, 'Access denied. Admin privileges required.');
  }

  next();
});
