import { Application } from '../../models/application.model.js';
import { User } from '../../models/user.model.js';
import { Job } from '../../models/job.model.js';
import { ApiError } from '../../utils/apiError.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { logAction } from '../../utils/auditLogger.js';
import {
  APPLICATION_STATUS,
  PAYMENT_STATUS,
  AUDIT_ACTIONS,
  RESOURCE_TYPES,
  HTTP_STATUS,
  PAGINATION,
  USER_ROLES,
} from '../../constants.js';
import { generateApplicationPDF } from '../../services/pdfExport.service.js';
import { sendApplicationStatusUpdate } from '../../services/email.service.js';

/**
 * @route   GET /api/v1/admin/applications
 * @desc    Get all applications with filtering, searching, sorting & pagination
 * @access  Admin, Reviewer
 */
export const getAllApplications = asyncHandler(async (req, res) => {
  const {
    jobId,
    status,
    search,
    dateFrom,
    dateTo,
    departmentId,
    sortBy = 'submittedAt',
    sortOrder = 'desc',
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
  } = req.query;

  // Build query: Always exclude drafts from admin panel
  const query = {
    status: { $ne: APPLICATION_STATUS.DRAFT },
  };

  // Reviewers only see applications assigned to them
  if (req.user.role === USER_ROLES.REVIEWER) {
    query.assignedReviewers = req.user._id;
  }

  if (status) {
    // If a status is requested, it must not be DRAFT
    if (status === APPLICATION_STATUS.DRAFT) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Draft applications cannot be viewed in the admin panel');
    }
    query.status = status;
  }

  // Filter by department and/or job
  if (departmentId) {
    const jobsInDept = await Job.find({ department: departmentId }).select('_id').lean();
    const jobIds = jobsInDept.map((j) => j._id);
    if (jobIds.length === 0) {
      query.jobId = { $in: [] };
    } else if (jobId) {
      const inDept = jobIds.some((id) => id.toString() === jobId.toString());
      query.jobId = inDept ? jobId : { $in: [] };
    } else {
      query.jobId = { $in: jobIds };
    }
  } else if (jobId) {
    query.jobId = jobId;
  }

  // Date range filter on submittedAt
  if (dateFrom || dateTo) {
    query.submittedAt = {};
    if (dateFrom) query.submittedAt.$gte = new Date(dateFrom);
    if (dateTo) query.submittedAt.$lte = new Date(dateTo);
  }

  // Search by application number, user name, or email
  if (search) {
    const searchRegex = { $regex: search, $options: 'i' };

    // Search users that match
    const matchingUsers = await User.find({
      $or: [
        { email: searchRegex },
        { 'profile.firstName': searchRegex },
        { 'profile.lastName': searchRegex },
      ],
    }).select('_id');

    const userIds = matchingUsers.map((u) => u._id);

    query.$or = [
      { applicationNumber: searchRegex },
      { userId: { $in: userIds } },
    ];
  }

  // Pagination
  const pageNum = parseInt(page, 10);
  const limitNum = Math.min(parseInt(limit, 10), PAGINATION.MAX_LIMIT);
  const skip = (pageNum - 1) * limitNum;

  // Sorting — whitelist allowed fields to prevent arbitrary key injection
  const ALLOWED_SORT_FIELDS = [
    'createdAt', 'submittedAt', 'applicationNumber', 'status', 'paymentStatus',
  ];
  const safeSortBy = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
  const sortOptions = { [safeSortBy]: sortOrder === 'asc' ? 1 : -1 };

  // Execute query
  const [applications, total] = await Promise.all([
    Application.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .populate('userId', 'email profile')
      .populate('jobId', 'title advertisementNo department status')
      .lean(),
    Application.countDocuments(query),
  ]);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        applications,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
          hasNext: pageNum < Math.ceil(total / limitNum),
          hasPrev: pageNum > 1,
        },
      },
      'Applications fetched successfully'
    )
  );
});

/**
 * @route   GET /api/v1/admin/applications/by-number/:applicationNumber
 * @desc    Look up a single application by its human-readable application number
 * @access  Admin, Super Admin
 */
export const getApplicationByNumber = asyncHandler(async (req, res) => {
  const { applicationNumber } = req.params;

  const application = await Application.findOne({
    applicationNumber: { $regex: new RegExp(`^${applicationNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
  })
    .populate('userId', 'email profile')
    .populate('jobId', 'title advertisementNo department status')
    .lean();

  if (!application) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'No application found with this Application ID');
  }

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, application, 'Application fetched successfully')
  );
});

/**
 * @route   GET /api/v1/admin/applications/:id
 * @desc    Get full application details by ID
 * @access  Admin, Reviewer
 */
export const getApplicationById = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id)
    .populate('userId', 'email profile')
    .populate('jobId')
    .populate('reviewedBy', 'email profile')
    .populate('assignedReviewers', 'email profile')
    .populate('statusHistory.changedBy', 'email profile');

  if (!application) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Application not found');
  }

  // Reviewers can only access applications assigned to them
  if (req.user.role === USER_ROLES.REVIEWER) {
    const isAssigned = application.assignedReviewers?.some(
      (r) => r._id.toString() === req.user._id.toString()
    );
    if (!isAssigned) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You are not assigned to review this application');
    }
  }

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
 * @route   PATCH /api/v1/admin/applications/:id/status
 * @desc    Update application status with audit trail
 * @access  Admin only
 */
export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, remarks } = req.body;

  // Validate target status
  if (!Object.values(APPLICATION_STATUS).includes(status)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Invalid status: ${status}`);
  }

  const application = await Application.findById(id);

  if (!application) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Application not found');
  }

  const oldStatus = application.status;

  // Prevent transitioning from terminal states without explicit logic
  if (
    oldStatus === APPLICATION_STATUS.WITHDRAWN &&
    status !== APPLICATION_STATUS.SUBMITTED
  ) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Withdrawn applications cannot be transitioned to this status'
    );
  }

  // Update status
  application.status = status;

  // Add to status history
  application.statusHistory.push({
    status,
    changedBy: req.user._id,
    changedAt: new Date(),
    remarks: remarks || `Status changed from ${oldStatus} to ${status}`,
  });

  await application.save();

  // Audit log
  await logAction({
    userId: req.user._id,
    action: AUDIT_ACTIONS.APPLICATION_STATUS_CHANGED,
    resourceType: RESOURCE_TYPES.APPLICATION,
    resourceId: application._id,
    changes: {
      before: { status: oldStatus },
      after: { status },
      remarks,
    },
    req,
  });

  // Notify applicant (fire-and-forget)
  const populatedApp = await application.populate('userId', 'email');
  sendApplicationStatusUpdate(populatedApp.userId.email, {
    applicationNumber: application.applicationNumber,
    status: application.status,
    remarks: remarks || `Status changed to ${status}`,
  }).catch(() => { });

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        application,
        `Application status updated to ${status}`
      )
    );
});

/**
 * @route   PATCH /api/v1/admin/applications/:id/review
 * @desc    Add review notes to an application
 * @access  Admin, Reviewer
 */
export const addReviewNotes = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const application = await Application.findById(id);

  if (!application) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Application not found');
  }

  if (req.user.role === USER_ROLES.REVIEWER) {
    const isAssigned = application.assignedReviewers?.some(
      (r) => r.toString() === req.user._id.toString()
    );
    if (!isAssigned) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You are not assigned to review this application');
    }
  }

  if (application.status === APPLICATION_STATUS.WITHDRAWN) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Review notes cannot be added to a withdrawn application'
    );
  }

  const { reviewNotes } = req.body || {};

  if (!reviewNotes || !reviewNotes.trim()) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Review notes are required');
  }

  application.reviewNotes = reviewNotes;
  application.reviewedBy = req.user._id;
  application.reviewedAt = new Date();

  await application.save();

  // Audit log
  await logAction({
    userId: req.user._id,
    action: AUDIT_ACTIONS.APPLICATION_REVIEWED,
    resourceType: RESOURCE_TYPES.APPLICATION,
    resourceId: application._id,
    changes: { reviewNotes },
    req,
  });

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        application,
        'Review notes added successfully'
      )
    );
});

/**
 * @route   PATCH /api/v1/admin/applications/bulk-assign
 * @desc    Bulk assign reviewers to applications
 * @access  Admin only
 */
export const bulkAssignReviewers = asyncHandler(async (req, res) => {
  const { applicationIds, reviewerIds } = req.body;

  if (
    !applicationIds ||
    !Array.isArray(applicationIds) ||
    applicationIds.length === 0 ||
    !reviewerIds ||
    !Array.isArray(reviewerIds) ||
    reviewerIds.length === 0
  ) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'applicationIds and reviewerIds must be non-empty arrays'
    );
  }

  const result = await Application.updateMany(
    { _id: { $in: applicationIds } },
    { $addToSet: { assignedReviewers: { $each: reviewerIds } } }
  );

  // Create initial Review documents for each reviewer-application pair
  const { Review } = await import('../../models/review.model.js');
  const bulkOps = [];
  for (const appId of applicationIds) {
    for (const revId of reviewerIds) {
      bulkOps.push({
        updateOne: {
          filter: { applicationId: appId, reviewerId: revId },
          update: {
            $setOnInsert: {
              reviewerId: revId,
              applicationId: appId,
              status: 'PENDING',
            },
          },
          upsert: true,
        },
      });
    }
  }
  if (bulkOps.length > 0) {
    await Review.bulkWrite(bulkOps);
  }

  await logAction({
    userId: req.user._id,
    action: AUDIT_ACTIONS.APPLICATION_ASSIGNED,
    resourceType: RESOURCE_TYPES.APPLICATION,
    resourceId: null,
    changes: { applicationIds, reviewerIds, updatedCount: result.modifiedCount },
    req,
  });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        modifiedCount: result.modifiedCount,
        applicationIds,
        reviewerIds,
      },
      `Reviewers assigned to ${result.modifiedCount} application(s)`
    )
  );
});

/**
 * @route   POST /api/v1/admin/applications/bulk-status
 * @desc    Bulk update status for multiple applications
 * @access  Admin only
 */
export const bulkUpdateStatus = asyncHandler(async (req, res) => {
  const { applicationIds, status, remarks } = req.body;

  if (
    !applicationIds ||
    !Array.isArray(applicationIds) ||
    applicationIds.length === 0
  ) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'applicationIds must be a non-empty array'
    );
  }

  if (!Object.values(APPLICATION_STATUS).includes(status)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Invalid status: ${status}`);
  }

  // Prevent bulk-moving withdrawn applications (consistent with single-update guard)
  if (status !== APPLICATION_STATUS.SUBMITTED) {
    const withdrawnApps = await Application.find({
      _id: { $in: applicationIds },
      status: APPLICATION_STATUS.WITHDRAWN,
    })
      .select('applicationNumber')
      .lean();

    if (withdrawnApps.length > 0) {
      const withdrawnNumbers = withdrawnApps.map((a) => a.applicationNumber);
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        `${withdrawnApps.length} application(s) are withdrawn and cannot be bulk-updated`,
        withdrawnNumbers
      );
    }
  }

  // Update all applications
  const statusHistoryEntry = {
    status,
    changedBy: req.user._id,
    changedAt: new Date(),
    remarks: remarks || `Bulk status update to ${status}`,
  };

  const result = await Application.updateMany(
    { _id: { $in: applicationIds } },
    {
      $set: { status },
      $push: { statusHistory: statusHistoryEntry },
    }
  );

  // Audit log for bulk operation
  await logAction({
    userId: req.user._id,
    action: AUDIT_ACTIONS.APPLICATION_STATUS_CHANGED,
    resourceType: RESOURCE_TYPES.APPLICATION,
    resourceId: null,
    changes: {
      applicationIds,
      newStatus: status,
      remarks,
      updatedCount: result.modifiedCount,
    },
    req,
  });

  // Notify applicants in bulk (fire-and-forget)
  Application.find({ _id: { $in: applicationIds } })
    .populate('userId', 'email')
    .then((apps) => {
      apps.forEach((app) => {
        sendApplicationStatusUpdate(app.userId.email, {
          applicationNumber: app.applicationNumber,
          status: status,
          remarks:
            remarks ||
            `Your application status has been reviewed and updated to ${status}.`,
        }).catch(() => { });
      });
    })
    .catch(() => { });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        modifiedCount: result.modifiedCount,
        requestedCount: applicationIds.length,
      },
      `${result.modifiedCount} application(s) updated to ${status}`
    )
  );
});

/**
 * @route   GET /api/v1/admin/applications/export
 * @desc    Export applications as CSV
 * @access  Admin only
 */
export const exportApplications = asyncHandler(async (req, res) => {
  const { jobId, status, dateFrom, dateTo } = req.query;

  // Build filter: Always exclude drafts from exports
  const query = {
    status: { $ne: APPLICATION_STATUS.DRAFT },
  };
  if (jobId) query.jobId = jobId;
  if (status) {
    if (status !== APPLICATION_STATUS.DRAFT) {
      query.status = status;
    }
  }
  if (dateFrom || dateTo) {
    query.submittedAt = {};
    if (dateFrom) query.submittedAt.$gte = new Date(dateFrom);
    if (dateTo) query.submittedAt.$lte = new Date(dateTo);
  }

  const EXPORT_ROW_LIMIT = 5000;

  const applications = await Application.find(query)
    .populate('userId', 'email profile')
    .populate('jobId', 'title advertisementNo')
    .sort({ createdAt: -1 })
    .limit(EXPORT_ROW_LIMIT + 1)   // fetch one extra to detect truncation
    .lean();

  const truncated = applications.length > EXPORT_ROW_LIMIT;
  if (truncated) applications.pop(); // remove the extra sentinel row

  // Build CSV rows
  const headers = [
    'Application Number',
    'Applicant Email',
    'Applicant Name',
    'Job Title',
    'Advertisement No',
    'Status',
    'Submitted At',
    'Created At',
  ];

  const rows = applications.map((app) => [
    app.applicationNumber,
    app.userId?.email || '',
    `${app.userId?.profile?.firstName || ''} ${app.userId?.profile?.lastName || ''}`.trim(),
    app.jobId?.title || '',
    app.jobId?.advertisementNo || '',
    app.status,
    app.submittedAt ? new Date(app.submittedAt).toISOString() : '',
    new Date(app.createdAt).toISOString(),
  ]);

  // Escape CSV fields — also guard against spreadsheet formula injection
  const escapeCSV = (field) => {
    const str = String(field ?? '');
    // Prefix formula-injection triggers with a single quote so Excel treats them as text
    const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
    if (safe.includes(',') || safe.includes('"') || safe.includes('\n')) {
      return `"${safe.replace(/"/g, '""')}"`;
    }
    return safe;
  };

  const csv = [
    headers.map(escapeCSV).join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="applications_${Date.now()}.csv"`
  );
  if (truncated) {
    res.setHeader('X-Export-Truncated', 'true');
    res.setHeader('X-Export-Row-Limit', String(EXPORT_ROW_LIMIT));
  }
  res.send(csv);
});

/**
 * @route   GET /api/v1/admin/applications/job/:jobId
 * @desc    Get all applications for a specific job
 * @access  Admin, Reviewer
 */
export const getApplicationsByJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const {
    status,
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
  } = req.query;

  // Validate job exists
  const job = await Job.findById(jobId);
  if (!job) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Job not found');
  }

  // Build query
  const query = { jobId };
  if (req.user.role === USER_ROLES.REVIEWER) {
    query.assignedReviewers = req.user._id;
  }
  if (status) query.status = status;

  // Pagination
  const pageNum = parseInt(page, 10);
  const limitNum = Math.min(parseInt(limit, 10), PAGINATION.MAX_LIMIT);
  const skip = (pageNum - 1) * limitNum;

  const [applications, total] = await Promise.all([
    Application.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('userId', 'email profile')
      .lean(),
    Application.countDocuments(query),
  ]);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        job: {
          _id: job._id,
          title: job.title,
          advertisementNo: job.advertisementNo,
        },
        applications,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
          hasNext: pageNum < Math.ceil(total / limitNum),
          hasPrev: pageNum > 1,
        },
      },
      'Applications for job fetched successfully'
    )
  );
});

/**
 * @route   PATCH /api/v1/admin/applications/:id/verify-section
 * @desc    Verify individual section documents
 * @access  Admin, Reviewer
 */
export const verifySectionDocuments = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const application = await Application.findById(id);

  if (!application) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Application not found');
  }

  if (req.user.role === USER_ROLES.REVIEWER) {
    const isAssigned = application.assignedReviewers?.some(
      (r) => r.toString() === req.user._id.toString()
    );
    if (!isAssigned) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You are not assigned to review this application');
    }
  }

  if (application.status === APPLICATION_STATUS.WITHDRAWN) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Sections cannot be verified for a withdrawn application'
    );
  }

  const { sectionType, isVerified, notes } = req.body || {};

  if (!sectionType) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'sectionType is required');
  }

  const section = application.sections.get(sectionType);

  if (!section) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      `Section "${sectionType}" not found in this application`
    );
  }

  // Update verification fields
  section.isVerified = isVerified;
  section.verifiedBy = req.user._id;
  section.verifiedAt = new Date();
  section.verificationNotes = notes || '';

  // Optionally update data (e.g., set allowedPoints in credit system)
  if (req.body.data) {
    section.data = { ...section.data, ...req.body.data };
  }

  application.sections.set(sectionType, section);
  await application.save();

  // Audit log
  await logAction({
    userId: req.user._id,
    action: AUDIT_ACTIONS.SECTION_VERIFIED,
    resourceType: RESOURCE_TYPES.APPLICATION,
    resourceId: application._id,
    changes: {
      sectionType,
      isVerified,
      notes,
    },
    req,
  });

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        application.sections.get(sectionType),
        `Section "${sectionType}" verification updated`
      )
    );
});

/**
 * @route   POST /api/v1/admin/applications/:id/exempt-fee
 * @desc    Exempt application fee for a specific application
 * @access  Admin, Super Admin
 */
export const exemptApplicationFee = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const application = await Application.findById(id);

  if (!application) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Application not found');
  }

  if (application.status === APPLICATION_STATUS.WITHDRAWN) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Fee cannot be exempted for a withdrawn application'
    );
  }

  const { reason } = req.body || {};

  if (!reason || !String(reason).trim()) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Reason for exemption is required (min 5 characters)'
    );
  }

  if (application.paymentStatus === PAYMENT_STATUS.PAID) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Fee is already paid for this application'
    );
  }

  application.paymentStatus = PAYMENT_STATUS.EXEMPTED;
  await application.save();

  // Audit log
  await logAction({
    userId: req.user._id,
    action: AUDIT_ACTIONS.FEE_EXEMPTED,
    resourceType: RESOURCE_TYPES.APPLICATION,
    resourceId: application._id,
    changes: { reason },
    req,
  });

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        { paymentStatus: application.paymentStatus },
        'Application fee has been exempted successfully'
      )
    );
});

/**
 * @route   GET /api/v1/admin/applications/:id/docket
 * @desc    Export a complete application report as PDF for review
 * @access  Admin, Reviewer
 */
export const exportApplicationReport = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const application = await Application.findById(id)
    .populate('userId', 'email profile')
    .populate('reviewedBy', 'email profile');

  if (!application) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Application not found');
  }

  if (req.user.role === USER_ROLES.REVIEWER) {
    const isAssigned = application.assignedReviewers?.some(
      (r) => r.toString() === req.user._id.toString()
    );
    if (!isAssigned) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You are not assigned to review this application');
    }
  }

  // Generate PDF buffer
  const pdfBuffer = await generateApplicationPDF(id, { includeReviews: true, title: 'Application Docket' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=docket-${application.applicationNumber}.pdf`
  );
  res.send(pdfBuffer);
});
