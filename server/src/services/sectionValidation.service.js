import { SECTION_SCHEMAS } from '../validators/sections.validator.js';

/**
 * Credit point caps per activity as per NIT recruitment rules.
 * Activities 5-22 have specific maximum allowed points.
 */
const CREDIT_POINT_CAPS = {
  5: 15, // Refereed Journal papers
  6: 10, // Conference papers
  7: 10, // PH.D. Guidance
  8: 10, // Patents
  9: 10, // Books
  10: 10, // Book Chapters
  11: 10, // Organized Programs
  12: 10, // Sponsored Projects
  13: 10, // Consultancy Projects
  14: 10, // Theory courses
  15: 10, // Lab courses
  16: 10, // New Lab development
  17: 10, // PG Thesis guidance
  18: 10, // UG Projects
  19: 10, // Outreach activities
  20: 10, // Administrative assignments
  21: 10, // Departmental activities
  22: 10, // Workshop/FDP/STTP
};

/**
 * Formats Zod flat error map into an array of { field, message } objects.
 * This ensures compatibility with the standardized API error structure.
 *
 * @param {import('zod').ZodError} zodError - The error object from a Zod validation failure.
 * @returns {Array<{field: string, message: string}>} Array of formatted error objects.
 */
function formatZodErrors(zodError) {
  return zodError.issues.map((issue) => ({
    field: issue.path.join('.') || 'data',
    message: issue.message,
  }));
}

/**
 * Validates the data for a specific application section.
 * This is the primary gatekeeper for section-level data integrity.
 *
 * @param {string} sectionType - The identifier for the section (e.g., 'personal', 'education').
 * @param {Object} data - The actual data stored within the section.
 * @param {Array} customFields - Optional custom field definitions for the 'custom' section.
 * @returns {Array<{field: string, message: string}>} Array of validation errors, empty if valid.
 */
export function validateSectionData(sectionType, data, customFields) {
  // 1. Standard sections: Logic is delegated to Zod schemas defined in sections.validator.js
  const schema = SECTION_SCHEMAS[sectionType];
  if (schema) {
    const result = schema.safeParse(data);
    if (!result.success) {
      return formatZodErrors(result.error);
    }

    // Additional business logic for credit points (caps enforcement)
    if (sectionType === 'credit_points' && data.manualActivities) {
      const capsErrors = [];
      data.manualActivities.forEach((activity, index) => {
        const cap = CREDIT_POINT_CAPS[activity.activityId];
        if (cap !== undefined && activity.claimedPoints > cap) {
          capsErrors.push({
            field: `manualActivities.${index}.claimedPoints`,
            message: `Claimed points for Activity ${activity.activityId} cannot exceed the cap of ${cap}`,
          });
        }
      });
      if (capsErrors.length > 0) return capsErrors;
    }

    return [];
  }

  // 2. File-only sections: These do not contain structured form data.
  // Completeness (presence of URL) is checked during the overall submission validation.
  if (['photo', 'signature', 'final_documents'].includes(sectionType)) {
    return [];
  }

  // 3. Custom section: Uses a dynamic validator based on job-specific custom field configurations.
  if (sectionType === 'custom' && customFields) {
    return validateCustomFields(data, customFields);
  }

  return [];
}

/**
 * Validates dynamically defined custom fields for a job.
 *
 * @param {Object} data - The user-provided data for custom fields.
 * @param {Array} customFields - Array of field definitions (isMandatory, fieldType, options, etc.).
 * @returns {Array<{field: string, message: string}>} Array of validation errors.
 */
function validateCustomFields(data, customFields) {
  const errors = [];
  customFields.forEach((field) => {
    // Mandatory check
    if (field.isMandatory && !data[field.fieldName]) {
      errors.push({
        field: field.fieldName,
        message: `${field.fieldName} is required`,
      });
    }

    // Type-specific logic for provided data
    if (data[field.fieldName]) {
      switch (field.fieldType) {
        case 'number':
          if (isNaN(data[field.fieldName])) {
            errors.push({
              field: field.fieldName,
              message: 'Must be a number',
            });
          }
          break;
        case 'date':
          if (!Date.parse(data[field.fieldName])) {
            errors.push({ field: field.fieldName, message: 'Invalid date' });
          }
          break;
        case 'dropdown':
          if (!field.options.includes(data[field.fieldName])) {
            errors.push({ field: field.fieldName, message: 'Invalid option' });
          }
          break;
      }
    }
  });
  return errors;
}

/**
 * Validates image uploads for Persona Photo and Signature.
 * Performs checks on MIME types, magic numbers (file spoofing), and file size.
 *
 * @param {Object} file - The file object from Multer.
 * @param {string} fieldName - Either 'photo' or 'signature'.
 * @returns {Array<{field: string, message: string}>} Validation errors.
 */
export function validateImageUpload(file, fieldName) {
  const errors = [];

  if (!file) {
    errors.push({ field: fieldName, message: 'Image file is required' });
    return errors;
  }

  // Ensure file is a JPEG or PNG (Project Standard)
  if (file.mimetype !== 'image/jpeg' && file.mimetype !== 'image/png') {
    errors.push({
      field: fieldName,
      message: 'Only JPEG (JPG) and PNG files are allowed',
    });
  }

  // Magic byte check: Verify file headers to prevent simple extension-renaming spoofing
  if (file.buffer && file.buffer.length >= 4) {
    const isJpeg =
      file.buffer[0] === 0xff &&
      file.buffer[1] === 0xd8 &&
      file.buffer[2] === 0xff;

    const isPng =
      file.buffer[0] === 0x89 &&
      file.buffer[1] === 0x50 &&
      file.buffer[2] === 0x4e &&
      file.buffer[3] === 0x47;

    if (!isJpeg && !isPng) {
      errors.push({
        field: fieldName,
        message: 'File does not appear to be a valid JPEG or PNG image (invalid magic bytes)',
      });
    }
  }

  // Enforce specific size limits for Photo (200KB) and Signature (200KB)
  const limits = { photo: 200 * 1024, signature: 200 * 1024 };
  const maxSize = limits[fieldName] || 200 * 1024;
  if (file.size > maxSize) {
    const maxKB = Math.round(maxSize / 1024);
    errors.push({
      field: fieldName,
      message: `File size must not exceed ${maxKB}KB`,
    });
  }

  return errors;
}

/**
 * Validates PDF uploads for individual section certificates.
 * Checks MIME type, magic bytes, and file size.
 *
 * @param {Object} file - The file object (includes buffer, mimetype, size).
 * @param {Object} sectionConfig - Configuration snapshot containing maxPDFSize limit.
 * @returns {Array<{field: string, message: string}>} Validation errors.
 */
export function validatePDFUpload(file, sectionConfig) {
  const errors = [];
  if (!file) return errors;

  // MIME type check (first line of defense)
  if (file.mimetype !== 'application/pdf') {
    errors.push({ field: 'file', message: 'Only PDF files are allowed' });
  }

  // Magic byte check: Verify file truly starts with %PDF (0x25 0x50 0x44 0x46)
  // Prevents spoofed uploads where a non-PDF file is renamed to .pdf
  if (file.buffer && file.buffer.length >= 4) {
    const pdfSignature = Buffer.from([0x25, 0x50, 0x44, 0x46]);
    if (!file.buffer.subarray(0, 4).equals(pdfSignature)) {
      errors.push({
        field: 'file',
        message: 'File does not appear to be a valid PDF',
      });
    }
  }

  const maxSize = (sectionConfig?.maxPDFSize || 5) * 1024 * 1024;
  if (file.size > maxSize) {
    errors.push({
      field: 'file',
      message: `File size must not exceed ${sectionConfig?.maxPDFSize || 5}MB`,
    });
  }

  return errors;
}

/**
 * Validates the final merged document PDF before submission.
 * Checks MIME type, magic bytes, and enforces the 10MB size cap.
 *
 * @param {Object} file - The file object (includes buffer, mimetype, size).
 * @returns {Array<{field: string, message: string}>} Validation errors.
 */
export function validateFinalPDF(file) {
  const errors = [];
  if (!file) {
    errors.push({ field: 'file', message: 'Document PDF is required' });
    return errors;
  }

  // MIME type check (first line of defense)
  if (file.mimetype !== 'application/pdf') {
    errors.push({ field: 'file', message: 'Only PDF files are allowed' });
  }

  // Magic byte check: Verify file truly starts with %PDF (0x25 0x50 0x44 0x46)
  // Prevents spoofed uploads where a non-PDF file is renamed to .pdf
  if (file.buffer && file.buffer.length >= 4) {
    const pdfSignature = Buffer.from([0x25, 0x50, 0x44, 0x46]);
    if (!file.buffer.subarray(0, 4).equals(pdfSignature)) {
      errors.push({
        field: 'file',
        message: 'File does not appear to be a valid PDF',
      });
    }
  }

  const maxSize = 10 * 1024 * 1024; // Standardized 10MB limit for merged documents
  if (file.size > maxSize) {
    errors.push({
      field: 'file',
      message:
        'File size must not exceed 10MB. Please compress and merge your documents.',
    });
  }

  return errors;
}