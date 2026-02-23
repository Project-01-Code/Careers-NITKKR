import { Application } from '../../models/application.model.js';
import { User } from '../../models/user.model.js';
import { Job } from '../../models/job.model.js';
import { ApiError } from '../../utils/apiError.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { logAction } from '../../utils/auditLogger.js';
import {
    APPLICATION_STATUS,
    AUDIT_ACTIONS,
    RESOURCE_TYPES,
    HTTP_STATUS,
    PAGINATION,
} from '../../constants.js';

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
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = PAGINATION.DEFAULT_PAGE,
        limit = PAGINATION.DEFAULT_LIMIT,
    } = req.query;

    // Build query
    const query = {};

    if (jobId) query.jobId = jobId;
    if (status) query.status = status;

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

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const [applications, total] = await Promise.all([
        Application.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(limitNum)
            .populate('userId', 'email profile')
            .populate('jobId', 'title advertisementNo department status'),
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
 * @route   GET /api/v1/admin/applications/:id
 * @desc    Get full application details by ID
 * @access  Admin, Reviewer
 */
export const getApplicationById = asyncHandler(async (req, res) => {
    const application = await Application.findById(req.params.id)
        .populate('userId', 'email profile')
        .populate('jobId')
        .populate('reviewedBy', 'email profile')
        .populate('statusHistory.changedBy', 'email profile');

    if (!application) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Application not found');
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
    const { reviewNotes } = req.body;

    if (!reviewNotes || !reviewNotes.trim()) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Review notes are required');
    }

    const application = await Application.findById(id);

    if (!application) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Application not found');
    }

    application.reviewNotes = reviewNotes;
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();

    await application.save();

    // Audit log
    await logAction({
        userId: req.user._id,
        action: 'APPLICATION_REVIEWED',
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
 * @route   POST /api/v1/admin/applications/bulk-status
 * @desc    Bulk update status for multiple applications
 * @access  Admin only
 */
export const bulkUpdateStatus = asyncHandler(async (req, res) => {
    const { applicationIds, status, remarks } = req.body;

    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            'applicationIds must be a non-empty array'
        );
    }

    if (!Object.values(APPLICATION_STATUS).includes(status)) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Invalid status: ${status}`);
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

    // Build filter
    const query = {};
    if (jobId) query.jobId = jobId;
    if (status) query.status = status;
    if (dateFrom || dateTo) {
        query.submittedAt = {};
        if (dateFrom) query.submittedAt.$gte = new Date(dateFrom);
        if (dateTo) query.submittedAt.$lte = new Date(dateTo);
    }

    const applications = await Application.find(query)
        .populate('userId', 'email profile')
        .populate('jobId', 'title advertisementNo')
        .sort({ createdAt: -1 })
        .lean();

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

    // Escape CSV fields
    const escapeCSV = (field) => {
        const str = String(field);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const csv = [
        headers.map(escapeCSV).join(','),
        ...rows.map((row) => row.map(escapeCSV).join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
        'Content-Disposition',
        `attachment; filename=applications_${Date.now()}.csv`
    );
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
            .populate('userId', 'email profile'),
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
    const { sectionType, isVerified, notes } = req.body;

    if (!sectionType) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'sectionType is required');
    }

    const application = await Application.findById(id);

    if (!application) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Application not found');
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

    application.sections.set(sectionType, section);
    await application.save();

    // Audit log
    await logAction({
        userId: req.user._id,
        action: 'SECTION_VERIFIED',
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
