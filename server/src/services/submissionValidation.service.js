import { Job } from '../models/job.model.js';
import { ApiError } from '../utils/apiError.js';
import { HTTP_STATUS } from '../constants.js';

/**
 * Section types that require an imageUrl (uploaded via imageUpload middleware)
 */
const IMAGE_ONLY_SECTIONS = ['photo', 'signature'];

/**
 * Section types that require a pdfUrl (uploaded via file upload)
 */
const PDF_ONLY_SECTIONS = ['final_documents'];

/**
 * Array-based sections
 * (unless minItems override in jobSnapshot.requiredSections config)
 */
const ARRAY_SECTIONS = [
  'education',
  'experience',
  'publications_journal',
  'publications_conference',
  'phd_supervision',
  'patents',
  'publications_books',
  'organized_programs',
  'sponsored_projects',
  'consultancy_projects',
  'subjects_taught',
];

/**
 * Validate all sections of an application before submission.
 *
 * @param {Object} application - Application document
 * @returns {Array<{section, field, message}>} Validation errors
 */
export function validateAllSections(application) {
  const errors = [];

  application.jobSnapshot.requiredSections.forEach((sectionConfig) => {
    if (!sectionConfig.isMandatory) return;

    const sectionType = sectionConfig.sectionType;
    const section = application.sections.get(sectionType);

    // Image-only sections
    if (IMAGE_ONLY_SECTIONS.includes(sectionType)) {
      if (!section?.imageUrl) {
        errors.push({
          section: sectionType,
          field: 'imageUrl',
          message: `${sectionType} image upload is required`,
        });
      }
      return;
    }

    // PDF-only sections
    if (PDF_ONLY_SECTIONS.includes(sectionType)) {
      if (!section?.pdfUrl) {
        errors.push({
          section: sectionType,
          field: 'pdfUrl',
          message: 'Merged document PDF upload is required',
        });
      }
      return;
    }

    // Declaration section
    if (sectionType === 'declaration') {
      const data = section?.data || {};
      const required = [
        'declareInfoTrue',
        'agreeToTerms',
        'photoUploaded',
        'detailsVerified',
      ];
      required.forEach((flag) => {
        if (data[flag] !== true) {
          errors.push({
            section: 'declaration',
            field: flag,
            message: `Declaration field '${flag}' must be confirmed before submission`,
          });
        }
      });
      return;
    }

    // Array-based sections
    if (ARRAY_SECTIONS.includes(sectionType)) {
      const items = section?.data?.items;
      const minItems = sectionConfig.minItems ?? 1; // default min 1 for mandatory array sections
      if (!items || items.length < minItems) {
        errors.push({
          section: sectionType,
          field: 'items',
          message: `At least ${minItems} entry required in ${sectionType}`,
        });
      }
      return;
    }

    // Generic section data check
    if (!section || !section.data || Object.keys(section.data).length === 0) {
      errors.push({
        section: sectionType,
        field: 'data',
        message: `Section '${sectionType}' is required but not completed`,
      });
      return;
    }

    // Referees: exactly 2 required
    if (sectionType === 'referees') {
      const items = section.data?.items;
      if (!items || items.length !== 2) {
        errors.push({
          section: 'referees',
          field: 'items',
          message: 'Exactly 2 referees are required',
        });
      }
      return;
    }

    // Existing PDF check from sectionConfig
    if (sectionConfig.requiresPDF && !section.pdfUrl) {
      errors.push({
        section: sectionType,
        field: 'pdf',
        message: 'PDF upload is required for this section',
      });
    }
  });

  // Hard-enforce declaration (even if not in requiredSections list)
  const declarationSection = application.sections.get('declaration');
  const hasDeclarationError = errors.some((e) => e.section === 'declaration');
  if (
    !hasDeclarationError &&
    declarationSection?.data?.detailsVerified !== true
  ) {
    errors.push({
      section: 'declaration',
      field: 'detailsVerified',
      message:
        'You must complete the declaration and checklist before submitting',
    });
  }

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
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Job not found');
  }

  if (job.status !== 'published') {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Job is not accepting applications'
    );
  }

  if (new Date() > new Date(job.applicationEndDate)) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Application deadline has passed'
    );
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
      message: `Application cannot be submitted. Current status: ${application.status}`,
    });
  }

  // Check if locked
  if (application.isLocked) {
    errors.push({
      field: 'isLocked',
      message: 'Application is locked and cannot be submitted',
    });
  }

  // Check payment status
  if (
    application.paymentStatus !== 'paid' &&
    application.paymentStatus !== 'exempted'
  ) {
    errors.push({
      field: 'payment',
      message: 'Please complete payment before submitting',
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
      message: error.message,
    });
  }

  return {
    canSubmit: errors.length === 0,
    errors,
  };
}
