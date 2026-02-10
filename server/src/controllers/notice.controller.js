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
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 4;
  const skip = (page - 1) * limit;

  // Build filter query
  const filter = { isActive: true };

  // Add category filter if provided
  if (req.query.category) {
    filter.category = req.query.category;
  }

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
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Notice not found');
  }

  // Check if already archived
  if (!notice.isActive) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Notice is already archived');
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

/**
 * @desc    Update a notice (Admin only)
 * @route   PATCH /api/v1/notices/:id
 * @access  Admin
 */
export const updateNotice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { heading, advtNo, category, externalLink, isActive } = req.body;

  // Find notice
  const notice = await Notice.findById(id);

  if (!notice) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Notice not found');
  }

  // If new PDF uploaded, delete old one from Cloudinary
  if (req.file && notice.cloudinaryId) {
    const { deleteFile } = await import('../services/upload.service.js');
    await deleteFile(notice.cloudinaryId);
  }

  // Update fields (only update provided fields)
  if (heading !== undefined) notice.heading = heading;
  if (advtNo !== undefined) notice.advtNo = advtNo;
  if (category !== undefined) notice.category = category;
  if (externalLink !== undefined) notice.externalLink = externalLink;
  if (isActive !== undefined) notice.isActive = isActive;

  // Update PDF fields if new file uploaded
  if (req.file) {
    notice.pdfUrl = req.file.path;
    notice.cloudinaryId = req.file.filename;
  }

  // Save updated notice
  await notice.save();

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Notice updated successfully',
    data: notice,
  });
});
