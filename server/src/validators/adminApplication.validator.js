import { z } from 'zod';
import { APPLICATION_STATUS, JOB_SECTION_TYPES } from '../constants.js';

/**
 * Admin Application Validators
 * Zod schemas for admin application management endpoints
 */

/**
 * Reusable ObjectId param validator.
 * Returns a 400 with a clear message instead of a Mongoose CastError 500.
 */
const objectIdParam = (field = 'id') =>
    z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, `Invalid ${field} format (must be a 24-char hex ObjectId)`);

/**
 * Reusable ISO date string coerced to Date.
 * Rejects invalid dates at the boundary.
 */
const isoDate = z.string().datetime({ offset: true, message: 'Must be a valid ISO 8601 date string (e.g. 2026-01-01T00:00:00.000Z)' }).optional();

/**
 * Allowed sortBy fields for application listing.
 * Prevents sorting by arbitrary/dangerous object keys.
 */
const ALLOWED_SORT_FIELDS = [
    'createdAt',
    'submittedAt',
    'applicationNumber',
    'status',
    'paymentStatus',
];

// ─── GET /admin/applications (list all) ────────────────────────────────────

export const listApplicationsSchema = z.object({
    query: z.object({
        jobId: z
            .string()
            .transform((v) => (v === '' ? undefined : v))
            .pipe(objectIdParam('jobId').optional())
            .optional(),
        status: z
            .string()
            .transform((v) => (v === '' ? undefined : v))
            .pipe(
                z.enum(Object.values(APPLICATION_STATUS), {
                    errorMap: () => ({
                        message: `Invalid status. Must be one of: ${Object.values(APPLICATION_STATUS).join(', ')}`,
                    }),
                }).optional()
            )
            .optional(),
        departmentId: z
            .string()
            .transform((v) => (v === '' ? undefined : v))
            .pipe(objectIdParam('departmentId').optional())
            .optional(),
        search: z.string().max(100, 'Search term too long').optional(),
        dateFrom: isoDate,
        dateTo: isoDate,
        sortBy: z
            .enum(ALLOWED_SORT_FIELDS, {
                errorMap: () => ({ message: `sortBy must be one of: ${ALLOWED_SORT_FIELDS.join(', ')}` }),
            })
            .optional()
            .default('submittedAt'),
        sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
        page: z
            .string()
            .regex(/^\d+$/, 'page must be a positive integer')
            .transform(Number)
            .refine((v) => v >= 1, 'page must be at least 1')
            .optional()
            .default('1'),
        limit: z
            .string()
            .regex(/^\d+$/, 'limit must be a positive integer')
            .transform(Number)
            .refine((v) => v >= 1 && v <= 100, 'limit must be between 1 and 100')
            .optional()
            .default('10'),
    }).optional(),
});

// ─── GET /admin/applications/export ────────────────────────────────────────

export const exportApplicationsSchema = z.object({
    query: z.object({
        jobId: z
            .string()
            .transform((v) => (v === '' ? undefined : v))
            .pipe(objectIdParam('jobId').optional())
            .optional(),
        status: z
            .string()
            .transform((v) => (v === '' ? undefined : v))
            .pipe(
                z.enum(Object.values(APPLICATION_STATUS), {
                    errorMap: () => ({
                        message: `Invalid status. Must be one of: ${Object.values(APPLICATION_STATUS).join(', ')}`,
                    }),
                }).optional()
            )
            .optional(),
        dateFrom: isoDate,
        dateTo: isoDate,
    }).optional(),
});

// ─── PATCH /admin/applications/:id/status ──────────────────────────────────

export const updateApplicationStatusSchema = z.object({
    body: z.object({
        status: z.enum(Object.values(APPLICATION_STATUS), {
            errorMap: () => ({
                message: `Invalid status. Must be one of: ${Object.values(APPLICATION_STATUS).join(', ')}`,
            }),
        }),
        remarks: z.string().max(500, 'Remarks must be under 500 characters').optional(),
    }),
    params: z.object({
        id: objectIdParam(),
    }),
});

// ─── PATCH /admin/applications/:id/review ──────────────────────────────────

export const addReviewNotesSchema = z.object({
    body: z.object({
        reviewNotes: z
            .string()
            .min(1, 'Review notes are required')
            .max(2000, 'Review notes must be under 2000 characters'),
    }),
    params: z.object({
        id: objectIdParam(),
    }),
});

// ─── PATCH /admin/applications/bulk-assign ──────────────────────────────────

const objectIdArray = (minLen = 1) =>
    z.array(objectIdParam()).min(minLen, 'At least one ID required').max(50, 'Maximum 50 IDs');

export const bulkAssignSchema = z.object({
    body: z.object({
        applicationIds: objectIdArray(),
        reviewerIds: objectIdArray(),
    }),
});

// ─── POST /admin/applications/bulk-status ──────────────────────────────────

export const bulkUpdateStatusSchema = z.object({
    body: z.object({
        applicationIds: z
            .array(objectIdParam())
            .min(1, 'At least one application ID is required')
            .max(100, 'Cannot update more than 100 applications at once'),
        status: z.enum(Object.values(APPLICATION_STATUS), {
            errorMap: () => ({
                message: `Invalid status. Must be one of: ${Object.values(APPLICATION_STATUS).join(', ')}`,
            }),
        }),
        remarks: z.string().max(500, 'Remarks must be under 500 characters').optional(),
    }),
});

// ─── PATCH /admin/applications/:id/verify-section ──────────────────────────

export const verifySectionSchema = z.object({
    body: z.object({
        sectionType: z.enum(JOB_SECTION_TYPES, {
            errorMap: () => ({
                message: `Invalid section type. Must be one of: ${JOB_SECTION_TYPES.join(', ')}`,
            }),
        }),
        isVerified: z.boolean(),
        notes: z.string().max(1000, 'Notes must be under 1000 characters').optional(),
    }),
    params: z.object({
        id: objectIdParam(),
    }),
});

// ─── POST /admin/applications/:id/exempt-fee ───────────────────────────────

export const exemptFeeSchema = z.object({
    body: z.object({
        reason: z
            .string({ required_error: 'Reason for exemption is required' })
            .min(5, 'Reason must be at least 5 characters')
            .max(500, 'Reason must be under 500 characters')
            .trim(),
    }),
    params: z.object({
        id: objectIdParam(),
    }),
});

// ─── Generic single-ID param schema (for GET /:id, GET /:id/export-full) ───

export const applicationIdParamSchema = z.object({
    params: z.object({
        id: objectIdParam(),
    }),
});

// ─── GET /admin/applications/job/:jobId ────────────────────────────────────

export const applicationsByJobSchema = z.object({
    params: z.object({
        jobId: objectIdParam('jobId'),
    }),
    query: z.object({
        status: z
            .string()
            .transform((v) => (v === '' ? undefined : v))
            .pipe(
                z.enum(Object.values(APPLICATION_STATUS), {
                    errorMap: () => ({
                        message: `Invalid status. Must be one of: ${Object.values(APPLICATION_STATUS).join(', ')}`,
                    }),
                }).optional()
            )
            .optional(),
        page: z
            .string()
            .regex(/^\d+$/, 'page must be a positive integer')
            .transform(Number)
            .refine((v) => v >= 1, 'page must be at least 1')
            .optional()
            .default('1'),
        limit: z
            .string()
            .regex(/^\d+$/, 'limit must be a positive integer')
            .transform(Number)
            .refine((v) => v >= 1 && v <= 100, 'limit must be between 1 and 100')
            .optional()
            .default('10'),
    }).optional(),
});
