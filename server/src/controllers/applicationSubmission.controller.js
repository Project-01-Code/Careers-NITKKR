import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { canSubmitApplication } from '../services/submissionValidation.service.js';
import {
  APPLICATION_STATUS,
  AUDIT_ACTIONS,
  RESOURCE_TYPES,
} from '../constants.js';
import { logAction } from '../utils/auditLogger.js';
import mongoose from 'mongoose';

/**
 * Validate all sections before submission
 * POST /api/applications/:id/validate-all
 */
export const validateAllBeforeSubmission = asyncHandler(async (req, res) => {
  const application = req.application; // Loaded by middleware

  const validationResult = await canSubmitApplication(application);

  res.json(
    new ApiResponse(
      200,
      {
        canSubmit: validationResult.canSubmit,
        errors: validationResult.errors,
        totalErrors: validationResult.errors.length,
      },
      validationResult.canSubmit
        ? 'Application is ready for submission'
        : 'Application has validation errors'
    )
  );
});

/**
 * Submit application
 * POST /api/applications/:id/submit
 */
export const submitApplication = asyncHandler(async (req, res) => {
  const application = req.application; // Loaded by middleware

  // Check if already submitted
  if (application.status !== APPLICATION_STATUS.DRAFT) {
    throw new ApiError(
      400,
      `Application cannot be submitted. Current status: ${application.status}`
    );
  }

  // Hard validation
  const validationResult = await canSubmitApplication(application);

  if (!validationResult.canSubmit) {
    throw new ApiError(
      400,
      'Application validation failed',
      validationResult.errors
    );
  }

  // Use transaction for atomicity
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const oldStatus = application.status;

    // Update application
    application.status = APPLICATION_STATUS.SUBMITTED;
    application.submittedAt = new Date();
    application.isLocked = true;
    application.lockedAt = new Date();

    // Add to status history
    application.statusHistory.push({
      status: APPLICATION_STATUS.SUBMITTED,
      changedBy: req.user._id,
      changedAt: new Date(),
      remarks: 'Application submitted by applicant',
    });

    await application.save({ session });

    // Create audit log
    logAction({
      userId: req.user._id,
      action: AUDIT_ACTIONS.APPLICATION_SUBMITTED,
      resourceType: RESOURCE_TYPES.APPLICATION,
      resourceId: application._id,
      req,
      changes: {
        before: { status: oldStatus, isLocked: false },
        after: { status: APPLICATION_STATUS.SUBMITTED, isLocked: true },
      },
    });

    await session.commitTransaction();

    res.json(
      new ApiResponse(
        200,
        {
          applicationNumber: application.applicationNumber,
          submittedAt: application.submittedAt,
          status: application.status,
        },
        'Application submitted successfully'
      )
    );
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

/**
 * Withdraw application
 * POST /api/applications/:id/withdraw
 */
export const withdrawApplication = asyncHandler(async (req, res) => {
  const application = req.application; // Loaded by middleware
  const { reason } = req.body;

  // Can only withdraw submitted applications
  if (application.status !== APPLICATION_STATUS.SUBMITTED) {
    throw new ApiError(
      400,
      `Only submitted applications can be withdrawn. Current status: ${application.status}`
    );
  }

  // Use transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const oldStatus = application.status;

    // Update status
    application.status = APPLICATION_STATUS.WITHDRAWN;

    // Add to status history
    application.statusHistory.push({
      status: APPLICATION_STATUS.WITHDRAWN,
      changedBy: req.user._id,
      changedAt: new Date(),
      remarks: reason || 'Application withdrawn by applicant',
    });

    await application.save({ session });

    // Create audit log
    logAction({
      userId: req.user._id,
      action: AUDIT_ACTIONS.APPLICATION_WITHDRAWN,
      resourceType: RESOURCE_TYPES.APPLICATION,
      resourceId: application._id,
      req,
      changes: {
        before: { status: oldStatus },
        after: { status: APPLICATION_STATUS.WITHDRAWN },
        reason,
      },
    });

    await session.commitTransaction();

    res.json(
      new ApiResponse(
        200,
        {
          applicationNumber: application.applicationNumber,
          status: application.status,
        },
        'Application withdrawn successfully'
      )
    );
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});
