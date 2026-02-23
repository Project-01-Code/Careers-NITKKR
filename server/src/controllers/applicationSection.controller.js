import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { Application } from '../models/application.model.js';
import { validateSectionData, validatePDFUpload, validatePDFMagicNumber, scanForMalware } from '../services/sectionValidation.service.js';
import cloudinary from '../config/cloudinary.config.js';
import { APPLICATION_STATUS } from '../constants.js';

/**
 * Save section data
 * PATCH /api/applications/:id/sections/:sectionType
 * Body: { data }
 */
export const saveSection = asyncHandler(async (req, res) => {
    const { id, sectionType } = req.params;
    const { data } = req.body;

    const application = await Application.findById(id);

    if (!application) {
        throw new ApiError(404, 'Application not found');
    }

    // Check ownership
    if (application.userId.toString() !== req.user._id.toString()) {
        throw new ApiError(403, 'You can only edit your own applications');
    }

    // Check if locked
    if (application.isLocked) {
        throw new ApiError(400, 'Application is locked and cannot be edited');
    }

    // Get section config
    const sectionConfig = application.jobSnapshot.requiredSections.find(
        s => s.sectionType === sectionType
    );

    if (!sectionConfig) {
        throw new ApiError(400, `Section type '${sectionType}' is not required for this job`);
    }

    // Validate section data
    const errors = validateSectionData(
        sectionType,
        data,
        sectionConfig,
        application.jobSnapshot.customFields
    );

    if (errors.length > 0) {
        throw new ApiError(400, 'Validation failed', errors);
    }

    // Get existing section or create new
    const existingSection = application.sections.get(sectionType) || {};

    // Update section
    application.sections.set(sectionType, {
        ...existingSection,
        data,
        savedAt: new Date(),
        isComplete: errors.length === 0
    });

    await application.save();

    res.json(
        new ApiResponse(200, application.sections.get(sectionType), 'Section saved successfully')
    );
});

/**
 * Upload section PDF
 * POST /api/applications/:id/sections/:sectionType/pdf
 * File: pdf (multipart/form-data)
 */
export const uploadSectionPDF = asyncHandler(async (req, res) => {
    const { id, sectionType } = req.params;
    const file = req.file;

    if (!file) {
        throw new ApiError(400, 'PDF file is required');
    }

    const application = await Application.findById(id);

    if (!application) {
        throw new ApiError(404, 'Application not found');
    }

    // Check ownership
    if (application.userId.toString() !== req.user._id.toString()) {
        throw new ApiError(403, 'You can only edit your own applications');
    }

    // Check if locked
    if (application.isLocked) {
        throw new ApiError(400, 'Application is locked and cannot be edited');
    }

    // Get section config
    const sectionConfig = application.jobSnapshot.requiredSections.find(
        s => s.sectionType === sectionType
    );

    if (!sectionConfig) {
        throw new ApiError(400, `Section type '${sectionType}' is not required for this job`);
    }

    // Validate PDF
    const pdfErrors = validatePDFUpload(file, sectionConfig);
    if (pdfErrors.length > 0) {
        throw new ApiError(400, 'PDF validation failed', pdfErrors);
    }

    // Validate magic number (prevent file spoofing)
    if (!validatePDFMagicNumber(file.buffer)) {
        throw new ApiError(400, 'Invalid PDF file. File may be corrupted or spoofed.');
    }

    // Scan for malware (stub)
    const isClean = await scanForMalware(file.buffer);
    if (!isClean) {
        throw new ApiError(400, 'File failed security scan');
    }

    // Delete old PDF if exists
    const existingSection = application.sections.get(sectionType);
    if (existingSection?.cloudinaryId) {
        try {
            await cloudinary.uploader.destroy(existingSection.cloudinaryId, { resource_type: 'raw' });
        } catch (error) {
            console.error('Error deleting old PDF:', error);
        }
    }

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: `applications/${application.applicationNumber}/${sectionType}`,
                resource_type: 'raw',
                format: 'pdf'
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
        savedAt: new Date()
    });

    await application.save();

    res.json(
        new ApiResponse(200, application.sections.get(sectionType), 'PDF uploaded successfully')
    );
});

/**
 * Delete section PDF
 * DELETE /api/applications/:id/sections/:sectionType/pdf
 */
export const deleteSectionPDF = asyncHandler(async (req, res) => {
    const { id, sectionType } = req.params;

    const application = await Application.findById(id);

    if (!application) {
        throw new ApiError(404, 'Application not found');
    }

    // Check ownership
    if (application.userId.toString() !== req.user._id.toString()) {
        throw new ApiError(403, 'You can only edit your own applications');
    }

    // Check if locked
    if (application.isLocked) {
        throw new ApiError(400, 'Application is locked and cannot be edited');
    }

    const existingSection = application.sections.get(sectionType);

    if (!existingSection?.cloudinaryId) {
        throw new ApiError(404, 'No PDF found for this section');
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(existingSection.cloudinaryId, { resource_type: 'raw' });

    // Update section
    application.sections.set(sectionType, {
        ...existingSection,
        pdfUrl: undefined,
        cloudinaryId: undefined,
        savedAt: new Date()
    });

    await application.save();

    res.json(
        new ApiResponse(200, null, 'PDF deleted successfully')
    );
});

/**
 * Validate section
 * POST /api/applications/:id/sections/:sectionType/validate
 */
export const validateSection = asyncHandler(async (req, res) => {
    const { id, sectionType } = req.params;

    const application = await Application.findById(id);

    if (!application) {
        throw new ApiError(404, 'Application not found');
    }

    // Check ownership
    if (application.userId.toString() !== req.user._id.toString()) {
        throw new ApiError(403, 'You can only access your own applications');
    }

    // Get section config
    const sectionConfig = application.jobSnapshot.requiredSections.find(
        s => s.sectionType === sectionType
    );

    if (!sectionConfig) {
        throw new ApiError(400, `Section type '${sectionType}' is not required for this job`);
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
        new ApiResponse(200, {
            isValid,
            errors
        }, isValid ? 'Section is valid' : 'Section has validation errors')
    );
});
