import { ApiError } from '../utils/apiError.js';

/**
 * Validate section data based on custom fields
 * @param {string} sectionType - Type of section
 * @param {Object} data - Section data to validate
 * @param {Object} sectionConfig - Section configuration from job snapshot
 * @param {Array} customFields - Custom fields from job snapshot
 * @returns {Array} Validation errors
 */
export function validateSectionData(sectionType, data, sectionConfig, customFields) {
    const errors = [];

    // For custom section, validate custom fields
    if (sectionType === 'custom' && customFields) {
        customFields.forEach((field) => {
            if (field.isMandatory && !data[field.fieldName]) {
                errors.push({
                    field: field.fieldName,
                    message: `${field.fieldName} is required`
                });
            }

            // Validate field type
            if (data[field.fieldName]) {
                switch (field.fieldType) {
                    case 'number':
                        if (isNaN(data[field.fieldName])) {
                            errors.push({
                                field: field.fieldName,
                                message: 'Must be a number'
                            });
                        }
                        break;
                    case 'date':
                        if (!Date.parse(data[field.fieldName])) {
                            errors.push({
                                field: field.fieldName,
                                message: 'Invalid date'
                            });
                        }
                        break;
                    case 'dropdown':
                        if (!field.options.includes(data[field.fieldName])) {
                            errors.push({
                                field: field.fieldName,
                                message: 'Invalid option'
                            });
                        }
                        break;
                }
            }
        });
    }

    // For standard sections, add basic validation
    // This can be expanded based on specific requirements
    if (sectionType === 'personal') {
        if (!data.fullName) {
            errors.push({ field: 'fullName', message: 'Full name is required' });
        }
        if (!data.email) {
            errors.push({ field: 'email', message: 'Email is required' });
        }
    }

    return errors;
}

/**
 * Validate PDF upload
 * @param {Object} file - Multer file object
 * @param {Object} sectionConfig - Section configuration
 * @returns {Array} Validation errors
 */
export function validatePDFUpload(file, sectionConfig) {
    const errors = [];

    if (!file) {
        return errors;
    }

    // Check file type (MIME)
    if (file.mimetype !== 'application/pdf') {
        errors.push({ field: 'file', message: 'Only PDF files are allowed' });
    }

    // Check file size
    const maxSize = (sectionConfig.maxPDFSize || 5) * 1024 * 1024; // Convert MB to bytes
    if (file.size > maxSize) {
        errors.push({
            field: 'file',
            message: `File size must not exceed ${sectionConfig.maxPDFSize || 5}MB`
        });
    }

    return errors;
}

/**
 * Validate file using magic numbers (file signature)
 * This prevents file spoofing (e.g., renaming .exe to .pdf)
 * @param {Buffer} buffer - File buffer
 * @returns {boolean} True if valid PDF
 */
export function validatePDFMagicNumber(buffer) {
    if (!buffer || buffer.length < 4) {
        return false;
    }

    // PDF magic number: %PDF (25 50 44 46)
    const pdfSignature = Buffer.from([0x25, 0x50, 0x44, 0x46]);

    // Check first 4 bytes
    return buffer.slice(0, 4).equals(pdfSignature);
}

/**
 * Stub for malware scanning
 * In production, integrate with ClamAV or cloud scanner
 * @param {Buffer} buffer - File buffer
 * @returns {Promise<boolean>} True if clean
 */
export async function scanForMalware(buffer) {
    // TODO: Integrate actual malware scanner
    // For now, return true (clean)
    // In production:
    // - Use ClamAV via clamd
    // - Or use cloud service like VirusTotal API

    console.log('[STUB] Malware scan would run here');
    return true;
}
