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

/**
 * Require ownership of a resource
 * Admins bypass ownership checks
 *
 * @param {Function} resourceGetter - Function that extracts resource owner ID from request
 * @returns {Function} Express middleware
 *
 * @example
 * // User can only edit their own profile (admins can edit any)
 * router.patch('/profile/:userId',
 *   verifyJWT,
 *   requireOwnership(req => req.params.userId),
 *   updateProfile
 * );
 */
export const requireOwnership = (resourceGetter) => {
  return asyncHandler(async (req, res, next) => {
    // Ensure user is authenticated
    if (!req.user) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
    }

    // Admin override - admins can access any resource
    if (req.user.role === USER_ROLES.ADMIN) {
      return next();
    }

    // Get resource owner ID
    const resourceOwnerId = resourceGetter(req);

    // Check ownership
    if (req.user._id.toString() !== resourceOwnerId.toString()) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        'Access denied. You do not have permission to access this resource.'
      );
    }

    next();
  });
};
