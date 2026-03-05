import fs from 'fs/promises';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import {
  validateSectionData,
  validatePDFUpload,
  validateFinalPDF,
  validateImageUpload,
} from '../services/sectionValidation.service.js';
import {
  calculateAutoCredits,
  calcManualCredits,
} from '../services/creditPoints.service.js';
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from '../services/upload.service.js';
import { HTTP_STATUS } from '../constants.js';

/**
 * Save section data
 * PATCH /api/applications/:id/sections/:sectionType
 * Body: { data }
 */
export const saveSection = asyncHandler(async (req, res) => {
  const { sectionType } = req.params;
  const { data } = req.body;
  const application = req.application;

  // Get section config
  const sectionConfig = application.jobSnapshot.requiredSections.find(
    (s) => s.sectionType === sectionType
  );

  if (!sectionConfig) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      `Section type '${sectionType}' is not required for this job`
    );
  }

  // Validate section data
  const errors = validateSectionData(
    sectionType,
    data,
    application.jobSnapshot.customFields
  );

  if (errors.length > 0) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Validation failed', errors);
  }

  // Get existing section or create new
  const existingSection =
    application.sections.get(sectionType)?.toObject() || {};

  // Update section
  application.sections.set(sectionType, {
    ...existingSection,
    data,
    savedAt: new Date(),
    isComplete: true, // Always true here: errors would have thrown above
  });

  await application.save();

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        application.sections.get(sectionType),
        'Section saved successfully'
      )
    );
});

/**
 * Upload section PDF
 * POST /api/applications/:id/sections/:sectionType/pdf
 * File: pdf (multipart/form-data)
 */
export const uploadSectionPDF = asyncHandler(async (req, res) => {
  const { sectionType } = req.params;
  const file = req.file;

  if (!file) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'PDF file is required');
  }

  const application = req.application;

  // Get section config
  const sectionConfig = application.jobSnapshot.requiredSections.find(
    (s) => s.sectionType === sectionType
  );

  if (!sectionConfig) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      `Section type '${sectionType}' is not required for this job`
    );
  }

  let buffer;
  try {
    buffer = await fs.readFile(file.path);
  } finally {
    await fs.unlink(file.path).catch(() => {});
  }

  const fileWithBuffer = { ...file, buffer };

  // Validate PDF (magic bytes use buffer)
  const pdfErrors = validatePDFUpload(fileWithBuffer, sectionConfig);
  if (pdfErrors.length > 0) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'PDF validation failed',
      pdfErrors
    );
  }

  // Delete old PDF if exists
  const existingSection = application.sections.get(sectionType);
  await deleteFromCloudinary(existingSection?.cloudinaryId, 'raw');

  // Upload to Cloudinary
  const appNo = application.applicationNumber;
  let uploaded;
  try {
    uploaded = await uploadToCloudinary(file.buffer, {
      folder: `nit_kkr_careers/applications/${appNo}/${sectionType}`,
      publicId: `${appNo}_${sectionType}`,
      resourceType: 'raw',
      format: 'pdf',
    });

    // Update section
    const existingSectionData = existingSection?.toObject() || {};
    application.sections.set(sectionType, {
      ...existingSectionData,
      pdfUrl: uploaded.url,
      cloudinaryId: uploaded.publicId,
      savedAt: new Date(),
    });

    await application.save();
  } catch (error) {
    // Rollback: Delete from Cloudinary if DB save fails
    if (uploaded?.publicId) {
      await deleteFromCloudinary(uploaded.publicId, 'raw').catch(() => {});
    }
    throw error;
  }

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        application.sections.get(sectionType),
        'PDF uploaded successfully'
      )
    );
});

/**
 * Delete section PDF
 * DELETE /api/applications/:id/sections/:sectionType/pdf
 */
export const deleteSectionPDF = asyncHandler(async (req, res) => {
  const { sectionType } = req.params;
  const application = req.application;

  const existingSection = application.sections.get(sectionType);

  if (!existingSection?.cloudinaryId) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'No PDF found for this section');
  }

  // Delete from Cloudinary (non-throwing)
  await deleteFromCloudinary(existingSection.cloudinaryId, 'raw');

  // Clear the PDF fields from the section
  const sectionData = existingSection.toObject();
  application.sections.set(sectionType, {
    ...sectionData,
    pdfUrl: undefined,
    cloudinaryId: undefined,
    savedAt: new Date(),
  });

  await application.save();

  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, null, 'PDF deleted successfully'));
});

/**
 * Validate section
 * POST /api/applications/:id/sections/:sectionType/validate
 */
export const validateSection = asyncHandler(async (req, res) => {
  const { sectionType } = req.params;
  const application = req.application;

  // Get section config
  const sectionConfig = application.jobSnapshot.requiredSections.find(
    (s) => s.sectionType === sectionType
  );

  if (!sectionConfig) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      `Section type '${sectionType}' is not required for this job`
    );
  }

  const section = application.sections.get(sectionType);
  const errors = [];

  // Validate data
  if (section?.data) {
    const dataErrors = validateSectionData(
      sectionType,
      section.data,
      application.jobSnapshot.customFields
    );
    errors.push(...dataErrors);
  } else if (sectionConfig.isMandatory) {
    errors.push({ field: 'data', message: 'Section data is required' });
  }

  // Validate PDF
  if (sectionConfig.requiresPDF && !section?.pdfUrl) {
    errors.push({ field: 'pdf', message: 'PDF upload is required' });
  }

  const isValid = errors.length === 0;

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        { isValid, errors },
        isValid ? 'Section is valid' : 'Section has validation errors'
      )
    );
});

/**
 * Photo / Signature Upload
 * POST /api/v1/applications/:id/sections/photo/image
 * POST /api/v1/applications/:id/sections/signature/image
 */
export const uploadPhotoOrSignature = asyncHandler(async (req, res) => {
  const { sectionType } = req.params; // 'photo' | 'signature'
  const application = req.application;
  const file = req.file;

  if (!['photo', 'signature'].includes(sectionType)) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      `Invalid section type '${sectionType}' for image upload`
    );
  }

  let buffer;
  try {
    buffer = await fs.readFile(file.path);
  } finally {
    await fs.unlink(file.path).catch(() => {});
  }

  const fileWithBuffer = { ...file, buffer };

  // Validate image (magic bytes + MIME + size)
  const imageErrors = validateImageUpload(fileWithBuffer, sectionType);
  if (imageErrors.length > 0) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Image validation failed',
      imageErrors
    );
  }

  // Delete previous image from Cloudinary if it exists (non-throwing)
  const existingSection = application.sections.get(sectionType);
  await deleteFromCloudinary(existingSection?.cloudinaryId, 'image');

  // Upload to Cloudinary as image
  const appNo = application.applicationNumber;
  let uploaded;
  try {
    uploaded = await uploadToCloudinary(file.buffer, {
      folder: `nit_kkr_careers/applications/${appNo}/${sectionType}`,
      publicId: `${appNo}_${sectionType}`,
      resourceType: 'image',
      format: 'jpg',
    });

    const existingSectionData = existingSection?.toObject() || {};
    application.sections.set(sectionType, {
      ...existingSectionData,
      imageUrl: uploaded.url,
      cloudinaryId: uploaded.publicId,
      savedAt: new Date(),
      isComplete: true,
    });

    await application.save();
  } catch (error) {
    // Rollback
    if (uploaded?.publicId) {
      await deleteFromCloudinary(uploaded.publicId, 'image').catch(() => {});
    }
    throw error;
  }

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        application.sections.get(sectionType),
        `${sectionType.charAt(0).toUpperCase() + sectionType.slice(1)} uploaded successfully`
      )
    );
});

/**
 * Delete Photo / Signature
 * DELETE /api/v1/applications/:id/sections/photo/image
 * DELETE /api/v1/applications/:id/sections/signature/image
 */
export const deletePhotoOrSignature = asyncHandler(async (req, res) => {
  const { sectionType } = req.params;
  const application = req.application;

  const existingSection = application.sections.get(sectionType);
  if (!existingSection?.cloudinaryId) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      `No ${sectionType} image found to delete`
    );
  }

  // Delete from Cloudinary (non-throwing)
  await deleteFromCloudinary(existingSection.cloudinaryId, 'image');

  const sectionData = existingSection.toObject();
  application.sections.set(sectionType, {
    ...sectionData,
    imageUrl: undefined,
    cloudinaryId: undefined,
    savedAt: new Date(),
    isComplete: false,
  });

  await application.save();

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        null,
        `${sectionType} deleted successfully`
      )
    );
});

/**
 * Upload Final Documents (merged PDF ≤ 3MB)
 * POST /api/v1/applications/:id/sections/final_documents/pdf
 */
export const uploadFinalDocuments = asyncHandler(async (req, res) => {
  const application = req.application;
  const file = req.file;

  let buffer;
  try {
    buffer = await fs.readFile(file.path);
  } finally {
    await fs.unlink(file.path).catch(() => {});
  }

  const fileWithBuffer = { ...file, buffer };

  const pdfErrors = validateFinalPDF(fileWithBuffer);
  if (pdfErrors.length > 0) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Document validation failed',
      pdfErrors
    );
  }

  // Delete existing doc if present (non-throwing)
  const existingSection = application.sections.get('final_documents');
  await deleteFromCloudinary(existingSection?.cloudinaryId, 'raw');

  // Upload to Cloudinary
  const appNo = application.applicationNumber;
  let uploaded;
  try {
    uploaded = await uploadToCloudinary(file.buffer, {
      folder: `nit_kkr_careers/applications/${appNo}/documents`,
      publicId: `${appNo}_documents`,
      resourceType: 'raw',
      format: 'pdf',
    });

    const existingSectionData = existingSection?.toObject() || {};
    application.sections.set('final_documents', {
      ...existingSectionData,
      pdfUrl: uploaded.url,
      cloudinaryId: uploaded.publicId,
      savedAt: new Date(),
      isComplete: true,
    });

    await application.save();
  } catch (error) {
    // Rollback
    if (uploaded?.publicId) {
      await deleteFromCloudinary(uploaded.publicId, 'raw').catch(() => {});
    }
    throw error;
  }

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        application.sections.get('final_documents'),
        'Documents uploaded successfully'
      )
    );
});

/**
 * Get Credit Points (auto-calculated + manual summary)
 * GET /api/v1/applications/:id/sections/credit_points/summary
 */
export const getCreditPointsSummary = asyncHandler(async (req, res) => {
  const application = req.application;

  const autoCredits = calculateAutoCredits(application);
  const creditSection = application.sections.get('credit_points');
  const manualActivities = creditSection?.data?.manualActivities || [];
  const manualTotal = calcManualCredits(manualActivities);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        autoCredits,
        manualTotal,
        grandTotal: autoCredits.autoTotal + manualTotal,
        manualActivities,
      },
      'Credit point summary calculated'
    )
  );
});
