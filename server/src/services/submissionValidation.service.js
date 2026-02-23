import { Job } from '../models/job.model.js';
import { ApiError } from '../utils/apiError.js';
import { validateSectionCompleteness } from './application.service.js';

/**
 * Validate all sections of an application
 * Checks all mandatory sections have data and required PDFs
 * 
 * @param {Object} application - Application document
 * @param {Object} application.jobSnapshot - Snapshotted job configuration
 * @param {Array<Object>} application.jobSnapshot.requiredSections - Section configurations
 * @param {Map} application.sections - Map of section type to section data
 * @returns {Array<{section: string, field: string, message: string}>} Validation errors
 * 
 * @example
 * const errors = validateAllSections(application);
 * console.log(`Found ${errors.length} validation errors`);
 */
export function validateAllSections(application) {
    const errors = [];

    application.jobSnapshot.requiredSections.forEach((sectionConfig) => {
        if (sectionConfig.isMandatory) {
            const section = application.sections.get(sectionConfig.sectionType);

            // Check data exists
            if (!section || !section.data) {
                errors.push({
                    section: sectionConfig.sectionType,
                    field: 'data',
                    message: 'Section is required but not completed'
                });
                return;
            }

            // Check PDF exists (if required)
            if (sectionConfig.requiresPDF && !section.pdfUrl) {
                errors.push({
                    section: sectionConfig.sectionType,
                    field: 'pdf',
                    message: 'PDF upload is required for this section'
                });
            }

            // Use existing validation for completeness
            const sectionErrors = validateSectionCompleteness(section, sectionConfig);
            if (sectionErrors.length > 0) {
                sectionErrors.forEach(err => {
                    errors.push({
                        section: sectionConfig.sectionType,
                        ...err
                    });
                });
            }
        }
    });

    return errors;
}

/**
 * Check if job is still accepting applications
 * Verifies job exists, is published, and deadline hasn't passed
 * 
 * @param {string} jobId - MongoDB ObjectId of the job
 * @returns {Promise<boolean>} True if job is accepting applications
 * @throws {ApiError} 404 if job not found
 * @throws {ApiError} 400 if job is not published
 * @throws {ApiError} 400 if application deadline has passed
 * 
 * @example
 * await checkJobDeadline(jobId); // Throws if deadline passed
 */
export async function checkJobDeadline(jobId) {
    const job = await Job.findById(jobId);

    if (!job) {
        throw new ApiError(404, 'Job not found');
    }

    if (job.status !== 'published') {
        throw new ApiError(400, 'Job is not accepting applications');
    }

    if (new Date() > new Date(job.applicationEndDate)) {
        throw new ApiError(400, 'Application deadline has passed');
    }

    return true;
}

/**
 * Check if application can be submitted
 * Performs comprehensive validation before allowing submission
 * 
 * @param {Object} application - Application document to validate
 * @returns {Promise<{canSubmit: boolean, errors: Array}>} Validation result
 * @returns {boolean} return.canSubmit - Whether application can be submitted
 * @returns {Array<Object>} return.errors - Array of validation errors
 * 
 * @example
 * const result = await canSubmitApplication(application);
 * if (result.canSubmit) {
 *   // Proceed with submission
 * } else {
 *   console.log('Validation errors:', result.errors);
 * }
 */
export async function canSubmitApplication(application) {
    const errors = [];

    // Check application status
    if (application.status !== 'draft') {
        errors.push({
            field: 'status',
            message: `Application cannot be submitted. Current status: ${application.status}`
        });
    }

    // Check if locked
    if (application.isLocked) {
        errors.push({
            field: 'isLocked',
            message: 'Application is locked and cannot be submitted'
        });
    }

    // Validate all sections
    const sectionErrors = validateAllSections(application);
    errors.push(...sectionErrors);

    // Check job deadline
    try {
        await checkJobDeadline(application.jobId);
    } catch (error) {
        errors.push({
            field: 'deadline',
            message: error.message
        });
    }

    return {
        canSubmit: errors.length === 0,
        errors
    };
}
