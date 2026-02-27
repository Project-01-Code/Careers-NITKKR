import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import {
  validateSectionData,
  validatePDFUpload,
  validatePDFMagicNumber,
  validateFinalPDF,
  validateImageUpload,
  scanForMalware,
} from '../services/sectionValidation.service.js';
import {
  calculateAutoCredits,
  calcManualCredits,
} from '../services/creditPoints.service.js';
import cloudinary from '../config/cloudinary.config.js';
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
    sectionConfig,
    application.jobSnapshot.customFields
  );

  if (errors.length > 0) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Validation failed', errors);
  }

  // Get existing section or create new
  const existingSection = application.sections.get(sectionType) || {};

  // Update section
  application.sections.set(sectionType, {
    ...existingSection,
    data,
    savedAt: new Date(),
    isComplete: errors.length === 0,
  });

  await application.save();

  res.json(
    new ApiResponse(
      200,
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

  // Validate PDF
  const pdfErrors = validatePDFUpload(file, sectionConfig);
  if (pdfErrors.length > 0) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'PDF validation failed',
      pdfErrors
    );
  }

  // Validate magic number (prevent file spoofing)
  if (!validatePDFMagicNumber(file.buffer)) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Invalid PDF file. File may be corrupted or spoofed.'
    );
  }

  // Scan for malware (stub)
  const isClean = await scanForMalware(file.buffer);
  if (!isClean) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'File failed security scan');
  }

  // Delete old PDF if exists
  const existingSection = application.sections.get(sectionType);
  if (existingSection?.cloudinaryId) {
    try {
      await cloudinary.uploader.destroy(existingSection.cloudinaryId, {
        resource_type: 'raw',
      });
    } catch (error) {
      console.error('Error deleting old PDF:', error);
    }
  }

  // Upload to Cloudinary
  const uploadResult = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `nit_kkr_careers/applications/${application.applicationNumber}/${sectionType}`,
        resource_type: 'raw',
        format: 'pdf',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(file.buffer);
  });

  // Update section
  application.sections.set(sectionType, {
    ...(existingSection || {}),
    pdfUrl: uploadResult.secure_url,
    cloudinaryId: uploadResult.public_id,
    savedAt: new Date(),
  });

  await application.save();

  res.json(
    new ApiResponse(
      200,
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

  // Delete from Cloudinary
  await cloudinary.uploader.destroy(existingSection.cloudinaryId, {
    resource_type: 'raw',
  });

  // Update section
  application.sections.set(sectionType, {
    ...existingSection,
    pdfUrl: undefined,
    cloudinaryId: undefined,
    savedAt: new Date(),
  });

  await application.save();

  res.json(new ApiResponse(200, null, 'PDF deleted successfully'));
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
      sectionConfig,
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

  res.json(
    new ApiResponse(
      200,
      {
        isValid,
        errors,
      },
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

  // Validated by imageUpload middleware (size + JPEG filter)
  const imageErrors = validateImageUpload(file, sectionType);
  if (imageErrors.length > 0) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Image validation failed',
      imageErrors
    );
  }

  // Delete previous image from Cloudinary if it exists
  const existingSection = application.sections.get(sectionType);
  if (existingSection?.cloudinaryId) {
    try {
      await cloudinary.uploader.destroy(existingSection.cloudinaryId, {
        resource_type: 'image',
      });
    } catch (err) {
      console.error(
        `[Cloudinary] Failed to delete old ${sectionType}:`,
        err.message
      );
    }
  }

  // Stream upload to Cloudinary as image
  const uploadResult = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `nit_kkr_careers/applications/${application.applicationNumber}/${sectionType}`,
        resource_type: 'image',
        format: 'jpg',
        public_id: `${application.applicationNumber}_${sectionType}`,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(file.buffer);
  });

  application.sections.set(sectionType, {
    ...(existingSection || {}),
    imageUrl: uploadResult.secure_url,
    cloudinaryId: uploadResult.public_id,
    savedAt: new Date(),
    isComplete: true,
  });

  await application.save();

  res.json(
    new ApiResponse(
      200,
      {
        sectionType,
        imageUrl: uploadResult.secure_url,
      },
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

  await cloudinary.uploader.destroy(existingSection.cloudinaryId, {
    resource_type: 'image',
  });

  application.sections.set(sectionType, {
    imageUrl: undefined,
    cloudinaryId: undefined,
    savedAt: new Date(),
    isComplete: false,
  });

  await application.save();

  res.json(new ApiResponse(200, null, `${sectionType} deleted successfully`));
});

/**
 * Upload Final Documents (merged PDF ≤ 3MB)
 * POST /api/v1/applications/:id/sections/final_documents/pdf
 */
export const uploadFinalDocuments = asyncHandler(async (req, res) => {
  const application = req.application;
  const file = req.file;

  const pdfErrors = validateFinalPDF(file);
  if (pdfErrors.length > 0) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Document validation failed',
      pdfErrors
    );
  }

  if (!validatePDFMagicNumber(file.buffer)) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Invalid PDF file. File may be corrupted or spoofed.'
    );
  }

  // Delete existing doc if present
  const existingSection = application.sections.get('final_documents');
  if (existingSection?.cloudinaryId) {
    try {
      await cloudinary.uploader.destroy(existingSection.cloudinaryId, {
        resource_type: 'raw',
      });
    } catch (err) {
      console.error(
        '[Cloudinary] Failed to delete old final documents:',
        err.message
      );
    }
  }

  // Upload to Cloudinary
  const uploadResult = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `nit_kkr_careers/applications/${application.applicationNumber}/documents`,
        resource_type: 'raw',
        format: 'pdf',
        public_id: `${application.applicationNumber}_documents.pdf`,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(file.buffer);
  });

  application.sections.set('final_documents', {
    ...(existingSection || {}),
    pdfUrl: uploadResult.secure_url,
    cloudinaryId: uploadResult.public_id,
    savedAt: new Date(),
    isComplete: true,
  });

  await application.save();

  res.json(
    new ApiResponse(
      200,
      { pdfUrl: uploadResult.secure_url },
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

  res.json(
    new ApiResponse(
      200,
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
