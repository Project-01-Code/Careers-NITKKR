import { SECTION_SCHEMAS } from '../validators/sections.validator.js';

/**
 * Formats Zod flat error map into { field, message } array
 * compatible with the existing API error shape.
 */
function formatZodErrors(zodError) {
  return zodError.issues.map((issue) => ({
    field: issue.path.join('.') || 'data',
    message: issue.message,
  }));
}

/**
 * Main Export — validateSectionData
 */
export function validateSectionData(
  sectionType,
  data,
  sectionConfig,
  customFields
) {
  // 1. Standard sections — dispatch to the Zod schema
  const schema = SECTION_SCHEMAS[sectionType];
  if (schema) {
    const result = schema.safeParse(data);
    if (!result.success) {
      return formatZodErrors(result.error);
    }
    return [];
  }

  // 2. File-only sections (photo, signature, final_documents)
  //    Data validation is not applicable; completeness is checked
  //    in submissionValidation.service via URL presence.
  if (['photo', 'signature', 'final_documents'].includes(sectionType)) {
    return [];
  }

  // 3. Custom section — validate using jobSnapshot customFields
  if (sectionType === 'custom' && customFields) {
    return validateCustomFields(data, customFields);
  }

  return [];
}

/**
 * Custom field validator (legacy support for job-level custom fields)
 */
function validateCustomFields(data, customFields) {
  const errors = [];
  customFields.forEach((field) => {
    if (field.isMandatory && !data[field.fieldName]) {
      errors.push({
        field: field.fieldName,
        message: `${field.fieldName} is required`,
      });
    }
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
 * Helpers
 */

/**
 * validateImageUpload
 */
export function validateImageUpload(file, fieldName) {
  const errors = [];

  if (!file) {
    errors.push({ field: fieldName, message: 'Image file is required' });
    return errors;
  }

  // MIME check (belt-and-suspenders on top of multer filter)
  if (file.mimetype !== 'image/jpeg') {
    errors.push({
      field: fieldName,
      message: 'Only JPEG (JPG) files are allowed',
    });
  }

  // Magic byte check — JPEG always starts with FF D8 FF
  if (file.buffer && file.buffer.length >= 3) {
    const isJpeg =
      file.buffer[0] === 0xff &&
      file.buffer[1] === 0xd8 &&
      file.buffer[2] === 0xff;
    if (!isJpeg) {
      errors.push({
        field: fieldName,
        message: 'File does not appear to be a valid JPEG image',
      });
    }
  }

  // Size check
  const limits = { photo: 200 * 1024, signature: 50 * 1024 };
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
 * validatePDFUpload (for section certificates)
 */
export function validatePDFUpload(file, sectionConfig) {
  const errors = [];
  if (!file) return errors;

  if (file.mimetype !== 'application/pdf') {
    errors.push({ field: 'file', message: 'Only PDF files are allowed' });
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
 * validateFinalPDF (for merged PDF submission)
 */
export function validateFinalPDF(file) {
  const errors = [];
  if (!file) {
    errors.push({ field: 'file', message: 'Document PDF is required' });
    return errors;
  }

  if (file.mimetype !== 'application/pdf') {
    errors.push({ field: 'file', message: 'Only PDF files are allowed' });
  }

  const maxSize = 3 * 1024 * 1024; // 3MB
  if (file.size > maxSize) {
    errors.push({
      field: 'file',
      message:
        'File size must not exceed 3MB. Please compress and merge your documents.',
    });
  }

  return errors;
}

/**
 * validatePDFMagicNumber
 */
export function validatePDFMagicNumber(buffer) {
  if (!buffer || buffer.length < 4) return false;
  const pdfSignature = Buffer.from([0x25, 0x50, 0x44, 0x46]);
  return buffer.slice(0, 4).equals(pdfSignature);
}

/**
 * scanForMalware
 */
export async function scanForMalware() {
  console.log('[STUB] Malware scan would run here');
  return true;
}
