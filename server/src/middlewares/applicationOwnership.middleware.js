import { ApiError } from '../utils/apiError.js';
import { Application } from '../models/application.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { USER_ROLES, HTTP_STATUS } from '../constants.js';

/**
 * Middleware to check if user owns the application
 * Attaches application to req.application if ownership is verified
 * Admin, Super Admin, and Reviewer roles can access any application
 */
export const checkApplicationOwnership = asyncHandler(
  async (req, res, next) => {
    const { id } = req.params;

    const application = await Application.findById(id);

    if (!application) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Application not found');
    }

    // Privileged roles can access any application
    const privilegedRoles = [
      USER_ROLES.SUPER_ADMIN,
      USER_ROLES.ADMIN,
      USER_ROLES.REVIEWER,
    ];

    if (
      application.userId.toString() !== req.user._id.toString() &&
      !privilegedRoles.includes(req.user.role)
    ) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        'You can only access your own applications'
      );
    }

    // Attach application to request for use in controller
    req.application = application;
    next();
  }
);

/**
 * Middleware to check if application is editable (not locked, status is draft)
 */
export const checkApplicationEditable = asyncHandler(async (req, res, next) => {
  const application = req.application;

  if (!application) {
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Application not loaded. Use checkApplicationOwnership first.'
    );
  }

  if (application.isLocked) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Application is locked and cannot be edited'
    );
  }

  if (application.status !== 'draft') {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Only draft applications can be edited'
    );
  }

  next();
});
