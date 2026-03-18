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
import { Job } from '../models/job.model.js';
import { Review } from '../models/review.model.js';
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

  // Update application - re-verify DRAFT status to prevent race conditions
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
    { new: true }
  );

  if (!updatedApplication) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      'Application submission failed. It might have already been submitted or is no longer a draft.'
    );
  }

  // Auto-assign reviewers defined at the Job level IF they exist
  try {
    const job = await Job.findById(updatedApplication.jobId).select('assignedReviewers').lean();
    const reviewerIds = job?.assignedReviewers || [];
    
    if (reviewerIds.length > 0) {
      // Add reviewers to application assignedReviewers array
      await mongoose.model('Application').findByIdAndUpdate(
        updatedApplication._id,
        { $addToSet: { assignedReviewers: { $each: reviewerIds } } }
      );

      // Create initial Review documents
      const reviewBulkOps = reviewerIds.map(revId => ({
        updateOne: {
          filter: { applicationId: updatedApplication._id, reviewerId: revId },
          update: {
            $setOnInsert: {
              reviewerId: revId,
              applicationId: updatedApplication._id,
              status: 'PENDING', // Initial status matches constant
            },
          },
          upsert: true,
        },
      }));
      
      if (reviewBulkOps.length > 0) {
        await Review.bulkWrite(reviewBulkOps);
      }
    }
  } catch (syncError) {
    // We don't fail the whole submission if reviewer sync fails, but log it
    console.error('Failed to auto-assign reviewers on submission:', syncError);
  }

  // Use the updated application for audit logging
  const oldStatus = application.status;

  // Audit log
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
});


/**
 * Export the application summary as a PDF.
 * Available after the application has been submitted.
 *
 * @route   GET /api/v1/applications/:id/docket
 * @access  Private (Applicant only)
 */
export const exportApplicationSummary = asyncHandler(async (req, res) => {
  const application = req.application; // Loaded by checkApplicationOwnership middleware

  if (application.status === APPLICATION_STATUS.DRAFT) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Summary is not available for draft applications'
    );
  }

  // Generate PDF buffer (without reviews — applicants don't see reviewer data)
  const pdfBuffer = await generateApplicationPDF(application._id, {
    title: 'Application Report',
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=summary-${application.applicationNumber}.pdf`
  );
  res.send(pdfBuffer);
});
