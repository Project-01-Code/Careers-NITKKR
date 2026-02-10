import { ApiError } from '../utils/apiError.js';

/**
 * Middleware to check if the user has one of the required roles.
 * Adapts to use `isAdmin` flag if `role` field is missing, interpreting `isAdmin: true` as 'admin'.
 * 
 * @param {string[]} allowedRoles - Array of allowed roles (e.g., ['admin', 'reviewer'])
 */
export const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new ApiError(401, 'Authentication required');
        }

        // Map legacy isAdmin to 'admin' role context
        const userRole = req.user.role || (req.user.isAdmin ? 'admin' : 'applicant');

        if (!allowedRoles.includes(userRole)) {
            throw new ApiError(403, 'Forbidden: Insufficient permissions');
        }

        next();
    };
};
