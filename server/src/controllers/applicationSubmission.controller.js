import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { canSubmitApplication } from '../services/submissionValidation.service.js';
import { generateApplicationPDF } from '../services/pdfExport.service.js';
import { sendApplicationConfirmation } from '../services/email.service.js';
import {
  APPLICATION_STATUS,
  AUDIT_ACTIONS,
  RESOURCE_TYPES,
  HTTP_STATUS,
} from '../constants.js';
import { logAction } from '../utils/auditLogger.js';
import mongoose from 'mongoose';

/**
 * Validate all sections before submission (dry-run).
 * Returns a list of errors without actually submitting.
 *
 * @route   POST /api/v1/applications/:id/validate-all
 * @access  Private (Applicant only)
 */
export const validateAllBeforeSubmission = asyncHandler(async (req, res) => {
  const application = req.application; // Loaded by middleware

  const validationResult = await canSubmitApplication(application);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
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
 * Submit the application (point of no return).
 * Runs full validation, locks the application, and fires a confirmation email.
 *
 * @route   POST /api/v1/applications/:id/submit
 * @access  Private (Applicant only)
 */
export const submitApplication = asyncHandler(async (req, res) => {
  const application = req.application; // Loaded by middleware

  // Guard: application must be a draft to be submittable
  if (application.status !== APPLICATION_STATUS.DRAFT) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      `Application cannot be submitted. Current status: ${application.status}`
    );
  }

  // Full validation run before committing the transaction
  const validationResult = await canSubmitApplication(application);

  if (!validationResult.canSubmit) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Application validation failed',
      validationResult.errors
    );
  }

  // Use transaction for atomicity
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Update application - re-verify DRAFT status inside transaction to prevent race conditions
    const updatedApplication = await mongoose.model('Application').findOneAndUpdate(
      { _id: application._id, status: APPLICATION_STATUS.DRAFT },
      {
        $set: {
          status: APPLICATION_STATUS.SUBMITTED,
          submittedAt: new Date(),
          isLocked: true,
          lockedAt: new Date(),
        },
        $push: {
          statusHistory: {
            status: APPLICATION_STATUS.SUBMITTED,
            changedBy: req.user._id,
            changedAt: new Date(),
            remarks: 'Application submitted by applicant',
          },
        },
      },
      { session, new: true }
    );

    if (!updatedApplication) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        'Application submission failed. It might have already been submitted or is no longer a draft.'
      );
    }

    // Use the updated application for audit logging
    const oldStatus = application.status;

    // Audit log - awaited so a failure here aborts the transaction
    await logAction({
      userId: req.user._id,
      action: AUDIT_ACTIONS.APPLICATION_SUBMITTED,
      resourceType: RESOURCE_TYPES.APPLICATION,
      resourceId: updatedApplication._id,
      req,
      changes: {
        before: { status: oldStatus, isLocked: false },
        after: {
          status: APPLICATION_STATUS.SUBMITTED,
          isLocked: true,
        },
      },
    });

    await session.commitTransaction();

    // Send submission confirmation email (fire-and-forget)
    sendApplicationConfirmation(req.user.email, {
      applicationNumber: updatedApplication.applicationNumber,
      jobTitle: updatedApplication.jobSnapshot.title,
    }).catch(() => { });

    res.status(HTTP_STATUS.OK).json(
      new ApiResponse(
        HTTP_STATUS.OK,
        {
          applicationNumber: updatedApplication.applicationNumber,
          submittedAt: updatedApplication.submittedAt,
          status: updatedApplication.status,
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
 * Withdraw a submitted application.
 * Can only be done while the application is in 'submitted' state.
 *
 * @route   POST /api/v1/applications/:id/withdraw
 * @access  Private (Applicant only)
 */
export const withdrawApplication = asyncHandler(async (req, res) => {
  const application = req.application; // Loaded by middleware
  const { reason } = req.body;

  // Guard: can only withdraw if currently submitted
  if (application.status !== APPLICATION_STATUS.SUBMITTED) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
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

    // Audit log - awaited so a failure here aborts the transaction
    await logAction({
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

    res.status(HTTP_STATUS.OK).json(
      new ApiResponse(
        HTTP_STATUS.OK,
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

/**
 * Download the application submission receipt as a PDF.
 * Only available after the application has been submitted.
 *
 * @route   GET /api/v1/applications/:id/receipt
 * @access  Private (Applicant only)
 */
export const downloadReceipt = asyncHandler(async (req, res) => {
  const application = req.application; // Loaded by checkApplicationOwnership middleware

  if (application.status === APPLICATION_STATUS.DRAFT) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Receipt is not available for draft applications'
    );
  }

  // Generate PDF buffer using unified service
  const pdfBuffer = await generateApplicationPDF(application._id, { title: 'Application Acknowledgement' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=receipt-${application.applicationNumber}.pdf`
  );
  res.send(pdfBuffer);
});
