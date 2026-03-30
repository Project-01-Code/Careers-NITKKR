import { Job } from '../models/job.model.js';
import { ApiError } from '../utils/apiError.js';
import { HTTP_STATUS } from '../constants.js';

/** Sections that exclusively require an image (Photo/Signature) */
const IMAGE_ONLY_SECTIONS = ['photo', 'signature'];

/** Sections that exclusively require a single merged PDF */
const PDF_ONLY_SECTIONS = ['final_documents'];

/**
 * Sections that expect an array of entries (items).
 * These are maps to specific form sections.
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
 * Iterates through all required sections of an application and checks for completeness.
 * This is called during the final validation before submission.
 *
 * @param {Object} application - The Mongoose Application document.
 * @returns {Array<{section: string, field: string, message: string}>} Array of validation errors.
 */
export function validateAllSections(application) {
  const errors = [];

  application.jobSnapshot.requiredSections.forEach((sectionConfig) => {
    // Skip optional sections
    if (!sectionConfig.isMandatory) return;

    const sectionType = sectionConfig.sectionType;
    const section = application.sections.get(sectionType);

    // 1. Image-only validation (Photo/Signature existence check)
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

    // 2. PDF-only validation (Merged documents existence check)
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

    // 3. Declaration & Checklist validation
    if (sectionType === 'declaration') {
      const data = section?.data || {};
      const requiredFlags = [
        'declareInfoTrue',
        'agreeToTerms',
        'photoUploaded',
        'detailsVerified',
      ];
      requiredFlags.forEach((flag) => {
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

    // 4. List-based sections (Education, Experience, etc.)
    // We enforce a minimum number of entries (usually 1) for mandatory sections.
    if (ARRAY_SECTIONS.includes(sectionType)) {
      const items = section?.data?.items;
      const minItems = sectionConfig.minItems ?? 1;
      if (!items || items.length < minItems) {
        errors.push({
          section: sectionType,
          field: 'items',
          message: `At least ${minItems} entry required in ${sectionType}`,
        });
      }
      return;
    }

    // 5. General existence check for standard sections
    if (sectionType !== 'credit_points' && (!section || !section.data || Object.keys(section.data).length === 0)) {
      errors.push({
        section: sectionType,
        field: 'data',
        message: `Section '${sectionType}' is required but not completed`,
      });
      return;
    }

    // 6. Referees special case: Recruitment rules usually mandate exactly 2.
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

    // 7. Section-specific PDF upload check (e.g., Degree certificates)
    if (sectionConfig.requiresPDF && !section.pdfUrl) {
      errors.push({
        section: sectionType,
        field: 'pdf',
        message: 'PDF upload is required for this section',
      });
    }
  });

  // Fail-Safe: Hard-enforce declaration status check even if omitted from requiredSections list
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
 * Checks if a specific job advertisement is still active and open for applications.
 *
 * @param {string} jobId - MongoDB ObjectId of the job.
 * @returns {Promise<boolean>} True if open.
 * @throws {ApiError} If not found, not published, or after deadline.
 */
export async function checkJobDeadline(jobId) {
  const job = await Job.findById(jobId).lean();

  if (!job) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Job not found');
  }

  if (job.status !== 'published') {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Job is not accepting applications'
    );
  }

  // Current system time vs Job end date
  if (new Date() > new Date(job.applicationEndDate)) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Application deadline has passed'
    );
  }

  return true;
}

/**
 * Performs a comprehensive 'Ready to Submit' check for the entire application.
 * Aggregates status checks, payment verification, section completeness, and deadlines.
 *
 * @param {Object} application - The application document to validate.
 * @returns {Promise<{canSubmit: boolean, errors: Array}>} Final validation result.
 */
export async function canSubmitApplication(application) {
  const errors = [];

  // 1. Status Check: Must be in 'draft' to submit.
  if (application.status !== 'draft') {
    errors.push({
      field: 'status',
      message: `Application cannot be submitted. Current status: ${application.status}`,
    });
  }

  // 2. Mutability Check: Cannot submit locked applications.
  if (application.isLocked) {
    errors.push({
      field: 'isLocked',
      message: 'Application is locked and cannot be submitted',
    });
  }

  // 3. Financial Check: Payment must be cleared or exempted.
  if (
    application.paymentStatus !== 'paid' &&
    application.paymentStatus !== 'exempted'
  ) {
    errors.push({
      field: 'payment',
      message: 'Please complete payment before submitting',
    });
  }

  // 4. Data Content Check: Validate completeness of all sections.
  const sectionErrors = validateAllSections(application);
  errors.push(...sectionErrors);

  // 5. Chronological Check: Ensure deadline has not passed since user started draft.
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
