import { Job } from '../../models/job.model.js';
import { ApiError } from '../../utils/apiError.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { JOB_STATUS, HTTP_STATUS } from '../../constants.js';

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
    sortBy = 'publishDate',
    sortOrder = 'desc',
    page = 1,
    limit = 10,
  } = req.query;

  // Base query: only published, not deleted, and accepting applications
  const query = {
    status: JOB_STATUS.PUBLISHED,
    deletedAt: null,
    applicationEndDate: { $gt: new Date() },
  };

  // Apply filters
  if (designation) query.designation = designation;
  if (payLevel) query.payLevel = payLevel;
  if (recruitmentType) query.recruitmentType = recruitmentType;
  if (department) query.department = department; // Now ObjectId

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

  // Pagination
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  // Sorting
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const [jobs, total] = await Promise.all([
    Job.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .populate('department', 'name code')
      .select('-createdBy -deletedAt -__v'),
    Job.countDocuments(query),
  ]);

  const responseData = {
    jobs,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      hasNext: pageNum < Math.ceil(total / limitNum),
      hasPrev: pageNum > 1,
    },
  };

  res
    .status(200)
    .json(
      new ApiResponse(200, responseData, 'Active jobs fetched successfully')
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
    .select('-createdBy -deletedAt -__v');

  if (!job) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Job not found or not active');
  }

  res
    .status(200)
    .json(new ApiResponse(200, job, 'Job details fetched successfully'));
});

/**
 * @route   GET /api/jobs/by-advertisement?advertisementNo=...
 * @desc    Get job by advertisement number
 * @access  Public
 */
export const getJobByAdvertisementNo = asyncHandler(async (req, res) => {
  const { advertisementNo } = req.query;

  if (!advertisementNo) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Advertisement number is required'
    );
  }

  const job = await Job.findOne({
    advertisementNo: advertisementNo.toUpperCase(),
    status: JOB_STATUS.PUBLISHED,
    deletedAt: null,
  })
    .populate('department', 'name code')
    .select('-createdBy -deletedAt -__v');

  if (!job) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Job not found or not active');
  }

  res
    .status(200)
    .json(new ApiResponse(200, job, 'Job details fetched successfully'));
});
