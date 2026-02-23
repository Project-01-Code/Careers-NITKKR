import { ApiError } from '../utils/apiError.js';
import { Application } from '../models/application.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Middleware to check if user owns the application
 * Attaches application to req.application if ownership is verified
 */
export const checkApplicationOwnership = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const application = await Application.findById(id);

    if (!application) {
        throw new ApiError(404, 'Application not found');
    }

    // Check ownership (allow admin to access any application)
    if (
        application.userId.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin'
    ) {
        throw new ApiError(403, 'You can only access your own applications');
    }

    // Attach application to request for use in controller
    req.application = application;
    next();
});

/**
 * Middleware to check if application is editable (not locked, status is draft)
 */
export const checkApplicationEditable = asyncHandler(async (req, res, next) => {
    const application = req.application;

    if (!application) {
        throw new ApiError(500, 'Application not loaded. Use checkApplicationOwnership first.');
    }

    if (application.isLocked) {
        throw new ApiError(400, 'Application is locked and cannot be edited');
    }

    if (application.status !== 'draft') {
        throw new ApiError(400, 'Only draft applications can be edited');
    }

    next();
});
