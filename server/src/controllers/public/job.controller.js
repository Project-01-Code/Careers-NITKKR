import mongoose from 'mongoose';
import { Job } from '../../models/job.model.js';
import { ApiError } from '../../utils/apiError.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  JOB_STATUS,
  HTTP_STATUS,
  JOB_DESIGNATIONS,
  JOB_PAY_LEVELS,
  JOB_RECRUITMENT_TYPES,
  JOB_CATEGORIES,
} from '../../constants.js';

/**
 * @route   GET /api/jobs
 * @desc    Get active jobs (public-facing)
 * @access  Public
 */
export const getActiveJobs = asyncHandler(async (req, res) => {
  const {
    designation,
    payLevel,
    recruitmentType,
    category,
    department,
    search,
    sortBy,
    sortOrder,
    page,
    limit,
  } = req.query;

  // Base query: only published, not deleted, and accepting applications
  const query = {
    status: JOB_STATUS.PUBLISHED,
    deletedAt: null,
    applicationEndDate: { $gt: new Date() },
  };

  // Apply filters
  if (designation) {
    query.designation = { $regex: designation, $options: 'i' };
  }
  if (payLevel) query.payLevel = payLevel;
  if (recruitmentType) query.recruitmentType = recruitmentType;
  if (department) query.department = department;

  // Category filter
  if (category) {
    query.categories = { $in: [category] };
  }

  // Search
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { advertisementNo: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  // Pagination (handled by Zod transforms)
  const skip = (page - 1) * limit;

  // Sorting
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const [jobs, total] = await Promise.all([
    Job.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate('department', 'name code')
      .select('-createdBy -deletedAt -__v')
      .lean(),
    Job.countDocuments(query),
  ]);

  // If user is logged in, attach application status
  let enrichedJobs = jobs;
  if (req.user) {
    const userApplications = await mongoose.model('Application').find({
      userId: req.user._id,
      jobId: { $in: jobs.map(j => j._id) }
    }).select('jobId status').lean();

    const appMap = {};
    userApplications.forEach(app => {
      appMap[app.jobId.toString()] = app;
    });

    enrichedJobs = jobs.map(job => ({
      ...job,
      alreadyApplied: !!appMap[job._id.toString()],
      applicationStatus: appMap[job._id.toString()]?.status || null
    }));
  }

  const responseData = {
    jobs: enrichedJobs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        responseData,
        'Active jobs fetched successfully'
      )
    );
});

/**
 * @route   GET /api/jobs/:id
 * @desc    Get job by ID
 * @access  Public
 */
export const getJobById = asyncHandler(async (req, res) => {
  const job = await Job.findOne({
    _id: req.params.id,
    status: JOB_STATUS.PUBLISHED,
    deletedAt: null,
  })
    .populate('department', 'name code')
    .select('-createdBy -deletedAt -__v')
    .lean();

  if (!job) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Job not found or not active');
  }

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(HTTP_STATUS.OK, job, 'Job details fetched successfully')
    );
});

/**
 * @route   GET /api/jobs/by-advertisement?advertisementNo=...
 * @desc    Get job by advertisement number
 * @access  Public
 */
export const getJobByAdvertisementNo = asyncHandler(async (req, res) => {
  const { advertisementNo } = req.query;

  const job = await Job.findOne({
    advertisementNo: advertisementNo.toUpperCase(),
    status: JOB_STATUS.PUBLISHED,
    deletedAt: null,
  })
    .populate('department', 'name code')
    .select('-createdBy -deletedAt -__v')
    .lean();

  if (!job) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Job not found or not active');
  }

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(HTTP_STATUS.OK, job, 'Job details fetched successfully')
    );
});

/**
 * @route   GET /api/jobs/meta
 * @desc    Get job metadata (designations, pay levels, etc.)
 * @access  Public
 */
export const getJobMeta = asyncHandler(async (req, res) => {
  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        designations: JOB_DESIGNATIONS,
        payLevels: JOB_PAY_LEVELS,
        recruitmentTypes: JOB_RECRUITMENT_TYPES,
        categories: JOB_CATEGORIES,
      },
      'Job metadata fetched successfully'
    )
  );
});
