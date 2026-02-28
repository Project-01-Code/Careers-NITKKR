import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { USER_ROLES, HTTP_STATUS } from '../constants.js';

/**
 * RBAC Middleware - Role-Based Access Control
 * Ensures authenticated users have required roles
 */

/**
 * Require specific role(s) to access a route
 * Must be used AFTER verifyJWT middleware
 *
 * @param {...string} allowedRoles - One or more allowed roles
 * @returns {Function} Express middleware
 *
 * @example
 * router.get('/admin/users', verifyJWT, requireRole('admin'), getAllUsers);
 * router.get('/review', verifyJWT, requireRole('admin', 'reviewer'), getReviews);
 */
export const requireRole = (...allowedRoles) => {
  return asyncHandler(async (req, res, next) => {
    // Ensure user is authenticated
    if (!req.user) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
    }

    // Super-Admin override - they can access any role-protected route
    if (req.user.role === USER_ROLES.SUPER_ADMIN) {
      return next();
    }

    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        `Access denied. Required role(s): ${allowedRoles.join(', ')}`
      );
    }

    next();
  });
};
