import { Job } from '../../models/job.model.js';
import { ApiError } from '../../utils/apiError.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const getActiveJobs = asyncHandler(async (req, res) => {
    const { category, department, noticeId, page = 1, limit = 10 } = req.query;

    const query = {
        status: 'published',
        isActive: true,
        applicationDeadline: { $gt: new Date() }, // Only future deadlines
    };

    if (category) query.category = category;
    if (department) query.department = department;
    if (noticeId) query.noticeId = noticeId;

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: { createdAt: -1 },
        select: '-createdBy -__v -updatedAt', // Exclude internal fields
    };

    const skip = (options.page - 1) * options.limit;

    const [jobs, total] = await Promise.all([
        Job.find(query)
            .sort(options.sort)
            .skip(skip)
            .limit(options.limit)
            .select(options.select),
        Job.countDocuments(query),
    ]);

    const responseData = {
        jobs,
        pagination: {
            total,
            page: options.page,
            limit: options.limit,
            totalPages: Math.ceil(total / options.limit),
        },
    };

    res.status(200).json(new ApiResponse(200, responseData, 'Active jobs fetched successfully'));
});

export const getJobByCode = asyncHandler(async (req, res) => {
    const { jobCode } = req.params;

    const job = await Job.findOne({
        jobCode,
        status: 'published',
        isActive: true,
    }).select('-createdBy -__v -updatedAt');

    if (!job) {
        throw new ApiError(404, 'Job not found or not active');
    }

    res.status(200).json(new ApiResponse(200, job, 'Job details fetched successfully'));
});

export const getJobCategories = asyncHandler(async (req, res) => {
    const categories = ['Faculty', 'Non-Teaching', 'Research'];
    res.status(200).json(new ApiResponse(200, categories, 'Job categories fetched successfully'));
});

export const getJobsByNotice = asyncHandler(async (req, res) => {
    const { noticeId } = req.params;

    const jobs = await Job.find({
        noticeId,
        status: 'published',
        isActive: true,
        applicationDeadline: { $gt: new Date() },
    }).select('title jobCode category department applicationDeadline');

    res.status(200).json(new ApiResponse(200, jobs, 'Jobs for notice fetched successfully'));
});
