import { Job } from '../../models/job.model.js';
import { Department } from '../../models/department.model.js';
import { ApiError } from '../../utils/apiError.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { logAction } from '../../utils/auditLogger.js';
import { JOB_STATUS, HTTP_STATUS } from '../../constants.js';

/**
 * @route   POST /api/admin/jobs
 * @desc    Create a new job posting
 * @access  Admin
 */
export const createJob = asyncHandler(async (req, res) => {
  const { advertisementNo, department } = req.body;

  // Check advertisementNo uniqueness
  const existingJob = await Job.findOne({ advertisementNo });
  if (existingJob) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      'Job with this advertisement number already exists'
    );
  }

  // Validate department exists
  const departmentExists = await Department.findById(department);
  if (!departmentExists) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Department not found');
  }

  if (!departmentExists.isActive) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Cannot create job for inactive department'
    );
  }

  // Create job
  const jobPayload = {
    ...req.body,
    createdBy: req.user._id,
  };

  const job = await Job.create(jobPayload);

  // Populate department before returning
  await job.populate('department', 'name code');

  // Log action
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

/**
 * @route   GET /api/admin/jobs
 * @desc    Get all jobs with comprehensive filtering
 * @access  Admin
 */
export const getAllJobs = asyncHandler(async (req, res) => {
  const {
    status,
    designation,
    payLevel,
    recruitmentType,
    category,
    department,
    isActive,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 10,
  } = req.query;

  // Build query
  const query = { deletedAt: null };

  if (status) query.status = status;
  if (designation) query.designation = designation;
  if (payLevel) query.payLevel = payLevel;
  if (recruitmentType) query.recruitmentType = recruitmentType;
  if (department) query.department = department; // Now ObjectId

  // Category filter
  if (category) {
    query.categories = { $in: [category] };
  }

  // isActive filter (derived: published && now < applicationEndDate)
  if (isActive === 'true' || isActive === true) {
    query.status = JOB_STATUS.PUBLISHED;
    query.applicationEndDate = { $gt: new Date() };
  }

  // Search functionality
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

  // Execute query
  const [jobs, total] = await Promise.all([
    Job.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .populate('department', 'name code')
      .populate('createdBy', 'email profile.firstName profile.lastName'),
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
    .json(new ApiResponse(200, responseData, 'Jobs fetched successfully'));
});

/**
 * @route   GET /api/admin/jobs/:id
 * @desc    Get job by ID
 * @access  Admin
 */
export const getJobById = asyncHandler(async (req, res) => {
  const job = await Job.findOne({
    _id: req.params.id,
    deletedAt: null,
  })
    .populate('department', 'name code')
    .populate('createdBy', 'email profile.firstName profile.lastName');

  if (!job) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Job not found');
  }

  res.status(200).json(new ApiResponse(200, job, 'Job fetched successfully'));
});

/**
 * @route   PATCH /api/admin/jobs/:id
 * @desc    Update job
 * @access  Admin
 */
export const updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findOne({
    _id: req.params.id,
    deletedAt: null,
  });

  if (!job) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Job not found');
  }

  if (job.status === JOB_STATUS.CLOSED) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Cannot update a closed job. Re-open it first if needed.'
    );
  }

  // If department is being updated, validate it exists
  if (req.body.department) {
    const departmentExists = await Department.findById(req.body.department);
    if (!departmentExists) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Department not found');
    }
    if (!departmentExists.isActive) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Cannot assign inactive department'
      );
    }
  }

  const previousState = job.toObject();

  // Update job
  Object.assign(job, req.body);
  await job.save();

  // Populate before returning
  await job.populate('department', 'name code');

  await logAction({
    userId: req.user._id,
    action: 'JOB_UPDATED',
    resourceType: 'Job',
    resourceId: job._id,
    changes: {
      before: previousState,
      after: job.toObject(),
    },
    req,
  });

  res.status(200).json(new ApiResponse(200, job, 'Job updated successfully'));
});

/**
 * @route   DELETE /api/admin/jobs/:id
 * @desc    Soft delete job
 * @access  Admin
 */
export const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findOne({
    _id: req.params.id,
    deletedAt: null,
  });

  if (!job) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Job not found');
  }

  // Soft delete
  job.deletedAt = new Date();
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

/**
 * @route   POST /api/admin/jobs/:id/publish
 * @desc    Publish a job
 * @access  Admin
 */
export const publishJob = asyncHandler(async (req, res) => {
  const job = await Job.findOne({
    _id: req.params.id,
    deletedAt: null,
  });

  if (!job) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Job not found');
  }

  if (job.status === JOB_STATUS.PUBLISHED) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Job is already published');
  }

  // Validate required fields for publishing
  if (!job.requiredSections || job.requiredSections.length === 0) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Cannot publish job without required sections configured'
    );
  }

  job.status = JOB_STATUS.PUBLISHED;
  job.publishDate = new Date();
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

/**
 * @route   POST /api/admin/jobs/:id/close
 * @desc    Close a job early
 * @access  Admin
 */
export const closeJob = asyncHandler(async (req, res) => {
  const job = await Job.findOne({
    _id: req.params.id,
    deletedAt: null,
  });

  if (!job) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Job not found');
  }

  if (job.status === JOB_STATUS.CLOSED) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Job is already closed');
  }

  job.status = JOB_STATUS.CLOSED;
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
