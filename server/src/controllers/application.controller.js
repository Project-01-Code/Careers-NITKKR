import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { Application } from '../models/application.model.js';
import { User } from '../models/user.model.js';
import { createApplication as createApplicationService } from '../services/application.service.js';
import { APPLICATION_STATUS, PAGINATION } from '../constants.js';
import mongoose from 'mongoose';

/**
 * Create a new application
 * POST /api/applications
 * Body: { jobId }
 */
export const createApplication = asyncHandler(async (req, res) => {
    const { jobId } = req.body;

    const application = await createApplicationService(req.user._id, jobId);

    res.status(201).json(
        new ApiResponse(201, application, 'Application created successfully')
    );
});

/**
 * Get all applications for the current user
 * GET /api/applications
 * Query: status, jobId, page, limit
 */
export const getUserApplications = asyncHandler(async (req, res) => {
    const {
        status,
        jobId,
        page = PAGINATION.DEFAULT_PAGE,
        limit = PAGINATION.DEFAULT_LIMIT
    } = req.query;

    const filter = { userId: req.user._id };

    if (status) {
        filter.status = status;
    }

    if (jobId) {
        filter.jobId = jobId;
    }

    const skip = (page - 1) * limit;
    const limitNum = Math.min(parseInt(limit), PAGINATION.MAX_LIMIT);

    const applications = await Application.find(filter)
        .populate('jobId', 'title advertisementNo applicationEndDate status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

    const total = await Application.countDocuments(filter);

    res.json(
        new ApiResponse(200, {
            applications,
            pagination: {
                page: parseInt(page),
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        }, 'Applications fetched successfully')
    );
});

/**
 * Get application by ID
 * GET /api/applications/:id
 */
export const getApplicationById = asyncHandler(async (req, res) => {
    // Application already loaded and ownership verified by middleware
    const application = await Application.findById(req.params.id)
        .populate('jobId')
        .populate('userId', 'email profile');

    res.json(
        new ApiResponse(200, application, 'Application fetched successfully')
    );
});

/**
 * Delete application (only drafts)
 * DELETE /api/applications/:id
 */
export const deleteApplication = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const application = req.application; // Already loaded by middleware

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Remove from user's applicationIds
        await User.findByIdAndUpdate(
            req.user._id,
            { $pull: { applicationIds: application._id } },
            { session }
        );

        await Application.findByIdAndDelete(id).session(session);

        await session.commitTransaction();

        res.json(
            new ApiResponse(200, null, 'Application deleted successfully')
        );

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
});
