import { z } from 'zod';
import { APPLICATION_STATUS, JOB_SECTION_TYPES } from '../constants.js';

/**
 * Admin Application Validators
 * Zod schemas for admin application management endpoints
 */

/**
 * Update Application Status Schema
 */
export const updateApplicationStatusSchema = z.object({
    body: z.object({
        status: z.enum(Object.values(APPLICATION_STATUS), {
            errorMap: () => ({
                message: `Invalid status. Must be one of: ${Object.values(APPLICATION_STATUS).join(', ')}`,
            }),
        }),
        remarks: z.string().max(500).optional(),
    }),
    params: z.object({
        id: z.string().min(1, 'Application ID is required'),
    }),
});

/**
 * Add Review Notes Schema
 */
export const addReviewNotesSchema = z.object({
    body: z.object({
        reviewNotes: z
            .string()
            .min(1, 'Review notes are required')
            .max(2000, 'Review notes must be under 2000 characters'),
    }),
    params: z.object({
        id: z.string().min(1, 'Application ID is required'),
    }),
});

/**
 * Bulk Update Status Schema
 */
export const bulkUpdateStatusSchema = z.object({
    body: z.object({
        applicationIds: z
            .array(z.string().min(1))
            .min(1, 'At least one application ID is required')
            .max(100, 'Cannot update more than 100 applications at once'),
        status: z.enum(Object.values(APPLICATION_STATUS), {
            errorMap: () => ({
                message: `Invalid status. Must be one of: ${Object.values(APPLICATION_STATUS).join(', ')}`,
            }),
        }),
        remarks: z.string().max(500).optional(),
    }),
});

/**
 * Verify Section Schema
 */
export const verifySectionSchema = z.object({
    body: z.object({
        sectionType: z.enum(JOB_SECTION_TYPES, {
            errorMap: () => ({
                message: `Invalid section type. Must be one of: ${JOB_SECTION_TYPES.join(', ')}`,
            }),
        }),
        isVerified: z.boolean(),
        notes: z.string().max(1000).optional(),
    }),
    params: z.object({
        id: z.string().min(1, 'Application ID is required'),
    }),
});
