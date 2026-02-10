import { Job } from '../../models/job.model.js';
import { ApiError } from '../../utils/apiError.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { logAction } from '../../utils/auditLogger.js';

export const createJob = asyncHandler(async (req, res) => {
    // 1. Input is already validated by middleware (zod) before reaching here
    const { jobCode } = req.body;

    // 2. Check jobCode uniqueness
    const existingJob = await Job.findOne({ jobCode });
    if (existingJob) {
        throw new ApiError(409, 'Job with this Job Code already exists');
    }

    // 3. Set createdBy and create job
    const jobPayload = {
        ...req.body,
        createdBy: req.user._id,
    };

    const job = await Job.create(jobPayload);

    // 4. Log action
    await logAction({
        userId: req.user._id,
        action: 'JOB_CREATED',
        resourceType: 'Job',
        resourceId: job._id,
        changes: { after: job.toObject() },
        req,
    });

    res.status(201).json(new ApiResponse(201, job, 'Job created successfully'));
});

export const getAllJobs = asyncHandler(async (req, res) => {
    const { category, department, status, page = 1, limit = 10 } = req.query;

    const query = {};
    if (category) query.category = category;
    if (department) query.department = department;
    if (status) query.status = status;

    // Filter by deadline status
    if (req.query.expired === 'true') {
        query.applicationDeadline = { $lt: new Date() };
    } else if (req.query.expired === 'false') {
        query.applicationDeadline = { $gte: new Date() };
    }

    // Add search functionality if needed, e.g., by title or jobCode
    if (req.query.search) {
        query.$or = [
            { title: { $regex: req.query.search, $options: 'i' } },
            { jobCode: { $regex: req.query.search, $options: 'i' } },
        ];
    }

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: { createdAt: -1 },
        populate: { path: 'createdBy', select: 'fullName email' }, // Assuming User model has these
    };

    // Using mongoose-paginate-v2 if available, or manual pagination
    // Since model doesn't show plugin, doing manual pagination
    const skip = (options.page - 1) * options.limit;

    const [jobs, total] = await Promise.all([
        Job.find(query)
            .sort(options.sort)
            .skip(skip)
            .limit(options.limit)
            .populate(options.populate.path, options.populate.select),
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

    res.status(200).json(new ApiResponse(200, responseData, 'Jobs fetched successfully'));
});

export const getJobById = asyncHandler(async (req, res) => {
    const job = await Job.findById(req.params.id).populate('createdBy', 'fullName email');

    if (!job) {
        throw new ApiError(404, 'Job not found');
    }

    res.status(200).json(new ApiResponse(200, job, 'Job fetched successfully'));
});

export const updateJob = asyncHandler(async (req, res) => {
    const job = await Job.findById(req.params.id);

    if (!job) {
        throw new ApiError(404, 'Job not found');
    }

    if (job.status === 'closed') {
        throw new ApiError(400, 'Cannot update a closed job. Re-open it first if needed.');
    }

    const previousState = job.toObject();

    const updatedJob = await Job.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
    );

    await logAction({
        userId: req.user._id,
        action: 'JOB_UPDATED',
        resourceType: 'Job',
        resourceId: job._id,
        changes: {
            before: previousState,
            after: updatedJob.toObject(),
        },
        req,
    });

    res.status(200).json(new ApiResponse(200, updatedJob, 'Job updated successfully'));
});

export const deleteJob = asyncHandler(async (req, res) => {
    // Soft delete check first
    const job = await Job.findById(req.params.id);

    if (!job) {
        throw new ApiError(404, 'Job not found');
    }

    // We are doing soft delete by setting isActive: false
    // Or actually, user requirement says: "Soft delete (set isActive = false)"
    // But wait, user requirement also says "Log action".

    job.isActive = false;
    // Potentially also set status to cancelled? Requirement didn't specify but good practice.
    // Keeping it strictly to requirement: set isActive = false.
    await job.save();

    await logAction({
        userId: req.user._id,
        action: 'JOB_DELETED',
        resourceType: 'Job',
        resourceId: job._id,
        req,
    });

    res.status(200).json(new ApiResponse(200, null, 'Job deleted successfully'));
});

export const publishJob = asyncHandler(async (req, res) => {
    const job = await Job.findById(req.params.id);

    if (!job) {
        throw new ApiError(404, 'Job not found');
    }

    if (job.status === 'published') {
        throw new ApiError(400, 'Job is already published');
    }

    // Validate required fields for publishing if strictly needed beyond schema
    // Schema already enforces most things.
    // We could check if requiredSections is populated etc.

    job.status = 'published';
    job.publishedAt = new Date();
    await job.save();

    await logAction({
        userId: req.user._id,
        action: 'JOB_PUBLISHED',
        resourceType: 'Job',
        resourceId: job._id,
        req,
    });

    res.status(200).json(new ApiResponse(200, job, 'Job published successfully'));
});

export const closeJob = asyncHandler(async (req, res) => {
    const job = await Job.findById(req.params.id);

    if (!job) {
        throw new ApiError(404, 'Job not found');
    }

    if (job.status === 'closed') {
        throw new ApiError(400, 'Job is already closed');
    }

    job.status = 'closed';
    job.closedAt = new Date();
    await job.save();

    await logAction({
        userId: req.user._id,
        action: 'JOB_CLOSED',
        resourceType: 'Job',
        resourceId: job._id,
        req,
    });

    res.status(200).json(new ApiResponse(200, job, 'Job closed successfully'));
});
