import fs from 'fs/promises';
import { Notice } from '../models/notice.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants.js';
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from '../services/upload.service.js';

/**
 * Helper: upload a PDF buffer to Cloudinary.
 * @param {Buffer} buffer
 * @param {string} originalName
 * @returns {Promise<{pdfUrl: string, cloudinaryId: string}>}
 */
async function uploadPDF(buffer, originalName) {
  const baseName = originalName.replace(/\.pdf$/i, '').slice(0, 60);
  const uploaded = await uploadToCloudinary(buffer, {
    folder: 'nit_kkr_careers/notices',
    publicId: `notice_${Date.now()}_${baseName}`,
    resourceType: 'raw',
    format: 'pdf',
  });
  return { pdfUrl: uploaded.url, cloudinaryId: uploaded.publicId };
}

/**
 * @desc    Create a new notice (Admin only)
 * @route   POST /api/v1/notices
 * @access  Admin
 */
export const createNotice = asyncHandler(async (req, res) => {
  const { heading, advtNo, category, externalLink } = req.body;

  let pdfUrl = null;
  let cloudinaryId = null;

  if (req.file) {
    const result = await uploadPDF(req.file.buffer, req.file.originalname);
    pdfUrl = result.pdfUrl;
    cloudinaryId = result.cloudinaryId;
  }

  const notice = await Notice.create({
    heading,
    advtNo,
    category,
    pdfUrl,
    cloudinaryId,
    externalLink,
  });

  res
    .status(HTTP_STATUS.CREATED)
    .json(
      new ApiResponse(
        HTTP_STATUS.CREATED,
        notice,
        'Notice created successfully'
      )
    );
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

  const filter = { isActive: true };
  if (req.query.category) {
    filter.category = req.query.category;
  }

  const [notices, totalResults] = await Promise.all([
    Notice.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v')
      .lean(),
    Notice.countDocuments(filter),
  ]);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        notices,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalResults / limit),
          totalResults,
          limit,
        },
      },
      'Notices fetched successfully'
    )
  );
});

/**
 * @desc    Archive a notice (soft delete)
 * @route   PATCH /api/v1/notices/:id/archive
 * @access  Admin
 */
export const archiveNotice = asyncHandler(async (req, res) => {
  const notice = await Notice.findById(req.params.id);

  if (!notice) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Notice not found');
  if (!notice.isActive)
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Notice is already archived');

  notice.isActive = false;
  await notice.save();

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(HTTP_STATUS.OK, notice, 'Notice archived successfully')
    );
});

/**
 * @desc    Update a notice (Admin only)
 * @route   PATCH /api/v1/notices/:id
 * @access  Admin
 */
export const updateNotice = asyncHandler(async (req, res) => {
  const { heading, advtNo, category, externalLink, isActive } = req.body;

  const notice = await Notice.findById(req.params.id);
  if (!notice) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Notice not found');

  if (req.file) {
    // Delete old PDF from Cloudinary (non-throwing)
    await deleteFromCloudinary(notice.cloudinaryId, 'raw');

    const result = await uploadPDF(req.file.buffer, req.file.originalname);
    notice.pdfUrl = result.pdfUrl;
    notice.cloudinaryId = result.cloudinaryId;
  }

  if (heading !== undefined) notice.heading = heading;
  if (advtNo !== undefined) notice.advtNo = advtNo;
  if (category !== undefined) notice.category = category;
  if (externalLink !== undefined) notice.externalLink = externalLink;
  if (isActive !== undefined) notice.isActive = isActive;

  await notice.save();

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(HTTP_STATUS.OK, notice, 'Notice updated successfully')
    );
});
