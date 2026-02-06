import { Notice } from '../models/notice.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { HTTP_STATUS } from '../constants.js';

/**
 * @desc    Create a new notice (Admin only)
 * @route   POST /api/v1/notices
 * @access  Admin
 */
export const createNotice = asyncHandler(async (req, res) => {
  const { heading, advtNo, category, externalLink } = req.body;

  // Extract Cloudinary URL and public ID if file was uploaded (optional)
  const pdfUrl = req.file ? req.file.path : null;
  const cloudinaryId = req.file ? req.file.filename : null;

  // Create notice in database
  const notice = await Notice.create({
    heading,
    advtNo,
    category,
    pdfUrl,
    cloudinaryId,
    externalLink,
  });

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Notice created successfully',
    data: notice,
  });
});

/**
 * @desc    Get all active notices with pagination (Public)
 * @route   GET /api/v1/notices
 * @access  Public
 */
export const getPublicNotices = asyncHandler(async (req, res) => {
  // Parse pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 4;
  const skip = (page - 1) * limit;

  // Query only active notices
  const filter = { isActive: true };

  // Get total count for pagination metadata
  const totalResults = await Notice.countDocuments(filter);
  const totalPages = Math.ceil(totalResults / limit);

  // Fetch notices with pagination, sorted by newest first
  const notices = await Notice.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select('-__v');

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      notices,
      pagination: {
        currentPage: page,
        totalPages,
        totalResults,
        limit,
      },
    },
  });
});

/**
 * @desc    Archive a notice (soft delete) (Admin only)
 * @route   PATCH /api/v1/notices/:id/archive
 * @access  Admin
 */
export const archiveNotice = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find and update notice
  const notice = await Notice.findById(id);

  if (!notice) {
    throw new ApiError(404, 'Notice not found');
  }

  // Check if already archived
  if (!notice.isActive) {
    throw new ApiError(400, 'Notice is already archived');
  }

  // Soft delete by setting isActive to false
  notice.isActive = false;
  await notice.save();

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Notice archived successfully',
    data: notice,
  });
});
