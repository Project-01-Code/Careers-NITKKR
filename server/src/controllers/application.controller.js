import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { Application } from '../models/application.model.js';
import { User } from '../models/user.model.js';
import { Job } from '../models/job.model.js';
import { createApplication as createApplicationService } from '../services/application.service.js';
import { PAGINATION, HTTP_STATUS } from '../constants.js';

/**
 * Create a new application.
 * Captures a snapshot of the job configuration at the time of creation.
 *
 * @route   POST /api/v1/applications
 * @access  Private (Applicant only)
 */
export const createApplication = asyncHandler(async (req, res) => {
  const { jobId } = req.body;

  const application = await createApplicationService(req.user._id, jobId);

  res
    .status(HTTP_STATUS.CREATED)
    .json(
      new ApiResponse(
        HTTP_STATUS.CREATED,
        application,
        'Application created successfully'
      )
    );
});

/**
 * Get all applications for the current user.
 * Supports filtering by status or jobId and includes built-in pagination.
 *
 * @route   GET /api/v1/applications
 * @access  Private (Applicant only)
 */
export const getUserApplications = asyncHandler(async (req, res) => {
  const {
    status,
    jobId,
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
  } = req.query;

  const filter = { userId: req.user._id };

  if (status) {
    filter.status = status;
  }

  // Only show applications for jobs that are NOT soft-deleted
  const activeJobs = await Job.find({ deletedAt: null }).select('_id').lean();
  const activeJobIds = activeJobs.map(j => j._id);

  if (jobId) {
    // If specific jobId requested, it MUST be in the active jobs list
    const isJobActive = activeJobIds.some(id => id.toString() === jobId);
    if (!isJobActive) {
      return res.status(HTTP_STATUS.OK).json(
        new ApiResponse(
          HTTP_STATUS.OK,
          {
            applications: [],
            pagination: { page: parseInt(page, 10), limit: parseInt(limit, 10), total: 0, pages: 0 }
          },
          'No applications found for this job'
        )
      );
    }
    filter.jobId = jobId;
  } else {
    // Filter applications to only those belonging to active jobs
    filter.jobId = { $in: activeJobIds };
  }

  const pageNum = parseInt(page, 10);
  const limitNum = Math.min(parseInt(limit, 10), PAGINATION.MAX_LIMIT);
  const skip = (pageNum - 1) * limitNum;

  const applications = await Application.find(filter)
    .populate('jobId', 'title advertisementNo applicationEndDate status')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .lean();

  const total = await Application.countDocuments(filter);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        applications,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
      'Applications fetched successfully'
    )
  );
});

/**
 * Get full details of a specific application by ID.
 * Ownership is verified by pre-route middleware.
 *
 * @route   GET /api/v1/applications/:id
 * @access  Private (Applicant only)
 */
export const getApplicationById = asyncHandler(async (req, res) => {
  // Application already loaded and ownership verified by checkApplicationOwnership middleware
  const application = req.application;

  await application.populate([
    { path: 'jobId' },
    { path: 'userId', select: 'email profile' },
  ]);

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        application,
        'Application fetched successfully'
      )
    );
});

/**
 * Permanently delete a draft application.
 * Uses a transaction to ensure clean removal from the User's record.
 *
 * @route   DELETE /api/v1/applications/:id
 * @access  Private (Applicant only)
 */
export const deleteApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const application = req.application; // Loaded by ownership middleware

  // Atomically remove application link from user and delete the application document
  await User.findByIdAndUpdate(
    req.user._id,
    { $pull: { applicationIds: application._id } }
  );

  await Application.findByIdAndDelete(id);

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        null,
        'Application deleted successfully'
      )
    );
});
